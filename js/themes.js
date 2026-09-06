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
    // Form der Auszeichnung kommt aus dem Theme (--award-clip), hier nur
    // Farbe und Name. Kein Emoji: die sehen je nach Gerät anders aus und
    // sind auf hellem Grund teils unsichtbar.
    awards: [
      { name: 'Kupferbarren', short: 'Kupfer', color: '#b06a3b' },
      { name: 'Bronzebarren', short: 'Bronze', color: '#cd7f32' },
      { name: 'Silberbarren', short: 'Silber', color: '#aab2b8' },
      { name: 'Goldbarren', short: 'Gold', color: '#e0b13a' },
      { name: 'Mithrilbarren', short: 'Mithril', color: '#7fd8e8' },
    ],
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
    awards: [
      { name: 'Weißer Gürtel', short: 'Weiß', color: '#eceaf5' },
      { name: 'Grüner Gürtel', short: 'Grün', color: '#4ce6b0' },
      { name: 'Blauer Gürtel', short: 'Blau', color: '#4be1ff' },
      { name: 'Roter Gürtel', short: 'Rot', color: '#ff4d6d' },
      { name: 'Schwarzer Gürtel', short: 'Schwarz', color: '#2a2340' },
    ],
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
    awards: [
      { name: 'Kupfersiegel', short: 'Kupfer', color: '#a1663a' },
      { name: 'Bronzesiegel', short: 'Bronze', color: '#cd7f32' },
      { name: 'Silbersiegel', short: 'Silber', color: '#9198a0' },
      { name: 'Goldsiegel', short: 'Gold', color: '#d9a521' },
      { name: 'Meistersiegel', short: 'Meister', color: '#8a5cc7' },
    ],
    sfx: { hit: { type: 'sine', freq: 440, sweep: 460, dur: 0.05 }, good: { type: 'sine', freq: 660, sweep: 880, dur: 0.12 }, bad: { type: 'sine', freq: 240, sweep: 180, dur: 0.15 } },
  },
};

export const DEFAULT_THEME = 'pergament';
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
/** Auszeichnung zu Stufe 1..5; Stufe 0 heisst "noch keine". */
export const award = (level) => (level >= 1 ? current.awards[Math.min(5, level) - 1] : null);
export const awards = () => current.awards;
export const icon = (key) => current.icons[key] ?? '';
