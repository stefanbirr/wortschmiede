/* Erzeugt den Prompt, den Schueler zusammen mit dem Buchfoto in ein
   beliebiges KI-Tool (Gemini, Claude, ChatGPT – Gratisversion reicht) kippen. */

import { languageName } from './languages.js';

export function buildPrompt({ source = 'de', target = 'en', deckName = 'Unit 1', examples = true } = {}) {
  const S = languageName(source);
  const T = languageName(target);
  const fileName = `wortschmiede-${(deckName || 'deck').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'deck'}.json`;
  return `Du bekommst ein Foto einer Vokabelseite aus einem Schulbuch (${T}).
Lies alle Vokabelpaare vollständig aus und lege das Ergebnis als JSON-Datei zum
Herunterladen an, Dateiname "${fileName}".

Regeln:
- "front" = ${S} (die Sprache, die ich schon kann)
- "back"  = ${T} (die Sprache, die ich lernen will)
- Bei Nomen die Artikel mitnehmen, wenn sie auf der Seite stehen (z. B. "der Apfel", "the apple").
- Unregelmäßige Formen, Plural oder Präpositionen, die im Buch stehen, gehören in "hint".
- "alternatives" enthält gleichwertige Übersetzungen, die ich beim Abfragen auch schreiben dürfte.
- ${examples ? 'Wenn die Seite Beispielsätze enthält, übernimm sie in "example" und übersetze sie in "exampleTranslation". Erfinde nichts dazu, wenn keine da sind.' : 'Keine Beispielsätze erzeugen.'}
- Nichts erfinden, nichts weglassen, Reihenfolge der Seite beibehalten.
- Umlaute und Akzente korrekt setzen.
- Gerade Anführungszeichen verwenden ("), keine typografischen („ " " ").
- Gib mir die fertige Datei zum Herunterladen. Kannst du keine Dateien erzeugen,
  dann gib das JSON stattdessen in einem Codeblock aus – ohne Text davor oder danach.

Inhalt der Datei (das Beispiel zeigt nur den Aufbau, nicht die Sprache):
{
  "schema": "wortschmiede/deck@1",
  "name": "${deckName}",
  "sourceLanguage": "${source}",
  "targetLanguage": "${target}",
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
}`;
}
