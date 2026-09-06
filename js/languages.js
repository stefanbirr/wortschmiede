/* Sprachen und ihre Lern-Konventionen. */

const LANG_NAMES = {
  de: 'Deutsch', en: 'Englisch', fr: 'Französisch', es: 'Spanisch', it: 'Italienisch',
  la: 'Latein', grc: 'Altgriechisch', nl: 'Niederländisch', tr: 'Türkisch',
  ru: 'Russisch', pl: 'Polnisch', pt: 'Portugiesisch',
};

export const languageName = (code) => LANG_NAMES[code] || code;
export const LANGUAGES = Object.entries(LANG_NAMES).map(([code, name]) => ({ code, name }));

/**
 * Sprachen, die in der Schule rezeptiv unterrichtet werden: Man übersetzt aus
 * ihnen ins Deutsche und schreibt sie nicht selbst. Bei Latein wäre eine
 * Abfrage "denken -> cōgitāre" am Unterricht vorbei – gefragt ist die
 * Gegenrichtung.
 */
const RECEPTIVE = new Set(['la', 'grc']);

/** Vorgabe der Abfragerichtung für ein neues Deck. */
export const defaultDirectionFor = (targetLanguage) =>
  (RECEPTIVE.has(String(targetLanguage || '').toLowerCase()) ? 'recognition' : 'production');

/** Beschriftung der Richtungen mit den konkreten Sprachen des Decks. */
export function directionOptions(deck) {
  const s = languageName(deck?.sourceLanguage || 'de');
  const t = languageName(deck?.targetLanguage || 'en');
  return [
    ['production', `${s} → ${t}: ${t} schreiben`],
    ['recognition', `${t} → ${s}: ins ${s}e übersetzen`],
    ['both', 'Gemischt'],
  ];
}
