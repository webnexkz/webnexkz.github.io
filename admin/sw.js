// Админка без интернета: страница, настройки, шрифты и иконки хранятся в браузере.
// Страница и config.js — сначала из сети (чтобы обновления доходили сразу), без сети — сохранённая копия.
// Заявки сюда не попадают: запросы к таблице (POST, script.google.com) идут мимо.
var CACHE = 'wx-admin-v1';
var SHELL = ['./', 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
  '../config.js', '../favicon.svg',
  '../fonts/unbounded-cyr.woff2', '../fonts/unbounded-latext.woff2', '../fonts/unbounded-lat.woff2',
  '../fonts/golos-cyr.woff2', '../fonts/golos-latext.woff2', '../fonts/golos-lat.woff2'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('wx-admin-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function fresh(req, key) {
  return new Promise(function (ok) {
    var done = false;
    var fallback = function () {
      if (done) return;
      caches.match(key, { ignoreSearch: true }).then(function (r) { if (r && !done) { done = true; ok(r); } });
    };
    var t = setTimeout(fallback, 3000);                                // плохой интернет — через 3 с показываю копию
    fetch(req).then(function (r) {
      if (r && r.ok) { var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(key, copy); }); }
      clearTimeout(t);
      if (!done) { done = true; ok(r); }
    }).catch(function () {
      clearTimeout(t);
      caches.match(key, { ignoreSearch: true }).then(function (r) { if (!done) { done = true; ok(r || Response.error()); } });
    });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (req.mode === 'navigate' && url.pathname.replace(/index\.html$/, '') === new URL('./', self.registration.scope).pathname) {
    e.respondWith(fresh(req, './'));
    return;
  }
  if (/\/config\.js$/.test(url.pathname)) { e.respondWith(fresh(req, '../config.js')); return; }
  if (/\.(woff2|png|svg|webmanifest)$/.test(url.pathname)) {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (r) { return r || fetch(req); }));
  }
});
