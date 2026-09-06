#!/usr/bin/env node
/**
 * Erzeugt die App-Icons (assets/icon-*.png und icon.svg) aus dem Amboss-Motiv
 * der Icon-Bibliothek. Gerendert wird mit Chromium über Playwright, damit die
 * Kanten sauber sind – kein ImageMagick nötig.
 *
 *   node tools/build-app-icon.mjs
 *
 * Motiv: "anvil" von Lorc, game-icons.net, CC BY 3.0 (siehe CREDITS.md).
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';
import { ICONS } from '../js/icons.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXECUTABLE = process.env.CHROMIUM_PATH || undefined;

/** Das Icon: Amboss in warmem Stahl auf dunklem Grund mit Glut von unten. */
function svgMarkup({ pad = 0.12 } = {}) {
  const anvil = ICONS.anvil.body;
  const inner = 512 * (1 - 2 * pad);
  const scale = inner / 512;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="ember" cx="50%" cy="106%" r="72%">
      <stop offset="0%" stop-color="#ff9c22"/>
      <stop offset="34%" stop-color="#a33f05"/>
      <stop offset="78%" stop-color="#2a1a12"/>
      <stop offset="100%" stop-color="#150f0c"/>
    </radialGradient>
    <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f2e3cd"/>
      <stop offset="55%" stop-color="#c9cdd4"/>
      <stop offset="100%" stop-color="#8d939c"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#ember)"/>
  <g transform="translate(${512 * pad} ${512 * pad}) scale(${scale})">
    <g fill="#120c09" opacity=".55" transform="translate(0 14)">${anvil}</g>
    <g fill="url(#steel)">${anvil}</g>
  </g>
  <g fill="#ffc442">
    <circle cx="150" cy="120" r="9"/><circle cx="366" cy="104" r="7"/>
    <circle cx="410" cy="176" r="5"/><circle cx="108" cy="196" r="6"/>
  </g>
</svg>`;
}

const svg = svgMarkup();
await writeFile(join(ROOT, 'assets/icon.svg'), svg, 'utf8');

const browser = await chromium.launch(EXECUTABLE ? { executablePath: EXECUTABLE } : {});
const page = await browser.newPage();

for (const [file, size, pad] of [
  ['assets/icon-192.png', 192, 0.12],
  ['assets/icon-512.png', 512, 0.12],
  ['assets/apple-touch-icon.png', 180, 0.12],
  ['assets/icon-maskable-512.png', 512, 0.26],   // mehr Rand für runde Masken
]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>html,body{margin:0;padding:0}svg{display:block;width:${size}px;height:${size}px}</style>${svgMarkup({ pad })}`,
  );
  await page.screenshot({ path: join(ROOT, file), omitBackground: false });
  console.log(`· ${file} (${size}px)`);
}

await browser.close();
console.log('\nApp-Icons neu gebaut.');
