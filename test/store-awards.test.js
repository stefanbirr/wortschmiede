import test from 'node:test';
import assert from 'node:assert/strict';
import { forgeStage, newSrs } from '../js/fsrs.js';

/* Die Auszeichnungslogik ist bewusst simpel, aber ihre Regel ist die wichtige:
   es zählt die schwächste Karte. Hier ohne localStorage nachgebaut. */
const deckAward = (cards) => (cards.length ? Math.min(...cards.map((c) => forgeStage(c.srs))) : 0);

const card = (stability) => ({ srs: stability === null ? newSrs() : { ...newSrs(), introduced: true, stability } });

test('leeres Deck hat keine Auszeichnung', () => {
  assert.equal(deckAward([]), 0);
});

test('eine unbearbeitete Karte verhindert die Auszeichnung', () => {
  assert.equal(deckAward([card(100), card(100), card(null)]), 0);
});

test('die schwächste Karte bestimmt die Stufe', () => {
  assert.equal(deckAward([card(100), card(3), card(50)]), 2);
});

test('höchste Auszeichnung erst, wenn jede Karte oben ist', () => {
  assert.equal(deckAward([card(200), card(180), card(70)]), 5);
  assert.equal(deckAward([card(200), card(180), card(30)]), 4);
});
