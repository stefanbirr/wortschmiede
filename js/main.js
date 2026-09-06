/* App-Start: Theme setzen, Routen registrieren, Service Worker anmelden. */

import { $, el } from './util.js';
import { icon as svgIcon } from './icons.js';
import { getSettings, subscribe, globalStats, getState } from './store.js';
import { applyTheme, t, iconEl } from './themes.js';
import { defineRoutes, startRouter, navigate, back, currentPath } from './router.js';
import { toast } from './ui.js';

import * as home from './views/home.js';
import * as learn from './views/learn.js';
import * as quiz from './views/quiz.js';
import * as importView from './views/import.js';
import * as deckView from './views/deck.js';
import * as settingsView from './views/settings.js';

applyTheme(getSettings().theme);

defineRoutes([
  { path: '/', render: home.render, tab: '/', title: 'Wortschmiede', root: true },
  { path: '/lernen', render: learn.render, tab: '/lernen', title: 'Einprägen', root: true },
  { path: '/lernen/:deckId', render: learn.render, tab: '/lernen', title: 'Einprägen' },
  { path: '/schmieden', render: quiz.render, tab: '/schmieden', title: 'Abfrage', root: true },
  { path: '/schmieden/:deckId', render: quiz.render, tab: '/schmieden', title: 'Abfrage' },
  { path: '/import', render: importView.render, tab: '/import', title: 'Import', root: true },
  { path: '/deck/:deckId', render: deckView.render, tab: '/', title: 'Deck' },
  { path: '/einstellungen', render: settingsView.render, tab: '/einstellungen', title: 'Werkbank', root: true },
], {
  onNavigate: ({ route }) => {
    for (const a of document.querySelectorAll('.tabbar a')) {
      a.toggleAttribute('aria-current', a.dataset.tab === route.tab);
      if (a.dataset.tab === route.tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    }
    document.title = route.title === 'Wortschmiede' ? 'Wortschmiede' : `${route.title} · Wortschmiede`;
    $('#btn-back').hidden = !!route.root;
    $('#view').focus({ preventScroll: true });
    renderTopStats();
  },
});

function renderTopStats() {
  const g = globalStats();
  const p = getState().progress;
  const host = $('#topbar-stats');
  host.innerHTML = '';
  host.append(
    el('span', { title: 'fällige Wiederholungen' }, svgIcon('repeat', { size: 14 }), el('b', {}, String(g.due))),
    el('span', { title: t('streak') }, iconEl('streak', { size: 14 }), el('b', {}, String(p.streak || 0))),
  );
}

$('#btn-back').addEventListener('click', () => back());
subscribe(() => renderTopStats());

window.addEventListener('ws:storage-full', () => {
  toast('Der Speicher dieses Browsers ist voll. Exportiere ein Backup und lösche alte Decks.', 6000);
});

// Tab-Links sollen im PWA-Kontext nicht scrollen, sondern nur die Route wechseln.
for (const a of document.querySelectorAll('.tabbar a')) {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    const target = a.getAttribute('href').slice(1);
    if (currentPath() === target) navigate(target);
    else navigate(target);
  });
}

startRouter();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => console.warn('SW nicht registriert:', err));
  });
}
