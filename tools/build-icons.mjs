#!/usr/bin/env node
/**
 * Baut js/icons.js aus zwei quelloffenen Icon-Sets.
 *
 * Warum ein Build-Skript und keine Laufzeit-Einbindung: Die App soll offline
 * laufen und keine fremden Server kontaktieren. Die Icons werden deshalb einmal
 * geholt, auf das Nötige reduziert (Hintergrund raus, Farbe auf currentColor)
 * und als Modul ins Repo geschrieben. Erneut ausführen: node tools/build-icons.mjs
 *
 * Quellen und Lizenzen siehe CREDITS.md – das erzeugt dieses Skript gleich mit.
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const GAME = 'https://raw.githubusercontent.com/game-icons/icons/master';
const LUCIDE = 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons';

/* game-icons.net – CC BY 3.0, Namensnennung des jeweiligen Autors nötig. */
const GAME_ICONS = {
  anvil: 'lorc/anvil',
  hammer: 'lorc/flat-hammer',
  ingot: 'lorc/metal-bar',
  seal: 'lorc/wax-seal',
  belt: 'delapouite/black-belt',
  bookOpen: 'lorc/open-book',
  bookCover: 'delapouite/book-cover',
  quill: 'lorc/quill-ink',
  scroll: 'lorc/scroll-unfurled',
  gears: 'lorc/gears',
  camera: 'delapouite/photo-camera',
  laurel: 'lorc/laurel-crown',
  spark: 'lorc/spark-spirit',
  bolt: 'lorc/energy-arrow',
  stars: 'delapouite/star-formation',
  sparkles: 'delapouite/sparkles',
  katana: 'delapouite/katana',
};

/* Lucide – ISC-Lizenz, für neutrale Bedienelemente. */
const LUCIDE_ICONS = [
  'volume-2', 'shuffle', 'repeat', 'check', 'x', 'chevron-left', 'flame',
  'lightbulb', 'search', 'plus', 'pencil', 'download', 'upload', 'trash', 'rotate-ccw',
];

const camel = (s) => s.replace(/-(\w)/g, (_, c) => c.toUpperCase());

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

function innerOf(svg) {
  const m = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  return (m ? m[1] : svg).replace(/\s*\n\s*/g, ' ').trim();
}

/** game-icons liefern ein schwarzes Hintergrundquadrat mit – das muss weg. */
function cleanGameIcon(svg) {
  let body = innerOf(svg);
  body = body.replace(/<path\s+d="M0 0h512v512H0z"\s*\/>/i, '');
  body = body.replace(/ fill="#fff"/gi, '');       // erbt currentColor vom <svg>
  return body.trim();
}

function cleanLucide(svg) {
  return innerOf(svg).replace(/>\s+</g, '><').trim();
}

const icons = {};
const credits = { game: new Map(), lucide: LUCIDE_ICONS.length };

for (const [name, path] of Object.entries(GAME_ICONS)) {
  const svg = await get(`${GAME}/${path}.svg`);
  icons[name] = { vb: '0 0 512 512', mode: 'solid', body: cleanGameIcon(svg) };
  const author = path.split('/')[0];
  credits.game.set(author, [...(credits.game.get(author) || []), path.split('/')[1]]);
  process.stdout.write(`· ${name} (${path})\n`);
}

for (const name of LUCIDE_ICONS) {
  const svg = await get(`${LUCIDE}/${name}.svg`);
  icons[camel(name)] = { vb: '0 0 24 24', mode: 'stroke', body: cleanLucide(svg) };
  process.stdout.write(`· ${camel(name)} (lucide/${name})\n`);
}

const authorNames = { lorc: 'Lorc', delapouite: 'Delapouite', willdabeast: 'Willdabeast', skoll: 'Skoll' };

const module = `/* ==========================================================================
   Icon-Bibliothek – erzeugt von tools/build-icons.mjs, nicht von Hand ändern.

   Zwei Quellen, beide quelloffen:
   · game-icons.net (CC BY 3.0) für die thematischen Motive – Amboss, Barren,
     Wachssiegel, Gürtel. Namensnennung siehe CREDITS.md.
   · Lucide (ISC) für neutrale Bedienelemente.

   Die Motive liegen als Pfaddaten im Modul, damit die App offline läuft und
   keine fremden Server kontaktiert. "solid" erbt die Farbe über fill,
   "stroke" über stroke – beides folgt currentColor.
   ========================================================================== */

export const ICONS = ${JSON.stringify(icons, null, 2)};

/**
 * Baut ein <svg>-Element. Größe in px, Farbe kommt über currentColor.
 * @param {string} name Schlüssel aus ICONS
 */
export function icon(name, { size = 24, className = '', title = '' } = {}) {
  const spec = ICONS[name];
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  if (!spec) return svg;
  svg.setAttribute('viewBox', spec.vb);
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('aria-hidden', title ? 'false' : 'true');
  if (title) svg.setAttribute('aria-label', title);
  if (className) svg.setAttribute('class', className);
  if (spec.mode === 'solid') {
    svg.setAttribute('fill', 'currentColor');
  } else {
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
  }
  svg.innerHTML = spec.body;
  return svg;
}

export const hasIcon = (name) => Boolean(ICONS[name]);
`;

await writeFile(join(ROOT, 'js/icons.js'), module, 'utf8');

const gameList = [...credits.game.entries()]
  .map(([a, list]) => `- **${authorNames[a] || a}** – ${list.sort().join(', ')}`)
  .join('\n');

const creditsMd = `# Verwendete Grafiken

Wortschmiede benutzt zwei quelloffene Icon-Sets. Beide sind mit
\`tools/build-icons.mjs\` einmalig geholt und in \`js/icons.js\` eingebettet
worden – die App lädt zur Laufzeit nichts von fremden Servern nach.

## game-icons.net

Thematische Motive: Amboss, Hammer, Barren, Wachssiegel, Gürtel, Bücher,
Schriftrolle, Federkiel, Zahnräder, Kamera, Lorbeer, Funken, Sterne, Katana.

Lizenz: [Creative Commons BY 3.0](https://creativecommons.org/licenses/by/3.0/)
Quelle: <https://game-icons.net>

Autoren der verwendeten Icons:

${gameList}

Änderungen gegenüber dem Original: Das schwarze Hintergrundquadrat wurde
entfernt und die Füllfarbe auf \`currentColor\` umgestellt, damit die Motive
die Farbe des jeweiligen Themes annehmen. Die Formen selbst sind unverändert.

## Lucide

Neutrale Bedienelemente (${credits.lucide} Symbole): Lautsprecher, Mischen,
Wiederholen, Haken, Kreuz, Pfeil, Flamme, Glühbirne, Lupe, Plus, Stift, Pfeile
für Import und Export, Papierkorb, Zurücksetzen.

Lizenz: [ISC](https://github.com/lucide-icons/lucide/blob/main/LICENSE)
Quelle: <https://lucide.dev>

## App-Icon

Der Amboss im App-Icon ist das Motiv \`anvil\` von **Lorc** (game-icons.net,
CC BY 3.0), eingefärbt und auf einen Glut-Hintergrund gesetzt. Erzeugt mit
\`tools/build-app-icon.mjs\`.
`;

await writeFile(join(ROOT, 'CREDITS.md'), creditsMd, 'utf8');

console.log(`\njs/icons.js geschrieben: ${Object.keys(icons).length} Icons`);
console.log('CREDITS.md geschrieben');
