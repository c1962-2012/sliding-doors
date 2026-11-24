// Costruisce la versione installabile (PWA) in site/: pagine complete, manifest, icone e service worker per l'uso offline.
// Le pagine di proto/ sono frammenti (lo scheletro lo aggiunge la pubblicazione su claude.ai): qui si aggiunge a mano.
// uso: node tools/build-site.js
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, ".."), proto = path.join(root, "proto"), out = path.join(root, "site");
const assets = path.join(__dirname, "site-assets");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const files = ["app.js", "app.css", "stage3d.js", "data.js", "cups.js", "marcatori-a.js", "rose-a.js", "minuti-a.js", "video-a.js"];
for (const f of files) fs.copyFileSync(path.join(proto, f), path.join(out, f));
for (const f of fs.readdirSync(assets)) fs.copyFileSync(path.join(assets, f), path.join(out, f));
// la guida: pagina, immagini e PDF
for (const f of ["guida.html", "Sliding Doors - guida completa.pdf"]) fs.copyFileSync(path.join(proto, f), path.join(out, f));
fs.cpSync(path.join(proto, "guida-img"), path.join(out, "guida-img"), { recursive: true });
// gli annunci vocali del gol, uno per squadra
fs.cpSync(path.join(proto, "voci"), path.join(out, "voci"), { recursive: true });

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
<!-- anteprima quando il link si condivide su WhatsApp, Instagram, Facebook, Telegram -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="Sliding Doors Serie A">
<meta property="og:title" content="Sliding Doors Serie A">
<meta property="og:description" content="Cambia un risultato e riscrivi la storia della Serie A. Risultati live, classifica, cannonieri. Un'app di ciuffa62.">
<meta property="og:url" content="https://c1962-2012.github.io/sliding-doors/">
<meta property="og:image" content="https://c1962-2012.github.io/sliding-doors/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="it_IT">
<meta name="twitter:card" content="summary_large_image">
<style>body{margin:0;background:#050a14}[hidden]{display:none!important}</style>
</head>
<body>`;
// quando arriva una versione nuova del service worker la pagina si ricarica una volta, così non resta quella vecchia
const tail = `<script>if ("serviceWorker" in navigator) {
  const had = !!navigator.serviceWorker.controller;
  let done = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (had && !done) { done = true; location.reload() } });
  // l'app installata resta spesso aperta in sottofondo: si cerca la versione nuova ogni volta che torna in primo piano e ogni 5 minuti
  addEventListener("load", () => navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(reg => {
    const check = () => reg.update().catch(() => {});
    document.addEventListener("visibilitychange", () => { if (!document.hidden) check() });
    setInterval(check, 300000);
  }));
}</script>
<!-- contatore delle visite (GoatCounter, statistiche private, senza cookie).
     Conta ogni apertura dell'app e, una volta sola per telefono o computer, il "nuovo visitatore". -->
<script>(function () {
  window.goatcounter = { no_onload: true };
  var s = document.createElement("script");
  s.async = true; s.src = "https://gc.zgo.at/count.js";
  s.setAttribute("data-goatcounter", "https://slidingdoors.goatcounter.com/count");
  s.onload = function () {
    try {
      window.goatcounter.count({ path: /mobile/.test(location.pathname) ? "/app-telefono" : "/app-pc", title: "Apertura dell'app" });
      if (!localStorage.getItem("sd-visitatore")) {
        window.goatcounter.count({ path: "nuovo-visitatore", title: "Nuovo visitatore", event: true });
        localStorage.setItem("sd-visitatore", String(Date.now()));
      }
    } catch (e) {}
  };
  document.head.appendChild(s);
})();</script>
</body>
</html>
`;
// la pagina PC manda i telefoni alla versione leggera
const toMobile = `<script>if (matchMedia("(max-width: 700px) and (pointer: coarse)").matches && !/[?&]pc\\b/.test(location.search)) location.replace("mobile.html" + location.hash);</script>\n`;
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
const shell = ["./", "index.html", "mobile.html", "guida.html", "manifest.webmanifest", ...files, ...fs.readdirSync(assets)];
fs.writeFileSync(path.join(out, "sw.js"), `const VERSION = ${JSON.stringify(version)}, CACHE = "sd-" + VERSION;
const SHELL = ${JSON.stringify(shell)};
// cache: "reload" scavalca la cache HTTP del browser, che altrimenti potrebbe restituire i file della versione precedente
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting())) });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())) });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.hostname.endsWith("espn.com")) return; // risultati live: sempre dalla rete, mai dalla cache
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
// Rivedi (app separata per le dirette Twitch): pubblicata in /rivedi/
const rivedi = path.join(__dirname, "..", "twitch-prova", "pubblica", "index.html");
if (fs.existsSync(rivedi)) { fs.mkdirSync(path.join(out, "rivedi"), { recursive: true }); fs.copyFileSync(rivedi, path.join(out, "rivedi", "index.html")); }
console.log("sito pronto in", out, "versione", version);
