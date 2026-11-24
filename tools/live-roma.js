// Controlla se il canale YouTube ufficiale dell'AS Roma è in diretta (conferenze stampa, eventi) e scrive live-roma.json.
// uso: node tools/live-roma.js <file di uscita>
// La pagina /live del canale rimanda alla diretta se c'è, altrimenti resta sul canale: si legge "isLiveNow" e il titolo.
const fs = require("fs");
const CANALE = "https://www.youtube.com/@asroma";
(async () => {
  const out = { live: false, checked: new Date().toISOString(), canale: CANALE };
  try {
    const r = await fetch(CANALE + "/live", { headers: { "user-agent": "Mozilla/5.0", "accept-language": "it-IT,it;q=0.9" } });
    const h = await r.text();
    const canon = (h.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || "";
    const id = (canon.match(/watch\?v=([\w-]{11})/) || [])[1];
    if (id && /"liveBroadcastDetails":\{"isLiveNow":true/.test(h)) {
      const t = (h.match(/<meta property="og:title" content="([^"]*)"/) || [])[1] || "Diretta AS Roma";
      out.live = true; out.videoId = id; out.titolo = t.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      out.conferenza = /conferenz|press conference|presser/i.test(out.titolo);   // conferenza stampa: l'avviso scatta solo per queste
    }
    out.ok = true;
  } catch (e) { out.ok = false; out.errore = e.message }
  fs.writeFileSync(process.argv[2] || "live-roma.json", JSON.stringify(out));
  console.log(JSON.stringify(out));
})();
