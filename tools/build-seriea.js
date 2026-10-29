// Costruisce data.js della Serie A dai CSV di football-data.co.uk.
// La stagione in corso include anche le partite del prossimo turno (fixtures.csv) con punteggio null.
// uso: node build-seriea.js <cartella csv> <data.js>
const fs = require("fs"), path = require("path");
const [dir, out] = process.argv.slice(2);

function rows(file) {
  const lines = fs.readFileSync(file, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(l => l.trim());
  const head = lines[0].split(",");
  return lines.slice(1).map(l => { const v = l.split(","); const o = {}; head.forEach((h, i) => o[h] = v[i]); return o });
}
const iso = d => { const [dd, mm, yy] = d.split("/"); return `${yy.length === 2 ? "20" + yy : yy}-${mm}-${dd}` };
const team = t => t === "Spal" ? "SPAL" : t;

const data = {};
for (const f of fs.readdirSync(dir).filter(f => /^\d{4}\.csv$/.test(f)).sort()) {
  const y = 2000 + +f.slice(0, 2);
  const key = `${y}-${f.slice(2, 4)}`;
  data[key] = rows(path.join(dir, f)).filter(r => r.HomeTeam && r.FTHG !== "").map(r => [iso(r.Date), team(r.HomeTeam), team(r.AwayTeam), +r.FTHG, +r.FTAG]);
}
// stagione in corso: calendario completo da openfootball (calendar.json), con il numero di giornata
const last = Object.keys(data).sort().pop();
const cal = path.join(dir, "calendar.json");
const ofName = n => [[/internazionale/i, "Inter"], [/milan/i, "Milan"], [/monza/i, "Monza"], [/fiorentina/i, "Fiorentina"], [/roma/i, "Roma"],
  [/atalanta/i, "Atalanta"], [/bologna/i, "Bologna"], [/cagliari/i, "Cagliari"], [/como/i, "Como"], [/frosinone/i, "Frosinone"], [/genoa/i, "Genoa"],
  [/juventus/i, "Juventus"], [/parma/i, "Parma"], [/lazio/i, "Lazio"], [/napoli/i, "Napoli"], [/torino/i, "Torino"], [/udinese/i, "Udinese"],
  [/lecce/i, "Lecce"], [/sassuolo/i, "Sassuolo"], [/venezia/i, "Venezia"], [/verona/i, "Verona"], [/empoli/i, "Empoli"], [/cremonese/i, "Cremonese"],
  [/pisa/i, "Pisa"], [/sampdoria/i, "Sampdoria"], [/salernitana/i, "Salernitana"], [/spezia/i, "Spezia"], [/palermo/i, "Palermo"]].find(([re]) => re.test(n))?.[1] || n;
if (fs.existsSync(cal)) {
  const fixtures = JSON.parse(fs.readFileSync(cal, "utf8")).matches;
  const byPair = new Map(data[last].map(m => [m[1] + "|" + m[2], m]));
  const unknown = new Set();
  for (const f of fixtures) {
    const h = ofName(f.team1), a = ofName(f.team2), r = +String(f.round).replace(/\D/g, "");
    [h, a].forEach(t => { if (!data[last].some(m => m[1] === t)) unknown.add(t) });
    const played = byPair.get(h + "|" + a);
    if (played) played[5] = r;            // il risultato resta quello di football-data, si aggiunge la giornata
    else data[last].push([f.date, h, a, null, null, r]);
  }
  if (unknown.size) console.log("ATTENZIONE nomi non riconosciuti:", [...unknown].join(", "));
} else if (fs.existsSync(path.join(dir, "fixtures.csv"))) {
  const fx = path.join(dir, "fixtures.csv");
  const played = new Set(data[last].map(m => m[1] + "|" + m[2]));
  for (const r of rows(fx).filter(r => r.Div === "I1")) {
    const k = team(r.HomeTeam) + "|" + team(r.AwayTeam);
    if (!played.has(k)) data[last].push([iso(r.Date), team(r.HomeTeam), team(r.AwayTeam), null, null]);
  }
}
fs.writeFileSync(out, "window.SERIE_A=" + JSON.stringify(data) + ";");
console.log(Object.keys(data).length, "stagioni; ultima", last, "partite", data[last].length, "di cui da giocare", data[last].filter(m => m[3] === null).length);
