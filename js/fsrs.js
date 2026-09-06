/* ==========================================================================
   FSRS-5 (Free Spaced Repetition Scheduler)
   ---------------------------------------------------------------------------
   Warum FSRS und nicht SM-2/Leitner: FSRS modelliert pro Karte explizit
   Stabilitaet (S, Tage bis R auf 90% faellt), Schwierigkeit (D, 1..10) und
   Abrufwahrscheinlichkeit (R). Es plant dadurch bei gleicher Behaltensrate
   spuerbar weniger Wiederholungen als die starren Intervallmultiplikatoren
   von SM-2 und die festen Boxen von Leitner.

   Die 19 Default-Gewichte stammen aus dem FSRS-5-Release (auf ~700 Mio.
   echten Reviews optimiert). Sie sind bewusst nicht personalisiert – dafuer
   braeuchte es einen Optimizer und einige tausend Reviews. Wir schreiben
   deshalb ein Review-Log mit (siehe store.js), damit spaeter optimiert
   werden kann, ohne Historie zu verlieren.

   Noten (Grades): 1 = Nochmal, 2 = Schwer, 3 = Gut, 4 = Leicht
   ========================================================================== */

import { clamp, DAY } from './util.js';

export const W = [
  0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575,
  0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621,
];

const DECAY = -0.5;
const FACTOR = 19 / 81;          // 0.9^(1/DECAY) - 1
const S_MIN = 0.01;
const S_MAX = 36500;

export const GRADE = { AGAIN: 1, HARD: 2, GOOD: 3, EASY: 4 };

/** Frische Karte ohne Lernhistorie. */
export function newSrs() {
  return { state: 'new', stability: 0, difficulty: 0, due: 0, lastReview: 0, reps: 0, lapses: 0, introduced: false };
}

/** Abrufwahrscheinlichkeit R nach t Tagen bei Stabilitaet s (Potenz-Vergessenskurve). */
export function retrievability(srs, at = Date.now()) {
  // Achtung: lastReview darf 0 sein (Epoch); nur "nie gelernt" ergibt 0.
  if (!srs || !srs.introduced || srs.state === 'new' || !srs.stability) return 0;
  const t = Math.max(0, (at - (srs.lastReview || 0)) / DAY);
  return Math.pow(1 + FACTOR * (t / srs.stability), DECAY);
}

/** Intervall in Tagen, das genau auf die gewuenschte Behaltensrate fuehrt. */
export function intervalFor(stability, desiredRetention = 0.9) {
  const r = clamp(desiredRetention, 0.7, 0.98);
  return (stability / FACTOR) * (Math.pow(r, 1 / DECAY) - 1);
}

const initialStability = (g) => clamp(W[g - 1], S_MIN, S_MAX);
const initialDifficulty = (g) => clamp(W[4] - Math.exp(W[5] * (g - 1)) + 1, 1, 10);

function nextDifficulty(d, g) {
  const delta = -W[6] * (g - 3);
  const damped = d + delta * ((10 - d) / 9);      // lineares Daempfen (FSRS-5)
  const reverted = W[7] * initialDifficulty(4) + (1 - W[7]) * damped;
  return clamp(reverted, 1, 10);
}

function stabilityAfterRecall(d, s, r, g) {
  const hard = g === GRADE.HARD ? W[15] : 1;
  const easy = g === GRADE.EASY ? W[16] : 1;
  const inc = Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1) * hard * easy;
  return clamp(s * (1 + inc), S_MIN, S_MAX);
}

function stabilityAfterLapse(d, s, r) {
  const post = W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r));
  return clamp(Math.min(post, s), S_MIN, S_MAX);
}

/** Wiederholung am selben Tag (Lernschritte) veraendert S nur leicht. */
function shortTermStability(s, g) {
  return clamp(s * Math.exp(W[17] * (g - 3 + W[18])), S_MIN, S_MAX);
}

/**
 * Plant eine Karte neu.
 * @returns {{srs: object, intervalDays: number, sameSession: boolean}}
 */
export function schedule(srsIn, grade, opts = {}) {
  const at = opts.at ?? Date.now();
  const desiredRetention = opts.desiredRetention ?? 0.9;
  const maxInterval = opts.maxInterval ?? 3650;
  const srs = { ...newSrs(), ...(srsIn || {}) };
  const g = clamp(Math.round(grade), 1, 4);

  let stability;
  let difficulty;

  if (srs.state === 'new' || !srs.stability) {
    stability = initialStability(g);
    difficulty = initialDifficulty(g);
  } else {
    const r = retrievability(srs, at);
    const sameDay = at - srs.lastReview < DAY * 0.5;
    difficulty = nextDifficulty(srs.difficulty || initialDifficulty(3), g);
    if (sameDay) stability = shortTermStability(srs.stability, g);
    else if (g === GRADE.AGAIN) stability = stabilityAfterLapse(difficulty, srs.stability, r);
    else stability = stabilityAfterRecall(difficulty, srs.stability, r, g);
  }

  const lapsed = g === GRADE.AGAIN && srs.state === 'review';
  let intervalDays = intervalFor(stability, desiredRetention);
  let sameSession = false;
  let state = 'review';

  if (g === GRADE.AGAIN) {
    // Lernschritt: in derselben Sitzung erneut zeigen, Fälligkeit in Minuten.
    state = srs.state === 'new' ? 'learning' : 'relearning';
    intervalDays = 1 / 144;                 // ~10 Minuten
    sameSession = true;
  } else if (srs.state === 'new' && g === GRADE.HARD) {
    state = 'learning';
    intervalDays = 1 / 96;                  // ~15 Minuten
    sameSession = true;
  } else {
    intervalDays = clamp(Math.round(intervalDays), 1, maxInterval);
  }

  return {
    srs: {
      state,
      stability,
      difficulty,
      due: at + intervalDays * DAY,
      lastReview: at,
      reps: (srs.reps || 0) + 1,
      lapses: (srs.lapses || 0) + (lapsed ? 1 : 0),
      introduced: true,
    },
    intervalDays,
    sameSession,
  };
}

/** Vorschau der vier Buttons ohne Zustandsaenderung – fuer die Notenleiste. */
export function previewIntervals(srs, opts = {}) {
  return [1, 2, 3, 4].map((g) => schedule(srs, g, opts).intervalDays);
}

/**
 * Schmiedestufe 0..5 – die sichtbare Fortschrittsmetapher.
 * Abgeleitet aus der Stabilitaet, damit sie ehrlich das Gedaechtnis abbildet.
 */
export function forgeStage(srs) {
  if (!srs || !srs.introduced) return 0;
  const s = srs.stability || 0;
  if (s < 1) return 1;
  if (s < 7) return 2;
  if (s < 21) return 3;
  if (s < 60) return 4;
  return 5;
}
