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
  return raw.slice().sort((x,y) => x[0].localeCompare(y[0])).map(([d,h,a,g1,g2,r,t]) => [d.slice(0,7),d,h,a,g1,g2,r||null,t||null]);
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
  $("verdict").innerHTML = `<div class="msg">${msg}</div>`;
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
  // a campionato in corso la classifica non è quella finale: si dice fino a quale giorno arriva
  {
    const rows = SERIE_A[season], giocate = rows.filter(m => m[3] !== null);
    const t = $("tableTitle");
    if (t) t.textContent = giocate.length < rows.length && giocate.length
      ? `Classifica al ${fmtDate(giocate.map(m => m[0]).sort().pop())} · campionato in corso`
      : "Classifica finale";
  }
  $("table").innerHTML = `<thead><tr><th>#</th><th>Squadra</th><th>G</th><th title="Gol fatti">GF</th><th title="Gol subiti">GS</th><th title="Differenza reti">DR</th><th>Pt reali</th><th>Pt</th><th>Δ</th></tr></thead><tbody>` +
    alt.map((r,i) => {
      const dpos = realPos[r.team] - (i+1), dpt = r.pt - realPt[r.team];
      const cls = i<CL ? "cl" : i>=alt.length-REL ? "rel" : "";
      const arrow = dpos>0 ? `<span class="up">▲${dpos}</span>` : dpos<0 ? `<span class="down">▼${-dpos}</span>` : `<span class="same">–</span>`;
      return `<tr class="${cls}"><td>${i+1}</td><td class="t"><button class="team-link" type="button" data-team="${r.team}">${kit(r.team)}${r.team}</button></td><td>${r.g}</td><td>${r.gf}</td><td>${r.gs}</td><td>${r.gf-r.gs>0?"+":""}${r.gf-r.gs}</td>
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
      <span class="meta"><span class="badge">${b}</span> ${m[6] ? m[6]+"ª giornata · " : ""}${fmtDate(m[1])}${m[7] ? ` · ore ${m[7]}` : ""}${s ? ` · tuo pronostico <b>${s[0]}-${s[1]}</b>` : ""}</span></button>`;
  }).join("");
}

// Collegamenti a YouTube: ogni partita giocata porta al SUO video di highlights e alla SUA intervista,
// trovati e controllati uno per uno (video-a.js). Se il video di una partita non c'è ancora, il pulsante non compare.
function ytLinks(h, a, gh, ga, data, stagione = season){
  const v = (window.VIDEO_A || {})[`${stagione}|${h}|${a}`] || [], url = id => "https://www.youtube.com/watch?v=" + id;
  // v = [highlights, intervista della squadra di casa, intervista della squadra ospite]
  return (v[0] ? `<a class="yt" href="${v[0]}" target="_blank" rel="noopener">${/sky.it/.test(v[0]) ? "▶ Highlights Sky" : "▶ Highlights"}</a>` : "") +
    (v[1] ? `<a class="yt int" href="${url(v[1])}" target="_blank" rel="noopener" title="Intervista ${h}">🎙 ${h}</a>` : "") +
    (v[2] ? `<a class="yt int" href="${url(v[2])}" target="_blank" rel="noopener" title="Intervista ${a}">🎙 ${a}</a>` : "");
}
// partite di coppa già giocate dalle squadre di Serie A in questa stagione, con i loro video (video-a.js)
function videoCoppa(p){
  const v = (window.VIDEO_A || {})["C|" + p[2]] || [], url = id => "https://www.youtube.com/watch?v=" + id;
  return v[0] ? `<a class="yt" href="${v[0]}" target="_blank" rel="noopener">${/sky.it/.test(v[0]) ? "▶ Highlights Sky" : "▶ Highlights"}</a>` : "";   // per le coppe solo gli highlights
}
const rigaCoppa = p => `<div class="vid-r"><div><b>${p[4]} ${p[6]}-${p[7]} ${p[5]}</b><small>${p[0]} · ${fmtDate(p[3])}</small></div><div class="ytrow">${videoCoppa(p) || "<small>video non ancora disponibili</small>"}</div></div>`;
function renderVideoCoppe(){
  for (const [id, comps, titolo] of [["cupVideo", ["Coppa Italia", "Supercoppa"], "Coppa Italia e Supercoppa"], ["euVideo", ["Champions League", "Europa League", "Conference League"], "le coppe europee"]]){
    const el = $(id); if (!el) continue;
    const ps = season === CURRENT ? (window.COPPE_GIOCATE || []).filter(p => comps.includes(p[0])).slice().reverse() : [];
    el.hidden = !ps.length;
    el.innerHTML = ps.length ? `<h2>🎬 Highlights</h2><p class="sub">Le partite di ${titolo} giocate quest'anno dalle squadre di Serie A, ognuna con il suo video. Si aggiungono da sole dopo ogni partita.</p><div class="vid-list">${ps.map(rigaCoppa).join("")}</div>` : "";
  }
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
      <div class="minfo"><span>${m[6] ? `${m[6]}ª giornata · ` : ""}${fmtDate(m[1])}${m[4] === null && m[7] ? ` · <b>ore ${m[7]}</b>` : ""}${big[i] ? ` <span class="badge">${big[i]}</span>` : ""}</span><span class="orig">${note} <button type="button" class="prec-btn" data-prec="${m[2]}|${m[3]}">⚔ Precedenti</button></span></div>
      ${m[4] !== null && ytLinks(m[2], m[3], m[4], m[5], m[1]) ? `<div class="ytrow">${ytLinks(m[2], m[3], m[4], m[5], m[1])}</div>` : ""}
    </div>`;
  }).join("") || `<p class="empty">Nessuna partita con questi filtri.</p>`;
  if (flashIdx!==null){ const el = $("list").querySelector(`[data-i="${flashIdx}"]`); el && el.scrollIntoView({block:"nearest"}); flashIdx = null }
}

function renderChart(){
  const real = pointsSeries(withScores(false)), alt = pointsSeries(withScores(true));
  // l'asse delle giornate copre sempre il campionato intero (38 giornate con 20 squadre);
  // l'asse dei punti arriva al tetto: il massimo che le squadre scelte possono ancora fare vincendo tutte le partite che restano
  const W=800,H=900,L=34,R=150,T=18,B=34, giornate = nRounds(), last = giornate-1;
  const end = s => s && s.length ? s[s.length-1] : 0;
  // la scala dei punti sale fino al massimo possibile a fine campionato: 38 giornate × 3 = 114 punti
  const yMax = giornate*3, passo = 2;
  const x = k => L + (k/last)*(W-L-R), y = v => T + (1 - v/yMax)*(H-T-B);
  let s = "";
  // griglia dei punti: una riga per ogni punto, il numero su ogni riga (o ogni 2 se i punti sono tanti)
  for (let v=0; v<=yMax; v++) s += `<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="${v%10?0.4:1.1}" opacity="${v%10?.3:1}"/>` + (v%passo && v!==yMax ? "" : `<text x="${L-6}" y="${y(v)+4}" text-anchor="end" style="font-size:${v%10?10:13}px;${v%10?"opacity:.75":"font-weight:800"}">${v}</text>`);
  // tutte le giornate: una tacca ciascuna, il numero su tutte (in evidenza ogni 5)
  for (let k=0; k<=last; k++){
    const g = k+1, forte = g===1 || g%5===0 || g===giornate;
    s += `<line x1="${x(k)}" x2="${x(k)}" y1="${H-B}" y2="${H-B+(forte?6:3)}" stroke="var(--muted)" stroke-width="1"/>`;
    s += `<text x="${x(k)}" y="${H-B+18}" text-anchor="middle" style="font-size:${forte?11:8.5}px;${forte?"font-weight:700":"opacity:.75"}">${g}</text>`;
  }
  s += `<text x="${(L+W-R)/2}" y="${H-2}" text-anchor="middle" style="font-size:10px;opacity:.7">giornata</text>`;
  // dove siamo arrivati: linea verticale sull'ultima giornata giocata
  const giocate = Math.max(0, ...chartTeams.map(t => (real[t]||[]).length));
  if (giocate && giocate < giornate) s += `<line x1="${x(giocate-1)}" x2="${x(giocate-1)}" y1="${T}" y2="${H-B}" stroke="#ff3b4e" stroke-width="1.5" stroke-dasharray="3 3" opacity=".9"/><text x="${x(giocate-1)+4}" y="${T+10}" style="fill:#ff3b4e;font-size:12px;font-weight:700">${giocate}ª giornata</text>`;
  const path = arr => (arr||[]).map((v,k) => `${k?"L":"M"}${x(k).toFixed(1)},${y(v).toFixed(1)}`).join("");
  chartTeams.forEach(t => {
    const c = teamColor(t), n = (alt[t]||[]).length;
    s += `<path d="${path(real[t])}" fill="none" stroke="${c}" stroke-width="1.5" stroke-dasharray="4 3" opacity=".55"/>`;
    s += `<path d="${path(alt[t])}" fill="none" stroke="${c}" stroke-width="2.6" stroke-linejoin="round"/>`;
  });
  // etichette senza sovrapposizioni: punti di oggi dopo l'ultimo punto della linea, tetto in fondo al grafico
  const spazia = ls => { ls.sort((a,b)=>a.yy-b.yy); for (let i=1;i<ls.length;i++) if (ls[i].yy - ls[i-1].yy < 14) ls[i].yy = ls[i-1].yy + 14; return ls };
  spazia(chartTeams.map(t => { const k = Math.max(0, (alt[t]||[]).length-1); return { t, k, v:end(alt[t]), yy:y(end(alt[t])) } })).forEach(l => {
    s += `<circle cx="${x(l.k)}" cy="${y(l.v)}" r="3.5" fill="${teamColor(l.t)}"/>`;
    s += `<text x="${x(l.k)+8}" y="${l.yy+4}" style="fill:${teamColor(l.t)};font-weight:700">${l.t} ${l.v}</text>`;
  });
  // tetto: i punti che ogni squadra può ancora raggiungere vincendo tutte le partite che restano (riquadro in alto a destra)
  s += `<line x1="${L}" x2="${W-R}" y1="${y(yMax)}" y2="${y(yMax)}" stroke="var(--gold)" stroke-width="1.2" stroke-dasharray="6 4"/><text x="${W-R+8}" y="${y(yMax)+4}" style="fill:var(--gold);font-size:12px;font-weight:700">tetto ${yMax} punti</text>`;
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
  // Serie A: marcatori da ESPN, per tutte le stagioni dell'app; quella in corso si aggiorna anche durante le partite
  const A = (window.MARCATORI_A || {})[season];
  let h = A ? `<section class="panel"><h2>Serie A ${S} · capocannonieri</h2>${covBadge(A.cov)}
    <p class="sub">${A.aggiornato ? `Aggiornata al ${new Date(A.aggiornato).toLocaleString("it-IT", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}${A.live ? ", con i gol delle partite in corso" : ""}.` : "Stagione completa."} Gli autogol non contano.</p>
    <h3>Marcatori</h3>${scorerTable(A.sc.slice(0,20))}
    <h3>Rigori trasformati</h3>${penTable(A.pens, false)}</section>` : "";
  h += `<section class="panel"><h2>Coppa Italia ${S}</h2>${covBadge(cup && cup.cov)}
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
    const MA = window.MARCATORI_A || {}, aYears = Object.keys(MA).sort();
    const aLists = aYears.map(s => Object.assign((MA[s].base || MA[s]).sc.slice(), { season:s }));
    $("scAll").innerHTML = (aYears.length ? `
      <div><h3>Serie A</h3><span class="cov">stagioni ${aYears[0].replace("-","/")} – ${aYears[aYears.length-1].replace("-","/")}</span>
        ${scorerTable(sumScorers(aLists).slice(0,20), { seasons:true })}</div>` : "") + `
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
  ["a","cup","eu","sc","sch","form"].forEach(x => $("view-"+x).hidden = x!==v);
  if (v === "form" && window.SD_formRender) SD_formRender();
  if (v === "cup" || v === "eu") renderVideoCoppe();
  if (v === "sch" && window.SD_schedineRender) SD_schedineRender();
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
showView({ "#coppa":"cup", "#europa":"eu", "#marcatori":"sc", "#schedine":"sch", "#formazione":"form" }[location.hash] || "a");

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

  // ---- Segnale sonoro del gol ----
  // il browser fa suonare una pagina solo dopo un tocco o un clic: al primo tocco si prepara l'audio
  let audio = null, suonoOn = true, sbloccato = false;
  try { suonoOn = localStorage.getItem("sd-suono-gol") !== "0" } catch(e){}
  const preparaAudio = () => {
    try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === "suspended") audio.resume() } catch(e){}
  };
  // il primo tocco o clic in qualsiasi punto sblocca l'audio: il pulsantino passa da "Attiva l'audio" a "Suono gol attivo"
  const tocco = () => {
    preparaAudio();
    if (!sbloccato){ sbloccato = true; const p = bar.querySelector("[data-suono]"); if (p) p.outerHTML = pulsanteSuono() }
  };
  ["pointerdown", "keydown", "touchstart"].forEach(t => addEventListener(t, tocco, { passive: true }));
  function suonoGol(){
    if (!suonoOn) return;
    preparaAudio();
    if (!audio) return;
    const t0 = audio.currentTime + 0.05, out = audio.createGain();
    out.gain.value = 0.55; out.connect(audio.destination);
    // tromba da stadio: tre squilli che salgono
    [[0, 392, .22], [.26, 523, .22], [.52, 659, .7]].forEach(([dt, f, dur]) => {
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = "sawtooth"; o.frequency.value = f;
      g.gain.setValueAtTime(0, t0 + dt); g.gain.linearRampToValueAtTime(.35, t0 + dt + .03);
      g.gain.setValueAtTime(.35, t0 + dt + dur - .06); g.gain.linearRampToValueAtTime(0, t0 + dt + dur);
      o.connect(g); g.connect(out); o.start(t0 + dt); o.stop(t0 + dt + dur + .02);
    });
    // boato del pubblico: rumore filtrato che cresce e si spegne
    const len = 2.6, buf = audio.createBuffer(1, audio.sampleRate * len, audio.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const n = audio.createBufferSource(), f = audio.createBiquadFilter(), g = audio.createGain();
    n.buffer = buf; f.type = "bandpass"; f.frequency.value = 900; f.Q.value = .6;
    g.gain.setValueAtTime(0, t0 + .3); g.gain.linearRampToValueAtTime(.5, t0 + 1); g.gain.linearRampToValueAtTime(0, t0 + .3 + len);
    n.connect(f); f.connect(g); g.connect(out); n.start(t0 + .3); n.stop(t0 + .3 + len);
    try { navigator.vibrate && navigator.vibrate([250, 120, 250, 120, 500]) } catch(e){}
  }
  // voce che dice chi ha segnato: audio registrati in voci/<Squadra>.mp3 ("Gooooool! Gol della Roma!");
  // se per una squadra non c'è, si usa voci/_gol.mp3 ("Gooooool!"); se manca anche quello, il primo secondo
  // dell'audio della Roma, che è proprio "Gooooool!" detto da Elena (il nome della squadra arriva dopo una pausa)
  function voce(squadre){
    if (!suonoOn || !squadre.length) return;
    const [prima, ...altre] = squadre;
    const suona = (src, poi, fine) => {
      const a = new Audio(src); let fatto = false;
      const avanti = () => { if (!fatto){ fatto = true; poi() } };
      a.onended = avanti;
      a.onerror = () => src.endsWith("_gol.mp3") ? suona("voci/Roma.mp3", avanti, 1.15) : src.endsWith("Roma.mp3") && fine ? avanti() : suona("voci/_gol.mp3", avanti);
      if (fine) a.onplaying = () => setTimeout(() => { a.pause(); avanti() }, fine * 1000);
      a.play().catch(avanti);
    };
    suona("voci/" + encodeURIComponent(prima) + ".mp3", () => voce(altre));
  }
  // scritta GOL! grande per qualche secondo, con la partita e il nuovo punteggio
  const flash = document.createElement("div");
  flash.id = "golFlash"; flash.hidden = true;
  st.textContent += "#golFlash{position:fixed;left:50%;top:22%;transform:translateX(-50%);z-index:10000;background:#ffe100;color:#111;border-radius:18px;padding:14px 26px;font:800 34px/1.1 'Big Shoulders Display',sans-serif;letter-spacing:.04em;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.6);animation:sdGol .5s ease-out}" +
    "#golFlash small{display:block;font:600 17px 'IBM Plex Sans',sans-serif;letter-spacing:0;margin-top:4px}@keyframes sdGol{from{transform:translateX(-50%) scale(.4);opacity:0}to{transform:translateX(-50%) scale(1);opacity:1}}" +
    "#liveBar .snd{background:none;border:1px solid currentColor;color:inherit;border-radius:999px;padding:3px 10px;font-size:13px;cursor:pointer;opacity:.85}";
  document.body.appendChild(flash);
  let flashTimer = null;
  function annunciaGol(chi){
    flash.innerHTML = `⚽ GOL!<small>${chi.map(x => x.testo).join("<br>")}</small>`;
    flash.hidden = false; clearTimeout(flashTimer); flashTimer = setTimeout(() => flash.hidden = true, 7000);
    const squadre = chi.flatMap(x => x.squadre || []);
    // gol con annuncio speciale (grancassa, coro della curva e voce già insieme): parte subito, senza la tromba
    const speciale = squadre.length === 1 && SPECIALI[squadre[0]];
    if (speciale){
      if (!suonoOn) return;
      try { navigator.vibrate && navigator.vibrate([250, 120, 250, 120, 500]) } catch(e){}
      new Audio(speciale).play().catch(() => {});
      if (VOCI_SQUADRE) setTimeout(() => voce(squadre), 900);   // la voce sopra grancassa e coro
      return;
    }
    suonoGol();
    // voce che dice la squadra: spenta finché non c'è una voce italiana vera (i file vanno in voci/<Squadra>.mp3)
    if (VOCI_SQUADRE) setTimeout(() => voce(squadre), 1300);
  }
  // annunci speciali: un solo file con musica e voce
  const SPECIALI = { Roma: "voci/Roma-speciale.wav" };
  const VOCI_SQUADRE = true;   // voci/<Squadra>.mp3: "Goooooal! Goal della Roma!"
  window.SD_provaGol = (t = "Roma") => annunciaGol([{ testo: `Prova: gol ${t}`, squadre: [t] }]);
  // pulsantino nella barra: finché il browser non ha avuto un tocco l'audio è bloccato, e lo si dice
  const pulsanteSuono = () => `<button class="snd" type="button" data-suono title="Suono e voce quando una squadra segna">${!suonoOn ? "🔕 Suono gol spento" : sbloccato ? "🔔 Suono gol attivo" : "🔊 Attiva l'audio"}</button>`;
  bar.addEventListener("click", e => {
    if (!e.target.closest("[data-suono]")) return;
    suonoOn = !suonoOn;
    try { localStorage.setItem("sd-suono-gol", suonoOn ? "1" : "0") } catch(err){}
    e.target.closest("[data-suono]").outerHTML = pulsanteSuono();
    if (suonoOn) suonoGol();
  });
  const golVisti = new Map(); // id partita -> gol totali già visti
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
      let changed = false, righe = [], nuoviGol = [];
      for (const e of ev){
        const c = e.competitions[0].competitors, st = e.status.type.state;
        const H = c.find(x => x.homeAway === "home"), A = c.find(x => x.homeAway === "away");
        if (!H || !A) continue;
        const h = nome(H.team.displayName), a = nome(A.team.displayName);
        const hs = +H.score, as = +A.score;
        // gol nuovo: il totale di una partita in corso è salito dall'ultimo controllo (al primo controllo si prende nota e basta)
        if (st === "in" || st === "post"){
          const prima = golVisti.get(e.id);
          if (st === "in" && prima && hs + as > prima[0] + prima[1]){
            // chi ha segnato: la squadra il cui punteggio è salito (se entrambe, tutte e due)
            const chi = [hs > prima[0] && h, as > prima[1] && a].filter(Boolean);
            nuoviGol.push({ testo: `${e.__c ? e.__c + " · " : ""}${h} ${hs}-${as} ${a}`,
              squadre: chi });
          }
          golVisti.set(e.id, [hs, as]);
        }
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
        if (m && (m[3] !== hs || m[4] !== as)){ m[3] = hs; m[4] = as; m[0] = new Date(e.date).toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" }); changed = true }
      }
      const prossime = ev.filter(e => e.status.type.state === "pre").map(e => new Date(e.date)).sort((x,y) => x-y);
      const quando = prossime[0] ? " Prossima partita alle " + prossime[0].toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}) + "." : "";
      bar.innerHTML = righe.length ? `<span class="tag"><i class="dot"></i>LIVE</span>${righe.join("")}${pulsanteSuono()}` : `<span style="color:var(--muted,#8a97ab)">Nessuna partita in corso ora.${quando} Controllo automatico attivo.</span> ${pulsanteSuono()}`;
      if (nuoviGol.length) annunciaGol(nuoviGol);
      bar.hidden = false; sposta(righe.length > 0);
      // marcatori di Serie A: si aggiungono i gol delle partite (finite o in corso) che il file dei marcatori non ha ancora
      const MA = (window.MARCATORI_A || {})[CURRENT];
      if (MA){
        MA.base ||= { sc: MA.sc.map(r => r.slice()), pens: JSON.parse(JSON.stringify(MA.pens)), cov: MA.cov.slice(), aggiornato: MA.aggiornato };
        const sc = MA.base.sc.map(r => r.slice()), pens = JSON.parse(JSON.stringify(MA.base.pens)), cov = MA.base.cov.slice(), noti = new Set(MA.ids);
        let nuovi = 0, inCorso = false;
        for (const e of ev){
          if (e.__c || noti.has(e.id) || e.status.type.state === "pre") continue;
          const c = e.competitions[0].competitors, H = c.find(x => x.homeAway === "home"), A2 = c.find(x => x.homeAway === "away");
          if (!H || !A2) continue;
          nuovi++; if (e.status.type.state === "in") inCorso = true;
          if (e.status.type.state === "post"){ cov[0]++; cov[1]++ }
          for (const d of (e.competitions[0].details || []).filter(d => d.scoringPlay)){
            const sq = d.team && d.team.id === H.team.id ? H : A2, team = nome(sq.team.displayName), contro = nome((sq === H ? A2 : H).team.displayName);
            if (d.penaltyKick){ (pens[team] ||= [0,0])[0]++; (pens[contro] ||= [0,0])[1]++ }
            const p = (d.athletesInvolved || [])[0];
            if (!p || d.ownGoal) continue;
            let r = sc.find(x => x[0] === p.displayName && x[1] === team);
            if (!r) sc.push(r = [p.displayName, team, 0, 0]);
            r[2]++; if (d.penaltyKick) r[3]++;
          }
        }
        sc.sort((a,b) => b[2]-a[2] || a[3]-b[3] || a[0].localeCompare(b[0]));
        const firma = JSON.stringify([sc.slice(0,20), pens, cov]);
        if (firma !== MA.firma){
          Object.assign(MA, { sc, pens, cov, live: inCorso, aggiornato: nuovi ? new Date().toISOString() : MA.base.aggiornato, firma });
          if (season === CURRENT) renderScorers();
        }
      }
      if (changed){
        delete CACHE[CURRENT]; if (season === CURRENT) render();
        if (currentView === "sch" && window.SD_schedineRender) SD_schedineRender();
        // la scritta "aggiornata alle partite del..." segue anche i risultati arrivati in diretta
        const ultima = rows.filter(m => m[3] !== null).map(m => m[0]).sort().pop();
        if (up && ultima) up.textContent = `Serie A aggiornata alle partite del ${fmtDate(ultima)}`;
      }
    } catch(e){ next = 60000; bar.hidden = false; bar.innerHTML = `<span style="color:#ffb347">Live non raggiungibile (${e && e.message || e}). Riprovo tra poco.</span>` }
    clearTimeout(timer); timer = setTimeout(live, next);
  }
  live();
  document.addEventListener("visibilitychange", () => { if (!document.hidden) live() });
}

// ---------------- Finestra a comparsa (scheda squadra, immagine da condividere) ----------------
const pop = (() => {
  const st = document.createElement("style");
  st.textContent = "#sdPop{position:fixed;inset:0;z-index:10050;background:rgba(2,6,14,.78);backdrop-filter:blur(4px);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:24px 12px}" +
    "#sdPop[hidden]{display:none}#sdPop .box{position:relative;width:min(560px,100%);background:var(--paper-solid);border:1px solid var(--line-hi);border-radius:18px;padding:20px 20px 22px;box-shadow:var(--glow)}" +
    "#sdPop .x{position:absolute;top:10px;right:10px;width:36px;height:36px;border-radius:50%;border:1px solid var(--line);background:transparent;font-size:18px}" +
    "#sdPop h2{font-family:var(--f-display);font-size:30px;letter-spacing:.02em;margin:0 40px 2px 0;display:flex;align-items:center;gap:10px;text-transform:uppercase}" +
    "#sdPop h3{font-family:var(--f-display);font-size:17px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:18px 0 8px}" +
    "#sdPop .sub{color:var(--muted);margin:0}#sdPop .big{font-size:18px;margin:10px 0 0}" +
    "#sdPop .form{display:flex;gap:6px;flex-wrap:wrap}#sdPop .f{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;font-weight:700;color:#071018}" +
    "#sdPop .f.V{background:var(--good)}#sdPop .f.N{background:#c9d3e6}#sdPop .f.P{background:var(--bad);color:#fff}" +
    "#sdPop .rows{display:grid;gap:6px}#sdPop .r{display:flex;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.04)}" +
    "#sdPop .r small{color:var(--muted)}#sdPop img.story{display:block;width:100%;max-width:340px;margin:12px auto;border-radius:14px;border:1px solid var(--line)}" +
    "#sdPop .acts{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:8px}" +
    "#sdPop .acts button{border:0;border-radius:999px;padding:10px 18px;font-weight:700;background:var(--accent);color:#fff}" +
    ".team-link{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:inherit}.team-link:hover{text-decoration:underline}.team-link:focus-visible{outline:2px solid var(--accent);outline-offset:2px}";
  document.head.appendChild(st);
  const el = document.createElement("div");
  el.id = "sdPop"; el.hidden = true; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
  document.body.appendChild(el);
  const close = () => { el.hidden = true; el.innerHTML = "" };
  el.addEventListener("click", e => { if (e.target === el || e.target.closest(".x")) close() });
  addEventListener("keydown", e => { if (e.key === "Escape" && !el.hidden) close() });
  return { open(html){ el.innerHTML = `<div class="box"><button class="x" type="button" aria-label="Chiudi">✕</button>${html}</div>`; el.hidden = false; el.scrollTop = 0; return el }, close };
})();

// ---------------- Scheda della squadra ----------------
function schedaSquadra(t){
  const ms = matches(), S = season.replace("-", "/");
  const real = table(withScores(false)), pos = real.findIndex(r => r.team === t), r = real[pos];
  const giocate = ms.filter(m => (m[2] === t || m[3] === t) && m[4] !== null).sort((a, b) => b[1].localeCompare(a[1]));
  const esito = m => { const casa = m[2] === t, f = casa ? m[4] : m[5], s = casa ? m[5] : m[4]; return f > s ? "V" : f < s ? "P" : "N" };
  const ultime = giocate.slice(0, 5);
  const prossime = ms.filter(m => (m[2] === t || m[3] === t) && m[4] === null).sort((a, b) => a[1].localeCompare(b[1])).slice(0, 5);
  const A = (window.MARCATORI_A || {})[season], marc = A ? (A.sc || []).filter(x => x[1] === t).slice(0, 5) : [];
  const riga = m => `<div class="r"><span>${m[2] === t ? `<b>${m[2]}</b> – ${m[3]}` : `${m[2]} – <b>${m[3]}</b>`}</span><span class="num">${m[4] === null ? (m[7] ? `ore ${m[7]}` : "") : `${m[4]}-${m[5]}`} <small>${fmtDate(m[1])}</small></span>${m[4] !== null && ytLinks(m[2], m[3], m[4], m[5], m[1]) ? `<span class="ytrow">${ytLinks(m[2], m[3], m[4], m[5], m[1])}</span>` : ""}</div>`;
  pop.open(`<h2>${kit(t)}${t}</h2><p class="sub">Stagione ${S}</p>
    ${r ? `<p class="big"><b>${pos + 1}º posto</b> · ${r.pt} punti · ${r.w} vinte, ${r.d} pari, ${r.l} perse · gol ${r.gf}-${r.gs}</p>` : ""}
    ${ultime.length ? `<h3>Ultime ${ultime.length} partite</h3><div class="form">${ultime.slice().reverse().map(m => `<span class="f ${esito(m)}" title="${m[2]} ${m[4]}-${m[5]} ${m[3]}">${esito(m)}</span>`).join("")}</div>
      <div class="rows" style="margin-top:8px">${ultime.map(riga).join("")}</div>` : ""}
    ${prossime.length ? `<h3>Prossime partite</h3><div class="rows">${prossime.map(m => riga(m).replace(/<\/div>$/, ` <button type="button" class="prec-btn" data-prec="${m[2]}|${m[3]}">⚔ Precedenti</button></div>`)).join("")}</div>` : ""}
    ${(() => { const cp = season === CURRENT ? (window.COPPE_GIOCATE || []).filter(p => p[4] === t || p[5] === t).slice(-5).reverse() : []; return cp.length ? `<h3>Coppe</h3><div class="vid-list">${cp.map(rigaCoppa).join("")}</div>` : "" })()}
    ${marc.length ? `<h3>Marcatori</h3><div class="rows">${marc.map(x => `<div class="r"><span>${x[0]}</span><span class="num"><b>${x[2]}</b> gol${x[3] ? ` <small>(${x[3]} rig.)</small>` : ""}</span></div>`).join("")}</div>` : ""}`);
}
$("table").addEventListener("click", e => { const b = e.target.closest("[data-team]"); if (b) schedaSquadra(b.dataset.team) });

// ---------------- Precedenti tra due squadre (tutte le partite di Serie A dal 2000-01, risultati reali) ----------------
(function () {
  const st = document.createElement("style");
  st.textContent = ".prec-btn{border:1px solid var(--line-hi);background:rgba(255,255,255,.05);border-radius:999px;padding:3px 10px;font-size:12px;font-weight:600;color:var(--ink);white-space:nowrap}" +
    ".prec-btn:hover{border-color:var(--gold)}" +
    "#sdPop .h2h{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center;margin-top:12px}" +
    "#sdPop .h2h div{border-radius:12px;padding:10px 4px;background:rgba(255,255,255,.05)}#sdPop .h2h b{display:block;font-family:var(--f-display);font-size:34px;line-height:1.1}" +
    "#sdPop .h2h .c b{color:#4d9bff}#sdPop .h2h .o b{color:#ff8c4a}#sdPop .h2h small{color:var(--muted);font-size:12px}" +
    "#sdPop .h2bar{display:flex;height:10px;border-radius:6px;overflow:hidden;margin-top:10px}#sdPop .h2bar span:nth-child(1){background:#4d9bff}#sdPop .h2bar span:nth-child(2){background:#6b7385}#sdPop .h2bar span:nth-child(3){background:#ff8c4a}" +
    "#sdPop .r.vc{border-left:3px solid #4d9bff}#sdPop .r.vo{border-left:3px solid #ff8c4a}#sdPop .r.pa{border-left:3px solid #6b7385}";
  document.head.appendChild(st);
})();
function precedenti(h, a){
  const tutte = [];
  for (const s of Object.keys(SERIE_A).sort()) for (const m of SERIE_A[s])
    if (m[3] !== null && m[3] !== undefined && ((m[1] === h && m[2] === a) || (m[1] === a && m[2] === h))) tutte.push({ s, d: m[0], c: m[1], o: m[2], gc: m[3], go: m[4] });
  tutte.sort((x, y) => y.d.localeCompare(x.d));
  const stag = s => s.replace("-", "/");
  if (!tutte.length){ pop.open(`<h2>Precedenti</h2><p class="big">${kit(h)}${h} – ${kit(a)}${a}</p><p class="sub" style="margin-top:12px">Dal 2000 a oggi non si sono mai incontrate in Serie A.</p>`); return }
  // dal punto di vista di h
  const gH = p => p.c === h ? p.gc : p.go, gA = p => p.c === h ? p.go : p.gc;
  const vh = tutte.filter(p => gH(p) > gA(p)), va = tutte.filter(p => gH(p) < gA(p)), px = tutte.filter(p => gH(p) === gA(p));
  const golH = tutte.reduce((t, p) => t + gH(p), 0), golA = tutte.reduce((t, p) => t + gA(p), 0);
  const inCasa = tutte.filter(p => p.c === h), icV = inCasa.filter(p => p.gc > p.go).length, icN = inCasa.filter(p => p.gc === p.go).length, icP = inCasa.length - icV - icN;
  const larga = arr => arr.slice().sort((x, y) => Math.abs(y.gc - y.go) - Math.abs(x.gc - x.go) || (y.gc + y.go) - (x.gc + x.go))[0];
  const ris = p => `${p.c} <b class="num">${p.gc}-${p.go}</b> ${p.o}`;
  const riga = p => `<div class="r ${gH(p) > gA(p) ? "vc" : gH(p) < gA(p) ? "vo" : "pa"}"><span>${ris(p)}</span><span class="num"><small>${fmtDate(p.d)} · ${stag(p.s)}</small></span></div>`;
  const n = tutte.length, pc = x => x / n * 100;
  const fH = vh[0], fA = va[0], lH = vh.length && larga(vh), lA = va.length && larga(va);
  const serie = (() => { let k = 0; const e0 = Math.sign(gH(tutte[0]) - gA(tutte[0])); for (const p of tutte){ if (Math.sign(gH(p) - gA(p)) !== e0) break; k++ } return k >= 3 ? (e0 > 0 ? `${h} ha vinto le ultime ${k}` : e0 < 0 ? `${a} ha vinto le ultime ${k}` : `le ultime ${k} sono finite in pareggio`) : "" })();
  pop.open(`<h2>Precedenti</h2><p class="big">${kit(h)}<b>${h}</b> – ${kit(a)}<b>${a}</b></p>
    <p class="sub">${n} partite in Serie A dal 2000 a oggi · gol ${golH}-${golA}</p>
    <div class="h2h"><div class="c"><b>${vh.length}</b><small>vittorie ${h}</small></div><div><b>${px.length}</b><small>pareggi</small></div><div class="o"><b>${va.length}</b><small>vittorie ${a}</small></div></div>
    <div class="h2bar"><span style="flex:${pc(vh.length)}"></span><span style="flex:${pc(px.length)}"></span><span style="flex:${pc(va.length)}"></span></div>
    ${serie ? `<p class="big" style="font-size:15px">🔥 ${serie}</p>` : ""}
    ${inCasa.length ? `<h3>Quando gioca in casa ${h}</h3><p class="sub" style="color:var(--ink)">${inCasa.length} partite: <b>${icV}</b> vittorie ${h}, <b>${icN}</b> pareggi, <b>${icP}</b> vittorie ${a}</p>` : ""}
    <h3>Ultime ${Math.min(5, n)} sfide</h3><div class="rows">${tutte.slice(0, 5).map(riga).join("")}</div>
    <h3>Da ricordare</h3><div class="rows">
      ${lH ? `<div class="r vc"><span>Vittoria più larga ${h}: ${ris(lH)}</span><span class="num"><small>${stag(lH.s)}</small></span></div>` : ""}
      ${lA ? `<div class="r vo"><span>Vittoria più larga ${a}: ${ris(lA)}</span><span class="num"><small>${stag(lA.s)}</small></span></div>` : ""}
      ${fH ? `<div class="r"><span>Ultima vittoria ${h}</span><span class="num"><small>${fmtDate(fH.d)}</small></span></div>` : `<div class="r"><span>${h} non l'ha mai battuta</span></div>`}
      ${fA ? `<div class="r"><span>Ultima vittoria ${a}</span><span class="num"><small>${fmtDate(fA.d)}</small></span></div>` : `<div class="r"><span>${a} non l'ha mai battuta</span></div>`}
    </div>`);
}
document.addEventListener("click", e => { const b = e.target.closest("[data-prec]"); if (!b) return; e.stopPropagation(); const [h, a] = b.dataset.prec.split("|"); precedenti(h, a) }, true);

// ---------------- Le mie schedine e quelle degli amici ----------------
// Ognuno prepara la schedina di una giornata intera (1, X, 2, anche doppie e triple) e la firma con il suo nome.
// "Manda agli amici" crea un link che contiene la schedina: chi lo apre se la ritrova nella cartella "Schedine degli amici".
// Tutto resta nel browser di chi usa l'app (nessun account, nessun server); a partite giocate l'app controlla e fa la classifica.
{
  const KEY = "sd-schedine", KEY_FIRMA = "sd-firma";
  const AVATAR = ["⚽", "🦁", "🔥", "👑", "🐺", "🦅", "🐉", "🍀", "😎", "🤖", "👻", "🎯", "🍕", "🚀", "🐐", "🧢"];
  const leggi = () => { try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch(e){ return [] } };
  const scrivi = l => { try { localStorage.setItem(KEY, JSON.stringify(l)); return true } catch(e){ return false } };
  const firma = () => { try { return JSON.parse(localStorage.getItem(KEY_FIRMA)) || { nome: "", avatar: "⚽" } } catch(e){ return { nome: "", avatar: "⚽" } } };
  const salvaFirma = f => { try { localStorage.setItem(KEY_FIRMA, JSON.stringify(f)) } catch(e){} };
  const esc = t => String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const st = document.createElement("style");
  st.textContent = ".sch-row{display:grid;grid-template-columns:1fr auto;gap:8px 12px;align-items:center;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid var(--line)}" +
    ".sch-row .who{font-weight:600}.sch-row .when{color:var(--muted);font-size:13px}.sch-row .pick{display:flex;gap:6px}" +
    ".sch-row .pick button{width:40px;height:36px;border-radius:9px;border:1px solid var(--line-hi);background:transparent;font-weight:700}" +
    ".sch-row .pick button[aria-pressed=true]{background:var(--accent);border-color:var(--accent);color:#fff}" +
    ".sch-save{margin-top:14px;width:100%;border:0;border-radius:999px;padding:12px 18px;font-weight:700;background:var(--accent);color:#fff}.sch-save:disabled{opacity:.45;cursor:default}" +
    ".sch-firma{display:grid;gap:8px;margin-bottom:14px;padding:12px;border-radius:14px;border:1px solid var(--line-hi);background:rgba(255,255,255,.03)}" +
    ".sch-firma label{color:var(--muted);font-size:13px}.sch-firma input{width:100%;padding:9px 12px;border-radius:10px;border:1px solid var(--line-hi);background:var(--bg2);color:var(--ink);font:inherit}" +
    ".sch-firma input.no{border-color:var(--bad)}.sch-av{display:flex;flex-wrap:wrap;gap:6px}" +
    ".sch-av button{width:38px;height:38px;border-radius:10px;border:1px solid var(--line);background:transparent;font-size:20px}.sch-av button[aria-pressed=true]{border-color:var(--gold);background:rgba(255,207,74,.18)}" +
    ".sch-card{border:1px solid var(--line-hi);border-radius:16px;padding:14px;margin-bottom:14px;background:rgba(255,255,255,.03)}" +
    ".sch-card header{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px}" +
    ".sch-card h3{margin:0;font-family:var(--f-display);font-size:22px;letter-spacing:.03em;text-transform:uppercase}" +
    ".sch-card .punti{font-family:var(--f-display);font-size:26px;color:var(--gold);white-space:nowrap}.sch-card .meta{color:var(--muted);font-size:13px}" +
    ".sch-card .r{display:grid;grid-template-columns:auto 1fr auto auto;gap:10px;align-items:center;padding:7px 4px;border-top:1px solid var(--line);font-size:14px}" +
    ".sch-card .r .mio{font-weight:700;min-width:46px;text-align:center;border-radius:8px;padding:2px 6px;background:rgba(255,255,255,.07)}" +
    ".sch-card .r .vero{font-family:var(--f-mono);color:var(--muted)}" +
    ".sch-btn{border:1px solid var(--line-hi);background:transparent;border-radius:999px;padding:5px 12px;font-size:13px;color:var(--muted)}" +
    ".sch-btn.send{border:0;background:#25d366;color:#05210f;font-weight:700}.sch-acts{display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap;margin-top:6px}" +
    ".sch-rank{display:grid;gap:6px;margin:6px 0 10px}.sch-rank .p{display:grid;grid-template-columns:28px 1fr auto;align-items:center;gap:8px;padding:8px 10px;border-radius:12px;background:rgba(255,255,255,.05)}" +
    ".sch-rank .p.me{outline:1px solid var(--gold)}.sch-rank .av{font-size:22px}.sch-rank .pt{font-family:var(--f-display);font-size:22px;color:var(--gold)}" +
    ".sch-card details{border-top:1px solid var(--line);padding-top:6px;margin-top:6px}.sch-card summary{cursor:pointer;padding:6px 2px;font-weight:600}" +
    ".sch-share{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}.sch-share button{border:1px solid var(--line-hi);background:rgba(255,255,255,.05);border-radius:14px;padding:14px 10px;font-weight:700;font-size:17px;display:grid;gap:2px}" +
    ".sch-share button small{font-weight:400;font-size:12px;color:var(--muted)}.sch-share .wa{background:#25d366;color:#05210f;border:0}.sch-share .wa small{color:#0b3d20}" +
    ".sch-share .ig{background:linear-gradient(45deg,#f58529,#dd2a7b,#8134af);color:#fff;border:0}.sch-share .ig small{color:#ffe}" +
    "#schToast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:10060;background:#22e08b;color:#04150c;font-weight:700;padding:12px 18px;border-radius:999px;box-shadow:0 10px 30px rgba(0,0,0,.5)}#schToast[hidden]{display:none}";
  document.head.appendChild(st);
  const toast = document.createElement("div"); toast.id = "schToast"; toast.hidden = true; document.body.appendChild(toast);
  let toastT = null;
  const avvisa = t => { toast.textContent = t; toast.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => toast.hidden = true, 4000) };

  const righe = () => SERIE_A[CURRENT] || [];
  const segno = (a, b) => a > b ? "1" : a < b ? "2" : "X";
  const MAX_TRIPLE = 1, MAX_DOPPIE = 2;   // regola della schedina
  let bozza = {};   // pronostici della schedina che si sta preparando: "Casa|Ospite" -> {s}

  // la schedina è sempre una giornata intera: si possono scegliere solo le giornate con tutte le partite ancora da giocare
  function giornateAperte(){
    const tutte = [...new Set(righe().filter(m => m[5]).map(m => m[5]))];
    return tutte.filter(r => righe().filter(m => m[5] === r).every(m => m[3] === null)).sort((a, b) => a - b);
  }
  const partiteGiornata = (r, stag = CURRENT) => (SERIE_A[stag] || []).filter(m => m[5] === r);
  // ordine fisso delle partite di una giornata, uguale su tutti i telefoni: serve per scrivere la schedina nel link
  const ordine = (r, stag) => partiteGiornata(r, stag).map(m => m[1] + "|" + m[2]).sort();

  // ---- firma: il nome ----
  function disegnaFirma(){
    const f = firma();
    $("schFirma").innerHTML = `<label for="schNome">La tua firma: il nome che vedranno i tuoi amici</label>
      <input id="schNome" maxlength="20" placeholder="Il tuo nome (es. Giovanni)" value="${esc(f.nome)}" autocomplete="nickname">`;
  }
  $("schFirma").addEventListener("input", e => { if (e.target.id === "schNome"){ salvaFirma({ ...firma(), nome: e.target.value.trim() }); e.target.classList.remove("no") } });

  // ---- nuova schedina ----
  function disegnaNuova(){
    const sel = $("schRound"), aperte = giornateAperte();
    if (!aperte.length){ sel.innerHTML = ""; $("schNew").innerHTML = `<p class="empty">Non ci sono partite da giocare in questa stagione.</p>`; $("schSave").disabled = true; return }
    const scelta = aperte.includes(+sel.value) ? +sel.value : aperte[0];
    sel.innerHTML = aperte.map(r => `<option value="${r}" ${r === scelta ? "selected" : ""}>${r}ª giornata</option>`).join("");
    const ms = partiteGiornata(scelta).sort((a, b) => (a[0] + (a[6] || "")).localeCompare(b[0] + (b[6] || "")));
    $("schNew").innerHTML = ms.map(m => {
      const k = m[1] + "|" + m[2], p = bozza[k] || {};
      return `<div class="sch-row" data-k="${k}"><div><div class="who">${kit(m[1])}${m[1]} – ${kit(m[2])}${m[2]}</div><div class="when">${fmtDate(m[0])}${m[6] ? ` · ore ${m[6]}` : ""} <button type="button" class="prec-btn" data-prec="${m[1]}|${m[2]}">⚔ Precedenti</button></div></div>
        <div class="pick" role="group" aria-label="Pronostico">${["1", "X", "2"].map(s => `<button type="button" data-s="${s}" aria-pressed="${!!(p.s && p.s.includes(s))}">${s}</button>`).join("")}</div></div>`;
    }).join("");
    aggiornaSalva();
  }
  const colonneTesto = (vs, sep) => { const d = vs.filter(s => s.length === 2).length, t = vs.filter(s => s.length === 3).length;
    return d || t ? `${sep}${[d && `${d} doppi${d === 1 ? "a" : "e"}`, t && `${t} tripl${t === 1 ? "a" : "e"}`].filter(Boolean).join(", ")} · ${2 ** d * 3 ** t} colonne` : "" };
  // regola della schedina: al massimo 1 tripla e 2 doppie, tutte le altre partite con un segno solo
  const troppe = ps => ps.filter(x => x.length === 3).length > MAX_TRIPLE || ps.filter(x => x.length === 2).length > MAX_DOPPIE;
  function aggiornaSalva(){
    const tot = partiteGiornata(+$("schRound").value).length, ps = Object.values(bozza).filter(p => p.s).map(p => p.s), manca = tot - ps.length;
    $("schSave").disabled = manca > 0;
    $("schSave").classList.toggle("troppe", troppe(ps));
    const extra = colonneTesto(ps, " · ");
    $("schSave").textContent = manca > 0 ? `${manca === 1 ? "Manca 1 pronostico" : `Mancano ${manca} pronostici`} su ${tot}${extra}` : `💾 Salva schedina (${tot} partite${extra})`;
  }
  $("schRound").addEventListener("change", () => { bozza = {}; disegnaNuova() });
  $("schNew").addEventListener("click", e => {
    const b = e.target.closest("[data-s]"); if (!b) return;
    const p = bozza[b.closest("[data-k]").dataset.k] ||= {};
    // ogni casella si accende e si spegne da sola: una = fisso, due = doppia, tre = tripla
    const segnate = new Set(p.s || ""); segnate.has(b.dataset.s) ? segnate.delete(b.dataset.s) : segnate.add(b.dataset.s);
    const nuovo = ["1", "X", "2"].filter(x => segnate.has(x)).join("") || null;
    p.s = nuovo;   // nessun blocco mentre si scelgono le caselle: la regola si controlla al salvataggio
    b.parentNode.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", !!(p.s && p.s.includes(x.dataset.s))));
    aggiornaSalva();
  });
  $("schSave").addEventListener("click", () => {
    const f = firma();
    if (!f.nome){ const n = $("schNome"); n.classList.add("no"); n.focus(); n.scrollIntoView({ block: "center" }); avvisa("Scrivi prima il tuo nome per firmare la schedina"); return }
    const r = +$("schRound").value, pron = Object.fromEntries(Object.entries(bozza).filter(([, p]) => p.s).map(([k, p]) => [k, { s: p.s }]));
    if (Object.keys(pron).length < partiteGiornata(r).length) return;
    if (troppe(Object.values(pron).map(p => p.s))){ avvisa(`Puoi giocare al massimo ${MAX_TRIPLE} tripla e ${MAX_DOPPIE} doppie: le altre partite con un segno solo`); return }
    const l = leggi();
    l.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), mia: true, nome: f.nome, avatar: f.avatar, creata: new Date().toISOString(), stagione: CURRENT, giornata: r, pron });
    if (!scrivi(l)){ alert("Non riesco a salvare: questo browser non permette di salvare dati (forse sei in navigazione in incognito)."); return }
    bozza = {}; disegnaNuova(); disegnaElenchi();
    avvisa("Schedina salvata. Ora mandala agli amici!");
    $("schList").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // ---- link per gli amici: tutta la schedina in un indirizzo ----
  const b64 = t => btoa(unescape(encodeURIComponent(t))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const deb64 = t => decodeURIComponent(escape(atob(t.replace(/-/g, "+").replace(/_/g, "/"))));
  const BASE = "https://c1962-2012.github.io/sliding-doors/";   // il link porta sempre all'app vera
  function linkSchedina(sc){
    const segni = ordine(sc.giornata, sc.stagione).map(k => (sc.pron[k] || {}).s || "-").join(",");
    return BASE + "#s=" + b64(["1", sc.stagione, sc.giornata, sc.nome, sc.avatar, sc.creata.slice(0, 16), sc.id, segni].join("~"));
  }
  function importa(cod){
    try {
      const [v, stagione, g, nome, avatar, creata, id, segni] = deb64(cod).split("~"), giornata = +g;
      if (v !== "1" || !SERIE_A[stagione]) return "Link della schedina non valido";
      const chiavi = ordine(giornata, stagione), lista = segni.split(",");
      if (chiavi.length !== lista.length || !lista.every(x => /^(1|X|2|1X|X2|12|1X2)$/.test(x))) return "Link della schedina non valido";
      const l = leggi();
      const gia = l.find(s => s.id === id);
      if (gia) return gia.mia !== false ? "Questa è una tua schedina" : `La schedina di ${nome} c'è già`;
      l.push({ id, mia: false, nome: nome.slice(0, 20), avatar: [...avatar][0] || "⚽", creata: creata + ":00Z", stagione, giornata, pron: Object.fromEntries(chiavi.map((k, i) => [k, { s: lista[i] }])) });
      scrivi(l);
      return `✅ Aggiunta la schedina di ${nome.slice(0, 20)} (${giornata}ª giornata)`;
    } catch(e){ return "Link della schedina non valido" }
  }
  const copia = async t => { try { await navigator.clipboard.writeText(t); return true } catch(e){
    const x = document.createElement("textarea"); x.value = t; x.style.position = "fixed"; x.style.opacity = "0"; document.body.appendChild(x); x.select();
    let ok = false; try { ok = document.execCommand("copy") } catch(err){} x.remove(); return ok } };
  // ---- la schedina disegnata come immagine (come quella del Totocalcio), da mandare agli amici ----
  async function immagineSchedina(sc){
    const ms = partiteGiornata(sc.giornata, sc.stagione).slice().sort((a, b) => (a[0] + (a[6] || "")).localeCompare(b[0] + (b[6] || "")));
    const W = 1080, top = 330, riga = 112, H = top + ms.length * riga + 260;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d"), D = '"Big Shoulders Display", Impact, sans-serif', B = '"IBM Plex Sans", "Segoe UI", sans-serif';
    try { await Promise.all([document.fonts.load('800 80px "Big Shoulders Display"'), document.fonts.load('600 40px "IBM Plex Sans"')]) } catch(e){}
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#0b1424"); bg.addColorStop(1, "#050a14"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const luce = g.createRadialGradient(W * .9, 0, 10, W * .9, 0, 600); luce.addColorStop(0, "rgba(255,77,109,.35)"); luce.addColorStop(1, "rgba(255,77,109,0)"); g.fillStyle = luce; g.fillRect(0, 0, W, H);
    // intestazione
    g.textBaseline = "top"; g.font = `800 84px ${D}`; g.fillStyle = "#eef3ff"; g.fillText("SCHEDINA", 60, 50);
    g.fillStyle = "#ff4d6d"; g.fillText(`${sc.giornata}ª GIORNATA`, 60 + g.measureText("SCHEDINA ").width, 50);
    g.font = `600 40px ${B}`; g.fillStyle = "#ffcf4a"; g.fillText(sc.nome || "", 62, 158);
    g.font = `500 30px ${B}`; g.fillStyle = "#93a4c3";
    const vs = Object.values(sc.pron).map(p => p.s), d = vs.filter(x => x.length === 2).length, t = vs.filter(x => x.length === 3).length;
    g.fillText(`Serie A ${sc.stagione.replace("-", "/")}${d || t ? ` · ${[d && `${d} doppi${d === 1 ? "a" : "e"}`, t && `${t} tripl${t === 1 ? "a" : "e"}`].filter(Boolean).join(", ")} · ${2 ** d * 3 ** t} colonne` : ""}`, 62, 214);
    // intestazione colonne 1 X 2
    const X0 = 760, step = 92;
    g.font = `800 40px ${D}`; g.fillStyle = "#93a4c3"; g.textAlign = "center";
    ["1", "X", "2"].forEach((x, i) => g.fillText(x, X0 + i * step + 36, top - 58));
    g.textAlign = "left";
    ms.forEach((m, i) => {
      const y = top + i * riga, p = sc.pron[m[1] + "|" + m[2]] || {};
      g.fillStyle = i % 2 ? "rgba(255,255,255,.03)" : "rgba(255,255,255,.06)"; g.beginPath(); g.roundRect(40, y, W - 80, riga - 12, 18); g.fill();
      g.font = `800 30px ${D}`; g.fillStyle = "#5b6b88"; g.fillText(String(i + 1).padStart(2, "0"), 64, y + 34);
      g.font = `600 36px ${B}`; g.fillStyle = "#eef3ff"; g.fillText(`${m[1]} – ${m[2]}`, 122, y + 16);
      g.font = `500 24px ${B}`; g.fillStyle = "#93a4c3"; g.fillText(`${fmtDate(m[0])}${m[6] ? ` · ore ${m[6]}` : ""}`, 124, y + 62);
      ["1", "X", "2"].forEach((x, j) => {
        const bx = X0 + j * step, by = y + 16, on = (p.s || "").includes(x);
        g.lineWidth = 3; g.strokeStyle = on ? "#ff4d6d" : "rgba(170,200,255,.35)"; g.fillStyle = on ? "#ff4d6d" : "transparent";
        g.beginPath(); g.roundRect(bx, by, 72, 68, 14); if (on) g.fill(); g.stroke();
        g.textAlign = "center"; g.font = `800 40px ${D}`; g.fillStyle = on ? "#ffffff" : "rgba(170,200,255,.45)"; g.fillText(x, bx + 36, by + 12); g.textAlign = "left";
      });
    });
    // piede: invito e firma
    const fy = top + ms.length * riga + 40;
    g.textAlign = "center"; g.font = `600 34px ${B}`; g.fillStyle = "#eef3ff"; g.fillText("Sfidami su Sliding Doors Serie A", W / 2, fy);
    g.font = `600 32px ${B}`; g.fillStyle = "#ff4d6d"; g.fillText("c1962-2012.github.io/sliding-doors", W / 2, fy + 56);
    g.font = `500 26px ${B}`; g.fillStyle = "#93a4c3"; g.fillText("un'app di ciuffa62", W / 2, fy + 112); g.textAlign = "left";
    return new Promise(res => c.toBlob(res, "image/png"));
  }
  window.SD_immagineSchedina = async id => { const sc = leggi().find(x => x.id === id); return sc ? immagineSchedina(sc) : null };
  async function manda(sc){
    const url = linkSchedina(sc), testo = `La mia schedina della ${sc.giornata}ª giornata. Aggiungila e sfidami su Sliding Doors Serie A: ${url}`;
    const blob = await immagineSchedina(sc), nomeFile = `schedina-${sc.giornata}-giornata-${(sc.nome || "").replace(/[^\w]+/g, "-")}.png`;
    condividi({ blob, testo, nomeFile, titolo: "La mia schedina", h2: "Manda la schedina", sub: "L'immagine arriva agli amici insieme al link: toccandolo, la tua schedina entra nel loro gruppo." });
  }
  // finestra "Manda agli amici" (WhatsApp, Instagram, altre app, copia link): la usano schedine e formazioni
  function condividi({ blob, testo, nomeFile, titolo, h2, sub }){
    const img = URL.createObjectURL(blob);
    const file = new File([blob], nomeFile, { type: "image/png" });
    const conFile = !!(navigator.canShare && navigator.canShare({ files: [file] }));
    const box = pop.open(`<h2>${h2}</h2><p class="sub">${sub}</p>
      <img class="story" src="${img}" alt="${titolo}">
      <div class="sch-share">
        <button type="button" data-via="wa" class="wa">WhatsApp<small>immagine + link</small></button>
        <button type="button" data-via="ig" class="ig">Instagram<small>immagine + link</small></button>
        ${conFile ? `<button type="button" data-via="altre">Altre app<small>Telegram, SMS, email…</small></button>` : ""}
        <button type="button" data-via="copia">Copia link<small>solo il link</small></button>
      </div><p class="sub" id="schShareMsg" style="margin-top:10px"></p>`);
    const msg = m => box.querySelector("#schShareMsg").textContent = m;
    const copiaImmagine = async () => { try { await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); return true } catch(e){ return false } };
        box.querySelector(".sch-share").addEventListener("click", async e => {
      const t = e.target.closest("[data-via]"); if (!t) return;
      if (t.dataset.via === "copia"){ const ok = await copia(testo); msg(ok ? "Link copiato: incollalo dove vuoi." : "Non riesco a copiare in automatico."); return }
      // telefono: si condividono insieme immagine e testo con il link, e si sceglie WhatsApp o Instagram dal menu
      // telefono e PC: la finestra Condividi del sistema manda immagine e link direttamente all'app scelta (WhatsApp, Instagram…)
      if (conFile){ try { await navigator.share({ files: [file], text: testo, title: titolo }) } catch(err){} return }
      // PC: l'immagine va negli appunti, il link nel messaggio già scritto; nella chat basta incollare l'immagine
      const ok = await copiaImmagine();
      if (t.dataset.via === "wa"){ location.href = "whatsapp://send?text=" + encodeURIComponent(testo); setTimeout(() => { if (document.hasFocus()) window.open("https://web.whatsapp.com/send?text=" + encodeURIComponent(testo), "_blank", "noopener") }, 1500); msg(ok ? "Si apre WhatsApp con il link già scritto: scegli la chat, premi Ctrl+V per aggiungere l'immagine e invia." : "Si apre WhatsApp con il link: per l'immagine usa Salva immagine e allegala.") }
      else { window.open("https://www.instagram.com/direct/inbox/", "_blank", "noopener"); msg(ok ? "Si apre Instagram: apri la chat, premi Ctrl+V per mettere l'immagine e invia. Per il link usa poi Copia link." : "Su Instagram apri la chat e allega l'immagine; per il link usa Copia link.") }
    });
  }
  // strumenti in comune con "La mia formazione"
  window.SD_comune = { condividi, avvisa, esc, firma, salvaFirma, b64, deb64, BASE };


  // ---- elenchi: le mie schedine e il gruppo (classifica per giornata) ----
  function controlla(sc){
    const rs = SERIE_A[sc.stagione] || [];
    let ok = 0, ko = 0, attesa = 0;
    const rows = Object.entries(sc.pron).map(([k, p]) => {
      const [h, a] = k.split("|"), m = rs.find(x => x[1] === h && x[2] === a), giocata = m && m[3] !== null;
      let stato = "⏳";
      if (giocata){ const giusto = p.s.includes(segno(m[3], m[4])); giusto ? ok++ : ko++; stato = giusto ? "✅" : "❌" } else attesa++;
      return { h, a, m, giocata, stato, s: p.s };
    }).sort((x, y) => x.m && y.m ? (x.m[0] + (x.m[6] || "")).localeCompare(y.m[0] + (y.m[6] || "")) : 0);
    return { ok, ko, attesa, rows };
  }
  const righeHtml = rows => rows.map(r => `<div class="r"><span>${r.stato}</span><span>${r.h} – ${r.a}${r.m && !r.giocata ? ` <span class="meta">· ${fmtDate(r.m[0])}${r.m[6] ? ` ore ${r.m[6]}` : ""}</span>` : ""}</span><span class="mio">${r.s}</span><span class="vero">${r.giocata ? `${r.m[3]}-${r.m[4]}` : ""}</span></div>`).join("");
  const quando = sc => new Date(sc.creata).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  function disegnaElenchi(){
    const l = leggi(), mie = l.filter(s => s.mia !== false);
    $("schList").innerHTML = mie.length ? mie.map(sc => {
      const c = controlla(sc), tot = c.ok + c.ko;
      return `<article class="sch-card"><header><div><h3>${sc.giornata}ª giornata ${sc.stagione.replace("-", "/")}</h3>
        <div class="meta">${sc.nome ? `Firmata ${esc(sc.nome)} · ` : ""}fatta il ${quando(sc)}${colonneTesto(Object.values(sc.pron).map(p => p.s), " · ")}${c.attesa ? ` · ${c.attesa} da giocare` : " · completata"}</div></div>
        <div class="punti">${tot ? `${c.ok}/${tot}` : "–"}</div></header>
        <div class="sch-acts">${sc.nome ? `<button class="sch-btn send" type="button" data-send="${sc.id}">📤 Manda agli amici</button>` : ""}<button class="sch-btn" type="button" data-del="${sc.id}">Elimina</button></div>${righeHtml(c.rows)}</article>`;
    }).join("") : `<p class="empty">Non hai ancora schedine. Preparane una qui accanto.</p>`;

    // il gruppo: per ogni giornata con schedine degli amici, classifica di tutti (tu compreso) e le loro schedine
    const giornate = [...new Set(l.filter(s => s.mia === false).map(s => s.stagione + "|" + s.giornata))]
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    $("schGroup").innerHTML = giornate.length ? giornate.map(gk => {
      const [stag, g] = gk.split("|"), tutte = l.filter(s => s.stagione === stag && s.giornata === +g && (s.mia === false || s.nome));
      const cl = tutte.map(sc => ({ sc, c: controlla(sc) })).sort((x, y) => y.c.ok - x.c.ok || x.c.ko - y.c.ko || x.sc.nome.localeCompare(y.sc.nome));
      const medaglia = i => ["🥇", "🥈", "🥉"][i] || `${i + 1}º`;
      const finita = cl.every(x => !x.c.attesa), giocate = cl[0] ? cl[0].c.ok + cl[0].c.ko : 0;
      return `<article class="sch-card"><header><div><h3>${g}ª giornata ${stag.replace("-", "/")}</h3>
        <div class="meta">${cl.length} schedin${cl.length === 1 ? "a" : "e"} · ${finita ? "classifica finale" : giocate ? `${giocate} partite giocate su ${ordine(+g, stag).length}` : "non ancora iniziata"}</div></div></header>
        <div class="sch-rank">${cl.map((x, i) => `<div class="p ${x.sc.mia !== false ? "me" : ""}"><span>${giocate ? medaglia(i) : "·"}</span><span>${esc(x.sc.nome)}${x.sc.mia !== false ? " (tu)" : ""}</span><span class="pt">${x.c.ok + x.c.ko ? `${x.c.ok}/${x.c.ok + x.c.ko}` : "–"}</span></div>`).join("")}</div>
        ${cl.filter(x => x.sc.mia === false).map(x => `<details><summary>${esc(x.sc.nome)} · fatta il ${quando(x.sc)}${colonneTesto(Object.values(x.sc.pron).map(p => p.s), " · ")}</summary>${righeHtml(x.c.rows)}
          <div class="sch-acts"><button class="sch-btn" type="button" data-del="${x.sc.id}">Togli dal gruppo</button></div></details>`).join("")}</article>`;
    }).join("") : `<p class="empty">Qui arrivano le schedine dei tuoi amici: quando ti mandano il link, toccalo e la loro schedina compare qui, con la classifica del gruppo.</p>`;
  }
  const azioni = e => {
    const s = e.target.closest("[data-send]"); if (s){ const sc = leggi().find(x => x.id === s.dataset.send); if (sc) manda(sc); return }
    const d = e.target.closest("[data-del]"); if (!d) return;
    if (!confirm("Vuoi eliminare questa schedina? Non si può recuperare.")) return;
    scrivi(leggi().filter(x => x.id !== d.dataset.del)); disegnaElenchi();
  };
  $("schList").addEventListener("click", azioni);
  $("schGroup").addEventListener("click", azioni);

  window.SD_schedineRender = () => { disegnaFirma(); disegnaNuova(); disegnaElenchi() };
  // arrivo da un link di un amico: si aggiunge la schedina e si apre la cartella
  const daLink = () => {
    const m = location.hash.match(/^#s=([\w-]+)/); if (!m) return false;
    const esito = importa(m[1]);
    history.replaceState(null, "", location.pathname + location.search + "#schedine");
    showView("sch"); avvisa(esito);
    setTimeout(() => $("schGroup").scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    return true;
  };
  // solo nell'anteprima sul computer: #prova-schedina crea una schedina di esempio "tua", per provare l'invio
  if (/^localhost$|^127./.test(location.hostname) && location.hash === "#prova-schedina"){
    const ms = partiteGiornata(giornateAperte()[0]), giri = ["1", "X", "2", "1X", "1", "2", "X2", "1", "2", "1X2"];
    const l = leggi().filter(x => x.id !== "prova-mia");
    l.unshift({ id: "prova-mia", mia: true, nome: firma().nome || "Giovanni", avatar: "", creata: new Date().toISOString(), stagione: CURRENT, giornata: giornateAperte()[0], pron: Object.fromEntries(ms.map((m, i) => [m[1] + "|" + m[2], { s: giri[i % giri.length] }])) });
    scrivi(l); history.replaceState(null, "", location.pathname + location.search + "#schedine"); showView("sch");
    setTimeout(() => $("schList").scrollIntoView({ block: "start" }), 300);
  }
  addEventListener("hashchange", daLink);
  if (!daLink() && currentView === "sch") SD_schedineRender();
}

// ---------------- La mia formazione ----------------
// Prima delle formazioni ufficiali ognuno sceglie modulo e 11 titolari di una squadra per una partita.
// Le rose e gli squalificati (dai cartellini) arrivano da rose-a.js; gli infortunati li segna chi usa l'app.
// Quando ESPN pubblica le ufficiali (circa un'ora prima) l'app conta quanti titolari sono stati indovinati.
// Come le schedine, si mandano agli amici con un link e un'immagine; il gruppo ha la sua classifica.
{
  const C = window.SD_comune, R = window.ROSE_A || { squadre: {} };
  const KEY = "sd-formazioni", KEY_INF = "sd-infortunati", KEY_UFF = "sd-ufficiali";
  const leggiK = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d } catch(e){ return d } };
  const scriviK = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true } catch(e){ return false } };
  // le formazioni salvate con la prima versione (solo campionato) si completano con i dati della partita
  const leggi = () => leggiK(KEY, []).map(f => { if (f.mid) return f; const m = trova(f.stagione, f.k); return m ? { ...daSerieA(m), ...f } : null }).filter(Boolean), scrivi = l => scriviK(KEY, l);
  const MODULI = ["4-3-3", "4-2-3-1", "4-3-2-1", "4-4-2", "4-3-1-2", "3-5-2", "3-4-2-1", "3-4-3"];   // i più usati in Serie A
  const NOME_RUOLO = { P: "Portiere", D: "Difensore", C: "Centrocampista", A: "Attaccante" };
  const cognome = n => { const p = String(n).split(" "); return p.length > 1 ? p.slice(1).join(" ") : n };
  const st = document.createElement("style");
  st.textContent = ".frm-team{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:6px;margin:0 0 10px}.frm-team button{border:1px solid var(--line-hi);background:transparent;border-radius:10px;padding:8px 6px;font-weight:700;font-size:13px;display:flex;align-items:center;gap:6px;text-align:left}" +
    ".frm-team button[aria-pressed=true]{background:var(--accent);border-color:var(--accent);color:#fff}" +
    ".frm-lab{color:var(--muted);font-size:13px;margin:4px 0 6px}.frm-mod{display:grid;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:6px;margin-bottom:4px}" +
    ".frm-mod button{border:1px solid var(--line-hi);background:transparent;border-radius:10px;padding:8px 4px;font-weight:700;font-family:var(--f-mono)}.frm-mod button[aria-pressed=true]{background:var(--gold);border-color:var(--gold);color:#071018}" +
    ".frm-pitch{position:relative;aspect-ratio:3/5;border-radius:16px;margin:12px 0;overflow:hidden;border:2px solid rgba(255,255,255,.25);" +
    "background:repeating-linear-gradient(180deg,#1f7a3d 0 10%,#23863f 10% 20%)}" +
    ".frm-pitch:before{content:'';position:absolute;left:50%;top:0;width:36%;height:14%;transform:translateX(-50%);border:2px solid rgba(255,255,255,.35);border-top:0}" +
    ".frm-pitch:after{content:'';position:absolute;left:50%;bottom:0;width:36%;height:14%;transform:translateX(-50%);border:2px solid rgba(255,255,255,.35);border-bottom:0}" +
    ".frm-pitch .mid{position:absolute;left:0;right:0;top:50%;border-top:2px solid rgba(255,255,255,.35)}.frm-pitch .cc{position:absolute;left:50%;top:50%;width:24%;aspect-ratio:1;border:2px solid rgba(255,255,255,.35);border-radius:50%;transform:translate(-50%,-50%)}" +
    ".frm-slot{all:unset;cursor:pointer;position:absolute;transform:translate(-50%,-50%);display:grid;justify-items:center;gap:2px;width:21%;z-index:1}" +
    ".frm-slot .m{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:15px;color:#fff;background:var(--k1,#3a4a66);border:3px solid var(--k2,#fff);box-shadow:0 4px 10px rgba(0,0,0,.4)}" +
    ".frm-slot.vuoto .m{background:rgba(0,0,0,.25);border:2px dashed rgba(255,255,255,.7);font-size:20px}" +
    ".frm-slot .n{font-size:12px;font-weight:700;color:#fff;text-shadow:0 1px 3px #000;text-align:center;line-height:1.1;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    ".frm-slot:focus-visible .m{outline:3px solid var(--gold)}" +
    ".frm-info{display:grid;gap:4px;font-size:13px;color:var(--muted);margin-bottom:6px}.frm-info b{color:var(--ink)}" +
    ".frm-pick{display:grid;gap:4px}.frm-pick .g{font-family:var(--f-display);text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin:12px 0 4px}" +
    ".frm-pick .p{display:grid;grid-template-columns:1fr auto;gap:6px;align-items:center}" +
    ".frm-pick .p>button:first-child{all:unset;cursor:pointer;display:flex;gap:10px;align-items:center;padding:9px 10px;border-radius:10px;background:rgba(255,255,255,.05)}" +
    ".frm-pick .p>button:first-child:hover{background:rgba(255,255,255,.1)}.frm-pick .p>button[disabled]{opacity:.45;cursor:not-allowed}" +
    ".frm-pick .num{font-family:var(--f-mono);color:var(--muted);min-width:22px;text-align:right}.frm-pick .tag{font-size:12px;color:var(--muted)}" +
    ".frm-pick .inf{border:1px solid var(--line);background:transparent;border-radius:10px;padding:7px 9px;font-size:16px;opacity:.55}.frm-pick .inf[aria-pressed=true]{opacity:1;border-color:var(--bad);background:rgba(255,77,109,.15)}" +
    ".frm-giri{display:flex;flex-wrap:wrap;gap:5px;margin:0 0 12px}.frm-giri button{border:1px solid var(--line-hi);background:transparent;border-radius:9px;padding:6px 8px;min-width:40px;font-weight:700;font-size:13px}.frm-giri button[aria-pressed=true]{background:var(--gold);border-color:var(--gold);color:#071018}" +
    ".frm-scelta{display:grid;gap:2px;padding:10px 12px;border-radius:12px;background:rgba(34,224,139,.12);border:1px solid var(--good);margin:0 0 12px;font-size:15px}.frm-scelta small{color:var(--muted);font-size:12px}" +
    ".frm-scegli{border:2px solid var(--gold);border-radius:16px;padding:12px;margin:0 0 14px;background:rgba(255,207,74,.06)}.frm-big{font-family:var(--f-display);font-weight:800;font-size:18px;text-transform:uppercase;letter-spacing:.02em;margin:2px 0 8px}" +
    ".frm-nav{display:grid;grid-template-columns:48px minmax(0,1fr) 48px;gap:6px;margin-bottom:12px}.frm-nav button{border:1px solid var(--line-hi);background:rgba(255,255,255,.06);border-radius:12px;font-size:18px;color:var(--ink)}.frm-nav button:disabled{opacity:.3}" +
    "#formGiro{width:100%;max-width:100%;min-width:0;text-overflow:ellipsis;height:48px;font-size:16px;font-weight:700;border:2px solid var(--accent);border-radius:12px;padding:0 10px;background:var(--bg2);color:var(--ink)}" +
    ".frm-partite{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px;margin:0 0 10px}.frm-partite button{border:1px solid var(--line-hi);background:transparent;border-radius:10px;padding:8px;display:grid;gap:3px;text-align:left;font-size:13px;font-weight:700}" +
    ".frm-partite button .sq{display:flex;align-items:center;gap:6px}.frm-partite button small{font-weight:400;color:var(--muted)}.frm-partite button[aria-pressed=true]{background:var(--accent);border-color:var(--accent);color:#fff}.frm-partite button[aria-pressed=true] small{color:#ffe}#view-form .panel{min-width:0;overflow:hidden}" +
    ".frm-nome{position:absolute;left:8px;display:flex;align-items:center;gap:6px;font-weight:800;font-size:12px;color:#fff;background:rgba(0,0,0,.45);padding:3px 8px;border-radius:999px;z-index:2}.frm-nome.me{bottom:8px}.frm-nome.avv{top:8px}" +
    "#formModulo{display:block}.frm-modrow{margin-bottom:8px}.frm-modt{display:flex;align-items:center;gap:6px;font-weight:700;font-size:13px;margin:2px 0 4px}.frm-infot{display:flex;align-items:center;gap:6px;margin-top:6px}" +
    ".frm-chiusa{padding:12px 14px;border-radius:12px;border:1px solid var(--bad);background:rgba(255,77,109,.12);font-weight:600;margin:0 0 6px}" +
    ".frm-xi{display:grid;grid-template-columns:1fr 1fr;gap:2px 12px;font-size:14px;margin-top:6px}.frm-xi span{padding:3px 0;border-top:1px solid var(--line)}";
  document.head.appendChild(st);

  // ---- partite e squadre: Serie A dal calendario, coppe dagli abbinamenti già decisi (rose-a.js) ----
  const righe = () => SERIE_A[CURRENT] || [];
  // ora d'inizio in ora italiana -> istante (gestisce ora legale e solare)
  const offRoma = d => { const u = new Date(d + "T12:00:00Z"); return Math.round((new Date(u.toLocaleString("en-US", { timeZone: "Europe/Rome" })) - new Date(u.toLocaleString("en-US", { timeZone: "UTC" }))) / 36e5) };
  const inizio = m => Date.parse(`${m[0]}T${m[6] || "15:00"}:00+0${offRoma(m[0])}:00`);
  const trova = (stag, k) => (SERIE_A[stag] || []).find(m => m[1] + "|" + m[2] === k);
  const giornoRoma = t => new Date(t).toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
  const oraRoma = t => new Date(t).toLocaleTimeString("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" });
  // una partita, di campionato o di coppa: { mid, comp, casa, ospite, t0, data, ora, slug, eid }
  const daSerieA = m => ({ mid: "A|" + m[1] + "|" + m[2], g: m[5], comp: "Serie A", casa: m[1], ospite: m[2], t0: inizio(m), data: m[0], ora: m[6] || "", slug: "ita.1", eid: "" });
  const daCoppa = x => { const t0 = Date.parse(x[3]); return { mid: "C|" + x[2], comp: x[0], casa: x[4], ospite: x[5], t0, data: giornoRoma(t0), ora: oraRoma(t0), slug: x[1], eid: x[2] } };
  const prossime = () => [...righe().filter(m => m[3] === null).map(daSerieA), ...(R.coppe || []).map(daCoppa)].filter(p => p.t0 > Date.now()).sort((a, b) => a.t0 - b.t0);
  const rosa = t => (R.squadre[t] || {}).rosa || [];
  // le squalifiche calcolate valgono solo per il campionato: in coppa contano i cartellini di coppa
  const squal = (t, comp) => new Map(comp === "Serie A" ? ((R.squadre[t] || {}).squal || []).map(x => [x[0], x[1]]) : []);
  const diff = (t, comp) => new Map(comp === "Serie A" ? ((R.squadre[t] || {}).diff || []).map(x => [x[0], x[1]]) : []);
  const infortunati = t => new Set([...((R.squadre[t] || {}).inf || []), ...(leggiK(KEY_INF, {})[t] || [])]);
  const segnaInf = (t, n) => { const all = leggiK(KEY_INF, {}), s = new Set(all[t] || []); s.has(n) ? s.delete(n) : s.add(n); all[t] = [...s]; scriviK(KEY_INF, all) };
  // posizioni sul campo: portiere in basso, poi le linee del modulo verso l'attacco
  function posti(modulo){
    const linee = modulo.split("-").map(Number), out = [{ x: 50, y: 90, r: "P" }];
    linee.forEach((n, i) => {
      const y = 72 - i * (60 / Math.max(linee.length - 1, 1)), r = i === 0 ? "D" : i === linee.length - 1 ? "A" : "C";
      for (let j = 0; j < n; j++) out.push({ x: n === 1 ? 50 : 12 + j * (76 / (n - 1)), y, r });
    });
    return out;
  }

  // la formazione si fa per tutte e due le squadre della partita: la tua ("me") in basso, l'avversaria ("avv") in alto.
  // Se dell'avversaria non c'è la rosa (squadre straniere nelle coppe) si fa solo la tua.
  const vuoto = () => Array(11).fill(null);
  let bozza = { t: null, mid: null, me: { modulo: "4-3-3", xi: vuoto() }, avv: { modulo: "4-3-3", xi: vuoto() } };
  const squadraBozza = () => bozza.t;
  const partitaBozza = () => prossime().find(p => p.mid === bozza.mid) || null;
  const compBozza = () => (partitaBozza() || {}).comp || "Serie A";
  const avversaria = () => { const p = partitaBozza(); return p ? (p.casa === bozza.t ? p.ospite : p.casa) : null };
  const squadraDi = s => s === "me" ? bozza.t : avversaria();
  const conAvv = () => rosa(avversaria() || "").length > 0;
  const azzera = () => { bozza.me = { ...bozza.me, xi: vuoto() }; bozza.avv = { ...bozza.avv, xi: vuoto() } };
  const squadre = () => [...new Set(righe().flatMap(m => [m[1], m[2]]))].sort();
  const partiteDi = t => prossime().filter(p => p.casa === t || p.ospite === t).slice(0, 8);

  function disegnaFirma(){
    const f = C.firma();
    $("formFirma").innerHTML = `<label for="formNome">La tua firma: il nome che vedranno i tuoi amici</label>
      <input id="formNome" maxlength="20" placeholder="Il tuo nome (es. Giovanni)" value="${C.esc(f.nome)}" autocomplete="nickname">`;
  }
  $("formFirma").addEventListener("input", e => { if (e.target.id === "formNome"){ C.salvaFirma({ ...C.firma(), nome: e.target.value.trim() }); e.target.classList.remove("no") } });

  // la partita si sceglie liberamente: tutte le giornate di Serie A ancora da giocare e tutte le partite di coppa già decise
  const giro = p => p.comp === "Serie A" ? "A|" + p.g : "C|" + p.comp;
  function giri(ps){
    const out = new Map();
    for (const p of ps){ const k = giro(p); if (!out.has(k)) out.set(k, []); out.get(k).push(p) }
    return [...out].sort((x, y) => (x[0][0] === "C") - (y[0][0] === "C") || x[1][0].t0 - y[1][0].t0).map(([k, l]) => {
      const d1 = fmtDate(l[0].data), d2 = fmtDate(l[l.length - 1].data);
      return { k, l, nome: k[0] === "A" ? `⚽ ${l[0].g}ª giornata Serie A` : `🏆 ${l[0].comp} (${l.length} partit${l.length === 1 ? "a" : "e"})` };
    });
  }
  function disegnaNuova(){
    const ps = prossime();
    if (!ps.length){ $("formGiro").innerHTML = ""; $("formMatch").innerHTML = ""; $("formPitch").innerHTML = ""; $("formInfo").innerHTML = `<p class="empty">Non ci sono partite da giocare.</p>`; $("formSave").disabled = true; return }
    const gs = giri(ps), scelta = ps.find(p => p.mid === bozza.mid);
    if (scelta && !bozza.giro) bozza.giro = giro(scelta);
    if (!gs.some(g => g.k === bozza.giro)) bozza.giro = gs[0].k;
    const lista = gs.find(g => g.k === bozza.giro).l;
    if (!lista.some(p => p.mid === bozza.mid)){ bozza.mid = lista[0].mid; azzera() }
    bozza.t = partitaBozza().casa;   // in basso la squadra di casa, in alto quella in trasferta
    const pos = gs.findIndex(g => g.k === bozza.giro); $("formPrev").disabled = pos <= 0; $("formNext").disabled = pos >= gs.length - 1;
    // tutte le giornate e le coppe anche come pulsanti: si salta direttamente a quella che si vuole
    $("formGiri").innerHTML = gs.map(g => `<button type="button" data-giro="${g.k}" aria-pressed="${g.k === bozza.giro}" title="${g.nome}">${g.k[0] === "A" ? g.l[0].g + "ª" : "🏆 " + g.l[0].comp.replace(" League", "")}</button>`).join("");
    $("formGiro").innerHTML = gs.map(g => `<option value="${g.k}" ${g.k === bozza.giro ? "selected" : ""}>${g.nome}</option>`).join("");
    $("formMatch").innerHTML = lista.map(p => `<button type="button" data-mid="${p.mid}" aria-pressed="${p.mid === bozza.mid}"><span class="sq">${kit(p.casa)}${C.esc(p.casa)}</span><span class="sq">${kit(p.ospite)}${C.esc(p.ospite)}</span><small>${fmtDate(p.data)}${p.ora ? ` · ore ${p.ora}` : ""}</small></button>`).join("");
    disegnaModuli(); disegnaCampo(); controllaBozza();
  }
  function disegnaModuli(){
    const riga = s => `<div class="frm-modrow"><div class="frm-modt">${kit(squadraDi(s))}${C.esc(squadraDi(s))}</div><div class="frm-mod">${MODULI.map(x => `<button type="button" data-s="${s}" data-mod="${x}" aria-pressed="${x === bozza[s].modulo}">${x}</button>`).join("")}</div></div>`;
    const p = partitaBozza();
    $("formModulo").innerHTML = (p ? `<div class="frm-scelta">✅ Stai facendo: <b>${C.esc(p.casa)} – ${C.esc(p.ospite)}</b><small>${p.comp} · ${fmtDate(p.data)}${p.ora ? ` ore ${p.ora}` : ""}</small></div><div class="frm-big">👉 3. Scegli i moduli</div>` : "") + riga("me") + (conAvv() ? riga("avv") : `<p class="frm-info">La rosa di ${C.esc(avversaria() || "")} non è disponibile: fai solo la formazione di ${C.esc(bozza.t)}.</p>`);
  }
  // se per la partita scelta le ufficiali sono già uscite la formazione non si può più fare
  let chiusa = null;   // mid della partita chiusa
  async function controllaBozza(){
    const p = partitaBozza(); if (!p) return;
    const u = await scaricaUfficiali(p);
    const ora = partitaBozza();   // nel frattempo si può aver cambiato partita
    if (u && ora && ora.mid === p.mid && chiusa !== p.mid){ chiusa = p.mid; disegnaCampo() }
  }
  const bloccata = () => { const p = partitaBozza(); return !p || chiusa === p.mid || !!leggiK(KEY_UFF, {})[p.mid] };
  // posizione sul campo intero: la tua squadra nella metà bassa, l'avversaria in quella alta (a specchio)
  const postiCampo = s => posti(bozza[s].modulo).map(p => { const y = 50 + p.y / 2; return { ...p, y: s === "me" ? y : 100 - y } });
  function disegnaCampo(){
    const comp = compBozza(), lati = conAvv() ? ["me", "avv"] : ["me"];
    $("formPitch").innerHTML = `<div class="mid"></div><div class="cc"></div>` + lati.map(s => {
      const t = squadraDi(s), [k1, k2] = clubPalette(t), num = new Map(rosa(t).map(p => [p[0], p[2]]));
      return postiCampo(s).map((p, i) => {
        const n = bozza[s].xi[i];
        return `<button type="button" class="frm-slot ${n ? "" : "vuoto"}" data-s="${s}" data-i="${i}" style="left:${p.x}%;top:${p.y}%;--k1:${k1};--k2:${k2}" aria-label="${C.esc(t)}: ${n ? C.esc(n) : "scegli " + NOME_RUOLO[p.r].toLowerCase()}">
          <span class="m">${n ? (num.get(n) ?? "•") : "+"}</span><span class="n">${n ? C.esc(cognome(n)) : p.r}</span></button>`;
      }).join("");
    }).join("") + lati.map(s => `<span class="frm-nome ${s}">${kit(squadraDi(s))}${C.esc(squadraDi(s))}</span>`).join("");
    const elenco = (titolo, xs) => xs.length ? `<div>${titolo}: <b>${xs.map(C.esc).join(", ")}</b></div>` : "";
    const info = s => { const t = squadraDi(s), sq = squal(t, comp), df = diff(t, comp), inf = infortunati(t);
      return `<div class="frm-infot">${kit(t)}<b>${C.esc(t)}</b></div>` + (comp === "Serie A" ? (elenco("🟥 Squalificati", [...sq.keys()]) || "<div>🟥 Nessuno squalificato</div>") + elenco("🟨 Diffidati", [...df.keys()]) : "") + elenco("🚑 Infortunati (segnati da te)", [...inf]) };
    $("formInfo").innerHTML = rosa(bozza.t).length ? `<div class="frm-info">${comp !== "Serie A" ? `<div>🏆 Partita di ${comp}: le squalifiche di campionato qui non contano. Se qualcuno è squalificato in coppa, segnalo con 🚑.</div>` : ""}${lati.map(info).join("")}
      <div>Tocca un cerchio sul campo per scegliere il giocatore: in basso ${C.esc(bozza.t)}${conAvv() ? `, in alto ${C.esc(avversaria())}` : ""}. Nella lista puoi segnare gli infortunati con 🚑.</div></div>` : `<p class="empty">La rosa di ${bozza.t} non è disponibile.</p>`;
    $("formPitch").style.opacity = bloccata() ? ".4" : "";
    if (bloccata()){
      $("formInfo").innerHTML = `<p class="frm-chiusa">🔒 Le formazioni ufficiali di questa partita sono già uscite: la formazione non si può più fare. Scegli un'altra partita.</p>`;
      $("formSave").disabled = true; $("formSave").textContent = "🔒 Formazioni ufficiali già uscite"; return;
    }
    const mancaMe = bozza.me.xi.filter(x => !x).length, mancaAvv = conAvv() ? bozza.avv.xi.filter(x => !x).length : 0;
    $("formSave").disabled = mancaMe + mancaAvv > 0;
    $("formSave").textContent = mancaMe + mancaAvv ? `Mancano ${[mancaMe && `${mancaMe} di ${bozza.t}`, mancaAvv && `${mancaAvv} di ${avversaria()}`].filter(Boolean).join(" e ")}`
      : `💾 Salva formazion${conAvv() ? "i" : "e"} (${bozza.t} ${bozza.me.modulo}${conAvv() ? ` · ${avversaria()} ${bozza.avv.modulo}` : ""})`;
  }
  const sposta = d => { const gs = giri(prossime()), i = gs.findIndex(g => g.k === bozza.giro) + d; if (gs[i]){ bozza.giro = gs[i].k; bozza.mid = null; disegnaNuova() } };
  $("formGiri").addEventListener("click", e => { const b = e.target.closest("[data-giro]"); if (b){ bozza.giro = b.dataset.giro; bozza.mid = null; disegnaNuova() } });
  $("formPrev").addEventListener("click", () => sposta(-1));
  $("formNext").addEventListener("click", () => sposta(1));
  $("formGiro").addEventListener("change", e => { bozza.giro = e.target.value; bozza.mid = null; disegnaNuova() });
  $("formMatch").addEventListener("click", e => { const b = e.target.closest("[data-mid]"); if (!b) return; if (b.dataset.mid !== bozza.mid){ bozza.mid = b.dataset.mid; azzera(); disegnaNuova() }
    $("formModulo").scrollIntoView({ behavior: "smooth", block: "start" }) });   // si va subito alla formazione della partita scelta
  $("formModulo").addEventListener("click", e => { const b = e.target.closest("[data-mod]"); if (!b) return; bozza[b.dataset.s].modulo = b.dataset.mod; disegnaModuli(); disegnaCampo() });
  $("formPitch").addEventListener("click", e => { const s = e.target.closest("[data-i]"); if (s && !bloccata()) scegli(s.dataset.s, +s.dataset.i) });

  // ---- scelta del giocatore per un posto ----
  function scegli(s, i){
    const t = squadraDi(s), comp = compBozza(), ruolo = posti(bozza[s].modulo)[i].r, xi = bozza[s].xi;
    const disegna = () => {
      const sq = squal(t, comp), df = diff(t, comp), inf = infortunati(t);
      const riga = p => {
        const [n, , num] = p, no = sq.has(n) || inf.has(n), dove = xi.indexOf(n);
        const tag = [sq.has(n) && `🟥 squalificato (${sq.get(n)})`, inf.has(n) && "🚑 infortunato", df.has(n) && `🟨 diffidato (${df.get(n)} gialli)`, dove >= 0 && dove !== i && "già in campo"].filter(Boolean).join(" · ");
        return `<div class="p"><button type="button" data-n="${C.esc(n)}" ${no ? "disabled" : ""}><span class="num">${num ?? ""}</span><span>${C.esc(n)}${tag ? `<br><span class="tag">${tag}</span>` : ""}</span></button>
          <button type="button" class="inf" data-inf="${C.esc(n)}" aria-pressed="${inf.has(n)}" title="Segna o togli infortunato">🚑</button></div>`;
      };
      const gruppi = ["P", "D", "C", "A"].sort((a, b) => (b === ruolo) - (a === ruolo));
      return `<h2>${kit(t)}${C.esc(t)}: ${NOME_RUOLO[ruolo].toLowerCase()}</h2><p class="sub">Scegli chi gioca in questo posto. 🚑 segna un infortunato: non si potrà schierare.</p>
        ${xi[i] ? `<div class="sch-acts" style="justify-content:flex-start"><button type="button" class="sch-btn" data-togli="1">Lascia vuoto questo posto</button></div>` : ""}
        <div class="frm-pick">${gruppi.map(g => { const ps = rosa(t).filter(p => p[1] === g); return ps.length ? `<div class="g">${({ P: "Portieri", D: "Difensori", C: "Centrocampisti", A: "Attaccanti" })[g]}</div>${ps.map(riga).join("")}` : "" }).join("")}</div>`;
    };
    const box = pop.open(disegna());
    const ridisegna = () => { box.querySelector(".box").innerHTML = `<button class="x" type="button" aria-label="Chiudi">✕</button>` + disegna() };
    box.querySelector(".box").addEventListener("click", e => {
      const inf = e.target.closest("[data-inf]");
      if (inf){ segnaInf(t, inf.dataset.inf); const j = xi.indexOf(inf.dataset.inf); if (j >= 0 && infortunati(t).has(inf.dataset.inf)) xi[j] = null; ridisegna(); disegnaCampo(); return }
      if (e.target.closest("[data-togli]")){ xi[i] = null; pop.close(); disegnaCampo(); return }
      const b = e.target.closest("[data-n]"); if (!b || b.disabled) return;
      const n = b.dataset.n, prima = xi.indexOf(n);
      if (prima >= 0) xi[prima] = xi[i];   // se era già in campo, i due si scambiano il posto
      xi[i] = n; pop.close(); disegnaCampo();
    });
  }

  $("formSave").addEventListener("click", async () => {
    const f = C.firma();
    if (!f.nome){ const n = $("formNome"); n.classList.add("no"); n.focus(); n.scrollIntoView({ block: "center" }); C.avvisa("Scrivi prima il tuo nome per firmare la formazione"); return }
    if (bozza.me.xi.some(x => !x) || conAvv() && bozza.avv.xi.some(x => !x)) return;
    const p = partitaBozza();
    if (!p){ C.avvisa("La partita è già iniziata"); return }
    if (await scaricaUfficiali(p)){ chiusa = p.mid; disegnaCampo(); C.avvisa("Troppo tardi: le formazioni ufficiali sono già uscite"); return }
    const l = leggi();
    l.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), mia: true, nome: f.nome, creata: new Date().toISOString(), stagione: CURRENT,
      mid: p.mid, comp: p.comp, casa: p.casa, ospite: p.ospite, t0: p.t0, data: p.data, ora: p.ora, slug: p.slug, eid: p.eid,
      lato: p.casa === bozza.t ? "h" : "a", modulo: bozza.me.modulo, xi: bozza.me.xi.slice(),
      avv: conAvv() ? { modulo: bozza.avv.modulo, xi: bozza.avv.xi.slice() } : null });
    if (!scrivi(l)){ alert("Non riesco a salvare: questo browser non permette di salvare dati (forse sei in navigazione in incognito)."); return }
    azzera(); disegnaCampo(); disegnaElenchi();
    C.avvisa("Formazione salvata. Ora mandala agli amici!");
    $("formList").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // ---- formazioni ufficiali da ESPN (si cercano da un'ora e mezza prima dell'inizio) ----
  const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
  const NOMI = { "AC Milan": "Milan", "Internazionale": "Inter", "AS Roma": "Roma", "Hellas Verona": "Verona" };
  const uguale = (espn, t) => { const a = norm(NOMI[espn] || espn), b = norm(t); return a === b || a.includes(b) || b.includes(a) };
  const API = slug => "https://site.api.espn.com/apis/site/v2/sports/soccer/" + slug + "/";
  // formazioni ufficiali di una partita: { h, a, visto } oppure null se non sono ancora uscite.
  // "visto" è il momento in cui l'app le ha trovate: le formazioni fatte dopo non valgono.
  async function scaricaUfficiali(f){
    const uff = leggiK(KEY_UFF, {});
    if (uff[f.mid]) return uff[f.mid];
    if (Date.now() < f.t0 - 90 * 60e3) return null;   // prima di un'ora e mezza dall'inizio non escono mai
    const dati = await (async () => {
        let eid = f.eid;
        if (!eid){   // campionato: l'id ESPN si trova nelle partite del giorno
          const j = await fetch(API(f.slug) + "scoreboard?dates=" + f.data.replace(/-/g, ""), { cache: "no-store" }).then(r => r.json()).catch(() => null);
          const ev = j && (j.events || []).find(e => { const c = e.competitions[0].competitors, H = c.find(z => z.homeAway === "home"), A = c.find(z => z.homeAway === "away"); return H && A && uguale(H.team.displayName, f.casa) && uguale(A.team.displayName, f.ospite) });
          eid = ev && ev.id;
        }
        if (!eid) return null;
        const s = await fetch(API(f.slug) + "summary?event=" + eid, { cache: "no-store" }).then(r => r.json()).catch(() => null);
        const dati = {};
        for (const r of (s && s.rosters) || []) { const xi = (r.roster || []).filter(p => p.starter).map(p => p.athlete.displayName); if (xi.length === 11) dati[r.homeAway === "home" ? "h" : "a"] = { modulo: r.formation || "", xi } }
        return dati.h || dati.a ? { ...dati, visto: Date.now() } : null;
    })();
    if (!dati) return null;
    const tutte = leggiK(KEY_UFF, {}); tutte[f.mid] = dati; scriviK(KEY_UFF, tutte);
    return dati;
  }
  let cercando = false;
  async function cercaUfficiali(){
    if (cercando) return; cercando = true;
    try {
      const uff = leggiK(KEY_UFF, {}), visti = new Set();
      let nuove = 0;
      for (const f of leggi()) if (!uff[f.mid] && !visti.has(f.mid) && Date.now() > f.t0 - 90 * 60e3 && Date.now() < f.t0 + 4 * 864e5){ visti.add(f.mid); if (await scaricaUfficiali(f)) nuove++ }
      if (nuove) disegnaElenchi();
      controllaBozza();
    } finally { cercando = false }
  }
  setInterval(() => { if (currentView === "form") cercaUfficiali() }, 5 * 60e3);

  // titolari indovinati: della tua squadra e, se l'hai fatta, anche dell'avversaria
  function controlla(f){
    const tutte = leggiK(KEY_UFF, {})[f.mid] || {}, u = tutte[f.lato], ua = f.avv ? tutte[f.lato === "h" ? "a" : "h"] : null, tot = f.avv ? 22 : 11;
    if (!u && !ua) return { u: null, ua: null, ok: 0, tot };
    const conta = (mie, vere) => { const s = new Set(vere.xi.map(norm)); return mie.filter(n => s.has(norm(n))).length };
    const tardi = Date.parse(f.creata) > Math.min(tutte.visto || Infinity, f.t0);
    return { u: u || ua, uMe: u, ua, tardi, tot, ok: tardi ? 0 : (u ? conta(f.xi, u) : 0) + (ua ? conta(f.avv.xi, ua) : 0) };
  }
  const titoloF = f => ({ t: f.lato === "h" ? f.casa : f.ospite, contro: f.lato === "h" ? f.ospite : f.casa, comp: f.comp, quando: `${f.comp !== "Serie A" ? f.comp + " · " : ""}${fmtDate(f.data)}${f.ora ? ` ore ${f.ora}` : ""}` });
  const modF = f => f.modulo + (f.avv ? " · " + f.avv.modulo : "");
  const xiHtml = (f, c) => { const T = titoloF(f);
    const sez = (nome, mod, xi, u) => `<div class="frm-infot">${kit(nome)}<b>${C.esc(nome)}</b> <span class="meta">${mod}</span></div><div class="frm-xi">${xi.map(n => `<span>${u ? (new Set(u.xi.map(norm)).has(norm(n)) ? "✅ " : "❌ ") : ""}${C.esc(n)}</span>`).join("")}</div>
      ${u ? `<details><summary>Formazione ufficiale ${C.esc(u.modulo)}</summary><div class="frm-xi">${u.xi.map(n => `<span>${xi.map(norm).includes(norm(n)) ? "✅ " : "➕ "}${C.esc(n)}</span>`).join("")}</div></details>` : ""}`;
    return sez(T.t, f.modulo, f.xi, c.uMe) + (f.avv ? sez(T.contro, f.avv.modulo, f.avv.xi, c.ua) : "") };
  const quandoF = f => new Date(f.creata).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  function disegnaElenchi(){
    const l = leggi(), mie = l.filter(f => f.mia !== false);
    $("formList").innerHTML = mie.length ? mie.map(f => {
      const c = controlla(f), T = titoloF(f);
      return `<article class="sch-card"><header><div><h3>${kit(T.t)}${C.esc(T.t)}${f.avv ? ` – ${C.esc(T.contro)}` : ""}</h3>
        <div class="meta">${f.avv ? "" : `contro ${C.esc(T.contro)} · `}${T.quando} · ${modF(f)} · fatta il ${quandoF(f)}</div></div>
        <div class="punti">${c.u ? `${c.ok}/${c.tot}` : "–"}</div></header>
        <div class="meta">${c.u ? `Hai indovinato ${c.ok} titolari su ${c.tot}` : "In attesa della formazione ufficiale (esce circa un'ora prima)"}</div>
        <div class="sch-acts"><button class="sch-btn send" type="button" data-send="${f.id}">📤 Manda agli amici</button><button class="sch-btn" type="button" data-del="${f.id}">Elimina</button></div>${xiHtml(f, c)}</article>`;
    }).join("") : `<p class="empty">Non hai ancora formazioni. Preparane una qui accanto.</p>`;

    const gruppi = [...new Set(l.filter(f => f.mia === false).map(f => f.mid + "§" + f.lato))];
    $("formGroup").innerHTML = gruppi.length ? gruppi.map(g => {
      const [mid, lato] = g.split("§"), tutte = l.filter(f => f.mid === mid && f.lato === lato);
      const cl = tutte.map(f => ({ f, c: controlla(f) })).sort((x, y) => !!x.c.tardi - !!y.c.tardi || y.c.ok - x.c.ok || x.f.nome.localeCompare(y.f.nome));
      const T = titoloF(tutte[0]), pronta = cl[0] && cl[0].c.u, med = i => ["🥇", "🥈", "🥉"][i] || `${i + 1}º`;
      return `<article class="sch-card"><header><div><h3>${kit(T.t)}${C.esc(T.t)}</h3><div class="meta">contro ${C.esc(T.contro)} · ${T.quando} · ${cl.length} formazion${cl.length === 1 ? "e" : "i"} · ${pronta ? "ufficiali uscite" : "ufficiali non ancora uscite"}</div></div></header>
        <div class="sch-rank">${cl.map((x, i) => `<div class="p ${x.f.mia !== false ? "me" : ""}"><span>${pronta && !x.c.tardi ? med(i) : "·"}</span><span>${C.esc(x.f.nome)}${x.f.mia !== false ? " (tu)" : ""} <span class="meta">${modF(x.f)}</span></span><span class="pt">${x.c.tardi ? "<small>fatta dopo le ufficiali</small>" : pronta ? `${x.c.ok}/${x.c.tot}` : "–"}</span></div>`).join("")}</div>
        ${cl.filter(x => x.f.mia === false).map(x => `<details><summary>${C.esc(x.f.nome)} · ${modF(x.f)} · fatta il ${quandoF(x.f)}</summary>${xiHtml(x.f, x.c)}
          <div class="sch-acts"><button class="sch-btn" type="button" data-del="${x.f.id}">Togli dal gruppo</button></div></details>`).join("")}</article>`;
    }).join("") : `<p class="empty">Qui arrivano le formazioni dei tuoi amici: quando ti mandano il link, toccalo e la loro formazione compare qui, con la classifica di chi indovina più titolari.</p>`;
  }

  // ---- immagine del campo da mandare agli amici ----
  async function immagine(f){
    const T = titoloF(f), W = 1080, H = 1500, c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d"), D = '"Big Shoulders Display", Impact, sans-serif', B = '"IBM Plex Sans", "Segoe UI", sans-serif';
    try { await Promise.all([document.fonts.load('800 80px "Big Shoulders Display"'), document.fonts.load('600 40px "IBM Plex Sans"')]) } catch(e){}
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#0b1424"); bg.addColorStop(1, "#050a14"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.textBaseline = "top"; g.font = `800 76px ${D}`; g.fillStyle = "#eef3ff"; g.fillText(f.avv ? "LE MIE FORMAZIONI" : "LA MIA FORMAZIONE", 60, 44);
    g.font = `800 60px ${D}`; g.fillStyle = "#ff4d6d"; g.fillText(f.avv ? `${T.t.toUpperCase()} – ${T.contro.toUpperCase()}` : `${T.t.toUpperCase()}  ${f.modulo}`, 60, 130);
    g.font = `500 30px ${B}`; g.fillStyle = "#93a4c3"; g.fillText(f.avv ? `${T.quando} · ${T.t} ${f.modulo}, ${T.contro} ${f.avv.modulo}` : `contro ${T.contro} · ${T.quando}`, 62, 206);
    g.font = `600 36px ${B}`; g.fillStyle = "#ffcf4a"; g.fillText(f.nome || "", 62, 252);
    // campo
    const X = 60, Y = 320, PW = W - 120, PH = 980;
    for (let i = 0; i < 10; i++){ g.fillStyle = i % 2 ? "#23863f" : "#1f7a3d"; g.fillRect(X, Y + i * PH / 10, PW, PH / 10) }
    g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = 4; g.strokeRect(X, Y, PW, PH);
    g.beginPath(); g.moveTo(X, Y + PH / 2); g.lineTo(X + PW, Y + PH / 2); g.stroke();
    g.beginPath(); g.arc(X + PW / 2, Y + PH / 2, 110, 0, Math.PI * 2); g.stroke();
    g.strokeRect(X + PW * .32, Y, PW * .36, PH * .14); g.strokeRect(X + PW * .32, Y + PH * .86, PW * .36, PH * .14);
    // la tua squadra in basso; l'avversaria, se l'hai fatta, in alto a specchio
    const lati = [[T.t, f.modulo, f.xi, false], ...(f.avv ? [[T.contro, f.avv.modulo, f.avv.xi, true]] : [])];
    for (const [team, mod, xi, alto] of lati){
    const [k1, k2] = clubPalette(team), num = new Map(rosa(team).map(p => [p[0], p[2]])), R0 = f.avv ? 36 : 44;
    posti(mod).forEach((p, i) => {
      const yy = f.avv ? (alto ? 50 - p.y / 2 : 50 + p.y / 2) : p.y;
      const cx = X + PW * p.x / 100, cy = Y + PH * yy / 100, n = xi[i];
      g.beginPath(); g.arc(cx, cy, R0, 0, Math.PI * 2); g.fillStyle = k1; g.fill(); g.lineWidth = 7; g.strokeStyle = k2; g.stroke();
      g.textAlign = "center"; g.textBaseline = "middle"; g.font = `800 ${f.avv ? 32 : 38}px ${D}`; g.fillStyle = "#fff"; g.fillText(String(num.get(n) ?? ""), cx, cy + 2);
      g.textBaseline = "top"; g.font = `700 ${f.avv ? 24 : 28}px ${B}`; g.lineWidth = 6; g.strokeStyle = "rgba(0,0,0,.6)";
      const nome = cognome(n || ""); g.strokeText(nome, cx, cy + R0 + 6); g.fillStyle = "#fff"; g.fillText(nome, cx, cy + R0 + 6); g.textAlign = "left";
    });
    }
    g.textAlign = "center"; g.textBaseline = "top";
    g.font = `600 34px ${B}`; g.fillStyle = "#eef3ff"; g.fillText("Sfidami su Sliding Doors Serie A", W / 2, H - 160);
    g.font = `600 32px ${B}`; g.fillStyle = "#ff4d6d"; g.fillText("c1962-2012.github.io/sliding-doors", W / 2, H - 106);
    g.font = `500 26px ${B}`; g.fillStyle = "#93a4c3"; g.fillText("un'app di ciuffa62", W / 2, H - 56);
    return new Promise(res => c.toBlob(res, "image/png"));
  }
  const CAMPI = ["stagione", "mid", "comp", "casa", "ospite", "data", "ora", "slug", "eid", "t0", "lato", "modulo", "nome", "creata", "id"];
  const link = f => C.BASE + "#f=" + C.b64(["3", ...CAMPI.map(k => k === "creata" ? f.creata.slice(0, 16) : f[k]), f.xi.join("|"), f.avv ? f.avv.modulo : "", f.avv ? f.avv.xi.join("|") : ""].join("~"));
  async function manda(f){
    const T = titoloF(f), testo = `${f.avv ? `Le mie formazioni di ${T.t} – ${T.contro}` : `La mia formazione del ${T.t} contro ${T.contro}`}${f.comp !== "Serie A" ? " in " + f.comp : ""} (${f.modulo}). Aggiungila e sfidami su Sliding Doors Serie A: ${link(f)}`;
    C.condividi({ blob: await immagine(f), testo, nomeFile: `formazione-${T.t}-${(f.nome || "").replace(/[^\w]+/g, "-")}.png`, titolo: "La mia formazione", h2: "Manda la formazione", sub: "L'immagine arriva agli amici insieme al link: toccandolo, la tua formazione entra nel loro gruppo." });
  }
  function importa(cod){
    try {
      const parti = C.deb64(cod).split("~"), v = parti[0];
      let f;
      if (v === "1"){   // link della prima versione: solo campionato
        const [, stagione, k, lato, modulo, nome, creata, id, xi] = parti, m = trova(stagione, k);
        if (!m) return "Link della formazione non valido";
        f = { ...daSerieA(m), stagione, lato, modulo, nome, creata, id, xi };
      } else if (v === "2" && parti.length === CAMPI.length + 2 || v === "3" && parti.length === CAMPI.length + 4){
        f = Object.fromEntries(CAMPI.map((k, i) => [k, parti[i + 1]])); f.xi = parti[CAMPI.length + 1]; f.t0 = +f.t0;
        const am = parti[CAMPI.length + 2], ax = (parti[CAMPI.length + 3] || "").split("|");
        f.avv = v === "3" && am ? { modulo: am, xi: ax.map(x => x.slice(0, 60)) } : null;
        if (f.avv && (ax.length !== 11 || !/^\d(-\d){2,3}$/.test(am))) return "Link della formazione non valido";
      } else return "Link della formazione non valido";
      const lista = (f.xi || "").split("|");
      if (!/^[ha]$/.test(f.lato) || lista.length !== 11 || !/^\d(-\d){2,3}$/.test(f.modulo) || !f.t0) return "Link della formazione non valido";
      const l = leggi(), gia = l.find(x => x.id === f.id);
      if (gia) return gia.mia !== false ? "Questa è una tua formazione" : `La formazione di ${f.nome} c'è già`;
      l.push({ ...f, mia: false, nome: f.nome.slice(0, 20), creata: f.creata + ":00Z", xi: lista.map(x => x.slice(0, 60)) });
      scrivi(l);
      return `✅ Aggiunta la formazione di ${f.nome.slice(0, 20)}`;
    } catch(e){ return "Link della formazione non valido" }
  }
  const azioni = e => {
    const s = e.target.closest("[data-send]"); if (s){ const f = leggi().find(x => x.id === s.dataset.send); if (f) manda(f); return }
    const d = e.target.closest("[data-del]"); if (!d) return;
    if (!confirm("Vuoi eliminare questa formazione? Non si può recuperare.")) return;
    scrivi(leggi().filter(x => x.id !== d.dataset.del)); disegnaElenchi();
  };
  $("formList").addEventListener("click", azioni);
  $("formGroup").addEventListener("click", azioni);

  window.SD_formRender = () => { disegnaFirma(); disegnaNuova(); disegnaElenchi(); cercaUfficiali() };
  const daLink = () => {
    const m = location.hash.match(/^#f=([\w-]+)/); if (!m) return false;
    const esito = importa(m[1]);
    history.replaceState(null, "", location.pathname + location.search + "#formazione");
    showView("form"); C.avvisa(esito);
    setTimeout(() => $("formGroup").scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    return true;
  };
  // solo nell anteprima sul computer: #prova-chiusa finge che siano uscite le ufficiali della prossima partita della Roma, per vedere il blocco
  if (/^localhost$|^127./.test(location.hostname) && location.hash === "#prova-chiusa"){
    const p = partiteDi("Roma")[0], uff = leggiK(KEY_UFF, {});
    uff[p.mid] = { [p.casa === "Roma" ? "h" : "a"]: { modulo: "3-4-2-1", xi: rosa("Roma").slice(0, 11).map(x => x[0]) }, visto: Date.now() };
    scriviK(KEY_UFF, uff); bozza.mid = p.mid; bozza.giro = null;
    history.replaceState(null, "", location.pathname + location.search + "#formazione"); showView("form");
    setTimeout(() => $("formInfo").scrollIntoView({ block: "center" }), 400);
  }
  // solo nell anteprima sul computer: #prova-due riempie Roma – Monza con le due formazioni, per vedere il campo completo
  if (/^localhost$|^127./.test(location.hostname) && location.hash === "#prova-due"){
    const p = partiteDi("Roma").find(x => x.comp === "Serie A"), primi = (t, mod) => { const r = rosa(t), out = []; posti(mod).forEach(s => { const g = r.find(x => x[1] === s.r && !out.includes(x[0])) || r.find(x => !out.includes(x[0])); out.push(g[0]) }); return out };
    bozza.mid = p.mid; bozza.giro = null; bozza.me = { modulo: "3-4-2-1", xi: primi("Roma", "3-4-2-1") };
    const avv = p.casa === "Roma" ? p.ospite : p.casa; bozza.avv = { modulo: "4-3-3", xi: primi(avv, "4-3-3") };
    history.replaceState(null, "", location.pathname + location.search + "#formazione"); showView("form");
    setTimeout(() => $("formPitch").scrollIntoView({ block: "start" }), 500);
  }
  addEventListener("hashchange", daLink);
  if (!daLink() && currentView === "form"){ SD_formRender(); if (location.hash === "#formazione") [400, 1500, 3000].forEach(ms => setTimeout(() => { if (scrollY < 4000) document.querySelector(".frm-scegli").scrollIntoView({ block: "start" }) }, ms)) }
}
