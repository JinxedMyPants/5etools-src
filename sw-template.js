/* eslint-disable no-console */

import { CacheExpiration, ExpirationPlugin } from "workbox-expiration";
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst, Strategy, StrategyHandler } from "workbox-strategies";

import { createCacheKey } from "workbox-precaching/utils/createCacheKey";

/*
Dieser Kommentar versucht, die von diesem Service Worker verwendete Caching-Strategie zu erklären

Auf hoher Ebene zielt sie darauf ab, einen guten Kompromiss zwischen Geschwindigkeit und Aktualität ohne überraschendes Verhalten zu ermöglichen

Das Runtime-Manifest liefert Hashes für die enthaltenen Dateien, wodurch veraltete Dateien nicht mehr ausgeliefert werden können.

Beim Laden wird der SW:
	alle Dateien im Precache entfernen, die nicht mehr im Manifest stehen
	fehlende Dateien im Precache aus dem Netzwerk laden
	alle Dateien im Runtime-Cache entfernen, deren Revision nicht mit dem Manifest übereinstimmt
	Bilder im external-images-Cache löschen, die seit 7 Tagen nicht mehr genutzt wurden

Routen werden in absteigender Reihenfolge aufgelöst.
Bei jeder Dateianfrage:
	Ist sie im Precache-Manifest (essentielle Dateien: Skripte, HTML, CSS, einige Fonts, die meisten Daten)?
		aus dem Cache liefern

	Ist sie im Runtime-Manifest (optionale Dateien: Bilder und Abenteuer-Daten)?
		Ist sie im Cache?
			ja: aus dem Cache liefern
			nein: aus dem Netzwerk holen und cachen

	Ist es eine Schriftart?
		Ist sie im Font-Cache?
			ja: aus dem Font-Cache liefern
			nein: aus dem Netzwerk holen und cachen

	Ist es ein Bild (externe Bilder)?
		Aus dem Netzwerk holen und cachen
		Falls der Fetch fehlschlägt, aus dem Cache liefern

	Standard ist: aus dem Netzwerk laden.
	Eine Dateianfrage, die von keiner der obigen Richtlinien erfasst wird, ist offline nicht verfügbar.
*/

// From https://github.com/GoogleChrome/workbox/blob/0cc6975f17b60d67a71d8b717e73ef7ddb79a891/packages/workbox-core/src/_private/waitUntil.ts#L19-L26
/**
 * bis ein Event abgeschlossen ist warten
 * @param {ExtendableEvent} event Event, bis zu dem gewartet wird
 * @param {() => Promise<any>} asyncFn die Funktion, die an waitUntil übergeben wird
 * @returns {Promise<any>}
 */
function waitUntil(
	event,
	asyncFn,
) {
	const returnPromise = asyncFn();
	event.waitUntil(returnPromise);
	return returnPromise;
}

const offlineAlert = async (url) => {
	console.log(`Netzwerkfehler. Offline, kann URL "${url}" nicht erreichen`);
	const clients = await self.clients.matchAll({ type: "window" });
	let payload = "generic";
	if (/\.(?:png|gif|webm|jpg|webp|jpeg|svg)$/m.test(url)) payload = "image";
	else if (/\.json$/m.test(url)) payload = "json";

	for (const client of clients) {
		client.postMessage({ type: "FETCH_ERROR", payload });
	}
};

/**
 * Reset: löscht alle Caches und deregistriert den Service Worker.
 *
 * @return {Promise<void>}
 */
const resetAll = async () => {
	// Alle Caches löschen, diese überdauern Service Worker-Versionen
	const cacheNames = await caches.keys();
	for (const cacheName of cacheNames) {
		await caches.delete(cacheName);

		// Siehe: https://github.com/GoogleChrome/workbox/issues/2234
		const cacheExpiration = new CacheExpiration(cacheName, { maxEntries: 1 });
		await cacheExpiration.delete();

		console.log(`gelöschter Cache "${cacheName}"`);
	}

	await self.registration.unregister();

	const clients = await self.clients.matchAll();
	clients.forEach(client => client.navigate(client.url));
};

addEventListener("message", (event) => {
	switch (event.data.type) {
		case "RESET": {
			console.log("Zurücksetzen...");
			event.waitUntil(resetAll());
			break;
		}
	}
});

/*
Routen haben Vorrang in der angegebenen Reihenfolge. Wenn eine höhere und eine niedrigere Route beide passen, löst die höhere Route auf.
https://stackoverflow.com/questions/52423473
*/

// Der Wert von self wird durch key:value Paare von Datei:hash ersetzt, damit workbox Dateien zwischen Caches übernehmen kann, wenn sie übereinstimmen
precacheAndRoute(self.__WB_PRECACHE_MANIFEST);

class RevisionCacheFirst extends Strategy {
	// explizit `credentials` Option setzen als Workaround, um Basic Auth in Third-Party-Installationen zu erlauben
	// Siehe: 5ET-BUG-115
	static _FETCH_OPTIONS_VET = { credentials: "same-origin" };

	cacheRoutesAbortController = null;
	constructor() {
		super({ cacheName: "runtime-revision" });

		// bind für activate Methode
		this.activate = this.activate.bind(this);
		this.cacheRoutes = this.cacheRoutes.bind(this);
		addEventListener("message", (event) => {
			switch (event.data.type) {
				case "CACHE_ROUTES": {
					this.cacheRoutesAbortController = new AbortController();
					event.waitUntil(this.cacheRoutes(event.data, this.cacheRoutesAbortController.signal));
					break;
				}

				case "CANCEL_CACHE_ROUTES": {
					console.log("Caching abgebrochen!");
					this.cacheRoutesAbortController?.abort();
					this.cacheRoutesAbortController = null;
					break;
				}
			}
		});
	}

	/**
   * @param {Request} request
   * @param {StrategyHandler} handler
   * @returns {Promise<Response | undefined>}
   */
	async _handle(request, handler) {
		/** die vollständige URL der Anfrage, z.B. https://example.com/slug/ */
		const url = request.url;
		/**
		 * der Cache-Key der URL, mit Query-String für die Revision
		 *
		 * so können wir den Cache-Eintrag invalidieren, wenn die Revision nicht übereinstimmt
		 */
		const cacheKey = createCacheKey({ url, revision: runtimeManifest.get(url) }).cacheKey;

		console.log(`Versuche URL "${url}" mit Key "${cacheKey}" aufzulösen`);

		const cacheResponse = await handler.cacheMatch(cacheKey);
		// undefined wird zurückgegeben, falls keine Cache-Antwort für den Key existiert
		if (cacheResponse !== undefined) return cacheResponse;

		// wir müssen die Anfrage aus dem Netzwerk holen und mit Revision für das nächste Mal speichern
		console.log(`Hole URL "${url}" aus dem Netzwerk für RevisionFirstCache`);
		try {
			const fetchResponse = await handler.fetch(request, this.constructor._FETCH_OPTIONS_VET);
			// kein await, da es später passieren kann
			handler.cachePut(cacheKey, fetchResponse.clone());
			return fetchResponse;
		} catch (e) {
			// kein await, da es später passieren kann
			offlineAlert(url);
			// leere Antwort, wir können die Datei nicht bekommen
			return new Response();
		}
	}

	/**
	 * Der cache-busting Teil der Strategy.
	 * Iteriert den Cache und entfernt alles, was nicht im Manifest ist oder eine andere Revision hat.
	 *
	 * Von diesem aus der activate Event aufrufen
	 *
	 * @param {ExtendableEvent} event
	 * @returns {Promise}
	 */
	activate(event) {
		return waitUntil(event, async () => {
			const cache = await caches.open(this.cacheName);

			const currentCacheKeys = (await cache.keys()).map(request => request.url);
			const validCacheKeys = new Set(Array.from(runtimeManifest).map(([url, revision]) => createCacheKey({ url, revision }).cacheKey));

			// Alle Löschungen parallel anstoßen
			await Promise.allSettled(
				currentCacheKeys.map(async key => {
					// Das passiert, wenn eine Revision aktualisiert wurde oder eine Datei nicht mehr im Glob enthalten ist
					if (!validCacheKeys.has(key)) {
						// Platz sparen durch Löschen dieses Elements -- es würde nicht geliefert werden, weil die Revision falsch ist
						console.log(`Lösche Key "${key}" aus dem Cache, weil die Revision nicht übereinstimmt`);
						await cache.delete(key);
					}
				}),
			);
		});
	}

	/**
	 * Runtime-Cache-Routen vorladen. Diese Methode wird per Message vom "Frontend" aufgerufen.
	 * Der Methode wird ein Regex übergeben, mit dem alle möglichen Dateien abgeglichen werden.
	 * Dateien, die matchen und noch nicht geladen sind, werden versucht zu laden.
	 *
	 * Das Laden erfolgt mit einer Pool-Strategie, wobei asynchrone Funktionenn URLs aus einem Array nehmen.
	 * Wenn ein Fetch fehlschlägt, wird nicht erneut versucht und es beendet den Worker.
	 * Das reduziert absichtlich die Anzahl gleichzeitiger Requests.
	 *
	 * Wenn alle Worker gestorben oder fertig sind, werden Fehler gemeldet.
	 *
	 * @param {{payload: {routeRegex: RegExp}}} data die an die Nachricht übergebenen Daten
	 * @param {AbortSignal} signal Signal, um den Vorgang abzubrechen
	 */
	async cacheRoutes(data, signal) {
		const cache = await caches.open(this.cacheName);

		// Workaround für `failed to execute 'keys' on 'Cache': Operation too large`
		// Siehe: https://issues.chromium.org/issues/41299331#comment7
		// "That error is an unfortunate hack to protect the browser from using too much memory.
		//   Until we rewrite CacheStorage on the browser side to stream responses back to the renderer,
		//   we simply limit the number of responses we process on the browser side so that it doesn't get too big"
		let currentCacheKeys;
		let isTooManyKeys = false;
		try {
			currentCacheKeys = new Set((await cache.keys()).map(request => request.url));
		} catch (e) {
			isTooManyKeys = true;
			console.error("Fehler beim Laden der Cache-Keys; Fallback auf per-request Prüfung...", e);
		}
		const validCacheKeys = Array.from(runtimeManifest).map(([url, revision]) => createCacheKey({ url, revision }).cacheKey);
		console.log(`Gefundene gültige Cache-Keys: ${validCacheKeys.length}`);

		const routeRegex = data.payload.routeRegex;
		/**
		 * Das sind die Keys, die noch nicht gecached sind UND dem Regex für Routen entsprechen
		 */
		const routesToCache = validCacheKeys.filter((key) => (isTooManyKeys || !currentCacheKeys.has(key)) && routeRegex.test(key));
		console.log(`Gefundene Routen zum Cachen: ${routesToCache.length}`);

		const fetchTotal = routesToCache.length;
		let fetched = 0;

		/**
		 * Asynchrone Funktion, um Clients über den Status des Routencachings zu informieren.
		 * Kann bis zu 1 ms dauern, daher ohne await aufgerufen werden.
		 */
		const postProgress = async ({ frozenFetched }) => {
			const clients = await self.clients.matchAll({ type: "window" });
			for (const client of clients) {
				client.postMessage({ type: "CACHE_ROUTES_PROGRESS", payload: { fetched: frozenFetched, fetchTotal } });
			}
		};

		// Erstaufruf und await, damit Seiten eine Ladeanzeige sehen können
		await postProgress({ frozenFetched: fetched });

		// Früher Abbruch, wenn keine Arbeit vorhanden ist.
		if (fetchTotal === 0) return;

		/**
		 * Anzahl gleichzeitiger Fetches
		 */
		const concurrentFetches = 5;

		const fetchPromise = async () => {
			while (true) {
				// jede Instanz dieser Funktion poppt URLs vom Array, bis keine mehr übrig sind
				const url = routesToCache.pop();
				if (url === undefined || signal.aborted) return;

				// dieses Regex ist suboptimal, aber entfernt die Cache-Version aus der URL
				const cleanUrl = url.replace(/\?__WB_REVISION__=\w+$/m, "");

				// Workaround für `failed to execute 'keys' on 'Cache': Operation too large`
				// (siehe oben)
				const keysForUrl = isTooManyKeys ? await cache.keys(url) : null;
				if (isTooManyKeys && keysForUrl.length) {
					console.log(`Überspringe ${cleanUrl} (zu viele Keys und bereits im Cache)`);
					fetched++;
					postProgress({ frozenFetched: fetched });
					continue;
				}

				const response = await fetch(cleanUrl, this.constructor._FETCH_OPTIONS_VET);
				// dieses await könnte weggelassen werden, um schneller zu sein, mit höherem Fehler-Risiko
				await cache.put(url, response);
				fetched++;
				postProgress({ frozenFetched: fetched });
			}
		};

		// Pool aus Funktionen, die Dateien laden und cachen
		const fetchPromises = [];
		for (let i = 0; i < concurrentFetches; i++) {
			fetchPromises.push(fetchPromise());
		}

		// Warten bis alle Funktionen beendet sind
		const fetchResults = await Promise.allSettled(fetchPromises);

		// Prüfen, ob Funktionen abgestürzt sind und das melden
		const errorResults = fetchResults.filter(fetchResult => fetchResult.status === "rejected");
		if (errorResults.length > 0) {
			const clients = await self.clients.matchAll({ type: "window" });
			for (const client of clients) client.postMessage({ type: "CACHE_ROUTES_ERROR", payload: { errors: errorResults } });
		}
	}
}

/**
 * Map([url, revision])
 *
 * __WB_RUNTIME_MANIFEST wird als [route, revision] Array injiziert, in [url, revision] umgewandelt und als Map konstruiert
 */
const runtimeManifest = new Map(self.__WB_RUNTIME_MANIFEST.map(
	([
		route,
		revision,
	]) =>
		[
			`${self.location.origin}/${route}`,
			revision,
		],
));

const revisionCacheFirst = new RevisionCacheFirst();

registerRoute(
	({ request }) => runtimeManifest.has(request.url),
	revisionCacheFirst,
);

// Alte Einträge aus dem Cache löschen
addEventListener("activate", revisionCacheFirst.activate);

/*
Dies sagt Workbox, Fonts zu cachen und sie nach dem ersten Laden Cache-First auszuliefern
Das setzt voraus, dass Fonts statische Assets sind und sich nicht ändern
 */
registerRoute(({ request }) => request.destination === "font", new CacheFirst({
	cacheName: "font-cache",
}));

/*
Basiscase-Route - für Bilder, die alle anderen Routen verfehlt haben
Dies sind externe Bilder, z.B. für Homebrew
*/
registerRoute(({ request }) => request.destination === "image", new NetworkFirst({
	cacheName: "external-image-cache",
	plugins: [
		// Schutz vor einem zu großen Cache - diese Zahlen sind evtl. anzupassen
		new ExpirationPlugin({ maxAgeSeconds: 7 /* Tage */ * 24 * 60 * 60, maxEntries: 100, purgeOnQuotaError: true }),
	],
}));

addEventListener("install", () => {
	self.skipWaiting();
});

// Dient nur dazu, Cache von alten Versionen der Seite zu löschen - vor der SW-Überarbeitung
addEventListener("activate", event => {
	event.waitUntil((async () => {
		const cacheNames = await caches.keys();
		for (const cacheName of cacheNames) {
			if (!/\d+\.\d+\.\d+/.test(cacheName)) continue;

			await caches.delete(cacheName);
			console.log(`Gelöschter Legacy-Cache "${cacheName}"`);
		}
	})());
});
