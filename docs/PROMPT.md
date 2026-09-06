# Vokabeln per Foto einlesen

Die App erzeugt den Prompt unter **Import** automatisch aus den gewählten Sprachen
und dem Deck-Namen. Dieses Dokument ist die Referenz zum Nachlesen – etwa wenn man
den Prompt einmal in ein anderes Werkzeug übernehmen will.

## Prompt (Beispiel Deutsch → Englisch)

```text
Du bekommst ein Foto einer Vokabelseite aus einem Schulbuch (Englisch).
Lies alle Vokabelpaare vollständig aus und gib sie als JSON zurück.

Regeln:
- "front" = Deutsch (die Sprache, die ich schon kann)
- "back"  = Englisch (die Sprache, die ich lernen will)
- Bei Nomen die Artikel mitnehmen, wenn sie auf der Seite stehen (z. B. "der Apfel", "the apple").
- Unregelmäßige Formen, Plural oder Präpositionen, die im Buch stehen, gehören in "hint".
- "alternatives" enthält gleichwertige Übersetzungen, die ich beim Abfragen auch schreiben dürfte.
- Wenn die Seite Beispielsätze enthält, übernimm sie in "example" und übersetze sie in
  "exampleTranslation". Erfinde nichts dazu, wenn keine da sind.
- Nichts erfinden, nichts weglassen, Reihenfolge der Seite beibehalten.
- Umlaute und Akzente korrekt setzen.
- Antworte NUR mit dem JSON, ohne Erklärung, ohne Markdown-Rahmen.
```

## Datenformat

```json
{
  "schema": "wortschmiede/deck@1",
  "name": "Unit 3 – At the market",
  "sourceLanguage": "de",
  "targetLanguage": "en",
  "cards": [
    {
      "front": "der Apfel",
      "back": "apple",
      "hint": "Plural: apples",
      "alternatives": [],
      "example": "I eat an apple every day.",
      "exampleTranslation": "Ich esse jeden Tag einen Apfel.",
      "tags": ["Nomen"]
    }
  ]
}
```

| Feld | Pflicht | Bedeutung |
|---|---|---|
| `front` | ja | Wort in der bekannten Sprache |
| `back` | ja | Wort in der Zielsprache |
| `hint` | nein | Hinweis aus dem Buch (Plural, unregelmäßige Formen …) |
| `alternatives` | nein | weitere Übersetzungen, die beim Tippen als richtig zählen |
| `example` / `exampleTranslation` | nein | Beispielsatz und seine Übersetzung |
| `tags` | nein | freie Schlagwörter, z. B. Wortart |

Steht ein Hinweis in der Zielsprache („Plural: apples") und würde damit die Lösung
verraten, blendet die App ihn während der Frage aus und zeigt ihn erst in der Auflösung.

## Was der Import sonst noch versteht

Falls die KI sich nicht ans Format hält, greifen der Reihe nach diese Rettungswege:

1. JSON in einem ```-Codeblock
2. JSON irgendwo im Antworttext (erste `{` bis letzte `}`)
3. ein blankes Array `[{...}, {...}]`
4. andere Feldnamen: `deutsch`/`englisch`, `de`/`en`, `begriff`/`übersetzung`,
   `frage`/`antwort`, `source`/`target`, `wortart` …
5. Zeilenformate: `Wort – Übersetzung`, `Wort; Übersetzung`, Tabulator-getrennt
6. Markdown-Tabellen mit `|`

Dubletten (gleiches Wortpaar im selben Deck) werden beim Import übersprungen, der
Lernfortschritt bestehender Karten bleibt dabei erhalten.

## Tipps für bessere Ergebnisse

- Nur eine Seite pro Anfrage; bei langen Listen lieber in zwei Fotos aufteilen.
- Gerade fotografieren, Schatten vermeiden – Handschrift wird oft falsch gelesen.
- Das Ergebnis kurz überfliegen: Falsch erkannte Vokabeln kann man im Deck antippen
  und dort korrigieren.
