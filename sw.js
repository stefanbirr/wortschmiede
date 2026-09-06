/* Service Worker: App-Shell offline halten.
   Strategie: eigene Dateien beim Installieren cachen, danach
   "stale-while-revalidate" – die App startet sofort, holt Updates im Hintergrund.
   Nutzerdaten liegen in localStorage und werden hier nie angefasst. */

const VERSION = 'v1';
const CACHE = `wortschmiede-${VERSION}`;

const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/base.css',
  'css/themes.css',
  'js/main.js',
  'js/router.js',
  'js/store.js',
  'js/fsrs.js',
  'js/session.js',
  'js/parse.js',
  'js/prompt.js',
  'js/languages.js',
  'js/icons.js',
  'js/demo.js',
  'js/themes.js',
  'js/ui.js',
  'js/fx.js',
  'js/util.js',
  'js/gesture.js',
  'js/views/home.js',
  'js/views/learn.js',
  'js/views/quiz.js',
  'js/views/import.js',
  'js/views/deck.js',
  'js/views/settings.js',
  'assets/icon.svg',
  'assets/icon-192.png',
  'assets/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(SHELL.map((url) => cache.add(new Request(url, { cache: 'reload' }))));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request, { ignoreSearch: true });

    const network = fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') cache.put(request, response.clone());
        return response;
      })
      .catch(() => null);

    if (cached) { event.waitUntil(network); return cached; }

    const fresh = await network;
    if (fresh) return fresh;
    if (request.mode === 'navigate') return (await cache.match('index.html')) || Response.error();
    return Response.error();
  })());
});
