import test from 'node:test';
import assert from 'node:assert/strict';
import { newSrs, schedule, retrievability, intervalFor, forgeStage, GRADE } from '../js/fsrs.js';

const DAY = 86400000;

test('neue Karte startet ohne Historie', () => {
  const s = newSrs();
  assert.equal(s.state, 'new');
  assert.equal(s.reps, 0);
  assert.equal(s.introduced, false);
});

test('erste Bewertung setzt Stabilität und Schwierigkeit', () => {
  const { srs } = schedule(newSrs(), GRADE.GOOD);
  assert.ok(srs.stability > 0);
  assert.ok(srs.difficulty >= 1 && srs.difficulty <= 10);
  assert.equal(srs.reps, 1);
  assert.equal(srs.introduced, true);
});

test('bessere Note => höhere Stabilität', () => {
  const again = schedule(newSrs(), GRADE.AGAIN).srs.stability;
  const hard = schedule(newSrs(), GRADE.HARD).srs.stability;
  const good = schedule(newSrs(), GRADE.GOOD).srs.stability;
  const easy = schedule(newSrs(), GRADE.EASY).srs.stability;
  assert.ok(again < hard && hard < good && good < easy);
});

test('Wiederholung nach Wartezeit verlängert das Intervall', () => {
  const first = schedule(newSrs(), GRADE.GOOD, { at: 0 });
  const later = first.srs.lastReview + first.intervalDays * DAY;
  const second = schedule(first.srs, GRADE.GOOD, { at: later });
  assert.ok(second.intervalDays > first.intervalDays, `${second.intervalDays} > ${first.intervalDays}`);
});

test('Vergessen zählt als Lapse und kürzt die Stabilität', () => {
  let { srs } = schedule(newSrs(), GRADE.EASY, { at: 0 });
  ({ srs } = schedule(srs, GRADE.GOOD, { at: 10 * DAY }));
  const before = srs.stability;
  const lapsed = schedule(srs, GRADE.AGAIN, { at: 30 * DAY });
  assert.equal(lapsed.srs.lapses, 1);
  assert.ok(lapsed.srs.stability < before);
  assert.equal(lapsed.sameSession, true);
});

test('Abrufwahrscheinlichkeit fällt mit der Zeit und liegt bei t=S nahe 0.9', () => {
  const srs = { ...newSrs(), state: 'review', stability: 10, difficulty: 5, lastReview: 0, introduced: true };
  assert.ok(Math.abs(retrievability(srs, 10 * DAY) - 0.9) < 0.001);
  assert.ok(retrievability(srs, 1 * DAY) > retrievability(srs, 20 * DAY));
});

test('höhere Ziel-Behaltensrate kürzt das Intervall', () => {
  assert.ok(intervalFor(10, 0.97) < intervalFor(10, 0.8));
});

test('Schmiedestufe wächst mit der Stabilität', () => {
  assert.equal(forgeStage(newSrs()), 0);
  assert.equal(forgeStage({ introduced: true, stability: 0.5 }), 1);
  assert.equal(forgeStage({ introduced: true, stability: 3 }), 2);
  assert.equal(forgeStage({ introduced: true, stability: 100 }), 5);
});

test('Intervalle bleiben in den Grenzen', () => {
  let srs = schedule(newSrs(), GRADE.EASY, { at: 0 }).srs;
  let at = 0;
  for (let i = 0; i < 30; i++) {
    const res = schedule(srs, GRADE.EASY, { at, maxInterval: 365 });
    assert.ok(res.intervalDays <= 365);
    srs = res.srs;
    at += res.intervalDays * DAY;
  }
});
