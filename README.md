# Wortschmiede

Vokabeltrainer, der **ohne Installation im Browser** läuft – auf dem Handy als PWA
(zum Startbildschirm hinzufügen, danach offline nutzbar). Gehostet über GitHub Pages.

**Die Vokabeldaten bleiben auf dem Gerät.** Es gibt keinen Server, kein Konto, kein
Tracking. Wer die Daten mitnehmen oder sichern will, exportiert sie als Datei.

➡️ **[Zur App](https://stefanbirr.github.io/wortschmiede/)**

---

## So kommen die Vokabeln rein

Kein Abtippen: Buchseite fotografieren, von einem beliebigen KI-Chat umwandeln lassen,
Ergebnis einfügen.

1. **Foto** von der Vokabelseite im Lehrbuch machen.
2. In der App unter **Import** den **Prompt kopieren** (er ist auf die gewählten Sprachen zugeschnitten).
3. Prompt + Foto in **Gemini, ChatGPT oder Claude** geben – die kostenlosen Versionen reichen.
4. Die KI legt eine **JSON-Datei** an, die man herunterlädt.
5. Datei in der App auswählen. Fertig.

Der Weg über die Datei ist der zuverlässigste: Beim Kopieren aus einem Chatfenster
werden gern gerade Anführungszeichen zu typografischen, und dann ist das JSON
kaputt. Kann ein Werkzeug keine Dateien erzeugen, geht es weiterhin über
Einfügen – der Import ist absichtlich nachsichtig und versteht JSON in
Markdown-Blöcken, blanke Arrays, deutsche Feldnamen, krumme Anführungszeichen und
notfalls auch eine simple Liste `Wort – Übersetzung` oder eine Markdown-Tabelle.
Details und der Prompt zum Nachlesen: [docs/PROMPT.md](docs/PROMPT.md).

## Die zwei Lernmodi

**Einprägen** – Karteikarten in Ruhe durchblättern. Tippen dreht die Karte um, Wischen
blättert weiter, Vorlesen per Sprachausgabe, Beispielsätze inklusive. Kein Zeitdruck,
keine Bewertung. Wer eine Vokabel schon kann, markiert sie mit *Sitzt schon* und
überspringt die Anfängerstufen.

**Abfrage** – die eigentliche Übung, mit wechselnden Aufgabenformaten:

| Format | Wann | Warum |
|---|---|---|
| **Erkennen** (Multiple Choice) | erste Begegnung | Einstieg ohne Überforderung |
| **Buchstaben legen** | Runde 2–3 | Brücke zur freien Produktion |
| **Schmieden** (frei tippen) | Standardformat | stärkster Abrufeffekt |
| **Durchblättern** (wischen) | sitzende Vokabeln | schnelle Runden, Selbsteinschätzung |
| **Hören** | gelegentlich | Aussprache mit dem Wort koppeln |

Richtig getroffen gibt Funken und einen Hammerschlag, daneben zerschneidet die Karte.

Bei Latein und Altgriechisch dreht sich die Richtung um: Dort wird ins Deutsche
übersetzt statt in die Zielsprache geschrieben. Das wird beim Import aus der
Sprache vorbelegt und lässt sich pro Deck ändern.

## Auszeichnungen

Steht **jede** Vokabel eines Decks auf einer Stufe, gibt es dafür eine
Auszeichnung – im Schmiede-Theme etwa vom Kupfer- bis zum Sternenstahlbarren.
Es zählt die schwächste Karte:
Eine einzige vergessene Vokabel hält das ganze Deck auf, sonst wäre die
Auszeichnung geschenkt. Wie sie aussehen und heißen, hängt vom Theme ab (Barren,
Wachssiegel oder Gürtelfarben).

## Wie geplant wird

Unter der Haube läuft **FSRS-5** (Free Spaced Repetition Scheduler) mit den
Standardgewichten – dasselbe Verfahren, das in Anki SM-2 abgelöst hat. Für jede Karte
werden **Stabilität** (wie lange das Wissen hält), **Schwierigkeit** und
**Abrufwahrscheinlichkeit** mitgeführt; das nächste Intervall ist genau die Zeit, nach
der man die Vokabel mit der eingestellten Wahrscheinlichkeit (Standard 90 %) noch weiß.
Das spart gegenüber starren Intervallen spürbar Wiederholungen.

Zwei Dinge kommen aus der Lernforschung dazu:

- **Produktion vor Wiedererkennung.** Selbst schreiben zwingt zu tieferem Abruf als
  Ankreuzen – deshalb ist Tippen das Standardformat und Multiple Choice nur der Einstieg.
- **Interleaving statt Blockübung.** Neue Karten werden zwischen die fälligen gestreut,
  Fehler kommen mit Abstand in derselben Sitzung zurück, nicht sofort hinterher.

Die sichtbare Fortschrittsmetapher (Rohling → Erhitzt → Geschmiedet → Gehärtet →
Geschliffen → Meisterklinge) ist direkt aus der Stabilität abgeleitet, also kein
Deko-Balken, sondern eine ehrliche Anzeige.

## Themes

Sechs Welten stehen bereit:

| Theme | Stimmung | Ränge |
|---|---|---|
| **Pergament** (Vorgabe) | heller Lesemodus, Tinte und Papier | Wachssiegel |
| **Schmiede** | Amboss, Glut, Blockoptik | Barren |
| **Anime** | Neonlicht, Speedlines | Gürtel |
| **Fußball** | Flutlicht, Rasenstreifen, Anpfiff | Pokale |
| **Dunkler Wald** | Nebel zwischen alten Stämmen, Fackelschein | Runensteine |
| **Weltraum** | Sternenfeld, Instrumentenlicht | Rangsterne |

Ein Theme bestimmt nicht nur Farben, sondern auch die ganze Sprache der App: Aus
„Deine Esse" wird „Deine Kabine" oder „Deine Brücke", aus „Feuer anfachen" wird
„Anpfiff" oder „Startfreigabe", und die Fortschrittsstufen heißen einmal
„Rohling bis Meisterklinge" und einmal „Neuzugang bis Kapitän". Dazu kommen
Motive, Klänge und die Form der Auszeichnungen.

Alle Themes sind bewusst generisch gehalten – keine Vereinsfarben, keine
Markennamen, keine geschützten Symbole, damit das Projekt quelloffen bleiben
kann. Ein eigenes Theme sind zwei Stellen
im Code: [docs/THEMES.md](docs/THEMES.md).

## Grafiken

Die Symbole stammen aus zwei quelloffenen Sets: **game-icons.net** (CC BY 3.0)
liefert die thematischen Motive – Amboss, Barren, Wachssiegel, Gürtel,
Federkiel –, **Lucide** (ISC) die neutralen Bedienelemente. Beide sind mit
`npm run icons` einmalig geholt und in `js/icons.js` eingebettet; zur Laufzeit
lädt die App nichts von fremden Servern. Autoren und Lizenzen: [CREDITS.md](CREDITS.md).

## Datenschutz

Alles liegt im `localStorage` des Browsers. Die App fordert keine Netzwerkrechte an,
lädt keine externen Skripte, Fonts oder Analytics und schickt nichts irgendwohin.
Das Foto und der Chat bleiben beim KI-Tool der eigenen Wahl – die App sieht nur den
Text, den man einfügt.

Kehrseite: Browserdaten löschen bedeutet Vokabeln weg. Deshalb unter
**Werkbank → Exportieren** regelmäßig eine Sicherungsdatei ziehen.

## Entwicklung

Kein Build-Schritt, keine Abhängigkeiten – nur ES-Module, die der Browser direkt lädt.

```bash
npm start           # lokaler Server auf http://localhost:8080
npm test            # Unit-Tests (FSRS, Import-Parser, Antwortvergleich)
npm run icons       # Icon-Bibliothek und CREDITS.md neu bauen
npm run app-icon    # App-Icons rendern (braucht Playwright: npx playwright install chromium)
```

```
index.html              App-Shell
css/base.css            Struktur und Komponenten (nur Design-Tokens, keine Farbwerte)
css/themes.css          Token-Blöcke je Theme
js/fsrs.js              FSRS-5-Scheduler
js/session.js           Auswahl der Karten und Aufgabenformate
js/store.js             Persistenz (localStorage), Export/Import
js/parse.js             toleranter Import-Parser für KI-Antworten
js/languages.js         Sprachen und ihre Lernkonventionen
js/icons.js             eingebettete Icons (erzeugt, nicht von Hand ändern)
tools/build-icons.mjs   holt die Icons und schreibt js/icons.js + CREDITS.md
tools/build-app-icon.mjs  rendert die App-Icons aus dem Amboss-Motiv
js/themes.js            Theme-Registry: Begriffe, Icons, Klänge
js/views/               eine Datei pro Bildschirm
sw.js                   Service Worker (offline)
```

Deployment: Push auf `main` → GitHub Actions testet und veröffentlicht auf Pages
(`.github/workflows/deploy.yml`).

## Lizenz

MIT – siehe [LICENSE](LICENSE).
