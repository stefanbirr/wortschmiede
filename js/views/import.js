/* Import: Prompt holen -> KI-Antwort einfügen -> prüfen -> speichern. */

import { el, copyToClipboard } from '../util.js';
import { buildPrompt } from '../prompt.js';
import { LANGUAGES, languageName, defaultDirectionFor } from '../languages.js';
import { parseImport } from '../parse.js';
import { listDecks, createDeck, addCards, requestPersistence } from '../store.js';
import { toast } from '../ui.js';
import { navigate } from '../router.js';
import { DEMO_DECK } from '../demo.js';
import { icon as svgIcon } from '../icons.js';

export function render() {
  const decks = listDecks();
  let parsed = null;

  const langSel = (name, value) => el('select', { name, id: name },
    LANGUAGES.map((l) => el('option', { value: l.code, selected: l.code === value ? true : null }, l.name)));

  const source = langSel('source', 'de');
  const target = langSel('target', 'en');
  const deckName = el('input', { type: 'text', value: `Unit ${new Date().getMonth() + 1}`, placeholder: 'z. B. Unit 3 – At the market' });
  const withExamples = el('input', { type: 'checkbox', checked: true });

  // Bei Latein/Altgriechisch wird übersetzt statt produziert – das steht hier,
  // damit niemand nach dem Import über die Abfragerichtung stolpert.
  const dirNote = el('p.small.muted');
  const refreshNote = () => {
    const t = languageName(target.value);
    dirNote.textContent = defaultDirectionFor(target.value) === 'recognition'
      ? `Abfrage: ${t} → ${languageName(source.value)}, du übersetzt ins Deutsche. Umstellbar im Deck.`
      : `Abfrage: ${languageName(source.value)} → ${t}, du schreibst ${t}. Umstellbar im Deck.`;
  };

  const promptBox = el('div.codebox', { id: 'prompt-box' });
  const refreshPrompt = () => {
    promptBox.textContent = buildPrompt({
      source: source.value,
      target: target.value,
      deckName: deckName.value || 'Neues Deck',
      examples: withExamples.checked,
    });
  };
  [source, target, deckName, withExamples].forEach((n) => n.addEventListener('input', () => { refreshPrompt(); refreshNote(); }));
  refreshPrompt();
  refreshNote();

  const input = el('textarea', {
    placeholder: 'JSON der KI hier einfügen. Notfalls tut es auch eine einfache Liste: Wort – Übersetzung, eine pro Zeile.',
    'aria-label': 'KI-Antwort einfügen',
  });

  const preview = el('div.stack', { id: 'import-preview' });
  const saveBtn = el('button.btn.btn--primary.btn--block', { disabled: true }, 'Ins Deck übernehmen');

  const targetDeck = el('select', {},
    el('option', { value: '__new' }, '➕ Neues Deck anlegen'),
    decks.map((d) => el('option', { value: d.id }, d.name)));

  function check() {
    const res = parseImport(input.value);
    preview.innerHTML = '';
    parsed = null;
    if (!input.value.trim()) { saveBtn.disabled = true; return; }
    if (!res.ok) {
      preview.append(el('div.verdict.verdict--bad', {}, res.error));
      saveBtn.disabled = true;
      return;
    }
    parsed = res.deck;
    if (parsed.name && parsed.name !== 'Importiertes Deck') deckName.value = parsed.name;
    saveBtn.disabled = false;

    preview.append(el('div.verdict.verdict--ok', {},
      el('b', {}, `${parsed.cards.length} Vokabeln erkannt`),
      res.warnings.length ? el('div.small.muted', {}, res.warnings.join(' ')) : null));

    const sampleList = el('div.vlist');
    for (const c of parsed.cards.slice(0, 8)) {
      sampleList.append(el('div.vitem', {},
        el('div.vitem__text', {},
          el('div.vitem__front', {}, c.front),
          el('div.vitem__back', {}, c.back + (c.hint ? ` · ${c.hint}` : '')))));
    }
    if (parsed.cards.length > 8) sampleList.append(el('div.small.muted.center', {}, `… und ${parsed.cards.length - 8} weitere`));
    preview.append(sampleList);
  }

  input.addEventListener('input', check);

  saveBtn.addEventListener('click', () => {
    if (!parsed) return;
    let deckId = targetDeck.value;
    if (deckId === '__new') {
      const targetLanguage = parsed.targetLanguage || target.value;
      const deck = createDeck({
        name: deckName.value.trim() || parsed.name,
        sourceLanguage: parsed.sourceLanguage || source.value,
        targetLanguage,
        direction: defaultDirectionFor(targetLanguage),
      });
      deckId = deck.id;
    }
    const { added, skipped } = addCards(deckId, parsed.cards);
    // Jetzt sind Daten da, die es zu schützen lohnt.
    requestPersistence();
    toast(`${added} Vokabeln übernommen${skipped ? `, ${skipped} übersprungen (Dubletten)` : ''}.`);
    navigate(`/deck/${deckId}`);
  });

  const fileName = el('p.small.muted.center', { style: 'margin:8px 0 0' });
  const fileInput = el('input', { type: 'file', accept: '.json,.txt,.csv,.tsv,text/plain,application/json', style: 'display:none' });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    input.value = await file.text();
    fileName.textContent = `📄 ${file.name}`;
    check();
  });

  return el('div.stack', {},
    el('h1', {}, 'Vokabeln importieren'),

    el('section.panel', {},
      el('h2', {}, 'So geht’s'),
      el('ol.steps', {},
        el('li', {}, el('b', {}, 'Seite fotografieren'), el('div.small.muted', {}, 'Vokabelliste im Buch, gerade und scharf – zur Not zwei Fotos.')),
        el('li', {}, el('b', {}, 'Prompt kopieren'), el('div.small.muted', {}, 'Unten kopieren und in Gemini, ChatGPT oder Claude einfügen – die Gratisversion reicht.')),
        el('li', {}, el('b', {}, 'Foto dazu, absenden'), el('div.small.muted', {}, 'Die KI legt eine JSON-Datei zum Herunterladen an.')),
        el('li', {}, el('b', {}, 'Datei herunterladen'), el('div.small.muted', {}, 'Auf dem Handy landet sie in „Downloads“.')),
        el('li', {}, el('b', {}, 'Datei hier laden'), el('div.small.muted', {}, 'Unten auswählen – fertig.')))),

    el('section.panel', {},
      el('h2', {}, 'Prompt'),
      el('div.row', {},
        el('label.field', { style: 'flex:1 1 40%' }, el('span', {}, 'Ich kann'), source),
        el('label.field', { style: 'flex:1 1 40%' }, el('span', {}, 'Ich lerne'), target)),
      dirNote,
      el('label.field', {}, el('span', {}, 'Deckname'), deckName),
      el('label.switch', {}, 'Beispielsätze mitnehmen', withExamples),
      promptBox,
      el('div.row', { style: 'margin-top:10px' },
        el('button.btn.btn--primary', {
          style: 'flex:1',
          onclick: async (e) => {
            const ok = await copyToClipboard(promptBox.textContent);
            toast(ok ? 'Prompt kopiert – jetzt ins KI-Tool einfügen.' : 'Kopieren nicht möglich – Text bitte markieren.');
            e.currentTarget.blur();
          },
        }, svgIcon('check', { size: 18 }), 'Prompt kopieren'))),

    el('section.panel', {},
      el('h2', {}, 'Deck laden'),
      el('button.btn.btn--primary.btn--block', { onclick: () => fileInput.click() }, svgIcon('upload', { size: 20 }), 'JSON-Datei auswählen'),
      fileInput,
      fileName,
      el('p.small.muted.center', { style: 'margin:10px 0 0' },
        'Noch kein Foto zur Hand? ',
        el('a', {
          href: '#/import',
          onclick: (e) => { e.preventDefault(); input.value = JSON.stringify(DEMO_DECK, null, 2); fileName.textContent = '🎁 Beispiel-Deck'; check(); },
        }, 'Beispiel-Deck laden')),
      el('details', { style: 'margin-top:12px' },
        el('summary.small.muted', { style: 'cursor:pointer' }, 'Kein Dateidownload möglich? Text einfügen'),
        el('div', { style: 'margin-top:10px' },
          input,
          el('div.row', { style: 'margin-top:8px' },
            el('button.btn.btn--sm', { onclick: async () => { try { input.value = await navigator.clipboard.readText(); check(); } catch { toast('Zwischenablage nicht freigegeben – bitte manuell einfügen.'); } } }, 'Aus Zwischenablage'),
            el('button.btn.btn--sm.btn--ghost', { onclick: () => { input.value = ''; fileName.textContent = ''; check(); } }, svgIcon('rotateCcw', { size: 15 }), 'Leeren')))),
      el('label.field', { style: 'margin-top:12px' }, el('span', {}, 'Ziel'), targetDeck),
      preview,
      el('div', { style: 'margin-top:12px' }, saveBtn)),

    el('p.small.muted', {},
      'Die Fotos und der Chat bleiben beim KI-Tool deiner Wahl – Wortschmiede sieht nur den Text, den du hier einfügst, und speichert ihn ausschließlich auf diesem Gerät.'),
  );
}

