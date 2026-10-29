// Server statico per l'anteprima locale: avvolge le pagine nello stesso scheletro che aggiunge la pubblicazione
const http = require("http"), fs = require("fs"), path = require("path");
const root = process.argv[2], port = +process.argv[3] || 8765;
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8" };
const skel = b => `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${b}</body></html>`;
http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html");
  if (!p.startsWith(path.resolve(root)) || !fs.existsSync(p)) { res.writeHead(404); return res.end("not found") }
  let body = fs.readFileSync(p);
  const ext = path.extname(p);
  if (ext === ".html") body = skel(body.toString("utf8"));
  res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream", "Cache-Control": "no-store" });
  res.end(body);
}).listen(port, () => console.log("http://localhost:" + port));
