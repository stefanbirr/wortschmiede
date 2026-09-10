/* Werkbank: Aussehen, Lernparameter, Daten. */

import { el, download } from '../util.js';
import { getSettings, setSettings, exportAll, importBackup, wipeAll, storageUsage, globalStats, getState,
  requestPersistence, isPersisted, listSafetyCopies, readSafetyCopy, deleteSafetyCopy } from '../store.js';
import { THEMES, applyTheme, t } from '../themes.js';
import { toast, confirmDialog } from '../ui.js';
import { navigate } from '../router.js';
import { speechAvailable } from '../fx.js';
import { intervalFor } from '../fsrs.js';
import { icon as svgIcon } from '../icons.js';

export function render() {
  const s = getSettings();
  const root = el('div.stack');

  /* ---- Aussehen ---- */
  const themeGrid = el('div.row', { style: 'gap:8px' });
  for (const th of Object.values(THEMES)) {
    themeGrid.append(el('button.btn' + (th.id === s.theme ? '.btn--primary' : ''), {
      style: 'flex:1 1 30%; flex-direction:column; align-items:flex-start; text-align:left',
      onclick: () => {
        setSettings({ theme: th.id });
        applyTheme(th.id);
        toast(`Theme: ${th.label}`);
        navigate('/einstellungen');
      },
    }, el('span', {}, th.label), el('small', { style: 'font-size:.66rem; opacity:.8' }, th.blurb)));
  }

  root.append(el('h1', {}, 'Werkbank'));
  root.append(el('section.panel', {},
    el('h2', {}, 'Aussehen'),
    themeGrid,
    el('p.small.muted', { style: 'margin-top:10px' }, 'Themes ändern Optik, Begriffe und Klänge. Eigene Themes: siehe docs/THEMES.md im Repo.')));

  /* ---- Abfrage ---- */
  const direction = select([
    ['production', 'Produzieren (Zielsprache schreiben)'],
    ['recognition', 'Erkennen (Muttersprache angeben)'],
    ['both', 'Gemischt'],
  ], s.direction, (v) => setSettings({ direction: v }));

  const sessionSize = number(s.sessionSize, 5, 100, (v) => setSettings({ sessionSize: v }));
  const newPerDay = number(s.newPerDay, 0, 100, (v) => setSettings({ newPerDay: v }));

  const retentionOut = el('output', { style: 'min-width:9ch; text-align:right' });
  const retention = el('input', { type: 'range', min: '80', max: '97', step: '1', value: String(Math.round(s.desiredRetention * 100)), style: 'flex:1' });
  const syncRetention = () => {
    const r = Number(retention.value) / 100;
    retentionOut.textContent = `${retention.value}%`;
    setSettings({ desiredRetention: r });
  };
  retention.addEventListener('input', syncRetention);
  retentionOut.textContent = `${Math.round(s.desiredRetention * 100)}%`;

  root.append(el('section.panel', {},
    el('h2', {}, t('quiz')),
    el('label.field', {}, el('span', {}, 'Abfragerichtung'), direction),
    el('label.field', {}, el('span', {}, 'Karten pro Durchgang'), sessionSize),
    el('label.field', {}, el('span', {}, 'Neue Vokabeln pro Tag'), newPerDay),
    el('label.field', {}, el('span', {}, 'Ziel-Behaltensrate'),
      el('div.row', {}, retention, retentionOut)),
    el('p.small.muted', {}, 'Höher = häufigere Wiederholungen, weniger Vergessen. 90 % ist der bewährte Kompromiss.'),
    toggle('Tippfehler durchgehen lassen', s.typoTolerance, (v) => setSettings({ typoTolerance: v })),
    toggle('Akzente/Umlaute ignorieren', s.ignoreAccents, (v) => setSettings({ ignoreAccents: v })),
    toggle('Artikel ignorieren (der/die/das, the)', s.ignoreArticles, (v) => setSettings({ ignoreArticles: v })),
    toggle('Wischkarten einstreuen', s.swipeMode, (v) => setSettings({ swipeMode: v })),
  ));

  /* ---- Rückmeldung ---- */
  root.append(el('section.panel', {},
    el('h2', {}, 'Klang & Haptik'),
    toggle('Töne', s.sound, (v) => setSettings({ sound: v })),
    toggle('Vibration', s.haptics, (v) => setSettings({ haptics: v })),
    toggle(speechAvailable() ? 'Vorlesen (Sprachausgabe)' : 'Vorlesen (auf diesem Gerät nicht verfügbar)', s.speech, (v) => setSettings({ speech: v })),
  ));

  /* ---- Daten ---- */
  const usage = storageUsage();
  const g = globalStats();
  const fileInput = el('input', { type: 'file', accept: '.json,application/json', style: 'display:none' });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      const res = importBackup(await file.text());
      applyTheme(getSettings().theme);
      toast(`Backup geladen: ${res.decks} Decks, ${res.cards} Vokabeln.`);
      navigate('/');
    } catch (err) {
      toast('Import fehlgeschlagen: ' + err.message);
    }
  });

  /* Speicherzustand: Ist die Ablage vor automatischem Aufräumen geschützt? */
  const persistLine = el('p.small.muted', { style: 'margin:8px 0 0' }, 'Prüfe Speicherzustand …');
  const persistBtn = el('button.btn.btn--sm', { hidden: true, onclick: async () => {
    const ok = await requestPersistence();
    toast(ok ? 'Der Browser schützt deine Daten jetzt vor automatischem Aufräumen.'
             : 'Der Browser hat das abgelehnt – exportiere lieber regelmäßig ein Backup.');
    showPersistState();
  } }, '🔒 Dauerhaft speichern');

  async function showPersistState() {
    const state = await isPersisted();
    if (state === null) {
      persistLine.textContent = 'Dein Browser sagt nicht, ob er die Daten dauerhaft speichert. Sichere sie regelmäßig als Datei.';
      persistBtn.hidden = true;
    } else if (state) {
      persistLine.textContent = 'Dauerhaft gespeichert: Der Browser räumt diese Daten nicht von selbst weg.';
      persistBtn.hidden = true;
    } else {
      persistLine.textContent = 'Nicht dauerhaft gespeichert: Bei Platzmangel oder längerer Nichtnutzung kann der Browser die Daten löschen.';
      persistBtn.hidden = false;
    }
  }
  showPersistState();

  /* Beiseitegelegte Kopien – aus Migrationen oder aus einem beschädigten Stand. */
  const copies = listSafetyCopies();
  const copyList = el('div.stack', { style: 'margin-top:10px' });
  if (copies.length) {
    copyList.append(el('p.small.muted', {}, 'Sicherungskopien im Browser:'));
    for (const c of copies) {
      copyList.append(el('div.vitem', {},
        el('div.vitem__text', {},
          el('div.vitem__front', {}, c.kind === 'rescue' ? 'Gerettete Daten' : 'Vor einer Formatänderung'),
          el('div.vitem__back.mono', {}, `${c.key} · ${c.bytes >= 1024 ? Math.round(c.bytes / 1024) + ' KB' : c.bytes + ' Zeichen'}`)),
        el('button.btn.btn--sm', { onclick: () => {
          const raw = readSafetyCopy(c.key);
          if (raw) download(`${c.key}.json`, raw);
        } }, svgIcon('download', { size: 15 })),
        el('button.btn.btn--sm.btn--danger', { onclick: () => {
          confirmDialog('Kopie löschen?', 'Diese Sicherungskopie wird aus dem Browser entfernt.', () => {
            deleteSafetyCopy(c.key);
            toast('Kopie gelöscht.');
            navigate('/einstellungen');
          });
        }, 'aria-label': 'Kopie löschen' }, svgIcon('trash', { size: 15 }))));
    }
  }

  root.append(el('section.panel', {},
    el('h2', {}, 'Deine Daten'),
    el('p.small.muted', {}, `${g.decks} Decks · ${g.total} Vokabeln · ${usage.kb} KB auf diesem Gerät. Es gibt keinen Server und kein Konto – ohne Sicherung sind die Daten weg, wenn du Browserdaten löschst.`),
    el('div.row', {},
      el('button.btn', { onclick: () => download(`wortschmiede-${new Date().toISOString().slice(0, 10)}.json`, exportAll()) }, svgIcon('download', { size: 17 }), 'Exportieren'),
      el('button.btn', { onclick: () => fileInput.click() }, svgIcon('upload', { size: 17 }), 'Backup laden'),
      fileInput),
    persistLine,
    el('div', { style: 'margin-top:8px' }, persistBtn),
    copyList,
    el('button.btn.btn--danger.btn--block', { style: 'margin-top:10px',
      onclick: () => confirmDialog('Wirklich alles löschen?', 'Alle Decks, Vokabeln und der Lernfortschritt auf diesem Gerät werden gelöscht.',
        () => { wipeAll(); applyTheme('forge'); toast('Alles gelöscht.'); navigate('/'); }),
    }, 'Alles löschen')));

  /* ---- Info ---- */
  const p = getState().progress;
  root.append(el('section.panel', {},
    el('h2', {}, 'Über'),
    el('p.small.muted', {},
      `Wortschmiede lernt mit FSRS-5, dem aktuellen Standardverfahren für verteilte Wiederholung. Deine Antworten steuern Stabilität und Schwierigkeit jeder Karte; das nächste Intervall ist die Zeit, nach der du sie mit ${Math.round(s.desiredRetention * 100)} % Wahrscheinlichkeit noch weißt.`),
    el('p.small.muted', {}, `Bisher ${p.reviews || 0} Wiederholungen · längste Serie ${p.streak || 0} Tage · eine frisch gelernte Karte kommt nach etwa ${Math.round(intervalFor(3, s.desiredRetention))} Tagen wieder.`),
    el('p.small.muted', {}, 'Offline nutzbar: Über das Browsermenü „Zum Startbildschirm hinzufügen“ wählen.'),
    el('p.small.muted', {},
      'Symbole: ',
      el('a', { href: 'https://game-icons.net', target: '_blank', rel: 'noopener' }, 'game-icons.net'),
      ' von Lorc und Delapouite (',
      el('a', { href: 'https://creativecommons.org/licenses/by/3.0/', target: '_blank', rel: 'noopener' }, 'CC BY 3.0'),
      ') sowie ',
      el('a', { href: 'https://lucide.dev', target: '_blank', rel: 'noopener' }, 'Lucide'),
      ' (ISC).')));

  return root;
}

function toggle(label, value, onChange) {
  const input = el('input', { type: 'checkbox', checked: value ? true : null });
  input.addEventListener('change', () => onChange(input.checked));
  return el('label.switch', {}, el('span', {}, label), input);
}

function select(options, value, onChange) {
  const node = el('select', {}, options.map(([v, l]) => el('option', { value: v, selected: v === value ? true : null }, l)));
  node.addEventListener('change', () => onChange(node.value));
  return node;
}

function number(value, min, max, onChange) {
  const node = el('input', { type: 'number', value: String(value), min: String(min), max: String(max), inputmode: 'numeric' });
  node.addEventListener('change', () => {
    const v = Math.max(min, Math.min(max, Number(node.value) || min));
    node.value = String(v);
    onChange(v);
  });
  return node;
}
