/* ============================================================
   SPARSH HQ v3 — kit.js
   The prop shop. Every piece is built from rounded, bevelled
   primitives so edges catch light like a Pixar set.
   Units: metres. y is up. Floor plane at y = 0.
   ============================================================ */

const Kit = {
  FONT: '"Outfit","Segoe UI",sans-serif',
  _mats: {}, _geo: {},

  /* ---------------- materials ---------------- */
  M(hex, o = {}) {
    const key = hex + JSON.stringify(o);
    if (Kit._mats[key]) return Kit._mats[key];
    const m = new THREE.MeshStandardMaterial({
      color: hex,
      roughness: o.rough !== undefined ? o.rough : 0.72,
      metalness: o.metal !== undefined ? o.metal : 0.04,
      envMapIntensity: o.env !== undefined ? o.env : 1,
    });
    if (o.emissive !== undefined) { m.emissive = new THREE.Color(o.emissive); m.emissiveIntensity = o.ei !== undefined ? o.ei : 1; }
    if (o.opacity !== undefined) { m.transparent = true; m.opacity = o.opacity; if (o.opacity < 0.6) m.depthWrite = false; }
    if (o.side) m.side = o.side;
    if (o.flat) m.flatShading = true;
    Kit._mats[key] = m;
    return m;
  },
  // pure glow (ignores lighting, feeds bloom)
  G(hex, k = 1.4) {
    const key = "G" + hex + k;
    if (Kit._mats[key]) return Kit._mats[key];
    const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), toneMapped: false });
    Kit._mats[key] = m;
    return m;
  },
  glassM(tint = 0x9fd0ff, opacity = 0.12) {
    return Kit.M(tint, { rough: 0.04, metal: 0.85, opacity, side: THREE.DoubleSide, env: 2.2 });
  },
  metal(hex = 0x9aa0aa, rough = 0.28) { return Kit.M(hex, { metal: 0.9, rough, env: 1.3 }); },
  gold() { return Kit.M(0xd9a441, { metal: 0.95, rough: 0.22, env: 1.6 }); },

  /* ---------------- geometry ---------------- */
  geo(key, make) { return Kit._geo[key] || (Kit._geo[key] = make()); },

  rboxGeo(w, h, d, r) {
    r = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
    if (r <= 0.004) return Kit.geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
    return Kit.geo(`rb${w},${h},${d},${r}`, () => new THREE.RoundedBoxGeometry(w, h, d, 2, r));
  },

  // box with texture UVs scaled to world metres (for walls/floors)
  worldBox(w, h, d, tile) {
    return Kit.geo(`wb${w},${h},${d},${tile}`, () => {
      const g = new THREE.BoxGeometry(w, h, d);
      const uv = g.attributes.uv;
      const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
      for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) {
        const i = f * 4 + v;
        uv.setXY(i, uv.getX(i) * dims[f][0] / tile, uv.getY(i) * dims[f][1] / tile);
      }
      return g;
    });
  },

  _prep(m, o) {
    m.castShadow = o.cast !== false;
    m.receiveShadow = o.recv !== false;
    if (o.rx) m.rotation.x = o.rx;
    if (o.ry) m.rotation.y = o.ry;
    if (o.rz) m.rotation.z = o.rz;
    if (o.sx || o.sy || o.sz) m.scale.set(o.sx || 1, o.sy || 1, o.sz || 1);
    return m;
  },

  // B: rounded box into a parent (Object3D)
  B(p, w, h, d, mat, x, y, z, o = {}) {
    const m = new THREE.Mesh(Kit.rboxGeo(w, h, d, o.r !== undefined ? o.r : 0.015), mat);
    m.position.set(x, y, z);
    p.add(Kit._prep(m, o));
    return m;
  },
  C(p, rt, rb, h, mat, x, y, z, o = {}) {
    const seg = o.seg || 20;
    const m = new THREE.Mesh(Kit.geo(`c${rt},${rb},${h},${seg},${o.open || 0}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, !!o.open)), mat);
    m.position.set(x, y, z);
    p.add(Kit._prep(m, o));
    return m;
  },
  S(p, r, mat, x, y, z, o = {}) {
    const seg = o.seg || 18;
    const m = new THREE.Mesh(Kit.geo(`s${r},${seg}`, () => new THREE.SphereGeometry(r, seg, Math.max(8, seg * 0.7 | 0))), mat);
    m.position.set(x, y, z);
    p.add(Kit._prep(m, o));
    return m;
  },
  T(p, R, r, mat, x, y, z, o = {}) {
    const arc = o.arc || Math.PI * 2;
    const m = new THREE.Mesh(Kit.geo(`t${R},${r},${arc}`, () => new THREE.TorusGeometry(R, r, 10, 28, arc)), mat);
    m.position.set(x, y, z);
    p.add(Kit._prep(m, o));
    return m;
  },
  L(p, pts, mat, x, y, z, o = {}) {
    const key = "l" + pts.map((q) => q.join(",")).join(";") + (o.seg || 24);
    const m = new THREE.Mesh(Kit.geo(key, () => new THREE.LatheGeometry(pts.map((q) => new THREE.Vector2(q[0], q[1])), o.seg || 24)), mat);
    m.position.set(x, y, z);
    p.add(Kit._prep(m, o));
    return m;
  },
  // capsule (r128 has no CapsuleGeometry) — a lathe profile
  capGeo(r, len) {
    return Kit.geo(`cap${r},${len}`, () => {
      const pts = [];
      for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 + (i / 6) * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r - len / 2)); }
      for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r + len / 2)); }
      return new THREE.LatheGeometry(pts, 14);
    });
  },
  P(p, r, len, mat, x, y, z, o = {}) {
    const m = new THREE.Mesh(Kit.capGeo(r, len), mat);
    m.position.set(x, y, z);
    p.add(Kit._prep(m, o));
    return m;
  },

  grp(F, x, z, ry = 0, y = 0) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = ry;
    F.group.add(g);
    return g;
  },

  /* ---------------- collision & AO ---------------- */
  collide(F, cx, cz, w, d, ry = 0, o = {}) {
    const c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry));
    const hw = (w * c + d * s) / 2, hd = (w * s + d * c) / 2;
    F.colliders.push({ x1: cx - hw, z1: cz - hd, x2: cx + hw, z2: cz + hd });
    if (o.ao !== false) F.ao.push({ x: cx, z: cz, w, d, ry, k: o.aoK || 1 });
  },
  // footprint given in a group's local space
  colLocal(F, g, lx, lz, w, d, o) {
    const c = Math.cos(g.rotation.y), s = Math.sin(g.rotation.y);
    Kit.collide(F, g.position.x + lx * c + lz * s, g.position.z - lx * s + lz * c, w, d, g.rotation.y, o);
  },
  aoLocal(F, g, lx, lz, w, d, k = 0.7) {
    const c = Math.cos(g.rotation.y), s = Math.sin(g.rotation.y);
    F.ao.push({ x: g.position.x + lx * c + lz * s, z: g.position.z - lx * s + lz * c, w, d, ry: g.rotation.y, k });
  },

  /* interactable hotspot */
  hot(F, o) {
    F.interact.push(Object.assign({ r: 1.8, y: 1.4 }, o));
  },

  /* ---------------- canvas helpers ---------------- */
  canvasTex(w, h, draw) {
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d");
    draw(ctx, w, h);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex._cv = cv; tex._ctx = ctx;
    return tex;
  },

  // dynamic screen (redrawn at fps)
  screen(F, w, h, drawFn, x, y, z, ry = 0, o = {}) {
    const pw = o.px || 512, ph = Math.round(pw * (h / w));
    const tex = Kit.canvasTex(pw, ph, (c, cw, ch) => drawFn(c, cw, ch, 0));
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: !!o.transparent, toneMapped: false });
    if (o.glow) mat.color.setScalar(o.glow);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z); m.rotation.y = ry;
    (o.parent || F.group).add(m);
    if (o.fps !== 0) {
      const step = 1 / (o.fps || 3);
      let acc = Math.random() * step, wp = null;            // staggered so screens don't all redraw on one frame
      F.dynamic.push({ update(dt, t) {
        acc += dt; if (acc < step) return;
        acc = 0;
        if (!wp) { wp = new THREE.Vector3(); m.getWorldPosition(wp); }
        if (Game.player && Math.hypot(Game.player.x - wp.x, Game.player.z - wp.z) > (pw > 400 ? 15 : 11)) return;   // nobody's reading it
        drawFn(tex._ctx, pw, ph, t); tex.needsUpdate = true;
      } });
    }
    if (o.decor !== false && !o.parent) F.decor.push(m);
    return m;
  },

  poster(F, w, h, draw, x, y, z, ry = 0, o = {}) {
    const pw = o.px || 512, ph = Math.round(pw * (h / w));
    const tex = Kit.canvasTex(pw, ph, draw);
    const mat = o.lit
      ? new THREE.MeshStandardMaterial({ map: tex, transparent: !!o.transparent, roughness: 0.8 })
      : new THREE.MeshBasicMaterial({ map: tex, transparent: !!o.transparent, toneMapped: !o.glow });
    if (o.glow) mat.color.setScalar(o.glow);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z); m.rotation.y = ry;
    if (o.lit) m.receiveShadow = true;
    (o.parent || F.group).add(m);
    if (o.decor !== false && !o.parent) F.decor.push(m);
    return m;
  },

  wrap(c, text, maxW) {
    const words = String(text).split(" "); const lines = []; let cur = "";
    for (const w of words) { if (c.measureText(cur + " " + w).width > maxW && cur) { lines.push(cur); cur = w; } else cur = cur ? cur + " " + w : w; }
    lines.push(cur);
    return lines;
  },

  textPoster(F, lines, w, h, x, y, z, ry, o = {}) {
    return Kit.poster(F, w, h, (c, cw, ch) => {
      c.fillStyle = o.bg || "#101218"; c.fillRect(0, 0, cw, ch);
      if (o.border !== false) { c.strokeStyle = o.borderCol || "rgba(255,255,255,0.25)"; c.lineWidth = 5; c.strokeRect(8, 8, cw - 16, ch - 16); }
      c.textAlign = "center"; c.textBaseline = "middle";
      const fs = o.fs || 40;
      const total = lines.length;
      lines.forEach((ln, i) => {
        c.font = `${i === 0 ? 800 : 500} ${i === 0 ? fs : fs * 0.55}px ${Kit.FONT}`;
        c.fillStyle = i === 0 ? (o.color || "#e8ecf4") : (o.subColor || "rgba(232,236,244,0.72)");
        const y0 = ch / 2 - ((total - 1) * fs * 0.72) / 2;
        c.fillText(ln, cw / 2, y0 + i * fs * 0.78 + (i > 0 ? fs * 0.1 : 0));
      });
    }, x, y, z, ry, o);
  },

  /* ---------------- shared animated screen pool ---------------- */
  _pool: {},
  poolTex(kind) {
    if (Kit._pool[kind]) return Kit._pool[kind].tex;
    const tex = Kit.canvasTex(256, 160, () => {});
    Kit._pool[kind] = { tex, draw: Kit.screens[kind] || Kit.screens.code };
    Kit._pool[kind].draw(tex._ctx, 256, 160, 0);
    tex.needsUpdate = true;
    return tex;
  },
  _poolAcc: 0,
  tickScreens(dt, t) {
    Kit._poolAcc += dt;
    if (Kit._poolAcc < 0.5) return;
    Kit._poolAcc = 0;
    for (const k in Kit._pool) { const p = Kit._pool[k]; p.draw(p.tex._ctx, 256, 160, t); p.tex.needsUpdate = true; }
  },
  screens: {
    code(c, w, h, t) {
      c.fillStyle = "#0d1117"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#161b22"; c.fillRect(0, 0, 22, h);
      const off = Math.floor(t * 2) % 30;
      const cols = ["#ff7b72", "#79c0ff", "#d2a8ff", "#a5d6ff", "#7ee787", "#e6edf3"];
      for (let i = 0; i < 14; i++) {
        const n = i + off, y = 8 + i * 11;
        c.fillStyle = "#484f58"; c.fillRect(6, y, 10, 5);
        let x = 28 + ((n * 7) % 4) * 10;
        for (let k = 0; k < 4; k++) {
          const len = 14 + ((n * 13 + k * 17) % 40);
          c.fillStyle = cols[(n + k * 3) % cols.length];
          c.fillRect(x, y, len, 5); x += len + 5;
          if (x > w - 20) break;
        }
      }
      if (Math.floor(t * 2) % 2) { c.fillStyle = "#e6edf3"; c.fillRect(120, 8 + 13 * 11, 3, 8); }
    },
    dash(c, w, h, t) {
      c.fillStyle = "#0b1220"; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 3; i++) {
        c.fillStyle = "#131c2e"; c.fillRect(8 + i * 82, 8, 76, 40);
        c.fillStyle = ["#57d8ff", "#7ee787", "#ffd166"][i];
        c.font = `700 16px ${Kit.FONT}`; c.fillText(["12M", "99.9%", "1.2k"][i], 14 + i * 82, 34);
      }
      c.strokeStyle = "#57d8ff"; c.lineWidth = 2; c.beginPath();
      for (let x = 0; x < 150; x += 6) c.lineTo(10 + x, 130 - Math.abs(Math.sin(x * 0.05 + t)) * 50 - x * 0.12);
      c.stroke();
      for (let i = 0; i < 6; i++) { const bh = 12 + Math.abs(Math.sin(t * 1.3 + i)) * 50; c.fillStyle = "#7ee787"; c.fillRect(170 + i * 13, 150 - bh, 9, bh); }
    },
    term(c, w, h, t) {
      c.fillStyle = "#050805"; c.fillRect(0, 0, w, h);
      c.font = `500 10px monospace`;
      const logs = ["$ mvn spring-boot:run", "INFO  Started HqApplication in 2.1s", "INFO  rabbit: 3 consumers ready", "DEBUG GET /api/widgets 200 12ms", "INFO  cache hit ratio 0.97", "WARN  retry 1/3 → DLQ avoided", "INFO  campaign #1042 dispatched", "DEBUG POST /rx/suggest 201 38ms", "INFO  heap 61% · gc 4ms", "INFO  all systems nominal ✓"];
      const off = Math.floor(t * 1.5);
      for (let i = 0; i < 12; i++) {
        const ln = logs[(i + off) % logs.length];
        c.fillStyle = ln.startsWith("WARN") ? "#ffd166" : ln.startsWith("$") ? "#e6edf3" : "#39d353";
        c.fillText(ln, 8, 14 + i * 12);
      }
    },
    chart(c, w, h, t) {
      c.fillStyle = "#0e1016"; c.fillRect(0, 0, w, h);
      c.strokeStyle = "rgba(255,255,255,0.06)";
      for (let y = 20; y < h; y += 28) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
      const g = c.createLinearGradient(0, 30, 0, h);
      g.addColorStop(0, "rgba(255,107,87,0.55)"); g.addColorStop(1, "rgba(255,107,87,0)");
      c.fillStyle = g; c.beginPath(); c.moveTo(0, h);
      for (let x = 0; x <= w; x += 8) c.lineTo(x, 100 - Math.sin(x * 0.03 + t) * 25 - Math.sin(x * 0.11 + t * 2) * 8 - x * 0.18);
      c.lineTo(w, h); c.fill();
    },
    chat(c, w, h, t) {
      c.fillStyle = "#15111f"; c.fillRect(0, 0, w, h);
      const off = Math.floor(t) % 6;
      for (let i = 0; i < 6; i++) {
        const me = (i + off) % 2;
        c.fillStyle = me ? "#c084fc" : "#2a2438";
        const bw = 60 + ((i + off) * 37) % 90;
        c.fillRect(me ? w - bw - 10 : 10, 10 + i * 24, bw, 16);
      }
    },
    map(c, w, h, t) {
      c.fillStyle = "#0a1a2a"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#1f4a35";
      for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(30 + i * 50, 60 + Math.sin(i) * 30, 30, 18, i, 0, Math.PI * 2); c.fill(); }
      for (let i = 0; i < 4; i++) {
        const r = ((t * 20 + i * 30) % 110);
        c.strokeStyle = `rgba(122,229,130,${1 - r / 110})`; c.lineWidth = 2;
        c.beginPath(); c.arc(140, 80, r, 0, Math.PI * 2); c.stroke();
      }
    },
  },

  /* =====================================================================
     ARCHITECTURE
     ===================================================================== */
  floorPlane(F, x, z, w, d, mat, y = 0) {
    const tile = (mat.userData && mat.userData.tile) || 2;
    const g = Kit.geo(`fp${w},${d},${tile}`, () => {
      const pg = new THREE.PlaneGeometry(w, d);
      const uv = pg.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / tile, uv.getY(i) * d / tile);
      return pg;
    });
    const m = new THREE.Mesh(g, mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.receiveShadow = true;
    F.group.add(m);
    return m;
  },

  ceiling(F, x, z, w, d, h, mat) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    m.rotation.x = Math.PI / 2;            // faces down → invisible from the diorama camera above
    m.position.set(x, h, z);
    F.group.add(m);
    F.ceilings.push(m);
    return m;
  },

  ceilPanel(F, x, z, w, d, h, color = 0xfff4e0, k = 1.3) {
    const m = new THREE.Mesh(Kit.geo(`cp${w},${d}`, () => new THREE.PlaneGeometry(w, d)), Kit.G(color, k));
    m.rotation.x = Math.PI / 2;
    m.position.set(x, h - 0.02, z);
    F.group.add(m);
    F.ceilings.push(m);
    return m;
  },

  LK: 2.4,   // physically-based lights: art-directed intensity → candela
  light(F, x, y, z, color, intensity = 1, dist = 9, decay = 2) {
    // not a real light: an anchor the engine's fixed pool of point lights is assigned to
    // (constant light count = no shader recompiles, and only nearby lights cost anything)
    const a = { isAnchor: true, position: new THREE.Vector3(x, y, z), color: new THREE.Color(color), intensity: intensity * Kit.LK, distance: dist, decay, w: 0, slot: null };
    (F.lightAnchors || (F.lightAnchors = [])).push(a);
    return a;
  },

  /* solid wall run with door gaps. gaps: [[start, end, style]] along the wall
     style: 'swing' | 'slide' | 'arch' | undefined (open doorway)            */
  wallRun(F, x1, z1, x2, z2, o = {}) {
    const h = o.h && o.h < 2.6 ? o.h : Math.max(o.h || 0, F.ceilH), t = o.t || 0.2;
    const mat = o.mat || F.wallMat;
    const tile = (mat.userData && mat.userData.tile) || 2;
    const capM = Kit.M(0x0e0e12, { rough: 0.95 });
    const skirtM = o.skirt || F.skirtMat || Kit.M(0x1a1714, { rough: 0.5 });
    const len = Math.hypot(x2 - x1, z2 - z1);
    const ux = (x2 - x1) / len, uz = (z2 - z1) / len;
    const ry = -Math.atan2(uz, ux);
    const g = new THREE.Group();
    F.group.add(g);
    const gaps = (o.gaps || []).slice().sort((a, b) => a[0] - b[0]);
    const segs = []; let cur = 0;
    for (const gp of gaps) { if (gp[0] > cur) segs.push([cur, gp[0]]); cur = Math.max(cur, gp[1]); }
    if (cur < len) segs.push([cur, len]);
    const P = (s) => [x1 + ux * s, z1 + uz * s];

    for (const [s, e] of segs) {
      const L = e - s; if (L < 0.02) continue;
      const [cx, cz] = P((s + e) / 2);
      const m = new THREE.Mesh(Kit.worldBox(L, h, t, tile), [mat, mat, capM, mat, mat, mat]);
      m.position.set(cx, h / 2, cz); m.rotation.y = ry;
      m.castShadow = true; m.receiveShadow = true;
      g.add(m);
      const sk = new THREE.Mesh(Kit.rboxGeo(L, 0.13, t + 0.05, 0.01), skirtM);
      sk.position.set(cx, 0.065, cz); sk.rotation.y = ry; sk.receiveShadow = true;
      g.add(sk);
      if (o.crown) {
        const cr = new THREE.Mesh(Kit.rboxGeo(L, 0.1, t + 0.08, 0.02), o.crown);
        cr.position.set(cx, h - 0.05, cz); cr.rotation.y = ry; g.add(cr);
      }
      if (h > 4.2) {
        const tr = new THREE.Mesh(Kit.rboxGeo(L, 0.09, t + 0.05, 0.01), skirtM);
        tr.position.set(cx, 3.55, cz); tr.rotation.y = ry; g.add(tr);
      }
      Kit.collide(F, cx, cz, L, t + 0.18, ry, { aoK: 0.9 });
      Kit.camWall(F, ...P(s), ...P(e), 0, h);
    }
    const dH = o.doorH || 2.35;
    for (const [gs, ge] of gaps) Kit.camWall(F, ...P(gs), ...P(ge), 0, h, dH);   // doorway: open air only while you stand in it
    const frameM = o.frame || Kit.M(0x1c1a1e, { rough: 0.35, metal: 0.4 });
    for (const [gs, ge, style] of gaps) {
      const [cx, cz] = P((gs + ge) / 2);
      if (style === "arch") {
        const ar = (ge - gs) / 2;
        const arch = new THREE.Mesh(Kit.geo(`arch${ar},${t}`, () => {
          const sh = new THREE.Shape();
          sh.moveTo(-ar - 0.01, 0); sh.lineTo(-ar - 0.01, h - dH - 0.001 > 0 ? h - dH + ar : ar); sh.lineTo(ar + 0.01, h - dH + ar); sh.lineTo(ar + 0.01, 0);
          sh.absarc(0, 0, ar, 0, Math.PI, false);
          return new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false, curveSegments: 18 });
        }), mat);
        arch.position.set(cx - Math.sin(ry) * -t / 2 * 0, dH - ar, cz);
        arch.rotation.y = ry;
        arch.translateZ(-t / 2);
        arch.castShadow = true;
        g.add(arch);
      } else {
        const lt = new THREE.Mesh(Kit.worldBox(ge - gs, h - dH, t, tile), [mat, mat, capM, mat, mat, mat]);
        lt.position.set(cx, dH + (h - dH) / 2, cz); lt.rotation.y = ry;
        lt.castShadow = true; lt.receiveShadow = true;
        g.add(lt);
        for (const sgap of [gs, ge]) {
          const [jx, jz] = P(sgap);
          const j = new THREE.Mesh(Kit.rboxGeo(0.1, dH, t + 0.08, 0.02), frameM);
          j.position.set(jx, dH / 2, jz); j.rotation.y = ry; g.add(j);
        }
        const hd = new THREE.Mesh(Kit.rboxGeo(ge - gs + 0.1, 0.1, t + 0.08, 0.02), frameM);
        hd.position.set(cx, dH + 0.05, cz); hd.rotation.y = ry; g.add(hd);
      }
      if (style === "swing" || style === "slide") Kit.door(F, g, cx, cz, ry, ge - gs, dH, style, o.doorMat);
    }
    F.cut.push({ g, x1, z1, x2, z2, h, decor: [], k: 1, solid: true });
    return g;
  },

  door(F, parent, cx, cz, ry, w, dH, style, mat) {
    const ux = Math.cos(-ry), uz = Math.sin(-ry);
    const st = { open: 0 };
    if (style === "swing") {
      const hinge = new THREE.Group();
      hinge.position.set(cx - ux * (w / 2 - 0.06), 0, cz - uz * (w / 2 - 0.06));
      hinge.rotation.y = ry;
      parent.add(hinge);
      const leafM = mat || Kit.M(0x5a3d26, { rough: 0.55 });
      const leaf = Kit.B(hinge, w - 0.14, dH - 0.06, 0.05, leafM, (w - 0.14) / 2, (dH - 0.06) / 2 + 0.02, 0, { r: 0.012 });
      Kit.B(hinge, (w - 0.14) * 0.7, dH * 0.34, 0.012, Kit.M(0x000000, { rough: 0.5, opacity: 0.16 }), (w - 0.14) / 2, dH * 0.7, 0.03, { r: 0.004, cast: false });
      Kit.S(hinge, 0.03, Kit.gold(), w - 0.24, 1.02, 0.05);
      Kit.S(hinge, 0.03, Kit.gold(), w - 0.24, 1.02, -0.05);
      F.dynamic.push({ update(dt) {
        const near = Kit.someoneNear(F, cx, cz, 2.0);
        st.open += ((near ? 1 : 0) - st.open) * Math.min(1, dt * 4);
        hinge.rotation.y = ry - st.open * 1.45;
      }});
    } else {
      const glass = Kit.glassM(0xcfe8ff, 0.22);
      const fm = Kit.metal(0x2a2e36, 0.35);
      const leaves = [];
      for (const s of [-1, 1]) {
        const lg = new THREE.Group();
        parent.add(lg);
        lg.rotation.y = ry;
        Kit.B(lg, w / 2 - 0.04, dH - 0.08, 0.03, glass, 0, (dH - 0.08) / 2 + 0.04, 0, { r: 0.005, cast: false });
        Kit.B(lg, 0.04, dH - 0.08, 0.05, fm, s * -(w / 4 - 0.04), (dH - 0.08) / 2 + 0.04, 0, { r: 0.01 });
        Kit.B(lg, w / 2 - 0.1, 0.06, 0.035, Kit.M(0xffffff, { opacity: 0.35 }), 0, 1.1, 0, { r: 0.004, cast: false });
        leaves.push({ lg, s });
      }
      F.dynamic.push({ update(dt) {
        const near = Kit.someoneNear(F, cx, cz, 2.2);
        st.open += ((near ? 1 : 0) - st.open) * Math.min(1, dt * 5);
        for (const { lg, s } of leaves) {
          const off = s * (w / 4 + st.open * (w / 2 - 0.1));
          lg.position.set(cx + ux * off, 0, cz + uz * off);
        }
      }});
    }
  },

  someoneNear(F, x, z, r) {
    const p = Game.player;
    if (p && Math.hypot(p.x - x, p.z - z) < r) return true;
    for (const n of F.npcs) { const q = n.root.position; if (Math.hypot(q.x - x, q.z - z) < r * 0.8) return true; }
    return false;
  },

  /* glass partition with frosted band, slim frames and optional sliding door gaps */
  glassRun(F, x1, z1, x2, z2, o = {}) {
    const h = o.h && o.h < 2.6 ? o.h : Math.max(o.h || 0, F.ceilH), len = Math.hypot(x2 - x1, z2 - z1);
    const ux = (x2 - x1) / len, uz = (z2 - z1) / len, ry = -Math.atan2(uz, ux);
    const fm = o.frame || Kit.metal(0x6a707a, 0.35);
    const gaps = (o.gaps || []).slice().sort((a, b) => a[0] - b[0]);
    const segs = []; let cur = 0;
    for (const gp of gaps) { if (gp[0] > cur) segs.push([cur, gp[0]]); cur = Math.max(cur, gp[1]); }
    if (cur < len) segs.push([cur, len]);
    const band = Kit.bandMat(o.bandText || "", o.bandColor);
    const g = new THREE.Group(); F.group.add(g);
    for (const [s, e] of segs) {
      const L = e - s; if (L < 0.05) continue;
      const cx = x1 + ux * (s + e) / 2, cz = z1 + uz * (s + e) / 2;
      const pane = new THREE.Mesh(Kit.geo(`gp${L},${h}`, () => new THREE.PlaneGeometry(L, h - 0.16)), Kit.glassM(o.tint || 0xbfe0ff, o.opacity || 0.1));
      pane.position.set(cx, h / 2, cz); pane.rotation.y = ry; pane.renderOrder = 2;
      g.add(pane);
      const bd = new THREE.Mesh(Kit.geo(`gb${L}`, () => new THREE.PlaneGeometry(L, 0.34)), band);
      bd.position.set(cx, 1.2, cz); bd.rotation.y = ry; bd.renderOrder = 3;
      g.add(bd);
      Kit.B(g, L, 0.08, 0.1, fm, cx, 0.04, cz, { ry, r: 0.01 });
      Kit.B(g, L, 0.06, 0.08, fm, cx, h - 0.03, cz, { ry, r: 0.01, cast: false });
      const n = Math.max(1, Math.round(L / (o.mullion || 1.6)));
      for (let i = 0; i <= n; i++) {
        const f = s + (L * i) / n;
        Kit.B(g, 0.035, h, 0.05, fm, x1 + ux * f, h / 2, z1 + uz * f, { ry, r: 0.008, cast: false });
      }
      Kit.collide(F, cx, cz, L, 0.22, ry, { aoK: 0.35 });
      Kit.camWall(F, x1 + ux * s, z1 + uz * s, x1 + ux * e, z1 + uz * e, 0, h);
    }
    for (const [gs, ge, style] of gaps) {
      const cx = x1 + ux * (gs + ge) / 2, cz = z1 + uz * (gs + ge) / 2;
      Kit.B(g, ge - gs + 0.1, 0.1, 0.1, fm, cx, 2.4, cz, { ry, r: 0.01, cast: false });
      if (h > 2.6) {
        const top = new THREE.Mesh(Kit.geo(`gt${ge - gs},${h}`, () => new THREE.PlaneGeometry(ge - gs, h - 2.45)), Kit.glassM(o.tint || 0xbfe0ff, o.opacity || 0.1));
        top.position.set(cx, 2.45 + (h - 2.45) / 2, cz); top.rotation.y = ry; g.add(top);
      }
      if (style !== "open") Kit.door(F, g, cx, cz, ry, ge - gs, 2.4, "slide");
      Kit.camWall(F, x1 + ux * gs, z1 + uz * gs, x1 + ux * ge, z1 + uz * ge, 0, h, 2.4);
    }
    F.cut.push({ g, x1, z1, x2, z2, h, decor: [], k: 1, solid: true });
    return g;
  },

  bandMat(text, color) {
    const key = "band" + text + color;
    if (Kit._mats[key]) return Kit._mats[key];
    const tex = Kit.canvasTex(512, 64, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      for (let x = 0; x < w; x += 6) for (let y = 4; y < h - 4; y += 6) {
        c.fillStyle = "rgba(255,255,255,0.55)"; c.beginPath(); c.arc(x + ((y / 6) % 2) * 3, y, 1.4, 0, Math.PI * 2); c.fill();
      }
      if (text) {
        c.fillStyle = "rgba(0,0,0,0.0)";
        c.globalCompositeOperation = "destination-out";
        c.fillRect(w * 0.3, 8, w * 0.4, h - 16);
        c.globalCompositeOperation = "source-over";
        c.fillStyle = color || "rgba(255,255,255,0.8)";
        c.font = `700 30px ${Kit.FONT}`; c.textAlign = "center"; c.textBaseline = "middle";
        c.fillText(text, w / 2, h / 2 + 2);
      }
    });
    tex.wrapS = THREE.RepeatWrapping;
    const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false });
    Kit._mats[key] = m;
    return m;
  },

  /* exterior curtain wall with fins, sill and rain streaks */
  curtainWall(F, x1, z1, x2, z2, o = {}) {
    const h = Math.max(o.h || 0, F.ceilH), len = Math.hypot(x2 - x1, z2 - z1);
    const ux = (x2 - x1) / len, uz = (z2 - z1) / len, ry = -Math.atan2(uz, ux);
    const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
    const g = new THREE.Group(); F.group.add(g);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(len, h), Kit.glassM(o.tint || 0x9fc8ff, 0.1));
    pane.position.set(cx, h / 2, cz); pane.rotation.y = ry; pane.renderOrder = 2;
    g.add(pane);
    const rain = new THREE.Mesh(new THREE.PlaneGeometry(len, h), Look.rainGlass());
    rain.position.set(cx, h / 2, cz); rain.rotation.y = ry; rain.renderOrder = 3;
    g.add(rain);
    F.rainGlass.push(rain);
    const fin = Kit.metal(0x1b1e24, 0.4);
    const n = Math.max(2, Math.round(len / 1.8));
    for (let i = 0; i <= n; i++) {
      const f = len * i / n;
      Kit.B(g, 0.08, h, 0.22, fin, x1 + ux * f, h / 2, z1 + uz * f, { ry, r: 0.012 });
    }
    Kit.B(g, len, 0.16, 0.34, Kit.M(0x1a1c22, { rough: 0.5 }), cx, 0.08, cz, { ry, r: 0.02 });
    Kit.B(g, len, 0.12, 0.26, fin, cx, h - 0.06, cz, { ry, r: 0.01, cast: false });
    Kit.collide(F, cx, cz, len, 0.4, ry, { aoK: 0.4 });
    Kit.camWall(F, x1, z1, x2, z2, 0, 99);
    F.cut.push({ g, x1, z1, x2, z2, h, decor: [], k: 1, solid: true });
    return g;
  },

  /* a vertical slab the third-person camera may never pass through (y0..y1 = blocked band) */
  camWall(F, x1, z1, x2, z2, y0, y1, lintel = 0) {
    (F.camWalls || (F.camWalls = [])).push({ x1, z1, x2, z2, y0, y1, door: lintel > 0, lintel });
  },

  /* any group that should drop away when it blocks the view */
  cutGroup(F, x1, z1, x2, z2, h) {
    const g = new THREE.Group(); F.group.add(g);
    F.cut.push({ g, x1, z1, x2, z2, h, decor: [], k: 1 });
    return g;
  },

  /* =====================================================================
     FURNITURE
     ===================================================================== */
  seeded(x, z) { return Look.rng(Math.floor(Math.abs(x * 73.1 + z * 131.7)) + 1); },

  desk(F, x, z, ry = 0, o = {}) {
    const g = Kit.grp(F, x, z, ry);
    const R = Kit.seeded(x, z);
    const style = o.style || "modern";
    const w = o.w || 1.5, d = o.d || 0.75, top = 0.74;
    const tops = {
      modern: Kit.M(0xd9c7a8, { rough: 0.45 }), wood: Kit.M(0x5a3b22, { rough: 0.4 }), exec: Kit.M(0x3b2416, { rough: 0.3, env: 1.4 }),
      precinct: Kit.M(0x7c8691, { rough: 0.45, metal: 0.3 }), student: Kit.M(0x7a5a3a, { rough: 0.6 }), lab: Kit.M(0xeef0f2, { rough: 0.35 }),
    };
    const topM = tops[style] || tops.modern;
    const legM = style === "modern" || style === "lab" ? Kit.metal(0x202228, 0.4) : topM;
    Kit.B(g, w, 0.045, d, topM, 0, top, 0, { r: 0.018 });
    if (style === "modern" || style === "lab") {
      for (const s of [-1, 1]) {
        Kit.B(g, 0.05, top - 0.02, 0.05, legM, s * (w / 2 - 0.06), (top - 0.02) / 2, d / 2 - 0.08, { r: 0.012 });
        Kit.B(g, 0.05, top - 0.02, 0.05, legM, s * (w / 2 - 0.06), (top - 0.02) / 2, -d / 2 + 0.08, { r: 0.012 });
      }
      Kit.B(g, w - 0.2, 0.25, 0.02, Kit.M(0x2a2d34), 0, top - 0.16, -d / 2 + 0.1, { r: 0.005 }); // modesty panel
    } else if (style === "exec" || style === "wood" || style === "student") {
      Kit.B(g, 0.46, top - 0.03, d - 0.06, topM, -w / 2 + 0.25, (top - 0.03) / 2, 0, { r: 0.02 });
      Kit.B(g, 0.46, top - 0.03, d - 0.06, topM, w / 2 - 0.25, (top - 0.03) / 2, 0, { r: 0.02 });
      for (let i = 0; i < 3; i++) for (const s of [-1, 1]) {
        Kit.S(g, 0.016, Kit.gold(), s * (w / 2 - 0.25), 0.18 + i * 0.2, d / 2 - 0.02, { cast: false });
      }
      if (style === "exec") Kit.B(g, w * 0.55, 0.006, d * 0.55, Kit.M(0x14301f, { rough: 0.8 }), 0, top + 0.025, 0.05, { r: 0.002, cast: false });
    } else { // precinct steel desk
      Kit.B(g, w, top - 0.03, d - 0.04, Kit.M(0x5f6a73, { rough: 0.5, metal: 0.4 }), 0, (top - 0.03) / 2, 0, { r: 0.015 });
      for (let i = 0; i < 3; i++) Kit.B(g, 0.36, 0.005, 0.02, Kit.metal(0xc0c4ca), w / 2 - 0.28, 0.18 + i * 0.2, d / 2 - 0.01, { r: 0.002, cast: false });
    }
    // monitors
    const mons = o.monitors !== undefined ? o.monitors : 1;
    const bez = Kit.M(0x121317, { rough: 0.35, metal: 0.3 });
    const kinds = o.screens || ["code", "dash", "term", "chart"];
    for (let i = 0; i < mons; i++) {
      const mx = mons === 1 ? 0 : (i - (mons - 1) / 2) * 0.62;
      const ang = mons === 1 ? 0 : (i === 0 ? 0.18 : -0.18);
      const mg = new THREE.Group(); mg.position.set(mx, top, -d / 2 + 0.2); mg.rotation.y = ang; g.add(mg);
      Kit.B(mg, 0.2, 0.012, 0.16, bez, 0, 0.008, 0, { r: 0.005 });
      Kit.B(mg, 0.04, 0.22, 0.03, bez, 0, 0.12, -0.01, { r: 0.01 });
      Kit.B(mg, 0.6, 0.36, 0.028, bez, 0, 0.34, 0.01, { r: 0.012 });
      const scr = new THREE.Mesh(Kit.geo("scr", () => new THREE.PlaneGeometry(0.56, 0.32)), new THREE.MeshBasicMaterial({ map: Kit.poolTex(kinds[(Math.floor(R() * 99) + i) % kinds.length]), toneMapped: false }));
      scr.position.set(0, 0.34, 0.0255); mg.add(scr);
    }
    if (o.laptop) {
      const lg = new THREE.Group(); lg.position.set(o.laptopX || 0.3, top + 0.02, 0.05); lg.rotation.y = -0.2; g.add(lg);
      Kit.B(lg, 0.34, 0.015, 0.23, Kit.metal(0xb8bcc4, 0.3), 0, 0, 0, { r: 0.006 });
      const lid = new THREE.Group(); lid.position.set(0, 0.008, -0.11); lid.rotation.x = -0.35; lg.add(lid);
      Kit.B(lid, 0.34, 0.23, 0.01, Kit.metal(0xb8bcc4, 0.3), 0, 0.115, 0, { r: 0.006 });
      const ls = new THREE.Mesh(Kit.geo("lscr", () => new THREE.PlaneGeometry(0.3, 0.19)), new THREE.MeshBasicMaterial({ map: Kit.poolTex(o.laptop === true ? "code" : o.laptop), toneMapped: false }));
      ls.position.set(0, 0.115, 0.006); lid.add(ls);
    }
    // keyboard + mouse
    if (mons > 0 || o.keyboard) {
      Kit.B(g, 0.42, 0.018, 0.14, Kit.M(0x24262c, { rough: 0.5 }), 0, top + 0.03, 0.12, { r: 0.006 });
      Kit.B(g, 0.38, 0.004, 0.1, Kit.M(0x3a3d46, { rough: 0.7 }), 0, top + 0.041, 0.12, { r: 0.002, cast: false });
      Kit.S(g, 0.028, Kit.M(0x24262c), 0.3, top + 0.035, 0.14, { sy: 0.5, sz: 1.4, cast: false });
    }
    // clutter
    if (o.clutter !== false) {
      const spots = [[-w / 2 + 0.2, 0.18], [w / 2 - 0.18, 0.2], [-w / 2 + 0.28, -0.18], [w / 2 - 0.25, -0.15]];
      for (const [cx, cz] of spots) {
        const pick = R();
        if (pick < 0.22) Kit.mug(g, cx, top + 0.02, cz, R() < 0.5 ? 0xe8e2d4 : [0xc0392b, 0x2e86c1, 0x27ae60][Math.floor(R() * 3)]);
        else if (pick < 0.4) Kit.papers(g, cx, top + 0.025, cz, R() * 0.6 - 0.3);
        else if (pick < 0.55) Kit.succulent(g, cx, top + 0.02, cz);
        else if (pick < 0.66) { // notebook + pen
          Kit.B(g, 0.2, 0.02, 0.27, Kit.M([0x8c2f2f, 0x2f4a8c, 0x2f6e4a, 0x1d1d22][Math.floor(R() * 4)], { rough: 0.8 }), cx, top + 0.035, cz, { r: 0.005, ry: R() - 0.5 });
          Kit.C(g, 0.006, 0.006, 0.14, Kit.M(0x1a1a1a), cx + 0.06, top + 0.05, cz, { rz: Math.PI / 2, ry: 0.4, seg: 6, cast: false });
        } else if (pick < 0.74) Kit.duck(g, cx, top + 0.02, cz, 0.6);
        else if (pick < 0.82) { // pen cup
          Kit.C(g, 0.035, 0.03, 0.1, Kit.M(0x2a2d34, { rough: 0.5 }), cx, top + 0.07, cz, { seg: 12 });
          for (let k = 0; k < 3; k++) Kit.C(g, 0.005, 0.005, 0.15, Kit.M([0x2e86c1, 0xc0392b, 0x111111][k]), cx + (k - 1) * 0.012, top + 0.12, cz, { rz: (k - 1) * 0.15, seg: 5, cast: false });
        }
      }
      if (o.lamp) Kit.deskLamp(g, w / 2 - 0.22, top, -0.2, o.lamp);
    }
    Kit.collide(F, x, z, w + 0.06, d + 0.06, ry);
    return g;
  },

  mug(p, x, y, z, color = 0xe8e2d4) {
    Kit.C(p, 0.042, 0.038, 0.1, Kit.M(color, { rough: 0.35 }), x, y + 0.05, z, { seg: 14 });
    Kit.C(p, 0.037, 0.037, 0.005, Kit.M(0x3b2314, { rough: 0.2 }), x, y + 0.09, z, { seg: 14, cast: false });
    Kit.T(p, 0.025, 0.007, Kit.M(color, { rough: 0.35 }), x + 0.045, y + 0.055, z, { ry: 0, cast: false });
  },
  papers(p, x, y, z, rot = 0) {
    for (let i = 0; i < 3; i++) Kit.B(p, 0.21, 0.004, 0.297, Kit.M(0xf4f1ea, { rough: 0.9 }), x + i * 0.008, y + i * 0.005, z - i * 0.006, { ry: rot + i * 0.06, r: 0.001, cast: false });
  },
  succulent(p, x, y, z) {
    Kit.C(p, 0.05, 0.04, 0.07, Kit.M(0xc9785a, { rough: 0.85 }), x, y + 0.035, z, { seg: 12 });
    for (let i = 0; i < 7; i++) {
      const a = i * 0.9;
      Kit.S(p, 0.025, Kit.M(0x5f9a6a, { rough: 0.6 }), x + Math.cos(a) * 0.025, y + 0.09 + (i % 2) * 0.01, z + Math.sin(a) * 0.025, { sy: 1.6, sx: 0.7, rz: Math.cos(a) * 0.6, rx: Math.sin(a) * 0.6, cast: false });
    }
  },
  duck(p, x, y, z, s = 1) {
    const yel = Kit.M(0xffd23e, { rough: 0.35 });
    Kit.S(p, 0.05 * s, yel, x, y + 0.045 * s, z, { sx: 1.25, sy: 0.9 });
    Kit.S(p, 0.034 * s, yel, x + 0.03 * s, y + 0.1 * s, z);
    Kit.S(p, 0.014 * s, Kit.M(0xff8c2a), x + 0.062 * s, y + 0.095 * s, z, { sx: 1.6, sy: 0.6 });
    Kit.S(p, 0.006 * s, Kit.M(0x111111), x + 0.046 * s, y + 0.11 * s, z + 0.018 * s, { cast: false });
    Kit.S(p, 0.006 * s, Kit.M(0x111111), x + 0.046 * s, y + 0.11 * s, z - 0.018 * s, { cast: false });
  },

  chair(F, x, z, ry = 0, o = {}) {
    const g = Kit.grp(F, x, z, ry);
    const style = o.style || "office";
    const col = o.color || 0x2b2f3a;
    const fab = Kit.M(col, { rough: 0.85 });
    const dark = Kit.M(0x18191e, { rough: 0.4, metal: 0.4 });
    if (style === "office") {
      Kit.B(g, 0.5, 0.09, 0.48, fab, 0, 0.47, 0, { r: 0.04 });
      Kit.B(g, 0.46, 0.56, 0.07, fab, 0, 0.82, 0.23, { r: 0.035, rx: -0.12 });
      Kit.C(g, 0.025, 0.03, 0.36, dark, 0, 0.26, 0, { seg: 10 });
      for (let i = 0; i < 5; i++) {
        const a = i * 1.2566;
        Kit.B(g, 0.3, 0.035, 0.05, dark, Math.cos(a) * 0.15, 0.06, Math.sin(a) * 0.15, { ry: -a, r: 0.015 });
        Kit.S(g, 0.028, dark, Math.cos(a) * 0.29, 0.03, Math.sin(a) * 0.29, { cast: false });
      }
      for (const s of [-1, 1]) Kit.B(g, 0.05, 0.03, 0.3, dark, s * 0.27, 0.66, 0.02, { r: 0.012 });
    } else if (style === "wood") {
      const wd = Kit.M(o.color || 0x6a4a2e, { rough: 0.55 });
      Kit.B(g, 0.46, 0.05, 0.44, wd, 0, 0.46, 0, { r: 0.015 });
      for (const [lx, lz] of [[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]]) Kit.B(g, 0.045, 0.46, 0.045, wd, lx, 0.23, lz, { r: 0.01 });
      for (const s of [-1, 1]) Kit.B(g, 0.045, 0.52, 0.045, wd, s * 0.2, 0.74, 0.2, { r: 0.01 });
      Kit.B(g, 0.44, 0.14, 0.035, wd, 0, 0.9, 0.2, { r: 0.012 });
      Kit.B(g, 0.44, 0.05, 0.03, wd, 0, 0.66, 0.2, { r: 0.01 });
    } else if (style === "stool") {
      Kit.C(g, 0.19, 0.19, 0.06, fab, 0, 0.7, 0, { seg: 18 });
      Kit.C(g, 0.025, 0.03, 0.66, Kit.metal(0x888c94), 0, 0.35, 0, { seg: 8 });
      Kit.T(g, 0.16, 0.012, Kit.metal(0x888c94), 0, 0.28, 0, { rx: Math.PI / 2, cast: false });
      Kit.C(g, 0.2, 0.22, 0.03, Kit.metal(0x888c94), 0, 0.015, 0, { seg: 16 });
    } else if (style === "exec" || style === "arm") {
      const lea = Look.mat("leather", o.color || 0x3a2214, { rough: 0.45, tile: 0.6, env: 1.2 });
      Kit.B(g, 0.62, 0.16, 0.58, lea, 0, 0.44, 0, { r: 0.06 });
      Kit.B(g, 0.6, style === "exec" ? 0.8 : 0.5, 0.14, lea, 0, style === "exec" ? 0.9 : 0.75, 0.24, { r: 0.06, rx: -0.1 });
      for (const s of [-1, 1]) Kit.B(g, 0.12, 0.24, 0.52, lea, s * 0.33, 0.62, 0.02, { r: 0.05 });
      if (style === "exec") {
        Kit.C(g, 0.03, 0.035, 0.32, Kit.metal(0x2a2a2e), 0, 0.2, 0, { seg: 10 });
        for (let i = 0; i < 5; i++) { const a = i * 1.2566; Kit.B(g, 0.32, 0.035, 0.05, Kit.metal(0x2a2a2e), Math.cos(a) * 0.16, 0.05, Math.sin(a) * 0.16, { ry: -a, r: 0.015 }); }
      } else {
        for (const [lx, lz] of [[-0.25, -0.22], [0.25, -0.22], [-0.25, 0.22], [0.25, 0.22]]) Kit.C(g, 0.025, 0.018, 0.36, Kit.M(0x2a1a10), lx, 0.18, lz, { seg: 8 });
      }
    }
    if (!o.noCollide) Kit.collide(F, x, z, 0.55, 0.55, ry, { aoK: 0.5 });
    return g;
  },

  sofa(F, x, z, ry = 0, o = {}) {
    const g = Kit.grp(F, x, z, ry);
    const w = o.w || 2.1, col = o.color || 0x5b4636;
    const style = o.style || "modern";
    const fab = style === "chester" ? Look.mat("leather", col, { rough: 0.42, tile: 0.8, env: 1.2 }) : Look.mat("fabric", col, { rough: 0.95, tile: 0.4, env: 0.5 });
    const leg = Kit.M(0x2a1c12, { rough: 0.5 });
    Kit.B(g, w, 0.28, 0.86, fab, 0, 0.26, 0, { r: 0.06 });
    const n = w > 1.6 ? 3 : 2, cw = (w - 0.34) / n;
    for (let i = 0; i < n; i++) {
      Kit.B(g, cw - 0.02, 0.14, 0.64, fab, -w / 2 + 0.17 + cw * (i + 0.5), 0.46, 0.06, { r: 0.06 });
      Kit.B(g, cw - 0.03, 0.44, 0.2, fab, -w / 2 + 0.17 + cw * (i + 0.5), 0.72, -0.28, { r: 0.08, rx: -0.14 });
    }
    for (const s of [-1, 1]) Kit.B(g, 0.2, 0.46, 0.86, fab, s * (w / 2 - 0.1), 0.45, 0, { r: 0.08 });
    for (const [lx, lz] of [[-w / 2 + 0.1, -0.35], [w / 2 - 0.1, -0.35], [-w / 2 + 0.1, 0.35], [w / 2 - 0.1, 0.35]]) Kit.C(g, 0.03, 0.022, 0.12, leg, lx, 0.06, lz, { seg: 8 });
    if (style === "chester") {
      for (let i = 0; i < 7; i++) for (let j = 0; j < 2; j++) Kit.S(g, 0.012, Kit.M(0x1a0e08), -w / 2 + 0.3 + i * (w - 0.6) / 6, 0.66 + j * 0.16, -0.17, { cast: false });
    }
    if (o.pillows !== false) {
      const pc = o.pillow || 0xd9a441;
      Kit.B(g, 0.34, 0.32, 0.12, Look.mat("fabric", pc, { tile: 0.3 }), -w / 2 + 0.38, 0.66, -0.12, { r: 0.05, rz: 0.2, rx: -0.3 });
      Kit.B(g, 0.34, 0.32, 0.12, Look.mat("fabric", o.pillow2 || 0xe8e2d4, { tile: 0.3 }), w / 2 - 0.38, 0.66, -0.12, { r: 0.05, rz: -0.15, rx: -0.3 });
    }
    Kit.collide(F, x, z, w, 0.9, ry);
    return g;
  },

  table(F, x, z, ry = 0, o = {}) {
    const g = Kit.grp(F, x, z, ry);
    const w = o.w || 1.2, d = o.d || 0.7, h = o.h || 0.42;
    const top = o.top || Kit.M(0x3a2c20, { rough: 0.35, env: 1.3 });
    const style = o.style || "coffee";
    if (style === "round") {
      Kit.C(g, w / 2, w / 2, 0.05, top, 0, h, 0, { seg: 32 });
      Kit.C(g, 0.05, 0.06, h - 0.05, Kit.metal(0x2a2a2e), 0, (h - 0.05) / 2, 0, { seg: 12 });
      Kit.C(g, 0.26, 0.3, 0.03, Kit.metal(0x2a2a2e), 0, 0.015, 0, { seg: 20 });
    } else if (style === "marble") {
      Kit.B(g, w, 0.05, d, Look.mat("marble", 0xe8e4dc, { rough: 0.15, tile: 1.4, env: 1.4 }), 0, h, 0, { r: 0.02 });
      Kit.B(g, w * 0.6, h - 0.05, d * 0.4, Kit.gold(), 0, (h - 0.05) / 2, 0, { r: 0.03 });
    } else {
      Kit.B(g, w, 0.05, d, top, 0, h, 0, { r: 0.02 });
      const lm = o.legs || Kit.M(0x22201c, { rough: 0.5 });
      for (const [lx, lz] of [[-w / 2 + 0.08, -d / 2 + 0.08], [w / 2 - 0.08, -d / 2 + 0.08], [-w / 2 + 0.08, d / 2 - 0.08], [w / 2 - 0.08, d / 2 - 0.08]])
        Kit.B(g, 0.05, h - 0.03, 0.05, lm, lx, (h - 0.03) / 2, lz, { r: 0.012 });
      if (style === "coffee") Kit.B(g, w - 0.16, 0.025, d - 0.16, top, 0, 0.12, 0, { r: 0.01 });
    }
    if (o.books) {
      Kit.B(g, 0.24, 0.04, 0.17, Kit.M(0x8c2f2f, { rough: 0.8 }), -w * 0.2, h + 0.045, 0, { r: 0.004, ry: 0.2 });
      Kit.B(g, 0.22, 0.035, 0.16, Kit.M(0x2f4a6e, { rough: 0.8 }), -w * 0.2, h + 0.085, 0, { r: 0.004, ry: -0.1 });
    }
    if (o.vase) { Kit.vase(g, w * 0.22, h + 0.025, 0.02); }
    Kit.collide(F, x, z, w, style === "round" ? w : d, ry);
    return g;
  },

  vase(p, x, y, z) {
    Kit.L(p, [[0, 0], [0.05, 0], [0.07, 0.06], [0.05, 0.16], [0.03, 0.2], [0.035, 0.22], [0, 0.22]], Kit.M(0x1d3a4a, { rough: 0.2, env: 1.5 }), x, y, z, { seg: 16 });
    for (let i = 0; i < 5; i++) {
      const a = i * 1.3;
      Kit.C(p, 0.004, 0.004, 0.22, Kit.M(0x3f7a44), x + Math.cos(a) * 0.02, y + 0.3, z + Math.sin(a) * 0.02, { rz: Math.cos(a) * 0.3, rx: Math.sin(a) * 0.3, seg: 4, cast: false });
      Kit.S(p, 0.03, Kit.M([0xf4d35e, 0xee964b, 0xf95738, 0xf4f1ea][i % 4], { rough: 0.6 }), x + Math.cos(a) * 0.07, y + 0.41, z + Math.sin(a) * 0.07, { cast: false });
    }
  },

  rug(F, x, z, w, d, ry = 0, o = {}) {
    const top = new THREE.MeshStandardMaterial({ map: Look.rug(o.kind || "border", o.colors || [0x3a2a22, 0xc9a86a, 0x6a2a2a]), roughness: 0.95 });
    const side = Kit.M(new THREE.Color(o.colors ? o.colors[0] : 0x3a2a22).multiplyScalar(0.6).getHex(), { rough: 1 });
    const m = new THREE.Mesh(Kit.geo(`rug${w},${d}`, () => new THREE.BoxGeometry(w, 0.018, d)), [side, side, top, side, side, side]);
    m.position.set(x, 0.009, z); m.rotation.y = ry; m.receiveShadow = true;
    F.group.add(m);
    return m;
  },

  /* ---------- plants ---------- */
  pot(p, x, y, z, s, style) {
    const pm = {
      terra: Kit.M(0xb86a45, { rough: 0.85 }), white: Kit.M(0xeeeae2, { rough: 0.4 }), black: Kit.M(0x1d1e22, { rough: 0.35, env: 1.3 }),
      brass: Kit.gold(), concrete: Look.mat("concrete", 0x8a8a86, { tile: 0.5 }), green: Kit.M(0x2d4a3e, { rough: 0.3, env: 1.4 }),
    }[style || "terra"];
    Kit.L(p, [[0, 0], [0.16 * s, 0], [0.19 * s, 0.03 * s], [0.22 * s, 0.3 * s], [0.24 * s, 0.32 * s], [0.24 * s, 0.35 * s], [0.2 * s, 0.35 * s], [0, 0.33 * s]], pm, x, y, z, { seg: 22 });
    Kit.C(p, 0.2 * s, 0.2 * s, 0.01, Kit.M(0x3a2618, { rough: 1 }), x, y + 0.325 * s, z, { seg: 18, cast: false });
    return 0.33 * s;
  },

  plant(F, x, z, o = {}) {
    const g = Kit.grp(F, x, z, o.ry || 0, o.y || 0);
    const kind = o.kind || "monstera", s = o.s || 1;
    const top = Kit.pot(g, 0, 0, 0, s, o.pot);
    const leaves = new THREE.Group(); leaves.position.y = top; g.add(leaves);
    const stem = Kit.M(0x3d6b3a, { rough: 0.7 });
    const R = Kit.seeded(x, z);
    if (kind === "monstera") {
      const lm = Look.leaf("monstera");
      for (let i = 0; i < 8; i++) {
        const a = i * 0.785 + R() * 0.4, tilt = 0.5 + R() * 0.5, len = (0.45 + R() * 0.35) * s;
        const sg = new THREE.Group(); sg.rotation.y = a; leaves.add(sg);
        Kit.C(sg, 0.008 * s, 0.01 * s, len, stem, 0.0, len / 2, len * 0.28, { rx: tilt * 0.6, seg: 5, cast: false });
        const leaf = new THREE.Mesh(Kit.geo("leafp", () => new THREE.PlaneGeometry(1, 1)), lm);
        const ls = (0.34 + R() * 0.18) * s;
        leaf.scale.set(ls, ls * 1.05, 1);
        leaf.position.set(0, len * 0.95, len * 0.55);
        leaf.rotation.set(-Math.PI / 2 + tilt * 1.1, 0, 0);
        leaf.castShadow = true;
        sg.add(leaf);
      }
    } else if (kind === "fern" || kind === "palm") {
      const lm = Look.leaf(kind);
      const n = kind === "fern" ? 12 : 9;
      for (let i = 0; i < n; i++) {
        const a = i * (6.283 / n) + R() * 0.3;
        const sg = new THREE.Group(); sg.rotation.y = a; leaves.add(sg);
        const leaf = new THREE.Mesh(Kit.geo("leafp", () => new THREE.PlaneGeometry(1, 1)), lm);
        const L = (kind === "fern" ? 0.6 : 1.3) * s * (0.8 + R() * 0.4);
        leaf.scale.set(L * 0.55, L, 1);
        leaf.position.set(0, L * 0.38, L * 0.28);
        leaf.rotation.set(-0.75 - R() * 0.4, 0, 0);
        leaf.castShadow = true;
        sg.add(leaf);
      }
    } else if (kind === "snake") {
      const lm = Look.leaf("blade");
      for (let i = 0; i < 9; i++) {
        const a = i * 0.7;
        const leaf = new THREE.Mesh(Kit.geo("leafp", () => new THREE.PlaneGeometry(1, 1)), lm);
        const L = (0.55 + R() * 0.35) * s;
        leaf.scale.set(0.16 * s, L, 1);
        leaf.position.set(Math.cos(a) * 0.06 * s, L / 2, Math.sin(a) * 0.06 * s);
        leaf.rotation.set(Math.sin(a) * 0.12, a, Math.cos(a) * 0.12);
        leaf.castShadow = true;
        leaves.add(leaf);
      }
    } else if (kind === "fiddle") {
      Kit.C(leaves, 0.02 * s, 0.03 * s, 1.3 * s, Kit.M(0x5a4030), 0, 0.65 * s, 0, { seg: 6 });
      const lm = Look.leaf("round");
      for (let i = 0; i < 16; i++) {
        const a = i * 2.4, y = (0.45 + (i / 16) * 0.95) * s;
        const leaf = new THREE.Mesh(Kit.geo("leafp", () => new THREE.PlaneGeometry(1, 1)), lm);
        const ls = (0.3 - i * 0.006) * s;
        leaf.scale.set(ls, ls * 1.2, 1);
        leaf.position.set(Math.cos(a) * 0.12 * s, y, Math.sin(a) * 0.12 * s);
        leaf.rotation.set(-0.5, -a + Math.PI / 2, 0.3);
        leaf.castShadow = true;
        leaves.add(leaf);
      }
    } else { // bush / topiary
      const bm = Kit.M(0x3f7d45, { rough: 0.8 });
      for (let i = 0; i < 6; i++) {
        const a = i * 1.1;
        Kit.S(leaves, (0.2 + R() * 0.1) * s, bm, Math.cos(a) * 0.12 * s, (0.2 + R() * 0.15) * s, Math.sin(a) * 0.12 * s, { seg: 12 });
      }
      Kit.S(leaves, 0.25 * s, bm, 0, 0.32 * s, 0, { seg: 12 });
    }
    const seed = R() * 10;
    F.dynamic.push({ update(dt, t) { leaves.rotation.z = Math.sin(t * 0.7 + seed) * 0.025; leaves.rotation.x = Math.cos(t * 0.5 + seed) * 0.02; } });
    Kit.collide(F, x, z, 0.5 * s, 0.5 * s, 0, { aoK: 0.6 });
    if (o.interact !== false) {
      Kit.hot(F, { x, z, y: 1.2 * s, r: 1.5, label: "Water the plant", node: leaves, fn: () => {
        UI.say(U.pick(CONTENT.texts.plant)); AudioSys.sfx("pop");
        Game.sparkle(x, 1.0, z, 0x9fdcff, 14);
        leaves.scale.setScalar(1.08); setTimeout(() => leaves.scale.setScalar(1), 400);
      }});
    }
    return g;
  },

  tree(F, x, z, o = {}) {
    const g = Kit.grp(F, x, z, 0);
    const s = o.s || 1;
    Kit.B(g, 1.1 * s, 0.45, 1.1 * s, Look.mat("concrete", 0x55575c, { tile: 1 }), 0, 0.225, 0, { r: 0.04 });
    Kit.B(g, 1.0 * s, 0.02, 1.0 * s, Kit.M(0x2a1c12, { rough: 1 }), 0, 0.45, 0, { r: 0.005 });
    Kit.C(g, 0.07 * s, 0.1 * s, 2.0 * s, Kit.M(0x4a3526, { rough: 0.9 }), 0, 1.35 * s, 0, { seg: 8 });
    const cm = [Kit.M(0x2f6b3c, { rough: 0.85 }), Kit.M(0x3f8248, { rough: 0.85 }), Kit.M(0x28603a, { rough: 0.85 })];
    const R = Kit.seeded(x, z);
    for (let i = 0; i < 6; i++) {
      const a = i * 1.1;
      Kit.S(g, (0.55 + R() * 0.3) * s, cm[i % 3], Math.cos(a) * 0.45 * s, (2.45 + R() * 0.6) * s, Math.sin(a) * 0.45 * s, { seg: 14 });
    }
    Kit.S(g, 0.7 * s, cm[1], 0, 3.0 * s, 0, { seg: 14 });
    Kit.collide(F, x, z, 1.1 * s, 1.1 * s, 0);
  },

  /* ---------- lighting fixtures ---------- */
  floorLamp(F, x, z, o = {}) {
    const g = Kit.grp(F, x, z, o.ry || 0);
    const col = o.color || 0xffd9a0;
    const brass = Kit.gold();
    Kit.C(g, 0.16, 0.18, 0.03, brass, 0, 0.015, 0, { seg: 20 });
    Kit.C(g, 0.012, 0.012, 1.5, brass, 0, 0.77, 0, { seg: 8 });
    Kit.L(g, [[0.1, 0], [0.22, 0], [0.16, 0.3], [0.1, 0.3]], Look.mat("fabric", 0xf2e6cc, { tile: 0.2, rough: 1 }), 0, 1.35, 0, { seg: 20, cast: false });
    Kit.S(g, 0.05, Kit.G(col, 1.6), 0, 1.42, 0, { cast: false });
    if (o.light !== false) Kit.light(F, x, 1.55, z, col, o.intensity || 0.9, o.dist || 6);
    Kit.collide(F, x, z, 0.36, 0.36, 0, { aoK: 0.5 });
  },

  deskLamp(p, x, y, z, kind) {
    if (kind === "banker") {
      Kit.C(p, 0.08, 0.09, 0.02, Kit.gold(), x, y + 0.01, z, { seg: 16 });
      Kit.C(p, 0.01, 0.01, 0.3, Kit.gold(), x, y + 0.16, z, { seg: 6 });
      const sh = Kit.C(p, 0.08, 0.08, 0.26, Kit.M(0x1f6b45, { rough: 0.15, env: 1.6, emissive: 0x2a8a55, ei: 0.25 }), x, y + 0.33, z, { seg: 16, open: false, rz: Math.PI / 2, sy: 1, sz: 0.55 });
      Kit.B(p, 0.24, 0.01, 0.06, Kit.G(0xfff1c8, 1.6), x, y + 0.29, z, { r: 0.004, cast: false });
    } else {
      Kit.C(p, 0.07, 0.08, 0.02, Kit.M(0x1d1e22), x, y + 0.01, z, { seg: 14 });
      Kit.C(p, 0.008, 0.008, 0.34, Kit.M(0x1d1e22), x, y + 0.18, z + 0.03, { rx: 0.3, seg: 6 });
      Kit.L(p, [[0.02, 0], [0.08, 0.1], [0.07, 0.11], [0.015, 0.02]], Kit.M(0x1d1e22), x, y + 0.36, z + 0.1, { rx: Math.PI * 0.8, seg: 14 });
      Kit.S(p, 0.025, Kit.G(0xfff1c8, 1.5), x, y + 0.33, z + 0.14, { cast: false });
    }
  },

  pendant(F, x, z, o = {}) {
    const h0 = o.h || F.ceilH, h = Math.max(h0, F.ceilH), drop = (o.drop || 1.2) + (h - h0);
    const col = o.color || 0xffd9a0;
    const g = Kit.grp(F, x, z, 0, h);
    Kit.C(g, 0.004, 0.004, drop, Kit.M(0x111111), 0, -drop / 2, 0, { seg: 4, cast: false });
    const style = o.style || "dome";
    const shade = o.shade || Kit.M(0x1e2024, { rough: 0.35, metal: 0.6, side: THREE.DoubleSide });
    if (style === "dome") Kit.L(g, [[0.02, 0], [0.12, -0.04], [0.24, -0.2], [0.26, -0.24]], shade, 0, -drop, 0, { seg: 28, cast: false });
    else if (style === "cylinder") Kit.C(g, 0.1, 0.1, 0.3, shade, 0, -drop - 0.1, 0, { seg: 20, open: true, cast: false });
    else if (style === "globe") Kit.S(g, 0.16, Kit.G(col, 1.25), 0, -drop - 0.12, 0, { seg: 20, cast: false });
    else if (style === "cone") Kit.L(g, [[0.015, 0], [0.2, -0.28], [0.21, -0.29]], shade, 0, -drop, 0, { seg: 24, cast: false });
    if (style !== "globe") Kit.S(g, 0.055, Kit.G(col, 1.8), 0, -drop - (style === "dome" ? 0.17 : 0.2), 0, { cast: false });
    if (o.light) Kit.light(F, x, h - drop - 0.3, z, col, o.intensity || 0.8, o.dist || 7);
    return g;
  },

  chandelier(F, x, z, o = {}) {
    const h0 = o.h || F.ceilH, h = Math.max(h0, F.ceilH), drop = (o.drop || 1.1) + (h - h0);
    const g = Kit.grp(F, x, z, 0, h - drop);
    const gold = Kit.gold();
    Kit.C(g, 0.01, 0.01, drop, gold, 0, drop / 2, 0, { seg: 6, cast: false });
    Kit.T(g, o.r || 0.7, 0.025, gold, 0, 0, 0, { rx: Math.PI / 2, cast: false });
    Kit.T(g, (o.r || 0.7) * 0.55, 0.02, gold, 0, 0.22, 0, { rx: Math.PI / 2, cast: false });
    Kit.S(g, 0.08, gold, 0, -0.1, 0);
    const n = o.n || 10;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, R = o.r || 0.7;
      Kit.C(g, 0.02, 0.02, 0.12, Kit.M(0xf4ecd8), Math.cos(a) * R, 0.07, Math.sin(a) * R, { seg: 8, cast: false });
      Kit.S(g, 0.035, Kit.G(0xffcf80, 2.0), Math.cos(a) * R, 0.17, Math.sin(a) * R, { sy: 1.5, cast: false });
    }
    for (let i = 0; i < 16; i++) { // crystals
      const a = (i / 16) * Math.PI * 2;
      Kit.S(g, 0.022, Kit.M(0xffffff, { rough: 0.05, metal: 0.2, env: 3, opacity: 0.8 }), Math.cos(a) * (o.r || 0.7) * 0.85, -0.12 - (i % 3) * 0.04, Math.sin(a) * (o.r || 0.7) * 0.85, { sy: 1.8, cast: false });
    }
    Kit.light(F, x, h - drop, z, 0xffcf80, o.intensity || 1.4, o.dist || 11);
    return g;
  },

  sconce(F, x, y, z, ry, col = 0xffc978) {
    const nx = Math.sin(ry), nz = Math.cos(ry);
    const g = Kit.grp(F, x + nx * 0.06, z + nz * 0.06, ry, y);
    Kit.B(g, 0.12, 0.22, 0.03, Kit.gold(), 0, 0, -0.03, { r: 0.012 });
    Kit.L(g, [[0.03, 0], [0.075, 0.06], [0.08, 0.16], [0.07, 0.17]], Kit.M(0xf4ead0, { rough: 0.9, emissive: col, ei: 0.55, side: THREE.DoubleSide }), 0, 0.02, 0.07, { seg: 16, cast: false });
    Kit.S(g, 0.03, Kit.G(col, 1.8), 0, 0.1, 0.07, { cast: false });
    F.decor.push(g);
    return g;
  },

  /* ---------- storage & books ---------- */
  bookcase(F, x, z, ry, o = {}) {
    const g = Kit.grp(F, x, z, ry);
    const w = o.w || 2, H = o.h || 2.3, D = 0.36, rows = o.rows || 5;
    const wood = o.wood || Kit.M(0x3e2a1a, { rough: 0.55 });
    Kit.B(g, w, H, 0.04, wood, 0, H / 2, -D / 2 + 0.02, { r: 0.005 });
    for (const s of [-1, 1]) Kit.B(g, 0.05, H, D, wood, s * (w / 2 - 0.025), H / 2, 0, { r: 0.012 });
    Kit.B(g, w + 0.06, 0.06, D + 0.04, wood, 0, H, 0, { r: 0.015 });
    for (let r = 0; r <= rows; r++) Kit.B(g, w - 0.08, 0.035, D - 0.02, wood, 0, 0.08 + (H - 0.16) * (r / rows), 0, { r: 0.006, cast: false });
    const R = Kit.seeded(x, z);
    const pal = o.palette || [0x8c2f2f, 0x2f4a6e, 0x2f6e4a, 0xc9a227, 0x6e3a6e, 0xb8683a, 0x3a3a44, 0xe8e2d4, 0x1f5a5a];
    const bookGeo = Kit.geo("bk", () => new THREE.BoxGeometry(1, 1, 1));
    const count = Math.floor((w - 0.12) / 0.05) * rows;
    const inst = new THREE.InstancedMesh(bookGeo, new THREE.MeshStandardMaterial({ roughness: 0.7 }), count);
    const dm = new THREE.Object3D(); let k = 0;
    const col = new THREE.Color();
    const skip = o.skipRows || [];
    for (let r = 0; r < rows; r++) {
      const sy = 0.08 + (H - 0.16) * (r / rows) + 0.02;
      const rowH = (H - 0.16) / rows;
      let cx = -w / 2 + 0.08;
      const endAt = w / 2 - 0.08 - (R() < 0.45 ? 0.3 : 0);
      if (skip.includes(r)) continue;
      while (cx < endAt && k < count) {
        const bw = 0.025 + R() * 0.035, bh = Math.min(rowH - 0.03, 0.2 + R() * 0.14), bd = 0.2 + R() * 0.07;
        const lean = R() < 0.05 ? 0.25 : 0;
        dm.position.set(cx + bw / 2 + (lean ? 0.04 : 0), sy + bh / 2, 0.02);
        dm.rotation.set(0, 0, -lean);
        dm.scale.set(bw, bh, bd);
        dm.updateMatrix();
        inst.setMatrixAt(k, dm.matrix);
        col.setHex(pal[Math.floor(R() * pal.length)]).multiplyScalar(0.7 + R() * 0.45);
        inst.setColorAt(k, col);
        k++; cx += bw + 0.003;
        if (R() < 0.04) cx += 0.12; // gap
      }
      // a decor object at the end of some rows
      if (endAt < w / 2 - 0.2 && !o.noDecor) {
        const ex = w / 2 - 0.25, pick = R();
        if (pick < 0.35) Kit.succulent(g, ex, sy - 0.02, 0.02);
        else if (pick < 0.6) Kit.S(g, 0.08, Kit.M(0x2a4a6a, { rough: 0.3, env: 1.4 }), ex, sy + 0.08, 0.02); // globe-ish
        else if (pick < 0.8) Kit.B(g, 0.2, 0.12, 0.16, Kit.M(0x8a6a4a, { rough: 0.7 }), ex, sy + 0.06, 0.02, { r: 0.01 });
        else Kit.duck(g, ex, sy, 0.02, 0.9);
      }
    }
    inst.count = k;
    inst.castShadow = true; inst.receiveShadow = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    g.add(inst);
    Kit.colLocal(F, g, 0, 0, w + 0.06, D + 0.06);
    return g;
  },

  /* an openable book: pulled out, gold-rimmed, gently glowing */
  book(F, parent, lx, ly, lz, book, color = 0x8c2f2f) {
    const g = new THREE.Group(); g.position.set(lx, ly, lz); parent.add(g);
    Kit.B(g, 0.055, 0.3, 0.22, Kit.M(color, { rough: 0.55, emissive: color, ei: 0.18 }), 0, 0.15, 0.06, { r: 0.006 });
    Kit.B(g, 0.057, 0.02, 0.222, Kit.G(0xffd98a, 1.2), 0, 0.23, 0.06, { r: 0.004, cast: false });
    Kit.B(g, 0.057, 0.02, 0.222, Kit.G(0xffd98a, 1.2), 0, 0.07, 0.06, { r: 0.004, cast: false });
    const wp = new THREE.Vector3(); g.updateWorldMatrix(true, false); g.getWorldPosition(wp);
    // marker sits a little in front of the shelf so it's reachable
    const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(parent.getWorldQuaternion(new THREE.Quaternion()));
    Kit.hot(F, { x: wp.x + fwd.x * 0.5, z: wp.z + fwd.z * 0.5, y: wp.y + 0.55, r: 1.5, label: `Open “${book.title}”`, node: g, ref: book.repo || book, fn: () => { AudioSys.sfx("open"); UI.openBook(book); } });
    const seed = lx * 7 + ly * 3;
    F.dynamic.push({ update(dt, t) { g.position.z = lz + 0.03 + Math.sin(t * 1.6 + seed) * 0.015; } });
    return g;
  },

  filing(F, x, z, ry = 0, o = {}) {
    const g = Kit.grp(F, x, z, ry);
    const m = Kit.M(o.color || 0x6f7a84, { rough: 0.45, metal: 0.45 });
    const n = o.n || 4;
    Kit.B(g, 0.46, n * 0.33, 0.62, m, 0, n * 0.165, 0, { r: 0.015 });
    for (let i = 0; i < n; i++) {
      Kit.B(g, 0.42, 0.29, 0.02, m, 0, 0.17 + i * 0.33, 0.31, { r: 0.008 });
      Kit.B(g, 0.14, 0.02, 0.03, Kit.metal(0xc8ccd2), 0, 0.26 + i * 0.33, 0.33, { r: 0.006, cast: false });
      Kit.B(g, 0.09, 0.04, 0.005, Kit.M(0xf4f1ea), 0, 0.2 + i * 0.33, 0.325, { r: 0.001, cast: false });
    }
    if (o.plant) Kit.succulent(g, 0.1, n * 0.33, 0);
    Kit.colLocal(F, g, 0, 0, 0.5, 0.66);
    return g;
  },

  boxes(F, x, z, ry = 0) {
    const g = Kit.grp(F, x, z, ry);
    const cm = Kit.M(0xb08a5a, { rough: 0.9 });
    Kit.B(g, 0.5, 0.4, 0.4, cm, 0, 0.2, 0, { r: 0.015 });
    Kit.B(g, 0.4, 0.32, 0.36, cm, 0.05, 0.56, 0.02, { r: 0.015, ry: 0.2 });
    Kit.B(g, 0.52, 0.04, 0.06, Kit.M(0xd8c8a8), 0, 0.4, 0, { r: 0.01, cast: false });
    Kit.colLocal(F, g, 0, 0, 0.55, 0.45);
  },

  /* ---------- appliances ---------- */
  coffeeBar(F, x, z, ry = 0, o = {}) {
    const g = Kit.grp(F, x, z, ry);
    const w = o.w || 2.2;
    const body = o.body || Kit.M(0x2a2420, { rough: 0.5 });
    const top = o.top || Look.mat("marble", 0xe8e4dc, { rough: 0.18, tile: 1.4, env: 1.3 });
    Kit.B(g, w, 0.9, 0.62, body, 0, 0.45, 0, { r: 0.02 });
    Kit.B(g, w + 0.04, 0.05, 0.66, top, 0, 0.925, 0, { r: 0.015 });
    for (let i = 0; i < Math.floor(w / 0.55); i++) Kit.B(g, 0.02, 0.5, 0.02, Kit.gold(), -w / 2 + 0.3 + i * 0.55, 0.5, 0.32, { r: 0.008, cast: false });
    // espresso machine
    const em = new THREE.Group(); em.position.set(-w / 2 + 0.55, 0.95, -0.05); g.add(em);
    const chrome = Kit.metal(0xd0d4da, 0.15);
    Kit.B(em, 0.6, 0.42, 0.42, o.machine ? Kit.M(o.machine, { rough: 0.3, env: 1.4 }) : Kit.M(0x9a2f2f, { rough: 0.25, env: 1.4 }), 0, 0.21, 0, { r: 0.05 });
    Kit.B(em, 0.62, 0.05, 0.44, chrome, 0, 0.44, 0, { r: 0.02 });
    Kit.B(em, 0.5, 0.03, 0.2, chrome, 0, 0.02, 0.2, { r: 0.01 });
    for (const s of [-1, 1]) {
      Kit.C(em, 0.035, 0.035, 0.06, chrome, s * 0.14, 0.24, 0.23, { seg: 12 });
      Kit.B(em, 0.03, 0.02, 0.16, Kit.M(0x111111), s * 0.14, 0.2, 0.3, { r: 0.008 });
      Kit.mug(em, s * 0.14, 0.035, 0.22, 0xf4f1ea);
    }
    Kit.S(em, 0.035, chrome, 0.23, 0.33, 0.21, { cast: false });
    Kit.C(em, 0.004, 0.004, 0.2, chrome, 0.26, 0.25, 0.22, { rz: 0.4, seg: 5, cast: false });
    // grinder + cups tower
    Kit.C(g, 0.08, 0.09, 0.22, Kit.M(0x1d1e22, { rough: 0.3 }), -w / 2 + 1.05, 1.06, -0.1, { seg: 16 });
    Kit.L(g, [[0.03, 0], [0.1, 0.02], [0.12, 0.16], [0.03, 0.16]], Kit.M(0xf4f1ea, { opacity: 0.55, rough: 0.1 }), -w / 2 + 1.05, 1.17, -0.1, { seg: 16, cast: false });
    for (let i = 0; i < 4; i++) Kit.mug(g, w / 2 - 0.4 + (i % 2) * 0.1, 0.95 + Math.floor(i / 2) * 0.1, -0.12, 0xf4f1ea);
    // steam
    const smat = new THREE.SpriteMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
    const steam = new THREE.Sprite(smat); steam.scale.set(0.25, 0.4, 1); em.add(steam);
    const st = { burst: 0 };
    F.dynamic.push({ update(dt, t) {
      const p = (t * 0.45 + x) % 1;
      st.burst = Math.max(0, st.burst - dt * 0.5);
      smat.opacity = (p < 0.55 ? 0.18 * Math.sin(p / 0.55 * Math.PI) : 0) + st.burst * 0.35;
      steam.position.set(0.14, 0.45 + p * 0.4, 0.22);
    }});
    Kit.colLocal(F, g, 0, 0, w + 0.1, 0.7);
    Kit.hot(F, { x, z, y: 1.7, r: 1.8, label: o.label || "Make a coffee", node: em, fn: () => { st.burst = 1; AudioSys.sfx("coffee"); UI.say(U.pick(CONTENT.texts.coffee)); } });
    return g;
  },

  waterCooler(F, x, z, ry = 0) {
    const g = Kit.grp(F, x, z, ry);
    Kit.B(g, 0.36, 1.0, 0.36, Kit.M(0xe8eaee, { rough: 0.4 }), 0, 0.5, 0, { r: 0.03 });
    Kit.C(g, 0.15, 0.16, 0.42, Kit.M(0x8fd0ff, { rough: 0.05, opacity: 0.55, env: 2 }), 0, 1.22, 0, { seg: 18 });
    Kit.B(g, 0.12, 0.05, 0.03, Kit.M(0x2e86c1), 0, 0.82, 0.18, { r: 0.01, cast: false });
    Kit.colLocal(F, g, 0, 0, 0.4, 0.4);
    Kit.hot(F, { x, z, y: 1.6, r: 1.4, label: "Water cooler", fn: () => { AudioSys.sfx("pop"); UI.say(U.pick(["Glug glug. The best meetings happen here.", "You overhear: “…so we rewrote it in Rust.” You walk away quietly.", "Hydration: acquired. Gossip: pending."])); } });
  },

  vending(F, x, z, ry = 0) {
    const g = Kit.grp(F, x, z, ry);
    Kit.B(g, 0.9, 1.9, 0.75, Kit.M(0xb8323f, { rough: 0.35, env: 1.2 }), 0, 0.95, 0, { r: 0.04 });
    Kit.B(g, 0.6, 1.3, 0.02, Kit.M(0xcfe8ff, { rough: 0.05, opacity: 0.35, env: 2 }), -0.08, 1.15, 0.38, { r: 0.01, cast: false });
    const cols = [0xffd166, 0x57d8ff, 0x7ae582, 0xff6b57, 0xc084fc];
    for (let r = 0; r < 5; r++) for (let i = 0; i < 4; i++) Kit.B(g, 0.1, 0.18, 0.1, Kit.M(cols[(r + i) % 5], { rough: 0.4 }), -0.3 + i * 0.14, 0.62 + r * 0.24, 0.24, { r: 0.02, cast: false });
    Kit.B(g, 0.14, 0.4, 0.02, Kit.G(0x57d8ff, 0.8), 0.33, 1.3, 0.38, { r: 0.01, cast: false });
    Kit.colLocal(F, g, 0, 0, 0.95, 0.8);
  },

  wallClock(F, x, y, z, ry) {
    const g = Kit.grp(F, x, z, ry, y);
    Kit.C(g, 0.22, 0.22, 0.05, Kit.M(0x1d1e22, { rough: 0.4 }), 0, 0, 0.02, { rx: Math.PI / 2, seg: 28 });
    Kit.C(g, 0.195, 0.195, 0.01, Kit.M(0xf4f1ea, { rough: 0.6 }), 0, 0, 0.05, { rx: Math.PI / 2, seg: 28, cast: false });
    const hh = new THREE.Group(), mh = new THREE.Group(); hh.position.z = 0.06; mh.position.z = 0.065; g.add(hh); g.add(mh);
    Kit.B(hh, 0.012, 0.1, 0.006, Kit.M(0x111111), 0, 0.045, 0, { r: 0.002, cast: false });
    Kit.B(mh, 0.008, 0.15, 0.006, Kit.M(0x111111), 0, 0.07, 0, { r: 0.002, cast: false });
    for (let i = 0; i < 12; i++) Kit.B(g, 0.01, i % 3 ? 0.02 : 0.035, 0.004, Kit.M(0x111111), Math.sin(i * 0.5236) * 0.17, Math.cos(i * 0.5236) * 0.17, 0.056, { rz: -i * 0.5236, r: 0.001, cast: false });
    F.dynamic.push({ update() { const d = new Date(); mh.rotation.z = -(d.getMinutes() + d.getSeconds() / 60) / 60 * Math.PI * 2; hh.rotation.z = -((d.getHours() % 12) + d.getMinutes() / 60) / 12 * Math.PI * 2; } });
    F.decor.push(g);
  },

  serverRack(F, x, z, ry = 0, o = {}) {
    const g = Kit.grp(F, x, z, ry);
    Kit.B(g, 0.66, 2.05, 0.9, Kit.M(0x16181e, { rough: 0.35, metal: 0.55 }), 0, 1.025, 0, { r: 0.02 });
    const tex = Kit.poolTex("rack" + (o.alert ? "A" : ""));
    if (!Kit._pool["rack" + (o.alert ? "A" : "")].draw._set) {
      const alert = !!o.alert;
      Kit._pool["rack" + (alert ? "A" : "")].draw = (c, w, h, t) => {
        c.fillStyle = "#07080b"; c.fillRect(0, 0, w, h);
        for (let r = 0; r < 12; r++) {
          c.fillStyle = "#12151c"; c.fillRect(8, 4 + r * 13, w - 16, 11);
          for (let i = 0; i < 6; i++) {
            const on = Math.sin(t * (2 + (r + i) % 4) + r * 2.3 + i * 1.7) > 0;
            c.fillStyle = on ? (alert && r === 6 ? "#ff5f45" : ["#39d353", "#57d8ff", "#ffd166"][(r + i) % 3]) : "#1d212a";
            c.fillRect(14 + i * 10, 7 + r * 13, 5, 3);
          }
          c.fillStyle = "#1a1e26"; for (let v = 0; v < 12; v++) c.fillRect(90 + v * 12, 6 + r * 13, 6, 7);
        }
      };
      Kit._pool["rack" + (alert ? "A" : "")].draw._set = true;
    }
    const face = new THREE.Mesh(Kit.geo("rackf", () => new THREE.PlaneGeometry(0.58, 1.9)), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    face.position.set(0, 1.03, 0.452); g.add(face);
    Kit.B(g, 0.62, 1.95, 0.02, Kit.M(0x0a0c10, { rough: 0.2, opacity: 0.35, env: 2 }), 0, 1.03, 0.47, { r: 0.01, cast: false });
    Kit.colLocal(F, g, 0, 0, 0.72, 0.96);
    return g;
  },

  whiteboard(F, x, z, ry = 0, o = {}) {
    const g = Kit.grp(F, x, z, ry);
    const w = o.w || 1.9;
    Kit.B(g, w, 1.15, 0.04, Kit.metal(0xc8ccd2, 0.3), 0, 1.45, 0, { r: 0.02 });
    const state = { prog: o.pre ? 1 : 0, active: false };
    const boxes = o.boxes || ["API", "Queue", "Worker", "DB"];
    Kit.screen(F, w - 0.1, 1.05, (c, cw, ch) => {
      c.fillStyle = "#f7f6f1"; c.fillRect(0, 0, cw, ch);
      if (state.active) state.prog = Math.min(1, state.prog + 0.05);
      const p = state.prog;
      c.lineWidth = 4; c.lineCap = "round";
      c.font = `600 ${ch * 0.085}px ${Kit.FONT}`; c.textAlign = "center"; c.textBaseline = "middle";
      boxes.forEach((b, i) => {
        if (p < (i + 1) / boxes.length * 0.6) return;
        const bx = cw * (0.13 + 0.74 * (i / (boxes.length - 1))), by = ch * (i % 2 ? 0.62 : 0.34);
        c.strokeStyle = ["#2f5a9a", "#b33a3a", "#2c7a4b", "#8a5a1a"][i % 4];
        c.strokeRect(bx - cw * 0.09, by - ch * 0.1, cw * 0.18, ch * 0.2);
        c.fillStyle = c.strokeStyle; c.fillText(b, bx, by);
        if (i > 0) {
          const px = cw * (0.13 + 0.74 * ((i - 1) / (boxes.length - 1))), py = ch * ((i - 1) % 2 ? 0.62 : 0.34);
          c.strokeStyle = "#333"; c.beginPath(); c.moveTo(px + cw * 0.09, py); c.lineTo(bx - cw * 0.09, by); c.stroke();
          c.beginPath(); c.arc(bx - cw * 0.09, by, 4, 0, Math.PI * 2); c.fillStyle = "#333"; c.fill();
        }
      });
      if (p > 0.95) { c.fillStyle = "#b33a3a"; c.font = `600 ${ch * 0.07}px ${Kit.FONT}`; c.fillText(o.punch || "…and THAT is why we need a DLQ", cw / 2, ch * 0.88); }
      if (p === 0) { c.fillStyle = "rgba(47,90,154,0.55)"; c.font = `500 ${ch * 0.075}px ${Kit.FONT}`; c.fillText("press E — watch the design happen", cw / 2, ch / 2); }
    }, 0, 1.45, 0.022, 0, { parent: g, fps: 10, px: 384 });
    Kit.B(g, w * 0.5, 0.03, 0.08, Kit.metal(0xc8ccd2), 0, 0.86, 0.05, { r: 0.01 });
    for (let i = 0; i < 3; i++) Kit.C(g, 0.01, 0.01, 0.1, Kit.M([0x2f5a9a, 0xb33a3a, 0x2c7a4b][i]), -0.15 + i * 0.1, 0.89, 0.06, { rz: Math.PI / 2, seg: 6, cast: false });
    if (o.stand !== false) {
      for (const s of [-1, 1]) {
        Kit.B(g, 0.05, 2.0, 0.05, Kit.metal(0x9aa0a8), s * (w / 2 - 0.05), 1.0, -0.04, { r: 0.012 });
        Kit.B(g, 0.06, 0.04, 0.6, Kit.metal(0x9aa0a8), s * (w / 2 - 0.05), 0.04, -0.04, { r: 0.012 });
      }
      Kit.colLocal(F, g, 0, -0.04, w, 0.6);
    }
    Kit.hot(F, { x: x + Math.sin(ry) * 0.9, z: z + Math.cos(ry) * 0.9, y: 2.3, r: 2, label: o.label || "Whiteboard — watch the design", node: g, fn: () => { state.prog = 0; state.active = true; AudioSys.sfx("blip"); } });
    return g;
  },

  /* ---------- statement pieces ---------- */
  /* curved desk; (x,z) is the front-most point of the curve, bulging toward +z */
  receptionDesk(F, x, z, o = {}) {
    const R = o.r || 2.6, H = 1.1;
    const g = Kit.grp(F, x, z - R, 0);
    // shape angle θ maps to world (cosθ·r, −sinθ·r); θ∈(1.1π,1.9π) → front arc faces +z
    const a0 = Math.PI * 1.16, a1 = Math.PI * 1.84;
    const mk = (r1, r2, h, mat, y, bevel = true) => {
      const sh = new THREE.Shape();
      sh.absarc(0, 0, r2, a0, a1, false);
      sh.absarc(0, 0, r1, a1, a0, true);
      const geo = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: bevel, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2, curveSegments: 48 });
      const m = new THREE.Mesh(geo, mat);
      m.rotation.x = -Math.PI / 2; m.position.y = y;
      m.castShadow = true; m.receiveShadow = true;
      g.add(m); return m;
    };
    mk(R - 0.6, R, H - 0.07, o.body || Look.mat("marble", 0x17120e, { v: "rgba(217,164,65,A)", rough: 0.14, tile: 1.4, env: 1.4 }), 0);
    mk(R - 0.7, R + 0.07, 0.06, o.top || Kit.M(0xe9e3d6, { rough: 0.18, env: 1.3 }), H - 0.07);
    mk(R + 0.004, R + 0.03, 0.05, Kit.G(0xffc36a, 2.2), 0.78, false).castShadow = false;
    mk(R - 1.05, R - 0.62, 0.72, Kit.M(0x2a211a, { rough: 0.6 }), 0);          // inner work surface
    for (let i = 0; i <= 6; i++) {
      const th = a0 + (a1 - a0) * (i / 6), rr = R - 0.3;
      Kit.collide(F, x + Math.cos(th) * rr, z - R - Math.sin(th) * rr, 0.9, 0.9, 0, { aoK: 0.9 });
    }
    return g;
  },

  stanchions(F, x1, z1, x2, z2, n = 4, rope = 0x7a1a26) {
    const gold = Kit.gold();
    const pts = [];
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1), x = x1 + (x2 - x1) * f, z = z1 + (z2 - z1) * f;
      Kit.C(F.group, 0.14, 0.16, 0.04, gold, x, 0.02, z, { seg: 18 });
      Kit.C(F.group, 0.025, 0.025, 0.95, gold, x, 0.5, z, { seg: 10 });
      Kit.S(F.group, 0.05, gold, x, 1.0, z);
      pts.push([x, z]);
    }
    const rm = Kit.M(rope, { rough: 0.7 });
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(ax, 0.9, az), new THREE.Vector3((ax + bx) / 2, 0.66, (az + bz) / 2), new THREE.Vector3(bx, 0.9, bz));
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.025, 8), rm);
      tube.castShadow = true;
      F.group.add(tube);
    }
    Kit.collide(F, (x1 + x2) / 2, (z1 + z2) / 2, Math.max(0.3, Math.abs(x2 - x1)), Math.max(0.3, Math.abs(z2 - z1)), 0, { ao: false });
  },

  fireplace(F, x, z, ry, o = {}) {
    const g = Kit.grp(F, x, z, ry);
    const stone = o.stone || Look.mat("marble", 0xe8e2d6, { rough: 0.3, tile: 1.2 });
    Kit.B(g, 2.4, 1.5, 0.5, stone, 0, 0.75, 0, { r: 0.03 });
    Kit.B(g, 2.7, 0.12, 0.62, stone, 0, 1.56, 0.04, { r: 0.03 });
    Kit.B(g, 1.3, 0.9, 0.3, Kit.M(0x0c0806, { rough: 1 }), 0, 0.55, 0.12, { r: 0.02 });
    const fireMat = Kit.G(0xff7a2a, 2.4), coreMat = Kit.G(0xffd070, 3);
    const flames = [];
    for (let i = 0; i < 7; i++) {
      const f = Kit.S(g, 0.12, i % 2 ? coreMat : fireMat, -0.42 + i * 0.14, 0.32, 0.22, { sy: 2.2, cast: false });
      flames.push(f);
    }
    for (let i = 0; i < 3; i++) Kit.C(g, 0.06, 0.06, 0.8, Kit.M(0x3a2618, { rough: 1 }), 0, 0.14 + i * 0.02, 0.2 + (i - 1) * 0.08, { rz: Math.PI / 2, ry: (i - 1) * 0.3, seg: 8 });
    const l = Kit.light(F, x + Math.sin(ry) * 1.1, 0.8, z + Math.cos(ry) * 1.1, 0xff8a3a, 2.2, 8);
    const seed = x;
    F.dynamic.push({ update(dt, t) {
      flames.forEach((f, i) => { const k = 1 + Math.sin(t * (9 + i) + i * 2 + seed) * 0.25; f.scale.set(1, 2.2 * k, 1); f.position.y = 0.3 + (k - 1) * 0.12; });
      l.intensity = Kit.LK * (2.0 + Math.sin(t * 11) * 0.3 + Math.sin(t * 7.3) * 0.2);
    }});
    Kit.colLocal(F, g, 0, 0, 2.7, 0.7);
    Kit.hot(F, { x: x + Math.sin(ry) * 1.3, z: z + Math.cos(ry) * 1.3, y: 1.9, r: 1.9, label: o.label || "Warm your hands", fn: () => UI.say(o.line || "The fire crackles. Somewhere, a log rotates. (Log rotation: important.)") });
    return g;
  },

  bell(F, x, y, z) {
    const g = Kit.grp(F, x, z, 0, y);
    const gold = Kit.gold();
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.075, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), gold);
    dome.castShadow = true; g.add(dome);
    Kit.S(g, 0.014, gold, 0, 0.085, 0);
    Kit.C(g, 0.1, 0.105, 0.018, Kit.M(0x1a1612, { rough: 0.4 }), 0, -0.009, 0, { seg: 20 });
    let dingT = -1;
    F.dynamic.push({ update(dt) { if (dingT >= 0) { dingT += dt; const s = 1 + Math.sin(dingT * 32) * 0.08 * Math.max(0, 1 - dingT); g.scale.set(s, 1 / s, s); if (dingT > 1) dingT = -1; } } });
    Kit.hot(F, { x, z, y: y + 0.45, r: 1.9, label: "Ring the bell", node: g, fn: () => { dingT = 0; AudioSys.sfx("chime"); UI.say(U.pick(CONTENT.texts.bell)); Game.event("bell"); } });
  },

  elevator(F, x, z, ry) {
    const g = Kit.grp(F, x, z, ry);
    const steel = Kit.metal(0x3a3f4a, 0.35);
    const doorM = Kit.metal(0xb9c0cc, 0.18);
    const gold = Kit.gold();
    Kit.B(g, 2.8, 3.1, 0.3, Kit.M(0x1a1c22, { rough: 0.5 }), 0, 1.55, -0.45, { r: 0.02 });
    for (const s of [-1, 1]) Kit.B(g, 0.3, 3.1, 0.8, steel, s * 1.25, 1.55, -0.1, { r: 0.03 });
    Kit.B(g, 2.8, 0.55, 0.8, steel, 0, 2.87, -0.1, { r: 0.03 });
    Kit.B(g, 2.2, 0.06, 0.06, gold, 0, 2.58, 0.31, { r: 0.02, cast: false });
    const dl = Kit.B(g, 1.08, 2.5, 0.06, doorM, -0.55, 1.26, 0.2, { r: 0.01 });
    const dr = Kit.B(g, 1.08, 2.5, 0.06, doorM, 0.55, 1.26, 0.2, { r: 0.01 });
    const cab = Kit.B(g, 2.0, 2.6, 0.02, Kit.G(0xffe2b0, 0.55), 0, 1.3, -0.25, { r: 0.005, cast: false });
    Kit.screen(F, 0.46, 0.22, (c, w, h) => {
      c.fillStyle = "#07080a"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#ffd166"; c.font = `800 ${h * 0.72}px ${Kit.FONT}`; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(Game.floorIndex === "P" ? "G" : "F" + Game.floorIndex, w / 2, h / 2 + 2);
    }, 0, 2.86, 0.31, 0, { parent: g, fps: 1, px: 96, glow: 1.2 });
    Kit.B(g, 0.14, 0.3, 0.05, Kit.M(0x121317), 1.25, 1.3, 0.32, { r: 0.015 });
    Kit.S(g, 0.03, Kit.G(0xffc36a, 1.8), 1.25, 1.36, 0.35, { cast: false });
    Kit.S(g, 0.03, Kit.G(0xffc36a, 1.8), 1.25, 1.24, 0.35, { cast: false });
    Kit.colLocal(F, g, 0, -0.15, 3.0, 1.0);
    const fx = x + Math.sin(ry) * 1.3, fz = z + Math.cos(ry) * 1.3;
    const st = { open: 0, want: 0 };
    F.dynamic.push({ update(dt) {
      st.want = Math.hypot(Game.player.x - fx, Game.player.z - fz) < 2.3 ? 1 : st.hold ? 1 : 0;
      st.open += (st.want - st.open) * Math.min(1, dt * 3.5);
      dl.position.x = -0.55 - st.open * 1.0;
      dr.position.x = 0.55 + st.open * 1.0;
    }});
    Kit.hot(F, { x: fx, z: fz, y: 2.1, r: 2.0, label: "Elevator — choose a floor", node: null, fn: () => UI.openElevator() });
    F.elevator = { x, z, ry, st, spawn: { x: x + Math.sin(ry) * 2.9, z: z + Math.cos(ry) * 2.9, ry } };
    // the car is a solid box as far as the camera is concerned
    const W = (lx, lz) => [x + Math.cos(ry) * lx + Math.sin(ry) * lz, z - Math.sin(ry) * lx + Math.cos(ry) * lz];
    const cs = [W(-1.55, 0.45), W(1.55, 0.45), W(1.55, -0.7), W(-1.55, -0.7)];
    for (let i = 0; i < 4; i++) Kit.camWall(F, ...cs[i], ...cs[(i + 1) % 4], 0, 3.3);
    return g;
  },

  trophy(F, x, z, o = {}) {
    const s = o.scale || 1;
    const g = Kit.grp(F, x, z, 0);
    const gold = Kit.gold();
    Kit.B(g, 0.52 * s, 0.95 * s, 0.52 * s, o.ped || Look.mat("marble", 0x1a1714, { v: "rgba(217,164,65,A)", rough: 0.2, tile: 1, env: 1.4 }), 0, 0.475 * s, 0, { r: 0.02 });
    Kit.B(g, 0.2 * s, 0.1 * s, 0.2 * s, Kit.M(0x1a1612), 0, 1.0 * s, 0, { r: 0.01 });
    Kit.L(g, [[0, 0], [0.07, 0], [0.03, 0.04], [0.025, 0.14], [0.05, 0.16], [0.14, 0.24], [0.16, 0.38], [0.15, 0.39], [0, 0.3]].map((q) => [q[0] * s, q[1] * s]), gold, 0, 1.05 * s, 0, { seg: 26 });
    for (const sd of [-1, 1]) Kit.T(g, 0.06 * s, 0.012 * s, gold, sd * 0.16 * s, 1.34 * s, 0, { arc: Math.PI, rz: sd * -Math.PI / 2, cast: false });
    const spot = Kit.light(F, x, 2.3, z + 0.3, 0xffe6b0, 0.7, 3.5);
    Kit.collide(F, x, z, 0.6 * s, 0.6 * s, 0);
    if (o.story) Kit.hot(F, { x, z, y: 1.9 * s, r: 1.8, label: o.label || "Trophy", node: g, ref: o.ref, fn: () => { AudioSys.sfx("open"); if (o.ref) UI.panel(o.ref); else UI.story(o.label, o.story); Game.sparkle(x, 1.5 * s, z, 0xffd166, 16); } });
    return g;
  },

  candle(F, x, y, z, o = {}) {
    const g = Kit.grp(F, x, z, 0, y);
    Kit.C(g, 0.028, 0.032, 0.2, Kit.M(0xf4ecd4, { rough: 0.8, emissive: 0xffc878, ei: 0.15 }), 0, 0, 0, { seg: 10, cast: false });
    const flame = Kit.S(g, 0.02, Kit.G(0xffc060, 2.4), 0, 0.14, 0, { sy: 1.8, cast: false });
    const seed = x * 3.7 + z * 1.3;
    F.dynamic.push({ update(dt, t) {
      if (o.float !== false) g.position.y = y + Math.sin(t * 0.8 + seed) * 0.07;
      flame.scale.set(1 + Math.sin(t * 9 + seed) * 0.15, 1.8 + Math.sin(t * 11 + seed) * 0.3, 1);
    }});
    return g;
  },

  torch(F, x, z, ry, o = {}) {
    const nx = Math.sin(ry), nz = Math.cos(ry);
    const g = Kit.grp(F, x + nx * 0.12, z + nz * 0.12, ry, 2.1);
    Kit.B(g, 0.1, 0.2, 0.06, Kit.M(0x2a2018, { metal: 0.5, rough: 0.4 }), 0, 0, -0.08, { r: 0.01 });
    Kit.C(g, 0.035, 0.05, 0.42, Kit.M(0x3a2a1a, { rough: 0.8 }), 0, 0.1, 0.02, { rx: 0.35, seg: 8 });
    Kit.L(g, [[0.04, 0], [0.09, 0.08], [0.085, 0.1], [0.035, 0.03]], Kit.M(0x2a2018, { metal: 0.6, rough: 0.35 }), 0, 0.28, 0.1, { seg: 12 });
    const f1 = Kit.S(g, 0.07, Kit.G(0xff8a2a, 2.2), 0, 0.42, 0.1, { sy: 1.9, cast: false });
    const f2 = Kit.S(g, 0.045, Kit.G(0xffe08a, 2.6), 0, 0.4, 0.1, { sy: 1.6, cast: false });
    const seed = x + z * 2;
    const l = o.light !== false ? Kit.light(F, x + nx * 0.5, 2.6, z + nz * 0.5, 0xff9a40, 1.1, 8) : null;
    F.dynamic.push({ update(dt, t) {
      const k = 1 + Math.sin(t * 13 + seed) * 0.12 + Math.sin(t * 7.3 + seed) * 0.08;
      f1.scale.set(k, 1.9 * k, k); f2.scale.set(1 / k, 1.6 / k, 1 / k);
      if (l) l.intensity = Kit.LK * 1.1 * k;
    }});
    F.decor.push(g);
    return g;
  },

  banner(F, x, z, col, sym, name, o = {}) {
    const hex = "#" + new THREE.Color(col).getHexString();
    const draw = (c, w, h) => {
      c.clearRect(0, 0, w, h);
      const g = c.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, Look.shade(hex, 0.75)); g.addColorStop(0.5, hex); g.addColorStop(1, Look.shade(hex, 0.75));
      c.fillStyle = g;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(w, 0); c.lineTo(w, h * 0.86); c.lineTo(w * 0.5, h); c.lineTo(0, h * 0.86); c.closePath(); c.fill();
      c.strokeStyle = "#e0b060"; c.lineWidth = 8; c.stroke();
      c.fillStyle = "rgba(0,0,0,0.25)"; c.beginPath(); c.arc(w / 2, h * 0.38, w * 0.3, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#e0b060"; c.lineWidth = 4; c.stroke();
      c.fillStyle = "#ffd98a"; c.font = `800 ${h * 0.16}px ${Kit.FONT}`; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(sym, w / 2, h * 0.38);
      c.font = `700 ${h * 0.045}px ${Kit.FONT}`; c.fillStyle = "#f4e6c8";
      c.fillText(name, w / 2, h * 0.74);
    };
    const bw = o.w || 1.1, bh = o.h || 2.1, y = o.y || (F.ceilH - bh / 2 - 0.25);
    const ry = o.ry || 0;
    const m1 = Kit.poster(F, bw, bh, draw, x, y, z, ry, { transparent: true, px: 256, lit: true, decor: false });
    m1.material.side = THREE.DoubleSide;
    Kit.C(F.group, 0.02, 0.02, bw + 0.2, Kit.gold(), x, y + bh / 2 + 0.03, z, { rz: Math.PI / 2, ry, seg: 6 });
    const seed = x;
    F.dynamic.push({ update(dt, t) { m1.rotation.x = Math.sin(t * 0.9 + seed) * 0.04; } });
    return m1;
  },

  neon(F, text, color, x, y, z, ry = 0, o = {}) {
    const size = o.size || 0.5;
    const w = Math.max(1.2, text.length * size * 0.6), h = size * 1.6;
    const col = "#" + new THREE.Color(color).getHexString();
    if (o.plate !== false) Kit.B(F.group, w + 0.2, h + 0.06, 0.04, Kit.M(0x0c0d10, { rough: 0.4 }), x - Math.sin(ry) * 0.03, y, z - Math.cos(ry) * 0.03, { ry, r: 0.02, cast: false });
    const m = Kit.poster(F, w, h, (c, cw, ch) => {
      c.clearRect(0, 0, cw, ch);
      c.font = `800 ${ch * 0.55}px ${Kit.FONT}`;
      c.textAlign = "center"; c.textBaseline = "middle";
      c.shadowColor = col; c.shadowBlur = ch * 0.2;
      c.fillStyle = col; c.fillText(text, cw / 2, ch / 2);
      c.shadowBlur = ch * 0.06; c.fillText(text, cw / 2, ch / 2);
      c.shadowBlur = 0; c.fillStyle = "rgba(255,255,255,0.92)";
      c.font = `700 ${ch * 0.52}px ${Kit.FONT}`; c.fillText(text, cw / 2, ch / 2);
    }, x, y, z, ry, { transparent: true, px: o.px || 512, glow: o.glow || 1.5 });
    if (o.double) {   // hanging signs read from both sides
      const back = m.clone(); back.material = m.material;
      back.rotation.y = ry + Math.PI;
      back.position.set(x - Math.sin(ry) * 0.07, y, z - Math.cos(ry) * 0.07);
      F.group.add(back);
    }
    if (o.light) Kit.light(F, x + Math.sin(ry) * 0.6, y, z + Math.cos(ry) * 0.6, color, o.light === true ? 0.6 : o.light, 5);
    return m;
  },

  frameArt(F, w, h, draw, x, y, z, ry, o = {}) {
    const nx = Math.sin(ry), nz = Math.cos(ry);
    const fr = Kit.B(F.group, w + 0.1, h + 0.1, 0.05, o.frame || Kit.gold(), x, y, z, { ry, r: 0.012 });
    F.decor.push(fr);
    return Kit.poster(F, w, h, draw, x + nx * 0.028, y, z + nz * 0.028, ry, Object.assign({ lit: true }, o));
  },

  art(F, x, y, z, ry, seed = 1, w = 1.1, h = 1.4, o = {}) {
    return Kit.frameArt(F, w, h, (c, cw, ch) => {
      const R = Look.rng(seed * 13 + 1);
      const hue = R() * 360;
      const g = c.createLinearGradient(0, 0, cw, ch);
      g.addColorStop(0, `hsl(${hue},42%,${o.light ? 72 : 22}%)`); g.addColorStop(1, `hsl(${(hue + 50) % 360},38%,${o.light ? 60 : 32}%)`);
      c.fillStyle = g; c.fillRect(0, 0, cw, ch);
      for (let i = 0; i < 5; i++) {
        c.fillStyle = `hsla(${(hue + 30 + i * 40) % 360},60%,${50 + i * 6}%,0.55)`;
        c.beginPath(); c.ellipse(cw * R(), ch * R(), cw * (0.08 + R() * 0.22), ch * (0.06 + R() * 0.2), R() * 3, 0, Math.PI * 2); c.fill();
      }
      c.strokeStyle = "rgba(250,245,235,0.7)"; c.lineWidth = 4;
      c.beginPath(); c.moveTo(cw * R(), ch * 0.9); c.bezierCurveTo(cw * R(), ch * 0.5, cw * R(), ch * 0.4, cw * R(), ch * 0.1); c.stroke();
    }, x, y, z, ry, Object.assign({ frame: Kit.M(0x1c1814, { rough: 0.4 }) }, o));
  },

  /* animated holographic project wall (glass emitter) */
  holoWall(F, lab, x, y, z, ry = 0, o = {}) {
    const w = o.w || 3.2, h = o.h || 1.9;
    const col = "#" + new THREE.Color(lab.accent).getHexString();
    const nx = Math.sin(ry), nz = Math.cos(ry);
    Kit.B(F.group, w + 0.2, h + 0.2, 0.08, Kit.M(0x0e1016, { rough: 0.3, metal: 0.6 }), x - nx * 0.05, y, z - nz * 0.05, { ry, r: 0.03 });
    Kit.B(F.group, w + 0.2, 0.05, 0.1, Kit.G(lab.accent, 1.6), x - nx * 0.02, y - h / 2 - 0.1, z - nz * 0.02, { ry, r: 0.02, cast: false });
    // an information wall, not a screensaver: who/what, one-line pitch, three numbers, the flow
    const wrap = (c, text, x0, y0, maxW, lh, maxLines) => {
      const words = String(text || "").split(" "); let line = "", n = 0;
      for (let i = 0; i < words.length; i++) {
        const test = line ? line + " " + words[i] : words[i];
        if (c.measureText(test).width > maxW && line) {
          if (n === maxLines - 1) { while (c.measureText(line + "…").width > maxW && line.length) line = line.slice(0, -1); c.fillText(line + "…", x0, y0 + n * lh); return n + 1; }
          c.fillText(line, x0, y0 + n * lh); n++; line = words[i];
        } else line = test;
      }
      if (line) { c.fillText(line, x0, y0 + n * lh); n++; }
      return n;
    };
    const fit = (c, text, weight, size, maxW) => {
      let fs = size; c.font = `${weight} ${fs}px ${Kit.FONT}`;
      while (c.measureText(text).width > maxW && fs > 8) { fs *= 0.92; c.font = `${weight} ${fs}px ${Kit.FONT}`; }
      return fs;
    };
    const rr = (c, x0, y0, ww, hh, r) => { c.beginPath(); c.moveTo(x0 + r, y0); c.arcTo(x0 + ww, y0, x0 + ww, y0 + hh, r); c.arcTo(x0 + ww, y0 + hh, x0, y0 + hh, r); c.arcTo(x0, y0 + hh, x0, y0, r); c.arcTo(x0, y0, x0 + ww, y0, r); c.closePath(); };
    const scr = Kit.screen(F, w, h, (c, cw, ch, t) => {
      t = t || 0;
      const bg = c.createLinearGradient(0, 0, 0, ch);
      bg.addColorStop(0, "#07101c"); bg.addColorStop(1, "#050810");
      c.fillStyle = bg; c.fillRect(0, 0, cw, ch);
      c.strokeStyle = "rgba(120,180,255,0.05)"; c.lineWidth = 1;
      for (let gx = 0; gx < cw; gx += 36) { c.beginPath(); c.moveTo(gx, 0); c.lineTo(gx, ch); c.stroke(); }
      for (let gy = 0; gy < ch; gy += 36) { c.beginPath(); c.moveTo(0, gy); c.lineTo(cw, gy); c.stroke(); }
      const pad = cw * 0.05, inner = cw - pad * 2;
      c.textAlign = "left"; c.textBaseline = "alphabetic";
      // kicker
      const kick = [lab.code, lab.org, lab.when].filter(Boolean).join("  ·  ");
      if (kick) { fit(c, kick.toUpperCase(), 700, ch * 0.045, inner); c.fillStyle = col; c.fillText(kick.toUpperCase(), pad, ch * 0.105); }
      // title
      fit(c, lab.name, 800, ch * 0.105, inner); c.fillStyle = "#ffffff";
      c.fillText(lab.name, pad, ch * 0.215);
      // pitch
      c.font = `500 ${ch * 0.047}px ${Kit.FONT}`; c.fillStyle = "rgba(232,236,244,0.85)";
      wrap(c, lab.tagline || (lab.lines || [])[0], pad, ch * 0.295, inner, ch * 0.06, 2);
      // numbers
      const ms = (lab.metrics || []).slice(0, 3);
      if (ms.length) {
        const gap = cw * 0.025, bw = (inner - gap * (ms.length - 1)) / ms.length, by = ch * 0.4, bh = ch * 0.235;
        ms.forEach((m, i) => {
          const bx = pad + i * (bw + gap);
          rr(c, bx, by, bw, bh, 10); c.fillStyle = "rgba(255,255,255,0.045)"; c.fill();
          c.strokeStyle = col + "66"; c.lineWidth = 2; c.stroke();
          fit(c, m.v, 800, ch * 0.095, bw - 24); c.fillStyle = col;
          c.fillText(m.v, bx + 14, by + bh * 0.47);
          c.font = `500 ${ch * 0.038}px ${Kit.FONT}`; c.fillStyle = "rgba(232,236,244,0.78)";
          wrap(c, m.l, bx + 14, by + bh * 0.72, bw - 26, ch * 0.046, 2);
        });
      } else {
        c.font = `500 ${ch * 0.044}px ${Kit.FONT}`; c.fillStyle = "rgba(232,236,244,0.75)";
        (lab.lines || []).slice(1).forEach((ln, i) => c.fillText(ln, pad, ch * 0.45 + i * ch * 0.065));
      }
      // flow
      const nodes = lab.flow || lab.diagram || [];
      if (nodes.length) {
        const ny = ch * 0.79;
        let fs = ch * 0.036; c.font = `600 ${fs}px ${Kit.FONT}`;
        const minGap = 26;
        let widths = nodes.map((nd) => c.measureText(nd).width + 20);
        let total = widths.reduce((a2, b2) => a2 + b2, 0) + minGap * (nodes.length - 1);
        if (total > inner) { const k = inner / total; fs *= k; c.font = `600 ${fs}px ${Kit.FONT}`; widths = nodes.map((nd) => c.measureText(nd).width + 20 * k); total = inner; }
        const gapW = nodes.length > 1 ? (inner - widths.reduce((a2, b2) => a2 + b2, 0)) / (nodes.length - 1) : 0;
        let cx0 = pad;
        const xs = widths.map((bw2) => { const x0 = cx0; cx0 += bw2 + gapW; return x0; });
        nodes.forEach((nd, i) => {
          const bx = xs[i], bw2 = widths[i], bh2 = fs * 2.1;
          if (i > 0) {
            const ax = xs[i - 1] + widths[i - 1], ex = bx;
            c.strokeStyle = col + "66"; c.lineWidth = 2.5; c.beginPath(); c.moveTo(ax + 3, ny); c.lineTo(ex - 3, ny); c.stroke();
            const f = (t * 0.7 + i * 0.37) % 1, dx2 = ax + (ex - ax) * f;
            c.fillStyle = "#fff"; c.beginPath(); c.arc(dx2, ny, 3.5, 0, Math.PI * 2); c.fill();
          }
          rr(c, bx, ny - bh2 / 2, bw2, bh2, 8); c.fillStyle = "rgba(10,20,34,0.92)"; c.fill();
          c.strokeStyle = col; c.lineWidth = 2; c.stroke();
          c.fillStyle = "rgba(255,255,255,0.95)"; c.textAlign = "center";
          c.fillText(nd, bx + bw2 / 2, ny + fs * 0.36); c.textAlign = "left";
        });
      }
      // footer
      c.font = `700 ${ch * 0.034}px ${Kit.FONT}`; c.fillStyle = col;
      c.globalAlpha = 0.65 + Math.sin(t * 2.4) * 0.25;
      c.fillText("▸  CLICK FOR THE FULL CASE STUDY", pad, ch * 0.955);
      c.globalAlpha = 1;
    }, x, y, z, ry, { fps: o.fps || 4, px: o.px || 960, glow: 1.05 });
    Kit.light(F, x + nx * 1.0, y - 0.2, z + nz * 1.0, lab.accent, 0.9, 5.5);
    if (o.interact !== false) Kit.hot(F, { x: x + nx * 1.2, z: z + nz * 1.2, y: y + h / 2 + 0.35, r: 2.3, label: `${lab.name} — full case study`, node: null, ref: lab, focus: { x, y, z }, fn: () => { AudioSys.sfx("open"); UI.panel(lab); } });
    return scr;
  },

  chessTable(F, x, z) {
    const g = Kit.grp(F, x, z, 0.3);
    Kit.C(g, 0.38, 0.38, 0.05, Kit.M(0x2a1e14, { rough: 0.35 }), 0, 0.64, 0, { seg: 28 });
    Kit.C(g, 0.05, 0.08, 0.62, Kit.M(0x2a1e14, { rough: 0.4 }), 0, 0.31, 0, { seg: 12 });
    const board = Kit.poster(F, 0.46, 0.46, (c, w, h) => {
      for (let r = 0; r < 8; r++) for (let i = 0; i < 8; i++) { c.fillStyle = (r + i) % 2 ? "#3a2a1c" : "#e2d2b0"; c.fillRect(i * w / 8, r * h / 8, w / 8, h / 8); }
    }, 0, 0.667, 0, 0, { parent: g, px: 128, lit: true, decor: false });
    board.rotation.x = -Math.PI / 2;
    const wm = Kit.M(0xeee6d4, { rough: 0.35 }), bm = Kit.M(0x1c1814, { rough: 0.3 });
    const pos = [[-0.17, -0.17, 1], [0.06, -0.12, 1], [-0.05, 0.02, 0], [0.12, 0.08, 0], [0.17, 0.17, 0], [-0.12, 0.14, 1], [0.0, -0.05, 1]];
    pos.forEach(([px, pz, white], i) => {
      const m = white ? wm : bm;
      Kit.L(g, [[0, 0], [0.022, 0], [0.018, 0.012], [0.01, 0.04], [0.016, 0.055], [0.008, 0.075], [0, 0.08]], m, px, 0.67, pz, { seg: 12, sy: i === 0 || i === 4 ? 1.5 : 1 });
    });
    Kit.collide(F, x, z, 0.8, 0.8, 0);
    Kit.hot(F, { x, z, y: 1.2, r: 1.5, label: "A chess game in progress", node: g, fn: () => UI.say(CONTENT.texts.chess) });
  },

  football(F, x, z) {
    const tex = Kit.canvasTex(256, 128, (c, w, h) => {
      c.fillStyle = "#f4f4f0"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#1a1a1a";
      for (let i = 0; i < 10; i++) { const px = (i * 53) % w, py = (i * 37) % h; c.beginPath(); for (let k = 0; k < 5; k++) { const a = k * 1.2566; c.lineTo(px + Math.cos(a) * 14, py + Math.sin(a) * 14); } c.fill(); }
    });
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 16), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }));
    ball.position.set(x, 0.12, z); ball.castShadow = true;
    F.group.add(ball);
    const home = { x, z }; let kick = null;
    F.dynamic.push({ update(dt) {
      if (!kick) return;
      kick.t += dt;
      const p = kick.t / 1.3;
      if (p >= 1) { home.x += kick.dx * 3.2; home.z += kick.dz * 3.2; ball.position.set(home.x, 0.12, home.z); kick = null; return; }
      ball.position.x = home.x + kick.dx * p * 3.2;
      ball.position.z = home.z + kick.dz * p * 3.2;
      ball.position.y = 0.12 + Math.abs(Math.sin(p * Math.PI * 1.5)) * (1 - p) * 1.4;
      ball.rotation.x += dt * 12; ball.rotation.z += dt * 8;
    }});
    Kit.hot(F, { x, z, y: 0.8, r: 1.4, label: "⚽ Kick it", node: ball, dynamicPos: () => home, fn: () => {
      if (kick) return;
      const a = Math.atan2(home.x - Game.player.x, home.z - Game.player.z);
      let dx = Math.sin(a), dz = Math.cos(a);
      // keep it inside the room
      const nx = home.x + dx * 3.2, nz = home.z + dz * 3.2, b = Game.F.bounds;
      if (nx < b.x1 + 1.5 || nx > b.x2 - 1.5) dx = -dx;
      if (nz < b.z1 + 1.5 || nz > b.z2 - 1.5) dz = -dz;
      kick = { t: 0, dx, dz };
      AudioSys.sfx("pop"); UI.say(CONTENT.texts.football);
    }});
  },
};
