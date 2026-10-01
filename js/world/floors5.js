/* ============================================================
   SPARSH HQ v5 — floors5.js
   Experience and education carry the weight of the building:
   · Experience: each job is a chapter you walk through — a lit
     gateway, a 3D centrepiece, the numbers on plinths, a title.
   · Education: a whole floor — a great hall whose aisle walks
     the degree year by year to a graduation stage.
   · The lobby points at both, before anything else.
   ============================================================ */

/* a freestanding lightbox on legs or flat on a wall — the building's "big type" */
function lightbox(F, x, y, z, ry, w, h, draw, o = {}) {
  const nx = Math.sin(ry), nz = Math.cos(ry);
  if (o.frame !== false) {
    Kit.B(F.group, w + 0.18, h + 0.18, 0.1, o.frameMat || Kit.M(0x0c0e13, { rough: 0.35, metal: 0.6 }), x - nx * 0.06, y, z - nz * 0.06, { ry, r: 0.03 });
    if (o.accent !== undefined) Kit.B(F.group, w + 0.2, 0.05, 0.12, Kit.G(o.accent, 2.0), x - nx * 0.04, y - h / 2 - 0.11, z - nz * 0.04, { ry, r: 0.02, cast: false });
  }
  return Kit.screen(F, w, h, draw, x, y, z, ry, { fps: o.fps === undefined ? 0 : o.fps, px: o.px || Math.round(170 * w), glow: o.glow || 1.0, decor: false });
}

/* ============================================================
   EXPERIENCE — the three chapters
   ============================================================ */
const Chapter = {
  /* Pocketpills: a giant two-tone capsule turning slowly over its plinth */
  capsule(F, x, z) {
    const g = Kit.grp(F, x, z, 0);
    Kit.C(g, 0.75, 0.9, 0.9, Kit.M(0x14171e, { metal: 0.5, rough: 0.35 }), 0, 0.45, 0, { seg: 28 });
    Kit.T(g, 0.82, 0.03, Kit.G(0x4ade80, 2.2), 0, 0.92, 0, { rx: HP, cast: false });
    const pill = new THREE.Group(); pill.position.y = 2.15; g.add(pill);
    const white = Kit.M(0xf4f6f8, { rough: 0.25, env: 1.2 }), green = Kit.M(0x2fbf6b, { rough: 0.25, env: 1.2, emissive: 0x1a6e3c, ei: 0.4 });
    Kit.C(pill, 0.42, 0.42, 0.75, white, 0, 0.375, 0, { seg: 32 });
    Kit.C(pill, 0.42, 0.42, 0.75, green, 0, -0.375, 0, { seg: 32 });
    Kit.S(pill, 0.42, white, 0, 0.75, 0, { cast: true });
    Kit.S(pill, 0.42, green, 0, -0.75, 0, { cast: true });
    Kit.T(pill, 0.425, 0.02, Kit.gold(), 0, 0, 0, { rx: HP, cast: false });
    pill.rotation.z = 0.9;
    Kit.light(F, x, 3.4, z + 0.8, 0x9cffc4, 1.6, 7);
    Kit.collide(F, x, z, 1.8, 1.8);
    F.dynamic.push({ update(dt, t) { pill.rotation.y = t * 0.35; pill.position.y = 2.15 + Math.sin(t * 1.1) * 0.08; } });
    return g;
  },
  /* Sprinklr: a holographic customer-experience core with its channels in orbit */
  cxOrb(F, x, z) {
    const g = Kit.grp(F, x, z, 0);
    Kit.C(g, 0.75, 0.9, 0.9, Kit.M(0x14171e, { metal: 0.5, rough: 0.35 }), 0, 0.45, 0, { seg: 28 });
    Kit.T(g, 0.82, 0.03, Kit.G(0x5aa7ff, 2.2), 0, 0.92, 0, { rx: HP, cast: false });
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.62, 40, 28), Look.holo(0x5aa7ff, 1));
    core.position.y = 2.1; g.add(core);
    Kit.S(g, 0.22, Kit.G(0xbfe2ff, 2.6), 0, 2.1, 0, { cast: false });
    const sats = [], cols = [0xff6b57, 0x4ade80, 0xffd166, 0xc084fc, 0x57d8ff, 0xff9e4d];
    cols.forEach((c, i) => {
      const s = Kit.S(g, 0.09, Kit.G(c, 2.4), 0, 2.1, 0, { cast: false });
      sats.push({ s, r: 1.05 + (i % 2) * 0.22, sp: 0.5 + i * 0.09, ph: i * 1.05, tilt: (i - 2.5) * 0.18 });
    });
    for (const r of [1.05, 1.27]) Kit.T(g, r, 0.006, Kit.G(0x5aa7ff, 1.4), 0, 2.1, 0, { rx: HP, cast: false });
    Kit.light(F, x, 3.4, z + 0.8, 0x9cc8ff, 1.6, 7);
    Kit.collide(F, x, z, 1.8, 1.8);
    F.dynamic.push({ update(dt, t) {
      core.rotation.y = t * 0.3;
      for (const q of sats) { const a = t * q.sp + q.ph; q.s.position.set(Math.cos(a) * q.r, 2.1 + Math.sin(a) * q.tilt, Math.sin(a) * q.r); }
    } });
    return g;
  },

  /* one walk-through chapter: inlay, gateway, centrepiece, numbers, title */
  build(F, n, cs, cx, hero) {
    const col = Type.hex(cs.accent);
    const z0 = -11.8, z1 = -4.9, w = 8.4, zc = (z0 + z1) / 2;
    // the floor of the chapter
    Kit.floorPlane(F, cx, zc, w, z1 - z0, Look.mat("fabric", 0x1b2230, { tile: 1.4 }), 0.009);
    Kit.B(F.group, w, 0.012, 0.07, Kit.G(cs.accent, 2.2), cx, 0.014, z1, { r: 0.004, cast: false });
    for (const s of [-1, 1]) Kit.B(F.group, 0.07, 0.012, z1 - z0, Kit.G(cs.accent, 1.4), cx + s * w / 2, 0.014, zc, { r: 0.004, cast: false });
    // the gateway you walk through
    const pm = Kit.M(0x11141a, { metal: 0.6, rough: 0.3 });
    for (const s of [-1, 1]) {
      Kit.B(F.group, 0.34, 4.1, 0.34, pm, cx + s * (w / 2 - 0.2), 2.05, z1 + 0.05, { r: 0.04 });
      Kit.B(F.group, 0.05, 3.7, 0.06, Kit.G(cs.accent, 2.0), cx + s * (w / 2 - 0.2) - s * 0.18, 1.95, z1 + 0.2, { r: 0.01, cast: false });
      Kit.collide(F, cx + s * (w / 2 - 0.2), z1 + 0.05, 0.5, 0.5);
    }
    lightbox(F, cx, 4.36, z1 + 0.05, 0, w - 0.1, 0.62, (c, cw, ch) => {
      c.fillStyle = "#0a0d13"; c.fillRect(0, 0, cw, ch);
      c.fillStyle = col; c.fillRect(0, ch - 5, cw, 5);
      c.textBaseline = "middle"; c.textAlign = "left";
      c.font = `800 ${ch * 0.36}px ${Kit.FONT}`; c.fillStyle = col; c.fillText(`CHAPTER ${n}`, ch * 0.4, ch * 0.52);
      const kw = c.measureText(`CHAPTER ${n}`).width + ch * 0.8;
      const company = cs.title.replace(/\b\w+/g, (s) => s[0] + s.slice(1).toLowerCase());
      Type.fit(c, company, 800, ch * 0.5, cw * 0.45); c.fillStyle = "#fff"; c.fillText(company, kw, ch * 0.52);
      c.textAlign = "right"; c.font = `600 ${ch * 0.3}px ${Kit.FONT}`; c.fillStyle = "rgba(232,236,244,0.85)";
      c.fillText(`${cs.role}  ·  ${cs.dates}`, cw - ch * 0.4, ch * 0.52);
    }, { px: 1500, accent: cs.accent, frame: false });
    Kit.B(F.group, w + 0.3, 0.72, 0.18, pm, cx, 4.36, z1 - 0.12, { r: 0.03 });
    // the centrepiece
    hero(F, cx, -8.6);
    // the numbers, on plinths you can walk between
    const ms = (cs.metrics || []).slice(0, 4), span = Math.min(w - 1.6, ms.length * 1.9);
    ms.forEach((m, i) => {
      const px = cx - span / 2 + span * (ms.length > 1 ? i / (ms.length - 1) : 0.5), pz = -6.15;
      Kit.B(F.group, 0.8, 0.95, 0.6, Kit.M(0x161a22, { rough: 0.4, metal: 0.4 }), px, 0.475, pz, { r: 0.04 });
      Kit.B(F.group, 0.82, 0.03, 0.62, Kit.G(cs.accent, 1.8), px, 0.965, pz, { r: 0.01, cast: false });
      Kit.collide(F, px, pz, 0.9, 0.7);
      lightbox(F, px, 1.55, pz + 0.05, 0, 1.25, 0.95, (c, cw, ch) => {
        c.fillStyle = "#0b0f16"; c.fillRect(0, 0, cw, ch);
        c.textAlign = "center"; c.textBaseline = "alphabetic";
        Type.fit(c, m.v, 800, ch * 0.42, cw * 0.9); c.fillStyle = col; c.fillText(m.v, cw / 2, ch * 0.55);
        c.font = `600 ${ch * 0.12}px ${Kit.FONT}`; c.fillStyle = "rgba(232,236,244,0.8)";
        const words = m.l.split(" "); let ln = "", row = 0;
        for (const wd of words) { const tt = ln ? ln + " " + wd : wd; if (c.measureText(tt).width > cw * 0.88 && ln) { c.fillText(ln, cw / 2, ch * 0.74 + row * ch * 0.14); ln = wd; row++; } else ln = tt; }
        if (ln) c.fillText(ln, cw / 2, ch * 0.74 + row * ch * 0.14);
      }, { px: 300, accent: cs.accent });
    });
    // stepping through the gateway is a scene change
    let shown = false;
    F.dynamic.push({ update() {
      const p = Game.player;
      const inside = Math.abs(p.x - cx) < w / 2 && p.z > z0 && p.z < z1 - 0.2;
      if (inside && !shown && Game.state === "play") {
        shown = true;
        UI.title(`Chapter ${n}`, `${cs.title.replace(/\b\w+/g, (s) => s[0] + s.slice(1).toLowerCase())} · ${cs.role} · ${cs.dates}`);
        AudioSys.sfx("chime");
        if (typeof Analytics !== "undefined") Analytics.event("chapter_enter", { chapter: cs.id });
      }
    } });
  },
};

extend("fx", (F) => {
  const C = CONTENT.cases, by = (id) => C.find((c) => c.id === id);
  Chapter.build(F, 1, by("xtreme"), -11.3, (F2, x, z) => Props.globe(F2, x, z));
  Chapter.build(F, 2, by("pocketpills"), 0, (F2, x, z) => Chapter.capsule(F2, x, z));
  Chapter.build(F, 3, by("sprinklr"), 11.3, (F2, x, z) => Chapter.cxOrb(F2, x, z));
  // the walkway that strings the chapters together, with the years on it
  Kit.B(F.group, 31, 0.012, 0.08, Kit.G(0x57d8ff, 1.8), 0, 0.012, -3.9, { r: 0.004, cast: false });
  [["2022", -11.3], ["2023 – 2025", 0], ["2025 → NOW", 11.3]].forEach(([yr, x]) => {
    Kit.S(F.group, 0.1, Kit.G(0x57d8ff, 3), x, 0.05, -3.9, { cast: false });
    const m = Kit.screen(F, 2.6, 0.5, (c, w, h) => {
      c.clearRect(0, 0, w, h); c.fillStyle = "rgba(160,225,255,0.95)"; c.font = `800 ${h * 0.6}px ${Kit.FONT}`;
      c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(yr, w / 2, h / 2);
    }, x, 0.016, -3.35, 0, { fps: 0, px: 300, transparent: true, glow: 1.4, decor: false });
    m.rotation.x = -HP;
  });
});

/* ============================================================
   F2 — EDUCATION · The Great Hall
   West: the school you started at. The aisle: the degree, year
   by year. East: the graduation stage — DTU, 8.83. North: the
   hall of achievements. South: leadership, coursework, reading.
   ============================================================ */
Floors.fe = function (F) {
  shell(F, {
    w: 32, d: 24, h: 6.2, elevZ: 0, panels: false,
    floor: Look.mat("flagstone", 0x6a5e50, { tile: 3.2, rough: 0.55, env: 0.6 }),
    wall: Look.mat("stonewall", 0x7d6c5a, { tile: 2.6, rough: 0.9 }),
    skirt: Kit.M(0x2a1e14, { rough: 0.7 }),
    ceil: Kit.M(0x1c1612, { rough: 0.95 }),
    sides: { n: "wall", s: "wall", e: "wall", w: "wall" },
    theme: { wood: 0x5a3c24, carpet: 0x6a1420, metal: 0xd9a441 },
    mood: {
      exposure: 0.8, hemi: [0xffe2b8, 0x2a1a10, 0.55], key: [0xffd8a0, 1.0, [0.4, 1, 0.3]], fill: [0x8090c0, 0.25],
      env: 0.4, fog: [0x140e0a, 40, 140], bloom: [0.32, 0.55, 1.0], ao: 1.0,
      grade: { tint: [1.04, 1.0, 0.94], shadow: [0.06, 0.03, 0.02], high: [0.25, 0.16, 0.04], vig: 0.4, sat: 1.08 },
    },
  });
  // step out looking straight down the aisle at the stage
  F.elevator.spawn = { x: -8.6, z: 0, ry: HP }; F.spawn = F.elevator.spawn; F.yawOffset = 0;
  const gold = "#e8c268", parch = "#f4e6c8";
  const E = CONTENT.education;

  // ---- the aisle ----
  Kit.rug(F, -0.5, 0, 25, 3.0, 0, { kind: "border", colors: [0x5a1018, 0xd9a441, 0x2e080c] });
  Kit.neon(F, "EDUCATION", 0xffd98a, -15.84, 4.3, -3.4, HP, { size: 0.42, glow: 1.6 });
  // floating candles down the hall
  for (let i = 0; i < 18; i++) Kit.candle(F, -10 + (i % 9) * 2.6, 4.4 + (i % 3) * 0.35, i < 9 ? -3.6 : 3.6);
  // two long tables, a great-hall rhythm (kept short so the aisle stays open)
  for (const tz of [-3.6, 3.6]) {
    Kit.table(F, -6.5, tz, 0, { style: "rect", w: 7.0, d: 1.0, h: 0.76, top: Look.mat("wood", 0x4a3020, { tile: 1.2 }) });
    for (let k = 0; k < 4; k++) Kit.candle(F, -9.2 + k * 1.8, 0.84, tz, { float: false });
  }

  // ---- WEST: where it started — school ----
  const sc = E.schoolInfo;
  lightbox(F, -15.86, 2.2, 4.8, HP, 3.0, 1.9, (c, w, h) => {
    c.fillStyle = "#1a120a"; c.fillRect(0, 0, w, h);
    c.strokeStyle = gold; c.lineWidth = 6; c.strokeRect(14, 14, w - 28, h - 28);
    c.textAlign = "center"; c.textBaseline = "alphabetic";
    c.font = `800 ${h * 0.08}px ${Kit.FONT}`; c.fillStyle = gold; c.fillText("WHERE IT STARTED · 2018", w / 2, h * 0.2);
    Type.fit(c, sc.name, 700, h * 0.12, w * 0.86, "Fraunces, Georgia, serif"); c.fillStyle = parch; c.fillText(sc.name, w / 2, h * 0.38);
    c.font = `600 ${h * 0.075}px ${Kit.FONT}`; c.fillStyle = "rgba(244,230,200,0.85)"; c.fillText(sc.sub, w / 2, h * 0.52);
    c.font = `800 ${h * 0.26}px ${Kit.FONT}`; c.fillStyle = gold; c.fillText(sc.score, w / 2, h * 0.82);
  }, { accent: 0xd9a441 });
  Kit.hot(F, { x: -14.4, z: 4.8, y: 3.6, r: 2.4, label: `${sc.name} — CBSE XII`, ref: sc, focus: { x: -15.8, y: 2.2, z: 4.8 }, fn: () => { AudioSys.sfx("open"); UI.panel(sc); } });
  Kit.light(F, -14.2, 3.4, 4.8, 0xffd8a0, 1.0, 6);

  // ---- the degree, year by year, standing along the aisle ----
  const years = E.years, xs = [-7.4, -2.4, 2.6, 7.6];
  const yearFace = (yr, back) => (c, w, h) => {
    const col = Type.hex(yr.accent);
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#22160c"); g.addColorStop(1, "#140d07");
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = col; c.fillRect(0, 0, w, h * 0.012);
    c.textAlign = "center"; c.textBaseline = "alphabetic";
    Type.fit(c, yr.year, 800, w * 0.18, w * 0.86, "Fraunces, Georgia, serif"); c.fillStyle = col; c.fillText(yr.year, w / 2, h * 0.15);
    c.font = `800 ${w * 0.062}px ${Kit.FONT}`; c.fillStyle = "rgba(244,230,200,0.8)"; c.fillText(yr.label.toUpperCase(), w / 2, h * 0.215);
    c.textAlign = "left";
    let yy = h * 0.3;
    if (back) {
      // the reverse: the year in one line, then the same evidence
      yy = Type.rich(c, yr.back, w * 0.09, yy, w * 0.82, w * 0.06, w * 0.08, "#fff4e0", "#fff", 4) + w * 0.06;
      c.fillStyle = col; c.fillRect(w * 0.09, yy - w * 0.05, w * 0.82, 2);
      yy += w * 0.03;
    }
    for (const pt of yr.points) {
      if (yy > h * 0.95) break;
      c.fillStyle = col; c.beginPath(); c.arc(w * 0.09, yy - w * 0.022, w * 0.016, 0, Math.PI * 2); c.fill();
      yy = Type.rich(c, pt, w * 0.14, yy, w * 0.8, w * (back ? 0.048 : 0.054), w * (back ? 0.066 : 0.073), "rgba(244,230,200,0.86)", "#fff", 4) + w * 0.04;
    }
  };
  years.forEach((yr, i) => {
    const x = xs[i], z = i % 2 ? 2.15 : -2.15;
    for (const s2 of [-1, 1]) Kit.C(F.group, 0.035, 0.035, 3.3, Kit.gold(), x, 1.65, z + s2 * 0.85, { seg: 8 });
    Kit.C(F.group, 0.03, 0.03, 1.9, Kit.gold(), x, 3.3, z, { rx: HP, seg: 8, cast: false });
    // front faces the visitor walking toward the stage; the back faces the way back out
    lightbox(F, x - 0.02, 2.05, z, -HP, 1.6, 2.3, yearFace(yr, false), { px: 520, accent: yr.accent, frame: true, frameMat: Kit.M(0x2a1e14, { rough: 0.5 }) });
    lightbox(F, x + 0.075, 2.05, z, HP, 1.6, 2.3, yearFace(yr, true), { px: 520, frame: false });
    Kit.collide(F, x, z, 0.4, 1.9);
    Kit.hot(F, { x: x - 1.6, z: z * 0.55, y: 3.65, r: 2.2, label: `${yr.year} — ${yr.label}`, ref: yr, focus: { x, y: 2.1, z }, fn: () => { AudioSys.sfx("open"); UI.panel(yr); } });
  });

  // ---- EAST: the graduation stage ----
  Kit.floorPlane(F, 13.6, 0, 4.6, 13, Look.mat("wood", 0x3a2416, { tile: 1.6 }), 0.01);
  Kit.B(F.group, 0.07, 0.012, 13, Kit.G(0xd9a441, 1.6), 11.3, 0.016, 0, { r: 0.004, cast: false });
  const dtu = E.dtu;
  lightbox(F, 15.86, 3.0, 0, -HP, 10.2, 4.6, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h * 0.35, 0, w / 2, h * 0.4, w * 0.6);
    g.addColorStop(0, "#2a1c0e"); g.addColorStop(1, "#120b06");
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.strokeStyle = gold; c.lineWidth = 8; c.strokeRect(22, 22, w - 44, h - 44);
    c.lineWidth = 2; c.strokeRect(36, 36, w - 72, h - 72);
    // the crest
    const cx = w * 0.17, cy = h * 0.47, s = h * 0.3;
    c.beginPath(); c.moveTo(cx - s * 0.6, cy - s * 0.7); c.lineTo(cx + s * 0.6, cy - s * 0.7); c.lineTo(cx + s * 0.6, cy + s * 0.05);
    c.quadraticCurveTo(cx + s * 0.55, cy + s * 0.65, cx, cy + s * 0.9); c.quadraticCurveTo(cx - s * 0.55, cy + s * 0.65, cx - s * 0.6, cy + s * 0.05); c.closePath();
    c.fillStyle = "#5a1018"; c.fill(); c.strokeStyle = gold; c.lineWidth = 7; c.stroke();
    c.fillStyle = gold; c.textAlign = "center"; c.textBaseline = "middle";
    c.font = `800 ${s * 0.42}px Fraunces, Georgia, serif`; c.fillText("DTU", cx, cy + s * 0.02);
    c.font = `700 ${s * 0.11}px ${Kit.FONT}`; c.fillText("EST. 1941", cx, cy + s * 0.4);
    // the words
    const tx = w * 0.33;
    c.textAlign = "left"; c.textBaseline = "alphabetic";
    c.font = `800 ${h * 0.05}px ${Kit.FONT}`; c.fillStyle = gold; c.fillText("BACHELOR OF TECHNOLOGY · 2019 – 2023", tx, h * 0.2);
    Type.fit(c, "Delhi Technological University", 700, h * 0.115, w * 0.62, "Fraunces, Georgia, serif");
    c.fillStyle = parch; c.fillText("Delhi Technological University", tx, h * 0.33);
    c.font = `600 ${h * 0.06}px ${Kit.FONT}`; c.fillStyle = "rgba(244,230,200,0.88)"; c.fillText("Computer Engineering", tx, h * 0.42);
    c.font = `800 ${h * 0.24}px ${Kit.FONT}`; c.fillStyle = gold; c.fillText("8.83", tx, h * 0.68);
    const cw2 = c.measureText("8.83").width;
    c.font = `700 ${h * 0.055}px ${Kit.FONT}`; c.fillStyle = "rgba(244,230,200,0.85)"; c.fillText("CGPA", tx + cw2 + h * 0.03, h * 0.6);
    c.fillText("out of 10", tx + cw2 + h * 0.03, h * 0.68);
    c.font = `600 ${h * 0.042}px ${Kit.FONT}`; c.fillStyle = "rgba(244,230,200,0.78)";
    c.fillText("Core: " + dtu.coursework.join(" · "), tx, h * 0.8);
    c.fillText("Leadership: Joint Secretary, Sahitya DTU · Core member, Enactus DTU", tx, h * 0.87);
  }, { px: 2000, accent: 0xd9a441, frameMat: Kit.M(0x2a1e14, { rough: 0.5 }) });
  for (const s of [-1, 1]) {
    Kit.banner(F, 15.6, s * 6.0, s < 0 ? 0x7a1420 : 0x14306a, "DTU", s < 0 ? "COMPUTER ENGINEERING" : "CLASS OF 2023", { y: 3.4, w: 1.5, h: 3.2, ry: -HP });
    Kit.torch(F, 15.85, s * 7.6, -HP);
  }
  // the lectern with the degree on it
  const lec = Kit.grp(F, 12.6, 0, -HP);
  Kit.B(lec, 0.9, 1.05, 0.55, Look.mat("wood", 0x3a2416, { tile: 1 }), 0, 0.525, 0, { r: 0.04 });
  Kit.B(lec, 1.0, 0.06, 0.65, Kit.gold(), 0, 1.08, 0, { r: 0.02, rx: -0.25 });
  const scroll = Kit.C(lec, 0.06, 0.06, 0.7, Kit.M(0xf4e6c8, { rough: 0.7 }), 0, 1.17, 0.05, { rz: HP, seg: 12 });
  Kit.C(lec, 0.065, 0.065, 0.06, Kit.M(0x8c1a22, { rough: 0.5 }), 0, 1.17, 0.05, { rz: HP, seg: 12 });
  void scroll;
  Kit.colLocal(F, lec, 0, 0, 1.0, 0.7);
  Kit.light(F, 12.0, 4.2, 0, 0xffe0b0, 2.2, 10);
  Kit.light(F, 13.4, 4.6, -3.8, 0xffd8a0, 1.2, 7);
  Kit.light(F, 13.4, 4.6, 3.8, 0xffd8a0, 1.2, 7);
  Kit.hot(F, { x: 11.2, z: 0, y: 2.0, r: 2.8, label: "The degree — DTU, B.Tech CoE, 8.83", ref: dtu, focus: { x: 15.8, y: 2.8, z: 0 }, fn: () => { AudioSys.sfx("open"); UI.panel(dtu); } });

  // ---- NORTH: the hall of achievements ----
  Kit.neon(F, "HALL OF ACHIEVEMENTS", 0xffd98a, 3.2, 5.0, -11.84, 0, { size: 0.32, glow: 1.6 });
  const lc = E.leetcode, lt = E.trophies.find((t) => t.id === "leetcode");
  lightbox(F, -6.2, 2.75, -11.86, 0, 8.0, 3.7, (c, w, h) => {
    c.fillStyle = "#0a1410"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#4ade80"; c.fillRect(0, 0, w, h * 0.012);
    const pad = h * 0.08;
    c.textAlign = "left"; c.textBaseline = "alphabetic";
    c.font = `800 ${h * 0.055}px ${Kit.FONT}`; c.fillStyle = "#7ae582"; c.fillText("LEETCODE · 2021 → NOW · MOSTLY C++", pad, h * 0.13);
    c.font = `800 ${h * 0.26}px ${Kit.FONT}`; c.fillStyle = "#fff"; c.fillText(String(lc.total), pad, h * 0.4);
    const tw = c.measureText(String(lc.total)).width;
    c.font = `700 ${h * 0.07}px ${Kit.FONT}`; c.fillStyle = "rgba(232,244,236,0.85)"; c.fillText("problems solved", pad + tw + h * 0.04, h * 0.31);
    c.fillText(`+ ${lc.gfg} on GeeksforGeeks`, pad + tw + h * 0.04, h * 0.4);
    // difficulty bar
    const bx = pad, by = h * 0.47, bw = w - pad * 2, bh = h * 0.085, tot = lc.easy + lc.medium + lc.hard;
    [[lc.easy, "#4ade80", "easy"], [lc.medium, "#ffd166", "medium"], [lc.hard, "#ff6b57", "hard"]].reduce((ox, [n, cc, nm]) => {
      const ww = bw * n / tot; c.fillStyle = cc; c.fillRect(bx + ox, by, ww - 4, bh);
      c.fillStyle = "#0a1410"; c.font = `800 ${bh * 0.55}px ${Kit.FONT}`; c.fillText(`${n} ${nm}`, bx + ox + 12, by + bh * 0.7);
      return ox + ww;
    }, 0);
    c.font = `800 ${h * 0.045}px ${Kit.FONT}`; c.fillStyle = "rgba(232,244,236,0.5)"; c.fillText("FAVOURITE HARD ONES", pad, h * 0.67);
    c.font = `600 ${h * 0.05}px ${Kit.FONT}`; c.fillStyle = "rgba(232,244,236,0.88)";
    lc.notable.slice(0, 4).forEach(([pr, how], i) => c.fillText(`${pr} — ${how}`, pad + (i % 2) * (w / 2 - pad / 2), h * 0.76 + Math.floor(i / 2) * h * 0.085));
    c.font = `700 ${h * 0.04}px ${Kit.FONT}`; c.fillStyle = "#7ae582"; c.fillText("▸  CLICK FOR TOPICS & ALL SOLUTIONS", pad, h * 0.96);
  }, { px: 1700, accent: 0x4ade80 });
  Kit.light(F, -6.2, 4.4, -9.6, 0xc8ffd8, 1.2, 7);
  Kit.hot(F, { x: -6.2, z: -9.4, y: 4.0, r: 2.8, label: "448 LeetCode problems", ref: lt, focus: { x: -6.2, y: 2.7, z: -11.8 }, fn: () => { AudioSys.sfx("open"); UI.panel(lt); } });
  const T = E.trophies, tro = ["codekaze", "hackcw", "ic2"];
  tro.forEach((id, i) => {
    const t = T.find((q) => q.id === id), x = 2.6 + i * 3.4;
    Kit.trophy(F, x, -10.2, { scale: i === 0 ? 1.15 : 1.0, label: `${t.big} — ${t.small}`, story: t.story, ref: t });
    lightbox(F, x, 2.6, -11.86, 0, 2.6, 1.1, (c, w, h) => {
      c.fillStyle = "#1a120a"; c.fillRect(0, 0, w, h);
      c.textAlign = "center"; c.textBaseline = "alphabetic";
      Type.fit(c, t.big, 800, h * 0.36, w * 0.9); c.fillStyle = gold; c.fillText(t.big, w / 2, h * 0.46);
      c.font = `600 ${h * 0.15}px ${Kit.FONT}`; c.fillStyle = parch; c.fillText(t.small, w / 2, h * 0.7);
      c.font = `600 ${h * 0.12}px ${Kit.FONT}`; c.fillStyle = "rgba(244,230,200,0.6)"; c.fillText(t.when, w / 2, h * 0.88);
    }, { px: 420, accent: 0xd9a441, frameMat: Kit.M(0x2a1e14, { rough: 0.5 }) });
  });
  for (const x of [-11.6, 12.4]) Kit.torch(F, x, -11.85, 0);

  // ---- SOUTH: leadership, coursework, the reading list ----
  Kit.neon(F, "LEADERSHIP · LEARNING · READING", 0xffd98a, 1.5, 5.8, 11.84, Math.PI, { size: 0.28, glow: 1.6 });
  dtu.roles.forEach((r, i) => {
    const x = -3.2 + i * 5.4;
    Kit.banner(F, x, 11.7, r.accent, r.sym, r.name.split(" · ")[1].toUpperCase(), { y: 4.2, w: 1.6, h: 2.6, ry: Math.PI });
    lightbox(F, x, 1.75, 11.86, Math.PI, 3.0, 1.55, (c, w, h) => {
      c.fillStyle = "#1a120a"; c.fillRect(0, 0, w, h);
      c.fillStyle = Type.hex(r.accent); c.fillRect(0, 0, w, h * 0.02);
      c.textAlign = "left"; c.textBaseline = "alphabetic";
      const pad = w * 0.06;
      c.font = `800 ${h * 0.08}px ${Kit.FONT}`; c.fillStyle = gold; c.fillText(r.when, pad, h * 0.17);
      Type.fit(c, r.name, 800, h * 0.13, w - pad * 2); c.fillStyle = parch; c.fillText(r.name, pad, h * 0.33);
      Type.rich(c, r.what, pad, h * 0.5, w - pad * 2, h * 0.085, h * 0.115, "rgba(244,230,200,0.85)", "#fff", 4);
    }, { px: 600, accent: r.accent, frameMat: Kit.M(0x2a1e14, { rough: 0.5 }) });
    Kit.hot(F, { x, z: 10.2, y: 3.0, r: 2.3, label: r.name, ref: r, focus: { x, y: 1.75, z: 11.8 }, fn: () => { AudioSys.sfx("open"); UI.panel(r); } });
  });
  // coursework: five big volumes on a long desk
  const cw = Kit.grp(F, 8.8, 10.6, Math.PI);
  Kit.B(cw, 3.6, 0.8, 0.9, Look.mat("wood", 0x4a3020, { tile: 1 }), 0, 0.4, 0, { r: 0.03 });
  const vc = [0x7a1420, 0x14306a, 0x1f5a2e, 0x6a4a14, 0x3a1a5a];
  dtu.coursework.forEach((subj, i) => {
    const bx = -1.36 + i * 0.68;
    Kit.B(cw, 0.42, 0.62, 0.36, Kit.M(vc[i], { rough: 0.6 }), bx, 1.11, 0, { r: 0.02 });
    const sp = Kit.screen(F, 0.4, 0.58, (c, w, h) => {
      c.fillStyle = "#" + vc[i].toString(16).padStart(6, "0"); c.fillRect(0, 0, w, h);
      c.strokeStyle = gold; c.lineWidth = 3; c.strokeRect(6, 6, w - 12, h - 12);
      c.save(); c.translate(w / 2, h / 2); c.rotate(-Math.PI / 2);
      c.fillStyle = "#ffd98a"; c.textAlign = "center"; c.textBaseline = "middle";
      Type.fit(c, subj, 800, w * 0.2, h * 0.85); c.fillText(subj, 0, 0); c.restore();
    }, bx, 1.11, -0.185, Math.PI, { parent: cw, fps: 0, px: 160, glow: 1.0 });
    void sp;
  });
  Kit.colLocal(F, cw, 0, 0, 3.7, 1.0);
  Kit.textPoster(F, ["CORE COURSEWORK", "the five volumes every system stands on"], 3.4, 0.7, 8.8, 2.5, 11.86, Math.PI, { color: "#ffd98a", bg: "#1a120a", borderCol: "rgba(217,164,65,0.6)", lit: true });
  Kit.hot(F, { x: 8.8, z: 9.0, y: 2.0, r: 2.2, label: "Core coursework — DSA, OS, networks, DBMS, OOP", ref: dtu, focus: { x: 8.8, y: 1.1, z: 10.6 }, fn: () => { AudioSys.sfx("open"); UI.panel(dtu); } });
  // the reading list (south-west corner)
  Kit.neon(F, "THE READING LIST", 0xffd166, -11.6, 3.55, 11.84, Math.PI, { size: 0.24, glow: 1.6 });
  const cats = CONTENT.bookCats, cols = [0x57d8ff, 0x7ae582, 0xffd166, 0xff9e4d, 0xc084fc];
  const cases = [Kit.bookcase(F, -13.4, 11.55, Math.PI, { w: 3.2, h: 2.7, rows: 5, skipRows: [1, 3], noDecor: true, wood: Kit.M(0x3a2618, { rough: 0.6 }) }),
                 Kit.bookcase(F, -9.8, 11.55, Math.PI, { w: 3.2, h: 2.7, rows: 5, skipRows: [1, 3], noDecor: true, wood: Kit.M(0x3a2618, { rough: 0.6 }) })];
  let k = 0;
  cats.forEach((cat, ci) => CONTENT.books.filter((b) => b.cat === cat).forEach((book) => {
    const caseI = k < 10 ? 0 : 1, j = k % 10, row = j < 5 ? 1 : 3, col = j % 5;
    Kit.book(F, cases[caseI], -1.2 + col * 0.6, 0.08 + (2.7 - 0.16) * (row / 5) + 0.02, 0.0, book, cols[ci]);
    k++;
  }));
  P(F, "loungeChair", -11.6, 8.6, Math.PI + 0.3, { tint: { carpet: 0x6a1420 } });
  Kit.floorLamp(F, -14.6, 9.0, { intensity: 0.8, light: true });

  // ---- atmosphere ----
  for (const [x, z, ry] of [[-15.85, -8, HP], [-15.85, 8.5, HP], [-0.5, -11.85, 0], [6.5, 11.85, Math.PI], [-6.5, 11.85, Math.PI]]) Kit.torch(F, x, z, ry, { light: false });
  F.npcSpecs.push({ model: "character-female-c", x: -6.0, z: -4.7, ry: Math.PI, behavior: "idle", hold: "files", quotes: "student" });
  F.npcSpecs.push({ model: "character-male-e", x: -4.6, z: 4.7, ry: 0, behavior: "idle", hold: "files", quotes: "student" });
  F.npcSpecs.push({ model: "character-female-a", x: 4, z: -6.5, behavior: "route", speed: 0.9, quotes: "student", waypoints: [[4, -6.5, 2], [10.5, -7.5, 3], [10.5, 6.5, 2], [2, 7, 2]] });
};

/* ============================================================
   F0 — the lobby points at what matters first
   ============================================================ */
extend("f0", (F) => {
  const sign = (x, z, ry, accent, kicker, title, lines, big, floor) => {
    const g = Kit.grp(F, x, z, ry);
    g.scale.setScalar(1.22);
    Kit.B(g, 1.9, 0.1, 0.6, Kit.gold(), 0, 0.05, 0, { r: 0.02 });
    Kit.B(g, 1.8, 3.25, 0.18, Kit.M(0x120e0a, { rough: 0.35, metal: 0.5 }), 0, 1.72, 0, { r: 0.04 });
    Kit.collide(F, x, z, 2.4, 0.8, ry);
    const col = Type.hex(accent);
    Kit.screen(F, 1.62, 3.0, (c, w, h) => {
      c.fillStyle = "#0b0c10"; c.fillRect(0, 0, w, h);
      c.fillStyle = col; c.fillRect(0, 0, w, h * 0.01);
      const pad = w * 0.09;
      c.textAlign = "left"; c.textBaseline = "alphabetic";
      c.font = `800 ${w * 0.06}px ${Kit.FONT}`; c.fillStyle = col; c.fillText(kicker, pad, h * 0.07);
      Type.fit(c, title, 800, w * 0.14, w - pad * 2, "Fraunces, Georgia, serif"); c.fillStyle = "#fff4e0"; c.fillText(title, pad, h * 0.15);
      let yy = h * 0.235;
      for (const [a, b] of lines) {
        Type.fit(c, a, 800, w * 0.058, w - pad * 2); c.fillStyle = "#fff"; c.fillText(a, pad, yy);
        Type.fit(c, b, 500, w * 0.045, w - pad * 2); c.fillStyle = "rgba(255,244,224,0.7)"; c.fillText(b, pad, yy + w * 0.06);
        yy += w * 0.16;
      }
      c.font = `800 ${w * 0.2}px ${Kit.FONT}`; c.fillStyle = col; c.fillText(big[0], pad, h * 0.84);
      c.font = `600 ${w * 0.05}px ${Kit.FONT}`; c.fillStyle = "rgba(255,244,224,0.75)"; c.fillText(big[1], pad, h * 0.88);
      c.fillStyle = col; c.fillRect(pad, h * 0.915, w - pad * 2, h * 0.055);
      c.fillStyle = "#0b0c10"; c.font = `800 ${w * 0.055}px ${Kit.FONT}`; c.textAlign = "center";
      c.fillText(`▲  FLOOR ${floor} — TAKE ME THERE`, w / 2, h * 0.952);
    }, 0, 1.76, 0.1, 0, { parent: g, fps: 0, px: 520, glow: 1.15 });
    Kit.light(F, x + Math.sin(ry) * 1.1, 2.6, z + Math.cos(ry) * 1.1, accent, 0.9, 4.5);
    Kit.hot(F, { x: x + Math.sin(ry) * 1.3, z: z + Math.cos(ry) * 1.3, y: 4.45, r: 2.4, label: `${title} — take the elevator to Floor ${floor}`, fn: () => { AudioSys.sfx("blip"); Game.changeFloor(floor); } });
  };
  const C = CONTENT.cases, by = (id) => C.find((c) => c.id === id);
  sign(-4.7, -1.2, 0.45, 0x57d8ff, "EXPERIENCE · FLOOR 1", "Where I've worked",
    [["Sprinklr", `${by("sprinklr").role} · ${by("sprinklr").dates}`], ["Pocketpills", `${by("pocketpills").role} · ${by("pocketpills").dates}`], ["Xtreme Technologies", `Backend intern · 2022`]],
    ["12M+", "users reached by systems I built"], 1);
  sign(6.6, -1.4, -0.45, 0xe8c268, "EDUCATION · FLOOR 2", "Where I learned",
    [["Delhi Technological University", "B.Tech, Computer Engineering · 2019–23"], ["448 LeetCode · CodeKaze 315", "problem solving, every day"], ["Abhinav Public School", "CBSE XII · 90.4%"]],
    ["8.83", "CGPA · out of 10"], 2);
});
