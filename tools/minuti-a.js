// Minuti giocati da ogni giocatore di Serie A nella stagione in corso (da ESPN: titolari, sostituzioni ed espulsioni di ogni partita).
// I minuti di ogni partita finita si salvano in data-src/minuti.json, così ogni partita si scarica una volta sola.
// Scrive proto/minuti-a.js:
// window.MINUTI_A = { stagione, aggiornato, squadre: { Roma: [[nome, minuti, presenze, daTitolare, entratoDallaPanchina], ...] } }
// Una partita intera vale 90 minuti: il recupero non si conta.
// uso da riga di comando: node tools/minuti-a.js   (dopo marcatori-a.js, che scarica l'elenco delle partite)
const fs = require("fs"), path = require("path");
const { nomeApp } = require("./marcatori-a.js");
const root = path.join(__dirname, ".."), cacheFile = path.join(root, "data-src", "minuti.json"), out = path.join(root, "proto", "minuti-a.js");
const API = "https://site.api.espn.com/apis/site/v2/sports/soccer/ita.1/";

async function json(url) {
  for (let t = 0; t < 3; t++) {
    try { const r = await fetch(url); if (r.ok) return await r.json() } catch { }
    await new Promise(r => setTimeout(r, 1000 * (t + 1)));
  }
  return null;
}

// minuto di un evento: il recupero del primo tempo vale 45, quello del secondo 90
function minuto(k) {
  const m = Math.floor(((k.clock && k.clock.value) || 0) / 60), tempo = k.period ? k.period.number : 1;
  return Math.min(m, tempo === 1 ? 45 : 90);
}

// minuti di ogni giocatore in una partita: [[id, nome, "h"|"a", minuti, titolare 1/0], ...]  (null se ESPN non ha ancora i dati)
async function minutiPartita(id) {
  const s = await json(API + "summary?event=" + id);
  if (!s || !s.rosters || s.rosters.length < 2 || !s.rosters.every(r => (r.roster || []).some(p => p.starter))) return null;
  const lato = {}; for (const r of s.rosters) lato[r.team.id] = r.homeAway === "home" ? "h" : "a";
  const entra = {}, esce = {};
  for (const k of s.keyEvents || []) {
    const tipo = (k.type && k.type.type) || "", chi = (k.participants || []).map(p => p.athlete && p.athlete.id);
    if (tipo === "substitution"){ if (chi[0]) entra[chi[0]] = minuto(k); if (chi[1]) esce[chi[1]] = minuto(k) }
    if (/red/.test(tipo) && chi[0]) esce[chi[0]] = minuto(k);
  }
  const righe = [];
  for (const r of s.rosters) for (const p of r.roster || []) {
    const pid = p.athlete && p.athlete.id; if (!pid) continue;
    let da;
    if (p.starter) da = 0;
    else if (p.subbedIn) da = entra[pid] ?? 60;   // se manca il minuto del cambio si conta da metà secondo tempo
    else continue;   // rimasto in panchina
    const a = esce[pid] ?? 90;
    righe.push([pid, p.athlete.displayName, lato[r.team.id], Math.max(p.starter ? 0 : 1, a - da), p.starter ? 1 : 0]);
  }
  return righe;
}

async function aggiorna(SERIE_A) {
  const stagione = Object.keys(SERIE_A).sort().pop();
  const squadre = new Set(SERIE_A[stagione].flatMap(m => [m[1], m[2]]));
  const fileStagione = path.join(root, "data-src", "espn", stagione + ".json");
  if (!fs.existsSync(fileStagione)) return { cambiato: false, esito: "manca l'elenco delle partite" };
  const partite = JSON.parse(fs.readFileSync(fileStagione, "utf8")).filter(p => p[6]);
  let cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, "utf8")) : {};
  if (cache._stagione !== stagione) cache = { _stagione: stagione };
  let nuove = 0;
  for (const p of partite) {
    if (cache[p[0]]) continue;
    const m = await minutiPartita(p[0]);
    if (m){ cache[p[0]] = m; nuove++ }
  }
  fs.writeFileSync(cacheFile, JSON.stringify(cache));
  // somma per squadra e giocatore
  const tot = {};
  for (const p of partite) {
    const righe = cache[p[0]]; if (!righe) continue;
    const casa = nomeApp(p[2], squadre), ospite = nomeApp(p[3], squadre);
    if (!squadre.has(casa) || !squadre.has(ospite)) continue;
    for (const [pid, nome, l, min, tit] of righe) {
      const team = l === "h" ? casa : ospite;
      const x = (tot[team] ||= {})[pid] ||= [nome, 0, 0, 0, 0];
      x[0] = nome; x[1] += min; x[2]++; if (tit) x[3]++; else x[4]++;
    }
  }
  const out_ = {};
  for (const t of Object.keys(tot).sort()) out_[t] = Object.values(tot[t]).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const dati = { stagione, aggiornato: new Date().toISOString(), partite: partite.filter(p => cache[p[0]]).length, squadre: out_ };
  const testo = "window.MINUTI_A = " + JSON.stringify(dati) + ";\n";
  const senza = t => t.replace(/"aggiornato":"[^"]*",?/, "");
  const prima = fs.existsSync(out) ? fs.readFileSync(out, "utf8") : "";
  const cambiato = senza(testo) !== senza(prima);
  if (cambiato) fs.writeFileSync(out, testo);
  return { cambiato, esito: `${dati.partite}/${partite.length} partite con i minuti (${nuove} nuove)` };
}

module.exports = { aggiorna };
if (require.main === module) {
  global.window = {};
  eval(fs.readFileSync(path.join(root, "proto", "data.js"), "utf8"));
  aggiorna(window.SERIE_A).then(r => console.log(r));
}
