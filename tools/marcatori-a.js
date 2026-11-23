// Marcatori di Serie A da ESPN, stagione per stagione.
// Ogni stagione scaricata si salva in data-src/espn/<stagione>.json, così gli anni finiti si scaricano una volta sola;
// la stagione in corso si riscarica a ogni aggiornamento. Poi si scrive proto/marcatori-a.js con tutte le stagioni.
// uso da riga di comando: node tools/marcatori-a.js            (scarica le stagioni che mancano)
//                         node tools/marcatori-a.js 2026-27    (riscarica anche quella stagione)
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, ".."), cacheDir = path.join(root, "data-src", "espn"), out = path.join(root, "proto", "marcatori-a.js");

// nomi ESPN diversi da quelli dell'app
const NOMI = { "AC Milan": "Milan", "Internazionale": "Inter", "AS Roma": "Roma", "Hellas Verona": "Verona", "Chievo Verona": "Chievo", "Chievo": "Chievo" };
const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
function nomeApp(espn, squadre) {
  if (NOMI[espn] && squadre.has(NOMI[espn])) return NOMI[espn];
  if (squadre.has(espn)) return espn;
  const n = norm(espn);
  for (const s of squadre) if (norm(s) === n) return s;
  for (const s of squadre) if (n.includes(norm(s)) || norm(s).includes(n)) return s;
  return NOMI[espn] || espn;
}

const ymd = d => d.toISOString().slice(0, 10).replace(/-/g, "");
async function giorno(g) {
  for (let t = 0; t < 4; t++) {
    try {
      const r = await fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/ita.1/scoreboard?dates=" + g);
      if (r.ok) return (await r.json()).events || [];
    } catch { }
    await new Promise(r => setTimeout(r, 1000 * (t + 1)));
  }
  return null;
}

// scarica tutte le partite della stagione (dal giorno della prima all'ultima del calendario) in forma compatta:
// [id, data, casa, ospite, golCasa, golOspite, finita, [[giocatore, "h"|"a", rigore, autogol], ...]]
async function scaricaStagione(stagione, righe) {
  const date = righe.map(m => m[0]).sort();
  const dal = new Date(date[0] + "T00:00:00Z"), al = new Date(Math.min(Date.parse(date[date.length - 1] + "T00:00:00Z"), Date.now()));
  const giorni = [];
  for (let d = new Date(dal.getTime() - 864e5); d <= al; d = new Date(d.getTime() + 864e5)) giorni.push(ymd(d));
  const eventi = [];
  for (let i = 0; i < giorni.length; i += 8) {
    const blocco = await Promise.all(giorni.slice(i, i + 8).map(giorno));
    if (blocco.includes(null)) return null;
    eventi.push(...blocco.flat());
  }
  const visti = new Set(), partite = [];
  for (const e of eventi) {
    if (visti.has(e.id)) continue;
    visti.add(e.id);
    const c = e.competitions[0].competitors, H = c.find(x => x.homeAway === "home"), A = c.find(x => x.homeAway === "away");
    if (!H || !A) continue;
    const finita = e.status.type.state === "post" && !!e.status.type.completed;
    const gol = (e.competitions[0].details || []).filter(d => d.scoringPlay).map(d => {
      const p = (d.athletesInvolved || [])[0];
      return [p ? p.displayName : null, d.team && d.team.id === H.team.id ? "h" : "a", d.penaltyKick ? 1 : 0, d.ownGoal ? 1 : 0];
    });
    // cartellini (servono per squalificati e diffidati): [id giocatore, nome, "h"|"a", "G"|"R"]
    const cart = (e.competitions[0].details || []).filter(d => d.yellowCard || d.redCard).map(d => {
      const p = (d.athletesInvolved || [])[0] || {};
      return [p.id || null, p.displayName || null, d.team && d.team.id === H.team.id ? "h" : "a", d.redCard ? "R" : "G"];
    });
    partite.push([e.id, e.date, H.team.displayName, A.team.displayName, +H.score, +A.score, finita ? 1 : 0, gol, cart]);
  }
  return partite;
}

// dalle partite alla classifica marcatori della stagione
function classifica(partite, squadre) {
  const gol = {}, rigori = {}, ids = [];
  let conMarcatori = 0, finite = 0;
  for (const [id, , h, a, hs, as, finita, reti] of partite) {
    if (!finita) continue;
    const casa = nomeApp(h, squadre), ospite = nomeApp(a, squadre);
    if (!squadre.has(casa) || !squadre.has(ospite)) continue; // spareggi o partite non di Serie A
    finite++; ids.push(id);
    // una partita conta come "con marcatori" se ESPN ha un marcatore per ogni gol
    if (reti.length === hs + as && reti.every(r => r[0] || r[3])) conMarcatori++;
    for (const [p, lato, rig, aut] of reti) {
      const team = lato === "h" ? casa : ospite, contro = lato === "h" ? ospite : casa;
      if (rig) { (rigori[team] ||= [0, 0])[0]++; (rigori[contro] ||= [0, 0])[1]++ }
      if (!p || aut) continue;
      const x = gol[p + "|" + team] ||= [p, team, 0, 0];
      x[2]++; if (rig) x[3]++;
    }
  }
  const sc = Object.values(gol).sort((a, b) => b[2] - a[2] || a[3] - b[3] || a[0].localeCompare(b[0]));
  return { ids, sc, pens: rigori, cov: [conMarcatori, finite] };
}

// aggiorna i file: forza = elenco di stagioni da riscaricare anche se già in cache
async function aggiorna(SERIE_A, forza = []) {
  fs.mkdirSync(cacheDir, { recursive: true });
  const tutte = {}, esito = {};
  for (const stagione of Object.keys(SERIE_A).sort()) {
    const righe = SERIE_A[stagione], squadre = new Set(righe.flatMap(m => [m[1], m[2]]));
    if (!righe.some(m => m[3] !== null)) continue;
    const file = path.join(cacheDir, stagione + ".json");
    let partite = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
    if (!partite || forza.includes(stagione)) {
      const nuove = await scaricaStagione(stagione, righe);
      if (nuove) { partite = nuove; fs.writeFileSync(file, JSON.stringify(partite)); esito[stagione] = "scaricata" }
      else esito[stagione] = partite ? "ESPN non risponde, tenuta quella di prima" : "ESPN non risponde";
    }
    if (!partite) continue;
    const c = classifica(partite, squadre);
    // senza marcatori per almeno metà delle partite la classifica sarebbe sbagliata (succede col 2000/01): la stagione non si mostra
    if (!c.cov[1] || c.cov[0] < c.cov[1] / 2) continue;
    // per le stagioni finite bastano i primi 60 marcatori; per quella in corso servono anche gli id delle partite
    tutte[stagione] = Object.assign(c, { sc: c.sc.slice(0, 60) });
    if (righe.some(m => m[3] === null)) tutte[stagione].aggiornato = new Date().toISOString();
    else delete tutte[stagione].ids;
  }
  const prima = fs.existsSync(out) ? fs.readFileSync(out, "utf8").replace(/"aggiornato":"[^"]*",?/g, "") : "";
  const testo = "window.MARCATORI_A=" + JSON.stringify(tutte) + ";";
  const cambiato = testo.replace(/"aggiornato":"[^"]*",?/g, "") !== prima;
  if (cambiato) fs.writeFileSync(out, testo);
  return { cambiato, esito, stagioni: Object.keys(tutte).length };
}
module.exports = { aggiorna, nomeApp };

if (require.main === module) {
  global.window = {};
  eval(fs.readFileSync(path.join(root, "proto", "data.js"), "utf8"));
  aggiorna(window.SERIE_A, process.argv.slice(2)).then(r => console.log(JSON.stringify(r)));
}
