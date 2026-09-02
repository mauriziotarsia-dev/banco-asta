/* Cache dei file dell'app: dopo la prima apertura funziona senza rete.
   Il motore dei prezzi e' tutto locale, quindi offline gli ordini escono
   lo stesso. Solo le funzioni AI hanno bisogno della connessione. */
const CACHE = "banco-v1";
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

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;              // le chiamate al proxy passano dirette
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copia = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copia).catch(() => {}));
      return res;
    }).catch(() => hit))
  );
});
