// Video di YouTube di ogni partita di Serie A giocata: highlights e interviste del dopo partita.
// Per ogni partita si fa una ricerca su YouTube e si sceglie il video giusto controllando il titolo:
// le due squadre, la parola "highlights" (o "intervista", "conferenza"…), il risultato se c'è, e che sia uscito
// nei giorni subito dopo la partita (così non si prende una partita vecchia tra le stesse squadre).
// I video trovati restano in data-src/youtube.json e non si cercano più; si scrive proto/video-a.js:
// window.VIDEO_A = { "2026-27|Parma|Roma": ["idHighlights", "idIntervista"] }
// uso: node tools/video-a.js [stagione ...]   (senza stagione: quella in corso)
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, ".."), cacheFile = path.join(root, "data-src", "youtube.json"), out = path.join(root, "proto", "video-a.js");

const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const parole = s => norm(s).split(/[^a-z0-9]+/).filter(Boolean);
// la squadra è nel titolo come parola intera ("Inter" non deve trovare "intervista")
const ALIAS = { Milan: ["milan"], Inter: ["inter", "internazionale"], Verona: ["verona"], "Hellas Verona": ["verona", "hellas"], Roma: ["roma"], Napoli: ["napoli"],
  "Paris Saint-Germain": ["psg", "paris saint germain", "paris sg", "paris"], "Manchester City": ["manchester city", "man city", "city"], "VfB Stuttgart": ["stuttgart", "stoccarda"],
  "Borussia Dortmund": ["dortmund", "borussia dortmund", "bvb"], "Club Brugge": ["brugge", "bruges", "club brugge"], "Real Betis": ["betis"], "Sporting CP": ["sporting"],
  "Omonia Nicosia": ["omonia"], "Olympiacos": ["olympiacos", "olympiakos", "olimpiakos"], "AEK Athens": ["aek"], "Hapoel Be'er": ["hapoel", "beer sheva", "be er sheva"],
  "Levski Sofia": ["levski"], "Borac Banja Luka": ["borac"], "Riga FC": ["riga"], "Mjällby AIF": ["mjallby"], "Sabah FK": ["sabah"], "Liverpool": ["liverpool"], "Sunderland": ["sunderland"], "Ferencvaros": ["ferencvaros", "ferencvarosi"] };
const VUOTE = new Set(["fc", "ac", "as", "ss", "us", "club", "real", "sporting", "city", "united", "calcio", "cf", "sc", "fk", "aif", "cp"]);
function haSquadra(titolo, team) {
  const w = parole(titolo), testo = " " + w.join(" ") + " ";
  const nomi = ALIAS[team] || [parole(team).join(" "), ...parole(team).filter(x => x.length >= 4 && !VUOTE.has(x))];
  return nomi.some(n => testo.includes(" " + n + " "));
}

async function cerca(q) {
  for (let t = 0; t < 3; t++) {
    try {
      const r = await fetch("https://www.youtube.com/results?hl=it&gl=IT&search_query=" + encodeURIComponent(q), { headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "it-IT,it;q=0.9" } });
      const h = await r.text(), m = h.match(/var ytInitialData = (\{.*?\});<\/script>/s);
      if (m) {
        const lista = [];
        JSON.stringify(JSON.parse(m[1]), (k, v) => {
          if (v && v.videoRenderer) {
            const x = v.videoRenderer;
            lista.push({ id: x.videoId, t: (x.title.runs || []).map(r => r.text).join(""), c: ((x.ownerText || {}).runs || [{}])[0].text || "", p: (x.publishedTimeText || {}).simpleText || "", d: (x.lengthText || {}).simpleText || "" });
          }
          return v;
        });
        if (lista.length) return lista;
      }
    } catch { }
    await new Promise(r => setTimeout(r, 2000 * (t + 1)));
  }
  return null;
}

// "3 giorni fa" -> giorni passati (circa)
function giorniFa(p) {
  // YouTube scrive anche le forme brevi: "17 h fa", "1 g fa", "2 sett. fa"
  const m = norm(p).match(/(\d+)\s*(second|sec|minut|min|ore|ora|or|h\b|giorn|gg|g\b|settiman|sett|mes|ann)/);
  if (!m) return null;
  const n = +m[1], u = m[2];
  return /^(sec|min|or|h)/.test(u) ? 0 : u.startsWith("giorn") || u === "g" || u === "gg" ? n : u.startsWith("sett") ? n * 7 : u.startsWith("mes") ? n * 30 : n * 365;
}
const ESCLUSI = /primavera|women|femminil|classic|u19|u17|under|futsal|amarcord|storia|pes |fifa|efootball|simulat|prediction|pronostic|preview|probabil|live reaction|watchalong/i;

// è il video di quella partita? squadre giuste, niente altre categorie, uscito subito dopo la partita, risultato giusto se scritto
function adatto(v, h, a, gh, ga, giorniPartita, stagioneTag) {
  if (!haSquadra(v.t, h) || !haSquadra(v.t, a) || ESCLUSI.test(v.t) || ESCLUSI.test(v.c)) return false;
  const punteggi = [...v.t.matchAll(/\b(\d{1,2})\s*[-–:]\s*(\d{1,2})\b/g)].map(x => [+x[1], +x[2]]).filter(([x, y]) => x < 15 && y < 15 && !(x > 1900));
  if (punteggi.length && !punteggi.some(([x, y]) => x === gh && y === ga || x === ga && y === gh)) return false;
  const eta = giorniFa(v.p);
  const vicino = eta !== null && eta <= giorniPartita + 1 && eta >= giorniPartita - (giorniPartita > 60 ? 45 : giorniPartita > 20 ? 10 : 4);
  return vicino || stagioneTag.some(s => v.t.includes(s));
}
function scegliHighlights(lista, h, a, gh, ga, gp, tag) {
  const ok = lista.filter(v => /highlight|sintesi|gol e highlights|resumen/i.test(v.t) && adatto(v, h, a, gh, ga, gp, tag));
  const peso = v => (v.c === "Serie A" ? 0 : haSquadra(v.c, h) || haSquadra(v.c, a) ? 1 : /dazn|sky/i.test(v.c) ? 2 : 3);
  return ok.sort((x, y) => peso(x) - peso(y))[0] || null;
}
function candidatiIntervista(lista, h, a, gh, ga, gp, tag) {
  // solo interviste del DOPO partita: niente conferenze della vigilia; se il titolo non dice "post"/"dopo" deve essere uscito dal giorno della partita in poi
  const PRIMA = /pensiamo|prima d|vigilia|pre[\s-]?(partita|match|gara)|verso |presentazion|matchday press|anteprima/i, DOPO = /post|dopo|after|intervista|commento|reazion|parla/i;
  // niente dirette dei tifosi, podcast, analisi o notizie: solo interviste e conferenze stampa
  const NO = /podcast|\blive\b|watchalong|impazzisce|dimett|mercato|analisi|pagelle|tifosi|tifosiamo|reaction|reazione|moviola|news/i;
  const ok = lista.filter(v => /intervist|conferenza|press conference|rueda de prensa|parole d|post[\s-]?partita|dichiaraz|commento di|mister|allenatore/i.test(v.t) && !/highlight/i.test(v.t) && !PRIMA.test(v.t) && !NO.test(v.t) && !NO.test(v.c)
    && (DOPO.test(v.t) || gp <= 6 && (giorniFa(v.p) ?? 999) <= gp) && adatto(v, h, a, gh, ga, gp, tag));
  const peso = v => (DOPO.test(v.t) ? 0 : 2) + (haSquadra(v.c, h) || haSquadra(v.c, a) ? 0 : /dazn|sky|serie a|sportitalia|rai/i.test(v.c) ? 1 : 2);
  return ok.sort((x, y) => peso(x) - peso(y));
}

// Di quale squadra è un'intervista? 1) il canale è quello del club; 2) nel titolo c'è un allenatore
// imparato dai canali dei club ("Conferenza stampa di mister Vanoli" sul canale della Fiorentina);
// 3) nel titolo c'è il cognome di un giocatore della rosa. Se tocca a tutte e due o a nessuna, non si sa.
let ROSE = null;
const rose = () => ROSE ||= (() => { const w = {}; try { eval(fs.readFileSync(path.join(root, "proto", "rose-a.js"), "utf8").replace("window.ROSE_A", "w.R")) } catch { } return w.R ? w.R.squadre : {} })();
function nomiPersone(titolo) {
  const out = [], pat = [/mister\s+(\p{Lu}[\p{L}']+(?:\s+\p{Lu}[\p{L}']+)?)/giu, /press conference\s*\|\s*([^|]+?)\s*\|/giu, /conferenza stampa\s*(?:\|\s*)?(?:di\s+)?(?:mister\s+)?([\p{L}' ]+?)\s+dopo/giu,
    /le parole di\s+(?:mister\s+)?([\p{L}' ]+?)\s+(?:nel|dopo)/giu, /il commento di\s+([\p{L}' ]+?)\s*\|/giu, /^\W*(\p{Lu}[\p{Lu}' ]{3,}?)\s+(?:INTERVISTA|CONFERENZA|DOPO|IN CONFERENZA)/gu, /\|\s*([\p{L}' ]{4,}?)\s*\|\s*[\p{L} ]+-[\p{L} ]+\s*\|/gu];
  for (const p of pat) for (const m of titolo.matchAll(p)) if (m[1]) { const n = parole(m[1]).filter(x => x.length >= 4 && !/^(mister|conferenza|stampa|press|post|partita|intervista|dopo|parole)$/.test(x)); if (n.length) out.push(n[n.length - 1]) }
  return out;
}
// canale UFFICIALE del club: solo il nome della squadra più parole da club ("AS Roma", "Parma Calcio 1913", "ACF Fiorentina"),
// non "Milan News" o "CalcioNapoli24" che sono di tifosi e opinionisti
const DA_CLUB = new Set(["fc", "ac", "as", "ss", "ssc", "us", "bc", "acf", "cfc", "calcio", "official", "club", "hellas"]);
function ufficiale(canale, team) {
  const w = parole(canale), nome = new Set(parole(team));
  return haSquadra(canale, team) && w.every(x => nome.has(x) || DA_CLUB.has(x) || /^\d+$/.test(x));
}
// parole che non sono nomi di persona (squadre, parole comuni dei titoli)
const NON_NOMI = new Set(["match", "prima", "vigilia", "alla", "giorno", "mario", "torino", "sassuolo", "como", "roma", "udinese", "monza", "lecce", "milan", "inter", "lazio", "napoli", "juventus", "atalanta", "bologna", "genoa", "parma", "cagliari", "venezia", "frosinone", "fiorentina", "serie", "enilive", "giornata", "brividi", "nella", "dopo", "post"]);
// impara gli allenatori: nomi detti esplicitamente ("mister X", "conferenza stampa di X") sul canale ufficiale di un club;
// si conta quante volte ogni nome compare con ogni squadra e vince la squadra più frequente
function impara(lista, h, a, allenatori) {
  const R = rose(), giocatore = n => [h, a].some(t => ((R[t] || {}).rosa || []).some(p => parole(p[0]).pop() === n));
  for (const v of lista) for (const team of [h, a]) if (ufficiale(v.c, team))
    for (const n of nomiPersone(v.t)) if (!NON_NOMI.has(n) && !giocatore(n)) { const x = allenatori[n] ||= {}; x[team] = (x[team] || 0) + 1 }
}
const squadraDi = (x) => x ? Object.entries(x).sort((p, q) => q[1] - p[1])[0][0] : null;
function diChi(v, h, a, allenatori) {
  // prima le persone nel titolo: allenatori imparati e giocatori delle due rose
  const w = new Set(parole(v.t)), R = rose();
  const per = team => [...w].some(n => !NON_NOMI.has(n) && squadraDi(allenatori[n]) === team) || ((R[team] || {}).rosa || []).some(p => { const s = parole(p[0]).pop(); return s && s.length >= 4 && !NON_NOMI.has(s) && w.has(s) });
  const chi = [h, a].filter(per);
  if (chi.length === 1) return chi[0];
  if (chi.length > 1) return null;
  // nessuna persona riconosciuta: vale il canale ufficiale del club
  const ch = [h, a].filter(team => ufficiale(v.c, team));
  return ch.length === 1 ? ch[0] : null;
}

// cerca highlights e intervista che mancano a una partita; restituisce [ricerche fatte, video trovati]
async function cercaPartita(c, h, a, gh, ga, gp, tag, comp, anno) {
  let cercate = 0, trovate = 0;
  if (!c.hl) {
    const l = await cerca(`${h} ${a} ${gh}-${ga} highlights ${comp}`); cercate++;
    const v = l && scegliHighlights(l, h, a, gh, ga, gp, tag);
    if (v) { c.hl = v.id; c.hlT = v.t; trovate++ }
  }
  // interviste del dopo partita di TUTTE E DUE le squadre (solo campionato: per le coppe bastano gli highlights).
  // Si provano più ricerche finché si trova l'intervista di ciascuna squadra.
  if (comp.startsWith("Serie A")) {
    const allenatori = cacheGlobale._allenatori ||= {}, visti = [];
    const prova = l => { impara(l, h, a, allenatori); for (const v of candidatiIntervista(l, h, a, gh, ga, gp, tag)) { if (!visti.some(x => x.id === v.id)) visti.push(v) } };
    const assegna = () => { for (const v of visti) { const chi = diChi(v, h, a, allenatori); if (chi === h && !c.intH) { c.intH = v.id; c.intHT = v.t; trovate++ } if (chi === a && !c.intA) { c.intA = v.id; c.intAT = v.t; trovate++ } } };
    for (const q of [`${h} ${a} interviste post partita ${anno}`, `${h} intervista post partita ${h} ${a}`, `${a} intervista post partita ${h} ${a}`, `${h} ${a} conferenza stampa`]) {
      if (c.intH && c.intA) break;
      const l = await cerca(q); cercate++;
      if (l) { prova(l); assegna() }
    }
  }
  c.provata = Date.now();
  await new Promise(r => setTimeout(r, 400));
  return [cercate, trovate];
}

// partite di coppa già giocate in questa stagione con almeno una squadra di Serie A, da ESPN.
// I giorni passati restano in data-src/espn-coppe.json: si scaricano solo i giorni nuovi.
const COPPE = [["Coppa Italia", "ita.coppa_italia"], ["Champions League", "uefa.champions"], ["Europa League", "uefa.europa"], ["Conference League", "uefa.europa.conf"], ["Supercoppa", "ita.super_cup"]];
const NOMI = { "AC Milan": "Milan", "Internazionale": "Inter", "AS Roma": "Roma" };
async function partiteCoppa(righe, anno) {
  const file = path.join(root, "data-src", "espn-coppe.json"), giorni = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
  const squadre = new Set(righe.flatMap(m => [m[1], m[2]])), oggi = new Date().toISOString().slice(0, 10);
  const nome = n => NOMI[n] && squadre.has(NOMI[n]) ? NOMI[n] : squadre.has(n) ? n : null;
  const date = [];
  for (let d = new Date(anno + "-07-15T12:00:00Z"); d.toISOString().slice(0, 10) <= oggi; d = new Date(d.getTime() + 864e5)) date.push(d.toISOString().slice(0, 10));
  for (const [comp, slug] of COPPE) {
    const daFare = date.filter(g => !giorni[slug + "|" + g] || g >= new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10));
    for (let i = 0; i < daFare.length; i += 10) {
      await Promise.all(daFare.slice(i, i + 10).map(async g => {
        for (let t = 0; t < 3; t++) {
          try {
            const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard?dates=${g.replace(/-/g, "")}`);
            if (r.ok) {
              const ev = (await r.json()).events || [];
              giorni[slug + "|" + g] = ev.filter(e => e.status.type.state === "post" && e.status.type.completed).map(e => {
                const c = e.competitions[0].competitors, H = c.find(x => x.homeAway === "home"), A = c.find(x => x.homeAway === "away");
                return H && A && (nome(H.team.displayName) || nome(A.team.displayName)) ? [comp, slug, e.id, new Date(e.date).toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" }), nome(H.team.displayName) || H.team.displayName, nome(A.team.displayName) || A.team.displayName, +H.score, +A.score] : null;
              }).filter(Boolean);
              return;
            }
          } catch { }
          await new Promise(r => setTimeout(r, 1000));
        }
      }));
    }
  }
  fs.writeFileSync(file, JSON.stringify(giorni));
  const visti = new Set();
  return Object.values(giorni).flat().filter(p => p[3] >= anno + "-07-15" && !visti.has(p[2]) && visti.add(p[2])).sort((x, y) => x[3].localeCompare(y[3]));
}

let cacheGlobale = {};
async function aggiorna(SERIE_A, stagioni) {
  const cache = cacheGlobale = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, "utf8")) : {};
  let cercate = 0, trovate = 0;
  for (const s of stagioni) {
    const [y1, y2] = s.split("-"), tag = [`${y1}/${y2}`, `${y1}-${y2}`, `${y1}/20${y2}`, `${y1}-20${y2}`];
    const giocate = (SERIE_A[s] || []).filter(m => m[3] !== null);
    for (const [data, h, a, gh, ga] of giocate) {
      const k = `${s}|${h}|${a}`, c = cache[k] ||= {};
      const gp = Math.round((Date.now() - Date.parse(data + "T20:00:00Z")) / 864e5);
      // si ricerca finché manca qualcosa, ma non per sempre: le partite vecchie si provano una volta sola
      if (c.hl && c.intH && c.intA) continue;
      if (c.provata && (gp > 14 || Date.now() - c.provata < (gp <= 2 ? 50 * 6e4 : 6 * 36e5))) continue;
      const n = await cercaPartita(c, h, a, gh, ga, gp, tag, `Serie A ${y1}/${y2}`, y1); cercate += n[0]; trovate += n[1];
    }
  }
  // partite di coppa delle squadre di Serie A (Coppa Italia, Champions, Europa, Conference, Supercoppa)
  const stagione = stagioni[stagioni.length - 1], [y1, y2] = stagione.split("-"), tag = [`${y1}/${y2}`, `${y1}-${y2}`, `${y1}/20${y2}`, `${y1}-20${y2}`];
  const coppe = await partiteCoppa(SERIE_A[stagione] || [], +y1);
  for (const p of coppe) {
    const [comp, , id, data, h, a, gh, ga] = p, c = cache["C|" + id] ||= {};
    const gp = Math.round((Date.now() - Date.parse(data + "T20:00:00Z")) / 864e5);
    if (c.hl || c.provata && (gp > 14 || Date.now() - c.provata < (gp <= 2 ? 50 * 6e4 : 6 * 36e5))) continue;
    const n = await cercaPartita(c, h, a, gh, ga, gp, tag, comp, y1); cercate += n[0]; trovate += n[1];
  }
  fs.writeFileSync(cacheFile, JSON.stringify(cache));
  const video = {};
  // [highlights, intervista squadra di casa, intervista squadra ospite]; per le coppe solo gli highlights
  for (const [k, c] of Object.entries(cache)) if (!k.startsWith("_") && (c.hl || c.intH || c.intA)) video[k] = k.startsWith("C|") ? [c.hl || ""] : [c.hl || "", c.intH || "", c.intA || ""];
  const testo = "window.VIDEO_A=" + JSON.stringify(video) + ";window.COPPE_GIOCATE=" + JSON.stringify(coppe) + ";";
  const cambiato = !fs.existsSync(out) || fs.readFileSync(out, "utf8") !== testo;
  if (cambiato) fs.writeFileSync(out, testo);
  return { cambiato, cercate, trovate, partite: Object.keys(video).length };
}
module.exports = { aggiorna };

if (require.main === module) {
  global.window = {};
  eval(fs.readFileSync(path.join(root, "proto", "data.js"), "utf8"));
  const stagioni = process.argv.slice(2).length ? process.argv.slice(2) : [Object.keys(window.SERIE_A).sort().pop()];
  aggiorna(window.SERIE_A, stagioni).then(r => console.log(JSON.stringify(r)));
}
