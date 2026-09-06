# Eigenes Theme bauen

Ein Theme in Wortschmiede besteht aus **zwei Stellen**. Mehr nicht – weder Views noch
Komponenten müssen angefasst werden.

## 1. Optik: Token-Block in `css/themes.css`

`css/base.css` enthält bewusst keine einzige Farbangabe, sondern nur Design-Tokens.
Ein neues Theme setzt sie unter seinem Selektor neu:

```css
[data-theme="cyber"] {
  --bg: #06080f;
  --bg-elev: #0e1424;
  --bg-sunken: #04060c;
  --ink: #d7f5ff;
  --ink-dim: #7fa6bd;
  --ink-faint: #4d6b80;
  --accent: #00e5ff;
  --accent-2: #b8ff3d;
  --accent-ink: #04060c;
  --ok: #46f0a0;  --warn: #ffd166;  --bad: #ff4d6d;
  --line: #1d2b45;
  --radius: 2px;  --radius-lg: 4px;
  --font-display: "Courier New", ui-monospace, monospace;
  --display-transform: uppercase;
  --display-shadow: 0 0 10px rgba(0, 229, 255, .6);
  --card-face: linear-gradient(180deg, #101a2e, #070c16);
  --glow: radial-gradient(120% 60% at 50% 110%, rgba(0, 229, 255, .3), transparent 70%);
  --texture: repeating-linear-gradient(0deg, rgba(0,229,255,.05) 0 1px, transparent 1px 3px);
  --frame: inset 0 1px 0 rgba(255,255,255,.2);
  --deco: none;
}
```

Wichtige Tokens:

| Token | Wirkung |
|---|---|
| `--bg`, `--bg-elev`, `--bg-sunken` | Grundflächen, Panels, vertiefte Felder |
| `--ink`, `--ink-dim`, `--ink-faint` | Textfarben nach Wichtigkeit |
| `--accent`, `--accent-2`, `--accent-ink` | Aktionsfarben und Text darauf |
| `--radius`, `--radius-lg` | eckig (Pixel-Look) oder rund (Anime-Look) |
| `--frame` | Kantenwirkung: harte 3px-Stufe, weicher Glow oder Haarlinie |
| `--card-face` | Oberfläche der Lernkarten |
| `--texture` | Hintergrundmuster des Bodys |
| `--glow` | Lichtstimmung hinter allem |
| `--deco` | dekorative Silhouette am unteren Rand (`--deco-opacity` regelt die Stärke) |
| `--font-display`, `--display-transform`, `--display-spacing`, `--display-shadow` | Überschriften-Charakter |

Farben immer als Token setzen. Wer im Theme zusätzlich Komponenten anpassen will,
schreibt gezielte Regeln wie `[data-theme="cyber"] .btn { … }` – aber sparsam.

## 2. Sprache und Klang: Eintrag in `js/themes.js`

```js
cyber: {
  id: 'cyber',
  label: 'Cyber',
  blurb: 'Terminalgrün und Neonröhren.',
  pixel: true,                       // schaltet image-rendering: pixelated
  icons: { home: 'anvil', learn: 'bookOpen', quiz: 'hammer', import: 'camera',
           settings: 'gears', good: 'spark', streak: 'flame' },
  awardShape: 'ingot',               // Form der Auszeichnungen: ingot | belt | seal
  lexicon: {
    appTitle: 'Dein Terminal',
    homeTab: 'Terminal', settingsTab: 'Config',
    decks: 'Module', allDecks: 'Alle Module',
    quiz: 'Drill', quizStart: 'Drill starten', learn: 'Einprägen',
    session: 'Durchlauf',
    correct: 'ACCEPTED', wrong: 'REJECTED', near: 'ALMOST',
    done: 'Session beendet',
    xp: 'Bytes', streak: 'Uptime',
    mastered: 'Kompiliert', masteredShort: 'Fertig',
  },
  stages: ['Rohdaten', 'Geparst', 'Kompiliert', 'Getestet', 'Optimiert', 'Ausgeliefert'],
  awards: [
    { name: 'Bronze-Build', short: 'Bronze', color: '#cd7f32' },
    { name: 'Silber-Build', short: 'Silber', color: '#aab2b8' },
    { name: 'Gold-Build',   short: 'Gold',   color: '#e0b13a' },
    { name: 'Platin-Build', short: 'Platin', color: '#8fe3ff' },
    { name: 'Release',      short: 'Release', color: '#46f0a0' },
  ],
  sfx: {
    hit:  { type: 'square',   freq: 220, sweep: 110, dur: .07 },
    good: { type: 'square',   freq: 660, sweep: 990, dur: .14 },
    bad:  { type: 'sawtooth', freq: 180, sweep: 60,  dur: .2 },
  },
},
```

- `lexicon` ersetzt Beschriftungen in der ganzen App. Fehlt ein Schlüssel, erscheint
  der Schlüsselname – also am besten den `forge`-Block als Vorlage kopieren.
- `stages` sind die sechs Fortschrittsstufen (Index 0 = noch nie abgefragt).
- `icons` verweist auf Motive aus `js/icons.js` (Schlüssel dort nachsehen).
  Wer ein Motiv braucht, das noch fehlt, trägt es in `tools/build-icons.mjs`
  ein und lässt `npm run icons` laufen – das aktualisiert auch CREDITS.md.
- `awardShape` bestimmt, wie die Auszeichnungen aussehen: `ingot` (Barren),
  `belt` (Gürtel) oder `seal` (Wachssiegel). Es ist ein gewöhnlicher
  Icon-Schlüssel, jedes andere Motiv geht also auch.
- `awards` sind die fünf Auszeichnungen für ein vollständig gelerntes Deck.
  `name` steht im Abzeichen und im Erfolgsbanner, `short` in den Kacheln,
  `color` färbt das Motiv – keine Emojis, damit es auf jedem Gerät und in
  beiden Helligkeiten gleich aussieht.
- `sfx` beschreibt kurze synthetische Töne (Web Audio), es werden keine Dateien geladen.
  `type` ist eine Oszillatorform (`sine`, `square`, `triangle`, `sawtooth`),
  `freq` → `sweep` die Tonhöhenrampe in Hz, `dur` die Dauer in Sekunden.

Das Theme taucht danach automatisch in der Werkbank auf – die Auswahl wird aus
`THEMES` erzeugt.

## Checkliste

- [ ] Kontrast geprüft: heller Text auf `--bg` und auf `--accent` gut lesbar?
- [ ] Beide Extreme angeschaut: leere Startseite und volle Abfrage.
- [ ] `--accent-ink` passt zur Füllung der Primärbuttons (Text darauf lesbar)?
- [ ] Auf einem schmalen Gerät (≈360 px) getestet.
- [ ] Wenn `--deco` gesetzt ist: stört die Silhouette nicht in der Abfrage?
