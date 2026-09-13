/* ==========================================================================
   Abfrage ("Schmieden").

   Aufgabenformate wechseln bewusst durch (siehe session.js):
     Vorstellen                 – neue Vokabel wird erst gezeigt, dann gefragt
     Erkennen (Multiple Choice) – Einstieg bei neuen Vokabeln
     Buchstaben legen           – Bruecke zur freien Produktion
     Schmieden (tippen)         – staerkster Abrufeffekt, das Kernformat
     Durchblättern (wischen)    – schnelle Runden fuer sitzende Vokabeln
     Hören                      – Aussprache koppeln (wenn Stimme vorhanden)
   ========================================================================== */

import { el, humanDue } from '../util.js';
import { listDecks, listCards, getDeck, getSettings, deckAward } from '../store.js';
import { GRADE, forgeStage, previewIntervals } from '../fsrs.js';
import { buildQueue, buildTask, gradeAnswer, applyGrade, requeue, effectiveDirection, KIND_LABEL } from '../session.js';
import { speak, speechAvailable, sfx, buzz, sparks, hit } from '../fx.js';
import { t, stageName, award, iconEl } from '../themes.js';
import { bar, empty, stageDots, toast, medal } from '../ui.js';
import { navigate } from '../router.js';
import { attachSwipe } from '../gesture.js';
import { deckPicker, ALL_DECKS } from './learn.js';
import { icon as svgIcon } from '../icons.js';

export function render(params) {
  const decks = listDecks();
  if (!decks.length) {
    return empty(iconEl('import', { size: 46 }), 'Keine Vokabeln da', 'Importiere zuerst eine Buchseite.',
      el('button.btn.btn--primary', { style: 'margin-top:12px', onclick: () => navigate('/import') }, 'Zum Import'));
  }
  if (!params.deckId) {
    if (decks.length === 1) return sessionView(decks[0]);
    return deckPicker(decks, 'schmieden', t('quiz'));
  }

  const deck = params.deckId === 'alle' ? ALL_DECKS : getDeck(params.deckId);
  if (!deck) { navigate('/schmieden', { replace: true }); return el('div'); }
  return sessionView(deck);
}

function deckCards(deck) {
  return deck.id === 'alle' ? listCards() : listCards(deck.id);
}

function sessionView(deck) {
  const root = el('div.stack');
  const settings = getSettings();
  const deckIds = deck.id === 'alle' ? null : [deck.id];

  let queue = buildQueue({ deckIds, limit: settings.sessionSize });
  if (!queue.length) {
    const ahead = buildQueue({ deckIds, limit: settings.sessionSize, includeNew: false, ahead: true });
    root.append(el('section.panel.center', {},
      el('div', { style: 'margin-bottom:6px' }, iconEl('good', { size: 44 })),
      el('h2', {}, 'Nichts fällig'),
      el('p.muted', {}, 'Alle Vokabeln dieses Decks sitzen für heute. Nächste Wiederholung: ' + nextDueLabel(deck)),
      ahead.length
        ? el('button.btn.btn--primary', { onclick: () => start(ahead, true) }, 'Trotzdem üben (vorziehen)')
        : el('button.btn', { onclick: () => navigate('/lernen/' + deck.id) }, 'Zum Einprägen')));
    return root;
  }
  start(queue, false);
  return root;

  function nextDueLabel(d) {
    const next = deckCards(d).filter((c) => c.srs.introduced).map((c) => c.srs.due).sort((a, b) => a - b)[0];
    return next ? humanDue(next) : '–';
  }

  function start(initialQueue, isAhead) {
    queue = [...initialQueue];
    const planned = queue.length;
    const pool = deckCards(deck);
    const stats = { done: 0, right: 0, wrong: 0, again: 0, startedAt: Date.now() };
    // Wie oft eine Karte in DIESER Sitzung schon zurueckkam. Ohne Deckel haengt
    // man an einer Vokabel fest, die gerade partout nicht sitzt – nach zwei
    // Anlaeufen ist Schluss, FSRS legt sie ohnehin zeitnah wieder vor.
    const retries = new Map();
    const MAX_RETRIES = 2;
    // Welche neuen Karten in dieser Sitzung schon vorgestellt wurden.
    const introShown = new Set();
    let index = 0;

    // Auszeichnungsstand vor der Sitzung merken, um Aufstiege zu feiern.
    const decksInPlay = [...new Set(queue.map((c) => c.deckId))];
    const awardsBefore = new Map(decksInPlay.map((id) => [id, deckAward(id)]));

    const head = el('div.quiz-head');
    const progressBar = bar(0);
    const counter = el('span.small.muted');
    head.append(
      el('button.btn.btn--sm.btn--ghost', { onclick: () => confirmQuit(), 'aria-label': 'Abfrage beenden' }, svgIcon('x', { size: 18 })),
      progressBar, counter);

    const host = el('div');
    root.innerHTML = '';
    root.append(head, host);
    if (isAhead) root.append(el('p.small.muted.center', {}, 'Vorgezogene Wiederholung – zählt normal für die Planung.'));

    const onKey = (e) => {
      const task = host.__task;
      if (host.__locked) {
        // Auflösung steht: Enter oder Leertaste blättern weiter.
        if (e.key === 'Enter' || e.key === ' ') {
          const cont = host.querySelector('.btn--block');
          if (cont) { e.preventDefault(); cont.click(); }
        }
        return;
      }
      if (!task) return;
      if ((task.kind === 'choice' || task.kind === 'listen') && /^[1-4]$/.test(e.key)) {
        host.querySelectorAll('.choice')[Number(e.key) - 1]?.click();
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.dataset.focus = '1';
    root.__cleanup = () => {
      document.removeEventListener('keydown', onKey);
      delete document.body.dataset.focus;
      try { speechSynthesis?.cancel(); } catch { /* egal */ }
    };

    function updateHead() {
      const total = Math.max(planned, stats.done + queue.length - index);
      progressBar.querySelector('.bar__fill').style.width = `${(stats.done / Math.max(1, total)) * 100}%`;
      counter.textContent = `${stats.done}/${total}`;
    }

    function nextTask() {
      if (index >= queue.length) return finish();
      const card = queue[index];

      /*
       * Eine Vokabel, die man noch nie gesehen hat, kann man nicht wissen –
       * sie abzufragen wäre Raten. Deshalb wird sie erst einmal gezeigt
       * (früher der eigene Modus "Einprägen"), und direkt danach kommt die
       * erste Aufgabe zur selben Karte.
       */
      if (!card.srs.introduced && !introShown.has(card.id)) {
        introShown.add(card.id);
        showIntro(card);
        return;
      }
      const task = buildTask(card, pool, { speech: speechAvailable() });
      host.__task = task;
      host.__locked = false;
      host.innerHTML = '';
      host.append(renderTask(task, deck, submit));
      updateHead();
      if (task.kind === 'listen') setTimeout(() => speak(task.speakText, langFor(task, deck)), 250);
      const focusTarget = host.querySelector('input[type="text"]');
      focusTarget?.focus({ preventScroll: true });
    }

    /** Neue Vokabel in Ruhe zeigen – ohne Bewertung, ohne Zeitdruck. */
    function showIntro(card) {
      host.__task = null;
      host.__locked = false;
      host.innerHTML = '';
      const production = effectiveDirection(deck.id === 'alle' ? getDeck(card.deckId) : deck) !== 'recognition';
      const frage = production ? card.front : card.back;
      const loesung = production ? card.back : card.front;
      const lang = production ? (deck.targetLanguage || 'en') : (deck.sourceLanguage || 'de');

      const weiter = el('button.btn.btn--primary.btn--block', { style: 'margin-top:12px', onclick: nextTask }, 'Verstanden');
      host.append(
        el('div.quiz-prompt', {},
          el('div.quiz-prompt__kind', {}, 'Neue Vokabel'),
          el('div.quiz-prompt__word', {}, frage),
          el('div.intro__answer', {}, loesung),
          card.hint ? el('div.quiz-prompt__hint', {}, card.hint) : null,
          card.example ? el('div.small.muted', { style: 'margin-top:10px' }, `„${card.example}“`) : null,
          card.exampleTranslation ? el('div.small.muted', {}, card.exampleTranslation) : null,
          speechAvailable()
            ? el('button.btn.btn--sm', { style: 'margin-top:12px', onclick: () => speak(loesung, lang) }, 'Vorlesen')
            : null),
        weiter,
      );
      updateHead();
      if (getSettings().speech) speak(loesung, lang);
      weiter.focus({ preventScroll: true });
    }

    function submit(task, input) {
      if (host.__locked) return;
      host.__locked = true;
      const { grade, verdict } = gradeAnswer(task, input);
      const res = applyGrade(task.card, grade, task.kind);
      stats.done++;
      if (grade === GRADE.AGAIN) { stats.wrong++; stats.again++; } else stats.right++;

      showFeedback(task, grade, verdict, res, () => {
        index++;
        if (grade === GRADE.AGAIN) {
          const n = (retries.get(task.card.id) || 0) + 1;
          retries.set(task.card.id, n);
          if (n <= MAX_RETRIES) requeue(queue, index, task.card);
        }
        nextTask();
      });
    }

    function showFeedback(task, grade, verdict, res, done) {
      const ok = grade !== GRADE.AGAIN;
      // Aufgabe einfrieren – nach der Antwort soll niemand weitertippen.
      for (const node of host.querySelectorAll('input, button, select')) node.disabled = true;
      const card = host.querySelector('.quiz-prompt, .swipe-card, .flipcard');
      if (ok) {
        sfx('good'); buzz(12); sparks(card, verdict === 'exact' ? 18 : 10); hit(card);
      } else {
        sfx('bad'); buzz([20, 40, 20]);
        sliceCard(card, task.promptText);
      }

      const near = verdict === 'typo' || verdict === 'accent';
      const box = el('div' + (ok ? (near ? '.verdict.verdict--near' : '.verdict.verdict--ok') : '.verdict.verdict--bad'), {},
        el('div.row.row--between', {},
          el('b', {}, ok ? (near ? t('near') : t('correct')) : t('wrong')),
          el('span.chip', {}, `${stageName(forgeStage(res.srs))} · ${humanDue(res.srs.due)}`)),
        el('div.verdict__solution', {}, task.solution),
        verdict === 'accent' ? el('div.small.muted', {}, 'Nur die Längenstriche bzw. Akzente fehlten.') : null,
        task.card.alternatives?.length ? el('div.small.muted', {}, 'auch: ' + task.card.alternatives.join(', ')) : null,
        task.card.example ? el('div.small.muted', { style: 'margin-top:6px' }, `„${task.card.example}“`) : null,
        task.card.exampleTranslation ? el('div.small.muted', {}, task.card.exampleTranslation) : null,
        speechAvailable() ? el('button.btn.btn--sm', { style: 'margin-top:8px', onclick: () => speak(task.solution, langFor(task, deck, true)), 'aria-label': 'Vorlesen' }, svgIcon('volume2', { size: 16 })) : null,
      );

      /*
       * Bewusst kein automatisches Weiterspringen: Auch bei einer richtigen
       * Antwort soll die Lösung einen Moment stehen bleiben. Gerade beim
       * Ankreuzen ist dieser Blick auf das richtige Wort der eigentliche
       * Lerneffekt – wer sofort zur nächsten Karte geschoben wird, liest ihn nie.
       */
      let advanced = false;
      const advance = () => { if (advanced) return; advanced = true; done(); };
      const cont = el('button.btn.btn--primary.btn--block', { style: 'margin-top:10px', onclick: advance }, 'Weiter');
      host.append(box, cont);
      box.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
      cont.focus({ preventScroll: true });
    }

    function finish() {
      root.__cleanup?.();
      const secs = Math.round((Date.now() - stats.startedAt) / 1000);
      const quote = stats.done ? Math.round((stats.right / stats.done) * 100) : 0;
      root.innerHTML = '';

      // Neue Auszeichnungen zuerst – das ist die eigentliche Belohnung.
      for (const id of decksInPlay) {
        const now = deckAward(id);
        const before = awardsBefore.get(id) ?? 0;
        if (now <= before) continue;
        const a = award(now);
        if (!a) continue;
        const deckName = getDeck(id)?.name || '';
        root.append(el('div.award-banner', {},
          medal(a, { size: 46 }),
          el('div.award-banner__text', {},
            el('b', {}, a.name),
            el('span.small.muted', {}, `${deckName}: jede Vokabel steht jetzt auf ${stageName(now)}.`))));
      }
      const celebrate = root.querySelector('.award-banner');

      root.append(el('section.panel.center', {},
        el('h1', {}, t('done')),
        el('div.stat-grid', { style: 'margin:12px 0' },
          el('div.stat', {}, el('b', {}, String(stats.done)), el('span', {}, 'Karten')),
          el('div.stat', {}, el('b', {}, `${quote}%`), el('span', {}, 'richtig')),
          el('div.stat', {}, el('b', {}, `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`), el('span', {}, 'Zeit'))),
        el('p.muted.small', {}, stats.again
          ? `${retries.size} ${retries.size === 1 ? 'Vokabel sitzt' : 'Vokabeln sitzen'} noch nicht – die kommen bald wieder.`
          : 'Alles auf Anhieb getroffen. Stark.'),
        el('div.row', { style: 'justify-content:center; margin-top:12px' },
          el('button.btn.btn--primary', { onclick: () => navigate('/') }, 'Fertig'),
          el('button.btn', { onclick: () => { const q = buildQueue({ deckIds, limit: getSettings().sessionSize }); if (q.length) start(q, false); else toast('Für heute ist alles erledigt.'); } }, 'Noch eine Runde'))));
      sparks(celebrate || root.querySelector('.panel'), celebrate ? 44 : 26);
      sfx('good');
      if (celebrate) {
        buzz([30, 60, 30, 60, 60]);
        setTimeout(() => { sparks(celebrate, 30); sfx('good'); }, 380);
      }
    }

    function confirmQuit() {
      navigate(deck.id === 'alle' ? '/' : `/deck/${deck.id}`);
    }

    nextTask();
  }
}

function langFor(task, deck, solutionSide = false) {
  const src = deck.sourceLanguage || 'de';
  const tgt = deck.targetLanguage || 'en';
  if (solutionSide) return task.direction === 'production' ? tgt : src;
  return task.direction === 'production' ? src : tgt;
}

/* ---- Aufgaben-Renderer -------------------------------------------------- */

function promptBlock(task, deck, { hideWord = false } = {}) {
  return el('div.quiz-prompt', {},
    el('div.quiz-prompt__kind', {}, `${KIND_LABEL[task.kind]} · ${task.direction === 'production' ? `${deck.sourceLanguage} → ${deck.targetLanguage}` : `${deck.targetLanguage} → ${deck.sourceLanguage}`}`),
    hideWord
      ? el('button.btn.btn--primary', { style: 'margin:10px auto', onclick: () => speak(task.speakText, langFor(task, deck, true)) }, svgIcon('volume2', { size: 18 }), 'Nochmal hören')
      : el('div.quiz-prompt__word', {}, task.promptText),
    task.hint ? el('div.quiz-prompt__hint', {}, task.hint) : null,
    el('div', { style: 'margin-top:8px' }, stageDots(forgeStage(task.card.srs))),
  );
}

function renderTask(task, deck, submit) {
  switch (task.kind) {
    case 'choice': return renderChoice(task, deck, submit, false);
    case 'listen': return renderChoice(task, deck, submit, true);
    case 'letters': return renderLetters(task, deck, submit);
    case 'swipe': return renderSwipe(task, deck, submit);
    default: return renderType(task, deck, submit);
  }
}

function renderChoice(task, deck, submit, listening) {
  const wrap = el('div', {}, promptBlock(task, deck, { hideWord: listening }));
  const choices = el('div.choices');
  task.choices.forEach((value, i) => {
    const btn = el('button.choice', {
      onclick: () => {
        const correct = value === task.solution;
        btn.classList.add(correct ? 'is-right' : 'is-wrong');
        if (!correct) {
          [...choices.children].find((c) => c.dataset.value === task.solution)?.classList.add('is-right');
        }
        submit(task, { value });
      },
      dataset: { value },
    }, el('span.choice__key', {}, String(i + 1)), el('span', {}, value));
    choices.append(btn);
  });
  wrap.append(choices);
  return wrap;
}

function renderType(task, deck, submit) {
  const input = el('input', {
    type: 'text',
    autocapitalize: 'none',
    autocomplete: 'off',
    autocorrect: 'off',
    spellcheck: 'false',
    enterkeyhint: 'go',
    placeholder: task.direction === 'production' ? `auf ${deck.targetLanguage} …` : `auf ${deck.sourceLanguage} …`,
    'aria-label': 'Antwort eingeben',
  });
  const go = () => submit(task, { value: input.value });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } });

  return el('div', {},
    promptBlock(task, deck),
    el('div.typeline', {}, input, el('button.btn.btn--primary', { onclick: go }, '🔨')),
    el('div.row', { style: 'margin-top:8px' },
      el('button.btn.btn--sm.btn--ghost', { onclick: () => submit(task, { value: '' }) }, 'Weiß ich nicht'),
      task.solution.length > 3
        ? el('button.btn.btn--sm.btn--ghost', {
            onclick: (e) => { input.value = task.solution.slice(0, Math.ceil(task.solution.length / 3)); input.focus(); e.currentTarget.disabled = true; },
          }, svgIcon('lightbulb', { size: 15 }), 'Anfang zeigen')
        : null),
  );
}

function renderLetters(task, deck, submit) {
  const target = task.solution;
  const slots = el('div.letters-slots', { 'aria-live': 'polite' });
  const pool = el('div.letters-pool');

  /*
   * Die Kacheln werden EINMAL gemischt und gebaut und behalten danach ihren
   * Platz; verbrauchte werden nur ausgeblendet. Vorher wurde der Vorrat bei
   * jedem Antippen neu erzeugt und dabei neu gemischt – die Buchstaben sprangen
   * unter dem Finger herum und man musste jedes Mal neu suchen.
   */
  const tiles = task.tiles.map(({ ch }, i) => {
    const node = el('button.tile' + (ch === ' ' ? '.tile--space' : ''), {
      onclick: () => place(i),
    }, ch === ' ' ? '␣' : ch);
    pool.append(node);
    return { ch, node };
  });
  const placed = [];                       // Indizes in der Reihenfolge des Legens
  const built = () => placed.map((i) => tiles[i].ch).join('');

  function place(i) {
    if (placed.includes(i)) return;
    placed.push(i);
    tiles[i].node.classList.add('is-used');
    sync();
  }

  function take(pos) {
    const [i] = placed.splice(pos, 1);
    tiles[i].node.classList.remove('is-used');
    sync();
  }

  function reset() {
    while (placed.length) {
      const i = placed.pop();
      tiles[i].node.classList.remove('is-used');
    }
    sync();
  }

  function sync() {
    slots.innerHTML = '';
    if (!placed.length) slots.append(el('span.small.muted', {}, 'Buchstaben antippen'));
    placed.forEach((i, pos) => {
      const ch = tiles[i].ch;
      slots.append(el('button.tile' + (ch === ' ' ? '.tile--space' : ''), {
        onclick: () => take(pos),
      }, ch === ' ' ? '␣' : ch));
    });
    if (placed.length === tiles.length) check();
  }

  function check() {
    task.attempts++;
    const value = built();
    if (value.trim() === target.trim()) submit(task, { value });
    else {
      slots.animate?.([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], 220);
      sfx('bad');
      if (task.attempts >= 2) submit(task, { value });
      else { reset(); toast('Noch nicht – zweiter Versuch.'); }
    }
  }

  sync();

  return el('div', {},
    promptBlock(task, deck),
    slots,
    pool,
    el('div.row', { style: 'margin-top:10px' },
      el('button.btn.btn--sm.btn--ghost', { onclick: reset }, svgIcon('rotateCcw', { size: 15 }), 'Leeren'),
      el('button.btn.btn--sm.btn--ghost', { onclick: () => submit(task, { value: '' }) }, 'Aufgeben')),
  );
}

function renderSwipe(task, deck, submit) {
  const wrap = el('div.swipe-wrap');
  const previews = previewIntervals(task.card.srs, getSettings());
  let revealed = false;

  const badgeYes = el('div.swipe-card__badge.swipe-card__badge--yes', {}, 'Sitzt');
  const badgeNo = el('div.swipe-card__badge.swipe-card__badge--no', {}, 'Nochmal');

  const answer = el('div', { hidden: true },
    el('div.flipcard__word', {}, task.solution),
    task.card.example ? el('div.small.muted', {}, `„${task.card.example}“`) : null);

  const card = el('div.swipe-card', {},
    badgeNo, badgeYes,
    el('div.quiz-prompt__kind', {}, `${KIND_LABEL.swipe} · wischen`),
    el('div.flipcard__word', {}, task.promptText),
    task.hint ? el('div.flipcard__hint', {}, task.hint) : null,
    answer,
    el('div.flipcard__tapme', {}, 'Tippen zeigt die Lösung · ← nochmal · → sitzt · ↑ zu leicht'),
  );

  const reveal = () => { revealed = true; answer.hidden = false; };
  card.addEventListener('click', reveal);

  const grade = (g) => { if (!revealed) reveal(); submit(task, { grade: g }); };

  attachSwipe(card, {
    threshold: 80,
    allowUp: true,
    onMove: ({ dx }) => {
      badgeYes.style.opacity = String(Math.max(0, Math.min(1, dx / 90)));
      badgeNo.style.opacity = String(Math.max(0, Math.min(1, -dx / 90)));
    },
    onSwipe: (dir) => grade(dir === 'right' ? GRADE.GOOD : dir === 'left' ? GRADE.AGAIN : GRADE.EASY),
  });

  wrap.append(card);

  const grades = el('div.grades', {},
    gradeBtn('Nochmal', previews[0], () => grade(GRADE.AGAIN)),
    gradeBtn('Schwer', previews[1], () => grade(GRADE.HARD)),
    gradeBtn('Gut', previews[2], () => grade(GRADE.GOOD), true),
    gradeBtn('Leicht', previews[3], () => grade(GRADE.EASY)));

  return el('div', {}, wrap, grades);
}

function gradeBtn(label, days, onclick, primary) {
  return el('button.btn' + (primary ? '.btn--primary' : ''), { onclick },
    el('span', {}, label),
    el('small', {}, days < 1 ? '10 min' : `${Math.round(days)} T`));
}

/** Falsche Antwort: die Karte wird sichtbar zerschnitten. */
function sliceCard(node, text) {
  if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const rect = node.getBoundingClientRect();
  const host = el('div', { style: `position:fixed; left:${rect.left}px; top:${rect.top}px; width:${rect.width}px; height:${rect.height}px; pointer-events:none; z-index:45` });
  const slice = el('div.slice', {},
    el('div.slice__half.slice__half--a', {}, text),
    el('div.slice__half.slice__half--b', {}, text));
  host.append(slice);
  document.body.append(host);
  node.style.visibility = 'hidden';
  setTimeout(() => { host.remove(); node.style.visibility = ''; }, 620);
}
