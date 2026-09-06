import test from 'node:test';
import assert from 'node:assert/strict';
import { parseImport } from '../js/parse.js';

test('liest sauberes Schema-JSON', () => {
  const res = parseImport(JSON.stringify({
    schema: 'wortschmiede/deck@1', name: 'Unit 1', sourceLanguage: 'de', targetLanguage: 'en',
    cards: [{ front: 'der Apfel', back: 'apple', hint: 'Plural: apples' }],
  }));
  assert.equal(res.ok, true);
  assert.equal(res.deck.name, 'Unit 1');
  assert.equal(res.deck.cards[0].back, 'apple');
});

test('holt JSON aus einem Markdown-Codeblock', () => {
  const res = parseImport('Klar, hier deine Vokabeln:\n```json\n{"cards":[{"front":"Haus","back":"house"}]}\n```\nViel Erfolg!');
  assert.equal(res.ok, true);
  assert.equal(res.deck.cards.length, 1);
});

test('akzeptiert ein blankes Array', () => {
  const res = parseImport('[{"front":"Hund","back":"dog"},{"front":"Katze","back":"cat"}]');
  assert.equal(res.ok, true);
  assert.equal(res.deck.cards.length, 2);
});

test('erkennt deutsche Feldnamen', () => {
  const res = parseImport('[{"deutsch":"Baum","englisch":"tree","wortart":"Nomen"}]');
  assert.equal(res.ok, true);
  assert.equal(res.deck.cards[0].front, 'Baum');
  assert.equal(res.deck.cards[0].back, 'tree');
  assert.equal(res.deck.cards[0].hint, 'Nomen');
});

test('fällt auf Zeilenformat zurück', () => {
  const res = parseImport('der Tisch – table\ndie Tür; door\ndas Fenster\twindow');
  assert.equal(res.ok, true);
  assert.equal(res.deck.cards.length, 3);
  assert.ok(res.warnings.some((w) => w.includes('Tabelle')));
});

test('liest Markdown-Tabellen', () => {
  const res = parseImport('| Deutsch | Englisch |\n|---|---|\n| Buch | book |\n| Stift | pen |');
  assert.equal(res.ok, true);
  assert.equal(res.deck.cards.length, 2);
});

test('Alternativen als Text werden zur Liste', () => {
  const res = parseImport('[{"front":"schnell","back":"fast","alternatives":"quick, rapid"}]');
  assert.deepEqual(res.deck.cards[0].alternatives, ['quick', 'rapid']);
});

test('meldet Unbrauchbares statt still zu scheitern', () => {
  assert.equal(parseImport('').ok, false);
  assert.equal(parseImport('Tut mir leid, ich kann das Bild nicht lesen.').ok, false);
});
