/* ==========================================================================
   Persistenz – ausschliesslich lokal (localStorage).
   Es gibt keinen Server, keinen Account, keine Telemetrie. Wer die Daten
   mitnehmen will, exportiert sie als Datei (siehe Werkbank).
   ========================================================================== */

import { uid, dayKey, DAY, debounce } from './util.js';
import { newSrs, forgeStage } from './fsrs.js';
import { defaultDirectionFor } from './languages.js';

const KEY = 'wortschmiede.v1';
const BACKUP_PREFIX = 'wortschmiede.backup.';   // Kopie vor jeder Formatmigration
const RESCUE_PREFIX = 'wortschmiede.rescue.';   // unlesbarer Stand, beiseitegelegt
const LOG_LIMIT = 4000;            // Review-Log fuer spaetere FSRS-Optimierung

export const DEFAULT_SETTINGS = {
  theme: 'pergament',
  direction: 'production',         // production | recognition | both
  sessionSize: 20,
  newPerDay: 10,
  desiredRetention: 0.9,
  maxInterval: 3650,
  typoTolerance: true,
  ignoreAccents: false,
  ignoreArticles: true,
  sound: true,
  haptics: true,
  speech: true,
  swipeMode: true,                 // Wisch-Aufgaben in die Mischung nehmen
};

const STATE_VERSION = 2;

function emptyState() {
  return {
    version: STATE_VERSION,
    decks: {},
    cards: {},
    settings: { ...DEFAULT_SETTINGS },
    progress: { xp: 0, streak: 0, lastDay: null, days: {}, reviews: 0 },
    log: [],
  };
}

let migratedFrom = 0;          // > 0, wenn beim Laden ein älteres Format hochgezogen wurde
let loadIssue = null;          // gesetzt, wenn der gespeicherte Stand nicht lesbar war
let state = load();
const listeners = new Set();

// Eine Migration einmal aktiv festschreiben, damit sie nicht bei jedem Start
// neu läuft und der Zustand auf der Platte dem im Speicher entspricht.
if (migratedFrom) queueMicrotask(() => commit());

function load() {
  let raw = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch (err) {
    // Speicher komplett gesperrt (privater Modus, Blockierung durch den Browser)
    loadIssue = { kind: 'blocked', error: String(err) };
    return emptyState();
  }
  if (!raw) return emptyState();

  try {
    return migrate(JSON.parse(raw), raw);
  } catch (err) {
    /*
     * Der gespeicherte Stand ist beschädigt – etwa weil ein Schreibvorgang bei
     * vollem Speicher abbrach. Früher startete die App hier stillschweigend leer
     * und überschrieb den Rest beim ersten Klick; die Vokabeln waren dann
     * endgültig weg. Jetzt wird der Rohtext unter einem eigenen Schlüssel
     * beiseitegelegt und die App meldet sich, damit man ihn retten kann.
     */
    const rescueKey = RESCUE_PREFIX + new Date().toISOString().replace(/[:.]/g, '-');
    try {
      localStorage.setItem(rescueKey, raw);
      loadIssue = { kind: 'unreadable', rescueKey, bytes: raw.length, error: String(err) };
    } catch (writeErr) {
      // Nicht mal die Kopie passt noch rein – dann wenigstens nichts überschreiben.
      loadIssue = { kind: 'unreadable', rescueKey: null, bytes: raw.length, error: String(err), writeError: String(writeErr) };
    }
    console.warn('[wortschmiede] Gespeicherter Stand unlesbar, Kopie abgelegt unter', rescueKey, err);
    return emptyState();
  }
}

/** Was beim Laden schiefging – für die Warnung beim Start. */
export const getLoadIssue = () => loadIssue;
export const clearLoadIssue = () => { loadIssue = null; };

/** Beiseitegelegte Stände: Migrations-Backups und Rettungskopien. */
export function listSafetyCopies() {
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || (!k.startsWith(BACKUP_PREFIX) && !k.startsWith(RESCUE_PREFIX))) continue;
      out.push({
        key: k,
        kind: k.startsWith(BACKUP_PREFIX) ? 'backup' : 'rescue',
        bytes: (localStorage.getItem(k) || '').length,
      });
    }
  } catch { /* Speicher nicht lesbar */ }
  return out.sort((a, b) => a.key.localeCompare(b.key));
}

export const readSafetyCopy = (key) => {
  try { return localStorage.getItem(key); } catch { return null; }
};
export const deleteSafetyCopy = (key) => {
  try { localStorage.removeItem(key); } catch { /* egal */ }
};

/**
 * Bittet den Browser, den Speicher nicht automatisch zu räumen. Ohne das
 * werfen iOS und Android bei Platzmangel oder längerer Nichtnutzung auch
 * Vokabeln weg. Wir fragen erst, wenn wirklich Daten da sind – vorher wäre
 * die Nachfrage für den Nutzer nicht einzuordnen.
 */
export async function requestPersistence() {
  try {
    if (!navigator.storage?.persist) return null;
    if (await navigator.storage.persisted?.()) return true;
    return await navigator.storage.persist();
  } catch { return null; }
}

export async function isPersisted() {
  try { return (await navigator.storage?.persisted?.()) ?? null; } catch { return null; }
}

function migrate(s, raw) {
  const from = Number(s.version) || 1;
  if (from < STATE_VERSION) {
    migratedFrom = from;
    // Vor jeder Formatänderung eine Kopie des alten Standes ablegen. Kostet
    // einmal denselben Platz, rettet aber alles, falls eine Migration daneben geht.
    if (raw) {
      try { localStorage.setItem(`${BACKUP_PREFIX}v${from}`, raw); } catch { /* kein Platz – dann eben ohne */ }
    }
  }
  const base = emptyState();
  const merged = { ...base, ...s };
  merged.settings = { ...base.settings, ...(s.settings || {}) };
  merged.progress = { ...base.progress, ...(s.progress || {}) };
  merged.decks = s.decks || {};
  merged.cards = s.cards || {};
  merged.log = Array.isArray(s.log) ? s.log : [];
  for (const deck of Object.values(merged.decks)) {
    deck.direction ??= null;
    // v1 -> v2: Latein- und Altgriechisch-Decks wurden in der falschen Richtung
    // abgefragt (Deutsch -> Latein). Einmalig auf Übersetzen umstellen; wer es
    // anders will, ändert es im Deck.
    if (from < 2 && !deck.direction && defaultDirectionFor(deck.targetLanguage) === 'recognition') {
      deck.direction = 'recognition';
    }
  }
  for (const card of Object.values(merged.cards)) {
    card.srs = { ...newSrs(), ...(card.srs || {}) };
    card.alternatives ??= [];
    card.tags ??= [];
  }
  merged.version = STATE_VERSION;
  return merged;
}

let lastSaveError = 0;
const persist = debounce(() => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    if (Date.now() - lastSaveError > 5000) {
      lastSaveError = Date.now();
      window.dispatchEvent(new CustomEvent('ws:storage-full', { detail: err }));
    }
  }
}, 250);

function commit() {
  persist();
  for (const fn of listeners) fn(state);
}

export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const getState = () => state;
export const getSettings = () => state.settings;

export function setSettings(patch) {
  state.settings = { ...state.settings, ...patch };
  commit();
}

/* ---- Decks -------------------------------------------------------------- */
export function listDecks() {
  return Object.values(state.decks).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}
export const getDeck = (id) => state.decks[id] || null;

export function createDeck({ name, sourceLanguage = 'de', targetLanguage = 'en', description = '', direction = null }) {
  const deck = {
    id: uid(),
    name: name?.trim() || 'Neues Deck',
    sourceLanguage,
    targetLanguage,
    description,
    direction,                       // null = globale Einstellung der Werkbank

    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  state.decks[deck.id] = deck;
  commit();
  return deck;
}

export function updateDeck(id, patch) {
  const deck = state.decks[id];
  if (!deck) return null;
  Object.assign(deck, patch, { updatedAt: Date.now() });
  commit();
  return deck;
}

export function deleteDeck(id) {
  delete state.decks[id];
  for (const [cid, card] of Object.entries(state.cards)) {
    if (card.deckId === id) delete state.cards[cid];
  }
  commit();
}

/* ---- Karten ------------------------------------------------------------- */
export function listCards(deckId) {
  const all = Object.values(state.cards);
  return deckId ? all.filter((c) => c.deckId === deckId) : all;
}
export const getCard = (id) => state.cards[id] || null;

export function addCards(deckId, entries) {
  const existing = new Set(listCards(deckId).map((c) => keyOf(c.front, c.back)));
  let added = 0;
  let skipped = 0;
  for (const e of entries) {
    const front = String(e.front ?? '').trim();
    const back = String(e.back ?? '').trim();
    if (!front || !back) { skipped++; continue; }
    const k = keyOf(front, back);
    if (existing.has(k)) { skipped++; continue; }
    existing.add(k);
    const card = {
      id: uid(),
      deckId,
      front,
      back,
      hint: String(e.hint ?? '').trim(),
      example: String(e.example ?? '').trim(),
      exampleTranslation: String(e.exampleTranslation ?? '').trim(),
      alternatives: Array.isArray(e.alternatives) ? e.alternatives.map((a) => String(a).trim()).filter(Boolean) : [],
      tags: Array.isArray(e.tags) ? e.tags.map((t) => String(t).trim()).filter(Boolean) : [],
      createdAt: Date.now(),
      srs: newSrs(),
    };
    state.cards[card.id] = card;
    added++;
  }
  if (state.decks[deckId]) state.decks[deckId].updatedAt = Date.now();
  commit();
  return { added, skipped };
}

const keyOf = (front, back) => `${front.toLowerCase()}|${back.toLowerCase()}`;

export function updateCard(id, patch) {
  const card = state.cards[id];
  if (!card) return null;
  Object.assign(card, patch);
  commit();
  return card;
}
export function deleteCard(id) { delete state.cards[id]; commit(); }

export function resetCardProgress(id) {
  const card = state.cards[id];
  if (card) { card.srs = newSrs(); commit(); }
}

/* ---- Review speichern --------------------------------------------------- */
export function recordReview(cardId, grade, srs, meta = {}) {
  const card = state.cards[cardId];
  if (!card) return;
  card.srs = srs;
  state.log.push({ t: Date.now(), c: cardId, g: grade, s: +(srs.stability || 0).toFixed(4), d: +(srs.difficulty || 0).toFixed(3), k: meta.kind || '' });
  if (state.log.length > LOG_LIMIT) state.log.splice(0, state.log.length - LOG_LIMIT);

  const day = dayKey();
  state.progress.days[day] = (state.progress.days[day] || 0) + 1;
  state.progress.reviews += 1;
  state.progress.xp += grade === 1 ? 1 : grade === 2 ? 3 : grade === 4 ? 6 : 5;
  bumpStreak(day);
  commit();
}

function bumpStreak(day) {
  const p = state.progress;
  if (p.lastDay === day) return;
  const yesterday = dayKey(Date.now() - DAY);
  p.streak = p.lastDay === yesterday ? (p.streak || 0) + 1 : 1;
  p.lastDay = day;
  // Tagesstatistik schlank halten (ein Jahr reicht fuer die Heatmap)
  const keys = Object.keys(p.days).sort();
  if (keys.length > 400) for (const k of keys.slice(0, keys.length - 400)) delete p.days[k];
}

/* ---- Kennzahlen --------------------------------------------------------- */
export function deckStats(deckId, at = Date.now()) {
  const cards = listCards(deckId);
  const stats = { total: cards.length, new: 0, due: 0, learning: 0, mastered: 0, stages: [0, 0, 0, 0, 0, 0] };
  for (const c of cards) {
    const s = c.srs || newSrs();
    const stage = forgeStage(s);
    stats.stages[stage]++;
    if (!s.introduced) stats.new++;
    else if (s.due <= at) stats.due++;
    if (s.state === 'learning' || s.state === 'relearning') stats.learning++;
    if (stage >= 5) stats.mastered++;
  }
  return stats;
}

export function globalStats(at = Date.now()) {
  const decks = listDecks();
  const agg = { decks: decks.length, total: 0, new: 0, due: 0, mastered: 0 };
  for (const d of decks) {
    const s = deckStats(d.id, at);
    agg.total += s.total; agg.new += s.new; agg.due += s.due; agg.mastered += s.mastered;
  }
  return agg;
}

export const todayCount = () => state.progress.days[dayKey()] || 0;

/**
 * Auszeichnungsstufe eines Decks (0..5). Es zählt die SCHWÄCHSTE Karte:
 * Eine Auszeichnung gibt es erst, wenn wirklich jede Vokabel des Decks die
 * Stufe erreicht hat – sonst wäre sie geschenkt.
 */
export function deckAward(deckId) {
  const cards = listCards(deckId);
  if (!cards.length) return 0;
  let min = 5;
  for (const c of cards) {
    const stage = forgeStage(c.srs);
    if (stage < min) min = stage;
    if (min === 0) break;
  }
  return min;
}

/** Wie viele Karten fehlen noch zur nächsten Auszeichnung? */
export function awardProgress(deckId) {
  const cards = listCards(deckId);
  const level = deckAward(deckId);
  if (!cards.length) return { level, next: 1, remaining: 0, total: 0 };
  if (level >= 5) return { level, next: 5, remaining: 0, total: cards.length };
  const next = level + 1;
  return {
    level,
    next,
    remaining: cards.filter((c) => forgeStage(c.srs) < next).length,
    total: cards.length,
  };
}

/* ---- Export / Import / Loeschen ----------------------------------------- */
export function exportAll() {
  return JSON.stringify({ schema: 'wortschmiede/backup@1', exportedAt: new Date().toISOString(), state }, null, 2);
}

export function importBackup(json) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  const incoming = data.state || data;
  if (!incoming || typeof incoming !== 'object' || !incoming.cards) throw new Error('Kein gültiges Wortschmiede-Backup.');
  state = migrate(incoming);
  commit();
  return { decks: Object.keys(state.decks).length, cards: Object.keys(state.cards).length };
}

export function wipeAll() {
  state = emptyState();
  try { localStorage.removeItem(KEY); } catch { /* egal */ }
  commit();
}

export function storageUsage() {
  try {
    const bytes = new Blob([localStorage.getItem(KEY) || '']).size;
    return { bytes, kb: Math.round(bytes / 1024) };
  } catch { return { bytes: 0, kb: 0 }; }
}
