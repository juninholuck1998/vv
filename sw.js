const CACHE = 'cbmmg-cron-v4';
const ASSETS = [
  './index.html', './manifest.json', './css/style.css',
  './js/data.js', './js/state.js', './js/modals.js', './js/reschedule.js',
  './js/ui-dash.js', './js/ui-cal.js', './js/ui-edital.js', './js/ui-topics.js',
  './js/ui-foco.js', './js/ui-planner.js', './js/ui-questoes.js',
  './js/ui-config.js', './js/app.js',
  './icons/icon-192.png', './icons/icon-512.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).catch(() => {
    if (e.request.mode === 'navigation') return caches.match('./index.html');
  })));
});
