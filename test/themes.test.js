import test from 'node:test';
import assert from 'node:assert/strict';
import { THEMES, DEFAULT_THEME } from '../js/themes.js';
import { ICONS } from '../js/icons.js';

const ids = Object.keys(THEMES);
const REFERENZ = Object.keys(THEMES.forge.lexicon);

test('das Standard-Theme existiert', () => {
  assert.ok(THEMES[DEFAULT_THEME], DEFAULT_THEME);
});

test('jedes Theme beschriftet die ganze App', () => {
  for (const id of ids) {
    const fehlt = REFERENZ.filter((k) => !THEMES[id].lexicon[k]);
    assert.deepEqual(fehlt, [], `${id}: fehlende Begriffe ${fehlt.join(', ')}`);
  }
});

test('jedes Theme hat sechs Stufen und fünf Auszeichnungen', () => {
  for (const id of ids) {
    assert.equal(THEMES[id].stages.length, 6, id);
    assert.equal(THEMES[id].awards.length, 5, id);
    for (const a of THEMES[id].awards) {
      assert.ok(a.name && a.short && /^#[0-9a-f]{6}$/i.test(a.color), `${id}: ${JSON.stringify(a)}`);
      assert.ok(a.short.length <= 10, `${id}: "${a.short}" ist zu lang für die Kachel`);
    }
  }
});

test('alle Motive stammen aus der Icon-Bibliothek', () => {
  for (const id of ids) {
    const t = THEMES[id];
    for (const [slot, name] of Object.entries(t.icons)) {
      assert.ok(ICONS[name], `${id}.icons.${slot} = "${name}" gibt es nicht`);
    }
    assert.ok(ICONS[t.awardShape], `${id}.awardShape = "${t.awardShape}" gibt es nicht`);
    if (t.deco) assert.ok(ICONS[t.deco], `${id}.deco = "${t.deco}" gibt es nicht`);
  }
});

test('jedes Theme hat die drei Klänge', () => {
  for (const id of ids) {
    for (const key of ['hit', 'good', 'bad']) {
      const s = THEMES[id].sfx[key];
      assert.ok(s && s.type && s.freq > 0 && s.sweep > 0 && s.dur > 0, `${id}.sfx.${key}`);
    }
  }
});

test('Namen und Kurzbeschreibungen sind gesetzt', () => {
  for (const id of ids) {
    assert.ok(THEMES[id].label && THEMES[id].blurb, id);
    assert.equal(THEMES[id].id, id);
  }
});

test('jedes Theme färbt die Kopfleiste dunkel genug für die Statusleiste', async () => {
  // Die Kopfleiste reicht unter die Uhr des Geräts; deren Symbole zeichnet iOS
  // dort immer hell. Ein Theme ohne eigenen Wert fiele auf ein color-mix()
  // zurück, das als theme-color nicht überall zulässig ist.
  const { readFile } = await import('node:fs/promises');
  const css = await readFile(new URL('../css/themes.css', import.meta.url), 'utf8');
  for (const id of ids) {
    const block = css.match(new RegExp(`\\[data-theme="${id}"\\][^{]*\\{[^}]*--topbar-bg:\\s*(#[0-9a-f]{6})`, 'i'));
    assert.ok(block, `${id}: --topbar-bg fehlt in css/themes.css`);
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(block[1].slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const kontrast = 1.05 / (lum + 0.05);
    assert.ok(kontrast >= 4.5, `${id}: ${block[1]} trägt weiße Symbole nur mit Kontrast ${kontrast.toFixed(2)}`);
  }
});
