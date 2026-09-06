/* Winziger Hash-Router. Kein Framework, kein Build-Schritt. */

const routes = [];
let currentCleanup = null;
let onChange = () => {};

export function defineRoutes(list, { onNavigate } = {}) {
  routes.length = 0;
  for (const r of list) {
    routes.push({
      ...r,
      matcher: new RegExp('^' + r.path.replace(/:[^/]+/g, '([^/]+)') + '$'),
      keys: [...r.path.matchAll(/:([^/]+)/g)].map((m) => m[1]),
    });
  }
  if (onNavigate) onChange = onNavigate;
}

export const currentPath = () => (location.hash.replace(/^#/, '') || '/');

export function navigate(path, { replace = false } = {}) {
  const target = '#' + (path.startsWith('/') ? path : '/' + path);
  if (location.hash === target) { resolve(); return; }
  if (replace) location.replace(target); else location.hash = target;
}

export function back() {
  if (history.length > 1) history.back();
  else navigate('/');
}

export function resolve() {
  const path = currentPath();
  for (const route of routes) {
    const m = path.match(route.matcher);
    if (!m) continue;
    const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    mount(route, params, path);
    return;
  }
  navigate('/', { replace: true });
}

function mount(route, params, path) {
  const host = document.getElementById('view');
  try { currentCleanup?.(); } catch (err) { console.warn(err); }
  currentCleanup = null;
  host.innerHTML = '';
  const node = route.render(params);
  currentCleanup = node?.__cleanup || null;
  host.append(node);
  host.scrollTo?.({ top: 0 });
  window.scrollTo({ top: 0 });
  onChange({ path, route, params });
}

export function startRouter() {
  window.addEventListener('hashchange', resolve);
  resolve();
}
