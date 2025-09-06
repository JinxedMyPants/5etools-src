# Automatisierung

Die folgende Liste enthält nicht automatisierte oder halbautomatisierte (d. h. mit manuell einmal ausgeführten Skripten bearbeitete) Vorgänge oder Datenanpassungen, die gepflegt werden müssen. Einige Einträge auf dieser Liste sind automationsfreundlich und bisher einfach noch nicht automatisiert, andere sind unpraktisch oder nahezu unmöglich sinnvoll zu automatisieren. Diese Liste dient als Erinnerung/Checkliste für Maintainer und auch als Indikator dafür, wie viel manuelle Pflege derzeit erforderlich ist, um besser einschätzen zu können, ob es sinnvoll ist, neue Funktionen zur Liste hinzuzufügen oder nicht.

Beachte, dass diese Liste nachträglich erstellt wird und noch unvollständig ist.

#### Alle Daten

- Seitenzahlen (`page`)
- Daten-„Tagging“ (Darstellung der `@tag`-Syntax)
	- Dies ist teilweise automatisiert, siehe `node/tag-json.js` (es werden jedoch viele Fehlalarme erzeugt, z. B. wird "Sneak Attack" fälschlicherweise als Angriffsaktion getaggt)
	- Einige Tags sind zu spezifisch, um sie zu automatisieren, z. B. viele, die `@filter` verwenden
- Fälle, in denen `_copy` genutzt werden könnte, z. B. indem Abenteuer-NPCs, die "commoner mit X Attributen" sind, in eine `_copy` von "commoner" mit den entsprechenden Anpassungen umgewandelt werden

#### Zauber

- JSON `spell[].miscTags`

#### Gegenstände

- JSON `item[].ability`
- Alle Gegenstands-Daten, die in natürlicher Sprache vorliegen (z. B. spezifische Waffen in Abenteuern)
