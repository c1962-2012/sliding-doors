const MOMENTS = {
  "2000-01": [
    {h:"Juventus",a:"Roma",set:[3,2],q:"E se la Juve avesse vinto lo scontro diretto?",d:"6 mag 2001 · finì 2-2 al Delle Alpi"}
  ],
  "2001-02": [
    {h:"Lazio",a:"Inter",set:[2,3],q:"E se l'Inter avesse vinto il 5 maggio?",d:"5 mag 2002, ultima giornata · finì 4-2 per la Lazio"},
    {h:"Udinese",a:"Juventus",set:[1,1],q:"E se la Juve avesse solo pareggiato a Udine?",d:"5 mag 2002, ultima giornata · finì 0-2"}
  ],
  "2009-10": [
    {h:"Roma",a:"Sampdoria",set:[2,1],q:"E se la Roma avesse battuto la Samp all'Olimpico?",d:"25 apr 2010 · vinse la Samp 1-2"}
  ],
  "2011-12": [
    {h:"Milan",a:"Juventus",set:[2,1],q:"E se il gol di Muntari fosse stato convalidato?",d:"25 feb 2012 · finì 1-1 a San Siro"}
  ],
  "2015-16": [
    {h:"Juventus",a:"Napoli",set:[0,0],q:"E se il tiro di Zaza non fosse entrato?",d:"13 feb 2016 · finì 1-0 per la Juve"}
  ],
  "2017-18": [
    {h:"Juventus",a:"Napoli",set:[0,0],q:"E se Koulibaly non avesse segnato allo Stadium?",d:"22 apr 2018 · finì 0-1 per il Napoli"},
    {h:"Inter",a:"Juventus",set:[2,1],q:"E se l'Inter avesse tenuto il 2-1 a San Siro?",d:"28 apr 2018 · la Juve la ribaltò nel finale, 2-3"},
    {h:"Fiorentina",a:"Napoli",set:[0,1],q:"E se il Napoli non fosse crollato a Firenze?",d:"29 apr 2018 · finì 3-0 per la Fiorentina"}
  ],
  "2019-20": [
    {h:"Juventus",a:"Inter",set:[0,1],q:"E se l'Inter avesse vinto a porte chiuse allo Stadium?",d:"8 mar 2020 · finì 2-0 per la Juve"}
  ],
  "2021-22": [
    {h:"Bologna",a:"Inter",set:[1,1],q:"E se Radu non avesse sbagliato?",d:"27 apr 2022, recupero · finì 2-1 per il Bologna"},
    {h:"Inter",a:"Milan",set:[1,0],q:"E se l'Inter avesse vinto il derby di ritorno?",d:"5 feb 2022 · il Milan lo ribaltò, 1-2"},
    {h:"Napoli",a:"Fiorentina",set:[3,2],q:"E se il Napoli avesse battuto la Fiorentina?",d:"10 apr 2022 · finì 2-3 al Maradona"}
  ],
  "2024-25": [
    {h:"Inter",a:"Lazio",set:[2,1],q:"E se l'Inter avesse battuto la Lazio alla penultima?",d:"18 mag 2025 · finì 2-2 a San Siro"},
    {h:"Parma",a:"Inter",set:[0,2],q:"E se l'Inter avesse vinto a Parma?",d:"5 apr 2025 · finì 2-2"}
  ]
};
const NOTES = {
  "2004-05": "Lo scudetto fu poi revocato alla Juventus per Calciopoli e non assegnato.",
  "2005-06": "Con Calciopoli lo scudetto fu tolto alla Juventus e assegnato all'Inter; Juventus retrocessa, Milan, Fiorentina e Lazio penalizzate.",
  "2006-07": "Milan, Fiorentina, Lazio, Reggina e Siena partirono con penalizzazioni per Calciopoli, qui non conteggiate.",
  "2022-23": "Alla Juventus furono tolti 10 punti, qui non conteggiati."
};
// Posti Champions: 3 dal 2011/12 al 2016/17, 5 nel 2023/24
function clSpots(){ const y = +season.slice(0,4); return y>=2011 && y<=2016 ? 3 : y===2023 ? 5 : 4 }
function relSpots(){ return nTeams()===18 ? 4 : 3 }
const PALETTE = ["--s1","--s2","--s3","--s4","--s5","--s6"];
const MESI = ["gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"];
const $ = id => document.getElementById(id);

let season = "2021-22";
let overrides = {};       // indice partita -> [g1,g2]
let chartTeams = [];
let flashIdx = null;

const store = {
  get(k){ try{ return JSON.parse(localStorage.getItem(k)) }catch(e){ return null } },
  set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)) }catch(e){} }
};

const CACHE = {};
function matches(){ return CACHE[season] ||= buildSeason(SERIE_A[season]) }
function nTeams(){ return new Set(matches().map(m=>m[2])).size }
function nRounds(){ return 2*(nTeams()-1) }

// I file non hanno la giornata (e i rinvii la rendono ambigua): si lavora per data, raggruppando per mese
// La stagione in corso ha anche il numero di giornata (dal calendario ufficiale): lì si filtra per giornata.
function buildSeason(raw){
  return raw.slice().sort((x,y) => x[0].localeCompare(y[0])).map(([d,h,a,g1,g2,r]) => [d.slice(0,7),d,h,a,g1,g2,r||null]);
}
function hasRounds(){ return matches().every(m => m[6]) }
function roundKey(m){ return hasRounds() ? String(m[6]) : m[0] }

// Derby e big match (scontro diretto tra le prime sei della classifica reale di oggi)
const DERBIES = { "Inter|Milan":"Derby della Madonnina", "Lazio|Roma":"Derby della Capitale", "Juventus|Torino":"Derby della Mole",
  "Genoa|Sampdoria":"Derby della Lanterna", "Inter|Juventus":"Derby d'Italia", "Chievo|Verona":"Derby di Verona", "Napoli|Roma":"Derby del Sole" };
function bigMatch(h, a){
  const d = DERBIES[[h,a].sort().join("|")];
  if (d) return d;
  const top = table(withScores(false)).slice(0,6).map(r => r.team);
  return top.includes(h) && top.includes(a) ? "Big match" : null;
}
let listMode = "played";
const MESI_LUNGHI = ["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
function fmtMonth(k){ const [y,m] = k.split("-"); return `${MESI_LUNGHI[m-1]} ${y}` }
function score(i){ return overrides[i] || [matches()[i][4], matches()[i][5]] }
function fmtDate(s){ const [y,m,d]=s.split("-"); return `${+d} ${MESI[m-1]} ${y}` }

// Classifica con spareggio: punti, scontri diretti, differenza reti, gol fatti
function table(list){
  const t = {};
  const row = n => t[n] || (t[n] = {team:n,pt:0,g:0,w:0,d:0,l:0,gf:0,gs:0});
  for (const [ , , h, a, g1, g2] of list){
    const H=row(h), A=row(a);
    H.g++; A.g++; H.gf+=g1; H.gs+=g2; A.gf+=g2; A.gs+=g1;
    if (g1>g2){H.pt+=3;H.w++;A.l++} else if (g1<g2){A.pt+=3;A.w++;H.l++} else {H.pt++;A.pt++;H.d++;A.d++}
  }
  const rows = Object.values(t);
  const groups = {};
  rows.forEach(r => (groups[r.pt] ||= []).push(r));
  for (const g of Object.values(groups)){
    if (g.length < 2) continue;
    const names = new Set(g.map(r=>r.team)), mini = {};
    g.forEach(r => mini[r.team] = {pt:0,dr:0});
    for (const [ , , h, a, g1, g2] of list){
      if (!names.has(h) || !names.has(a)) continue;
      mini[h].dr += g1-g2; mini[a].dr += g2-g1;
      if (g1>g2) mini[h].pt+=3; else if (g1<g2) mini[a].pt+=3; else {mini[h].pt++; mini[a].pt++}
    }
    g.forEach(r => r.mini = mini[r.team]);
  }
  rows.sort((x,y) => y.pt-x.pt || (y.mini?.pt||0)-(x.mini?.pt||0) || (y.mini?.dr||0)-(x.mini?.dr||0)
    || (y.gf-y.gs)-(x.gf-x.gs) || y.gf-x.gf || x.team.localeCompare(y.team));
  return rows;
}

// le partite ancora da giocare (punteggio null) contano solo se hai messo un tuo pronostico
function withScores(useOverrides){
  return matches().map((m,i) => { const s = useOverrides ? score(i) : [m[4],m[5]]; return [m[0],m[1],m[2],m[3],s[0],s[1]] }).filter(m => m[4] !== null);
}
function unplayed(){ return matches().filter(m => m[4] === null).length }
function inProgress(){ return matches().length - unplayed() < nTeams()*(nTeams()-1) }

// Punti cumulati dopo ogni partita giocata dalla squadra, in ordine di data
function pointsSeries(list){
  const series = {};
  const add = (t, p) => { const s = series[t] ||= []; s.push((s[s.length-1] || 0) + p) };
  for (const [ , , h, a, g1, g2] of list){
    add(h, g1>g2 ? 3 : g1===g2 ? 1 : 0);
    add(a, g2>g1 ? 3 : g1===g2 ? 1 : 0);
  }
  return series;
}

function teamColor(n){ const i = chartTeams.indexOf(n); return i<0 ? "var(--muted)" : `var(${PALETTE[i % PALETTE.length]})` }

function render(){
  const real = table(withScores(false)), alt = table(withScores(true));
  const realPos = {}; real.forEach((r,i) => realPos[r.team] = i+1);
  const realPt = {}; real.forEach(r => realPt[r.team] = r.pt);
  const nEdits = Object.keys(overrides).length;

  // Verdetto
  const rc = real[0].team, ac = alt[0].team, changed = rc !== ac;
  const CL = clSpots(), REL = relSpots();
  const relReal = real.slice(-REL).map(r=>r.team), relAlt = alt.slice(-REL).map(r=>r.team);
  const clReal = real.slice(0,CL).map(r=>r.team), clAlt = alt.slice(0,CL).map(r=>r.team);
  const saved = relReal.filter(t => !relAlt.includes(t)), sunk = relAlt.filter(t => !relReal.includes(t));
  const clIn = clAlt.filter(t => !clReal.includes(t)), clOut = clReal.filter(t => !clAlt.includes(t));
  let msg;
  const live = inProgress(), played = matches().length - unplayed();
  if (!nEdits) msg = live
    ? `Stagione ${season.replace("-","/")} in corso: ${played} partite giocate su ${nTeams()*(nTeams()-1)}. Cambia un risultato o metti il tuo pronostico sulle prossime partite.`
    : `Questa è la stagione ${season.replace("-","/")} come è andata davvero sul campo. ${MOMENTS[season] ? "Scegli un momento chiave o cambia" : "Cambia"} una partita qualsiasi.`;
  else {
    const parts = [];
    parts.push(changed ? `Lo scudetto cambia padrone: ${ac} a ${alt[0].pt} punti, ${rc} a ${alt.find(r=>r.team===rc).pt}.`
                       : `${rc} resta prima con ${alt[0].pt} punti; seconda ${alt[1].team} a ${alt[0].pt - alt[1].pt || "pari"}${alt[0].pt - alt[1].pt === 1 ? " punto" : alt[0].pt === alt[1].pt ? " punti, dietro per gli scontri diretti" : " punti"}.`);
    if (clIn.length) parts.push(`In Champions entra ${clIn.join(", ")} al posto di ${clOut.join(", ")}.`);
    if (saved.length) parts.push(`${saved.join(", ")} si salva, retrocede ${sunk.join(", ")}.`);
    msg = parts.join(" ");
  }
  if (NOTES[season]) msg += ` <em>Nota: ${NOTES[season]}</em>`;
  $("verdict").innerHTML = `
    <div><div class="lab">${live ? "In testa oggi, realtà" : "Primo sul campo, realtà"}</div><div class="big">${rc}</div></div>
    <div class="${changed?"changed":""}"><div class="lab">${live ? "In testa nel tuo universo" : "Primo nel tuo universo"}</div><div class="big">${ac}</div></div>
    <div class="msg">${msg}</div>`;
  $("zones").innerHTML = `<span><i style="background:var(--s2)"></i>Zona Champions (${CL} posti)</span><span><i style="background:var(--bad)"></i>Retrocessione (${REL})</span><span>A pari punti: classifica avulsa (punti e differenza reti negli scontri diretti), poi differenza reti e gol fatti in generale.</span>`;

  // Momenti
  $("moments").innerHTML = (MOMENTS[season] || []).map((m,k) => {
    const i = findMatch(m.h, m.a), on = overrides[i] && overrides[i][0]===m.set[0] && overrides[i][1]===m.set[1];
    return `<button class="moment ${on?"on":""}" data-k="${k}" aria-pressed="${on}">
      <span class="q">${m.q}</span>
      <span class="meta">${m.h}–${m.a} · ${m.d} · ${on?"<b>applicato</b> (clicca per annullare)":`diventa <b>${m.set[0]}-${m.set[1]}</b>`}</span></button>`;
  }).join("") || upcomingBig() || `<p class="empty">Per questa stagione non ho ancora preparato momenti chiave. Cambia tu una partita dalla schedina.</p>`;
  $("momentsTitle").textContent = MOMENTS[season] || !unplayed() ? "Momenti chiave" : "Da non perdere";
  $("momentsSub").textContent = MOMENTS[season] || !unplayed() ? "Partite che hanno deciso la stagione. Clicca per riscriverle." : "I prossimi derby e scontri tra le prime sei. Clicca per trovarli nella schedina e mettere il tuo pronostico.";

  renderList();
  renderChart();

  // Classifica
  $("table").innerHTML = `<thead><tr><th>#</th><th>Squadra</th><th>G</th><th title="Gol fatti">GF</th><th title="Gol subiti">GS</th><th title="Differenza reti">DR</th><th>Pt reali</th><th>Pt</th><th>Δ</th></tr></thead><tbody>` +
    alt.map((r,i) => {
      const dpos = realPos[r.team] - (i+1), dpt = r.pt - realPt[r.team];
      const cls = i<CL ? "cl" : i>=alt.length-REL ? "rel" : "";
      const arrow = dpos>0 ? `<span class="up">▲${dpos}</span>` : dpos<0 ? `<span class="down">▼${-dpos}</span>` : `<span class="same">–</span>`;
      return `<tr class="${cls}"><td>${i+1}</td><td class="t">${kit(r.team)}${r.team}</td><td>${r.g}</td><td>${r.gf}</td><td>${r.gs}</td><td>${r.gf-r.gs>0?"+":""}${r.gf-r.gs}</td>
        <td class="same">${realPt[r.team]}</td><td><b>${r.pt}</b>${dpt? ` <span class="${dpt>0?"up":"down"}">${dpt>0?"+":""}${dpt}</span>`:""}</td><td>${arrow}</td></tr>`;
    }).join("") + "</tbody>";

  // Modifiche
  const keys = Object.keys(overrides).map(Number).sort((a,b) => matches()[a][1].localeCompare(matches()[b][1]));
  $("edits").innerHTML = keys.length ? keys.map(i => {
    const m = matches()[i], s = overrides[i];
    return `<div class="edit"><span>${fmtDate(m[1])} · ${m[2]}–${m[3]} <span class="num">${m[4]===null ? "pronostico" : `<s>${m[4]}-${m[5]}</s> →`} <b>${s[0]}-${s[1]}</b></span></span><button data-undo="${i}">Annulla</button></div>`;
  }).join("") : `<p class="empty">Nessuna modifica: stai guardando la storia vera.</p>`;

  store.set("sd2-"+season, overrides);
  publish3D();
  renderSim();
}

function findMatch(h,a){ return matches().findIndex(m => m[2]===h && m[3]===a) }

// ---------------- Simulatore di fine stagione ----------------
// Modello di Poisson: attacco e difesa di ogni squadra dai gol segnati e subiti in stagione, tirati verso la media
// del campionato come se ognuna avesse giocato 5 partite "normali" in più, e il vantaggio del campo.
// Le partite che mancano si giocano molte volte; i tuoi pronostici restano fissi. Stesso seme per realtà e universo,
// così la differenza tra i due dipende solo da quello che hai cambiato.
const SIM_RUNS = (window.SD_MODE || "pc") === "pc" ? 4000 : 2000;
function rng(seed){ return () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
function poisson(l, r){ const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= r() } while (p > L); return k - 1 }
function simulate(useOverrides){
  const all = matches().map((m,i) => { const s = useOverrides ? score(i) : [m[4],m[5]]; return { h:m[2], a:m[3], g:s[0] === null ? null : s } });
  const played = all.filter(x => x.g), rest = all.filter(x => !x.g);
  if (!rest.length) return null;
  const teams = [...new Set(all.map(x => x.h))], N = teams.length, idx = Object.fromEntries(teams.map((t,i) => [t,i]));
  const T = teams.map(() => ({ gf:0, ga:0, g:0, pt:0 }));
  let hg = 0, ag = 0;
  for (const x of played){
    const [a,b] = x.g, H = T[idx[x.h]], A = T[idx[x.a]];
    hg += a; ag += b; H.gf += a; H.ga += b; A.gf += b; A.ga += a; H.g++; A.g++;
    if (a>b) H.pt += 3; else if (a<b) A.pt += 3; else { H.pt++; A.pt++ }
  }
  const n = Math.max(1, played.length), hm = played.length ? hg/n : 1.4, am = played.length ? ag/n : 1.1, mu = (hm+am)/2, K = 5;
  const att = T.map(r => (r.gf + K*mu)/((r.g + K)*mu)), def = T.map(r => (r.ga + K*mu)/((r.g + K)*mu));
  const R = rest.map(x => { const H = idx[x.h], A = idx[x.a]; return [H, A, hm*att[H]*def[A], am*att[A]*def[H]] });
  const CL = clSpots(), REL = relSpots(), r = rng(20261029);
  const out = teams.map(() => ({ title:0, cl:0, rel:0, pts:0 }));
  const pts = new Float64Array(N), gd = new Float64Array(N), gf = new Float64Array(N), order = teams.map((_,i) => i);
  for (let s = 0; s < SIM_RUNS; s++){
    for (let i = 0; i < N; i++){ pts[i] = T[i].pt; gd[i] = T[i].gf - T[i].ga; gf[i] = T[i].gf }
    for (const [H, A, lh, la] of R){
      const a = poisson(lh, r), b = poisson(la, r);
      gd[H] += a-b; gd[A] += b-a; gf[H] += a; gf[A] += b;
      if (a>b) pts[H] += 3; else if (a<b) pts[A] += 3; else { pts[H]++; pts[A]++ }
    }
    order.sort((p,q) => pts[q]-pts[p] || gd[q]-gd[p] || gf[q]-gf[p] || p-q);
    order.forEach((ti, pos) => { const o = out[ti]; o.pts += pts[ti]; if (pos === 0) o.title++; if (pos < CL) o.cl++; if (pos >= N-REL) o.rel++ });
  }
  return teams.map((t,i) => ({ team:t, title:out[i].title/SIM_RUNS, cl:out[i].cl/SIM_RUNS, rel:out[i].rel/SIM_RUNS, pts:out[i].pts/SIM_RUNS })).sort((a,b) => b.pts-a.pts || b.title-a.title);
}
const simBase = {};
let simTimer = null;
function renderSim(){
  const panel = $("simPanel");
  if (!panel) return;
  panel.hidden = !unplayed();
  if (panel.hidden) return;
  $("simBody").innerHTML = `<p class="empty">Sto giocando ${SIM_RUNS.toLocaleString("it-IT")} volte le ${unplayed()} partite che mancano…</p>`;
  clearTimeout(simTimer);
  simTimer = setTimeout(() => {
    const base = simBase[season] ||= simulate(false);
    const edited = Object.keys(overrides).length > 0, alt = edited ? simulate(true) : base;
    const b = Object.fromEntries(base.map(x => [x.team, x]));
    const pct = v => v === 0 ? "–" : v < 0.01 ? "<1%" : Math.round(v*100) + "%";
    const delta = (v, w) => { const d = Math.round((v - w)*100); return edited && d ? ` <small class="${d>0?"up":"down"}">${d>0?"+":""}${d}</small>` : "" };
    const bar = (v, cls) => `<span class="pbar ${cls}"><i style="width:${Math.max(v ? 2 : 0, v*100)}%"></i></span>`;
    const favs = alt.filter(x => x.title >= 0.005).sort((a,c) => c.title-a.title).slice(0,3);
    $("simBody").innerHTML = `
      <div class="sim-head">${favs.map(x => `<div class="fav">${kit(x.team)}<b>${x.team}</b><span class="num">${pct(x.title)}</span>${delta(x.title, b[x.team].title)}</div>`).join("")}</div>
      <div class="table-wrap"><table class="sim-table"><thead><tr><th>#</th><th>Squadra</th><th title="Punti medi a fine stagione">Punti attesi</th><th>Scudetto</th><th>Champions</th><th>Retrocessione</th></tr></thead><tbody>` +
      alt.map((x,k) => `<tr><td>${k+1}</td><td class="t">${kit(x.team)}${x.team}</td><td>${x.pts.toFixed(0)}</td>
        <td>${bar(x.title,"gold")}${pct(x.title)}${delta(x.title, b[x.team].title)}</td>
        <td>${bar(x.cl,"blue")}${pct(x.cl)}${delta(x.cl, b[x.team].cl)}</td>
        <td>${bar(x.rel,"red")}${pct(x.rel)}${delta(x.rel, b[x.team].rel)}</td></tr>`).join("") + `</tbody></table></div>
      <p class="sub sim-note">${edited ? "I numeri piccoli colorati sono la differenza, in punti percentuali, rispetto alla realtà senza le tue modifiche. " : "Metti un pronostico su una partita futura e guarda come cambiano le probabilità. "}A parità di punti il simulatore usa differenza reti e gol fatti; la classifica avulsa vale solo per la classifica attuale.</p>`;
  }, 40);
}

// stagione in corso: i prossimi 6 derby o big match, al posto dei momenti chiave
function upcomingBig(){
  if (!unplayed()) return "";
  const items = matches().map((m,i) => [m,i]).filter(([m]) => m[4] === null).map(([m,i]) => [m,i,bigMatch(m[2],m[3])]).filter(x => x[2]).slice(0,6);
  return items.map(([m,i,b]) => {
    const s = overrides[i];
    return `<button class="moment ${s?"on":""}" data-big="${i}">
      <span class="q">${kit(m[2])}${m[2]} – ${kit(m[3])}${m[3]}</span>
      <span class="meta"><span class="badge">${b}</span> ${m[6] ? m[6]+"ª giornata · " : ""}${fmtDate(m[1])}${s ? ` · tuo pronostico <b>${s[0]}-${s[1]}</b>` : ""}</span></button>`;
  }).join("");
}

function renderList(){
  const team = $("fTeam").value, round = $("fRound").value;
  // Risultati: dall'ultima giocata in giù. Prossime partite: dalla più vicina in avanti.
  const future = unplayed() > 0;
  $("listMode").hidden = !future;
  if (!future) listMode = "played";
  $("listMode").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.mode === listMode));
  let rows = matches().map((m,i)=>[m,i]).filter(([m]) => (!team || m[2]===team || m[3]===team) && (!round || roundKey(m)===round));
  if (future) rows = rows.filter(([m]) => (m[4] === null) === (listMode === "next"));
  if (listMode === "played") rows.reverse();
  const big = future ? Object.fromEntries(rows.filter(([m]) => m[4] === null).map(([m,i]) => [i, bigMatch(m[2], m[3])])) : {};
  $("list").innerHTML = rows.map(([m,i]) => {
    const [g1,g2] = score(i), ed = !!overrides[i], open = g1 === null, res = open ? "" : g1>g2?"1":g1<g2?"2":"X";
    const note = m[4] === null ? (ed ? "il tuo pronostico" : "da giocare") : ed ? `reale <s>${m[4]}-${m[5]}</s>` : "risultato reale";
    return `<div class="match ${ed?"edited":""} ${open?"future":""} ${big[i]?"big":""} ${flashIdx===i?"flash":""}" data-i="${i}">
      <div class="teams"><span class="h">${m[2]}</span>
        <span class="score">
          <span class="step"><button data-d="0,1" aria-label="Gol in più ${m[2]}">▲</button><button data-d="0,-1" aria-label="Gol in meno ${m[2]}">▼</button></span>
          <span class="g">${open ? "–" : g1}</span><span class="sep">-</span><span class="g">${open ? "–" : g2}</span>
          <span class="step"><button data-d="1,1" aria-label="Gol in più ${m[3]}">▲</button><button data-d="1,-1" aria-label="Gol in meno ${m[3]}">▼</button></span>
        </span><span class="a">${m[3]}</span></div>
      <div class="x12">${["1","X","2"].map(x=>`<button data-x="${x}" class="${res===x?"on":""}" aria-label="Segno ${x}">${x}</button>`).join("")}</div>
      <div class="minfo"><span>${m[6] ? `${m[6]}ª giornata · ` : ""}${fmtDate(m[1])}${big[i] ? ` <span class="badge">${big[i]}</span>` : ""}</span><span class="orig">${note}</span></div>
    </div>`;
  }).join("") || `<p class="empty">Nessuna partita con questi filtri.</p>`;
  if (flashIdx!==null){ const el = $("list").querySelector(`[data-i="${flashIdx}"]`); el && el.scrollIntoView({block:"nearest"}); flashIdx = null }
}

function renderChart(){
  const real = pointsSeries(withScores(false)), alt = pointsSeries(withScores(true));
  // l'asse copre sempre la stagione intera: in una stagione in corso le linee si fermano all'ultima partita giocata
  const W=800,H=340,L=40,R=96,T=14,B=30, last = nRounds()-1;
  const end = s => s && s.length ? s[s.length-1] : 0;
  const max = Math.max(...chartTeams.flatMap(t => [end(real[t]), end(alt[t])]), 10);
  const yMax = Math.ceil(max/10)*10;
  const x = k => L + (k/last)*(W-L-R), y = v => T + (1 - v/yMax)*(H-T-B);
  let s = "";
  for (let v=0; v<=yMax; v+=10) s += `<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end">${v}</text>`;
  [0,.25,.5,.75,1].map(f => Math.round(f*last)).forEach(k => s += `<text x="${x(k)}" y="${H-10}" text-anchor="middle">${k+1}ª</text>`);
  const path = arr => (arr||[]).map((v,k) => `${k?"L":"M"}${x(k).toFixed(1)},${y(v).toFixed(1)}`).join("");
  chartTeams.forEach(t => {
    const c = teamColor(t);
    s += `<path d="${path(real[t])}" fill="none" stroke="${c}" stroke-width="1.5" stroke-dasharray="4 3" opacity=".55"/>`;
    s += `<path d="${path(alt[t])}" fill="none" stroke="${c}" stroke-width="2.6" stroke-linejoin="round"/>`;
  });
  // Etichette finali senza sovrapposizioni, dopo l'ultimo punto di ogni linea
  const labels = chartTeams.map(t => { const k = Math.max(0, (alt[t]||[]).length-1); return { t, k, v:end(alt[t]), yy:y(end(alt[t])) } }).sort((a,b)=>a.yy-b.yy);
  for (let i=1;i<labels.length;i++) if (labels[i].yy - labels[i-1].yy < 14) labels[i].yy = labels[i-1].yy + 14;
  labels.forEach(l => {
    s += `<circle cx="${x(l.k)}" cy="${y(l.v)}" r="3.5" fill="${teamColor(l.t)}"/>`;
    s += `<text x="${x(l.k)+10}" y="${l.yy+4}" style="fill:${teamColor(l.t)};font-weight:600">${l.t} ${l.v}</text>`;
  });
  $("chart").innerHTML = s;

  const final = table(withScores(true));
  $("chips").innerHTML = final.map(r => r.team).map(t => {
    const on = chartTeams.includes(t);
    return `<button class="chip" data-team="${t}" aria-pressed="${on}"><i style="background:${on?teamColor(t):"var(--line)"}"></i>${t}</button>`;
  }).join("");
}

function setSeason(s){
  season = s;
  overrides = store.get("sd2-"+s) || {};
  chartTeams = table(withScores(false)).slice(0,4).map(r=>r.team);
  $("season").value = s;
  const teams = [...new Set(matches().map(m=>m[2]))].sort();
  $("fTeam").innerHTML = `<option value="">Tutte le squadre</option>` + teams.map(t=>`<option>${t}</option>`).join("");
  $("fRound").innerHTML = hasRounds()
    ? `<option value="">Tutte le giornate</option>` + [...new Set(matches().map(m=>m[6]))].sort((a,b)=>b-a).map(r=>`<option value="${r}">${r}ª giornata</option>`).join("")
    : `<option value="">Tutti i mesi</option>` + [...new Set(matches().map(m=>m[0]))].reverse().map(k=>`<option value="${k}">${fmtMonth(k)}</option>`).join("");
  listMode = "played";
  $("listSub").textContent = unplayed()
    ? `${matches().length - unplayed()} partite giocate e ${unplayed()} da giocare. Cambia un risultato, oppure metti il tuo pronostico con 1 X 2 o le frecce.`
    : `Tutte le ${matches().length} partite, ${nTeams()} squadre. Usa 1 X 2 o le frecce per cambiare il punteggio.`;
  store.set("sd-season", s);
  flips = store.get("sd-flips-"+s) || {};
  render();
  renderCups();
}

function setScore(i, g){
  const m = matches()[i];
  g = g.map(v => Math.max(0, Math.min(9, v)));
  if (g[0]===m[4] && g[1]===m[5]) delete overrides[i]; else overrides[i] = g;
  render();
}

const CURRENT = Object.keys(SERIE_A).sort().pop();
$("season").innerHTML = Object.keys(SERIE_A).sort().reverse().map(k => `<option value="${k}">${k.replace("-","/")}${k===CURRENT ? " (in corso)" : MOMENTS[k] ? " ★" : ""}</option>`).join("");
$("season").addEventListener("change", e => setSeason(e.target.value));
$("reset").addEventListener("click", () => { overrides = {}; flips = {}; render(); renderCups() });
$("fTeam").addEventListener("change", renderList);
$("fRound").addEventListener("change", renderList);
$("listMode").addEventListener("click", e => { const b = e.target.closest("[data-mode]"); if (b){ listMode = b.dataset.mode; renderList() } });
$("moments").addEventListener("click", e => {
  const bb = e.target.closest("[data-big]");
  if (bb){
    const i = +bb.dataset.big, m = matches()[i];
    listMode = "next"; $("fTeam").value = m[2]; $("fRound").value = roundKey(m); flashIdx = i;
    renderList();
    $("list").scrollIntoView && $("list").scrollIntoView({ block:"nearest", behavior:"smooth" });
    return;
  }
  const b = e.target.closest("[data-k]"); if (!b) return;
  const m = MOMENTS[season][b.dataset.k], i = findMatch(m.h, m.a);
  const on = overrides[i] && overrides[i][0]===m.set[0] && overrides[i][1]===m.set[1];
  $("fTeam").value = m.h; $("fRound").value = roundKey(matches()[i]);
  flashIdx = i;
  setScore(i, on ? [matches()[i][4], matches()[i][5]] : m.set);
});
$("list").addEventListener("click", e => {
  const row = e.target.closest("[data-i]"); if (!row) return;
  const i = +row.dataset.i, [g1,g2] = score(i).map(v => v ?? 0);
  const d = e.target.closest("[data-d]"), x = e.target.closest("[data-x]");
  if (d){ const [side,delta] = d.dataset.d.split(",").map(Number); const g=[g1,g2]; g[side]+=delta; setScore(i,g) }
  if (x){
    const hi = Math.max(g1,g2);
    if (x.dataset.x==="1") setScore(i, g1>g2 ? [g1,g2] : [g2+1, g2]);
    if (x.dataset.x==="X") setScore(i, [hi,hi]);
    if (x.dataset.x==="2") setScore(i, g2>g1 ? [g1,g2] : [g1, g1+1]);
  }
});
$("edits").addEventListener("click", e => { const b = e.target.closest("[data-undo]"); if (b){ delete overrides[b.dataset.undo]; render() } });
$("chips").addEventListener("click", e => {
  const b = e.target.closest("[data-team]"); if (!b) return;
  const t = b.dataset.team;
  if (chartTeams.includes(t)) { if (chartTeams.length>1) chartTeams = chartTeams.filter(x=>x!==t) }
  else { chartTeams = [...chartTeams, t].slice(-6) }
  renderChart();
});

// ---------------- Coppe: Coppa Italia ed Europa ----------------
// Ribaltare una sfida fa passare l'eliminata, che prende il posto della vincitrice ed eredita i suoi risultati nei turni dopo.
const ITA_CLUBS = new Set(["Juventus","Inter","Milan","Lazio","Roma","Napoli","Atalanta","Fiorentina","Bologna","Udinese","Parma","Sampdoria","Genoa","Palermo","Torino","Chievo","Empoli","Livorno","Sassuolo","Perugia","Brescia","Reggina","Lecce","Siena","Cagliari","Verona","Vicenza","Modena","Ancona","Como"]);

// ---------------- Colori sociali (solo colori, nessun logo) ----------------
const CLUB_COLORS = {
  Juventus:["#f2f2f2","#111111"], Inter:["#0a5cc2","#0b0b0b"], Milan:["#e1001f","#0b0b0b"], Roma:["#a3203a","#f5b335"], Lazio:["#8fd1f5","#ffffff"],
  Napoli:["#1a9bdc","#ffffff"], Atalanta:["#1f6fc4","#0b0b0b"], Fiorentina:["#7a35b0","#ffffff"], Bologna:["#c0202e","#1b2f55"], Torino:["#962015","#ffffff"],
  Genoa:["#b8183c","#0e2c66"], Sampdoria:["#1d5fb5","#ffffff"], Udinese:["#e8e8e8","#111111"], Parma:["#ffd200","#1a4a9c"], Palermo:["#f4a6c2","#111111"],
  Cagliari:["#c0202f","#0b2f6e"], Sassuolo:["#00a651","#111111"], Verona:["#ffde00","#00347a"], Chievo:["#ffde00","#1b3e8c"], Lecce:["#ffd800","#d3111f"],
  Empoli:["#0b5fb0","#ffffff"], Monza:["#e4002b","#ffffff"], Como:["#1650b8","#ffffff"], Venezia:["#ff7a00","#0d7a3b"], Cremonese:["#c8102e","#9aa0a6"],
  Salernitana:["#8a2232","#ffffff"], Spezia:["#e8e8e8","#111111"], Frosinone:["#ffd500","#1446a0"], Pisa:["#1b3f8f","#111111"], Brescia:["#1d4fa0","#ffffff"],
  Livorno:["#a3203a","#ffffff"], Siena:["#2a2a2a","#ffffff"], Reggina:["#8a1c2b","#ffffff"], Catania:["#d1102d","#1b55a8"], Bari:["#d1102d","#ffffff"],
  Perugia:["#d1102d","#ffffff"], Piacenza:["#d1102d","#ffffff"], Vicenza:["#d1102d","#ffffff"], Ascoli:["#2a2a2a","#ffffff"], Messina:["#ffd500","#c8102e"],
  Modena:["#ffd500","#1446a0"], Ancona:["#d1102d","#ffffff"], Treviso:["#1b55a8","#ffffff"], Novara:["#1d4fa0","#ffffff"], Pescara:["#1b8fd8","#ffffff"],
  Cesena:["#e8e8e8","#111111"], Carpi:["#d1102d","#ffffff"], Crotone:["#d1102d","#1446a0"], Benevento:["#ffd500","#c8102e"], SPAL:["#4fa6e0","#ffffff"],
  Avellino:["#0d8a43","#ffffff"]
};
// squadre straniere o senza colori noti: una tinta viva ricavata dal nome
// (window.clubColors è la versione in esadecimale per il 3D; il nome interno è diverso perché le funzioni globali vivono su window)
function clubPalette(t){
  if (CLUB_COLORS[t]) return CLUB_COLORS[t];
  let h = 0; for (const ch of String(t)) h = (h*31 + ch.charCodeAt(0)) % 360;
  return [`hsl(${h} 75% 55%)`, `hsl(${(h+40)%360} 70% 30%)`];
}
window.clubColors = (t) => clubPalette(t).map(x => x.startsWith("hsl") ? hslToHex(x) : x);
function hslToHex(s){
  const [h, sat, l] = s.match(/[\d.]+/g).map(Number), a = sat/100*Math.min(l/100, 1-l/100);
  const f = n => { const k = (n + h/30) % 12, c = l/100 - a*Math.max(-1, Math.min(k-3, 9-k, 1)); return Math.round(255*c).toString(16).padStart(2,"0") };
  return "#" + f(0) + f(8) + f(4);
}
function kit(t){ const [a,b] = clubPalette(t); return `<i class="kit" style="--k1:${a};--k2:${b}" aria-hidden="true"></i>` }

// ---------------- Stato per il palco 3D ----------------
const SD_MODE = window.SD_MODE || "pc";
const REDUCE_MOTION = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
let currentView = "a";
const lastKO = {}, verdictKey = {};
function koTop(st){
  let fi = -1; st.forEach((s, i) => { if (/^Final/i.test(s.name) && s.ties.length) fi = i });
  if (fi < 0) fi = st.length - 1;
  const f = st[fi] && st[fi].ties[0];
  if (!f) return [null, null, null];
  const semi = st[fi-1], third = semi && semi.ties.length ? semi.ties[0].d[1 - semi.ties[0].w] : null;
  return [f.d[f.w], f.d[1-f.w], third];
}
function publish3D(){
  const r = table(withScores(false)), a = table(withScores(true));
  const realPt = Object.fromEntries(r.map(x => [x.team, x.pt]));
  let st;
  if (currentView === "cup" && lastKO.cup) st = { title:"Coppa Italia", real:koTop(lastKO.cup.real), alt:koTop(lastKO.cup.alt) };
  else if (currentView === "eu" && lastKO.eu) st = { title:lastKO.eu.name, real:koTop(lastKO.eu.real), alt:koTop(lastKO.eu.alt) };
  else st = { title: inProgress() ? "Serie A, classifica di oggi" : "Serie A", real:r.slice(0,3).map(x => x.team), alt:a.slice(0,3).map(x => x.team) };
  st.board = a.map(x => ({ team:x.team, alt:x.pt, real:realPt[x.team] || 0 }));
  st.view = currentView;
  st.sub = `Stagione ${season.replace("-","/")} · trascina per girare il prato`;
  st.changed = st.real.join() !== st.alt.join();
  window.SD_STATE = st;
  if (typeof CustomEvent === "function" && window.dispatchEvent) window.dispatchEvent(new CustomEvent("sd:state", { detail:st }));
  // il verdetto prende i colori di chi è in testa nel tuo universo e si gira quando cambia
  const vid = { a:"verdict", cup:"cupVerdict", eu:"euVerdict" }[currentView], v = vid && $(vid);
  if (v && v.style && st.alt[0]){
    const [c1, c2] = window.clubColors(st.alt[0]);
    v.style.setProperty("--c1", c1); v.style.setProperty("--c2", c2);
    const key = season + "|" + st.alt[0];
    if (verdictKey[vid] && verdictKey[vid] !== key && !REDUCE_MOTION && v.classList){ v.classList.remove("flipping"); void v.offsetWidth; v.classList.add("flipping") }
    verdictKey[vid] = key;
  }
}

// ---------------- Firma ciuffa62 ----------------
// Tre marchi semitrasparenti (bianco, giallo, verde) che si spostano in punti diversi dello schermo, sopra tutto ma senza bloccare i clic.
// Se qualcuno li toglie dalla pagina, tornano.
const OWNER = "ciuffa62";
(function watermark(){
  if (!document.body || typeof document.createElement !== "function") return;
  const make = cls => { const w = document.createElement("div"); w.className = "wm" + (cls ? " " + cls : ""); w.setAttribute("aria-hidden", "true"); w.textContent = OWNER; document.body.appendChild(w); return w };
  const kinds = ["", "wm-y", "wm-g"];
  const wms = kinds.map(make);
  const move = i => {
    if (!wms[i].isConnected) wms[i] = make(kinds[i]);
    const x = 6 + Math.random()*70, y = 8 + Math.random()*78, rot = -24 + Math.random()*20;
    wms[i].style.left = x + "vw"; wms[i].style.top = y + "vh"; wms[i].style.transform = `rotate(${rot.toFixed(1)}deg)`;
  };
  const moveAll = () => kinds.forEach((_, i) => move(i));
  moveAll();
  setInterval(moveAll, 7000);
  if (typeof MutationObserver === "function") new MutationObserver(() => { if (wms.some(w => !w.isConnected)) moveAll() }).observe(document.body, { childList:true });
})();

// PC: le card si inclinano un poco seguendo il mouse. Telefono: niente vetro sfocato, più leggero.
if (document.documentElement && document.documentElement.classList) document.documentElement.classList.add(SD_MODE === "pc" ? "tilt" : "lite");
if (SD_MODE === "pc" && !REDUCE_MOTION && typeof matchMedia === "function" && matchMedia("(pointer: fine)").matches){
  let tilted = null;
  document.addEventListener("pointermove", e => {
    const p = e.target.closest && e.target.closest(".panel");
    if (tilted && tilted !== p){ tilted.style.transform = ""; tilted = null }
    if (!p) return;
    const b = p.getBoundingClientRect(), dx = (e.clientX - b.left)/b.width - .5, dy = (e.clientY - b.top)/b.height - .5;
    p.style.transform = `perspective(1100px) rotateX(${(-dy*2.4).toFixed(2)}deg) rotateY(${(dx*2.4).toFixed(2)}deg) translateY(-2px)`;
    tilted = p;
  });
}
const CUP_ROUNDS = ["Ottavi","Quarti","Semifinali","Finale"];
let flips = {};

function stageLabel(n){
  const q = n.match(/(\d)/), ord = q ? `${q[1]}° turno` : "";
  if (/^Preliminare: semi/i.test(n)) return "Preliminare, semifinale";
  if (/^Preliminare: final/i.test(n)) return "Preliminare, finale";
  if (/^Preliminary/i.test(n)) return "Turno preliminare";
  if (/Qualifying/i.test(n)) { const w = n.match(/^(First|Second|Third)/i); return `Preliminari, ${q ? q[1] : {first:1,second:2,third:3}[w[1].toLowerCase()]}° turno` }
  if (/^Play-?off/i.test(n)) return "Spareggio";
  if (/^Group Phase 2/i.test(n)) return "2ª fase a gironi";
  if (/^Group/i.test(n)) return "Fase a gironi";
  if (/^League/i.test(n)) return "Fase campionato";
  if (/^Intermediate/i.test(n)) return "Sedicesimi / spareggi";
  if (/^First Round/i.test(n)) return "Primo turno";
  if (/^Second Round/i.test(n)) return "Secondo turno";
  if (/^Third Round/i.test(n)) return "Terzo turno";
  if (/^Fourth Round/i.test(n)) return "Ottavi";
  if (/^1\/8|Eighth/i.test(n)) return "Ottavi";
  if (/^Quarter/i.test(n)) return "Quarti";
  if (/^Semi/i.test(n)) return "Semifinali";
  if (/^Final/i.test(n)) return "Finale";
  return n;
}

function playOut(prefix, stages, fl = flips){
  const rename = {}, R = n => rename[n] || n;
  return stages.map((s, si) => {
    const groups = {};
    for (const [g, ms] of Object.entries(s.groups || {})) groups[g] = ms.map(m => ({ d:[R(m[0]),R(m[1])], real:[m[0],m[1]], g:[m[2],m[3]] }));
    const pending = [];
    const ties = s.ties.map((t, ti) => {
      const key = `${prefix}|${si}|${ti}`;
      const d = [R(t[0]), R(t[1])], w0 = t[4] < 0 ? 0 : t[4], flipped = !!fl[key], w = flipped ? 1-w0 : w0;
      if (d[w] !== R(t[w0])) pending.push([t[w0], d[w]]);
      return { key, real:[t[0],t[1]], d, legs:t[2], pen:t[3], w, flipped, c:[t[5]||"", t[6]||""] };
    });
    pending.forEach(([a,b]) => rename[a] = b);
    return { name:s.name, ties, groups };
  });
}

function scoreFor(t, side){
  const legs = t.legs.map(l => side===0 ? l : [l[1],l[0]]);
  let s;
  if (legs.length === 1) s = `${legs[0][0]}-${legs[0][1]}`;
  else {
    const home1 = side===0;
    s = `${home1?"casa":"fuori"} ${legs[0][0]}-${legs[0][1]} · ${home1?"fuori":"casa"} ${legs[1][0]}-${legs[1][1]}`;
    const a = legs[0][0]+legs[1][0], b = legs[0][1]+legs[1][1];
    s += ` (tot. ${a}-${b})`;
  }
  if (t.pen) { const p = side===0 ? t.pen : [t.pen[1],t.pen[0]]; s += ` · rigori ${p[0]}-${p[1]}` }
  return s;
}

function miniTable(ms){
  const t = {};
  const row = n => t[n] ||= { team:n, pt:0, g:0, gf:0, gs:0 };
  for (const m of ms){
    const [a,b] = m.d, [x,y] = m.g, A=row(a), B=row(b);
    A.g++; B.g++; A.gf+=x; A.gs+=y; B.gf+=y; B.gs+=x;
    if (x>y) A.pt+=3; else if (x<y) B.pt+=3; else {A.pt++; B.pt++}
  }
  return Object.values(t).sort((p,q) => q.pt-p.pt || (q.gf-q.gs)-(p.gf-p.gs) || q.gf-p.gf);
}

function flipBtn(t){
  return `<button class="flip" data-flip="${t.key}" aria-pressed="${t.flipped}">${t.flipped ? "Ripristina" : "Ribalta"}</button>`;
}

function renderCups(){
  try { store.set("sd-flips-"+season, flips) } catch(e){}
  renderCup();
  renderEu();
  renderScorers();
}

// ---------------- Marcatori e rigori ----------------
function covBadge(cov){
  if (!cov || !cov[1]) return `<span class="cov none">nessun dato</span>`;
  const p = Math.round(100*cov[0]/cov[1]);
  if (!cov[0]) return `<span class="cov none">marcatori non disponibili</span>`;
  return `<span class="cov ${p<90?"part":""}">${p<90?"parziale: ":""}marcatori in ${cov[0]} partite su ${cov[1]} (${p}%)</span>`;
}
function scorerTable(rows, opts = {}){
  if (!rows.length) return `<p class="empty">Nessun marcatore registrato.</p>`;
  return `<div class="table-wrap"><table class="sc-table"><thead><tr><th>#</th><th>Giocatore</th><th>Gol</th><th>di cui rig.</th>${opts.seasons?"<th>Stag.</th>":""}</tr></thead><tbody>` +
    rows.map((r,k) => `<tr class="${ITA_CLUBS.has(r[1])?"ita":""}"><td>${k+1}</td><td class="t">${r[0]}<small>${r[1]}</small></td><td><b>${r[2]}</b></td><td>${r[3]||"–"}</td>${opts.seasons?`<td>${r[4]}</td>`:""}</tr>`).join("") + `</tbody></table></div>`;
}
function penTable(pens, onlyIta){
  const rows = Object.entries(pens).filter(([t]) => !onlyIta || ITA_CLUBS.has(t)).sort((a,b) => (b[1][0]-b[1][1]) - (a[1][0]-a[1][1]) || b[1][0]-a[1][0]);
  if (!rows.length) return `<p class="empty">Nessun rigore trasformato registrato.</p>`;
  return `<div class="table-wrap"><table class="sc-table"><thead><tr><th>Squadra</th><th>A favore</th><th>Contro</th><th>Saldo</th></tr></thead><tbody>` +
    rows.map(([t,[f,a]]) => `<tr class="${ITA_CLUBS.has(t)?"ita":""}"><td class="t">${kit(t)}${t}</td><td>${f}</td><td>${a}</td><td class="${f-a>0?"up":f-a<0?"down":"same"}">${f-a>0?"+":""}${f-a}</td></tr>`).join("") + `</tbody></table></div>`;
}
const PARTICLE = /^(de|di|del|della|dalla|van|von|da|dos|das|do|el|ben|le|la|mac|mc|ter|den|der|lo|dal)$/i;
function surnameKey(p){
  const toks = p.normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\./g,"").split(/\s+/);
  let i = toks.length-1;
  while (i > 0 && PARTICLE.test(toks[i-1])) i--;
  return toks.slice(i).join(" ").toLowerCase();
}
// somma più stagioni: stesso cognome e stessa squadra = stesso giocatore, a meno che il nome di battesimo
// sia diverso o passino più di 6 anni (Enrico Chiesa 2001 e Federico Chiesa 2019 restano due persone)
function firstName(p){
  const toks = p.normalize("NFD").replace(/[̀-ͯ]/g,"").split(/\s+/), sur = surnameKey(p).split(" ").length;
  return toks.length > sur ? toks[0].replace(/\.$/,"").toLowerCase() : null;
}
function sumScorers(lists){
  const groups = {};
  for (const list of lists) for (const [p,t,g,pen] of list) (groups[t+"|"+surnameKey(p)] ||= []).push({ p, t, g, pen, y:+list.season.slice(0,4), fn:firstName(p) });
  const out = [];
  for (const entries of Object.values(groups)){
    const clusters = [];
    for (const e of entries.sort((a,b) => a.y-b.y)){
      const same = (a,b) => !a || !b || a===b || (a.length===1 || b.length===1) && a[0]===b[0];
      let c = clusters.find(c => e.y - c.last <= 6 && same(c.fn, e.fn));
      if (!c) clusters.push(c = { p:e.p, t:e.t, g:0, pen:0, ys:new Set(), last:e.y, fn:e.fn });
      if (e.p.length > c.p.length) c.p = e.p;
      c.fn ||= e.fn; c.g += e.g; c.pen += e.pen; c.ys.add(e.y); c.last = e.y;
    }
    clusters.forEach(c => out.push([c.p, c.t, c.g, c.pen, c.ys.size]));
  }
  return out.sort((x,y) => y[2]-x[2] || x[0].localeCompare(y[0]));
}

function renderScorers(){
  const M = COPPE.marcatori, S = season.replace("-","/");
  const cup = M.coppa[season], eu = M.europa[season] || {};
  let h = `<section class="panel"><h2>Coppa Italia ${S}</h2>${covBadge(cup && cup.cov)}
    <h3>Marcatori, dagli ottavi</h3>${cup ? scorerTable(cup.sc.slice(0,15)) : ""}
    <h3>Rigori trasformati</h3>${cup ? penTable(cup.pens, false) : ""}</section>`;
  const comps = COPPE.europa[season] || {};
  for (const [k, c] of Object.entries(comps)){
    const m = eu[k];
    if (!m) continue;
    const ita = m.sc.filter(r => ITA_CLUBS.has(r[1]));
    h += `<section class="panel"><h2>${c.name} ${S}</h2>${covBadge(m.cov)}
      ${m.cov[0] ? `<h3>Marcatori italiani</h3>${scorerTable(ita.slice(0,15))}
      <h3>Capocannonieri della coppa</h3>${scorerTable(m.sc.slice(0,5))}
      <h3>Rigori delle italiane</h3>${penTable(m.pens, true)}` : `<p class="empty">Le fonti non hanno i marcatori di questa coppa per il ${S}.</p>`}</section>`;
  }
  if (!COPPE.europa[season]) h += `<section class="panel"><h2>Coppe europee ${S}</h2><p class="empty">Stagione non ancora disponibile.</p></section>`;
  $("scSeason").innerHTML = h;

  if (!$("scAll").innerHTML){
    const cupLists = Object.entries(M.coppa).map(([s,v]) => Object.assign(v.sc.slice(), { season:s }));
    const euLists = Object.entries(M.europa).flatMap(([s,v]) => Object.values(v).map(c => Object.assign(c.sc.filter(r => ITA_CLUBS.has(r[1])), { season:s })));
    const cupPens = {}, euPens = {};
    for (const v of Object.values(M.coppa)) for (const [t,[f,a]] of Object.entries(v.pens)) { const x = cupPens[t] ||= [0,0]; x[0]+=f; x[1]+=a }
    for (const v of Object.values(M.europa)) for (const c of Object.values(v)) for (const [t,[f,a]] of Object.entries(c.pens)) { const x = euPens[t] ||= [0,0]; x[0]+=f; x[1]+=a }
    const euYears = Object.entries(M.europa).filter(([s,v]) => Object.values(v).some(c => c.cov[0] && c.cov[0]/c.cov[1] >= .5)).map(([s]) => s);
    $("scAll").innerHTML = `
      <div><h3>Coppa Italia, dagli ottavi</h3>${scorerTable(sumScorers(cupLists).slice(0,20), { seasons:true })}
        <h3>Rigori in Coppa Italia</h3>${penTable(cupPens, true)}</div>
      <div><h3>Italiane in Europa</h3><span class="cov part">stagioni con marcatori: ${euYears[0].replace("-","/")} – ${euYears[euYears.length-1].replace("-","/")}, alcune parziali</span>
        ${scorerTable(sumScorers(euLists).slice(0,20), { seasons:true })}
        <h3>Rigori delle italiane in Europa</h3>${penTable(euPens, true)}</div>`;
  }
}

function renderCup(){
  const raw = COPPE.coppa[season];
  if (!raw){ $("cupVerdict").innerHTML = `<div class="msg">Nessun dato di Coppa Italia per questa stagione.</div>`; ["cupList","cupTable","cupEdits"].forEach(id => $(id).innerHTML = ""); lastKO.cup = null; if (currentView === "cup") publish3D(); return }
  const real = playOut("cup", raw, {}), alt = playOut("cup", raw);
  const fr = real[real.length-1].ties[0], fa = alt[alt.length-1].ties[0];
  const realW = fr.d[fr.w], altW = fa.d[fa.w];
  const n = Object.keys(flips).filter(k => k.startsWith("cup|")).length;
  $("cupVerdict").innerHTML = `
    <div><div class="lab">Coppa Italia, realtà</div><div class="big">${realW}</div></div>
    <div class="${altW!==realW?"changed":""}"><div class="lab">Nel tuo universo</div><div class="big">${altW}</div></div>
    <div class="msg">${n ? (altW!==realW ? `Con ${n} ${n===1?"sfida ribaltata":"sfide ribaltate"} la coppa va a ${altW}, in finale contro ${fa.d[1-fa.w]}.` : `Hai ribaltato ${n} ${n===1?"sfida":"sfide"}, ma la coppa resta a ${realW}.`) : `Coppa Italia ${season.replace("-","/")}: vinse ${realW} in finale contro ${fr.d[1-fr.w]}. Ribalta una sfida nella lista per riscriverla.`}</div>`;
  renderKO(real, alt, { list:"cupList", table:"cupTable", edits:"cupEdits", select:"cupTeam", all:"Tutte le squadre", label:(s, si) => CUP_ROUNDS[si] || s.name, isTeam:() => true });
  lastKO.cup = { real, alt };
  if (currentView === "cup") publish3D();
}

// Lista delle sfide (come la schedina della Serie A), tabella "fin dove arrivano" e modifiche: comune a Coppa Italia ed Europa
function renderKO(real, alt, o){
  // livello raggiunto: 2 per turno, +1 se vince la finale, +0,5 per gli spareggi dopo la fase campionato
  const reach = st => {
    const r = {};
    st.forEach((s, si) => {
      for (const ms of Object.values(s.groups)) for (const m of ms) for (const t of m.d) if (o.isTeam(t)) r[t] = { lv:si*2, label:o.label(s, si) };
      for (const t of s.ties) [0,1].forEach(i => { if (!o.isTeam(t.d[i])) return;
        const fin = /^Final/i.test(s.name) || si===st.length-1, won = t.w===i, ko = Object.keys(s.groups).length > 0;
        r[t.d[i]] = { lv: si*2 + (fin && won ? 1 : 0) + (ko ? .5 : 0), label: fin ? (won ? "Vince" : "Finale") : ko ? "Spareggio" : o.label(s, si) };
      });
    });
    return r;
  };
  const rr = reach(real), ra = reach(alt);
  const clubs = [...new Set([...Object.keys(rr), ...Object.keys(ra)])].sort((a,b) => ((ra[b]||{lv:-1}).lv - (ra[a]||{lv:-1}).lv) || a.localeCompare(b));
  $(o.table).innerHTML = `<thead><tr><th>#</th><th>Squadra</th><th>Realtà</th><th>Tuo universo</th><th>Δ</th></tr></thead><tbody>` + clubs.map((t,k) => {
    const a = ra[t], r = rr[t];
    const d = a && r ? Math.round(a.lv - r.lv) : 0;
    const arrow = !r ? `<span class="up">nuova</span>` : !a ? `<span class="down">fuori</span>` : d>0 ? `<span class="up">▲${Math.ceil(d/2)}</span>` : d<0 ? `<span class="down">▼${Math.ceil(-d/2)}</span>` : `<span class="same">–</span>`;
    return `<tr><td>${k+1}</td><td class="t">${kit(t)}${t}</td><td class="same">${r ? r.label : "–"}</td><td><b>${a ? a.label : "–"}</b></td><td>${arrow}</td></tr>`;
  }).join("") + `</tbody>`;

  const sel = $(o.select).value, teams = clubs.slice().sort();
  $(o.select).innerHTML = `<option value="">${o.all}</option>` + teams.map(t => `<option ${t===sel?"selected":""}>${t}</option>`).join("");
  const team = teams.includes(sel) ? sel : "";
  let rows = "";
  alt.forEach((s, si) => {
    const items = [];
    for (const [g, ms] of Object.entries(s.groups)){
      const tab = miniTable(ms);
      // sotto la posizione in classifica, le partite giocate dalla squadra, in ordine: V/N/P dal suo punto di vista
      const games = t => ms.filter(m => m.d.includes(t)).map(m => {
        const mine = m.d[0]===t ? m.g[0] : m.g[1], their = m.d[0]===t ? m.g[1] : m.g[0];
        const res = mine>their ? ["V","up"] : mine<their ? ["P","down"] : ["N","same"];
        return `<li><span class="res ${res[1]}">${res[0]}</span><span>${m.d[0]===t ? `<b>${m.d[0]}</b>` : m.d[0]} <span class="num">${m.g[0]}-${m.g[1]}</span> ${m.d[1]===t ? `<b>${m.d[1]}</b>` : m.d[1]}</span></li>`;
      }).join("");
      tab.forEach((r, pos) => { if (o.isTeam(r.team) && (!team || r.team===team))
        items.push(`<div class="match grp"><div class="teams"><span><b>${r.team}</b> ${pos+1}ª su ${tab.length}${g!=="L" ? ` nel girone ${g}` : ""}, ${r.pt} punti</span></div><div></div><ul class="grp-games">${games(r.team)}</ul></div>`) });
    }
    for (const t of s.ties){
      if (![0,1].some(i => o.isTeam(t.d[i]) && (!team || t.d[i]===team))) continue;
      const tot = [t.legs.reduce((x,l)=>x+l[0],0), t.legs.reduce((x,l)=>x+l[1],0)];
      const legs = t.legs.length > 1 ? `andata ${t.legs[0][0]}-${t.legs[0][1]}, ritorno ${t.legs[1][1]}-${t.legs[1][0]}` : "gara unica";
      const inh = [0,1].filter(i => t.d[i]!==t.real[i]).map(i => `${t.d[i]} al posto di ${t.real[i]}`).join(", ");
      const fin = /^Final/i.test(s.name) || si===alt.length-1 && !Object.keys(s.groups).length;
      items.push(`<div class="match ${t.flipped?"edited":""}">
        <div class="teams"><span class="h">${t.w===0?`<b>${t.d[0]}</b>`:t.d[0]}</span>
          <span class="score"><span class="g">${tot[0]}</span><span class="sep">-</span><span class="g">${tot[1]}</span></span>
          <span class="a">${t.w===1?`<b>${t.d[1]}</b>`:t.d[1]}</span></div>
        ${flipBtn(t)}
        <div class="minfo"><span>${legs}${t.pen ? `, rigori ${t.pen[0]}-${t.pen[1]}` : ""}${inh ? ` · <span class="inh">${inh}</span>` : ""}</span><span>${fin ? "vince" : "passa"} <b>${t.d[t.w]}</b></span></div>
      </div>`);
    }
    if (items.length) rows += `<div class="rnd">${o.label(s, si)}</div>` + items.join("");
  });
  $(o.list).innerHTML = rows || `<p class="empty">Nessuna sfida da mostrare.</p>`;

  const edits = alt.flatMap((s, si) => s.ties.filter(t => t.flipped).map(t => `<div class="edit"><span>${o.label(s, si)} · ${t.real[0]}–${t.real[1]}: ora passa <b>${t.d[t.w]}</b></span><button data-flip="${t.key}">Annulla</button></div>`));
  $(o.edits).innerHTML = edits.join("") || `<p class="empty">Nessuna modifica: stai guardando la storia vera.</p>`;
}
$("cupTeam").addEventListener("change", renderCup);

function renderEu(){
  const comps = COPPE.europa[season];
  if (!comps){
    $("euVerdict").innerHTML = `<div class="msg">Le coppe europee ${season.replace("-","/")} non sono ancora disponibili. Scegli un'altra stagione.</div>`;
    ["compPick","euList","euTable","euEdits"].forEach(id => $(id).innerHTML = ""); lastKO.eu = null; if (currentView === "eu") publish3D(); return;
  }
  if (!comps[euComp]) euComp = comps.cl ? "cl" : Object.keys(comps)[0];
  $("compPick").innerHTML = Object.entries(comps).map(([k,c]) => `<button data-comp="${k}" aria-pressed="${k===euComp}">${c.name}</button>`).join("");
  const c = comps[euComp], prefix = "eu-"+euComp;
  const real = playOut(prefix, c.stages, {}), alt = playOut(prefix, c.stages);
  const winner = st => { const f = st.find(s => /^Final/i.test(s.name) && s.ties.length); return f ? f.ties[0].d[f.ties[0].w] : null };
  const realW = winner(real), altW = winner(alt);

  // Verdetto: vincitrice della coppa scelta, più i trofei italiani di tutta la stagione
  const trophies = fl => Object.entries(comps).map(([k,cc]) => [cc.name, winner(playOut("eu-"+k, cc.stages, fl))]).filter(([,w]) => ITA_CLUBS.has(w));
  const tReal = trophies({}), tAlt = trophies(flips);
  const n = Object.keys(flips).filter(k => k.startsWith(prefix+"|")).length;
  const tTxt = t => t.length ? t.map(([c,w]) => `${w} (${c})`).join(", ") : "nessuno";
  $("euVerdict").innerHTML = `
    <div><div class="lab">${c.name}, realtà</div><div class="big">${realW || "In corso"}</div></div>
    <div class="${altW!==realW?"changed":""}"><div class="lab">Nel tuo universo</div><div class="big">${altW || "In corso"}</div></div>
    <div class="msg">${n ? (altW!==realW ? `Con ${n} ${n===1?"sfida ribaltata":"sfide ribaltate"} il trofeo va a ${altW}.` : `Hai ribaltato ${n} ${n===1?"sfida":"sfide"}, ma il trofeo resta a ${realW}.`) : `Le italiane in ${c.name} nel ${season.replace("-","/")}. Ribalta un turno nella lista per cambiare la storia.`} Trofei italiani della stagione: nella realtà ${tTxt(tReal)}${tTxt(tAlt)!==tTxt(tReal) ? `, nel tuo universo ${tTxt(tAlt)}` : ""}.</div>`;

  renderKO(real, alt, { list:"euList", table:"euTable", edits:"euEdits", select:"euTeam", all:"Tutte le italiane", label:s => stageLabel(s.name), isTeam:t => ITA_CLUBS.has(t) });
  lastKO.eu = { real, alt, name:c.name };
  if (currentView === "eu") publish3D();
}
let euComp = "cl";
$("compPick").addEventListener("click", e => { const b = e.target.closest("[data-comp]"); if (b){ euComp = b.dataset.comp; renderEu() } });
$("euTeam").addEventListener("change", renderEu);

document.addEventListener("click", e => {
  const b = e.target.closest("[data-flip]"); if (!b) return;
  const k = b.dataset.flip;
  if (flips[k]) delete flips[k]; else flips[k] = true;
  renderCups();
});

function showView(v){
  ["a","cup","eu","sc"].forEach(x => $("view-"+x).hidden = x!==v);
  currentView = v;
  publish3D();
  document.querySelectorAll("#tabs button").forEach(b => b.setAttribute("aria-pressed", b.dataset.view===v));
}
$("tabs").addEventListener("click", e => { const b = e.target.closest("[data-view]"); if (b) showView(b.dataset.view) });

// si apre sempre sulla stagione in corso, con la data dell'ultima partita registrata ben in vista
setSeason(CURRENT);
{
  const lastPlayed = SERIE_A[CURRENT].filter(m => m[3] !== null).map(m => m[0]).sort().pop();
  const up = $("updated");
  if (up && lastPlayed) up.textContent = `Serie A aggiornata alle partite del ${fmtDate(lastPlayed)}`;
}
showView({ "#coppa":"cup", "#europa":"eu", "#marcatori":"sc" }[location.hash] || "a");

// ---- Risultati in tempo reale (ESPN, senza chiave) ----
// Durante le partite il punteggio della stagione in corso si aggiorna da solo: classifica, lista e Sliding Doors si ricalcolano.
{
  const NOMI = { "AC Milan":"Milan", "Internazionale":"Inter", "AS Roma":"Roma" };
  const nome = n => NOMI[n] || n;
  const COMPETIZIONI = [{ slug:"ita.coppa_italia", sigla:"Coppa Italia", tutte:true }, { slug:"uefa.champions", sigla:"Champions" },
    { slug:"uefa.europa", sigla:"Europa League" }, { slug:"uefa.europa.conf", sigla:"Conference" }];
  const ITA = new Set(Object.values(SERIE_A).flat().flatMap(m => [m[1], m[2]]));
  const bar = document.createElement("div");
  bar.id = "liveBar"; bar.hidden = true;
  const st = document.createElement("style");
  st.textContent = "#liveBar{margin:8px 0;padding:8px 12px;border-radius:10px;background:rgba(255,255,255,.06);font-size:13px}@keyframes sdPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.8)}}" +
    "#liveBar.on{position:fixed;top:0;left:0;right:0;z-index:9999;margin:0;padding:10px 14px;background:linear-gradient(90deg,#b3121f,#e5283a);color:#fff;border:0;border-bottom:2px solid #fff3;box-shadow:0 4px 18px rgba(0,0,0,.55);font-size:16px;display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;justify-content:center}" +
    "#liveBar .tag{font-weight:800;letter-spacing:.08em;display:inline-flex;align-items:center;gap:7px}" +
    "#liveBar .dot{width:10px;height:10px;border-radius:50%;background:#fff;animation:sdPulse 1.1s infinite}" +
    "@keyframes sdBlink{0%,49%{background:#0b0f1a;color:#fff;box-shadow:0 0 0 2px #fff}50%,100%{background:#ffe100;color:#111;box-shadow:0 0 16px 3px #ffe100}}" +
    "#liveBar .m{background:#0b0f1a;border-radius:14px;padding:5px 14px;font-size:17px;display:inline-flex;flex-direction:column;align-items:center;animation:sdBlink 1.2s steps(1) infinite}" +
    "#liveBar .gol{display:flex;flex-wrap:wrap;gap:2px 10px;justify-content:center;font-size:13px;margin-top:2px}" +
    "#liveBar .g.t{opacity:.85}" +
    "#liveBar .m em{font-style:normal;font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.9;margin-bottom:1px}" +
    "#liveBar .m small{font-size:13px;opacity:.9;margin-left:6px}";
  document.head.appendChild(st);
  const up = $("updated");
  if (up) up.parentNode.insertBefore(bar, up.nextSibling);
  const sposta = on => { bar.classList.toggle("on", on); document.body.style.paddingTop = on ? bar.offsetHeight + "px" : "" };
  let timer = null, passati = null;
  async function live(){
    let next = 300000;
    try {
      const ymd = d => d.getFullYear() + String(d.getMonth()+1).padStart(2,"0") + String(d.getDate()).padStart(2,"0");
      const day = n => fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/ita.1/scoreboard?dates=" + ymd(new Date(Date.now() - n*864e5)), { cache: "no-store" }).then(r => r.json()).then(j => j.events || []);
      // i 7 giorni precedenti si scaricano una volta sola (recuperano i risultati che i dati fissi non hanno ancora); oggi a ogni controllo
      passati ||= Promise.all([1,2,3,4,5,6,7].map(n => day(n).catch(() => []))).then(x => x.flat());
      const ev = [...await passati, ...await day(0)];
      // le altre competizioni dell'app: Coppa Italia (tutte le partite) ed Europa (solo con una squadra italiana)
      const altre = await Promise.all(COMPETIZIONI.map(c => fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/" + c.slug + "/scoreboard", { cache: "no-store" })
        .then(r => r.json()).then(j => (j.events || []).filter(e => c.tutte || e.competitions[0].competitors.some(x => ITA.has(nome(x.team.displayName)))).map(e => (e.__c = c.sigla, e))).catch(() => [])));
      ev.push(...altre.flat());
      const rows = SERIE_A[CURRENT];
      let changed = false, righe = [];
      for (const e of ev){
        const c = e.competitions[0].competitors, st = e.status.type.state;
        const H = c.find(x => x.homeAway === "home"), A = c.find(x => x.homeAway === "away");
        if (!H || !A) continue;
        const h = nome(H.team.displayName), a = nome(A.team.displayName);
        const hs = +H.score, as = +A.score;
        if (st === "in"){ next = 30000; {
          const gol = (e.competitions[0].details || []).filter(d => d.scoringPlay).map(d => {
            const p = (d.athletesInvolved || [])[0], cogn = p ? (p.shortName || p.displayName).replace(/^[A-Z].s*/, "") : "?";
            const sq = d.team && d.team.id === H.team.id ? "c" : "t";
            return `<span class="g ${sq}">⚽ ${cogn} ${d.clock.displayValue}${d.penaltyKick ? " (rig.)" : ""}${d.ownGoal ? " (aut.)" : ""}</span>`;
          }).join("");
          righe.push(`<span class="m">${e.__c ? `<em>${e.__c}</em>` : ""}<span class="top"><b>${h} ${hs}-${as} ${a}</b><small>${e.status.displayClock}</small></span>${gol ? `<span class="gol">${gol}</span>` : ""}</span>`);
        } }
        else if (st === "pre" && next > 60000 && new Date(e.date) - Date.now() < 900000) next = 60000;
        if (st === "pre") continue;
        if (e.__c) continue;
        const m = rows.find(x => x[1] === h && x[2] === a);
        if (m && (m[3] !== hs || m[4] !== as)){ m[3] = hs; m[4] = as; changed = true }
      }
      const prossime = ev.filter(e => e.status.type.state === "pre").map(e => new Date(e.date)).sort((x,y) => x-y);
      const quando = prossime[0] ? " Prossima partita alle " + prossime[0].toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}) + "." : "";
      bar.innerHTML = righe.length ? `<span class="tag"><i class="dot"></i>LIVE</span>${righe.join("")}` : `<span style="color:var(--muted,#8a97ab)">Nessuna partita in corso ora.${quando} Controllo automatico attivo.</span>`;
      bar.hidden = false; sposta(righe.length > 0);
      if (changed){ delete CACHE[CURRENT]; if (season === CURRENT) render() }
    } catch(e){ next = 60000; bar.hidden = false; bar.innerHTML = `<span style="color:#ffb347">Live non raggiungibile (${e && e.message || e}). Riprovo tra poco.</span>` }
    clearTimeout(timer); timer = setTimeout(live, next);
  }
  live();
  document.addEventListener("visibilitychange", () => { if (!document.hidden) live() });
}
