/* Cache offline.
   ATTENZIONE al criterio: app.js e index.html vanno presi PRIMA dalla rete
   e solo in mancanza dalla cache, altrimenti dopo un aggiornamento su GitHub
   continueresti a vedere la versione vecchia per sempre.
   Le librerie da CDN invece sono immutabili: quelle prima dalla cache. */
const CACHE = "banco-v2";
const FILE = ["./", "./index.html", "./app.js", "./manifest.webmanifest",
  "./icona-192.png", "./icona-512.png", "./icona-180.png",
  "https://cdn.tailwindcss.com",
  "https://unpkg.com/react@18/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
  "https://unpkg.com/@babel/standalone/babel.min.js"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) =>
    Promise.all(FILE.map((f) => c.add(f).catch(() => {})))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((k) =>
    Promise.all(k.filter((x) => x !== CACHE).map((x) => caches.delete(x)))).then(() => self.clients.claim()));
});

const mio = (url) => new URL(url).origin === self.location.origin;

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;   // le chiamate al proxy passano dirette

  // roba mia: prima la rete, cosi' gli aggiornamenti arrivano subito
  if (mio(e.request.url)) {
    e.respondWith(
      fetch(e.request).then((res) => {
        const copia = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copia).catch(() => {}));
        return res;
      }).catch(() => caches.match(e.request))   // senza rete, la copia in cache
    );
    return;
  }

  // librerie esterne: non cambiano mai, prima la cache
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copia = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copia).catch(() => {}));
      return res;
    }))
  );
});
