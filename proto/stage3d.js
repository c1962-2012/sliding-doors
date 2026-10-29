// Palco 3D. Un podio su un prato illuminato: da un lato la realtà, dall'altro il tuo universo.
// Quando cambi la storia il prato ruota verso il tuo universo; si gira anche trascinando.
// Su PC c'è in più la classifica della Serie A a colonne. Senza WebGL si vede un podio disegnato in CSS.
(function () {
  const PC = (window.SD_MODE || "pc") === "pc";
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const stageHost = document.getElementById("stage3d");
  const boardHost = document.getElementById("board3d");
  const hasGL = (() => { try { const c = document.createElement("canvas"); return !!(window.THREE && (c.getContext("webgl2") || c.getContext("webgl"))) } catch (e) { return false } })();
  const DISPLAY = '"Big Shoulders Display", Impact, "Arial Narrow", sans-serif';

  // ---------- utilità ----------
  function textCanvas(w, h, draw) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding;
    return t;
  }
  function luminance(hex) { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255 }
  function fitText(ctx, txt, maxW, size, weight) {
    let s = size;
    do { ctx.font = `${weight} ${s}px ${DISPLAY}`; s -= 2 } while (ctx.measureText(txt).width > maxW && s > 18);
  }
  // visibile e tab in primo piano: altrimenti non si disegna (risparmia batteria)
  function watchVisible(el, cb) {
    let vis = true;
    if ("IntersectionObserver" in window) new IntersectionObserver(es => { vis = es[0].isIntersecting; cb(vis && !document.hidden) }).observe(el);
    document.addEventListener("visibilitychange", () => cb(vis && !document.hidden));
  }

  // ---------- riserva CSS ----------
  function cssPodium(state) {
    if (!stageHost) return;
    const blk = (t, rank) => {
      if (!t) return "";
      const [k1] = window.clubColors(t);
      return `<div class="blk p${rank}" style="--k1:${k1}">${rank === 1 ? '<span class="cup">🏆</span>' : ""}<b>${rank}</b>${t}</div>`;
    };
    const top = state.changed ? state.alt : state.real;
    stageHost.innerHTML = `<div class="podium-css">${blk(top[1], 2)}${blk(top[0], 1)}${blk(top[2], 3)}</div>`;
  }

  // ---------- podio 3D ----------
  function makePodium(host) {
    const renderer = new THREE.WebGLRenderer({ antialias: PC, alpha: true, powerPreference: PC ? "high-performance" : "low-power" });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, PC ? 2 : 1.25));
    if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = PC;
    if (PC) renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x040912, 16, 34);
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);

    scene.add(new THREE.HemisphereLight(0x9cc4ff, 0x0b3a20, 0.7));
    [[-7, 11, 7], [7, 11, 7], [0, 11, -8]].forEach(([x, y, z], k) => {
      const s = new THREE.SpotLight(k === 2 ? 0xffe2a8 : 0xffffff, PC ? 1.6 : 1.3, 40, 0.5, 0.55, 1.2);
      s.position.set(x, y, z); s.target.position.set(0, 0.8, 0);
      s.castShadow = PC; if (PC) { s.shadow.mapSize.set(1024, 1024); s.shadow.bias = -0.0004 }
      scene.add(s, s.target);
    });

    // prato a strisce
    const pitch = textCanvas(512, 512, (g, w, h) => {
      for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? "#0f6a3c" : "#13804a"; g.fillRect(0, i * h / 12, w, h / 12) }
      g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 5;
      g.beginPath(); g.arc(w / 2, h / 2, 90, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
      // firma dell'autore dipinta sul prato, sui due lati
      g.fillStyle = "rgba(255,255,255,.35)"; g.font = `800 34px ${DISPLAY}`; g.textAlign = "center";
      g.fillText("ciuffa62", w / 2, h - 34);
      g.save(); g.translate(w / 2, 34); g.rotate(Math.PI); g.fillText("ciuffa62", 0, 0); g.restore();
    });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(6.2, PC ? 72 : 40), new THREE.MeshStandardMaterial({ map: pitch, roughness: 0.9 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
    const ring = new THREE.Mesh(new THREE.RingGeometry(6.2, 6.42, PC ? 96 : 48), new THREE.MeshBasicMaterial({ color: 0x22e08b, transparent: true, opacity: 0.75 }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01;

    const turntable = new THREE.Group();
    turntable.add(floor, ring);
    scene.add(turntable);

    const gold = new THREE.MeshStandardMaterial({ color: 0xffc83a, metalness: 0.85, roughness: 0.25, emissive: 0x3a2600, emissiveIntensity: 0.6 });
    function trophy() {
      const g = new THREE.Group();
      const prof = [[0, 0], [0.32, 0], [0.32, 0.08], [0.12, 0.14], [0.08, 0.42], [0.2, 0.52], [0.36, 0.78], [0.42, 1.08], [0.4, 1.12], [0, 1.0]].map(([x, y]) => new THREE.Vector2(x, y));
      const cup = new THREE.Mesh(new THREE.LatheGeometry(prof, PC ? 40 : 20), gold);
      cup.castShadow = PC;
      [-1, 1].forEach(sd => { const h = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.035, 10, 24, Math.PI * 1.3), gold); h.position.set(sd * 0.42, 0.82, 0); h.rotation.z = sd > 0 ? -Math.PI * 0.65 : Math.PI * 0.35; g.add(h) });
      g.add(cup);
      return g;
    }

    const H = [1.05, 1.6, 0.75], X = [-1.75, 0, 1.75], W = 1.55, D = 1.3; // ordine: 2°, 1°, 3°
    function makeSet(front) {
      const grp = new THREE.Group();
      grp.position.z = front ? 1.05 : -1.05; grp.rotation.y = front ? 0 : Math.PI;
      const blocks = H.map((h, k) => {
        const side = new THREE.MeshStandardMaterial({ color: 0x334466, roughness: 0.45, metalness: 0.15 });
        const face = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
        const m = new THREE.Mesh(new THREE.BoxGeometry(W, h, D), [side, side, side, side, face, side]);
        m.position.set(X[k], h / 2, 0); m.castShadow = PC; m.receiveShadow = PC;
        grp.add(m);
        return { m, side, face, h };
      });
      const cup = trophy(); cup.position.set(0, H[1], 0); cup.scale.setScalar(0.95); grp.add(cup);
      const tagMat = new THREE.MeshBasicMaterial({ transparent: true });
      const tag = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.6), tagMat);
      tag.rotation.x = -Math.PI / 2; tag.position.set(0, 0.02, D / 2 + 0.75);
      grp.add(tag);
      turntable.add(grp);
      return { blocks, cup, tagMat, front };
    }
    const sets = [makeSet(true), makeSet(false)];

    function paint(set, teams, title) {
      [teams[1], teams[0], teams[2]].forEach((t, k) => {
        const b = set.blocks[k], rank = [2, 1, 3][k];
        const [c1, c2] = t ? window.clubColors(t) : ["#334466", "#ffffff"];
        b.side.color.set(c1);
        if (b.face.map) b.face.map.dispose();
        const ratio = W / b.h;
        b.face.map = textCanvas(512, Math.round(512 / ratio), (g, w, h) => {
          const grd = g.createLinearGradient(0, 0, 0, h);
          grd.addColorStop(0, c1); grd.addColorStop(1, "#05070d");
          g.fillStyle = grd; g.fillRect(0, 0, w, h);
          g.fillStyle = c2; g.fillRect(0, 0, w, 10);
          const ink = luminance(c1) > 0.6 ? "#0a0f1a" : "#ffffff";
          g.textAlign = "center"; g.fillStyle = ink;
          g.font = `800 ${Math.min(h * 0.5, 190)}px ${DISPLAY}`; g.fillText(String(rank), w / 2, Math.min(h * 0.5, 190) + 18);
          g.fillStyle = "#ffffff"; g.shadowColor = "rgba(0,0,0,.8)"; g.shadowBlur = 10;
          fitText(g, (t || "–").toUpperCase(), w - 40, 72, 800);
          g.fillText((t || "–").toUpperCase(), w / 2, h - 28);
        });
        b.face.needsUpdate = true;
      });
      if (set.tagMat.map) set.tagMat.map.dispose();
      set.tagMat.map = textCanvas(1024, 146, (g, w, h) => {
        g.textAlign = "center"; g.font = `800 92px ${DISPLAY}`;
        g.fillStyle = set.front ? "rgba(255,255,255,.92)" : "#ffcf4a";
        g.shadowColor = set.front ? "rgba(120,170,255,.9)" : "rgba(255,207,74,.9)"; g.shadowBlur = 24;
        g.fillText(title, w / 2, 108);
      });
      set.tagMat.needsUpdate = true;
    }

    // coriandoli nei colori della nuova vincitrice
    const N = REDUCE ? 0 : PC ? 320 : 80;
    const cgeo = new THREE.BufferGeometry(), pos = new Float32Array(N * 3), col = new Float32Array(N * 3), vel = new Float32Array(N * 3);
    cgeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    cgeo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const cmat = new THREE.PointsMaterial({ size: PC ? 0.11 : 0.15, vertexColors: true, transparent: true, opacity: 0 });
    const confetti = new THREE.Points(cgeo, cmat);
    scene.add(confetti);
    let confT = 0;
    function burst(team) {
      if (!N) return;
      const cs = window.clubColors(team).concat(["#ffcf4a"]).map(c => new THREE.Color(c));
      for (let i = 0; i < N; i++) {
        pos.set([(Math.random() - .5) * 2, 3.2 + Math.random(), (Math.random() - .5) * 2], i * 3);
        vel.set([(Math.random() - .5) * 5, 2 + Math.random() * 4, (Math.random() - .5) * 5], i * 3);
        const c = cs[i % cs.length]; col.set([c.r, c.g, c.b], i * 3);
      }
      cgeo.attributes.color.needsUpdate = true;
      confT = 3.2; wake();
    }

    // rotazione: 0 = realtà davanti, PI = il tuo universo
    let angle = 0, target = 0, drag = null, running = false, visible = true, last = 0;
    const el = renderer.domElement;
    el.addEventListener("pointerdown", e => { drag = { x: e.clientX, a: angle }; el.setPointerCapture(e.pointerId); wake() });
    el.addEventListener("pointermove", e => { if (drag) { angle = drag.a + (e.clientX - drag.x) * 0.012; target = angle; wake() } });
    const release = () => { if (!drag) return; drag = null; const turns = Math.round(angle / Math.PI); target = turns * Math.PI; setFace(Math.abs(turns) % 2 ? "alt" : "real", true) };
    el.addEventListener("pointerup", release); el.addEventListener("pointercancel", release);

    let onFace = () => {};
    function setFace(face, fromDrag) {
      if (!fromDrag) { const base = Math.round(angle / (2 * Math.PI)) * 2 * Math.PI; target = base + (face === "alt" ? Math.PI : 0); if (REDUCE) angle = target }
      onFace(face); wake();
    }

    function resize() {
      const w = host.clientWidth || 600, h = host.clientHeight || 360;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const far = Math.max(1, 1.55 / camera.aspect);
      camera.position.set(0, 3.1 * far, 8.4 * far); camera.lookAt(0, 1.15, 0);
      camera.updateProjectionMatrix(); wake();
    }
    new ResizeObserver(resize).observe(host);
    watchVisible(host, v => { visible = v; if (v) wake() });

    function frame(t) {
      const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
      if (!drag) angle += (target - angle) * (REDUCE ? 1 : Math.min(1, dt * 4));
      const idle = PC && !REDUCE ? Math.sin(t / 2600) * 0.06 : 0;
      turntable.rotation.y = angle + idle;
      sets.forEach(s => s.cup.rotation.y += dt * 0.6);
      if (confT > 0) {
        confT -= dt;
        for (let i = 0; i < N; i++) { vel[i * 3 + 1] -= 6 * dt; for (let a = 0; a < 3; a++) pos[i * 3 + a] += vel[i * 3 + a] * dt }
        cgeo.attributes.position.needsUpdate = true;
        cmat.opacity = Math.min(1, confT);
      } else cmat.opacity = 0;
      renderer.render(scene, camera);
      const moving = drag || Math.abs(target - angle) > 0.001 || confT > 0;
      running = visible && (PC && !REDUCE || moving);
      if (running) requestAnimationFrame(frame);
    }
    function wake() { if (!running && visible) { running = true; last = performance.now(); requestAnimationFrame(frame) } }

    let lastAlt = null;
    return {
      onFace(fn) { onFace = fn },
      setFace,
      update(st) {
        paint(sets[0], st.real, "REALTÀ");
        paint(sets[1], st.alt, "IL TUO UNIVERSO");
        const key = st.view + "|" + st.alt[0];
        if (lastAlt !== null && st.changed && key !== lastAlt) burst(st.alt[0]);
        lastAlt = key;
        setFace(st.changed ? "alt" : "real");
        resize();
      }
    };
  }

  // ---------- classifica 3D (solo PC) ----------
  function makeBoard(host) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    scene.add(new THREE.HemisphereLight(0xaaccff, 0x0b2a18, 0.8));
    const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(4, 8, 6); scene.add(key);
    const group = new THREE.Group(); scene.add(group);
    const base = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.12, 2.2), new THREE.MeshStandardMaterial({ color: 0x0f6a3c, roughness: 0.9 }));
    base.position.y = -0.06; group.add(base);
    const cols = [];
    let angle = -0.35, drag = null, running = false, visible = true;
    const el = renderer.domElement;
    el.addEventListener("pointerdown", e => { drag = { x: e.clientX, a: angle }; el.setPointerCapture(e.pointerId); wake() });
    el.addEventListener("pointermove", e => { if (drag) { angle = Math.max(-1.1, Math.min(1.1, drag.a + (e.clientX - drag.x) * 0.008)); wake() } });
    el.addEventListener("pointerup", () => drag = null);

    function sprite(txt, color) {
      const tex = textCanvas(256, 128, (g, w, h) => {
        g.textAlign = "center"; g.fillStyle = color; g.font = `800 64px ${DISPLAY}`;
        g.shadowColor = "rgba(0,0,0,.9)"; g.shadowBlur = 8; g.fillText(txt, w / 2, 84);
      });
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
      s.scale.set(0.9, 0.45, 1);
      return s;
    }
    function resize() {
      const w = host.clientWidth || 700, h = host.clientHeight || 300;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      const far = Math.max(1, 2.2 / camera.aspect);
      camera.position.set(0, 4.2, 11.5 * far); camera.lookAt(0, 1.6, 0);
      camera.updateProjectionMatrix(); wake();
    }
    new ResizeObserver(resize).observe(host);
    watchVisible(host, v => { visible = v; if (v) wake() });

    function frame() {
      group.rotation.y += (angle - group.rotation.y) * 0.15;
      let moving = Math.abs(angle - group.rotation.y) > 0.001 || drag;
      cols.forEach(c => { const d = c.target - c.mesh.scale.y; if (Math.abs(d) > 0.002) { c.mesh.scale.y += d * (REDUCE ? 1 : 0.12); moving = true } c.mesh.position.y = c.mesh.scale.y / 2; c.label.position.y = c.mesh.scale.y + 0.35 });
      renderer.render(scene, camera);
      running = visible && moving;
      if (running) requestAnimationFrame(frame);
    }
    function wake() { if (!running && visible) { running = true; requestAnimationFrame(frame) } }

    return {
      update(rows) {
        cols.forEach(c => { group.remove(c.mesh, c.ghost, c.label); c.label.material.map.dispose() });
        cols.length = 0;
        const max = Math.max(1, ...rows.map(r => Math.max(r.alt, r.real))), S = 3.6 / max, n = rows.length, step = 12 / n;
        rows.forEach((r, k) => {
          const [c1] = window.clubColors(r.team), x = -6 + step / 2 + k * step;
          const mesh = new THREE.Mesh(new THREE.BoxGeometry(step * 0.72, 1, 0.8), new THREE.MeshStandardMaterial({ color: c1, roughness: 0.35, metalness: 0.2, emissive: new THREE.Color(c1), emissiveIntensity: 0.12 }));
          mesh.position.x = x; mesh.scale.y = 0.001;
          const gh = Math.max(0.001, r.real * S);
          const ghost = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(step * 0.8, gh, 0.86)), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28 }));
          ghost.position.set(x, gh / 2, 0);
          const label = sprite(`${r.team.slice(0, 3).toUpperCase()} ${r.alt}`, r.alt !== r.real ? "#ffcf4a" : "#ffffff");
          label.position.x = x;
          group.add(mesh, ghost, label);
          cols.push({ mesh, ghost, label, target: Math.max(0.001, r.alt * S) });
        });
        resize();
      }
    };
  }

  // ---------- collegamento con l'app ----------
  const faceUI = document.getElementById("stageFace");
  const titleUI = document.getElementById("stageTitle");
  let podium = null, board = null;
  if (hasGL && stageHost) { try { podium = makePodium(stageHost) } catch (e) { podium = null } }
  if (hasGL && PC && boardHost) { try { board = makeBoard(boardHost) } catch (e) { board = null } }
  if (!board && boardHost && boardHost.closest(".board")) boardHost.closest(".board").hidden = true;

  function markFace(f) { if (faceUI) faceUI.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.face === f)) }
  if (podium) podium.onFace(markFace);
  if (faceUI) faceUI.addEventListener("click", e => {
    const b = e.target.closest("[data-face]"); if (!b) return;
    if (podium) podium.setFace(b.dataset.face); else { markFace(b.dataset.face); window.SD_STATE && cssPodium({ ...window.SD_STATE, changed: b.dataset.face === "alt" }) }
  });

  function apply(st) {
    if (!st) return;
    if (titleUI) titleUI.innerHTML = `${st.title}<small>${st.sub}</small>`;
    if (podium) podium.update(st); else { cssPodium(st); markFace(st.changed ? "alt" : "real") }
    if (board && st.board) board.update(st.board);
  }
  window.addEventListener("sd:state", e => apply(e.detail));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => apply(window.SD_STATE));
  apply(window.SD_STATE);
})();
