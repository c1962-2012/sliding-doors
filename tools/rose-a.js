// Rose delle squadre di Serie A (da ESPN) con squalificati e diffidati calcolati dai cartellini.
// Serve alla sezione "La mia formazione". Scrive proto/rose-a.js:
// window.ROSE_A = { stagione, aggiornato, squadre: { Roma: { rosa: [[nome, ruolo P/D/C/A, numero]], squal: [[nome, motivo]], diff: [[nome, gialli]], inf: [nome] } } }
// uso da riga di comando: node tools/rose-a.js   (dopo marcatori-a.js, che scarica i cartellini della stagione)
const fs = require("fs"), path = require("path");
const { nomeApp } = require("./marcatori-a.js");
const root = path.join(__dirname, ".."), out = path.join(root, "proto", "rose-a.js");
const API = "https://site.api.espn.com/apis/site/v2/sports/soccer/ita.1/";

async function json(url) {
  for (let t = 0; t < 4; t++) {
    try { const r = await fetch(url); if (r.ok) return await r.json() } catch { }
    await new Promise(r => setTimeout(r, 1000 * (t + 1)));
  }
  return null;
}

// Regolamento Serie A: un turno di squalifica alla 5ª, 10ª, 14ª, 17ª ammonizione e poi a ogni ammonizione successiva
const soglia = n => [5, 10, 14, 17].includes(n) || n > 17;
const RUOLO = { G: "P", D: "D", M: "C", F: "A" };

// squalificati e diffidati di ogni squadra, guardando i cartellini di tutte le partite finite della stagione
function cartellini(partite, squadre) {
  const perSquadra = {};
  const finite = partite.filter(p => p[6] && p[8]).sort((a, b) => a[1].localeCompare(b[1]));
  for (const [, , h, a, , , , , cart] of finite) {
    const casa = nomeApp(h, squadre), ospite = nomeApp(a, squadre);
    for (const [lato, team] of [["h", casa], ["a", ospite]]) {
      const s = perSquadra[team] ||= { gialli: {}, nomi: {}, ultima: null };
      const miei = cart.filter(c => c[2] === lato && c[0]);
      const rossi = new Set(miei.filter(c => c[3] === "R").map(c => c[0]));
      const ultima = { rossi: [...rossi], soglia: [] };
      for (const [id, nome, , tipo] of miei) {
        s.nomi[id] = nome;
        // il giallo della partita in cui arriva il rosso (doppia ammonizione) non conta per la diffida
        if (tipo !== "G" || rossi.has(id)) continue;
        s.gialli[id] = (s.gialli[id] || 0) + 1;
        if (soglia(s.gialli[id])) ultima.soglia.push(id);
      }
      s.ultima = ultima;   // conta solo l'ultima partita giocata: le squalifiche di prima sono già scontate
    }
  }
  const esito = {};
  for (const [team, s] of Object.entries(perSquadra)) {
    const squal = [
      ...s.ultima.rossi.map(id => [s.nomi[id], "espulso nell'ultima partita"]),
      ...s.ultima.soglia.map(id => [s.nomi[id], `${s.gialli[id]}ª ammonizione`])
    ];
    const fuori = new Set(squal.map(x => x[0]));
    const diff = Object.entries(s.gialli).filter(([id, n]) => soglia(n + 1) && !fuori.has(s.nomi[id])).map(([id, n]) => [s.nomi[id], n]);
    esito[team] = { squal, diff };
  }
  return esito;
}

// Partite di coppa già decise (calendario o sorteggio) delle squadre di Serie A, nei prossimi 60 giorni:
// [competizione, sigla ESPN, id partita ESPN, data e ora (UTC), casa, ospite]
const COPPE = [["Coppa Italia", "ita.coppa_italia"], ["Champions League", "uefa.champions"], ["Europa League", "uefa.europa"], ["Conference League", "uefa.europa.conf"], ["Supercoppa", "ita.super_cup"]];
const ESATTI = { "AC Milan": "Milan", "Internazionale": "Inter", "AS Roma": "Roma", "Hellas Verona": "Verona" };
const esterne = new Map();   // nome ESPN -> [sigla coppa, id squadra]
async function partiteCoppe(squadre) {
  const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
  const perNorm = new Map([...squadre].map(s => [norm(s), s]));
  // nelle coppe ci sono squadre straniere con nomi simili (Inter Turku…): solo corrispondenze esatte
  const italiana = n => ESATTI[n] && squadre.has(ESATTI[n]) ? ESATTI[n] : perNorm.get(norm(n)) || null;
  const giorni = [];
  for (let i = 0; i <= 60; i++) giorni.push(new Date(Date.now() + i * 864e5).toISOString().slice(0, 10).replace(/-/g, ""));
  const out = [], visti = new Set(); esterne.clear();
  for (const [nome, slug] of COPPE) {
    for (let i = 0; i < giorni.length; i += 10) {
      const blocco = await Promise.all(giorni.slice(i, i + 10).map(g => json(API.replace("ita.1", slug) + "scoreboard?dates=" + g)));
      for (const j of blocco) for (const e of (j && j.events) || []) {
        if (visti.has(e.id) || e.status.type.state !== "pre") continue;
        const c = e.competitions[0].competitors, H = c.find(x => x.homeAway === "home"), A = c.find(x => x.homeAway === "away");
        if (!H || !A) continue;
        const h = italiana(H.team.displayName), a = italiana(A.team.displayName);
        if (!h && !a) continue;
        visti.add(e.id);
        out.push([nome, slug, e.id, e.date, h || H.team.displayName, a || A.team.displayName]);
        // squadre di fuori dalla Serie A (straniere, Serie B): servirà la loro rosa per fare anche la loro formazione
        if (!h) esterne.set(H.team.displayName, [slug, H.team.id]);
        if (!a) esterne.set(A.team.displayName, [slug, A.team.id]);
      }
    }
  }
  return out.sort((x, y) => x[3].localeCompare(y[3]));
}

async function aggiorna(SERIE_A) {
  const stagione = Object.keys(SERIE_A).sort().pop();
  const squadre = new Set(SERIE_A[stagione].flatMap(m => [m[1], m[2]]));
  const lista = await json(API + "teams");
  if (!lista) return { cambiato: false, esito: "ESPN non risponde" };
  const rose = {};
  for (const { team } of lista.sports[0].leagues[0].teams) {
    const nome = nomeApp(team.displayName, squadre);
    if (!squadre.has(nome)) continue;
    const r = await json(API + "teams/" + team.id + "/roster");
    if (!r || !r.athletes || !r.athletes.length) continue;
    const ordineRuolo = { P: 0, D: 1, C: 2, A: 3 };
    const rosa = r.athletes.map(p => [p.displayName, RUOLO[p.position && p.position.abbreviation] || "C", p.jersey ? +p.jersey : null])
      .sort((x, y) => ordineRuolo[x[1]] - ordineRuolo[y[1]] || (x[2] ?? 99) - (y[2] ?? 99));
    const inf = r.athletes.filter(p => p.injuries && p.injuries.length).map(p => p.displayName);
    rose[nome] = { rosa, squal: [], diff: [], inf };
  }
  // cartellini della stagione, dalla cache scaricata da marcatori-a.js
  const cache = path.join(root, "data-src", "espn", stagione + ".json");
  if (fs.existsSync(cache)) {
    const c = cartellini(JSON.parse(fs.readFileSync(cache, "utf8")), squadre);
    for (const [team, x] of Object.entries(c)) if (rose[team]) Object.assign(rose[team], x);
  }
  if (Object.keys(rose).length < squadre.size / 2) return { cambiato: false, esito: "rose incomplete, tenute quelle di prima" };
  const sorted = Object.fromEntries(Object.keys(rose).sort().map(k => [k, rose[k]]));
  const coppe = await partiteCoppe(squadre);
  // rose delle avversarie di coppa (solo giocatori: squalifiche e diffide valgono per la Serie A)
  for (const [nome, [slug, id]] of esterne) {
    const r = await json(API.replace("ita.1", slug) + "teams/" + id + "/roster");
    if (!r || !r.athletes || !r.athletes.length) continue;
    const ordineRuolo = { P: 0, D: 1, C: 2, A: 3 };
    sorted[nome] = { rosa: r.athletes.map(p => [p.displayName, RUOLO[p.position && p.position.abbreviation] || "C", p.jersey ? +p.jersey : null])
      .sort((x, y) => ordineRuolo[x[1]] - ordineRuolo[y[1]] || (x[2] ?? 99) - (y[2] ?? 99)), squal: [], diff: [], inf: [], coppa: 1 };
  }
  const prima = fs.existsSync(out) ? fs.readFileSync(out, "utf8").replace(/"aggiornato":"[^"]*",?/g, "") : "";
  const testo = "window.ROSE_A=" + JSON.stringify({ stagione, aggiornato: new Date().toISOString(), squadre: sorted, coppe }) + ";";
  const cambiato = testo.replace(/"aggiornato":"[^"]*",?/g, "") !== prima;
  if (cambiato) fs.writeFileSync(out, testo);
  return { cambiato, esito: Object.keys(rose).length + " squadre" };
}
module.exports = { aggiorna };

if (require.main === module) {
  global.window = {};
  eval(fs.readFileSync(path.join(root, "proto", "data.js"), "utf8"));
  aggiorna(window.SERIE_A).then(r => console.log(JSON.stringify(r)));
}
