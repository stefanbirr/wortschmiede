/* Kleine Helfer: DOM, Text, Zeit, Zufall. Keine App-Logik. */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Element bauen: el('div.klasse', {attr}, ...kinder) */
export function el(spec, props = {}, ...children) {
  const [tag, ...classes] = String(spec).split('.');
  const node = document.createElement(tag || 'div');
  if (classes.length) node.className = classes.join(' ');
  for (const [k, v] of Object.entries(props || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className += (node.className ? ' ' : '') + v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v === true) node.setAttribute(k, '');
    else node.setAttribute(k, v);
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

export const uid = () =>
  (crypto.randomUUID?.() ?? 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
export const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
export const sample = (arr, n) => shuffle(arr).slice(0, n);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* ---- Zeit ---- */
export const DAY = 86400000;
export const now = () => Date.now();
export const dayKey = (ts = Date.now()) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export function humanDue(ts) {
  if (!ts) return 'neu';
  const diff = ts - Date.now();
  if (diff <= 0) return 'fällig';
  const d = diff / DAY;
  if (d < 1 / 24) return `in ${Math.max(1, Math.round(diff / 60000))} min`;
  if (d < 1) return `in ${Math.round(diff / 3600000)} h`;
  if (d < 31) return `in ${Math.round(d)} T`;
  if (d < 365) return `in ${Math.round(d / 30.4)} Mon`;
  return `in ${(d / 365).toFixed(1)} J`;
}

/* ---- Textvergleich fuer Tipp-Aufgaben ---- */
export function normalizeAnswer(s, { ignoreCase = true, ignoreAccents = false, ignoreArticles = true } = {}) {
  let t = String(s ?? '').trim();
  t = t.replace(/\([^)]*\)/g, ' ');           // Klammerzusaetze weg
  t = t.replace(/[.,;:!?"'`´’]/g, ' ');       // Satzzeichen weg
  t = t.replace(/\s+/g, ' ').trim();
  if (ignoreCase) t = t.toLowerCase();
  if (ignoreAccents) t = t.normalize('NFD').replace(/\p{Diacritic}/gu, '');
  if (ignoreArticles) t = t.replace(/^(der|die|das|the|a|an|le|la|les|un|une|el|los|las|il|lo|gli)\s+/i, '');
  return t;
}

export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

const stripAccents = (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '');

/**
 * 'exact' | 'accent' | 'typo' | 'wrong'
 * 'accent' heisst: bis auf Laengenstriche/Akzente richtig (cogitare statt
 * cōgitāre). Solche Zeichen stehen auf keiner Handytastatur – das als falsch
 * zu werten waere Schikane, als voll richtig zu werten waere geschummelt.
 * Also: zaehlt als "fast", Note "Schwer". Wer es ganz ignorieren will, schaltet
 * in der Werkbank "Akzente/Umlaute ignorieren" ein – dann gilt es als exakt.
 * Tippfehlertoleranz skaliert mit der Wortlaenge.
 */
export function gradeText(input, solutions, opts = {}) {
  const given = normalizeAnswer(input, opts);
  if (!given) return 'wrong';
  const cands = solutions.filter(Boolean).map((s) => normalizeAnswer(s, opts));
  if (cands.includes(given)) return 'exact';
  if (!opts.ignoreAccents) {
    const bare = stripAccents(given);
    if (cands.some((c) => stripAccents(c) === bare)) return 'accent';
  }
  if (!opts.typoTolerance) return 'wrong';
  for (const c of cands) {
    const budget = c.length <= 4 ? 0 : c.length <= 8 ? 1 : 2;
    if (budget && levenshtein(given, c) <= budget) return 'typo';
  }
  return 'wrong';
}

/* ---- Sonstiges ---- */
export function debounce(fn, ms = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
export function download(filename, text, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = el('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = el('textarea', { style: 'position:fixed;opacity:0' });
    ta.value = text;
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand?.('copy');
    ta.remove();
    return !!ok;
  }
}
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
