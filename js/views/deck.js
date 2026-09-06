/* Deck-Detail: Statistik, Vokabelliste, Bearbeiten, Löschen. */

import { el, humanDue } from '../util.js';
import { getDeck, listCards, deckStats, updateDeck, deleteDeck, updateCard, deleteCard, resetCardProgress, addCards, awardProgress } from '../store.js';
import { forgeStage } from '../fsrs.js';
import { stageName, t, icon, awards as THEME_AWARDS } from '../themes.js';
import { bar, stageDots, toast, confirmDialog, modal, awardRow } from '../ui.js';
import { navigate } from '../router.js';
import { speak, speechAvailable } from '../fx.js';
import { directionOptions } from '../languages.js';
import { effectiveDirection } from '../session.js';

export function render(params) {
  const deck = getDeck(params.deckId);
  if (!deck) { navigate('/', { replace: true }); return el('div'); }

  const s = deckStats(deck.id);
  const cards = listCards(deck.id);
  const root = el('div.stack');

  root.append(el('div.row.row--between', {},
    el('h1', { style: 'margin:0' }, deck.name),
    el('button.btn.btn--sm.btn--ghost', { onclick: () => editDeck(deck) }, '✏️')));

  root.append(el('section.panel', {},
    el('div.stat-grid', {},
      st(s.total, 'Karten'), st(s.due, 'fällig'), st(s.new, 'neu'), st(s.mastered, t('masteredShort'))),
    el('div.small.muted', { style: 'margin:10px 0 4px' }, 'Fortschritt im Deck'),
    bar(s.total ? ((s.total - s.new) / s.total) * 100 : 0),
    el('div.row', { style: 'margin-top:10px; gap:6px' },
      s.stages.map((n, i) => n ? el('span.chip', {}, `${stageName(i)}: ${n}`) : null)),
  ));

  const dirLabel = (directionOptions(deck).find(([v]) => v === effectiveDirection(deck)) || [])[1];
  root.append(el('p.small.muted', { style: 'margin:-4px 0 0' }, `Abfrage: ${dirLabel || 'gemischt'}`));

  const ap = awardProgress(deck.id);
  const nextAward = THEME_AWARDS()[Math.min(4, ap.next - 1)];
  root.append(el('section.panel', {},
    el('h2', {}, 'Auszeichnungen'),
    awardRow(ap.level),
    el('p.small.muted', { style: 'margin:10px 0 0' },
      ap.level >= 5
        ? 'Alle Vokabeln auf der höchsten Stufe. Mehr geht nicht.'
        // Die Auszeichnungsnamen sind je Theme anders gebeugt ("Schwarzer Gürtel",
        // "Mithrilbarren") – als Zitat gesetzt bleibt der Satz in jedem Fall richtig.
        : `Noch ${ap.remaining} von ${ap.total} ${ap.total === 1 ? 'Vokabel' : 'Vokabeln'} bis zur Auszeichnung „${nextAward?.name ?? 'nächster Rang'}“ – die gibt es erst, wenn jede Karte die Stufe erreicht hat.`)));

  root.append(el('div.row.row--equal', {},
    el('button.btn.btn--primary', { style: 'flex:1 1 46%', onclick: () => navigate(`/schmieden/${deck.id}`) }, `${icon('quiz')} ${t('quizStart')}`),
    el('button.btn', { style: 'flex:1 1 46%', onclick: () => navigate(`/lernen/${deck.id}`) }, `${icon('learn')} ${t('learn')}`)));

  const search = el('input', { type: 'text', placeholder: 'Vokabel suchen …', 'aria-label': 'Vokabel suchen' });
  const list = el('div.vlist');

  const draw = () => {
    const q = search.value.trim().toLowerCase();
    const filtered = cards.filter((c) => !q || c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q));
    list.innerHTML = '';
    if (!filtered.length) list.append(el('p.small.muted.center', {}, 'Nichts gefunden.'));
    for (const card of filtered.slice(0, 400)) {
      list.append(el('div.vitem', {},
        stageDots(forgeStage(card.srs)),
        el('div.vitem__text', {},
          el('div.vitem__front', {}, card.front),
          el('div.vitem__back', {}, card.back + (card.hint ? ` · ${card.hint}` : ''))),
        el('span.vitem__due', {}, card.srs.introduced ? humanDue(card.srs.due) : 'neu'),
        el('button.btn.btn--sm.btn--ghost', { onclick: () => editCard(card, draw), 'aria-label': 'Vokabel bearbeiten' }, '⋯')));
    }
    if (filtered.length > 400) list.append(el('p.small.muted.center', {}, `… ${filtered.length - 400} weitere ausgeblendet`));
  };
  search.addEventListener('input', draw);
  draw();

  root.append(el('section.panel', {},
    el('div.row.row--between', {},
      el('h2', { style: 'margin:0' }, 'Vokabeln'),
      el('button.btn.btn--sm', { onclick: () => addCardDialog(deck, draw, cards) }, '➕ Neu')),
    el('div', { style: 'margin:10px 0' }, search),
    list));

  root.append(el('div.row', {},
    el('button.btn.btn--sm.btn--ghost', { onclick: () => navigate('/import') }, '📸 Mehr importieren'),
    el('span.spacer'),
    el('button.btn.btn--sm.btn--danger', {
      onclick: () => confirmDialog('Deck löschen?', `„${deck.name}“ und alle ${s.total} Vokabeln werden von diesem Gerät gelöscht. Das lässt sich nicht rückgängig machen.`,
        () => { deleteDeck(deck.id); toast('Deck gelöscht.'); navigate('/'); }),
    }, 'Deck löschen')));

  return root;
}

const st = (v, l) => el('div.stat', {}, el('b', {}, String(v)), el('span', {}, l));

function editDeck(deck) {
  const name = el('input', { type: 'text', value: deck.name });
  const src = el('input', { type: 'text', value: deck.sourceLanguage, maxlength: '5' });
  const tgt = el('input', { type: 'text', value: deck.targetLanguage, maxlength: '5' });
  const dir = el('select', {},
    el('option', { value: '', selected: deck.direction ? null : true }, 'Standard aus der Werkbank'),
    directionOptions(deck).map(([value, label]) =>
      el('option', { value, selected: deck.direction === value ? true : null }, label)));

  modal({
    title: 'Deck bearbeiten',
    body: el('div', {},
      el('label.field', {}, el('span', {}, 'Name'), name),
      el('div.row', {},
        el('label.field', { style: 'flex:1' }, el('span', {}, 'Ausgangssprache'), src),
        el('label.field', { style: 'flex:1' }, el('span', {}, 'Zielsprache'), tgt)),
      el('label.field', {}, el('span', {}, 'Abfragerichtung'), dir),
      el('p.small.muted', {}, 'Gilt nur für dieses Deck. Bei Latein und Altgriechisch wird übersetzt statt geschrieben.')),
    actions: [
      { label: 'Abbrechen' },
      { label: 'Speichern', primary: true, onClick: () => {
        updateDeck(deck.id, {
          name: name.value.trim() || deck.name,
          sourceLanguage: src.value.trim() || 'de',
          targetLanguage: tgt.value.trim() || 'en',
          direction: dir.value || null,
        });
        toast('Gespeichert.');
        navigate(`/deck/${deck.id}`);
      } },
    ],
  });
}

function editCard(card, refresh) {
  const front = el('input', { type: 'text', value: card.front });
  const back = el('input', { type: 'text', value: card.back });
  const hint = el('input', { type: 'text', value: card.hint || '' });
  const alts = el('input', { type: 'text', value: (card.alternatives || []).join(', ') });
  modal({
    title: 'Vokabel',
    body: el('div', {},
      el('label.field', {}, el('span', {}, 'Bekannte Sprache'), front),
      el('label.field', {}, el('span', {}, 'Zielsprache'), back),
      el('label.field', {}, el('span', {}, 'Hinweis'), hint),
      el('label.field', {}, el('span', {}, 'Auch richtig (Komma getrennt)'), alts),
      el('div.small.muted', {}, `${stageName(forgeStage(card.srs))} · ${card.srs.introduced ? 'nächste Wiederholung ' + humanDue(card.srs.due) : 'noch nicht abgefragt'} · ${card.srs.lapses || 0}× vergessen`),
      speechAvailable() ? el('button.btn.btn--sm', { style: 'margin-top:8px', onclick: () => speak(card.back) }, '🔊 Vorlesen') : null),
    actions: [
      { label: 'Löschen', danger: true, onClick: () => { deleteCard(card.id); toast('Vokabel gelöscht.'); refresh(); } },
      { label: 'Zurücksetzen', onClick: () => { resetCardProgress(card.id); toast('Fortschritt zurückgesetzt.'); refresh(); } },
      { label: 'Speichern', primary: true, onClick: () => {
        updateCard(card.id, {
          front: front.value.trim() || card.front,
          back: back.value.trim() || card.back,
          hint: hint.value.trim(),
          alternatives: alts.value.split(',').map((x) => x.trim()).filter(Boolean),
        });
        refresh();
      } },
    ],
  });
}

function addCardDialog(deck, refresh, cards) {
  const front = el('input', { type: 'text', placeholder: 'der Apfel' });
  const back = el('input', { type: 'text', placeholder: 'apple' });
  modal({
    title: 'Vokabel hinzufügen',
    body: el('div', {},
      el('label.field', {}, el('span', {}, deck.sourceLanguage), front),
      el('label.field', {}, el('span', {}, deck.targetLanguage), back)),
    actions: [
      { label: 'Abbrechen' },
      { label: 'Hinzufügen', primary: true, onClick: () => {
        const { added } = addCards(deck.id, [{ front: front.value, back: back.value }]);
        if (added) { cards.push(...listCards(deck.id).slice(-added)); toast('Hinzugefügt.'); navigate(`/deck/${deck.id}`); }
        else toast('Nicht gespeichert – beide Felder ausfüllen.');
        refresh();
      } },
    ],
  });
}
