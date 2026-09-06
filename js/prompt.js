/* Erzeugt den Prompt, den Schueler zusammen mit dem Buchfoto in ein
   beliebiges KI-Tool (Gemini, Claude, ChatGPT – Gratisversion reicht) kippen. */

const LANG_NAMES = {
  de: 'Deutsch', en: 'Englisch', fr: 'Französisch', es: 'Spanisch', it: 'Italienisch',
  la: 'Latein', nl: 'Niederländisch', tr: 'Türkisch', ru: 'Russisch', pl: 'Polnisch', pt: 'Portugiesisch',
};
export const languageName = (code) => LANG_NAMES[code] || code;
export const LANGUAGES = Object.entries(LANG_NAMES).map(([code, name]) => ({ code, name }));

export function buildPrompt({ source = 'de', target = 'en', deckName = 'Unit 1', examples = true } = {}) {
  const S = languageName(source);
  const T = languageName(target);
  return `Du bekommst ein Foto einer Vokabelseite aus einem Schulbuch (${T}).
Lies alle Vokabelpaare vollständig aus und gib sie als JSON zurück.

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
- Antworte NUR mit dem JSON, ohne Erklärung, ohne Markdown-Rahmen.

Format:
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
