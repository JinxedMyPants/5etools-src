import { Workbox } from "workbox-window/Workbox.mjs";

// Das Auslösen eines nicht abgefangenen Fehlers beendet die Ausführung dieses Skripts.
if (!navigator?.serviceWorker) throw new Error("no serviceWorker in navigator, no sw will be injected");

const throttle = (func, delay) => {
	let timeout = null;
	return function (...args) {
		if (timeout === null) {
			func.apply(this, args);
			timeout = setTimeout(() => { timeout = null; }, delay);
		}
	};
};

const fetchError = {
	"generic": throttle(() => {
		JqueryUtil.doToast({
			content: `Fehler beim Abrufen allgemeiner Inhalte\u2014Sie sind offline und haben diese Inhalte noch nicht angesehen. Seiten werden möglicherweise nicht korrekt geladen.`,
			type: "warning",
			autoHideTime: 2_500 /* 2.5 seconds */,
		});
	}, 10_000 /* 10 seconds */),

	"json": throttle(() => {
		JqueryUtil.doToast({
			content: `Fehler beim Abrufen von Daten\u2014Sie sind offline und haben diese Daten noch nicht angesehen. Diese Seite wird möglicherweise nicht korrekt geladen.`,
			type: "danger",
			autoHideTime: 9_000 /* 9 seconds */,
		});
	}, 2_000 /* 2 seconds */),

	"image": throttle(() => {
		JqueryUtil.doToast({
			content: `Fehler beim Abrufen von Bildern\u2014Sie sind offline und haben diese Bilder noch nicht angesehen. Bilder werden möglicherweise nicht korrekt angezeigt.`,
			type: "info",
			autoHideTime: 5_000 /* 5 seconds */,
		});
	}, 60_000 /* 60 seconds */),
};

const wb = new Workbox("sw.js");

wb.addEventListener("controlling", () => {
	const lnk = ee`<a href="${Renderer.get().baseUrl}changelog.html" class="alert-link">Änderungsprotokoll</a>`
		.onn("click", evt => {
			evt.stopPropagation();
		});
	JqueryUtil.doToast({
		content: ee`<div>${window.location.hostname} wurde aktualisiert\u2014bitte neu laden, um neue Inhalte zu sehen und sicherzustellen, dass die Seite korrekt angezeigt wird. Siehe das ${lnk} für weitere Informationen!</div>`,
		type: "success",
		isAutoHide: false, // niemals automatisch ausblenden - diese Warnung ist wichtig
	});
});

// hier sagen wir dem Service Worker, dass er starten soll - nachdem die Seite geladen wurde
// Event-Listener müssen vorher hinzugefügt werden
wb.register();

// ab hier folgen die UI-Elemente zur Anzeige des Cache-Status

/**
 * Fordere den Service Worker auf, Dateien zur Laufzeit zwischenzuspeichern, die einem Regex entsprechen
 * @param {RegExp} routeRegex das Regex, um zu bestimmen, ob eine Datei gecacht werden soll
 */
const swCacheRoutes = (routeRegex) => {
	wb.messageSW({
		type: "CACHE_ROUTES",
		payload: { routeRegex },
	});
	JqueryUtil.doToast({ content: "Vorabruf wird gestartet...", autoHideTime: 500 });
};

/**
 * Fordere den Service Worker auf, das Routen-Caching abzubrechen
 */
const swCancelCacheRoutes = () => {
	wb.messageSW({ type: "CANCEL_CACHE_ROUTES" });
	setTimeout(() => {
		removeDownloadBar();
		JqueryUtil.doToast("Vorabruf wurde abgebrochen. Einige Daten könnten bereits vorgeladen sein.");
	}, 1000);
};

/**
 * Fordere den Service Worker auf, sich selbst zu entfernen.
 */
const swResetAll = () => {
	wb.messageSW({ type: "RESET" });
	JqueryUtil.doToast({ content: "Zurücksetzen..." });
};

// unschönes globales Objekt, aber ohne Bundler keine bessere Wahl
globalThis.swCacheRoutes = swCacheRoutes;
globalThis.swResetAll = swResetAll;

let downloadBar = null;

/**
 * Entfernt die Download-Leiste aus dem DOM und setzt downloadBar auf null.
 */
const removeDownloadBar = () => {
	if (downloadBar === null) return;
	downloadBar.$wrapOuter.remove();
	downloadBar = null;
};

/**
 * Fügt die Download-Leiste dem DOM hinzu und schreibt das jQuery-Objekt nach downloadBar.
 * Bindet Event-Handler.
 */
const initDownloadBar = () => {
	if (downloadBar !== null) removeDownloadBar();

	const $displayProgress = $(`<div class="page__disp-download-progress-bar"></div>`);
	const $displayPercent = $(`<div class="page__disp-download-progress-text ve-flex-vh-center bold">0%</div>`);

	const $btnCancel = $(`<button class="ve-btn ve-btn-default"><span class="glyphicon glyphicon-remove"></span></button>`)
		.click(() => {
			swCancelCacheRoutes();
		});

	const $wrapBar = $$`<div class="page__wrp-download-bar w-100 relative mr-2">${$displayProgress}${$displayPercent}</div>`;
	const $wrapOuter = $$`<div class="page__wrp-download">
			${$wrapBar}
			${$btnCancel}
		</div>`.appendTo(document.body);

	downloadBar = { $wrapOuter, $wrapBar, $displayProgress, $displayPercent };
};

/**
 * Aktualisiert die UI der Download-Leiste basierend auf einer neuen Nachricht vom Service Worker. Falls keine Leiste existiert, erstelle eine.
 * @param {{type: string, payload: Object}} msg die Nachricht vom SW
 */
const updateDownloadBar = (msg) => {
	if (downloadBar === null) initDownloadBar();

	switch (msg.type) {
		case "CACHE_ROUTES_PROGRESS":
			// eslint-disable-next-line no-case-declarations
			const percent = `${(100 * (msg.payload.fetched / msg.payload.fetchTotal)).toFixed(3)}%`;
			downloadBar.$displayProgress.css("width", percent);
			downloadBar.$displayPercent.text(percent);
			// zeige eine Toast-Meldung und bereinige, wenn alle Dateien heruntergeladen wurden.
			if (msg.payload.fetched === msg.payload.fetchTotal) finishedDownload();
			break;

		case "CACHE_ROUTES_ERROR":
			for (const error of msg.payload.errors) {
				// eslint-disable-next-line no-console
				console.error(error);
			}

			downloadBar.$wrapBar.addClass("page__wrp-download-bar--error");
			downloadBar.$displayProgress.addClass("page__disp-download-progress-bar--error");
			downloadBar.$displayPercent.text("Fehler!");

			setTimeout(() => {
				removeDownloadBar();
				JqueryUtil.doToast(
					{
						type: "warning",
						autoHideTime: 15_000,
						content:
							`Beim Vorabladen ist ein Fehler aufgetreten.
					Möglicherweise sind Sie offline oder der Server antwortet nicht.
					Bitte versuchen Sie es erneut. ${VeCt.STR_SEE_CONSOLE}`,
					},
				);
			}, 2_000);
			break;
	}
};

/**
 * Aufrufen, wenn der Fortschritt 100% erreicht hat, um die Leiste zu entfernen und einen Toast zu zeigen
 */
const finishedDownload = () => {
	removeDownloadBar();
	JqueryUtil.doToast({ type: "success", content: "Vorabruf abgeschlossen! Die vorgeladenen Inhalte sind jetzt offline verfügbar." });
};

wb.addEventListener("message", event => {
	const msg = event.data;
	switch (msg.type) {
		case "FETCH_ERROR":
			fetchError[msg.payload]();
			break;
		case "CACHE_ROUTES_PROGRESS":
		case "CACHE_ROUTES_ERROR":
			updateDownloadBar(msg);
			break;
	}
});
