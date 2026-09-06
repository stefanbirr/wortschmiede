/* ==========================================================================
   Theme-Registry.
   Ein Theme besteht aus zwei Teilen:
     1. Optik   -> Token-Block in css/themes.css unter [data-theme="id"]
     2. Sprache -> dieser Eintrag: Stufennamen, Begriffe, Icons, Klaenge
   Ein neues Theme braucht genau diese beiden Stellen. Sonst nichts.
   Siehe docs/THEMES.md.
   ========================================================================== */

export const THEMES = {
  forge: {
    id: 'forge',
    label: 'Schmiede',
    blurb: 'Amboss, Glut und grobe Pixelkanten.',
    pixel: true,
    icons: { home: '🔥', learn: '📖', quiz: '🔨', import: '📸', settings: '⚙️', good: '✨', bad: '💨' },
    lexicon: {
      appTitle: 'Deine Esse',
      homeTab: 'Esse',
      settingsTab: 'Werkbank',
      decks: 'Decks',
      allDecks: 'Alle Decks',
      quiz: 'Schmieden',
      quizStart: 'Feuer anfachen',
      learn: 'Einprägen',
      session: 'Schmiedegang',
      correct: 'Sauber getroffen!',
      wrong: 'Daneben – nochmal ins Feuer.',
      near: 'Fast – der Grat sitzt noch schief.',
      done: 'Werkstück fertig!',
      xp: 'Glut',
      streak: 'Esse',
      mastered: 'Meisterstücke',
      masteredShort: 'Meister',
    },
    stages: ['Rohling', 'Erhitzt', 'Geschmiedet', 'Gehärtet', 'Geschliffen', 'Meisterklinge'],
    sfx: { hit: { type: 'square', freq: 180, sweep: 90, dur: 0.09 }, good: { type: 'triangle', freq: 520, sweep: 880, dur: 0.16 }, bad: { type: 'sawtooth', freq: 200, sweep: 70, dur: 0.22 } },
  },

  anime: {
    id: 'anime',
    label: 'Anime',
    blurb: 'Neonlicht, Speedlines und Sternenstaub.',
    pixel: false,
    icons: { home: '🌸', learn: '📘', quiz: '⚡', import: '📷', settings: '🎛️', good: '💫', bad: '💧' },
    lexicon: {
      appTitle: 'Dein Dojo',
      homeTab: 'Dojo',
      settingsTab: 'Menü',
      decks: 'Kapitel',
      allDecks: 'Alle Kapitel',
      quiz: 'Training',
      quizStart: 'Los geht’s!',
      learn: 'Einprägen',
      session: 'Trainingslauf',
      correct: 'Volltreffer!',
      wrong: 'Nicht ganz – nächster Versuch!',
      near: 'Knapp daneben!',
      done: 'Kapitel geschafft!',
      xp: 'Energie',
      streak: 'Serie',
      mastered: 'Gemeistert',
      masteredShort: 'Top',
    },
    stages: ['Neuling', 'Schüler', 'Kämpfer', 'Elite', 'Meister', 'Legende'],
    sfx: { hit: { type: 'sine', freq: 700, sweep: 1200, dur: 0.07 }, good: { type: 'sine', freq: 880, sweep: 1600, dur: 0.18 }, bad: { type: 'sine', freq: 320, sweep: 140, dur: 0.2 } },
  },

  pergament: {
    id: 'pergament',
    label: 'Pergament',
    blurb: 'Heller Lesemodus mit Tinte und Papier.',
    pixel: false,
    icons: { home: '🕯️', learn: '📜', quiz: '🖋️', import: '🗒️', settings: '🔧', good: '✔️', bad: '✖️' },
    lexicon: {
      appTitle: 'Übersicht',
      homeTab: 'Start',
      settingsTab: 'Einstellungen',
      decks: 'Listen',
      allDecks: 'Alle Listen',
      quiz: 'Abfrage',
      quizStart: 'Abfrage starten',
      learn: 'Einprägen',
      session: 'Durchgang',
      correct: 'Richtig.',
      wrong: 'Leider falsch.',
      near: 'Fast richtig.',
      done: 'Durchgang beendet.',
      xp: 'Punkte',
      streak: 'Tage',
      mastered: 'Sicher',
      masteredShort: 'Sicher',
    },
    stages: ['Unbekannt', 'Gelesen', 'Geübt', 'Vertraut', 'Sicher', 'Beherrscht'],
    sfx: { hit: { type: 'sine', freq: 440, sweep: 460, dur: 0.05 }, good: { type: 'sine', freq: 660, sweep: 880, dur: 0.12 }, bad: { type: 'sine', freq: 240, sweep: 180, dur: 0.15 } },
  },
};

export const DEFAULT_THEME = 'forge';
let current = THEMES[DEFAULT_THEME];

export function applyTheme(id) {
  const theme = THEMES[id] || THEMES[DEFAULT_THEME];
  current = theme;
  document.documentElement.dataset.theme = theme.id;
  document.documentElement.dataset.pixel = theme.pixel ? '1' : '0';
  // Tab-Icons folgen dem Theme
  const map = { '/': 'home', '/lernen': 'learn', '/schmieden': 'quiz', '/import': 'import', '/einstellungen': 'settings' };
  for (const a of document.querySelectorAll('.tabbar a')) {
    const key = map[a.dataset.tab];
    const icon = a.querySelector('.tabbar__icon');
    if (key && icon) icon.textContent = theme.icons[key];
  }
  const labels = { '/': 'homeTab', '/lernen': 'learn', '/schmieden': 'quiz', '/einstellungen': 'settingsTab' };
  for (const [tab, key] of Object.entries(labels)) {
    const node = document.querySelector(`.tabbar a[data-tab="${tab}"] span:last-child`);
    if (node && theme.lexicon[key]) node.textContent = theme.lexicon[key];
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    if (bg) meta.setAttribute('content', bg);
  }
  return theme;
}

export const theme = () => current;
export const t = (key) => current.lexicon[key] ?? key;
export const stageName = (n) => current.stages[Math.max(0, Math.min(5, n))];
export const icon = (key) => current.icons[key] ?? '';
