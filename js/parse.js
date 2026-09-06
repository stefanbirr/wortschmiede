/* ==========================================================================
   Import-Parser.
   Nimmt entgegen, was ein KI-Chat realistisch ausspuckt: reines JSON,
   JSON in ```-Bloecken, ein blankes Array, oder notfalls Tabellen-/CSV-Zeilen.
   Ziel ist, dass niemand am Format scheitert.
   ========================================================================== */

export const SCHEMA_ID = 'wortschmiede/deck@1';

const FIELD_ALIASES = {
  front: ['front', 'de', 'deutsch', 'german', 'begriff', 'frage', 'source', 'quelle', 'wort', 'l1'],
  back: ['back', 'en', 'englisch', 'english', 'uebersetzung', 'übersetzung', 'translation', 'antwort', 'target', 'ziel', 'l2'],
  hint: ['hint', 'tipp', 'hinweis', 'note', 'notiz', 'wortart', 'pos'],
  example: ['example', 'beispiel', 'satz', 'sentence', 'examplesentence', 'beispielsatz'],
  exampleTranslation: ['exampletranslation', 'beispieluebersetzung', 'beispielübersetzung', 'satzuebersetzung', 'translationexample'],
  alternatives: ['alternatives', 'alternativen', 'synonyms', 'synonyme', 'auch', 'variants'],
  tags: ['tags', 'kategorien', 'categories', 'topic', 'thema'],
};

const norm = (k) => String(k).toLowerCase().replace(/[\s_-]/g, '');

function mapEntry(raw) {
  if (typeof raw === 'string') {
    const parts = raw.split(/\s*[–—\-=]{1,2}>?\s*|\t|;|,/).filter(Boolean);
    return parts.length >= 2 ? { front: parts[0], back: parts[1] } : null;
  }
  if (Array.isArray(raw)) {
    return raw.length >= 2 ? { front: raw[0], back: raw[1], hint: raw[2] || '' } : null;
  }
  if (!raw || typeof raw !== 'object') return null;

  const out = {};
  const seen = new Map(Object.keys(raw).map((k) => [norm(k), k]));
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const alias of aliases) {
      if (seen.has(alias)) { out[field] = raw[seen.get(alias)]; break; }
    }
  }
  if (out.alternatives && !Array.isArray(out.alternatives)) {
    out.alternatives = String(out.alternatives).split(/[;,/|]/).map((s) => s.trim()).filter(Boolean);
  }
  if (out.tags && !Array.isArray(out.tags)) {
    out.tags = String(out.tags).split(/[;,/|]/).map((s) => s.trim()).filter(Boolean);
  }
  return out.front && out.back ? out : null;
}

/** Holt das erste plausible JSON aus einem Text (auch aus ```json-Bloecken). */
function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidates = [];
  if (fenced) candidates.push(fenced[1]);
  candidates.push(text);
  const firstBrace = text.search(/[[{]/);
  if (firstBrace >= 0) {
    const lastBrace = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
    if (lastBrace > firstBrace) candidates.push(text.slice(firstBrace, lastBrace + 1));
  }
  for (const c of candidates) {
    try { return JSON.parse(c.trim()); } catch { /* naechster Versuch */ }
  }
  return null;
}

/** Fallback: zeilenweise Tabelle "wort<TAB>translation" oder "wort; translation". */
function parseLines(text) {
  const rows = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !/^[|+-]+$/.test(l));
  const cards = [];
  for (let line of rows) {
    if (line.startsWith('|')) line = line.replace(/^\||\|$/g, '');       // Markdown-Tabelle
    const parts = line.split(/\t|\s*\|\s*|\s*;\s*|\s+[–—]\s+|\s+-\s+|\s*=>\s*/).map((p) => p.trim()).filter(Boolean);
    if (parts.length < 2) continue;
    if (/^(deutsch|german|front|wort)$/i.test(parts[0])) continue;       // Kopfzeile
    cards.push({ front: parts[0], back: parts[1], hint: parts[2] || '' });
  }
  return cards;
}

/**
 * @returns {{ok:boolean, deck?:{name,sourceLanguage,targetLanguage,cards:[]}, error?:string, warnings:string[]}}
 */
export function parseImport(text) {
  const warnings = [];
  const trimmed = String(text || '').trim();
  if (!trimmed) return { ok: false, error: 'Nichts eingefügt.', warnings };

  const data = extractJson(trimmed);
  let rawCards = null;
  let meta = {};

  if (Array.isArray(data)) {
    rawCards = data;
  } else if (data && typeof data === 'object') {
    rawCards = data.cards || data.vokabeln || data.words || data.entries || data.items || null;
    meta = {
      name: data.name || data.deck || data.title || data.titel || '',
      sourceLanguage: data.sourceLanguage || data.source || data.from || '',
      targetLanguage: data.targetLanguage || data.target || data.to || '',
    };
    if (!rawCards) {
      const firstArray = Object.values(data).find((v) => Array.isArray(v));
      if (firstArray) { rawCards = firstArray; warnings.push('Kartenliste wurde automatisch erkannt.'); }
    }
    if (data.schema && data.schema !== SCHEMA_ID) warnings.push(`Fremdes Schema "${data.schema}" – trotzdem gelesen.`);
  }

  if (!Array.isArray(rawCards)) {
    const lines = parseLines(trimmed);
    if (lines.length) {
      warnings.push('Kein JSON erkannt – als Tabelle gelesen.');
      rawCards = lines;
    } else {
      return { ok: false, error: 'Konnte keine Vokabeln erkennen. Erwartet wird JSON nach dem Prompt-Format.', warnings };
    }
  }

  const cards = [];
  let dropped = 0;
  for (const raw of rawCards) {
    const mapped = mapEntry(raw);
    if (mapped) cards.push(mapped); else dropped++;
  }
  if (!cards.length) return { ok: false, error: 'Keine vollständigen Vokabelpaare gefunden (front + back nötig).', warnings };
  if (dropped) warnings.push(`${dropped} Einträge ohne Wortpaar übersprungen.`);

  return {
    ok: true,
    warnings,
    deck: {
      name: meta.name || 'Importiertes Deck',
      sourceLanguage: (meta.sourceLanguage || 'de').slice(0, 5),
      targetLanguage: (meta.targetLanguage || 'en').slice(0, 5),
      cards,
    },
  };
}
