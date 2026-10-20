/* Service worker do Tabuada Turbo: guarda o jogo no aparelho para funcionar sem internet. */
const VERSION = 'tabuada-turbo-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  /* Arquivos do próprio jogo: responde do cache e atualiza em segundo plano. */
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.open(VERSION).then((cache) =>
        cache.match(req, { ignoreSearch: true }).then((hit) => {
          const net = fetch(req).then((res) => {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
          });
          net.catch(() => {});
          return hit || net.catch(() => cache.match('./index.html'));
        })
      )
    );
    return;
  }

  /* Fontes do Google: guarda na primeira visita online para uso offline. */
  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith(
      caches.open(VERSION).then((cache) =>
        cache.match(req).then((hit) => {
          const net = fetch(req).then((res) => {
            if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
            return res;
          });
          net.catch(() => {});
          return hit || net;
        })
      )
    );
  }
});
