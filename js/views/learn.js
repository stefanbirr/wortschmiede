/* ==========================================================================
   Einprägen: Karteikarten in Ruhe durchgehen.
   Bewusst ohne Zeitdruck und ohne Bewertungszwang – hier geht es um den
   Erstkontakt. Wer eine Vokabel schon sicher hat, kann sie direkt als
   gekonnt markieren, dann startet sie in der Abfrage nicht bei null.
   ========================================================================== */

import { el, shuffle, humanDue } from '../util.js';
import { listDecks, listCards, getDeck, getSettings, deckStats } from '../store.js';
import { GRADE } from '../fsrs.js';
import { applyGrade, effectiveDirection } from '../session.js';
import { speak, speechAvailable, sfx, buzz } from '../fx.js';
import { t, icon, stageName } from '../themes.js';
import { bar, empty, toast, stageDots } from '../ui.js';
import { navigate } from '../router.js';
import { attachSwipe } from '../gesture.js';
import { forgeStage } from '../fsrs.js';

export const ALL_DECKS = { id: 'alle', name: 'Alle Decks', sourceLanguage: 'de', targetLanguage: 'en' };

export function render(params) {
  const decks = listDecks();
  if (!decks.length) {
    return empty('📸', 'Keine Vokabeln da',
      'Importiere zuerst eine Buchseite.',
      el('button.btn.btn--primary', { style: 'margin-top:12px', onclick: () => navigate('/import') }, 'Zum Import'));
  }
  if (!params.deckId) {
    if (decks.length === 1) return cardStack(decks[0]);
    return deckPicker(decks, 'lernen', t('learn'));
  }

  const deck = params.deckId === 'alle' ? ALL_DECKS : getDeck(params.deckId);
  if (!deck) { navigate('/lernen', { replace: true }); return el('div'); }
  return cardStack(deck);
}

export function deckPicker(decks, route, title) {
  const root = el('div.stack', {}, el('h1', {}, title), el('p.small.muted', {}, 'Welches Deck?'));
  const all = el('button.deck', { onclick: () => navigate(`/${route}/alle`) },
    el('div.deck__body', {},
      el('span.deck__name', {}, `🗃️ ${t('allDecks')}`),
      el('span.deck__meta', {}, decks.length === 1 ? 'alle Vokabeln' : `${decks.length} zusammen`)));
  root.append(all);
  for (const d of decks) {
    const s = deckStats(d.id);
    root.append(el('button.deck', { onclick: () => navigate(`/${route}/${d.id}`) },
      el('div.deck__body', {},
        el('span.deck__name', {}, d.name),
        el('span.deck__meta', {}, `${s.total} Karten · ${s.due} fällig · ${s.new} neu`)),
      el('span.deck__count', {}, String(s.total))));
  }
  return root;
}

function cardStack(deck) {
  const settings = getSettings();
  const isAll = deck.id === 'alle';
  const cards0 = isAll ? listCards() : listCards(deck.id);
  if (!cards0.length) {
    return empty('🪶', 'Deck ist leer', 'In diesem Deck stehen noch keine Vokabeln.',
      el('button.btn', { style: 'margin-top:12px', onclick: () => navigate('/import') }, 'Vokabeln importieren'));
  }

  let cards = [...cards0];
  let index = 0;
  let flipped = false;
  // Vorderseite ist die Sprache, aus der abgefragt wird – bei Latein also Latein.
  let flip2back = effectiveDirection(deck, settings) !== 'recognition';

  const root = el('div.stack');
  const head = el('div.row.row--between');
  const progress = el('div.small.muted');
  const barNode = bar(0);
  const stage = el('div.cardstage');
  const controls = el('div.row', { style: 'gap:8px' });
  const extra = el('div.row', { style: 'gap:8px' });

  function current() { return cards[index]; }

  function draw() {
    const card = current();
    stage.innerHTML = '';
    flipped = false;

    const frontIsKnown = flip2back;
    const faceA = frontIsKnown ? card.front : card.back;
    const faceB = frontIsKnown ? card.back : card.front;
    const langB = frontIsKnown ? deckLang(deck, 'target') : deckLang(deck, 'source');

    const flip = el('div.flipcard', { role: 'button', tabindex: '0', 'aria-label': 'Karte umdrehen' },
      el('div.flipcard__face', {},
        stageDots(forgeStage(card.srs)),
        el('div.flipcard__word', {}, faceA),
        card.hint && !frontIsKnown ? el('div.flipcard__hint', {}, card.hint) : null,
        el('div.flipcard__tapme', {}, 'Tippen zum Umdrehen'),
      ),
      el('div.flipcard__face.flipcard__face--back', {},
        el('div.flipcard__word', {}, faceB),
        card.hint ? el('div.flipcard__hint', {}, card.hint) : null,
        card.example ? el('div.flipcard__sub', {}, `„${card.example}“`) : null,
        card.exampleTranslation ? el('div.flipcard__sub.small', {}, card.exampleTranslation) : null,
        speechAvailable() ? el('button.btn.btn--sm', {
          onclick: (e) => { e.stopPropagation(); speak(faceB, langB); },
        }, '🔊 Vorlesen') : null,
        el('div.flipcard__tapme', {}, `${stageName(forgeStage(card.srs))} · ${card.srs.introduced ? humanDue(card.srs.due) : 'noch nicht abgefragt'}`),
      ));

    const toggle = () => {
      flipped = !flipped;
      flip.classList.toggle('is-flipped', flipped);
      if (flipped && settings.speech) speak(faceB, langB);
    };
    flip.addEventListener('click', toggle);
    flip.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });

    attachSwipe(flip, {
      threshold: 80,
      allowUp: false,
      onSwipe: (dir) => {
        if (dir === 'right') step(-1); else step(1);
      },
    });

    stage.append(flip);
    progress.textContent = `${index + 1} / ${cards.length}`;
    barNode.querySelector('.bar__fill').style.width = `${((index + 1) / cards.length) * 100}%`;
  }

  function step(delta) {
    const next = index + delta;
    if (next < 0) { index = cards.length - 1; }
    else if (next >= cards.length) { finish(); return; }
    else index = next;
    draw();
  }

  function finish() {
    root.innerHTML = '';
    root.append(el('section.panel.center', {},
      el('h2', {}, t('done')),
      el('p.muted', {}, `Du hast ${cards.length} Karten durchgesehen.`),
      el('div.row', { style: 'justify-content:center; margin-top:10px' },
        el('button.btn.btn--primary', { onclick: () => navigate(`/schmieden/${deck.id}`) }, `${icon('quiz')} Jetzt abfragen`),
        el('button.btn', { onclick: () => { index = 0; cards = shuffle(cards); rebuild(); } }, 'Nochmal durch'))));
  }

  function rebuild() {
    root.innerHTML = '';
    root.append(head, barNode, stage, controls, extra);
    draw();
  }

  head.append(el('h1', { style: 'margin:0; font-size:1.05rem' }, isAll ? 'Alle Decks' : deck.name), progress);

  controls.append(
    el('button.btn', { style: 'flex:1', onclick: () => step(-1) }, '◀ Zurück'),
    el('button.btn.btn--primary', { style: 'flex:1', onclick: () => step(1) }, 'Weiter ▶'),
  );

  extra.append(
    el('button.btn.btn--sm.btn--ghost', { onclick: () => { cards = shuffle(cards); index = 0; draw(); toast('Stapel gemischt.'); } }, '🔀 Mischen'),
    el('button.btn.btn--sm.btn--ghost', { onclick: () => { flip2back = !flip2back; draw(); toast(flip2back ? `Vorderseite: ${deckLang(deck, 'source')}` : `Vorderseite: ${deckLang(deck, 'target')}`); } }, '🔁 Richtung'),
    el('button.btn.btn--sm.btn--ghost', {
      onclick: () => {
        const card = current();
        applyGrade(card, GRADE.EASY, 'learn');
        sfx('good'); buzz(10);
        toast(`„${card.back}“ als bekannt markiert – nächste Wiederholung ${humanDue(card.srs.due)}.`);
        step(1);
      },
    }, '✅ Sitzt schon'),
  );

  rebuild();
  root.__cleanup = () => { try { speechSynthesis?.cancel(); } catch { /* egal */ } };
  return root;
}

function deckLang(deck, which) {
  if (deck.id === 'alle') return which === 'source' ? 'de' : 'en';
  return which === 'source' ? deck.sourceLanguage : deck.targetLanguage;
}

export { deckLang };
