/* ==========================================================================
   Theme-Registry.
   Ein Theme besteht aus zwei Teilen:
     1. Optik   -> Token-Block in css/themes.css unter [data-theme="id"]
     2. Sprache -> dieser Eintrag: Stufennamen, Begriffe, Icons, Klaenge
   Ein neues Theme braucht genau diese beiden Stellen. Sonst nichts.
   Siehe docs/THEMES.md.
   ========================================================================== */

import { ICONS, icon as svgIcon, hasIcon } from './icons.js';

export const THEMES = {
  forge: {
    id: 'forge',
    label: 'Schmiede',
    blurb: 'Amboss, Glut und grobe Pixelkanten.',
    pixel: true,
    icons: { home: 'anvil', learn: 'bookOpen', quiz: 'hammer', import: 'camera', settings: 'gears', good: 'spark', streak: 'flame' },
    awardShape: 'ingot',
    deco: 'anvil',
    decoOpacity: 0.5,
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
      { name: 'Sternenstahl', short: 'Stern', color: '#7fd8e8' },
    ],
    sfx: { hit: { type: 'square', freq: 180, sweep: 90, dur: 0.09 }, good: { type: 'triangle', freq: 520, sweep: 880, dur: 0.16 }, bad: { type: 'sawtooth', freq: 200, sweep: 70, dur: 0.22 } },
  },

  anime: {
    id: 'anime',
    label: 'Anime',
    blurb: 'Neonlicht, Speedlines und Sternenstaub.',
    pixel: false,
    icons: { home: 'stars', learn: 'bookCover', quiz: 'bolt', import: 'camera', settings: 'gears', good: 'sparkles', streak: 'flame' },
    awardShape: 'belt',
    deco: 'katana',
    decoColor: '#ff4d97',
    decoOpacity: 0.25,
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
    icons: { home: 'scroll', learn: 'bookCover', quiz: 'quill', import: 'camera', settings: 'gears', good: 'laurel', streak: 'flame' },
    awardShape: 'seal',
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

  fussball: {
    id: 'fussball',
    label: 'Fußball',
    blurb: 'Flutlicht, Rasenstreifen und Anpfiff.',
    pixel: false,
    icons: { home: 'soccerBall', learn: 'bookOpen', quiz: 'whistle', import: 'camera', settings: 'gears', good: 'trophyCup', streak: 'flame' },
    awardShape: 'trophyCup',
    deco: 'soccerField',
    decoOpacity: 0.22,
    lexicon: {
      appTitle: 'Deine Kabine',
      homeTab: 'Kabine',
      settingsTab: 'Trainerbank',
      decks: 'Spieltage',
      allDecks: 'Alle Spieltage',
      quiz: 'Spiel',
      quizStart: 'Anpfiff',
      learn: 'Aufwärmen',
      session: 'Halbzeit',
      correct: 'Tor!',
      wrong: 'Daneben – Abstoß.',
      near: 'Pfosten!',
      done: 'Abpfiff!',
      xp: 'Punkte',
      streak: 'Serie',
      mastered: 'Titel',
      masteredShort: 'Titel',
    },
    stages: ['Neuzugang', 'Reservebank', 'Einwechselspieler', 'Stammspieler', 'Leistungsträger', 'Kapitän'],
    awards: [
      { name: 'Kreispokal', short: 'Kreis', color: '#b06a3b' },
      { name: 'Bezirkspokal', short: 'Bezirk', color: '#cd7f32' },
      { name: 'Landespokal', short: 'Land', color: '#aab2b8' },
      { name: 'Goldpokal', short: 'Gold', color: '#e0b13a' },
      { name: 'Meisterpokal', short: 'Meister', color: '#4ade80' },
    ],
    sfx: { hit: { type: 'square', freq: 300, sweep: 160, dur: .06 }, good: { type: 'triangle', freq: 620, sweep: 1040, dur: .17 }, bad: { type: 'sawtooth', freq: 220, sweep: 90, dur: .2 } },
  },

  wald: {
    id: 'wald',
    label: 'Dunkler Wald',
    blurb: 'Nebel zwischen alten Stämmen, Fackelschein.',
    pixel: false,
    icons: { home: 'oak', learn: 'bookCover', quiz: 'bowArrow', import: 'camera', settings: 'gears', good: 'leaf', streak: 'torch' },
    awardShape: 'runeStone',
    deco: 'pineTree',
    decoOpacity: 0.55,
    lexicon: {
      appTitle: 'Dein Lager',
      homeTab: 'Lager',
      settingsTab: 'Ausrüstung',
      decks: 'Pfade',
      allDecks: 'Alle Pfade',
      quiz: 'Wanderung',
      quizStart: 'Aufbrechen',
      learn: 'Einprägen',
      session: 'Etappe',
      correct: 'Der Pfad ist frei.',
      wrong: 'Der Nebel schluckt dich.',
      near: 'Fast – der Pfad ist eng.',
      done: 'Etappe geschafft.',
      xp: 'Fackeln',
      streak: 'Wanderung',
      mastered: 'Gesichert',
      masteredShort: 'Sicher',
    },
    stages: ['Fremder', 'Wanderer', 'Späher', 'Waldläufer', 'Hüter', 'Wächter'],
    awards: [
      { name: 'Eichenrune', short: 'Eiche', color: '#8a6a3c' },
      { name: 'Moosrune', short: 'Moos', color: '#6f9e5a' },
      { name: 'Silberrune', short: 'Silber', color: '#a9b6bd' },
      { name: 'Bernsteinrune', short: 'Bernstein', color: '#d99b32' },
      { name: 'Sternenrune', short: 'Stern', color: '#9fd8ff' },
    ],
    sfx: { hit: { type: 'triangle', freq: 240, sweep: 140, dur: .09 }, good: { type: 'sine', freq: 480, sweep: 760, dur: .2 }, bad: { type: 'sawtooth', freq: 150, sweep: 60, dur: .26 } },
  },

  space: {
    id: 'space',
    label: 'Weltraum',
    blurb: 'Sternenfeld, Instrumentenlicht, Startfreigabe.',
    pixel: false,
    icons: { home: 'ringedPlanet', learn: 'bookCover', quiz: 'rocket', import: 'camera', settings: 'gears', good: 'starMedal', streak: 'flame' },
    awardShape: 'starMedal',
    deco: 'spaceship',
    decoColor: '#5fb0ff',
    decoOpacity: 0.3,
    lexicon: {
      appTitle: 'Deine Brücke',
      homeTab: 'Brücke',
      settingsTab: 'Systeme',
      decks: 'Sektoren',
      allDecks: 'Alle Sektoren',
      quiz: 'Simulation',
      quizStart: 'Startfreigabe',
      learn: 'Einprägen',
      session: 'Flug',
      correct: 'Treffer!',
      wrong: 'Fehlschuss.',
      near: 'Streifschuss.',
      done: 'Mission erfüllt.',
      xp: 'Energie',
      streak: 'Flugtage',
      mastered: 'Gesichert',
      masteredShort: 'Sicher',
    },
    stages: ['Anwärter', 'Rekrut', 'Kadett', 'Pilot', 'Offizier', 'Kommandant'],
    awards: [
      { name: 'Bronzestern', short: 'Bronze', color: '#cd7f32' },
      { name: 'Silberstern', short: 'Silber', color: '#b8c2cc' },
      { name: 'Goldstern', short: 'Gold', color: '#f0c24b' },
      { name: 'Platinstern', short: 'Platin', color: '#7fe6d8' },
      { name: 'Novastern', short: 'Nova', color: '#8ea2ff' },
    ],
    sfx: { hit: { type: 'square', freq: 900, sweep: 400, dur: .05 }, good: { type: 'sine', freq: 700, sweep: 1500, dur: .16 }, bad: { type: 'sawtooth', freq: 260, sweep: 80, dur: .24 } },
  },
};

export const DEFAULT_THEME = 'pergament';
let current = THEMES[DEFAULT_THEME];

/** Motiv als CSS-Hintergrundbild – für die Silhouette am unteren Bildrand. */
function decoUrl(name, color = '#000') {
  const spec = ICONS[name];
  if (!spec) return null;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${spec.vb}" fill="${color}">${spec.body}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function applyTheme(id) {
  const theme = THEMES[id] || THEMES[DEFAULT_THEME];
  current = theme;
  const root = document.documentElement;
  root.dataset.theme = theme.id;
  root.dataset.pixel = theme.pixel ? '1' : '0';

  // Silhouette: das Theme nennt ein Motiv, das CSS bekommt daraus ein Bild.
  const deco = theme.deco ? decoUrl(theme.deco, theme.decoColor || '#000') : null;
  if (deco) {
    root.style.setProperty('--deco', deco);
    root.style.setProperty('--deco-opacity', String(theme.decoOpacity ?? 0.4));
  } else {
    root.style.removeProperty('--deco');
    root.style.removeProperty('--deco-opacity');
  }
  // Tab-Icons folgen dem Theme
  const map = { '/': 'home', '/lernen': 'learn', '/schmieden': 'quiz', '/import': 'import', '/einstellungen': 'settings' };
  for (const a of document.querySelectorAll('.tabbar a')) {
    const key = map[a.dataset.tab];
    const slot = a.querySelector('.tabbar__icon');
    if (!key || !slot) continue;
    slot.replaceChildren(svgIcon(theme.icons[key], { size: 22 }));
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
/** Motiv des aktuellen Themes als <svg>. */
export function iconEl(key, opts = {}) {
  const name = current.icons[key] || key;
  return svgIcon(hasIcon(name) ? name : 'spark', opts);
}
export const iconName = (key) => current.icons[key] || key;
export const awardShape = () => current.awardShape || 'seal';
