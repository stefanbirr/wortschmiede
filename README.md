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
4. Die Antwort kopieren und in der App ins Feld einfügen. Fertig.

Der Import ist absichtlich nachsichtig: Er versteht sauberes JSON, JSON in
Markdown-Blöcken, blanke Arrays, deutsche Feldnamen und notfalls auch eine simple
Liste `Wort – Übersetzung` oder eine Markdown-Tabelle. Details und der Prompt zum
Nachlesen: [docs/PROMPT.md](docs/PROMPT.md).

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

Mitgeliefert sind **Schmiede** (mittelalterlich, Pixelkanten), **Anime** (Neon,
Speedlines) und **Pergament** (heller Lesemodus). Ein Theme bestimmt nicht nur Farben,
sondern auch Begriffe („Schmiedegang" vs. „Trainingslauf"), Stufennamen, Icons und
Klänge. Ein eigenes Theme sind zwei Stellen im Code:
[docs/THEMES.md](docs/THEMES.md).

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
```

```
index.html              App-Shell
css/base.css            Struktur und Komponenten (nur Design-Tokens, keine Farbwerte)
css/themes.css          Token-Blöcke je Theme
js/fsrs.js              FSRS-5-Scheduler
js/session.js           Auswahl der Karten und Aufgabenformate
js/store.js             Persistenz (localStorage), Export/Import
js/parse.js             toleranter Import-Parser für KI-Antworten
js/themes.js            Theme-Registry: Begriffe, Icons, Klänge
js/views/               eine Datei pro Bildschirm
sw.js                   Service Worker (offline)
```

Deployment: Push auf `main` → GitHub Actions testet und veröffentlicht auf Pages
(`.github/workflows/deploy.yml`).

## Lizenz

MIT – siehe [LICENSE](LICENSE).
