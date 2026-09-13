import test from 'node:test';
import assert from 'node:assert/strict';

/* store.js liest den Speicher beim Import. Für jedes Szenario braucht es
   deshalb einen frischen Mock und einen frischen Modulimport (Cache-Bust). */
function mockStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    get length() { return data.size; },
    key: (i) => [...data.keys()][i] ?? null,
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    clear: () => data.clear(),
    _dump: () => Object.fromEntries(data),
  };
}

let n = 0;
async function loadStore(initial) {
  const store = mockStorage(initial);
  globalThis.localStorage = store;
  globalThis.window = { dispatchEvent() {}, addEventListener() {} };
  globalThis.CustomEvent = class { constructor(t, o) { this.type = t; Object.assign(this, o); } };
  const mod = await import(`../js/store.js?case=${++n}`);
  return { mod, store };
}

const gueltigerStand = (version = 2) => JSON.stringify({
  version,
  decks: { d1: { id: 'd1', name: 'Unit 1', sourceLanguage: 'de', targetLanguage: 'en', createdAt: 1, updatedAt: 1 } },
  cards: { c1: { id: 'c1', deckId: 'd1', front: 'der Apfel', back: 'apple' } },
  settings: { theme: 'forge' },
  progress: { xp: 12, streak: 3, lastDay: null, days: {}, reviews: 7 },
  log: [],
});

test('ein gültiger Stand wird unverändert geladen', async () => {
  const { mod } = await loadStore({ 'wortschmiede.v1': gueltigerStand() });
  assert.equal(mod.listDecks().length, 1);
  assert.equal(mod.listCards('d1').length, 1);
  assert.equal(mod.getState().progress.xp, 12);
  assert.equal(mod.getLoadIssue(), null);
});

test('ein beschädigter Stand wird nicht überschrieben, sondern gerettet', async () => {
  const kaputt = gueltigerStand().slice(0, 120);          // abgeschnitten wie bei vollem Speicher
  const { mod, store } = await loadStore({ 'wortschmiede.v1': kaputt });

  const issue = mod.getLoadIssue();
  assert.equal(issue.kind, 'unreadable');
  assert.ok(issue.rescueKey?.startsWith('wortschmiede.rescue.'));
  assert.equal(store.getItem(issue.rescueKey), kaputt, 'Rohdaten müssen erhalten bleiben');

  const kopien = mod.listSafetyCopies();
  assert.equal(kopien.length, 1);
  assert.equal(kopien[0].kind, 'rescue');
  assert.equal(mod.readSafetyCopy(issue.rescueKey), kaputt);
});

test('vor einer Formatmigration wird der alte Stand kopiert', async () => {
  const alt = gueltigerStand(1);
  const { mod, store } = await loadStore({ 'wortschmiede.v1': alt });
  assert.equal(store.getItem('wortschmiede.backup.v1'), alt);
  assert.equal(mod.getState().version, 2);
  assert.equal(mod.listCards('d1').length, 1, 'die Karten müssen die Migration überleben');
});

test('leerer Speicher ist kein Fehlerfall', async () => {
  const { mod } = await loadStore({});
  assert.equal(mod.getLoadIssue(), null);
  assert.equal(mod.listDecks().length, 0);
  assert.equal(mod.listSafetyCopies().length, 0);
});

test('gesperrter Speicher wird gemeldet, nicht verschluckt', async () => {
  globalThis.localStorage = {
    get length() { return 0; },
    key: () => null,
    getItem() { throw new Error('SecurityError'); },
    setItem() { throw new Error('SecurityError'); },
    removeItem() {},
  };
  globalThis.window = { dispatchEvent() {}, addEventListener() {} };
  const mod = await import(`../js/store.js?case=blocked${++n}`);
  assert.equal(mod.getLoadIssue().kind, 'blocked');
});

test('Sicherungskopien lassen sich entfernen', async () => {
  const { mod } = await loadStore({ 'wortschmiede.v1': gueltigerStand(1) });
  assert.equal(mod.listSafetyCopies().length, 1);
  mod.deleteSafetyCopy('wortschmiede.backup.v1');
  assert.equal(mod.listSafetyCopies().length, 0);
});
