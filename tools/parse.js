// Estrae Coppa Italia (ottavi-finale) e coppe europee dalle pagine RSSSF scaricate.
// uso: node parse.js <cartella rsssf> <file output .js> [cartella wikipedia]
// Le stagioni europee che RSSSF non ha ancora pubblicato si leggono dai tabellini Wikipedia (vedi update.js).
const fs = require("fs"), path = require("path");
const dir = process.argv[2], out = process.argv[3], wikiDir = process.argv[4];

function readText(file) {
  const buf = fs.readFileSync(file);
  if (buf[0] === 0xff && buf[1] === 0xfe) return buf.toString("utf16le").replace(/^﻿/, "");
  let s = buf.toString("utf8");
  if (s.includes("�")) s = buf.toString("latin1");
  return s;
}
const strip = h => h.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\r/g, "").replace(/\t/g, "    ").replace(/(\d)[–\u0096](\d)/g, "$1-$2");
const DEBUG = process.env.DEBUG;

// Nomi brevi per i club italiani (servono a riconoscerli anche nei gironi, dove RSSSF non scrive la nazione)
const ITA = [
  [/juventus/i, "Juventus"], [/internazionale|^inter\b/i, "Inter"], [/milan/i, "Milan"], [/lazio/i, "Lazio"],
  [/^(as )?roma\b/i, "Roma"], [/napoli/i, "Napoli"], [/atalanta/i, "Atalanta"], [/fiorentina/i, "Fiorentina"],
  [/^bologna/i, "Bologna"], [/udinese/i, "Udinese"], [/parma/i, "Parma"], [/sampdoria/i, "Sampdoria"],
  [/^genoa/i, "Genoa"], [/palermo/i, "Palermo"], [/^torino/i, "Torino"], [/chievo/i, "Chievo"],
  [/^empoli/i, "Empoli"], [/livorno/i, "Livorno"], [/sassuolo/i, "Sassuolo"], [/^perugia/i, "Perugia"],
  [/^brescia/i, "Brescia"], [/^reggina/i, "Reggina"], [/^lecce/i, "Lecce"], [/^siena/i, "Siena"], [/cagliari/i, "Cagliari"],
  [/^verona|hellas/i, "Verona"], [/vicenza/i, "Vicenza"], [/^modena/i, "Modena"], [/ancona/i, "Ancona"], [/^como\b/i, "Como"]
];
const NOT_ITA = /escaldes|baku|baki|turku|bratislava|zapre|club d|atlético|atletico|^fc inter/i;
const itaName = raw => { if (NOT_ITA.test(raw)) return null; for (const [re, n] of ITA) if (re.test(raw.trim())) return n; if (/^atlanta$/i.test(raw.trim())) return "Atalanta"; return null };
const clean = raw => raw.trim().replace(/\s+/g, " ").replace(/\s*\((?!Beograd|Bern)[^)]*\)$/, "").replace(/\s+FC$/, "");

// ---------------- Marcatori ----------------
// "Crasson 18, 81, de Boeck 41, 65 pen" -> una voce per gol. Il nome vale anche per i minuti che seguono.
function parseList(txt) {
  const out = []; let last = null;
  for (let tok of txt.split(",")) {
    tok = tok.trim().replace(/[\[\]]/g, "");
    if (!tok) continue;
    const m = tok.match(/^(.*?)\s*(\d+)(?:\s*\+\s*\d*)?'?\s*(pen\.?|p|og|o\.g\.)?\s*$/i);
    if (!m) return null;
    const name = m[1].trim() || last;
    if (!name) return null;
    last = name;
    out.push({ p: name, pen: /^pen|^p$/i.test(m[3] || ""), og: /o\.?g/i.test(m[3] || "") });
  }
  return out;
}
// assegna il testo tra quadre a una partita: prima squadra ; seconda squadra (se una non segna, c'è solo l'altra)
function assignScorers(target, text) {
  const segs = text.split(";");
  let lists;
  if (segs.length === 2) lists = [parseList(segs[0]), parseList(segs[1])];
  else if (segs.length === 1 && target.g[1] === 0) lists = [parseList(text), []];
  else if (segs.length === 1 && target.g[0] === 0) lists = [[], parseList(text)];
  else return false;
  if (!lists[0] || !lists[1] || lists[0].length !== target.g[0] || lists[1].length !== target.g[1]) return false;
  target.ev = lists;
  return true;
}
// formato 2000/01: "(33' Corini, 50' Di Bin (V), 21' and 68' Cerbone, 85' Corini pen.)"; la sigla tra parentesi indica la squadra
function assignParen(target, text) {
  const body = text.trim().replace(/^\(/, "").replace(/\)\s*$/, "");
  const lists = [[], []];
  const initials = t => t.toUpperCase().replace(/[^A-Z]/g, "");
  for (const tok of body.split(/,\s*(?=\d)/)) {
    const mins = tok.match(/\d+'/g);
    if (!mins) return false;
    const mk = tok.match(/\(([A-Z]{1,3})\)\s*$/);
    const name = tok.replace(/\([A-Z]{1,3}\)\s*$/, "").replace(/\d+'/g, "").replace(/\band\b/g, "").replace(/pen\.?/i, "").trim();
    const pen = /pen/i.test(tok);
    let side;
    if (mk) side = initials(target.parts[0]).startsWith(mk[1]) ? 0 : initials(target.parts[1]).startsWith(mk[1]) ? 1 : -1;
    else side = -2;
    mins.forEach(() => (side === -2 ? (lists.un ||= []) : side === -1 ? (lists.bad = true) : lists[side]).push({ p: name, pen, og: false }));
  }
  if (lists.bad) return false;
  // chi non ha sigla è l'altra squadra rispetto a quella segnata
  const marked = lists[0].length ? 0 : lists[1].length ? 1 : null;
  const un = lists.un || [];
  if (marked === null) { if (target.g[0] === un.length && target.g[1] === 0) lists[0] = un; else if (target.g[1] === un.length && target.g[0] === 0) lists[1] = un; else return false }
  else lists[1 - marked].push(...un);
  if (lists[0].length !== target.g[0] || lists[1].length !== target.g[1]) return false;
  target.ev = [lists[0], lists[1]];
  return true;
}
// legge le righe tra quadre (anche su più righe) che seguono una partita
function makeCollector() {
  let queue = [], buf = null;
  return {
    set(list) { queue = list.filter(t => t.g[0] + t.g[1] > 0); buf = null },
    clear() { queue = []; buf = null },
    feed(raw) {
      const s = raw.trim();
      if (buf !== null) { buf += " " + s; if (s.includes("]")) { this.flush(buf); buf = null } return true }
      if (/^\[/.test(s) && /^\s/.test(raw)) { if (s.includes("]")) this.flush(s); else buf = s; return true }
      if (/^\(\d+'/.test(s)) { const t = queue.shift(); if (t) t.ok = assignParen(t, s); return true }
      return false;
    },
    flush(text) { const t = queue.shift(); if (t) t.ok = assignScorers(t, text.replace(/^\[/, "").replace(/\].*$/, "")) }
  };
}

// ---------------- Coppa Italia ----------------
function coppa(year) {
  let html = readText(path.join(dir, `cup-${year}.html`));
  if (year >= 2010) {
    const i = html.search(/name="coppa"/i);
    html = html.slice(i);
    const j = html.slice(20).search(/<a name=|<A NAME=|\n\s*Serie B\s*\n/);
    if (j > 0) html = html.slice(0, j + 20);
  }
  const lines = strip(html).split("\n");
  const rounds = [];
  let cur = null, leg = 1, inGroup = false;
  const norm = r => itaName(r) || r.trim().replace(/\s+/g, " ").replace(/ Calcio$/, "");
  const col = makeCollector();
  const sc = m => (m.sc = { parts: [m.h, m.a], g: m.g.slice() });
  for (const raw of lines) {
    if (col.feed(raw)) continue;
    if (!raw.trim() || /^\s/.test(raw) || /^[([]/.test(raw)) continue;
    if (cur && !inGroup) {
      // "Roma  0-2 0-1 Inter": andata e ritorno sulla stessa riga, punteggi dal lato della prima squadra
      const two = raw.match(/^(\S.*?)\s+(\d+)-(\d+)\s+(\d+)-(\d+)\s+(\S.*?)\s*(\[[^\]]*\])?\s*$/);
      if (two && !/:/.test(raw)) {
        const tag = two[7] || "", pen = tag.match(/(\d+)-(\d+)\s*pen/);
        const m1 = { h: norm(two[1]), a: norm(two[6]), g: [+two[2], +two[3]], leg: 1 };
        const m2 = { h: norm(two[6]), a: norm(two[1]), g: [+two[5], +two[4]], leg: 2, pen: pen ? [+pen[2], +pen[1]] : null };
        sc(m1); m2.sc = { parts: [m1.h, m1.a], g: [+two[4], +two[5]] };
        cur.matches.push(m1, m2); col.set([m1.sc, m2.sc]);
        continue;
      }
      // "Parma - Fiorentina   0-1"
      const dash = raw.match(/^(\S.*?)\s+-\s+(\S.*?)\s+(\d+)-(\d+)\s*$/);
      if (dash) { const m = { h: norm(dash[1]), a: norm(dash[2]), g: [+dash[3], +dash[4]], leg }; sc(m); cur.matches.push(m); col.clear(); continue }
    }
    const m = raw.match(/^(\S.*?)\s+(\d+)-(\d+)\s+(\S.*?)\s*(\[[^\]]*\])?\s*(\[[^\]]*\])?\s*$/);
    if (m && !/:/.test(raw) && cur) {
      if (inGroup) { col.clear(); continue }
      const tag = (m[5] || "") + (m[6] || "");
      const pen = tag.match(/(\d+)-(\d+)\s*pen/);
      const mm = { h: norm(m[1]), a: norm(m[4]), g: [+m[2], +m[3]], leg, pen: pen ? [+pen[1], +pen[2]] : null, aet: /aet/.test(tag) };
      sc(mm); cur.matches.push(mm); col.set([mm.sc]);
      continue;
    }
    col.clear();
    const line = raw.trim();
    if (/^first legs?\b/i.test(line)) { leg = 1; continue }
    if (/^second legs?\b/i.test(line)) { leg = 2; continue }
    if (/^(group|girone)\b/i.test(line)) { inGroup = true; continue }
    if (DEBUG && cur && /\d-\d/.test(line) && !/:/.test(line)) console.log("  unparsed", year, JSON.stringify(raw));
    if (/^(finals?|semi|quart|quater|1\/4|1\/8|1\/16|eighth|round|first round|second round|third round|fourth round|fifth round|preliminary)/i.test(line) && !/:/.test(line)) {
      inGroup = false; leg = 1;
      cur = { name: line.replace(/\s*\[.*$/, ""), matches: [] };
      rounds.push(cur);
    }
  }
  // un turno può comparire spezzato (es. "Final" con andata e ritorno): unisce i turni con lo stesso nome
  const merged = [];
  for (const r of rounds) {
    const key = r.name.toLowerCase().replace(/\s*\(.*$/, "").trim();
    const last = merged[merged.length - 1];
    if (last && last.key === key) last.matches.push(...r.matches); else merged.push({ key, name: r.name, matches: r.matches.slice() });
  }
  if (DEBUG) console.log("  rounds", year, merged.map(r => r.name + ":" + r.matches.length).join(" | "));
  return merged.filter(r => r.matches.length).map(r => ({ name: r.name, ties: pairTies(r.matches), matches: r.matches }));
}

function pairTies(matches) {
  const ties = [];
  for (const m of matches) {
    const prev = m.leg === 2 && ties.find(t => t.legs.length === 1 && t.t1 === m.a && t.t2 === m.h);
    if (prev) { prev.legs.push([m.a === prev.t1 ? m.g[1] : m.g[0], m.a === prev.t1 ? m.g[0] : m.g[1]]); prev.pen = m.pen ? [m.pen[1], m.pen[0]] : prev.pen; prev.aet ||= m.aet; continue }
    ties.push({ t1: m.h, t2: m.a, legs: [m.g], pen: m.pen, aet: m.aet });
  }
  return ties;
}

// vincitore: aggregato, poi gol in trasferta (fino al 2020/21 in Europa), poi rigori. -1 se non deducibile
function winner(t, awayRule) {
  const a = t.legs.reduce((s, l) => s + l[0], 0), b = t.legs.reduce((s, l) => s + l[1], 0);
  if (a !== b) return a > b ? 0 : 1;
  if (t.pen) return t.pen[0] > t.pen[1] ? 0 : 1;
  if (awayRule && t.legs.length === 2) { const aw1 = t.legs[1][0], aw2 = t.legs[0][1]; if (aw1 !== aw2) return aw1 > aw2 ? 0 : 1 }
  return -1;
}

// ---------------- Coppe europee ----------------
const COMP = [
  [/^UEFA Champions League\s+(\d{4})/, "cl", "Champions League"],
  [/^(UEFA Cup|Europa League)\s+(\d{4})/, "el", null],
  [/^(UEFA Europa )?Conference League\s+(\d{4})/, "ecl", "Conference League"]
];
function europe(year) {
  const file = path.join(dir, `ec-${year}.html`);
  if (!fs.existsSync(file)) return null;
  const lines = strip(readText(file)).split("\n");
  const comps = {};
  let comp = null, stage = null, group = null, seenMain = false;
  const col = makeCollector();
  for (const raw of lines) {
    if (comp && stage && col.feed(raw)) continue;
    const line = raw.trim();
    let hit = false;
    for (const [re, key, label] of COMP) {
      const m = line.match(re);
      if (m) {
        hit = true;
        const y = +(m[2] || m[1]);
        if (y === year - 1 && !comps[key]) { comp = comps[key] = { name: label || (/UEFA Cup/.test(line) ? "Coppa UEFA" : "Europa League"), stages: [], sc: [] }; seenMain = false }
        else comp = null;
      }
    }
    if (hit) { stage = null; continue }
    if (/^(UEFA )?(Intertoto|Super ?Cup|Cup Winners)/i.test(line)) { comp = null; continue }
    if (!comp) continue;
    if (/^(Preliminary|Qualifying|First|Second|Third|Fourth|Round|Intermediate|Group (Phase|Stage)|League (Stage|Phase)|Knockout|Play-?offs?|1\/16|1\/8|Eighth|Quarter|Semi|Final|Last 32|Last 16)/i.test(line) && !/^\w{3}\s+\d+:/.test(line)) {
      if (/^(champions|league|main) (section|path)/i.test(line)) continue;
      let name = line.replace(/\s*\(.*$/, "").replace(/\s+/g, " ");
      // il turno preliminare dal 2018/19 è un mini-torneo con semifinali e finale proprie
      if (/^(Group|League|First Round|Qualifying Phase 1|First Qualifying)/i.test(name)) seenMain = true;
      if (!seenMain && /^(Semi|Final)/i.test(name)) name = "Preliminare: " + name.toLowerCase();
      if (stage && stage.name === name) continue;
      stage = { name, ties: [], groups: {} };
      comp.stages.push(stage); group = null;
      continue;
    }
    if (!stage) continue;
    const g = line.match(/^Group ([A-Z])\b/);
    if (g && line.length < 12) { group = g[1]; continue }
    // finale scritta come una partita: "Bayern München  (0) 1  Valencia CF  (1) 1  asdet"
    if (/^Final/i.test(stage.name)) {
      const fm = raw.match(/^(\S.*?)\s+\(\d+\)\s+(\d+)\s+(\S.*?)\s+\(\d+\)\s+(\d+)/);
      if (fm && !stage.ties.length) { stage.ties.push({ t1: teamName(fm[1]), t2: teamName(fm[3]), c1: "", c2: "", legs: [[+fm[2], +fm[4]]], pen: null }); col.clear(); continue }
      const pw = line.match(/^(.+?) win (\d+)-(\d+) on penalties/i);
      if (pw && stage.ties.length) { const t = stage.ties[0], first = teamName(pw[1]) === t.t1 || t.t1.startsWith(pw[1]); t.pen = first ? [+pw[2], +pw[3]] : [+pw[3], +pw[2]]; continue }
    }
    // partita di girone o fase campionato
    // il parziale "(1)" manca nei gironi della Coppa UEFA 2004-09
    const gm = raw.match(/^\w{3}\s+\d+:\s+(.+?)(?:\s*\(\d+\)\s+|\s{2,})(\d+)\s+(.+?)(?:\s*\(\d+\)\s+|\s{2,})(\d+)(?!\d)/);
    if (gm) {
      const k = group || "L", h = teamName(gm[1]), a = teamName(gm[3]);
      (stage.groups[k] ||= []).push([h, a, +gm[2], +gm[4]]);
      const t = { parts: [h, a], g: [+gm[2], +gm[4]] }; comp.sc.push(t); col.set([t]);
      continue;
    }
    // doppia sfida o finale a colonne fisse
    if (raw.length > 58 && /^[A-Z][a-z]{2}$/.test(raw.slice(25, 28)) && /^[A-Z][a-z]{2}$/.test(raw.slice(55, 58))) {
      const rest = raw.slice(58).trim();
      const scores = [...rest.matchAll(/(\d+)-(\d+)(p)?/g)];
      const legs = [], pen = scores.find(s => s[3]);
      for (const s of scores) if (!s[3]) legs.push([+s[1], +s[2]]);
      const isFinal = /^Final/i.test(stage.name);
      const L = isFinal ? legs.slice(0, 1) : legs.length >= 3 ? legs.slice(0, 2) : legs.slice(0, 1);
      if (/awd/.test(rest) && !isFinal) continue; // casi assegnati a tavolino: troppo rari per gestirli
      if (!L.length) continue;
      const c1 = raw.slice(25, 28), c2 = raw.slice(55, 58);
      const nm = (r, c) => c === "Ita" ? (itaName(r) || clean(r)) : clean(r);
      const tie = { t1: nm(raw.slice(0, 25), c1), c1, t2: nm(raw.slice(30, 55), c2), c2, legs: L, pen: pen ? [+pen[1], +pen[2]] : null, aet: /aet/.test(rest) };
      stage.ties.push(tie);
      const ts = L.map(l => ({ parts: [tie.t1, tie.t2], g: l.slice() }));
      comp.sc.push(...ts); col.set(ts);
      continue;
    }
    col.clear();
  }
  return comps;
}
function teamName(raw) { return itaName(raw) || clean(raw) }

// ---------------- Coppe europee da Wikipedia (stagioni non ancora su RSSSF) ----------------
// Ogni partita è un riquadro {{#invoke:Football box|main ... }} con team1, team2, score, aet, penaltyscore, goals1, goals2.
// File: <anno>-<coppa>-<q|lp|ko>.txt, cioè spareggi di qualificazione, fase campionato, fase a eliminazione.
const WIKI_STAGE = [
  [/^third qualifying/i, "Qualifying Phase 3"], [/^play-?off round/i, "Play-off Round"],
  [/^knockout phase play-?offs?/i, "Intermediate Round"], [/^round of 16/i, "1/8 Finals"],
  [/^quarter-?finals?/i, "Quarter-Finals"], [/^semi-?finals?/i, "Semi-Finals"], [/^final$/i, "Final"]
];
const WIKI_COMP = { cl: "Champions League", el: "Europa League", ecl: "Conference League" };
function wikiText(s) {
  return s.replace(/<ref[^>]*\/>|<ref[\s\S]*?<\/ref>/g, "").replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1").replace(/\{\{[^{}]*\}\}/g, "").replace(/&nbsp;/g, " ").replace(/'''?/g, "").trim();
}
function wikiTeam(raw) {
  const c = (raw.match(/fbaicon\|([A-Z]{3})/) || [])[1] || "";
  const name = wikiText(raw);
  return { name: itaName(name) || name, c: c ? c[0] + c.slice(1).toLowerCase() : "" };
}
// "*[[Lautaro Martínez|L. Martínez]] {{goal|44||81|pen}}" -> una voce per minuto
function wikiGoals(raw) {
  const out = [];
  for (const line of (raw || "").split("\n")) {
    const p = wikiText(line.replace(/^\*/, "").replace(/\{\{goal\|[^}]*\}\}/g, ""));
    for (const g of line.matchAll(/\{\{goal\|([^}]*)\}\}/g)) {
      const a = g[1].split("|");
      for (let i = 0; i < a.length; i++) if (/^\d+(\+\d+)?$/.test(a[i].trim())) out.push({ p, pen: /^pen/i.test(a[i + 1] || ""), og: /o\.?g/i.test(a[i + 1] || "") });
    }
  }
  return out;
}
function wikiMatches(file) {
  const res = [];
  let stage = null, box = null, key = null;
  for (const line of readText(file).split("\n")) {
    const h = line.match(/^==\s*([^=].*?)\s*==\s*$/);
    if (h) { stage = h[1]; continue }
    if (/^(<onlyinclude>)?\{\{\s*(#invoke:\s*)?football box/i.test(line)) { box = { stage }; key = null; continue }
    if (!box) continue;
    if (/^\}\}\s*(<\/onlyinclude>)?\s*$/.test(line)) {
      const sc = (box.score || "").replace(/\{\{[^{}]*\}\}/g, "").match(/(\d+)\s*[–−-]\s*(\d+)/);
      if (sc && box.team1 && box.team2) {
        const ps = (box.penaltyscore || "").match(/(\d+)\s*[–−-]\s*(\d+)/);
        res.push({ stage: box.stage, t1: wikiTeam(box.team1), t2: wikiTeam(box.team2), g: [+sc[1], +sc[2]], pen: ps ? [+ps[1], +ps[2]] : null, aet: /^\s*y/i.test(box.aet || ""), goals: [wikiGoals(box.goals1), wikiGoals(box.goals2)] });
      }
      box = null; continue;
    }
    const f = line.match(/^\|\s*(\w+)\s*=(.*)$/);
    if (f) { key = f[1]; box[key] = f[2]; } else if (key) box[key] += "\n" + line;
  }
  return res;
}
function wikiEurope(year) {
  if (!wikiDir) return null;
  const comps = {};
  for (const key of Object.keys(WIKI_COMP)) {
    const c = { name: WIKI_COMP[key], stages: [], sc: [] };
    for (const part of ["q", "lp", "ko", "f"]) {
      const file = path.join(wikiDir, `${year}-${key}-${part}.txt`);
      if (!fs.existsSync(file)) continue;
      // la pagina della finale ha un solo riquadro con la partita
      for (const m of part === "f" ? wikiMatches(file).slice(0, 1) : wikiMatches(file)) {
        const name = part === "lp" ? "League Stage" : part === "f" ? "Final" : (WIKI_STAGE.find(([re]) => re.test(m.stage || "")) || [])[1];
        if (name === "Final" && c.stages.some(s => s.name === "Final")) continue;
        if (!name) continue;
        let st = c.stages.find(s => s.name === name);
        if (!st) c.stages.push(st = { name, ties: [], groups: {} });
        const ev = m.goals[0].length === m.g[0] && m.goals[1].length === m.g[1] ? m.goals : null;
        c.sc.push({ parts: [m.t1.name, m.t2.name], g: m.g.slice(), ev });
        if (part === "lp") { (st.groups.L ||= []).push([m.t1.name, m.t2.name, m.g[0], m.g[1]]); continue }
        // ritorno: si aggancia all'andata con le squadre invertite; punteggi e rigori dal lato di chi ha giocato in casa l'andata
        const first = st.ties.find(t => t.legs.length === 1 && t.t1 === m.t2.name && t.t2 === m.t1.name);
        if (first) { first.legs.push([m.g[1], m.g[0]]); first.pen = m.pen ? [m.pen[1], m.pen[0]] : null; first.aet = m.aet; continue }
        st.ties.push({ t1: m.t1.name, c1: m.t1.c, t2: m.t2.name, c2: m.t2.c, legs: [m.g], pen: m.pen, aet: m.aet });
      }
    }
    // una sfida di andata e ritorno con solo l'andata giocata è ancora aperta: non ha un vincitore, quindi si lascia fuori
    for (const s of c.stages) if (s.name !== "Final") s.ties = s.ties.filter(t => t.legs.length === 2);
    c.stages = c.stages.filter(s => s.ties.length || Object.keys(s.groups).length);
    const order = ["Qualifying Phase 3", "Play-off Round", "League Stage", "Intermediate Round", "1/8 Finals", "Quarter-Finals", "Semi-Finals", "Final"];
    c.stages.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
    if (c.stages.length) comps[key] = c;
  }
  return Object.keys(comps).length ? comps : null;
}
const hasWiki = year => wikiDir && fs.existsSync(wikiDir) && fs.readdirSync(wikiDir).some(f => f.startsWith(year + "-"));

// ---------------- Pagine di dettaglio europee (2002/03 - 2008/09) ----------------
// "Juventus – Artmedia 4-0" seguito da righe gol tipo "17'Kokot (pen) 1-0, 50', 52'Sturm 2-0, 3-0".
// La squadra di ogni gol si ricava dal punteggio progressivo; senza punteggi vale solo se ha segnato una squadra sola.
const MIN = "['´`’\u0092´�]";
function parseGoals(text, g) {
  // ordine delle alternative: punteggio "1-0" prima del minuto, così "1-2, 59" non diventa un minuto 2
  const L = "A-Za-zÀ-ÿ\\u0100-\\u017f";
  const re = new RegExp(`(\\d+)\\s*-\\s*(\\d+)|(\\d+)\\s*${MIN}?\\s*(?:\\+\\s*\\d*\\s*${MIN}?)?(?=\\s*(?:,\\s*\\d|[${L}\\[(]))|[\\[(]\\s*(?:pen\\.?|p|penalty)\\s*[\\])]|\\bpen\\b\\.?|[\\[(]\\s*(?:o\\.?\\s?g\\.?|own goal)\\s*[\\])]|\\bo\\.g\\.|([${L}][^,\\d()\\[\\]]*[${L}.])`, "g");
  const goals = [];
  let m;
  while ((m = re.exec(text))) {
    if (m[1] !== undefined) { const x = goals.find(q => !q.s); if (x) x.s = [+m[1], +m[2]] }
    else if (m[3] !== undefined) goals.push({ p: null, s: null, pen: false, og: false });
    else if (m[4] !== undefined) { const nm = m[4].trim(); if (nm.length < 2 || /^(and|aet|pen)$/i.test(nm)) continue; goals.filter(q => !q.p).forEach(q => q.p = nm) }
    else if (/o\.?\s?g|own/i.test(m[0])) { if (goals.length) goals[goals.length - 1].og = true }
    else if (goals.length) goals[goals.length - 1].pen = true;
  }
  if (goals.length !== g[0] + g[1] || goals.some(q => !q.p)) return null;
  const lists = [[], []];
  if (goals.every(q => q.s)) {
    let prev = [0, 0];
    for (const q of goals) {
      const side = q.s[0] === prev[0] + 1 && q.s[1] === prev[1] ? 0 : q.s[1] === prev[1] + 1 && q.s[0] === prev[0] ? 1 : -1;
      if (side < 0) return null;
      lists[side].push(q); prev = q.s;
    }
  } else if (goals.every(q => !q.s) && (g[0] === 0 || g[1] === 0)) lists[g[0] ? 0 : 1].push(...goals);
  else return null;
  if (lists[0].length !== g[0] || lists[1].length !== g[1]) return null;
  return lists;
}
function europeDetails(year) {
  const file = path.join(dir, `ecdet-${year}.html`);
  if (!fs.existsSync(file)) return null;
  const lines = strip(readText(file)).split("\n");
  const out = {};
  let comp = null, cur = null;
  const close = () => {
    if (!cur) return;
    cur.ev = parseGoals(cur.text, cur.g);
    if (DEBUG && !cur.ev && cur.g[0] + cur.g[1] > 0 && cur.parts.some(p => ITA_SET.has(p))) console.log("  det fail", year, cur.parts.join("-"), cur.g.join("-"), "|", cur.text.slice(0, 160));
    cur = null;
  };
  const nm = r => itaName(r) || r.trim().replace(/\s+/g, " ");
  for (const raw of lines) {
    const line = raw.trim();
    if (/Details\s*$/.test(line) && !/,/.test(line)) {
      close();
      comp = /^UEFA Champions League/.test(line) ? (out.cl ||= []) : /^UEFA Cup/.test(line) ? (out.el ||= []) : null;
      continue;
    }
    if (!comp) continue;
    const isGoalLine = /^\d+/.test(line) && !/^\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}/i.test(line);
    const h = line.match(/^(\S.*?)\s+[–\u0096�-]\s+(\S.*?)\s+(\d+)-(\d+)\b/);
    if (h && !/^\d/.test(line)) {
      close();
      cur = { parts: [nm(h[1]), nm(h[2])], g: [+h[3], +h[4]], text: "" };
      comp.push(cur);
      continue;
    }
    if (cur && isGoalLine && !cur.dated) { cur.text += " , " + line; continue }
    if (cur && /^\d{1,2}\s+[A-Za-z]+\.?\s+\d{4}/.test(line)) { cur.dated = true; continue }
    if (cur && line) close();
  }
  close();
  return out;
}

// ---------------- Vincitori con controllo sul turno successivo ----------------
function resolve(stages, awayRule) {
  stages.forEach((s, k) => {
    const later = new Set();
    for (const n of stages.slice(k + 1)) { n.ties.forEach(t => { later.add(t.t1); later.add(t.t2) }); Object.values(n.groups || {}).flat().forEach(m => { later.add(m[0]); later.add(m[1]) }) }
    for (const t of s.ties) {
      let w = winner(t, awayRule);
      const in1 = later.has(t.t1), in2 = later.has(t.t2);
      if (in1 !== in2) w = in1 ? 0 : 1;   // chi compare dopo è passato davvero
      t.w = w;
    }
  });
}

// ---------------- Statistiche marcatori e rigori ----------------
const ITA_SET = new Set(ITA.map(x => x[1]));
const PARTICLE = /^(de|di|del|della|dalla|van|von|da|dos|das|do|el|ben|le|la|mac|mc|ter|den|der|lo|dal)$/i;
// "Alessandro Del Piero" e "Del Piero" diventano la stessa persona (stessa squadra, stesso cognome)
function surnameKey(p) {
  const toks = p.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\./g, "").split(/\s+/);
  let i = toks.length - 1;
  while (i > 0 && PARTICLE.test(toks[i - 1])) i--;
  return toks.slice(i).join(" ").toLowerCase();
}
function stats(targets, keepAll) {
  const sc = {}, pens = {};
  let ok = 0, tot = 0, og = 0;
  for (const t of targets) {
    if (t.g[0] + t.g[1] === 0) continue;
    tot++;
    if (!t.ev) continue;
    ok++;
    t.ev.forEach((list, i) => {
      const team = t.parts[i], opp = t.parts[1 - i];
      for (const e of list) {
        if (e.og) { og++; continue }
        const s = sc[team + "|" + surnameKey(e.p)] ||= { p: e.p, team, g: 0, pen: 0 };
        if (e.p.length > s.p.length) s.p = e.p;
        s.g++;
        if (e.pen) { s.pen++; (pens[team] ||= [0, 0])[0]++; (pens[opp] ||= [0, 0])[1]++ }
      }
    });
  }
  let list = Object.values(sc).sort((a, b) => b.g - a.g || a.p.localeCompare(b.p));
  if (!keepAll) list = list.filter((s, k) => k < 25 || ITA_SET.has(s.team));
  const pensOut = {};
  for (const [t, v] of Object.entries(pens)) if (keepAll || ITA_SET.has(t)) pensOut[t] = v;
  return { sc: list.map(s => [s.p, s.team, s.g, s.pen]), pens: pensOut, cov: [ok, tot], og };
}

const DATA = { coppa: {}, europa: {}, marcatori: { coppa: {}, europa: {} } };
const report = [];
const DET = {};
for (let y = 2003; y <= 2009; y++) DET[y] = europeDetails(y);
// fino alla stagione in corso: le pagine RSSSF che non ci sono ancora vengono saltate
const LAST_YEAR = new Date().getFullYear() + (new Date().getMonth() >= 6 ? 1 : 0);
for (let y = 2001; y <= LAST_YEAR; y++) {
  if (!fs.existsSync(path.join(dir, `cup-${y}.html`)) && !fs.existsSync(path.join(dir, `ec-${y}.html`)) && !hasWiki(y)) continue;
  const season = `${y - 1}-${String(y % 100).padStart(2, "0")}`;
  if (fs.existsSync(path.join(dir, `cup-${y}.html`))) try {
    let r = coppa(y);
    // dagli ottavi alla finale: gli ultimi turni con 8, 4, 2 e 1 sfida
    const ko = r.filter(x => x.ties.length);
    const last4 = [];
    for (let k = ko.length - 1, want = 1; k >= 0 && want <= 8; k--) if (ko[k].ties.length === want) { last4.unshift(ko[k]); want *= 2 }
    const ok = last4.map(x => x.ties.length).join(",") === "8,4,2,1";
    const st = last4.map(x => ({ name: x.name, ties: x.ties, groups: {} }));
    resolve(st, true);
    DATA.coppa[season] = st.map(s => ({ name: s.name, ties: s.ties.map(t => [t.t1, t.t2, t.legs, t.pen, t.w]) }));
    const cs = stats(last4.flatMap(x => x.matches.map(m => m.sc)), true);
    DATA.marcatori.coppa[season] = cs;
    report.push(`  marcatori coppa ${season}: coperte ${cs.cov[0]}/${cs.cov[1]} top=${cs.sc.slice(0, 2).map(s => s[0] + " " + s[2]).join(", ")}`);
    report.push(`coppa ${season}: ${ok ? "ok" : "CHECK " + ko.map(x => x.name + ":" + x.ties.length).join(" | ")} final=${st[3] && st[3].ties[0] ? st[3].ties[0].t1 + "-" + st[3].ties[0].t2 + " w" + st[3].ties[0].w : "?"} unresolved=${st.flatMap(s => s.ties).filter(t => t.w < 0).length}`);
  } catch (e) { report.push(`coppa ${season}: ERROR ${e.message}`) }
  const eu = europe(y) || wikiEurope(y);
  if (!eu) { report.push(`europa ${season}: missing`); continue }
  DATA.europa[season] = {};
  for (const [key, c] of Object.entries(eu)) {
    resolve(c.stages, y <= 2021);
    const hasIta = c.stages.some(s => s.ties.some(t => t.c1 === "Ita" || t.c2 === "Ita") || Object.values(s.groups).flat().some(m => ITA.some(([re, n]) => n === m[0] || n === m[1])));
    if (!hasIta) continue;
    DATA.europa[season][key] = { name: c.name, stages: c.stages.filter(s => s.ties.length || Object.keys(s.groups).length).map(s => ({ name: s.name, ties: s.ties.map(t => [t.t1, t.t2, t.legs, t.pen, t.w, t.c1, t.c2]), groups: s.groups })) };
    let es = stats(c.sc, false);
    const det = DET[y] && DET[y][key];
    // le pagine di dettaglio a volte coprono solo i preliminari: la copertura si misura sempre sulle partite dell'intera coppa
    if (det) { const ds = stats(det, false); ds.cov[1] = Math.max(ds.cov[1], es.cov[1]); if (ds.cov[0] > es.cov[0]) es = ds }
    (DATA.marcatori.europa[season] ||= {})[key] = es;
    report.push(`  marcatori ${season} ${key}: coperte ${es.cov[0]}/${es.cov[1]} top=${es.sc.slice(0, 2).map(s => s[0] + " (" + s[1] + ") " + s[2]).join(", ")}`);
    const fin = c.stages.find(s => /^Final/i.test(s.name));
    const ft = fin && fin.ties[0];
    report.push(`europa ${season} ${key}: stages=${c.stages.length} ties=${c.stages.reduce((a, s) => a + s.ties.length, 0)} groupM=${c.stages.reduce((a, s) => a + Object.values(s.groups).flat().length, 0)} final=${ft ? ft.t1 + "-" + ft.t2 + " " + JSON.stringify(ft.legs) + " w" + ft.w : "NONE"} unresolved=${c.stages.flatMap(s => s.ties).filter(t => t.w < 0).length}`);
  }
}
fs.writeFileSync(out, "window.COPPE=" + JSON.stringify(DATA) + ";");
console.log(report.join("\n"));
console.log("bytes", fs.statSync(out).size);
