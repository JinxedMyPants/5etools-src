# Beitragende

## Homebrew

Beiträge zu Homebrew (Konversionen, eigene Inhalte) sollten an das [Homebrew-Repository](https://github.com/TheGiddyLimit/homebrew/) gerichtet werden. Siehe dort die Hinweise für weitere Informationen.

## Rechtschreibfehler / kleine Änderungen

Kleine Korrekturen und Anpassungen — insbesondere Tippfehler — bitte im Kanal „typos etc.“ auf unserem [Discord](https://discord.gg/5etools) melden. Wenn du Discord nicht nutzt, ist das Eröffnen eines Issues auf GitHub ebenfalls akzeptabel.

## Funktionswünsche und neue Features

Funktionswünsche bitte über den Bot-Befehl `/featurerequest` auf unserem [Discord](https://discord.gg/5etools) einreichen.

Wenn du direkt Code für ein neues Feature beitragen möchtest, nimm idealerweise zuerst über [Discord](https://discord.gg/5etools) Kontakt auf. Wird das Feature als sinnvoll und ausreichend signifikant eingeschätzt, damit ein Dritter daran arbeiten kann, kann ein Pull Request auf GitHub geöffnet werden.

Allgemeine Richtlinien:

- Features, die eine zusätzliche langfristige Wartungsbelastung für das Projekt verursachen, werden in der Regel nicht akzeptiert.
- Features, die stark vom D&D‑5e‑Kanon abweichen (z. B. komplexe eigene Zufallsgeneratoren, Unterstützung für System‑Abspaltungen oder umfangreiche Homebrew), werden nicht akzeptiert.

## Fehlerberichte

Bugs bitte über den Bot-Befehl `/bugreport` auf unserem [Discord](https://discord.gg/5etools) melden.

---

## Entwicklerhinweise

### Datenquellen und Versionierung

Auf der Seite dürfen nur „offizielle“ (d. h. von WotC veröffentlichte) Daten aufgenommen werden. Anderes gehört ins Homebrew‑Repository. Ausnahmen sind beispielsweise:

- Spezifische Adventurers League‑Inhalte (AL) werden im Homebrew‑Repository verwaltet. Obwohl vieles davon ursprünglich von WotC veröffentlicht ist, wird zur Konsistenz alles AL‑bezogene als Homebrew behandelt.
- Inhalte aus der Dragon+‑Zeitschrift.
- Inhalte, die von den Maintainer*innen dieses Repositories ausdrücklich ausgeschlossen wurden.

Priorität hat RAW (Rules As Written). Ziel ist eine 1:1‑Kopie der Originaldaten. Offensichtliche Tippfehler (z. B. mathematische Fehler in Statblöcken) können nach Ermessen der Maintainer korrigiert werden.

Verwende möglichst die neueste Version eines veröffentlichten Materials. Deutlich abweichende ältere Versionen, die für die Community relevant sind, können ins Homebrew‑Repository ausgelagert werden.

Die primäre Quelle für ein Element sollte die Produktveröffentlichung sein, in der es zuerst erschien. Ausnahmen:

- Das Element wurde zuerst in einer teilweisen oder Pre‑Release‑Form veröffentlicht und später in überarbeiteter Form neu veröffentlicht (z. B. Rassen aus WGE später in ERLW).
- Das Element erschien zuerst in einem Abenteuer und wurde später in einem allgemeinen Supplement nachgedruckt (z. B. Dämonenherrscher von OotA in MTF).

#### Seitenspezifische Hinweise

Sprachen‑Seite: Da es kein einheitliches RAW‑Format für Sprachdaten gibt, werden Informationen aus mehreren Quellen zusammengetragen. Prioritäten (höchste zuerst):

- Abschnitt „Languages“ im PHB (S. 123)
- Offizielle Quellen in folgender Reihenfolge:
	- PHB > (DMG) > MM
	- Weitere offizielle Produkte in chronologischer Veröffentlichungsfolge
	- Inoffizielle Produkte (z. B. Unearthed Arcana, Plane Shift) in chronologischer Reihenfolge

Innerhalb dieser Reihenfolge gilt zusätzlich:

- Text, der explizit eine Sprache beschreibt oder auf sie verweist, nach der Reihenfolge des ersten Auftretens im Produkt (Seite 2 vor Seite 10).
- Text, der für den Spielergebrauch bestimmt ist (z. B. die Druidic‑Funktion der Druidenklasse). Er darf zur Anpassung an ein Referenzformat angepasst werden (z. B. „You can understand...“ → „A speaker of X language can understand...“).

### Ziel‑JavaScript‑Version

Es dürfen Sprachfeatures verwendet werden, die in den Standardversionen von Chrome und Firefox verfügbar sind und seit mindestens sechs Monaten standardmäßig unterstützt werden.

### Stilrichtlinien

#### Code

- Bevorzuge Tabs gegenüber Leerzeichen.

#### CSS

- Nutze möglichst die BEM‑Namenskonvention (Block Element Modifier) — siehe http://getbem.com/

#### Daten / Text

- Formatiere JSON so, dass es dem Standardausgang von JavaScripts `JSON.stringify` entspricht (Tabs zur Einrückung): je Klammer und Wert eine eigene Zeile. Programmatisch erzeugte JSON‑Dateien (z. B. in `data/generated`) sollten dagegen minifiziert werden.

- Regeln zum „Taggen“ von Referenzen in Textdaten (z. B. `{@creature goblin}`):
	- Tagge nur beabsichtigte Referenzen. Beispiel: In „You gain one cantrip of your choice from the wizard spell list“ ist „wizard“ eine mechanische Referenz und darf getaggt werden; im Satz „Together, a group of seven powerful wizards sought to contain the demon“ ist es kein Tag.
	- Tagge niemals Text innerhalb eines `quote`‑Blocks. Ein Zitat soll stilistisch unangetastet bleiben.
	- In Quelldaten vermeide Referenzen auf Inhalte, die nach Veröffentlichung der Quelle erschienen sind.

### Einbeziehung von `_copy`‑Entitäten

Nur Entitäten mit signifikanten mechanischen Unterschieden oder eigenem Artwork sollten als `_copy` aufgenommen werden.

Beispiele für Monster: Nicht ausreichend alleinstehend (kein alleiniger Grund für `_copy`):

- Größe
- Kreaturentyp
- Gesinnung
- Trefferpunkte

Ausreichend alleinstehend:

- Hinzufügen/Entfernen von Traits oder Aktionen
- Hinzufügen/Entfernen von Zaubern
- Änderungen an Schadensarten
- Immunitäten, Resistenzen
- Einzigartiges offizielles Artwork/Token
- usw.

### JSON‑Bereinigung

#### Abschließende Kommata

Um abschließende Kommata in JSON zu entfernen:

Find: `(.*?)(,)(:?\s*]|\s*})`
Replace: `$1$3`

#### Zeichenersetzung

- `’` → `'`
- `“` und `”` → `"`
- `—` (Em‑Dash) → `\u2014`
- `–` → `\u2013`
- `−` → `\u2212`
- `•` sollte vermieden werden, es sei denn, das JSON wird vom entryRenderer noch nicht unterstützt; dann als Liste kodieren
- Zulässige Unicode‑Escape‑Sequenzen: `\u2014`, `\u2013`, `\u2212`; alle anderen Zeichen (sofern nicht anders angegeben) unverändert lassen

#### Gedankenstrich‑Konvention

- `-` (Bindestrich) nur zur Wortverbindung verwenden, z. B. `60-foot`, `18th-level`
- `\u2014` für parenthetische Gedankenstriche oder leere Tabellenzeilen; kein Leerzeichen vor oder nach `\u2014`
- `\u2013` für numerische Bereiche (z. B. `1\u20135`)
- `\u2212` für unäre Minuszeichen (z. B. `"You have a \u22125 penalty to..."`)

#### Maßeinheiten

- Als Adjektiv: Bindestrich und ausgeschriebene Einheit (z. B. „60‑foot line“)
- Als Nomen: Leerzeichen und abgekürzte Einheit mit Punkt (z. B. `blindsight 60 ft.`, `darkvision 120 ft.`)
- Zeitangaben: Schrägstrich ohne Leerzeichen, Großschreibung der Einheit (z. B. `2/Turn`, `3/Day`)

#### Würfelnotation

Würfel schreiben als `[X]dY[ <+|-|×> Z]` mit Leerzeichen vor und nach Operatoren. Beispiele: `d6`, `2d6`, `2d6 + 1`.

#### Gegenstandsnamen

Gegenstände im Title Case, Ausnahmen: Einheiten in Klammern im Satzfall (z. B. `(vial)`).

### Maus‑/Tastaturereignisse

Vermeide ALT‑modifizierte Events (inkonsistent auf macOS und manchen Linux‑Distributionen). Bevorzuge SHIFT‑/CTRL‑modifizierte Events.

### Dev‑Server

Starte einen lokalen Dev‑Server mit:
`npm run serve:dev`
Dieser stellt die Projektdateien unter http://localhost:5050/index.html bereit.

### Versionserhöhung

Führe aus:
`npm run version-bump -- [OPTION]`
wobei `[OPTION]` eine der folgenden ist:

- `major` (z. B. `1.2.3` → `2.0.0`)
- `minor` (z. B. `1.2.3` → `1.3.0`)
- `patch` (z. B. `1.2.3` → `1.2.4`)
- oder eine konkrete Versionsnummer (z. B. `1.2.3`)

Ablauf: Es werden zuerst die Tests ausgeführt; schlagen diese fehl, bricht der Vorgang ab. Anschließend werden betroffene Dateien versioniert, ein Commit mit der Nachricht `chore(version): bump` erstellt und ein Tag im Format `v1.2.3` gesetzt. Das Tagging lässt sich mit `npm config set git-tag-version false` deaktivieren.

### Service Worker

Der Service Worker (clientseitiges Netzwerk‑Caching zur Performance‑Verbesserung und Offline‑Nutzung) wird nicht ins Repository committet und muss optional lokal gebaut werden:

- `npm run build:sw` — Entwicklungs‑Variante (mit Logausgaben)
- `npm run build:sw:prod` — Produktions‑Variante

Beide Varianten cachen dieselben Dateien lokal. Das Erstellen des Service Workers ist optional. Beachte: Beim Einsatz des Service Workers werden einige Dateien cache‑first bereitgestellt. Beim lokalen Entwickeln solltest du den Service Worker deaktivieren/umgehen, damit lokale Änderungen sichtbar bleiben.

### Bilder

Bilder werden im Regelfall als `.webp` mit 85 % Qualität gespeichert. Token‑Bilder und einige kleine Assets (z. B. UI‑Elemente) werden verlustfrei als `.webp` gespeichert.
