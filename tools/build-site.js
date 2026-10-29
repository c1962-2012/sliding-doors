// Costruisce la versione installabile (PWA) in site/: pagine complete, manifest, icone e service worker per l'uso offline.
// Le pagine di proto/ sono frammenti (lo scheletro lo aggiunge la pubblicazione su claude.ai): qui si aggiunge a mano.
// uso: node tools/build-site.js
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, ".."), proto = path.join(root, "proto"), out = path.join(root, "site");
const assets = path.join(__dirname, "site-assets");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const files = ["app.js", "app.css", "stage3d.js", "data.js", "cups.js"];
for (const f of files) fs.copyFileSync(path.join(proto, f), path.join(out, f));
for (const f of fs.readdirSync(assets)) fs.copyFileSync(path.join(assets, f), path.join(out, f));

const head = title => `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#050a14">
<meta name="description" content="Cambia un risultato del passato e guarda come si riscrive la storia della Serie A. Un'app di ciuffa62.">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png" type="image/png">
<link rel="apple-touch-icon" href="icon-180.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Sliding Doors">
<title>${title}</title>
<style>body{margin:0;background:#050a14}[hidden]{display:none!important}</style>
</head>
<body>`;
// quando arriva una versione nuova del service worker la pagina si ricarica una volta, così non resta quella vecchia
const tail = `<script>if ("serviceWorker" in navigator) {
  const had = !!navigator.serviceWorker.controller;
  let done = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (had && !done) { done = true; location.reload() } });
  addEventListener("load", () => navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }));
}</script>
</body>
</html>
`;
// la pagina PC manda i telefoni alla versione leggera
const toMobile = `<script>if (matchMedia("(max-width: 700px) and (pointer: coarse)").matches && !/[?&]pc\\b/.test(location.search)) location.replace("mobile.html");</script>\n`;
for (const [src, title, extra] of [["index.html", "Sliding Doors Serie A", toMobile], ["mobile.html", "Sliding Doors Serie A", ""]]) {
  const body = fs.readFileSync(path.join(proto, src), "utf8").replace(/<title>.*?<\/title>\n?/, "");
  fs.writeFileSync(path.join(out, src), head(title) + "\n" + extra + body + tail);
}

fs.writeFileSync(path.join(out, "manifest.webmanifest"), JSON.stringify({
  name: "Sliding Doors Serie A", short_name: "Sliding Doors", lang: "it",
  description: "Cambia un risultato del passato e guarda come si riscrive la storia della Serie A.",
  start_url: "./", scope: "./", display: "standalone", background_color: "#050a14", theme_color: "#050a14",
  icons: [
    { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
  ]
}, null, 2));

// Service worker: tutto ciò che sta sul sito (pagine, codice, dati) si prende prima dalla rete, così con la connessione
// si vede sempre l'ultima versione, e dalla cache quando la rete manca. Librerie e font esterni, che non cambiano, dalla cache.
const version = new Date().toISOString();
const shell = ["./", "index.html", "mobile.html", "manifest.webmanifest", ...files, ...fs.readdirSync(assets)];
fs.writeFileSync(path.join(out, "sw.js"), `const VERSION = ${JSON.stringify(version)}, CACHE = "sd-" + VERSION;
const SHELL = ${JSON.stringify(shell)};
// cache: "reload" scavalca la cache HTTP del browser, che altrimenti potrebbe restituire i file della versione precedente
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting())) });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())) });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(fetch(req, { cache: "no-cache" }).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)) } return r })
      .catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === "opaque") { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)) }
    return r;
  })));
});
`);
console.log("sito pronto in", out, "versione", version);
