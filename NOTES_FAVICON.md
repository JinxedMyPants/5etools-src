## Favicon-Update - 1.114.2 (wahrscheinlich)
Die Website-Favicons wurden dezent neu gestaltet von jpcranford (aka ldsmadman), basierend auf dem Originallogo von Fantom und Cyanomouss.

Hier eine kurze Übersicht, wie die neuen Icons aussehen:

![](./favicon-128x128.png)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;![](./favicon_preview.png)

*Neues Favicon und Vorschau*

![](./android-chrome-192x192.png)

*App-Symbol*

![](./safari_pin_preview.png)

*Angepinntes Tab in Safari*

![](./touch_bar_preview.png)

*MacBook Touch Bar Lesezeichen*

_**Nicht abgebildet, aber aktualisiert:** Android-Splashscreen, Windows‑Startmenü‑Kacheln, eigenständiger App‑Modus_

Die SVG‑Designs wurden in Illustrator fertiggestellt und die Endgrößen mit Sketch erzeugt. Alle Quelldateien sind in einer ZIP‑Datei [hier](./favicon_source_files.zip) enthalten; die Änderungen sind unten für Interessierte aufgeführt.

### Neuer HTML-Code
Dies ist der Code, der nun in jedem `<head>`-Bereich einer Seite stehen sollte.

```html
<!-- Favicons -->
<link rel="icon" type="image/svg+xml" href="favicon.svg">
<link rel="icon" type="image/png" sizes="256x256" href="favicon-256x256.png">
<link rel="icon" type="image/png" sizes="144x144" href="favicon-144x144.png">
<link rel="icon" type="image/png" sizes="128x128" href="favicon-128x128.png">
<link rel="icon" type="image/png" sizes="64x64" href="favicon-64x64.png">
<link rel="icon" type="image/png" sizes="48x48" href="favicon-48x48.png">
<link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">

<!-- Chrome Web App Icons -->
<link rel="manifest" href="manifest.webmanifest">
<meta name="application-name" content="5etools">
<meta name="theme-color" content="#006bc4">

<!-- Windows Start Menu tiles -->
<meta name="msapplication-config" content="browserconfig.xml"/>
<meta name="msapplication-TileColor" content="#006bc4">

<!-- Apple Touch Icons -->
<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon-180x180.png">
<link rel="apple-touch-icon" sizes="360x360" href="apple-touch-icon-360x360.png">
<link rel="apple-touch-icon" sizes="167x167" href="apple-touch-icon-167x167.png">
<link rel="apple-touch-icon" sizes="152x152" href="apple-touch-icon-152x152.png">
<link rel="apple-touch-icon" sizes="120x120" href="apple-touch-icon-120x120.png">
<meta name="apple-mobile-web-app-title" content="5etools">

<!-- macOS Safari Pinned Tab and Touch Bar -->
<link rel="mask-icon" href="safari-pinned-tab.svg" color="#006bc4">
```

### Weitere Änderungen
- **Favicon:** Die Strichfarbe wurde angepasst, damit sie zum App‑Symbol passt. Das hat den zusätzlichen Vorteil, dass es im Dunkelmodus besser sichtbar ist.
- **App‑Symbol:** Der Text im App‑Symbol wurde verkleinert, um mehr Abstand zum Rand zu schaffen. (Apples „offizielles“ App‑Icon‑Designraster war dabei hilfreich.) Zusätzlich wurde ein *leichter* Verlauf angewendet, um dem Symbol kaum wahrnehmbaren Akzent zu verleihen.
- **Auf Wiedersehen, Piratenhut:** Das Icon mit dem Piratenhut wurde ersetzt. Es war frech, aber nicht der Eindruck, den wir vermitteln wollen. <!-- TODO: Delete the /icon folder, wherever it is, since it's not used anymore -->
- **Android‑Splashscreen:** Beim Starten von der Startseite unter Android zeigt 5etools jetzt einen schicken Splashscreen.
- **Besserer Standalone‑Modus:** Nachdem 5etools zum Home‑Bildschirm Ihres Geräts hinzugefügt wurde (oder im Browser als App installiert wurde), verhält es sich nun wie eine eigene App und erscheint z. B. im App‑Switcher als „5etools“. Das tat es zuvor schon, aber jetzt sollte es sich etwas sauberer verhalten. Je nach Plattform wird eventuell sogar eine Zurück‑Schaltfläche angezeigt.
