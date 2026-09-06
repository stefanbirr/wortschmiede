/* Startseite: Überblick, Tagespensum, Decks. */

import { el, humanDue } from '../util.js';
import { listDecks, listCards, deckStats, globalStats, getState, todayCount } from '../store.js';
import { t, icon, stageName } from '../themes.js';
import { bar, empty, stageDots } from '../ui.js';
import { navigate } from '../router.js';

export function render() {
  const decks = listDecks();
  const g = globalStats();
  const p = getState().progress;
  const today = todayCount();
  const goal = Math.max(10, getState().settings.sessionSize);

  const root = el('div.stack');

  root.append(el('section.panel', {},
    el('div.row.row--between', {},
      el('h1', { style: 'margin:0' }, t('appTitle')),
      el('span.chip', { title: t('streak') }, `${icon('home')} ${p.streak || 0} ${p.streak === 1 ? 'Tag' : 'Tage'}`)),
    el('div.stat-grid', { style: 'margin:10px 0' },
      stat(g.due, 'fällig'),
      stat(g.new, 'neu'),
      stat(g.mastered, t('masteredShort')),
      stat(p.xp || 0, t('xp'))),
    el('div.small.muted', { style: 'margin-bottom:4px' }, `Heute ${today} von ${goal} Wiederholungen`),
    bar((today / goal) * 100),
  ));

  if (!decks.length) {
    root.append(empty('📸', 'Noch keine Vokabeln',
      'Fotografiere deine Buchseite, lass sie von einem KI-Chat umwandeln und füge das Ergebnis hier ein.',
      el('button.btn.btn--primary', { style: 'margin-top:12px', onclick: () => navigate('/import') }, 'Vokabeln importieren')));
    return root;
  }

  root.append(el('div.row.row--equal', {},
    el('button.btn.btn--primary', { style: 'flex:1 1 46%', onclick: () => navigate('/schmieden') }, `${icon('quiz')} ${t('quizStart')}`),
    el('button.btn', { style: 'flex:1 1 46%', onclick: () => navigate('/lernen') }, `${icon('learn')} ${t('learn')}`),
  ));

  const list = el('div.stack');
  list.append(el('h2', { style: 'margin:8px 0 0' }, t('decks')));
  for (const deck of decks) {
    const s = deckStats(deck.id);
    const weighted = s.total ? s.stages.reduce((acc, n, i) => acc + n * i, 0) / s.total : 0;
    const avgStage = Math.round(weighted);
    list.append(el('button.deck', { onclick: () => navigate(`/deck/${deck.id}`) },
      el('div.deck__body', {},
        el('span.deck__name', {}, deck.name),
        el('span.deck__meta', {}, `${deck.sourceLanguage} → ${deck.targetLanguage} · ${s.total} Karten · ${stageName(avgStage)}`),
        el('div.row', { style: 'gap:6px; margin-top:6px' },
          s.due ? el('span.chip.chip--due', {}, `${s.due} fällig`) : null,
          s.new ? el('span.chip', {}, `${s.new} neu`) : null,
          !s.due && !s.new ? el('span.chip.chip--ok', {}, `nächste ${nextDueLabel(deck.id)}`) : null),
      ),
      el('div', { style: 'display:flex; flex-direction:column; align-items:flex-end; gap:6px' },
        el('span.deck__count', {}, String(s.due || s.new || 0)),
        stageDots(avgStage)),
    ));
  }
  root.append(list);

  root.append(el('p.small.muted.center', { style: 'margin-top:12px' },
    'Alle Vokabeln liegen nur auf diesem Gerät. Sicherung: Werkbank → Daten exportieren.'));

  return root;
}

function nextDueLabel(deckId) {
  const upcoming = listCards(deckId)
    .filter((c) => c.srs.introduced)
    .map((c) => c.srs.due)
    .sort((a, b) => a - b)[0];
  return upcoming ? humanDue(upcoming) : '–';
}

function stat(value, label) {
  return el('div.stat', {}, el('b', {}, String(value)), el('span', {}, label));
}
