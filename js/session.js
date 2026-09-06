/* ==========================================================================
   Sitzungslogik der Abfrage.

   Zwei Entscheidungen stecken hier drin:

   1) WELCHE Karte kommt dran?  -> FSRS-Faelligkeit, neue Karten kontingentiert
      und eingestreut (Interleaving statt Blockuebung). Karten, die man gerade
      falsch hatte, kommen in derselben Sitzung wieder – aber mit Abstand,
      nicht direkt hinterher.

   2) WIE wird gefragt?  -> Formatleiter. Freies Produzieren (tippen) hat den
      staerksten Testing-Effekt, ueberfordert aber beim Erstkontakt. Also:
      Multiple Choice -> Buchstaben legen -> frei tippen, mit Wischkarten fuer
      laengst sitzende Vokabeln (schnelle Runden statt Tipparbeit).
   ========================================================================== */

import { shuffle, sample, clamp, gradeText } from './util.js';
import { GRADE, schedule, retrievability } from './fsrs.js';
import { listCards, getDeck, getSettings, recordReview } from './store.js';

export const KIND_LABEL = {
  choice: 'Erkennen',
  type: 'Schmieden',
  letters: 'Buchstaben legen',
  swipe: 'Durchblättern',
  listen: 'Hören',
};

/** Karten, die heute anstehen – faellig zuerst, neue nach Kontingent. */
export function buildQueue({ deckIds, limit, includeNew = true, ahead = false, at = Date.now() }) {
  const s = getSettings();
  const pool = listCards().filter((c) => !deckIds?.length || deckIds.includes(c.deckId));

  const due = pool
    .filter((c) => c.srs.introduced && c.srs.due <= at)
    .sort((a, b) => a.srs.due - b.srs.due);

  const fresh = includeNew
    ? pool.filter((c) => !c.srs.introduced).slice(0, s.newPerDay)
    : [];

  let queue = interleave(due, fresh);

  if (!queue.length && ahead) {
    // Nichts faellig: die am wenigsten sicheren Karten vorziehen.
    queue = pool
      .filter((c) => c.srs.introduced)
      .map((c) => ({ c, r: retrievability(c.srs, at) }))
      .sort((a, b) => a.r - b.r)
      .slice(0, limit || s.sessionSize)
      .map((x) => x.c);
  }

  return queue.slice(0, limit || s.sessionSize);
}

/** Neue Karten gleichmaessig zwischen die faelligen mischen. */
function interleave(due, fresh) {
  if (!fresh.length) return due;
  if (!due.length) return fresh;
  const out = [];
  const gap = Math.max(2, Math.ceil(due.length / (fresh.length + 1)));
  let f = 0;
  due.forEach((card, i) => {
    out.push(card);
    if ((i + 1) % gap === 0 && f < fresh.length) out.push(fresh[f++]);
  });
  while (f < fresh.length) out.push(fresh[f++]);
  return out;
}

/**
 * Richtung eines Decks: die Deck-Einstellung schlaegt die globale.
 * Latein-Decks werden beim Import auf "recognition" gesetzt, Englisch-Decks
 * bleiben bei der Vorgabe aus der Werkbank.
 */
export function effectiveDirection(deck, settings = getSettings()) {
  return deck?.direction || settings.direction;
}

function chooseDirection(card, settings) {
  const mode = effectiveDirection(getDeck(card.deckId), settings);
  if (mode === 'production') return 'production';
  if (mode === 'recognition') return 'recognition';
  // "both": erst erkennen, spaeter produzieren – und dann abwechseln.
  if (card.srs.reps < 2) return 'recognition';
  return Math.random() < 0.6 ? 'production' : 'recognition';
}

function chooseKind(card, { poolSize, settings, speech }) {
  const { reps, stability, state } = card.srs;
  const relearning = state === 'relearning';

  if (!card.srs.introduced || reps === 0) return poolSize >= 4 ? 'choice' : 'letters';
  if (relearning) return poolSize >= 4 && Math.random() < 0.5 ? 'choice' : 'letters';
  if (reps <= 2) return Math.random() < 0.55 ? 'letters' : 'type';
  if (settings.swipeMode && stability > 45 && Math.random() < 0.5) return 'swipe';
  if (speech && settings.speech && Math.random() < 0.15) return 'listen';
  return 'type';
}

/** Baut die konkrete Aufgabe zu einer Karte. */
export function buildTask(card, pool, { speech = false } = {}) {
  const settings = getSettings();
  const direction = chooseDirection(card, settings);
  const kind = chooseKind(card, { poolSize: pool.length, settings, speech });

  const askWithFront = direction === 'production';   // Frage in bekannter Sprache
  const promptText = askWithFront ? card.front : card.back;
  const solution = askWithFront ? card.back : card.front;
  // Alternativen gelten in beide Richtungen: KI-Tools füllen das Feld mal mit
  // Synonymen der Zielsprache, mal – gerade bei Latein – mit den weiteren
  // deutschen Bedeutungen. Beides als richtig zu werten ist die einzige
  // Lesart, die keine korrekte Antwort fälschlich ablehnt.
  const solutions = [solution, ...(card.alternatives || [])];

  const task = {
    id: card.id + ':' + Date.now(),
    card,
    kind,
    direction,
    promptText,
    solution,
    solutions,
    // Hinweise aus dem Buch stehen oft in der Zielsprache ("Plural: apples").
    // Als Frage-Hinweis waeren sie ein Spoiler – dann erst im Feedback zeigen.
    hint: spoilerFree(card.hint, solutions),
    startedAt: Date.now(),
    attempts: 0,
  };

  if (kind === 'choice' || kind === 'listen') {
    const distractors = sample(
      pool.filter((c) => c.id !== card.id).map((c) => (askWithFront ? c.back : c.front)).filter((v) => v && v !== solution),
      3,
    );
    task.choices = shuffle([solution, ...distractors]);
    if (task.choices.length < 2) task.kind = 'letters';
  }

  if (task.kind === 'letters') {
    task.tiles = shuffle([...solution].map((ch, i) => ({ ch, i })));
  }

  if (kind === 'listen') {
    task.speakText = solution;
    task.speakLang = askWithFront ? null : null;
  }

  return task;
}

/** Verraet der Hinweis die Loesung? Dann in der Frage weglassen. */
function spoilerFree(hint, solutions) {
  if (!hint) return '';
  const h = hint.toLowerCase();
  return solutions.some((sol) => sol && h.includes(String(sol).toLowerCase())) ? '' : hint;
}

/** Antwortauswertung -> FSRS-Note. */
export function gradeAnswer(task, input) {
  const settings = getSettings();
  const seconds = (Date.now() - task.startedAt) / 1000;

  if (task.kind === 'swipe') return { grade: input.grade, verdict: input.grade === GRADE.AGAIN ? 'wrong' : 'exact' };

  if (task.kind === 'choice' || task.kind === 'listen') {
    const correct = input.value === task.solution;
    if (!correct) return { grade: GRADE.AGAIN, verdict: 'wrong' };
    return { grade: seconds > 8 ? GRADE.HARD : GRADE.GOOD, verdict: 'exact' };
  }

  if (task.kind === 'letters') {
    const correct = String(input.value || '').trim() === task.solution.trim();
    if (!correct) return { grade: GRADE.AGAIN, verdict: 'wrong' };
    return { grade: task.attempts > 1 ? GRADE.HARD : GRADE.GOOD, verdict: 'exact' };
  }

  // kind === 'type'
  const verdict = gradeText(input.value, task.solutions, {
    typoTolerance: settings.typoTolerance,
    ignoreAccents: settings.ignoreAccents,
    ignoreArticles: settings.ignoreArticles,
  });
  if (verdict === 'wrong') return { grade: GRADE.AGAIN, verdict };
  if (verdict === 'typo' || verdict === 'accent') return { grade: GRADE.HARD, verdict };
  const fast = seconds < 4 && task.card.srs.stability > 10;
  return { grade: fast ? GRADE.EASY : GRADE.GOOD, verdict };
}

/** Note anwenden, speichern, Intervall zurueckgeben. */
export function applyGrade(card, grade, kind) {
  const settings = getSettings();
  const res = schedule(card.srs, grade, {
    desiredRetention: settings.desiredRetention,
    maxInterval: settings.maxInterval,
  });
  recordReview(card.id, grade, res.srs, { kind });
  return res;
}

/** Falsch beantwortete Karte mit Abstand zurueck in die Warteschlange. */
export function requeue(queue, index, card, gapMin = 3, gapMax = 6) {
  const pos = clamp(index + Math.floor(gapMin + Math.random() * (gapMax - gapMin)), index + 1, queue.length);
  queue.splice(pos, 0, card);
  return queue;
}
