// Aggiornamento dei dati di Sliding Doors.
// Scarica i risultati della stagione in corso (football-data.co.uk), il calendario (openfootball)
// e, se RSSSF le ha pubblicate, le pagine di Coppa Italia ed Europa; poi ricostruisce proto/data.js e proto/cups.js.
// uso: node tools/update.js      (stampa una riga JSON con l'esito: changed=true se i dati sono cambiati)
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const { execFileSync } = require("child_process");

const root = path.join(__dirname, "..");
const fd = path.join(root, "data-src", "fd"), rs = path.join(root, "data-src", "rsssf"), wk = path.join(root, "data-src", "wiki");
const proto = path.join(root, "proto");
const now = new Date(), start = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
const yy = n => String(n % 100).padStart(2, "0");
const code = yy(start) + yy(start + 1), season = `${start}-${yy(start + 1)}`;

async function get(url, file, { optional = false } = {}) {
  const res = await fetch(url, { headers: { "User-Agent": "sliding-doors-update" } });
  if (!res.ok) { if (optional) return false; throw new Error(`${url}: ${res.status}`) }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 200) { if (optional) return false; throw new Error(`${url}: risposta vuota`) }
  fs.writeFileSync(file, buf);
  return true;
}
const hash = f => fs.existsSync(f) ? crypto.createHash("sha1").update(fs.readFileSync(f)).digest("hex") : "";

(async () => {
  const before = [hash(path.join(proto, "data.js")), hash(path.join(proto, "cups.js"))];
  const got = {};
  got.risultati = await get(`https://www.football-data.co.uk/mmz4281/${code}/I1.csv`, path.join(fd, `${code}.csv`), { optional: true });
  got.prossimoTurno = await get("https://www.football-data.co.uk/fixtures.csv", path.join(fd, "fixtures.csv"), { optional: true });
  got.calendario = await get(`https://raw.githubusercontent.com/openfootball/football.json/master/${season}/it.1.json`, path.join(fd, "calendar.json"), { optional: true });
  got.coppaItalia = await get(`https://www.rsssf.org/tablesi/ital${start + 1}.html`, path.join(rs, `cup-${start + 1}.html`), { optional: true });
  got.europa = await get(`https://www.rsssf.org/ec/ec${start}${yy(start + 1)}.html`, path.join(rs, `ec-${start + 1}.html`), { optional: true });
  // finché RSSSF non pubblica una stagione europea (di solito con un anno di ritardo) si usano i tabellini di Wikipedia,
  // sia per la stagione in corso sia per quella appena finita
  got.europaWiki = false;
  fs.mkdirSync(wk, { recursive: true });
  for (const s of [start - 1, start]) {
    if (fs.existsSync(path.join(rs, `ec-${s + 1}.html`))) continue;
    for (const [key, comp] of [["cl", "Champions_League"], ["el", "Europa_League"], ["ecl", "Conference_League"]])
      for (const [part, page] of [["q", "qualifying_(third_and_play-off_round_matches)"], ["lp", "league_phase"], ["ko", "knockout_phase"], ["f", "final"]]) {
        // la finale ha una pagina sua, intitolata con l'anno solare: "2026_UEFA_Champions_League_final"
        const title = encodeURIComponent(part === "f" ? `${s + 1}_UEFA_${comp}_${page}` : `${s}–${yy(s + 1)}_UEFA_${comp}_${page}`);
        if (await get(`https://en.wikipedia.org/w/index.php?title=${title}&action=raw`, path.join(wk, `${s + 1}-${key}-${part}.txt`), { optional: true })) got.europaWiki = true;
      }
  }

  const log = [];
  log.push(execFileSync(process.execPath, [path.join(__dirname, "build-seriea.js"), fd, path.join(proto, "data.js")]).toString().trim());
  execFileSync(process.execPath, [path.join(__dirname, "parse.js"), rs, path.join(proto, "cups.js"), wk]);

  // ultima partita giocata della stagione in corso
  global.window = {};
  eval(fs.readFileSync(path.join(proto, "data.js"), "utf8"));
  const cur = window.SERIE_A[Object.keys(window.SERIE_A).sort().pop()];

  // football-data.co.uk carica i risultati con giorni di ritardo: le partite già finite che mancano si prendono da ESPN (ultimi 21 giorni)
  const NOMI = { "AC Milan": "Milan", "Internazionale": "Inter", "AS Roma": "Roma", "Hellas Verona": "Verona" };
  const ymd = d => d.toISOString().slice(0, 10).replace(/-/g, "");
  let daEspn = 0;
  for (let n = 0; n <= 21; n++) {
    let ev = [];
    try {
      const r = await fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/ita.1/scoreboard?dates=" + ymd(new Date(Date.now() - n * 864e5)));
      if (r.ok) ev = (await r.json()).events || [];
    } catch { }
    for (const e of ev) {
      if (e.status.type.state !== "post" || !e.status.type.completed) continue;
      const c = e.competitions[0].competitors, H = c.find(x => x.homeAway === "home"), A = c.find(x => x.homeAway === "away");
      if (!H || !A) continue;
      const m = cur.find(x => x[1] === (NOMI[H.team.displayName] || H.team.displayName) && x[2] === (NOMI[A.team.displayName] || A.team.displayName));
      // anche la data: il calendario a volte ha quella vecchia di una partita spostata
      if (m && m[3] === null) { m[3] = +H.score; m[4] = +A.score; m[0] = new Date(e.date).toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" }); daEspn++ }
    }
  }
  if (daEspn) fs.writeFileSync(path.join(proto, "data.js"), "window.SERIE_A=" + JSON.stringify(window.SERIE_A) + ";");
  got.espn = daEspn;
  const played = cur.filter(m => m[3] !== null);
  const after = [hash(path.join(proto, "data.js")), hash(path.join(proto, "cups.js"))];
  console.log(JSON.stringify({
    season, scaricati: got, giocate: played.length, daGiocare: cur.length - played.length,
    ultimaGiocata: played.map(m => m[0]).sort().pop(),
    changed: after[0] !== before[0] || after[1] !== before[1], log
  }));
})().catch(e => { console.error("ERRORE aggiornamento:", e.message); process.exit(1) });
