import test from 'node:test';
import assert from 'node:assert/strict';
import { gradeText, normalizeAnswer, levenshtein, humanDue, DAY } from '../js/util.js';

test('exakte Antwort wird erkannt', () => {
  assert.equal(gradeText('apple', ['apple']), 'exact');
  assert.equal(gradeText('  Apple ', ['apple']), 'exact');
});

test('Artikel und Klammern stören nicht', () => {
  assert.equal(normalizeAnswer('der Apfel'), 'apfel');
  assert.equal(gradeText('the house', ['house']), 'exact');
  assert.equal(gradeText('house (building)', ['house']), 'exact');
});

test('Tippfehler nur mit Toleranz', () => {
  assert.equal(gradeText('aple', ['apple']), 'wrong');
  assert.equal(gradeText('aple', ['apple'], { typoTolerance: true }), 'typo');
  assert.equal(gradeText('banana', ['apple'], { typoTolerance: true }), 'wrong');
});

test('kurze Wörter bekommen keine Toleranz', () => {
  assert.equal(gradeText('cap', ['cat'], { typoTolerance: true }), 'wrong');
});

test('Alternativen zählen als richtig', () => {
  assert.equal(gradeText('pricey', ['expensive', 'pricey']), 'exact');
});

test('Akzente optional ignorieren', () => {
  assert.equal(gradeText('creme', ['crème'], { ignoreAccents: true }), 'exact');
  assert.equal(gradeText('creme', ['crème']), 'wrong');
});

test('leere Eingabe ist falsch', () => {
  assert.equal(gradeText('   ', ['apple'], { typoTolerance: true }), 'wrong');
});

test('Levenshtein rechnet richtig', () => {
  assert.equal(levenshtein('kitten', 'sitting'), 3);
  assert.equal(levenshtein('abc', 'abc'), 0);
});

test('Fälligkeit wird lesbar formatiert', () => {
  assert.equal(humanDue(Date.now() - 1000), 'fällig');
  assert.match(humanDue(Date.now() + 3 * DAY), /in 3 T/);
  assert.match(humanDue(Date.now() + 400 * DAY), /J$/);
});
