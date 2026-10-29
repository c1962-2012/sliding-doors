// Ricava mobile.html dalla pagina PC: modalità leggera, podio più basso, niente classifica 3D
const fs = require("fs"), path = require("path");
const src = process.argv[2], out = path.join(path.dirname(src), "mobile.html");
let h = fs.readFileSync(src, "utf8");
const swap = (a, b) => { if (!h.includes(a)) throw new Error("manca: " + a); h = h.replace(a, b) };
swap("<title>Sliding Doors Serie A</title>", "<title>Sliding Doors Tascabile</title>");
swap('window.SD_MODE = "pc";', 'window.SD_MODE = "mobile";');
swap('<div class="stage-canvas" id="stage3d"></div>', '<div class="stage-canvas" id="stage3d" style="--stage-h:270px"></div>');
swap('<div class="board"><div class="stage-canvas" id="board3d"></div></div>\n', "");
swap(" Le colonne sono i punti nel tuo universo, il contorno bianco quelli reali.", "");
swap('<div class="stage-hint">Trascina per girare</div>', '<div class="stage-hint">Scorri col dito per girare</div>');
fs.writeFileSync(out, h);
console.log("scritto", out);
