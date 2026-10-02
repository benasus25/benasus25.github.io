/* ============================================================
   SPARSH HQ v7 — floors7.js
   Every floor gets its own architecture:
   · Experience — an enfilade: an entrance hall, then three rooms
     in a row joined by portals. You walk your career in order.
   · Projects — a round glass rotunda with the core at its heart.
   · Education — a colonnaded nave (columns split hall from aisles).
   ============================================================ */

/* the numbers of a chapter, on plinths in a row */
function chapterPlinths(F, cs, cx, z, span) {
  const col = Type.hex(cs.accent);
  const ms = (cs.metrics || []).slice(0, 4);
  const sp = Math.min(span, ms.length * 1.9);
  ms.forEach((m, i) => {
    const px = cx - sp / 2 + sp * (ms.length > 1 ? i / (ms.length - 1) : 0.5);
    Kit.B(F.group, 0.8, 0.95, 0.6, Kit.M(0x161a22, { rough: 0.4, metal: 0.4 }), px, 0.475, z, { r: 0.04 });
    Kit.B(F.group, 0.82, 0.03, 0.62, Kit.G(cs.accent, 1.8), px, 0.965, z, { r: 0.01, cast: false });
    Kit.collide(F, px, z, 0.9, 0.7);
    const draw = (c, cw, ch) => {
      c.fillStyle = "#0b0f16"; c.fillRect(0, 0, cw, ch);
      c.textAlign = "center"; c.textBaseline = "alphabetic";
      Type.fit(c, m.v, 800, ch * 0.42, cw * 0.9); c.fillStyle = col; c.fillText(m.v, cw / 2, ch * 0.55);
      c.font = `600 ${ch * 0.12}px ${Kit.FONT}`; c.fillStyle = "rgba(232,236,244,0.8)";
      const words = m.l.split(" "); let ln = "", row = 0;
      for (const wd of words) { const tt = ln ? ln + " " + wd : wd; if (c.measureText(tt).width > cw * 0.88 && ln) { c.fillText(ln, cw / 2, ch * 0.74 + row * ch * 0.14); ln = wd; row++; } else ln = tt; }
      if (ln) c.fillText(ln, cw / 2, ch * 0.74 + row * ch * 0.14);
    };
    lightbox(F, px, 1.55, z + 0.05, 0, 1.25, 0.95, draw, { px: 300, accent: cs.accent });
    lightbox(F, px, 1.55, z - 0.07, Math.PI, 1.25, 0.95, draw, { px: 300, frame: false });
  });
}

/* a navigator's chart: grid, coastlines, a weather front, and the optimised route through it */
function seaChart(c, w, h, seed) {
  const R = Look.rng(seed * 31 + 7);
  c.fillStyle = "#0f2a44"; c.fillRect(0, 0, w, h);
  c.strokeStyle = "rgba(160,210,255,0.14)"; c.lineWidth = 1;
  for (let x = 0; x < w; x += w / 12) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
  for (let y = 0; y < h; y += h / 8) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  c.fillStyle = "#c8b98f";
  for (let k = 0; k < 3; k++) {
    const cx = R() * w, cy = R() < 0.5 ? R() * h * 0.3 : h - R() * h * 0.3, rr = w * (0.08 + R() * 0.12);
    c.beginPath();
    for (let a = 0; a <= 24; a++) { const t = (a / 24) * Math.PI * 2, q = rr * (0.7 + R() * 0.45); c.lineTo(cx + Math.cos(t) * q, cy + Math.sin(t) * q * 0.7); }
    c.fill();
  }
  for (let i = 0; i < 4; i++) {
    const cx = w * (0.3 + R() * 0.4), cy = h * (0.3 + R() * 0.4);
    c.strokeStyle = `rgba(255,${120 + i * 30},90,${0.5 - i * 0.1})`; c.lineWidth = 2;
    c.beginPath(); c.ellipse(cx, cy, w * (0.05 + i * 0.04), h * (0.06 + i * 0.05), R(), 0, Math.PI * 2); c.stroke();
  }
  const pts = []; for (let i = 0; i <= 6; i++) pts.push([w * (0.06 + i * 0.147), h * (0.5 + Math.sin(i * 1.3 + seed) * 0.22)]);
  c.setLineDash([10, 8]); c.strokeStyle = "rgba(255,255,255,0.35)"; c.lineWidth = 2;
  c.beginPath(); c.moveTo(pts[0][0], h * 0.5); c.lineTo(pts[6][0], h * 0.5); c.stroke(); c.setLineDash([]);
  c.strokeStyle = "#ffd166"; c.lineWidth = 4; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
  c.fillStyle = "#ffd166"; for (const [x, y] of pts) { c.beginPath(); c.arc(x, y, 6, 0, Math.PI * 2); c.fill(); }
  c.font = `800 ${h * 0.06}px ${Kit.FONT}`; c.fillStyle = "rgba(255,255,255,0.85)"; c.textAlign = "left";
  c.fillText(`ROUTE ${String(seed).padStart(2, "0")} · GRIB WEATHER · OPTIMISED`, w * 0.04, h * 0.09);
  c.font = `600 ${h * 0.05}px ${Kit.FONT}`; c.fillStyle = "rgba(255,209,102,0.9)";
  c.fillText("— optimised   - - great circle", w * 0.04, h * 0.95);
}

/* a double-sided blade sign hanging over the gallery, read as you walk toward it */
function bladeSign(F, x, z, n, cs, now) {
  const col = Type.hex(cs.accent), company = cs.title.replace(/\b\w+/g, (s) => s[0] + s.slice(1).toLowerCase());
  const draw = (c, w, h) => {
    c.fillStyle = "#0a0d13"; c.fillRect(0, 0, w, h);
    c.fillStyle = col; c.fillRect(0, 0, w * 0.035, h);
    c.textBaseline = "middle"; c.textAlign = "left";
    c.font = `800 ${h * 0.24}px ${Kit.FONT}`; c.fillStyle = col; c.fillText(`${n} · ${cs.dates.toUpperCase()}`, w * 0.08, h * 0.3);
    Type.fit(c, company + (now ? "  · now" : ""), 800, h * 0.36, w * 0.86); c.fillStyle = "#fff"; c.fillText(company + (now ? "  · now" : ""), w * 0.08, h * 0.68);
  };
  lightbox(F, x - 0.05, 3.5, z, -HP, 2.3, 0.62, draw, { px: 520, accent: cs.accent });
  lightbox(F, x + 0.12, 3.5, z, HP, 2.3, 0.62, draw, { px: 520, frame: false });
  Kit.B(F.group, 0.04, 0.9, 0.04, Kit.metal(0x2a2f38, 0.4), x + 0.03, 4.3, z - 0.9, { cast: false });
  Kit.B(F.group, 0.04, 0.9, 0.04, Kit.metal(0x2a2f38, 0.4), x + 0.03, 4.3, z + 0.9, { cast: false });
}

/* a stone gateway: pilasters, a brass archivolt, and a lit intrados in the next chapter's colour */
function portalFrame(F, x, zc, r, dH, accent) {
  const stone = Look.mat("marble", 0xe9e4da, { tile: 0.8 }), brass = Kit.metal(0xc29a5b, 0.3);
  const spring = dH - r, glow = Kit.G(accent, 2.4);
  for (const s of [-1, 1]) {
    const pz = zc + s * (r + 0.26);
    Kit.B(F.group, 0.36, spring, 0.52, stone, x, spring / 2, pz, { r: 0.02 });
    Kit.B(F.group, 0.46, 0.16, 0.62, brass, x, spring + 0.08, pz, { r: 0.02 });
    Kit.B(F.group, 0.46, 0.2, 0.62, brass, x, 0.1, pz, { r: 0.02 });
    Kit.B(F.group, 0.06, spring, 0.06, glow, x, spring / 2, zc + s * (r - 0.03), { cast: false });
  }
  const arc = new THREE.TorusGeometry(r + 0.07, 0.08, 8, 40, Math.PI);
  for (const s of [-1, 1]) {
    const a = new THREE.Mesh(arc, brass); a.position.set(x + s * 0.11, spring, zc); a.rotation.y = HP; F.group.add(a);
  }
  const lit = new THREE.Mesh(new THREE.TorusGeometry(r - 0.03, 0.03, 6, 40, Math.PI), glow);
  lit.position.set(x, spring, zc); lit.rotation.y = HP; F.group.add(lit);
}

/* walking into a room is a scene change: title card + chime, once */
function chapterZone(F, n, cs, x1, x2) {
  let shown = false;
  F.dynamic.push({ update() {
    const p = Game.player;
    if (!shown && Game.state === "play" && p.x > x1 + 0.6 && p.x < x2 && p.z < 3.6 && !(p.path && p.path.length)) {
      shown = true;
      UI.title(`Chapter ${n}`, `${cs.title.replace(/\b\w+/g, (s) => s[0] + s.slice(1).toLowerCase())} · ${cs.role} · ${cs.dates}`);
      AudioSys.sfx("chime");
      if (typeof Analytics !== "undefined") Analytics.event("chapter_enter", { chapter: cs.id });
    }
  } });
}

/* the lit header over a portal, readable as you walk toward it */
function portalHeader(F, x, cs, n) {
  const col = Type.hex(cs.accent);
  lightbox(F, x - 0.13, 4.24, 0, -HP, 4.6, 0.76, (c, cw, ch) => {
    c.fillStyle = "#0a0d13"; c.fillRect(0, 0, cw, ch);
    c.fillStyle = col; c.fillRect(0, ch - 6, cw, 6);
    c.textBaseline = "middle"; c.textAlign = "center";
    c.font = `800 ${ch * 0.24}px ${Kit.FONT}`; c.fillStyle = col; c.fillText(`CHAPTER ${n}  ·  ${cs.dates.toUpperCase()}`, cw / 2, ch * 0.3);
    const company = cs.title.replace(/\b\w+/g, (s) => s[0] + s.slice(1).toLowerCase());
    Type.fit(c, company, 800, ch * 0.42, cw * 0.9); c.fillStyle = "#fff"; c.fillText(company, cw / 2, ch * 0.66);
  }, { px: 1200, accent: cs.accent });
}

/* ============================================================
   F1 — EXPERIENCE · the enfilade
   ┌──────┬───────────┬──────────────────┬───────────┐
   │ hall │ 1 · Xtreme│ 2 · Pocketpills  │3 · Sprinklr│  ← glass (city)
   │ lift →  portal  →      portal       →  (NOW)    │
   └──────┴───────────┴──────────────────┴───────────┘
   ============================================================ */
Floors.fx2 = function (F) {
  const dark = Look.mat("acoustic", 0x2b313c, { tile: 1.6 });
  shell(F, {
    w: 46, d: 18, h: 4.8, elevZ: 0,
    floor: Look.mat("terrazzo", 0xa9adb5, { tile: 3, rough: 0.32, env: 0.9, chips: ["#e4e2dc", "#7c8696", "#3e4858", "#9aa6b6", "#262c38"] }),
    wall: Look.mat("plaster", 0xc9ced6, { tile: 2 }),
    skirt: Kit.M(0x22262e, { rough: 0.4 }),
    ceil: Kit.M(0xeef0f3, { rough: 0.95 }),
    sides: { n: { type: "wall", mat: dark }, s: { type: "wall", mat: dark }, e: "glass", w: "wall" },
    theme: { wood: 0xc9a77a, carpet: 0x34445a, metal: 0xc0c7d2 },
    panelColor: 0xeef4ff, pcols: 8, prows: 3,
    mood: {
      exposure: 0.84, hemi: [0xdfe8ff, 0x3a3e48, 0.75], key: [0xfff0dc, 1.7, [0.5, 1, 0.3]], fill: [0x9fb8ff, 0.4],
      env: 0.55, fog: [0x141a26, 60, 220], bloom: [0.24, 0.5, 1.05], ao: 1.0,
      grade: { tint: [0.99, 1.0, 1.04], shadow: [0.03, 0.06, 0.15], high: [0.2, 0.15, 0.08], vig: 0.34, sat: 1.05 },
    },
  });
  F.elevator.spawn = { x: -16.9, z: 0, ry: HP }; F.spawn = F.elevator.spawn; F.yawOffset = 0;
  const C = CONTENT.cases, by = (id) => C.find((c) => c.id === id);
  const xt = by("xtreme"), pp = by("pocketpills"), sk = by("sprinklr");
  // the rooms, west → east, and the portals between them
  const W1 = -14, W2 = -3, W3 = 13;
  const portal = { gaps: [[9 - 1.7, 9 + 1.7, "arch"]], doorH: 3.55 };
  const pmat = Look.mat("plaster", 0xe4ded3, { tile: 2 });
  // the partitions stop at z 4: south of them runs one gallery from the lift to the glass, so every
  // room is a straight walk away — the arches are the story in order, the gallery is the shortcut
  const GZ = 4.0;
  const stone = Look.mat("marble", 0xe9e4da, { tile: 0.8 }), brassP = Kit.metal(0xc29a5b, 0.3);
  for (const x of [W1, W2, W3]) {
    Kit.wallRun(F, x, -9, x, GZ, Object.assign({ mat: pmat }, portal));
    Kit.B(F.group, 0.44, 4.8, 0.52, stone, x, 2.4, GZ, { r: 0.02 });
    Kit.B(F.group, 0.54, 0.18, 0.62, brassP, x, 0.09, GZ, { r: 0.02 });
    Kit.B(F.group, 0.54, 0.14, 0.62, brassP, x, 3.62, GZ, { r: 0.02 });
    Kit.collide(F, x, GZ, 0.44, 0.52);
  }
  bladeSign(F, W1, 5.3, 1, xt, false);
  bladeSign(F, W2, 6.1, 2, pp, false);
  bladeSign(F, W3, 6.9, 3, sk, true);
  // the gallery: a runner from the lift to the glass, and its own line of light
  Kit.B(F.group, 37.3, 0.016, 2.0, Look.mat("fabric", 0x1a2232, { tile: 1.2 }), 4.15, 0.008, 5.7, { cast: false });
  for (const ez of [4.72, 6.68]) Kit.B(F.group, 37.3, 0.006, 0.05, Kit.G(0x57d8ff, 1.3), 4.15, 0.018, ez, { cast: false });
  Kit.B(F.group, 37, 0.03, 0.16, Kit.G(0xeef4ff, 1.3), 4.5, 4.775, 6.4, { cast: false });
  portalFrame(F, W1, 0, 1.7, 3.55, xt.accent);
  portalFrame(F, W2, 0, 1.7, 3.55, pp.accent);
  portalFrame(F, W3, 0, 1.7, 3.55, sk.accent);
  // one line of light overhead, through every arch — the enfilade's spine
  Kit.B(F.group, 45.6, 0.03, 0.2, Kit.G(0xeef4ff, 1.5), 0, 4.775, 0, { cast: false });
  portalHeader(F, W1, xt, 1);
  portalHeader(F, W2, pp, 2);
  portalHeader(F, W3, sk, 3);
  // the line through time, down the middle of every room
  Kit.B(F.group, 42, 0.012, 0.08, Kit.G(0x57d8ff, 1.8), 0, 0.012, 0, { r: 0.004, cast: false });
  [["2022", -8.5], ["2023 – 2025", 5], ["2025 → NOW", 18]].forEach(([yr, x]) => {
    const m = Kit.screen(F, 2.6, 0.5, (c, w, h) => {
      c.clearRect(0, 0, w, h); c.fillStyle = "rgba(160,225,255,0.95)"; c.font = `800 ${h * 0.6}px ${Kit.FONT}`;
      c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(yr, w / 2, h / 2);
    }, x, 0.016, 0.55, 0, { fps: 0, px: 300, transparent: true, glow: 1.4, decor: false });
    m.rotation.x = -HP;
  });

  // ---- the entrance hall ----
  Kit.neon(F, "EXPERIENCE", 0x57d8ff, -22.84, 3.9, -4.6, HP, { size: 0.36, glow: 1.9 });
  lightbox(F, -18.5, 2.62, -8.84, 0, 6.6, 2.6, (c, w, h) => {
    c.fillStyle = "#0a0f17"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#57d8ff"; c.fillRect(0, 0, w, h * 0.014);
    const pad = h * 0.09;
    c.textAlign = "left"; c.textBaseline = "alphabetic";
    c.font = `800 ${h * 0.065}px ${Kit.FONT}`; c.fillStyle = "#57d8ff"; c.fillText("THE CAREER, IN THREE ROOMS", pad, h * 0.15);
    c.font = `800 ${h * 0.16}px ${Kit.FONT}`; c.fillStyle = "#fff"; c.fillText(`${Cards.years()}+ years of backend`, pad, h * 0.36);
    c.font = `500 ${h * 0.06}px ${Kit.FONT}`; c.fillStyle = "rgba(232,236,244,0.82)";
    c.fillText("Through the arches in order — or the gallery on your right, straight to any room.", pad, h * 0.5);
    const steps = [["2022", "Xtreme Technologies", "Backend intern", "#ffd166"], ["2023 – 25", "Pocketpills", "SDE II · 6 systems", "#4ade80"], ["2025 → now", "Sprinklr", "Senior Software Engineer", "#5aa7ff"]];
    steps.forEach(([yr, co, ro, cc], i) => {
      const x0 = pad + i * (w - pad * 2) / 3, y0 = h * 0.64;
      c.fillStyle = cc; c.fillRect(x0, y0, (w - pad * 2) / 3 - 20, 4);
      c.font = `800 ${h * 0.06}px ${Kit.FONT}`; c.fillText(yr, x0, y0 + h * 0.1);
      c.font = `800 ${h * 0.075}px ${Kit.FONT}`; c.fillStyle = "#fff"; c.fillText(co, x0, y0 + h * 0.2);
      c.font = `500 ${h * 0.05}px ${Kit.FONT}`; c.fillStyle = "rgba(232,236,244,0.7)"; c.fillText(ro, x0, y0 + h * 0.28);
      c.font = `700 ${h * 0.042}px ${Kit.FONT}`; c.fillStyle = cc; c.fillText("▸ TAKE ME THERE", x0, y0 + h * 0.34);
    });
  }, { px: 1400, accent: 0x57d8ff });
  // each column on the board is a shortcut: you run straight to that room
  [[xt, -20.6, -8.5], [pp, -18.6, 5.0], [sk, -16.6, 17.6]].forEach(([cs, bx, rx], i) => {
    const company = cs.title.replace(/\b\w+/g, (s) => s[0] + s.slice(1).toLowerCase());
    Kit.hot(F, { x: bx, z: -7.9, y: 1.9, r: 1.1, label: `Take me to chapter ${i + 1} · ${company}`, fn: () => {
      AudioSys.sfx("blip"); Game.walkTo(rx, 2.6, null);
      if (typeof Analytics !== "undefined") Analytics.event("chapter_shortcut", { chapter: cs.id });
    } });
  });
  Kit.light(F, -18.5, 3.6, -6.4, 0xffe2bf, 1.0, 6.5);
  Kit.light(F, -18.5, 3.4, 4.5, 0xffd9a8, 0.9, 7);
  const walnut = Look.mat("wood", 0x5a3a24, { tile: 1.2 }), rail = Kit.metal(0xc29a5b, 0.3);
  for (const zf of [-8.86, 8.86]) {
    Kit.B(F.group, 8.6, 1.15, 0.05, walnut, -18.6, 0.6, zf, { cast: false });
    Kit.B(F.group, 8.6, 0.05, 0.08, rail, -18.6, 1.2, zf, { cast: false });
  }
  Kit.floorPlane(F, -18.4, 0, 7.6, 9.6, Look.mat("marble", 0x30343c, { tile: 2.2, rough: 0.16, env: 1.1 }), 0.008);
  for (const s of [-1, 1]) {
    Kit.B(F.group, 7.7, 0.01, 0.06, rail, -18.4, 0.008, s * 4.8, { cast: false });
    Kit.B(F.group, 0.06, 0.01, 9.7, rail, -18.4 + s * 3.8, 0.008, 0, { cast: false });
  }
  Kit.sofa(F, -18.6, 7.4, Math.PI, { color: 0x2f3b4e });
  Kit.art(F, -18.6, 2.6, 8.82, Math.PI, 7, 2.2, 1.4);
  for (const sx of [-21.6, -15.6]) Kit.sconce(F, sx, 2.5, 8.82, Math.PI, 0xffd9a8);
  Kit.coffeeBar(F, -22.25, 6.0, HP, { w: 3.0, machine: 0x2a2e36, top: Look.mat("terrazzo", 0xeceef0, { tile: 1.2, rough: 0.3 }) });
  F.npcSpecs.push({ model: "character-female-d", x: -20.9, z: 5.0, ry: -HP, behavior: "coffee", hold: "cup", quotes: "barista" });
  Kit.plant(F, -15.0, -8.0, { kind: "fiddle", s: 1.2, pot: "concrete", interact: false });
  Kit.plant(F, -22.3, 8.3, { kind: "snake", s: 1.1, pot: "black", interact: false });

  // ---- room 1 · Xtreme (2022) — ocean blue, a globe of routes ----
  // a ship's deck: this chapter was voyages and weather
  Kit.floorPlane(F, -8.5, 0, 10.6, 17.6, Look.mat("wood", 0x7a5a3e, { tile: 1.6, rough: 0.5 }), 0.006);
  Kit.frameArt(F, 3.2, 2.0, (c, w, h) => seaChart(c, w, h, 1), W1 + 0.13, 2.3, -5.4, HP, { frame: Kit.metal(0x2a2f38, 0.4) });
  Kit.frameArt(F, 3.2, 2.0, (c, w, h) => seaChart(c, w, h, 5), W2 - 0.13, 2.3, -5.4, -HP, { frame: Kit.metal(0x2a2f38, 0.4) });
  careerPanel(F, xt, -8.5, 2.3, -8.86, 0, 7.6, 3.3);
  chapterPlinths(F, xt, -8.5, -2.7, 6);
  Props.globe(F, -11.4, 2.5);
  Kit.light(F, -8.5, 3.8, -4.8, 0xbfd8ff, 1.0, 8);
  Kit.light(F, -8.5, 3.6, 4.6, 0x9cc4ff, 0.8, 7);
  const mapT = Kit.grp(F, -5.6, 2.7, -0.4);
  Kit.B(mapT, 2.0, 0.8, 1.2, Kit.M(0x14171e, { metal: 0.5 }), 0, 0.4, 0, { r: 0.03 });
  const mt = Kit.screen(F, 1.9, 1.1, Kit.screens.map, 0, 0.81, 0, 0, { parent: mapT, fps: 3, px: 256, glow: 1.2 }); mt.rotation.x = -HP;
  Kit.colLocal(F, mapT, 0, 0, 2.0, 1.2);
  F.npcSpecs.push({ model: "character-female-e", x: -9.6, z: 3.4, ry: -2.3, behavior: "idle", quotes: "dev", greeting: "94% accurate. The ships write thank-you notes." });
  chapterZone(F, 1, xt, W1, W2);

  // ---- room 2 · Pocketpills (2023–25) — the big one: the capsule, and six systems along the wall ----
  // a clean, bright pharmacy floor: green chips in white stone
  Kit.floorPlane(F, 5, 0, 15.6, 17.6, Look.mat("terrazzo", 0xc4d3cb, { tile: 2.6, rough: 0.3, env: 0.9, chips: ["#2fbf6b", "#9ad9b4", "#ffffff", "#6f8a7c", "#1f6e45"] }), 0.006);
  careerPanel(F, pp, 5, 2.3, -8.86, 0, 9.8, 3.3);
  chapterPlinths(F, pp, 5, -2.7, 7.2);
  Chapter.capsule(F, 5, 2.4);
  Kit.light(F, 1.0, 3.8, -4.8, 0xe8fff2, 0.9, 8);
  Kit.light(F, 9.0, 3.8, -4.8, 0xe8fff2, 0.9, 8);
  Kit.light(F, 5.0, 3.6, 5.6, 0xc8ffe0, 0.9, 8);
  Kit.neon(F, "SYSTEMS I BUILT HERE", 0x4ade80, 5, 4.25, 8.86, Math.PI, { size: 0.26, glow: 1.7 });
  const bayX = [-1.0, 1.4, 3.8, 6.2, 8.6, 11.0];
  CONTENT.labs.forEach((lab, i) => {
    const bx = bayX[i];
    Kit.holoWall(F, lab, bx, 2.2, 8.86, Math.PI, { w: 2.25, h: 1.5, fps: 3, px: 720 });
    Kit.textPoster(F, [`${lab.code} · ${lab.short}`], 2.2, 0.32, bx, 3.35, 8.88, Math.PI, { fs: 34, color: Type.hex(lab.accent), bg: "#0b1018", borderCol: Type.hex(lab.accent) + "88", decor: false });
  });
  for (const x of [0.2, 2.6, 5.0, 7.4, 9.8]) Props.rail(F, x, 7.0, x, 8.9, 1.0);
  F.npcSpecs.push({ model: "character-male-b", x: 8.6, z: 7.5, ry: Math.PI, behavior: "idle", hold: "laptop", quotes: "dev", greeting: "Camunda says the workflow is green." });
  F.npcSpecs.push({ model: "character-female-b", x: 2.0, z: -6.9, ry: Math.PI, behavior: "idle", quotes: "dev", greeting: "Read the Pocketpills one. It's a lot of backend." });
  chapterZone(F, 2, pp, W2, W3);

  // ---- room 3 · Sprinklr (now) — glass, the city, the CX core, and the stack I ship with ----
  Kit.floorPlane(F, 18, 0, 9.6, 17.6, Look.mat("fabric", 0x1a2234, { tile: 1.4 }), 0.006);
  careerPanel(F, sk, 17.4, 2.3, -8.86, 0, 7.4, 3.3);
  chapterPlinths(F, sk, 17.4, -2.7, 5.2);
  Chapter.cxOrb(F, 18.2, 1.4);
  Kit.neon(F, "THE STACK I SHIP WITH", 0xffd166, 18, 4.25, 8.86, Math.PI, { size: 0.24, glow: 1.7 });
  CONTENT.skills.forEach((s, i) => stackTile(F, s, 14.0 + i * 1.6, 1.85, 8.86, Math.PI, 1.45, 2.6));
  Kit.hot(F, { x: 18, z: 7.4, y: 2.9, r: 2.0, label: "The full stack matrix — everything, grouped", ref: { kind: "matrix", id: "matrix" },
    fn: () => { AudioSys.sfx("open"); Cards.open("matrix", { kind: "matrix", id: "matrix" }, { source: "world" }); } });
  Kit.light(F, 18, 3.2, 6.2, 0xffe2b0, 1.1, 7);
  Kit.light(F, 17.4, 3.8, -4.8, 0xffe8c8, 1.0, 8);
  P(F, "loungeChair", 21.6, -2.4, -HP + 0.4, { tint: { carpet: 0x34445a } });
  P(F, "loungeChair", 21.6, 2.6, -HP - 0.4, { tint: { carpet: 0x34445a } });
  Kit.plant(F, 22.2, -7.8, { kind: "palm", s: 1.3, pot: "white", interact: false });
  chapterZone(F, 3, sk, W3, 23);

  // ---- life: someone walks the whole career, portal to portal ----
  F.npcSpecs.push({ model: "character-female-a", x: -12, z: 5.2, behavior: "route", hold: "phone", speed: 1.05, quotes: "dev",
    waypoints: [[-12, 5.2, 1], [4, 5.2, 0], [20.5, 5.4, 3], [4, 6.2, 0], [-12, 6.2, 2]] });
  F.npcSpecs.push({ model: "character-male-a", x: 16.5, z: 0.6, behavior: "route", hold: "files", speed: 1.15, quotes: "dev",
    waypoints: [[16.5, 0.6, 3], [5, 0.6, 0], [-8.5, 0.6, 0], [-19.5, 2.2, 2], [-8.5, -0.6, 0], [5, -0.6, 0], [16.5, -0.6, 3]] });
};

/* ---------- a round glass wall (the rotunda) ---------- */
function ringGlass(F, cx, cz, R, n, skip = []) {
  const fin = Kit.metal(0x1b1e24, 0.4), h = F.ceilH;
  const sill = Kit.M(0x1a1c22, { rough: 0.5 });
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
    const x1 = cx + Math.sin(a0) * R, z1 = cz + Math.cos(a0) * R, x2 = cx + Math.sin(a1) * R, z2 = cz + Math.cos(a1) * R;
    if (skip.includes(i)) { Kit.wallRun(F, x1, z1, x2, z2, {}); continue; }
    const len = Math.hypot(x2 - x1, z2 - z1), ry = -Math.atan2(z2 - z1, x2 - x1), mx = (x1 + x2) / 2, mz = (z1 + z2) / 2;
    const g = new THREE.Group(); F.group.add(g);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(len, h), Kit.glassM(0x9fc8ff, 0.1));
    pane.position.set(mx, h / 2, mz); pane.rotation.y = ry; pane.renderOrder = 2; g.add(pane);
    const rain = new THREE.Mesh(new THREE.PlaneGeometry(len, h), Look.rainGlass());
    rain.position.set(mx, h / 2, mz); rain.rotation.y = ry; rain.renderOrder = 3; g.add(rain);
    F.rainGlass.push(rain);
    Kit.B(g, 0.09, h, 0.22, fin, x1, h / 2, z1, { ry, r: 0.012 });
    Kit.B(g, len, 0.16, 0.34, sill, mx, 0.08, mz, { ry, r: 0.02 });
    Kit.B(g, len, 0.12, 0.26, fin, mx, h - 0.06, mz, { ry, r: 0.01, cast: false });
    Kit.camWall(F, x1, z1, x2, z2, 0, 99);
    F.cut.push({ g, x1, z1, x2, z2, h, decor: [], k: 1, solid: true });
  }
}

/* ============================================================
   F3 — PROJECTS · the rotunda
   A round glass room at the top of the tower: the core in the
   middle, three project pods around it, the archive and the
   bench on the south arc, the city on every side.
   ============================================================ */
Floors.fp2 = function (F) {
  const R = 13.4;
  shell(F, {
    w: 30, d: 30, h: 5.2, elev: false, panels: false,
    floor: Look.mat("concrete", 0x8f8b86, { tile: 3, rough: 0.42, env: 0.8 }),
    wall: Look.mat("plaster", 0xc4beb4, { tile: 2 }),
    skirt: Kit.M(0x24262c, { rough: 0.4 }),
    ceil: Kit.M(0xeceae6, { rough: 0.95 }),
    sides: { n: "none", s: "none", e: "none", w: "none" },
    theme: { wood: 0xc9a77a, carpet: 0x2e3a4c, metal: 0xc0c7d2 },
    mood: {
      exposure: 0.9, hemi: [0xeef2ff, 0x4a4038, 0.85], key: [0xfff0dc, 1.8, [0.5, 1, 0.3]], fill: [0xa8c0ff, 0.45],
      env: 0.6, fog: [0x141a26, 60, 220], bloom: [0.26, 0.5, 1.05], ao: 1.0,
      grade: { tint: [1.0, 1.0, 1.02], shadow: [0.03, 0.05, 0.12], high: [0.22, 0.16, 0.08], vig: 0.3, sat: 1.06 },
    },
  });
  F.ring = { x: 0, z: 0, r: R - 0.25 };
  // the glass drum; the two southern facets are wall, with the lift set into them
  const N = 28;
  ringGlass(F, 0, 0, R, N, [0, N - 1]);
  Kit.elevator(F, 0, R - 0.9, Math.PI);
  F.elevator.spawn = { x: 0, z: R - 5.6, ry: Math.PI }; F.spawn = F.elevator.spawn; F.yawOffset = 0;
  // a ring of light on the ceiling and a radial floor
  // a round dais under the core, and a compass inlaid in the floor — brass rings and radials
  const brass = Kit.metal(0xc29a5b, 0.3);
  Kit.C(F.group, 4.4, 4.5, 0.08, Look.mat("marble", 0x262b33, { tile: 1.5, rough: 0.2, env: 1.1 }), 0, 0.04, 0, { seg: 72 });
  Kit.T(F.group, 4.43, 0.035, Kit.G(0x57d8ff, 1.8), 0, 0.075, 0, { rx: HP, cast: false });
  for (const rr of [7.0, 10.4, R - 0.7]) Kit.T(F.group, rr, 0.03, brass, 0, 0.004, 0, { rx: HP, cast: false });
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2, r0 = 4.6, r1 = R - 0.7, rm = (r0 + r1) / 2;
    Kit.B(F.group, 0.045, 0.01, r1 - r0, brass, Math.sin(a) * rm, 0.004, Math.cos(a) * rm, { ry: a, cast: false });
  }
  Kit.T(F.group, R - 0.6, 0.04, Kit.G(0xffd9a0, 1.4), 0, F.ceilH - 0.12, 0, { rx: HP, cast: false });
  Kit.T(F.group, 6.0, 0.03, Kit.G(0x9fdcff, 1.2), 0, F.ceilH - 0.1, 0, { rx: HP, cast: false });
  Kit.neon(F, "PROJECTS", 0x57d8ff, 0, 4.2, R - 0.55, Math.PI, { size: 0.36, glow: 1.8 });

  // ---- the heart: the core and what it runs on ----
  Props.energyCore(F, 0, 0);
  const core = CONTENT.core;
  core.rings.forEach((r, i) => {
    const a = Math.PI + (i - 1) * 0.85;
    const m = Kit.screen(F, 1.7, 0.36, (c, w, h) => {
      c.clearRect(0, 0, w, h); c.fillStyle = "rgba(160,225,255,0.95)"; c.font = `800 ${h * 0.6}px ${Kit.FONT}`;
      c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(r.toUpperCase(), w / 2, h / 2);
    }, Math.sin(a) * -3.2, 0.086, Math.cos(a) * -3.2, 0, { fps: 0, px: 256, transparent: true, glow: 1.4, decor: false });
    m.rotation.x = -HP; m.rotation.z = -a;
  });
  const gx = 3.1, gz = 5.4, gry = -0.5;
  const stand = Kit.grp(F, gx, gz, gry);
  Kit.B(stand, 2.5, 0.08, 0.5, Kit.M(0x14171e, { metal: 0.5 }), 0, 0.04, 0, { r: 0.02 });
  Kit.B(stand, 0.12, 1.2, 0.12, Kit.M(0x14171e, { metal: 0.5 }), 0, 0.6, 0, { r: 0.02 });
  Kit.collide(F, gx, gz, 1.8, 1.8);
  lightbox(F, gx + Math.sin(gry) * 0.06, 2.05, gz + Math.cos(gry) * 0.06, gry, 2.6, 1.7, (c, w, h) => {
    c.fillStyle = "#08101a"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#57d8ff"; c.fillRect(0, 0, w, h * 0.014);
    const pad = w * 0.06;
    c.textAlign = "left"; c.textBaseline = "alphabetic";
    c.font = `800 ${h * 0.065}px ${Kit.FONT}`; c.fillStyle = "#57d8ff"; c.fillText(core.code, pad, h * 0.13);
    c.font = `800 ${h * 0.13}px ${Kit.FONT}`; c.fillStyle = "#fff"; c.fillText(core.name, pad, h * 0.27);
    Type.rich(c, core.tagline, pad, h * 0.37, w - pad * 2, h * 0.055, h * 0.075, "rgba(232,236,244,0.86)", "#fff", 2);
    const gap = w * 0.02, bw = (w - pad * 2 - gap * 3) / 4, by = h * 0.55, bh = h * 0.3;
    core.stats.forEach((st, i) => {
      const bx = pad + i * (bw + gap);
      Type.rr(c, bx, by, bw, bh, 10); c.fillStyle = "rgba(255,255,255,0.05)"; c.fill(); c.strokeStyle = "#57d8ff66"; c.lineWidth = 2; c.stroke();
      Type.fit(c, st.v, 800, h * 0.11, bw - 16); c.fillStyle = "#57d8ff"; c.fillText(st.v, bx + 10, by + bh * 0.48);
      Type.rich(c, st.l, bx + 10, by + bh * 0.72, bw - 18, h * 0.04, h * 0.05, "rgba(232,236,244,0.75)", "#fff", 2);
    });
    c.font = `700 ${h * 0.045}px ${Kit.FONT}`; c.fillStyle = "#57d8ff"; c.fillText("▸  CLICK FOR WHAT IT RUNS ON", pad, h * 0.95);
  }, { px: 720, accent: 0x57d8ff });
  lightbox(F, gx - Math.sin(gry) * 0.07, 2.05, gz - Math.cos(gry) * 0.07, gry + Math.PI, 2.6, 1.7, (c, w, h) => {
    c.fillStyle = "#08101a"; c.fillRect(0, 0, w, h);
    c.textAlign = "center"; c.textBaseline = "middle";
    c.font = `800 ${h * 0.07}px ${Kit.FONT}`; c.fillStyle = "#57d8ff"; c.fillText(core.code, w / 2, h * 0.36);
    c.font = `800 ${h * 0.17}px ${Kit.FONT}`; c.fillStyle = "#fff"; c.fillText(core.name, w / 2, h * 0.52);
    c.font = `600 ${h * 0.06}px ${Kit.FONT}`; c.fillStyle = "rgba(232,236,244,0.7)"; c.fillText("the other side explains it →", w / 2, h * 0.68);
  }, { px: 512, frame: false });
  Kit.hot(F, { x: gx + Math.sin(gry) * 1.3, z: gz + Math.cos(gry) * 1.3, y: 3.3, r: 2.6, label: "The core — what powers every project here", ref: core, focus: { x: 0, y: 1.8, z: 0 }, fn: () => { AudioSys.sfx("open"); UI.panel(core); } });

  // ---- three project pods on the northern arc, each facing the core ----
  const pods = [-0.95, 0, 0.95];   // angles from north
  const extras = [
    (x, z, a) => { Props.chatBubbles(F, x, z); },
    (x, z, a) => { for (const s of [-1, 1]) Kit.serverRack(F, x + Math.cos(a) * s * 1.1, z - Math.sin(a) * s * 1.1, a); },
    (x, z, a) => { Props.globe(F, x, z); },
  ];
  CONTENT.projects.forEach((pr, i) => {
    const a = pods[i], px = Math.sin(a) * 7.6, pz = -Math.cos(a) * 7.6, face = -a;   // face the core
    Kit.rug(F, Math.sin(a) * 9.2, -Math.cos(a) * 9.2, 5.2, 4.4, face, { kind: "border", colors: [0x1e2532, pr.accent, 0x161c26] });
    Props.holoStand(F, pr, px, pz, face, { w: 3.6, h: 2.0 });
    const short = { sprharness: "SPRHARNESS", lanserver: "LAN SERVER", voyage: "VOYAGES" }[pr.id] || pr.name.toUpperCase();
    Kit.textPoster(F, [`${pr.code} · ${short}`], 3.2, 0.4, px - Math.sin(face) * 0.16, 3.25, pz - Math.cos(face) * 0.16, face, { fs: 40, color: Type.hex(pr.accent), bg: "#0b1018", borderCol: Type.hex(pr.accent) + "88", decor: false });
    extras[i](Math.sin(a) * 10.4, -Math.cos(a) * 10.4, face);
  });
  ws(F, -4.3, -10.4, 0.4, { monitors: 2, screens: ["code", "term"], npc: { quotes: "dev" } });
  F.npcSpecs.push({ model: "character-male-f", x: 2.7, z: -8.8, ry: -2.6, behavior: "idle", hold: "laptop", quotes: "dev", greeting: "LAN only. The internet can't see us." });

  // ---- the archive on the south-west arc ----
  const sw = [[-9.4, 7.4], [-11.2, 4.2], [-7.0, 9.6]];
  const shelves = sw.map(([x, z]) => Kit.bookcase(F, x, z, Math.atan2(-x, -z), { w: 3.0, h: 2.6, rows: 5, skipRows: [2], noDecor: false, palette: [0x2f6e4a, 0x2f4a6e, 0x6e3a6e, 0x8c2f2f] }));
  CONTENT.repos.forEach((repo, i) => {
    const sh = shelves[Math.floor(i / 4)], j = i % 4;
    Kit.book(F, sh, -1.05 + j * 0.7, 0.08 + (2.6 - 0.16) * (2 / 5) + 0.02, 0.0, { title: repo.name, cat: repo.lang + " · " + repo.year, body: repo.desc, quote: repo.lesson, isRepo: true, repo }, [0x4ade80, 0x57d8ff, 0xc084fc, 0xffd166][i % 4]);
  });
  Kit.neon(F, "THE ARCHIVE", 0x4ade80, -8.4, 3.4, 5.8, Math.atan2(8.4, -5.8), { size: 0.22, glow: 1.7, double: true });
  Kit.light(F, -7.0, 2.6, 5.4, 0xffe0a0, 1.2, 6);
  Kit.hot(F, { x: -6.8, z: 4.8, y: 3.0, r: 2.6, label: "The archive — every repo, on one shelf", ref: { kind: "repoIndex", id: "library" }, fn: () => { AudioSys.sfx("open"); UI.panel({ kind: "repoIndex", id: "library" }); } });

  // ---- the bench on the south-east arc ----
  const oss = CONTENT.oss;
  Kit.table(F, 8.2, 7.0, -0.7, { style: "rect", w: 2.6, d: 1.1, h: 0.9, top: Kit.M(0x2a2e36, { metal: 0.4, rough: 0.4 }) });
  Props.roboArm(F, 9.2, 6.2, 0xffd166);
  lightbox(F, 9.2, 2.3, 7.8, -2.25, 3.6, 1.7, (c, w, h) => {
    c.fillStyle = "#14110a"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#ffd166"; c.fillRect(0, 0, w, h * 0.014);
    const pad = w * 0.05;
    c.textAlign = "left"; c.textBaseline = "alphabetic";
    c.font = `800 ${h * 0.075}px ${Kit.FONT}`; c.fillStyle = "#ffd166"; c.fillText("THE BENCH · OPEN SOURCE & TEAM BUILDS", pad, h * 0.13);
    let yy = h * 0.27;
    for (const it of oss.items) {
      c.font = `800 ${h * 0.065}px ${Kit.FONT}`; c.fillStyle = "#fff"; c.fillText(it.name, pad, yy);
      yy = Type.rich(c, it.what, pad, yy + h * 0.065, w - pad * 2, h * 0.05, h * 0.062, "rgba(244,232,206,0.8)", "#fff", 1) + h * 0.07;
    }
  }, { px: 800, accent: 0xffd166 });
  for (const sd of [-1, 1]) Kit.B(F.group, 0.08, 1.46, 0.08, Kit.M(0x14171e, { metal: 0.5 }), 9.2 + Math.cos(-2.25) * sd * 1.55 - Math.sin(-2.25) * 0.1, 0.73, 7.8 - Math.sin(-2.25) * sd * 1.55 - Math.cos(-2.25) * 0.1, { r: 0.02 });
  Kit.collide(F, 9.2, 7.8, 2.6, 2.6);
  Kit.light(F, 8.4, 3.0, 6.0, 0xffe2a8, 1.2, 6);
  Kit.hot(F, { x: 7.0, z: 5.2, y: 3.0, r: 2.4, label: "The bench — open source & team builds", ref: oss, focus: { x: 9.2, y: 2.3, z: 7.8 }, fn: () => { AudioSys.sfx("open"); UI.panel(oss); } });

  // ---- by the glass ----
  for (const a of [1.75, -1.75]) Kit.plant(F, Math.sin(a) * 12.0, -Math.cos(a) * 12.0, { kind: "palm", s: 1.25, pot: "white", interact: false });
  P(F, "loungeChair", 11.2, -2.2, -HP - 0.3, { tint: { carpet: 0x2e3a4c } });
  P(F, "loungeChair", -11.2, -2.2, HP + 0.3, { tint: { carpet: 0x2e3a4c } });
  F.npcSpecs.push({ model: "character-female-a", x: -9.0, z: 3.0, ry: -2.2, behavior: "idle", hold: "files", quotes: "student" });
  F.npcSpecs.push({ model: "character-male-e", x: 5.6, z: 0, behavior: "route", speed: 0.95, quotes: "dev",
    waypoints: [[5.6, 0, 1], [3.9, -4.0, 0], [-1.6, -5.4, 2], [-5.6, -1.0, 0], [-3.6, 4.4, 0], [0.2, 6.6, 2]] });
};

/* ---------- Education: stone columns split the hall into a nave and two aisles ---------- */
extend("fe", (F) => {
  const stone = Look.mat("stonewall", 0x8a7a66, { tile: 1.2, rough: 0.85 });
  const capM = Kit.M(0x6a5a48, { rough: 0.8 });
  for (const z of [-5.2, 5.2]) for (const x of [-11.6, -5.4, 0.8, 7.0]) {
    Kit.C(F.group, 0.42, 0.48, F.ceilH, stone, x, F.ceilH / 2, z, { seg: 18 });
    Kit.B(F.group, 1.15, 0.28, 1.15, capM, x, 0.14, z, { r: 0.03 });
    Kit.B(F.group, 1.15, 0.3, 1.15, capM, x, F.ceilH - 0.15, z, { r: 0.03, cast: false });
    Kit.collide(F, x, z, 1.1, 1.1);
    // a little light at the foot of each column — the arcade reads from across the hall
    Kit.candle(F, x, 0.32, z + (z < 0 ? 0.62 : -0.62), { float: false });
  }
  // arches between the columns (beams with a curve of light underneath)
  for (const z of [-5.2, 5.2]) for (const [xa, xb] of [[-11.6, -5.4], [-5.4, 0.8], [0.8, 7.0]]) {
    Kit.B(F.group, xb - xa, 0.42, 0.6, stone, (xa + xb) / 2, F.ceilH - 0.5, z, { r: 0.04, cast: false });
  }
});
