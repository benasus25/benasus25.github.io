/* ============================================================
   SPARSH HQ — render.js
   Isometric renderer: sky, skyline, rain, floor plates, glass,
   procedural props, people, particles, retro post-process.
   ============================================================ */

const Renderer = {
  canvas: null, ctx: null,
  plate: null, plateOff: { x: 0, y: 0 },
  sky1: null, sky2: null,
  rainDrops: [], cars: [],
  lowCanvas: null,

  /* ---------- per-floor palettes ---------- */
  PAL: {
    P: { sky: ["#04060f", "#0d1526", "#1d2b45"], horizon: 0.55, dark: 1,
         mats: { 1: "#232a38", 2: "#1d2430", 3: "#2c3648", 4: "#161c26", 5: "#31281e" },
         wall: "#2a3140", wallTop: "#3a4356", glass: "rgba(140,190,255,0.14)", accent: "#ff6b57", rain: 1 },
    0: { sky: ["#070a14", "#131c30", "#27334e"], horizon: 0.6, dark: 0.8,
         mats: { 1: "#e8e0d2", 2: "#ddd2c0", 3: "#c9b795", 4: "#8a7a5f", 5: "#6d5c42", 6: "#354d43" },
         wall: "#8c8274", wallTop: "#a99e8d", glass: "rgba(150,200,255,0.13)", accent: "#33c6a4", rain: 0.4 },
    1: { sky: ["#060913", "#101a2e", "#22304b"], horizon: 0.58, dark: 0.85,
         mats: { 1: "#33415c", 2: "#2c3950", 3: "#405174", 4: "#22293b", 5: "#57657f", 6: "#2a4a66" },
         wall: "#41506b", wallTop: "#57678a", glass: "rgba(140,190,255,0.13)", accent: "#5aa7ff", rain: 0.4 },
    2: { sky: ["#0a0616", "#180f2e", "#2a1c4e"], horizon: 0.58, dark: 0.9,
         mats: { 1: "#352b4e", 2: "#2d2443", 3: "#453567", 4: "#201a33", 5: "#4d3d72", 6: "#232e52" },
         wall: "#443767", wallTop: "#5a4a87", glass: "rgba(190,140,255,0.13)", accent: "#c084fc", rain: 0.4 },
    3: { sky: ["#0b0a10", "#1e1826", "#39304a"], horizon: 0.6, dark: 0.7,
         mats: { 1: "#8a6f4d", 2: "#7d6444", 3: "#9c8258", 4: "#5c4930", 5: "#40342a", 6: "#6e5335" },
         wall: "#6e5a3e", wallTop: "#8a7350", glass: "rgba(255,214,140,0.12)", accent: "#f5b953", rain: 0.4 },
    4: { sky: ["#08060c", "#120f1a", "#221c30"], horizon: 0.58, dark: 1,
         mats: { 1: "#241f2e", 2: "#1e1a27", 3: "#2f2840", 4: "#141019", 5: "#3a3050" },
         wall: "#2e2740", wallTop: "#3f3558", glass: "rgba(255,200,140,0.1)", accent: "#e8b34b", rain: 0.4 },
    5: { sky: ["#040a08", "#0b1712", "#16281f"], horizon: 0.58, dark: 1,
         mats: { 1: "#16211c", 2: "#121c17", 3: "#1d2b24", 4: "#0d1411", 5: "#24352c" },
         wall: "#1e2c25", wallTop: "#2a3d33", glass: "rgba(140,255,190,0.1)", accent: "#4ade80", rain: 0.4 },
    6: { sky: ["#0c0705", "#1c110b", "#301d12"], horizon: 0.58, dark: 1,
         mats: { 1: "#2b2521", 2: "#241f1b", 3: "#38302a", 4: "#181411", 5: "#453a32" },
         wall: "#3a322b", wallTop: "#4d423a", glass: "rgba(255,170,120,0.11)", accent: "#ff9e4d", rain: 0.4 },
    7: { sky: ["#05070f", "#0e1424", "#1c2740"], horizon: 0.62, dark: 0.9,
         mats: { 1: "#2b2f3a", 2: "#242832", 3: "#383d4c", 4: "#181b23", 5: "#4a3b2c", 6: "#33403a" },
         wall: "#3a3f4e", wallTop: "#4d5366", glass: "rgba(150,200,255,0.14)", accent: "#e0b566", rain: 1 },
    D: { sky: ["#050308", "#0a0610", "#120a1c"], horizon: 0.5, dark: 1,
         mats: { 1: "#241a2e", 2: "#1d1526", 3: "#2e2138", 4: "#120c1a", 5: "#332440" },
         wall: "#2c2138", wallTop: "#3b2d4c", glass: "rgba(180,120,255,0.1)", accent: "#a855f7", rain: 0 },
  },

  init(canvas) {
    Renderer.canvas = canvas;
    Renderer.ctx = canvas.getContext("2d");
    const fit = () => {
      // hiDPI supersampling — the whole world renders razor-sharp
      const d = Renderer.dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * d;
      canvas.height = window.innerHeight * d;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    };
    fit(); window.addEventListener("resize", fit);
    Renderer.buildSkyline();
    for (let i = 0; i < 160; i++) Renderer.rainDrops.push({ x: Math.random(), y: Math.random(), s: U.rand(0.5, 1.2) });
    for (let i = 0; i < 4; i++) Renderer.cars.push({ x: Math.random(), y: U.rand(0.1, 0.42), v: U.rand(0.02, 0.06) * (Math.random() < 0.5 ? 1 : -1), c: U.pick(["#ff5f45", "#57d8ff", "#ffd166"]) });
    Renderer.lowCanvas = document.createElement("canvas");
  },

  buildSkyline() {
    const mk = (h, n, base, lit) => {
      const cv = document.createElement("canvas");
      cv.width = 2400; cv.height = h;
      const x2 = cv.getContext("2d");
      let x = 0;
      while (x < cv.width) {
        const bw = U.rand(40, 110), bh = U.rand(h * 0.25, h * 0.95);
        x2.fillStyle = base;
        x2.fillRect(x, h - bh, bw, bh);
        x2.fillStyle = lit;
        for (let wy = h - bh + 8; wy < h - 8; wy += 12)
          for (let wx = x + 5; wx < x + bw - 6; wx += 10)
            if (Math.random() < 0.28) x2.fillRect(wx, wy, 4, 6);
        // antenna
        if (Math.random() < 0.25) { x2.fillStyle = base; x2.fillRect(x + bw / 2, h - bh - 14, 2, 14); x2.fillStyle = "#ff4d4d"; x2.fillRect(x + bw / 2 - 1, h - bh - 17, 4, 4); }
        x += bw + U.rand(6, 26);
      }
      return cv;
    };
    Renderer.sky1 = mk(360, 30, "#0b111f", "rgba(255,214,130,0.5)");
    Renderer.sky2 = mk(300, 40, "#141d31", "rgba(150,210,255,0.55)");
  },

  /* ---------- floor plate (static tiles + far glass) ---------- */
  onFloorChange(floor) {
    const pal = Renderer.PAL[floor.idx] || Renderer.PAL[0];
    const m = 140;
    const W = (floor.w + floor.h) * ISO.HX + m * 2;
    const H = (floor.w + floor.h) * ISO.HY + m * 2 + ISO.WALL;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const c = cv.getContext("2d");
    const offX = floor.h * ISO.HX + m, offY = m + ISO.WALL;
    c.translate(offX, offY);

    // tiles
    for (let y = 0; y < floor.h; y++) for (let x = 0; x < floor.w; x++) {
      const mat = floor.mat[y][x];
      if (!mat) continue;
      const s = ISO.toScreen(x, y);
      let col = pal.mats[mat] || pal.mats[1];
      c.fillStyle = col;
      Renderer.tilePath(c, s.x, s.y);
      c.fill();
      // checker shading + grout
      if ((x + y) % 2 === 0) { c.fillStyle = "rgba(255,255,255,0.03)"; Renderer.tilePath(c, s.x, s.y); c.fill(); }
      c.strokeStyle = "rgba(0,0,0,0.13)"; c.lineWidth = 1;
      Renderer.tilePath(c, s.x, s.y); c.stroke();
    }
    // plate edge (thickness of the slab)
    for (let y = 0; y < floor.h; y++) for (let x = 0; x < floor.w; x++) {
      if (!floor.mat[y][x]) continue;
      const s = ISO.toScreen(x, y);
      if (y + 1 >= floor.h || !floor.mat[y + 1][x]) { // south edge slab
        c.fillStyle = "rgba(8,10,16,0.9)";
        const a = ISO.toScreen(x, y + 1), b = ISO.toScreen(x + 1, y + 1);
        c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(b.x, b.y + 14); c.lineTo(a.x, a.y + 14); c.closePath(); c.fill();
      }
      if (x + 1 >= floor.w || !floor.mat[y][x + 1]) { // east edge slab
        c.fillStyle = "rgba(12,14,22,0.9)";
        const a = ISO.toScreen(x + 1, y + 1), b = ISO.toScreen(x + 1, y);
        c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(b.x, b.y + 14); c.lineTo(a.x, a.y + 14); c.closePath(); c.fill();
      }
    }
    // far glass walls (N and W edges against void) — skip outdoors
    if (!floor.noGlass)
    for (let y = 0; y < floor.h; y++) for (let x = 0; x < floor.w; x++) {
      if (!floor.mat[y][x]) continue;
      const noN = y === 0 || !floor.mat[y - 1][x];
      const noW = x === 0 || !floor.mat[y][x - 1];
      if (noN) Renderer.glassPanel(c, ISO.toScreen(x, y), ISO.toScreen(x + 1, y), pal);
      if (noW) Renderer.glassPanel(c, ISO.toScreen(x, y), ISO.toScreen(x, y + 1), pal);
    }
    floor.plate = cv;
    floor.plateOff = { x: offX, y: offY };
  },

  tilePath(c, sx, sy) {
    c.beginPath();
    c.moveTo(sx, sy); c.lineTo(sx + ISO.HX, sy + ISO.HY);
    c.lineTo(sx, sy + ISO.HY * 2); c.lineTo(sx - ISO.HX, sy + ISO.HY);
    c.closePath();
  },

  glassPanel(c, a, b, pal, h = ISO.WALL) {
    c.fillStyle = pal.glass;
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(b.x, b.y - h); c.lineTo(a.x, a.y - h); c.closePath(); c.fill();
    c.strokeStyle = "rgba(200,230,255,0.25)"; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(a.x, a.y - h); c.lineTo(b.x, b.y - h); c.stroke();
    c.strokeStyle = "rgba(200,230,255,0.12)";
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(a.x, a.y - h); c.stroke();
    // diagonal sheen
    c.strokeStyle = "rgba(255,255,255,0.06)"; c.lineWidth = 5;
    c.beginPath(); c.moveTo(U.lerp(a.x, b.x, 0.25), a.y - h * 0.15); c.lineTo(U.lerp(a.x, b.x, 0.55), a.y - h * 0.85); c.stroke();
  },

  /* ---------- shared shape helpers ---------- */
  cuboid(c, wx, wy, z, fw, fh, h, top, left, right) {
    const A = ISO.toScreen(wx, wy), B = ISO.toScreen(wx + fw, wy),
          C = ISO.toScreen(wx + fw, wy + fh), D = ISO.toScreen(wx, wy + fh);
    const dz = z + h;
    // left face (D-C)
    c.fillStyle = left;
    c.beginPath(); c.moveTo(D.x, D.y - z); c.lineTo(C.x, C.y - z); c.lineTo(C.x, C.y - dz); c.lineTo(D.x, D.y - dz); c.closePath(); c.fill();
    // right face (C-B)
    c.fillStyle = right;
    c.beginPath(); c.moveTo(C.x, C.y - z); c.lineTo(B.x, B.y - z); c.lineTo(B.x, B.y - dz); c.lineTo(C.x, C.y - dz); c.closePath(); c.fill();
    // top
    c.fillStyle = top;
    c.beginPath(); c.moveTo(A.x, A.y - dz); c.lineTo(B.x, B.y - dz); c.lineTo(C.x, C.y - dz); c.lineTo(D.x, D.y - dz); c.closePath(); c.fill();
  },

  shadow(c, wx, wy, rx = 14, ry = 7, a = 0.28) {
    const s = ISO.toScreen(wx, wy);
    c.fillStyle = `rgba(0,0,0,${a})`;
    c.beginPath(); c.ellipse(s.x, s.y, rx, ry, 0, 0, Math.PI * 2); c.fill();
  },

  glowDot(c, x, y, r, color, a = 0.8) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, "rgba(0,0,0,0)");
    c.globalAlpha = a; c.fillStyle = g;
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 1;
  },

  rr(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  },

  /* ---------- people ---------- */
  drawPerson(c, p) {
    const s = ISO.toScreen(p.x + 0.5, p.y + 0.5);
    const t = Game.time * 8 + (p.seed || 0);
    const walking = p.moving;
    const bob = walking ? Math.abs(Math.sin(t)) * 2.2 : Math.sin(Game.time * 2 + (p.seed || 0)) * 0.8;
    const cfg = p.cfg;
    Renderer.shadow(c, p.x + 0.5, p.y + 0.5, 11, 5, 0.3);
    c.save();
    c.translate(s.x, s.y - bob);
    if (p.holo) c.globalAlpha = 0.75;

    // legs
    const lw = 3.5, lh = 9;
    const sw = walking ? Math.sin(t) * 4 : 0;
    c.fillStyle = cfg.pants;
    c.fillRect(-5, -lh + Math.max(0, -sw * 0.6), lw, lh + Math.min(0, sw * 0.6));
    c.fillRect(1.5, -lh + Math.max(0, sw * 0.6), lw, lh - Math.min(0, sw * 0.6) * -1);
    // body
    c.fillStyle = cfg.shirt;
    Renderer.rr(c, -7, -26, 14, 18, 5); c.fill();
    // arms
    c.fillStyle = cfg.shirt;
    c.fillRect(-9.5, -24 + (walking ? Math.sin(t) * 2 : 0), 3, 12);
    c.fillRect(6.5, -24 + (walking ? -Math.sin(t) * 2 : 0), 3, 12);
    // head
    c.fillStyle = cfg.skin;
    c.beginPath(); c.arc(0, -32, 6.5, 0, Math.PI * 2); c.fill();
    // hair
    c.fillStyle = cfg.hair;
    c.beginPath(); c.arc(0, -34, 6.2, Math.PI * 0.95, Math.PI * 2.05); c.fill();
    // face (only when facing screen-down)
    if (p.faceY >= 0) {
      c.fillStyle = "#1b1b22";
      const fo = p.faceX >= 0 ? 1.5 : -1.5;
      c.fillRect(-2.5 + fo, -33, 1.8, 2.2); c.fillRect(1 + fo, -33, 1.8, 2.2);
    }
    // accessory
    if (cfg.acc === "mug") { c.fillStyle = "#e8e4da"; c.fillRect(8, -18, 5, 5); c.fillStyle = "#6b4a2f"; c.fillRect(9, -17, 3, 1.5); }
    if (cfg.acc === "cap") { c.fillStyle = "#2b3a55"; c.fillRect(-6.5, -38.5, 13, 3.5); }
    if (cfg.acc === "mop") { c.strokeStyle = "#9a8a70"; c.lineWidth = 2; c.beginPath(); c.moveTo(10, -26); c.lineTo(12, 0); c.stroke(); c.fillStyle = "#d8d2c4"; c.fillRect(9, -2, 7, 4); }
    if (cfg.acc === "clipboard") { c.fillStyle = "#c8b98e"; c.fillRect(-13, -22, 6, 8); }
    if (p.holo) {
      c.globalAlpha = 0.35;
      c.strokeStyle = "#57d8ff";
      for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-9, -8 - i * 8 + (Game.time * 20 % 8)); c.lineTo(9, -8 - i * 8 + (Game.time * 20 % 8)); c.stroke(); }
      c.globalAlpha = 1;
    }
    c.restore();
    // name tag
    if (p.tag) {
      c.font = "600 9px 'Outfit', sans-serif";
      c.textAlign = "center";
      c.fillStyle = p.holo ? "rgba(120,220,255,0.9)" : "rgba(255,255,255,0.55)";
      c.fillText(p.tag, s.x, s.y - bob - 44);
    }
    // speech bubble
    if (p.bubble && p.bubble.t > 0) Renderer.bubble(c, s.x, s.y - bob - 50, p.bubble.text, Math.min(1, p.bubble.t * 3));
  },

  bubble(c, x, y, text, alpha) {
    c.save();
    c.globalAlpha = alpha;
    c.font = "500 10.5px 'Outfit', sans-serif";
    const words = text.split(" "); const lines = []; let cur = "";
    for (const w of words) { if (c.measureText(cur + " " + w).width > 150 && cur) { lines.push(cur); cur = w; } else cur = cur ? cur + " " + w : w; }
    lines.push(cur);
    const lw = Math.max(...lines.map(l => c.measureText(l).width));
    const bw = lw + 16, bh = lines.length * 13 + 10;
    c.fillStyle = "rgba(16,20,30,0.92)";
    c.strokeStyle = "rgba(255,255,255,0.18)"; c.lineWidth = 1;
    Renderer.rr(c, x - bw / 2, y - bh, bw, bh, 7); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x + 4, y); c.lineTo(x, y + 5); c.closePath(); c.fill();
    c.fillStyle = "#e8ecf4"; c.textAlign = "center";
    lines.forEach((l, i) => c.fillText(l, x, y - bh + 15 + i * 13));
    c.restore();
  },

  /* ================= PROPS ================= */
  props: {
    rug(c, p) {
      const col = p.color || "rgba(80,120,160,0.35)";
      c.fillStyle = col;
      const A = ISO.toScreen(p.x, p.y), B = ISO.toScreen(p.x + p.fw, p.y), C = ISO.toScreen(p.x + p.fw, p.y + p.fh), D = ISO.toScreen(p.x, p.y + p.fh);
      c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.lineTo(C.x, C.y); c.lineTo(D.x, D.y); c.closePath(); c.fill();
      c.strokeStyle = "rgba(255,255,255,0.15)"; c.lineWidth = 1.5; c.stroke();
    },
    desk(c, p, t) {
      Renderer.cuboid(c, p.x, p.y, 0, p.fw || 2, p.fh || 1, 20, "#5f4e3a", "#48392a", "#3b2f22");
      // monitor
      const s = ISO.toScreen(p.x + (p.fw || 2) / 2, p.y + (p.fh || 1) / 2);
      c.fillStyle = "#14161c";
      c.fillRect(s.x - 12, s.y - 46, 24, 15);
      const on = Math.sin(t * 2 + p.x * 3 + p.y) > -0.7;
      c.fillStyle = on ? (p.screen || "#3fd0ff") : "#20242e";
      c.globalAlpha = on ? 0.85 : 1;
      c.fillRect(s.x - 10.5, s.y - 44.5, 21, 12);
      c.globalAlpha = 1;
      if (on) { c.strokeStyle = "rgba(255,255,255,0.55)"; c.lineWidth = 1; c.beginPath();
        for (let i = 0; i < 6; i++) { const gx = s.x - 9 + i * 3.4; c.lineTo(gx, s.y - 38 - Math.abs(Math.sin(t * 1.5 + i + p.x)) * 5); } c.stroke(); }
      c.fillStyle = "#0f1116"; c.fillRect(s.x - 2, s.y - 32, 4, 5);
    },
    chair(c, p) {
      const s = ISO.toScreen(p.x + 0.5, p.y + 0.5);
      c.fillStyle = "#20242e"; c.beginPath(); c.ellipse(s.x, s.y - 12, 8, 4.5, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#272c38"; c.fillRect(s.x - 7, s.y - 30, 4, 19);
      c.fillStyle = "#14171e"; c.fillRect(s.x - 1, s.y - 12, 2, 10);
    },
    sofa(c, p) {
      const fw = p.fw || 2, fh = p.fh || 1;
      Renderer.cuboid(c, p.x, p.y, 0, fw, fh, 14, p.color || "#7a5b45", "#5d4433", "#4c3729");
      Renderer.cuboid(c, p.x, p.y, 14, fw, 0.35, 14, p.color || "#84624a", "#5d4433", "#4c3729");
    },
    ctable(c, p) {
      Renderer.cuboid(c, p.x, p.y, 12, p.fw || 1, p.fh || 1, 4, "#c9bfae", "#9a9080", "#847a6b");
      const s = ISO.toScreen(p.x + 0.5, p.y + 0.5);
      c.fillStyle = "#6b4a2f"; c.beginPath(); c.arc(s.x + 4, s.y - 20, 2.5, 0, Math.PI * 2); c.fill();
    },
    table(c, p) {
      Renderer.cuboid(c, p.x, p.y, 14, p.fw || 2, p.fh || 2, 5, "#8f7f68", "#6e604c", "#5b503f");
    },
    plant(c, p, t) {
      const s = ISO.toScreen(p.x + 0.5, p.y + 0.5);
      Renderer.shadow(c, p.x + 0.5, p.y + 0.5, 9, 4.5, 0.25);
      c.fillStyle = "#8a5a3a"; c.fillRect(s.x - 5, s.y - 10, 10, 9);
      const sway = Math.sin(t * 0.8 + p.x) * 1.5;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        c.fillStyle = i % 2 ? "#3f8a4f" : "#2f6e3e";
        c.beginPath();
        c.ellipse(s.x + Math.cos(a) * 6 + sway, s.y - 22 - Math.abs(Math.sin(a)) * 6, 6, 11, a * 0.5, 0, Math.PI * 2);
        c.fill();
      }
    },
    tallplant(c, p, t) {
      const s = ISO.toScreen(p.x + 0.5, p.y + 0.5);
      Renderer.shadow(c, p.x + 0.5, p.y + 0.5, 10, 5, 0.25);
      c.fillStyle = "#6e5540"; c.fillRect(s.x - 6, s.y - 12, 12, 11);
      c.strokeStyle = "#3a6e42"; c.lineWidth = 3;
      const sway = Math.sin(t + p.y) * 2;
      for (let i = -1; i <= 1; i++) {
        c.beginPath(); c.moveTo(s.x, s.y - 12);
        c.quadraticCurveTo(s.x + i * 10 + sway, s.y - 34, s.x + i * 16 + sway, s.y - 52 + Math.abs(i) * 8);
        c.stroke();
      }
      c.fillStyle = "#4a9a58";
      for (let i = -1; i <= 1; i++) { c.beginPath(); c.ellipse(s.x + i * 16 + sway, s.y - 52 + Math.abs(i) * 8, 7, 4, i * 0.5, 0, Math.PI * 2); c.fill(); }
    },
    mosswall(c, p, t) {
      const fw = p.fw || 3;
      Renderer.cuboid(c, p.x, p.y, 0, fw, 0.4, 54, "#2d5a35", "#234728", "#1c3a21");
      const A = ISO.toScreen(p.x, p.y + 0.2), B = ISO.toScreen(p.x + fw, p.y + 0.2);
      for (let i = 0; i < fw * 7; i++) {
        const f = i / (fw * 7);
        const px = U.lerp(A.x, B.x, f), py = U.lerp(A.y, B.y, f) - U.rand(8, 48);
        c.fillStyle = ["#3f8a4f", "#54a763", "#2f6e3e"][i % 3];
        c.beginPath(); c.arc(px + Math.sin(t + i) * 0.8, py, U.rand(2.5, 4.5), 0, Math.PI * 2); c.fill();
      }
    },
    wallblock(c, p) { // interior wall tile
      const pal = Renderer.PAL[Game.floor.idx] || Renderer.PAL[0];
      const glassy = p.glassy;
      if (glassy) {
        c.globalAlpha = 0.55;
        Renderer.cuboid(c, p.x, p.y, 0, 1, 1, ISO.WALL * 0.82, "rgba(180,220,255,0.35)", "rgba(150,200,255,0.22)", "rgba(120,170,230,0.28)");
        c.globalAlpha = 1;
      } else {
        Renderer.cuboid(c, p.x, p.y, 0, 1, 1, ISO.WALL * 0.82, pal.wallTop, Renderer.shade(pal.wall, -14), pal.wall);
      }
    },
    pillar(c, p) {
      const pal = Renderer.PAL[Game.floor.idx] || Renderer.PAL[0];
      Renderer.cuboid(c, p.x + 0.25, p.y + 0.25, 0, 0.5, 0.5, ISO.WALL, pal.wallTop, Renderer.shade(pal.wall, -16), pal.wall);
    },
    receptiondesk(c, p, t) {
      const fw = p.fw || 4;
      Renderer.cuboid(c, p.x, p.y, 0, fw, 1.2, 26, "#3b4252", "#2c3140", "#232836");
      Renderer.cuboid(c, p.x, p.y + 0.15, 26, fw, 0.9, 4, "#e8e0d2", "#c9c0af", "#b3ab9c");
      // glowing front strip
      const A = ISO.toScreen(p.x, p.y + 1.2), B = ISO.toScreen(p.x + fw, p.y + 1.2);
      const pulse = 0.5 + Math.sin(t * 2) * 0.25;
      c.strokeStyle = `rgba(80,220,190,${pulse})`; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(A.x, A.y - 13); c.lineTo(B.x, B.y - 13); c.stroke();
      const s = ISO.toScreen(p.x + fw / 2, p.y + 0.6);
      c.font = "700 10px 'Outfit',sans-serif"; c.textAlign = "center";
      c.fillStyle = "rgba(255,255,255,0.8)"; c.fillText("R E C E P T I O N", s.x, s.y - 34);
    },
    bigscreen(c, p, t) {
      const fw = p.fw || 5;
      Renderer.cuboid(c, p.x, p.y, 0, fw, 0.3, 8, "#1a1e28", "#12151d", "#0e1118");
      const A = ISO.toScreen(p.x + 0.1, p.y + 0.15), B = ISO.toScreen(p.x + fw - 0.1, p.y + 0.15);
      const h = 62;
      // screen panel
      c.fillStyle = "rgba(10,14,22,0.96)";
      c.beginPath(); c.moveTo(A.x, A.y - 10); c.lineTo(B.x, B.y - 10); c.lineTo(B.x, B.y - 10 - h); c.lineTo(A.x, A.y - 10 - h); c.closePath(); c.fill();
      c.strokeStyle = "rgba(90,170,255,0.5)"; c.lineWidth = 1.5; c.stroke();
      c.save();
      c.beginPath(); c.moveTo(A.x, A.y - 10); c.lineTo(B.x, B.y - 10); c.lineTo(B.x, B.y - 10 - h); c.lineTo(A.x, A.y - 10 - h); c.closePath(); c.clip();
      const midX = (A.x + B.x) / 2, midY = (A.y + B.y) / 2;
      c.font = "800 13px 'Outfit',sans-serif"; c.textAlign = "center";
      c.fillStyle = "#e8f2ff";
      c.fillText(CONTENT.profile.name.toUpperCase(), midX, midY - 58);
      c.font = "600 9px 'Outfit',sans-serif"; c.fillStyle = "#57d8ff";
      c.fillText(CONTENT.bigScreen.currentRole, midX, midY - 45);
      c.fillStyle = "rgba(255,255,255,0.7)"; c.font = "500 8px 'Outfit',sans-serif";
      c.fillText(CONTENT.bigScreen.experience, midX, midY - 34);
      // ticker
      const tick = CONTENT.ticker.join("   •   ") + "   •   ";
      c.font = "700 10px 'Outfit',sans-serif";
      const tw = c.measureText(tick).width;
      const off = (t * 40) % tw;
      c.fillStyle = "#ffd166";
      c.textAlign = "left";
      c.fillText(tick, A.x - off, midY - 18);
      c.fillText(tick, A.x - off + tw, midY - 18);
      c.restore();
      Renderer.glowDot(c, midX, midY - 40, 60, "rgba(87,216,255,0.06)");
    },
    servrack(c, p, t) {
      const fh = p.fh || 1;
      Renderer.cuboid(c, p.x, p.y, 0, 0.8, fh, 52, "#20242e", "#161920", "#111319");
      const D = ISO.toScreen(p.x, p.y + fh), C = ISO.toScreen(p.x + 0.8, p.y + fh);
      for (let r = 0; r < 6; r++) {
        for (let i = 0; i < 3; i++) {
          const f = 0.2 + i * 0.3;
          const px = U.lerp(D.x, C.x, f), py = U.lerp(D.y, C.y, f) - 8 - r * 7;
          const on = Math.sin(t * (3 + (i + r) % 4) + r * 2 + p.x * 5 + i) > 0;
          c.fillStyle = on ? (p.alert ? "#ff5f45" : ["#4ade80", "#57d8ff", "#ffd166"][(r + i) % 3]) : "#252a35";
          c.fillRect(px - 1.5, py, 3, 2);
        }
      }
    },
    whiteboard(c, p) {
      const fw = p.fw || 2;
      Renderer.cuboid(c, p.x, p.y, 0, fw, 0.2, 6, "#333a48", "#262c38", "#20252f");
      const A = ISO.toScreen(p.x + 0.05, p.y + 0.1), B = ISO.toScreen(p.x + fw - 0.05, p.y + 0.1);
      c.fillStyle = "#f2f0ea";
      c.beginPath(); c.moveTo(A.x, A.y - 8); c.lineTo(B.x, B.y - 8); c.lineTo(B.x, B.y - 52); c.lineTo(A.x, A.y - 52); c.closePath(); c.fill();
      c.strokeStyle = "#3a5a8c"; c.lineWidth = 1;
      const midX = (A.x + B.x) / 2;
      c.beginPath(); c.moveTo(A.x + 8, A.y - 42); c.lineTo(A.x + 26, A.y - 42); c.stroke();
      c.strokeStyle = "#c0392b";
      c.beginPath(); c.arc(midX + 6, A.y - 30, 7, 0, Math.PI * 1.4); c.stroke();
      c.strokeStyle = "#2c7a4b";
      c.beginPath(); c.moveTo(A.x + 8, A.y - 18); c.lineTo(B.x - 12, A.y - 22); c.stroke();
      if (p.text) {
        c.font = "700 8px 'Outfit',sans-serif"; c.textAlign = "center"; c.fillStyle = "#2b3a55";
        c.fillText(p.text, midX, A.y - 46);
      }
    },
    bookshelf(c, p, t) {
      const fw = p.fw || 2;
      Renderer.cuboid(c, p.x, p.y, 0, fw, 0.5, 56, "#5a4128", "#46331f", "#3a2a19");
      const D = ISO.toScreen(p.x, p.y + 0.5), C = ISO.toScreen(p.x + fw, p.y + 0.5);
      const cols = ["#a34a3a", "#3a6ea3", "#3f8a4f", "#c9a227", "#7a4a8a", "#c96f3a"];
      for (let sh = 0; sh < 3; sh++) {
        for (let i = 0; i < fw * 6; i++) {
          const f = (i + 0.5) / (fw * 6);
          const px = U.lerp(D.x, C.x, f), py = U.lerp(D.y, C.y, f);
          const wob = p.murph ? Math.sin(t * 2 + i) * 1.5 : 0;
          c.fillStyle = cols[(i + sh) % cols.length];
          c.fillRect(px - 1.6, py - 18 - sh * 16 + wob, 3.2, 12);
        }
      }
      if (p.murph) Renderer.glowDot(c, (D.x + C.x) / 2, (D.y + C.y) / 2 - 30, 40, "rgba(180,140,255,0.12)");
    },
    coffeemachine(c, p, t) {
      Renderer.cuboid(c, p.x, p.y, 0, 1, 1, 26, "#2c3140", "#20242e", "#191c24");
      Renderer.cuboid(c, p.x + 0.15, p.y + 0.15, 26, 0.7, 0.7, 14, "#8c2f2f", "#6e2424", "#5a1d1d");
      const s = ISO.toScreen(p.x + 0.5, p.y + 0.5);
      // steam
      if (Math.sin(t * 0.7 + p.x) > 0.2) {
        for (let i = 0; i < 3; i++) {
          const sy = (t * 22 + i * 12) % 34;
          c.fillStyle = `rgba(255,255,255,${0.2 * (1 - sy / 34)})`;
          c.beginPath(); c.arc(s.x + Math.sin(t * 3 + i) * 3, s.y - 44 - sy, 3 + sy * 0.12, 0, Math.PI * 2); c.fill();
        }
      }
      Renderer.glowDot(c, s.x, s.y - 26, 16, "rgba(255,160,80,0.15)");
    },
    aquarium(c, p, t) {
      const fw = p.fw || 3;
      Renderer.cuboid(c, p.x, p.y, 0, fw, 0.8, 12, "#2c3140", "#20242e", "#191c24");
      // water box
      c.globalAlpha = 0.5;
      Renderer.cuboid(c, p.x, p.y, 12, fw, 0.8, 34, "rgba(80,180,220,0.5)", "rgba(40,120,180,0.45)", "rgba(30,100,160,0.5)");
      c.globalAlpha = 1;
      const A = ISO.toScreen(p.x, p.y + 0.4), B = ISO.toScreen(p.x + fw, p.y + 0.4);
      for (let i = 0; i < 5; i++) {
        const f = (Math.sin(t * (0.4 + i * 0.13) + i * 2) + 1) / 2;
        const px = U.lerp(A.x + 10, B.x - 10, f), py = U.lerp(A.y, B.y, f) - 22 - Math.sin(t * 2 + i * 3) * 6;
        const dir = Math.cos(t * (0.4 + i * 0.13) + i * 2) > 0 ? 1 : -1;
        c.fillStyle = ["#ffb347", "#ff6b57", "#57d8ff", "#ffd166", "#7ae582"][i];
        c.beginPath(); c.ellipse(px, py, 4.5, 2.2, 0, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.moveTo(px - dir * 4, py); c.lineTo(px - dir * 7, py - 2.5); c.lineTo(px - dir * 7, py + 2.5); c.closePath(); c.fill();
      }
      // bubbles
      for (let i = 0; i < 4; i++) {
        const by = (t * 14 + i * 9) % 30;
        c.fillStyle = "rgba(255,255,255,0.35)";
        c.beginPath(); c.arc(U.lerp(A.x, B.x, 0.2 + i * 0.2), A.y - 14 - by, 1.4, 0, Math.PI * 2); c.fill();
      }
    },
    elevator(c, p, t) {
      Renderer.cuboid(c, p.x, p.y, 0, p.fw || 2, 0.6, ISO.WALL, "#3a4152", "#2b3040", "#232836");
      const A = ISO.toScreen(p.x + 0.2, p.y + 0.35), B = ISO.toScreen(p.x + (p.fw || 2) - 0.2, p.y + 0.35);
      // doors
      const midX = (A.x + B.x) / 2, midY = (A.y + B.y) / 2;
      c.fillStyle = "#b9c2d4";
      c.beginPath(); c.moveTo(A.x, A.y - 4); c.lineTo(midX - 1, midY - 4); c.lineTo(midX - 1, midY - 52); c.lineTo(A.x, A.y - 52); c.closePath(); c.fill();
      c.fillStyle = "#a5aec2";
      c.beginPath(); c.moveTo(midX + 1, midY - 4); c.lineTo(B.x, B.y - 4); c.lineTo(B.x, B.y - 52); c.lineTo(midX + 1, midY - 52); c.closePath(); c.fill();
      c.strokeStyle = "rgba(20,24,34,0.7)"; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(midX, midY - 4); c.lineTo(midX, midY - 52); c.stroke();
      // indicator
      const pulse = 0.5 + Math.sin(t * 3) * 0.4;
      c.fillStyle = `rgba(87,216,255,${pulse})`;
      c.font = "700 9px 'Outfit',sans-serif"; c.textAlign = "center";
      c.fillText("▲ ▼", midX, midY - 58);
      Renderer.glowDot(c, midX, midY - 58, 14, "rgba(87,216,255,0.2)");
    },
    securitygate(c, p, t) {
      Renderer.cuboid(c, p.x, p.y, 0, 0.4, 1.5, 34, "#3a4152", "#2b3040", "#232836");
      Renderer.cuboid(c, p.x + 1.6, p.y, 0, 0.4, 1.5, 34, "#3a4152", "#2b3040", "#232836");
      const a = ISO.toScreen(p.x + 0.4, p.y + 0.75), b = ISO.toScreen(p.x + 1.6, p.y + 0.75);
      const scan = (Math.sin(t * 2) + 1) / 2;
      c.strokeStyle = `rgba(255,80,80,${0.5 + scan * 0.4})`; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(a.x, a.y - 8 - scan * 20); c.lineTo(b.x, b.y - 8 - scan * 20); c.stroke();
    },
    benchrow(c, p) {
      const fw = p.fw || 3;
      Renderer.cuboid(c, p.x, p.y, 0, fw, 0.6, 12, "#7d6444", "#5f4c33", "#4e3f2b");
      Renderer.cuboid(c, p.x, p.y + 0.45, 12, fw, 0.15, 12, "#8a6f4d", "#5f4c33", "#4e3f2b");
    },
    lectern(c, p) {
      Renderer.cuboid(c, p.x + 0.2, p.y + 0.2, 0, 0.6, 0.6, 28, "#6e5335", "#57402a", "#463422");
    },
    trophycase(c, p, t) {
      const fw = p.fw || 2;
      Renderer.cuboid(c, p.x, p.y, 0, fw, 0.6, 16, "#2e2740", "#241e33", "#1d1829");
      c.globalAlpha = 0.35;
      Renderer.cuboid(c, p.x, p.y, 16, fw, 0.6, 30, "rgba(200,220,255,0.3)", "rgba(150,180,230,0.2)", "rgba(130,160,210,0.25)");
      c.globalAlpha = 1;
      const D = ISO.toScreen(p.x, p.y + 0.3), C = ISO.toScreen(p.x + fw, p.y + 0.3);
      for (let i = 0; i < fw * 2; i++) {
        const f = (i + 0.5) / (fw * 2);
        const px = U.lerp(D.x, C.x, f), py = U.lerp(D.y, C.y, f) - 22;
        c.fillStyle = "#e8b34b";
        c.beginPath(); c.arc(px, py - 4 + Math.sin(t * 2 + i) * 1, 3.5, 0, Math.PI * 2); c.fill();
        c.fillRect(px - 1.5, py - 1, 3, 5);
        Renderer.glowDot(c, px, py - 3, 10, "rgba(232,179,75,0.25)");
      }
    },
    pedestal(c, p, t) {
      Renderer.cuboid(c, p.x + 0.15, p.y + 0.15, 0, 0.7, 0.7, 22, "#3b3548", "#2d2838", "#25212e");
      const s = ISO.toScreen(p.x + 0.5, p.y + 0.5);
      const iy = s.y - 30 + Math.sin(t * 1.5 + p.x) * 2;
      const item = p.item || "trophy";
      if (p.spot !== false) Renderer.glowDot(c, s.x, iy, 26, p.glow || "rgba(232,179,75,0.18)");
      c.save(); c.translate(s.x, iy);
      if (item === "trophy") {
        c.fillStyle = "#e8b34b";
        c.beginPath(); c.arc(0, -4, 6, Math.PI, Math.PI * 2); c.fill();
        c.fillRect(-1.8, -4, 3.6, 7); c.fillRect(-5, 3, 10, 2.5);
        c.strokeStyle = "#e8b34b"; c.lineWidth = 1.5;
        c.beginPath(); c.arc(-7, -5, 3.5, Math.PI * 0.5, Math.PI * 1.5); c.stroke();
        c.beginPath(); c.arc(7, -5, 3.5, -Math.PI * 0.5, Math.PI * 0.5); c.stroke();
      } else if (item === "cake") {
        c.fillStyle = "#f0d9c8"; c.fillRect(-8, -4, 16, 7);
        c.fillStyle = "#c96f8a"; c.fillRect(-8, -6, 16, 3);
        c.fillStyle = "#fff"; c.fillRect(-1, -12, 1.6, 6);
        Renderer.glowDot(c, 0, -13, 6, "rgba(255,200,100,0.9)");
      } else if (item === "pickaxe") {
        c.save(); c.rotate(-0.6);
        c.fillStyle = "#7a5230"; c.fillRect(-1.5, -8, 3, 18);
        c.fillStyle = "#57d8ff";
        c.beginPath(); c.moveTo(-10, -8); c.quadraticCurveTo(0, -14, 10, -8); c.lineTo(8, -5); c.quadraticCurveTo(0, -10, -8, -5); c.closePath(); c.fill();
        c.restore();
      } else if (item === "crowbar") {
        c.strokeStyle = "#c0392b"; c.lineWidth = 3;
        c.beginPath(); c.moveTo(-7, 4); c.lineTo(5, -6); c.arc(7, -3.5, 3.2, -Math.PI * 0.8, Math.PI * 0.3); c.stroke();
      } else if (item === "duck") {
        c.fillStyle = "#ffd23e";
        c.beginPath(); c.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(4.5, -6, 4, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#ff8c42"; c.beginPath(); c.moveTo(8, -6); c.lineTo(12, -5); c.lineTo(8, -3.6); c.closePath(); c.fill();
        c.fillStyle = "#1b1b22"; c.fillRect(5.4, -7.4, 1.6, 1.6);
      } else if (item === "reactor") {
        const pulse = 0.6 + Math.sin(t * 4) * 0.35;
        Renderer.glowDot(c, 0, -3, 30, `rgba(120,220,255,${pulse * 0.5})`);
        c.strokeStyle = "#a8e8ff"; c.lineWidth = 2;
        c.beginPath(); c.arc(0, -3, 8, 0, Math.PI * 2); c.stroke();
        c.fillStyle = `rgba(160,230,255,${pulse})`;
        c.beginPath(); c.arc(0, -3, 4.5, 0, Math.PI * 2); c.fill();
        for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + t; c.fillRect(Math.cos(a) * 10 - 1, -3 + Math.sin(a) * 10 - 1, 2, 2); }
      } else if (item === "chili") {
        c.fillStyle = "#8c3a2a"; c.beginPath(); c.ellipse(0, 2, 9, 4, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#c0392b"; c.beginPath(); c.ellipse(0, 0, 8, 3.5, 0, 0, Math.PI * 2); c.fill();
      }
      c.restore();
      if (p.label) {
        c.font = "600 8.5px 'Outfit',sans-serif"; c.textAlign = "center";
        c.fillStyle = "rgba(255,255,255,0.65)";
        c.fillText(p.label, s.x, s.y + 12);
      }
    },
    artframe(c, p, t) {
      // museum piece: floating frame with glow
      Renderer.cuboid(c, p.x, p.y, 0, p.fw || 2, 0.25, 4, "#1d1829", "#141019", "#100d14");
      const A = ISO.toScreen(p.x + 0.1, p.y + 0.12), B = ISO.toScreen(p.x + (p.fw || 2) - 0.1, p.y + 0.12);
      const h = 46;
      c.fillStyle = "#0f0c16";
      c.beginPath(); c.moveTo(A.x, A.y - 8); c.lineTo(B.x, B.y - 8); c.lineTo(B.x, B.y - 8 - h); c.lineTo(A.x, A.y - 8 - h); c.closePath(); c.fill();
      c.strokeStyle = p.color || "#e8b34b"; c.lineWidth = 2; c.stroke();
      const midX = (A.x + B.x) / 2, midY = (A.y + B.y) / 2;
      c.font = "800 11px 'Outfit',sans-serif"; c.textAlign = "center";
      c.fillStyle = p.color || "#e8b34b";
      c.fillText(p.big || "", midX, midY - 34);
      c.font = "500 8px 'Outfit',sans-serif"; c.fillStyle = "rgba(255,255,255,0.8)";
      c.fillText(p.small || "", midX, midY - 22);
      Renderer.glowDot(c, midX, midY - 30, 40, "rgba(232,179,75,0.07)");
      // spotlight cone
      c.fillStyle = "rgba(255,230,170,0.05)";
      c.beginPath(); c.moveTo(midX, midY - 80); c.lineTo(midX - 26, midY + 4); c.lineTo(midX + 26, midY + 4); c.closePath(); c.fill();
    },
    guestbook(c, p, t) {
      Renderer.cuboid(c, p.x + 0.2, p.y + 0.2, 0, 0.6, 0.6, 24, "#4a3b2c", "#392d21", "#2e2419");
      const s = ISO.toScreen(p.x + 0.5, p.y + 0.5);
      c.save(); c.translate(s.x, s.y - 30);
      c.rotate(-0.1);
      c.fillStyle = "#f2ead8"; c.fillRect(-9, -5, 9, 11);
      c.fillStyle = "#e8ddc4"; c.fillRect(0, -5, 9, 11);
      c.strokeStyle = "rgba(0,0,0,0.25)"; c.lineWidth = 0.8;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-7, -2 + i * 3); c.lineTo(-2, -2 + i * 3); c.stroke(); c.beginPath(); c.moveTo(2, -2 + i * 3); c.lineTo(7, -2 + i * 3); c.stroke(); }
      c.restore();
      Renderer.glowDot(c, s.x, s.y - 32, 18, "rgba(255,214,130,0.15)");
    },
    worldmap(c, p, t) {
      const fw = p.fw || 3;
      Renderer.cuboid(c, p.x, p.y, 0, fw, 0.2, 6, "#20242e", "#161920", "#111319");
      const A = ISO.toScreen(p.x + 0.05, p.y + 0.1), B = ISO.toScreen(p.x + fw - 0.05, p.y + 0.1);
      const h = 50;
      c.fillStyle = "#0d1524";
      c.beginPath(); c.moveTo(A.x, A.y - 8); c.lineTo(B.x, B.y - 8); c.lineTo(B.x, B.y - 8 - h); c.lineTo(A.x, A.y - 8 - h); c.closePath(); c.fill();
      c.strokeStyle = "rgba(87,216,255,0.4)"; c.lineWidth = 1; c.stroke();
      // crude continents
      c.fillStyle = "rgba(87,216,255,0.22)";
      const midX = (A.x + B.x) / 2, midY = (A.y + B.y) / 2 - 8 - h / 2;
      const blobs = [[-0.32, -0.15, 10, 8], [-0.18, 0.12, 7, 6], [0.02, -0.1, 9, 7], [0.12, 0.15, 6, 5], [0.3, -0.02, 11, 7], [0.38, 0.18, 5, 4]];
      const W = B.x - A.x;
      for (const [fx, fy, rx, ry] of blobs) { c.beginPath(); c.ellipse(midX + fx * W, midY + fy * h, rx, ry, 0, 0, Math.PI * 2); c.fill(); }
      // pings
      for (let i = 0; i < 6; i++) {
        const ph = (t * 0.7 + i * 0.618) % 1;
        const px = midX + Math.sin(i * 12.9898) * W * 0.4, py = midY + Math.cos(i * 78.233) * h * 0.3;
        c.strokeStyle = `rgba(255,107,87,${1 - ph})`;
        c.beginPath(); c.arc(px, py, 2 + ph * 8, 0, Math.PI * 2); c.stroke();
        c.fillStyle = "#ff6b57"; c.fillRect(px - 1, py - 1, 2, 2);
      }
    },
    photowall(c, p, t) {
      const fw = p.fw || 3;
      Renderer.cuboid(c, p.x, p.y, 0, fw, 0.2, 4, "#3a3f4e", "#2b3040", "#232836");
      const A = ISO.toScreen(p.x + 0.05, p.y + 0.1), B = ISO.toScreen(p.x + fw - 0.05, p.y + 0.1);
      const cols = 4, rows = 2;
      for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) {
        const f = (i + 0.5) / cols;
        const px = U.lerp(A.x, B.x, f), py = U.lerp(A.y, B.y, f) - 20 - r * 22;
        c.save(); c.translate(px, py); c.rotate(Math.sin(i * 3 + r) * 0.1);
        c.fillStyle = "#f2f0ea"; c.fillRect(-8, -9, 16, 18);
        c.fillStyle = `hsl(${(i * 60 + r * 130) % 360},35%,45%)`; c.fillRect(-6.5, -7.5, 13, 12);
        c.restore();
      }
    },
    vending(c, p, t) {
      Renderer.cuboid(c, p.x, p.y, 0, 1, 0.8, 44, "#8c2f3f", "#6e2432", "#5a1d29");
      const s = ISO.toScreen(p.x + 0.5, p.y + 0.4);
      c.fillStyle = "rgba(200,230,255,0.25)"; c.fillRect(s.x - 8, s.y - 46, 12, 26);
      for (let r = 0; r < 3; r++) for (let i = 0; i < 3; i++) {
        c.fillStyle = ["#ffd166", "#57d8ff", "#7ae582"][(r + i) % 3];
        c.fillRect(s.x - 6 + i * 4, s.y - 43 + r * 8, 2.5, 4);
      }
      Renderer.glowDot(c, s.x, s.y - 30, 16, "rgba(255,120,140,0.12)");
    },
    watercooler(c, p, t) {
      Renderer.cuboid(c, p.x + 0.25, p.y + 0.25, 0, 0.5, 0.5, 24, "#c9d2e0", "#a5b0c2", "#8f9aad");
      const s = ISO.toScreen(p.x + 0.5, p.y + 0.5);
      c.fillStyle = "rgba(120,190,240,0.55)";
      c.beginPath(); c.ellipse(s.x, s.y - 32, 6, 7, 0, 0, Math.PI * 2); c.fill();
    },
    execdesk(c, p, t) {
      const fw = p.fw || 3;
      Renderer.cuboid(c, p.x, p.y, 0, fw, 1.2, 24, "#3d3226", "#2e261d", "#251f17");
      Renderer.cuboid(c, p.x, p.y, 24, fw, 1.2, 3, "#5a4a38", "#453828", "#382c20");
      const s = ISO.toScreen(p.x + fw / 2, p.y + 0.6);
      // dual monitors
      for (const dx of [-16, 12]) {
        c.fillStyle = "#14161c"; c.fillRect(s.x + dx - 10, s.y - 52, 22, 14);
        c.fillStyle = "#0f1116"; c.fillRect(s.x + dx, s.y - 38, 3, 5);
        c.fillStyle = dx < 0 ? "#1e2a3f" : "#16211a";
        c.fillRect(s.x + dx - 8.6, s.y - 50.6, 19, 11);
        c.fillStyle = dx < 0 ? "#57d8ff" : "#4ade80";
        c.font = "700 5px monospace"; c.textAlign = "left";
        for (let l = 0; l < 4; l++) {
          const w = 4 + ((Math.sin(t * 0.8 + l * 7 + dx) + 1) * 6);
          c.fillRect(s.x + dx - 7, s.y - 49 + l * 2.6, w, 1.2);
        }
      }
      // keyboard + mug
      c.fillStyle = "#20242e"; c.fillRect(s.x - 8, s.y - 33, 16, 5);
      c.fillStyle = "#e8e4da"; c.fillRect(s.x + 14, s.y - 34, 5, 6);
      Renderer.glowDot(c, s.x, s.y - 45, 34, "rgba(120,190,255,0.08)");
    },
    lamp(c, p, t) {
      const s = ISO.toScreen(p.x + 0.5, p.y + 0.5);
      c.strokeStyle = "#8a8272"; c.lineWidth = 2;
      c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(s.x, s.y - 44); c.stroke();
      c.fillStyle = "#e8ddc0";
      c.beginPath(); c.moveTo(s.x - 8, s.y - 44); c.lineTo(s.x + 8, s.y - 44); c.lineTo(s.x + 5, s.y - 54); c.lineTo(s.x - 5, s.y - 54); c.closePath(); c.fill();
      Renderer.glowDot(c, s.x, s.y - 38, 30, "rgba(255,214,130,0.14)");
    },
    emergencybtn(c, p, t) {
      Renderer.cuboid(c, p.x + 0.3, p.y + 0.3, 0, 0.4, 0.4, 30, "#3a4152", "#2b3040", "#232836");
      const s = ISO.toScreen(p.x + 0.5, p.y + 0.5);
      const pulse = 0.6 + Math.sin(t * 3) * 0.3;
      c.fillStyle = "#c0392b";
      c.beginPath(); c.arc(s.x, s.y - 34, 5, 0, Math.PI * 2); c.fill();
      Renderer.glowDot(c, s.x, s.y - 34, 14, `rgba(255,80,60,${pulse * 0.4})`);
      c.font = "600 7px 'Outfit',sans-serif"; c.textAlign = "center";
      c.fillStyle = "rgba(255,255,255,0.6)"; c.fillText("EMERGENCY", s.x, s.y - 44);
    },
    portalbtn(c, p, t) {
      Renderer.cuboid(c, p.x + 0.25, p.y + 0.25, 0, 0.5, 0.5, 16, "#2d2443", "#241e33", "#1d1829");
      const s = ISO.toScreen(p.x + 0.5, p.y + 0.5);
      const pulse = 0.5 + Math.sin(t * 5) * 0.4;
      c.fillStyle = `rgba(168,85,247,${pulse})`;
      c.beginPath(); c.arc(s.x, s.y - 20, 6, 0, Math.PI * 2); c.fill();
      Renderer.glowDot(c, s.x, s.y - 20, 20, "rgba(168,85,247,0.3)");
      c.font = "600 7px 'Outfit',sans-serif"; c.textAlign = "center";
      c.fillStyle = "rgba(220,180,255,0.8)"; c.fillText("???", s.x, s.y - 32);
    },
    portal(c, p, t) {
      const s = ISO.toScreen(p.x + 0.5, p.y + 0.5);
      c.save();
      for (let i = 0; i < 3; i++) {
        const r = 18 + i * 7 + Math.sin(t * 3 + i) * 3;
        c.strokeStyle = `rgba(${i % 2 ? "168,85,247" : "255,140,60"},${0.7 - i * 0.18})`;
        c.lineWidth = 3 - i * 0.7;
        c.beginPath(); c.ellipse(s.x, s.y - 30, r * 0.55, r, 0, 0, Math.PI * 2); c.stroke();
      }
      Renderer.glowDot(c, s.x, s.y - 30, 34, "rgba(168,85,247,0.3)");
      c.restore();
    },
    stovepot(c, p, t) { // dungeon cauldron of bugs
      Renderer.cuboid(c, p.x + 0.15, p.y + 0.15, 0, 0.7, 0.7, 14, "#1d1829", "#141019", "#100d14");
      const s = ISO.toScreen(p.x + 0.5, p.y + 0.5);
      c.fillStyle = "#4ade80";
      c.beginPath(); c.ellipse(s.x, s.y - 16, 10, 4, 0, 0, Math.PI * 2); c.fill();
      for (let i = 0; i < 3; i++) {
        const by = (t * 20 + i * 11) % 26;
        c.fillStyle = `rgba(122,229,130,${0.5 * (1 - by / 26)})`;
        c.beginPath(); c.arc(s.x + Math.sin(i * 5 + t) * 5, s.y - 18 - by, 2.4, 0, Math.PI * 2); c.fill();
      }
    },
    shrine(c, p, t) {
      Renderer.cuboid(c, p.x, p.y, 0, 1.2, 0.6, 30, "#2e2138", "#241a2e", "#1d1526");
      const s = ISO.toScreen(p.x + 0.6, p.y + 0.3);
      c.fillStyle = "#f2740d";
      c.font = "800 14px 'Outfit',sans-serif"; c.textAlign = "center";
      c.fillText("SO", s.x, s.y - 40);
      Renderer.glowDot(c, s.x, s.y - 42, 22, "rgba(242,116,13,0.3)");
      c.font = "500 7px 'Outfit',sans-serif"; c.fillStyle = "rgba(255,255,255,0.6)";
      c.fillText("closed as duplicate", s.x, s.y - 28);
    },
    sign(c, p, t) {
      const s = ISO.toScreen(p.x + (p.fw || 1) / 2, p.y + 0.5);
      c.font = `800 ${p.size || 11}px 'Outfit',sans-serif`; c.textAlign = "center";
      c.fillStyle = p.color || "rgba(255,255,255,0.85)";
      c.fillText(p.text || "", s.x, s.y - (p.h || 40));
      if (p.glow) Renderer.glowDot(c, s.x, s.y - (p.h || 40) - 4, 40, p.glow);
    },
    doors(c, p, t) { // sliding lobby doors (plaza)
      const s = ISO.toScreen(p.x + 1.5, p.y + 0.5);
      const open = p.openAmt || 0;
      Renderer.cuboid(c, p.x, p.y, 0, 3, 0.4, ISO.WALL, "rgba(150,200,255,0.16)", "rgba(120,170,230,0.14)", "rgba(100,150,210,0.16)");
      c.fillStyle = "rgba(190,225,255,0.3)";
      const A = ISO.toScreen(p.x + 0.1, p.y + 0.2), B = ISO.toScreen(p.x + 2.9, p.y + 0.2);
      const midX = (A.x + B.x) / 2, midY = (A.y + B.y) / 2;
      const dw = (midX - A.x) * (1 - open);
      c.fillRect(midX - dw, midY - 54, dw, 50);
      c.fillRect(midX, midY - 54, dw, 50);
      c.strokeStyle = "rgba(255,255,255,0.4)"; c.lineWidth = 1;
      c.strokeRect(midX - dw, midY - 54, dw, 50); c.strokeRect(midX, midY - 54, dw, 50);
      Renderer.glowDot(c, midX, midY - 60, 20, "rgba(80,220,190,0.25)");
    },
    crate(c, p) { // fallback + docker containers
      Renderer.cuboid(c, p.x + 0.1, p.y + 0.1, p.z || 0, (p.fw || 1) - 0.2, (p.fh || 1) - 0.2, p.hh || 22,
        p.color || "#3d6ea5", Renderer.shade(p.color || "#3d6ea5", -20), Renderer.shade(p.color || "#3d6ea5", -34));
      if (p.text) {
        const s = ISO.toScreen(p.x + (p.fw || 1) / 2, p.y + (p.fh || 1) / 2);
        c.font = "700 8px 'Outfit',sans-serif"; c.textAlign = "center";
        c.fillStyle = "rgba(255,255,255,0.75)"; c.fillText(p.text, s.x, s.y - (p.z || 0) - (p.hh || 22) - 4);
      }
    },
  },

  shade(hex, amt) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
    const n = parseInt(hex.slice(1), 16);
    const r = U.clamp(((n >> 16) & 255) + amt, 0, 255), g = U.clamp(((n >> 8) & 255) + amt, 0, 255), b = U.clamp((n & 255) + amt, 0, 255);
    return `rgb(${r},${g},${b})`;
  },

  /* ---------- main frame ---------- */
  frame(dt) {
    const cv = Renderer.canvas, c = Renderer.ctx;
    const D = Renderer.dpr || 1;
    if (!Game.floor) { c.fillStyle = "#05070d"; c.fillRect(0, 0, cv.width, cv.height); return; }
    const floor = Game.floor;
    const pal = Renderer.PAL[floor.idx] || Renderer.PAL[0];
    const t = Game.time;

    c.setTransform(1, 0, 0, 1, 0, 0);

    // ----- sky -----
    const g = c.createLinearGradient(0, 0, 0, cv.height);
    g.addColorStop(0, pal.sky[0]); g.addColorStop(0.55, pal.sky[1]); g.addColorStop(1, pal.sky[2]);
    c.fillStyle = g; c.fillRect(0, 0, cv.width, cv.height);

    // stars
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 137.5) % 1) * cv.width, sy = ((i * 61.8) % 1) * cv.height * 0.4;
      c.fillStyle = `rgba(255,255,255,${0.15 + 0.25 * Math.abs(Math.sin(t * 0.5 + i))})`;
      c.fillRect((sx + i * 53) % cv.width, sy, 1.5, 1.5);
    }
    // moon
    Renderer.glowDot(c, cv.width * 0.82, cv.height * 0.12, 50 * D, "rgba(220,230,255,0.18)");
    c.fillStyle = "rgba(230,238,255,0.85)";
    c.beginPath(); c.arc(cv.width * 0.82, cv.height * 0.12, 16 * D, 0, Math.PI * 2); c.fill();
    c.fillStyle = pal.sky[0];
    c.beginPath(); c.arc(cv.width * 0.82 + 6 * D, cv.height * 0.12 - 3 * D, 13 * D, 0, Math.PI * 2); c.fill();

    // skyline (parallax)
    const camIso = ISO.toScreen(Camera.x, Camera.y);
    const horizonY = cv.height * (pal.horizon - (typeof floor.idx === "number" ? floor.idx * 0.012 : 0));
    const drawLayer = (img, para, yOff, alpha) => {
      c.globalAlpha = alpha;
      const iw = img.width * D, ih = img.height * D;
      let px = (-camIso.x * para * D) % iw; if (px > 0) px -= iw;
      for (let x = px; x < cv.width; x += iw) c.drawImage(img, x, horizonY - ih + yOff * D, iw, ih);
      c.globalAlpha = 1;
    };
    drawLayer(Renderer.sky2, 0.05, 40, 0.7);
    drawLayer(Renderer.sky1, 0.12, 70, 0.95);
    // city glow at horizon
    const hg = c.createLinearGradient(0, horizonY - 60, 0, horizonY + 60);
    hg.addColorStop(0, "rgba(255,150,80,0)"); hg.addColorStop(1, "rgba(255,150,80,0.08)");
    c.fillStyle = hg; c.fillRect(0, horizonY - 60, cv.width, 120);

    // flying cars
    for (const car of Renderer.cars) {
      car.x += car.v * dt;
      if (car.x > 1.15) car.x = -0.15; if (car.x < -0.15) car.x = 1.15;
      const cx = car.x * cv.width, cy = car.y * cv.height;
      c.strokeStyle = "rgba(255,255,255,0.1)"; c.lineWidth = 1;
      c.beginPath(); c.moveTo(cx - car.v * 500, cy); c.lineTo(cx, cy); c.stroke();
      c.fillStyle = car.c; c.fillRect(cx - 2, cy - 1, 5, 2.4);
      Renderer.glowDot(c, cx, cy, 7, car.c === "#ff5f45" ? "rgba(255,95,69,0.4)" : "rgba(120,210,255,0.4)");
    }

    // rain (behind building)
    if (pal.rain > 0) Renderer.drawRain(c, cv, dt, pal.rain, 0.5);

    // ----- world -----
    Camera.apply(c, cv);
    // plate
    c.drawImage(floor.plate, -floor.plateOff.x, -floor.plateOff.y);

    // gather entities
    const ents = [];
    for (const w of floor.wallTiles) ents.push({ key: w.x + w.y, draw: () => Renderer.props.wallblock(c, w), wall: w });
    for (const p of floor.props) {
      const key = p.x + (p.fw || 1) / 2 + p.y + (p.fh || 1) / 2 + (p.flat ? -500 : 0) + (p.bias || 0);
      ents.push({ key, draw: () => (Renderer.props[p.type] || Renderer.props.crate)(c, p, t) });
    }
    for (const n of Game.npcs) ents.push({ key: n.x + n.y + 0.5, draw: () => Renderer.drawPerson(c, n) });
    ents.push({ key: Game.player.x + Game.player.y + 0.5, draw: () => Renderer.drawPerson(c, Game.player) });
    if (Game.floorIndex !== "P" || Game.flags.enteredBuilding) ents.push({ key: Game.guide.x + Game.guide.y + 0.5, draw: () => Renderer.drawPerson(c, Game.guide) });
    ents.sort((a, b) => a.key - b.key);

    const pkey = Game.player.x + Game.player.y;
    const ps = ISO.toScreen(Game.player.x, Game.player.y);
    for (const e of ents) {
      if (e.wall && e.key > pkey + 0.6) {
        const ws = ISO.toScreen(e.wall.x, e.wall.y);
        if (Math.abs(ws.x - ps.x) < 120 && ws.y - ps.y > -10 && ws.y - ps.y < 150) {
          c.globalAlpha = 0.32; e.draw(); c.globalAlpha = 1; continue;
        }
      }
      e.draw();
    }

    // exhibits (holographic overlays)
    Exhibits.drawAll(c, t);

    // particles
    for (const p of Game.particles) {
      const s = ISO.toScreen(p.x, p.y);
      const a = Math.max(0, p.life / p.maxLife);
      if (p.type === "confetti") {
        c.save(); c.translate(s.x, s.y - p.z); c.rotate(p.life * 7);
        c.globalAlpha = a; c.fillStyle = p.color;
        c.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        c.restore(); c.globalAlpha = 1;
      } else if (p.type === "glow") {
        Renderer.glowDot(c, s.x, s.y - p.z, p.size * 3, p.color, a * 0.8);
        c.globalAlpha = a; c.fillStyle = p.color2 || "#fff";
        c.fillRect(s.x - 1, s.y - p.z - 1, 2, 2); c.globalAlpha = 1;
      } else if (p.type === "steam") {
        c.globalAlpha = a * 0.25; c.fillStyle = "#fff";
        c.beginPath(); c.arc(s.x, s.y - p.z, p.size * (1.4 - a * 0.5), 0, Math.PI * 2); c.fill();
        c.globalAlpha = 1;
      }
    }

    // interactable markers
    for (const it of floor.interact) {
      const d = U.dist(Game.player.x, Game.player.y, it.x, it.y);
      if (d < 6) {
        const s = ISO.toScreen(it.x, it.y);
        const pulse = 0.5 + Math.sin(t * 4) * 0.3;
        const near = d < it.r;
        c.strokeStyle = near ? `rgba(80,220,190,${pulse})` : "rgba(255,255,255,0.25)";
        c.lineWidth = 1.6;
        c.beginPath(); c.ellipse(s.x, s.y, 14 + pulse * 3, 7 + pulse * 1.5, 0, 0, Math.PI * 2); c.stroke();
        if (near) {
          c.fillStyle = "rgba(80,220,190,0.95)";
          c.font = "800 11px 'Outfit',sans-serif"; c.textAlign = "center";
          c.fillText("E", s.x, s.y - (it.markerH === undefined ? 52 : it.markerH) + Math.sin(t * 3) * 3);
        }
      }
    }

    // room labels
    c.font = "700 10px 'Outfit',sans-serif"; c.textAlign = "center";
    for (const r of floor.rooms) {
      const s = ISO.toScreen(r.x + r.w / 2, r.y + r.h / 2);
      c.fillStyle = Game.currentRoom === r.id ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.13)";
      c.fillText(r.name.toUpperCase(), s.x, s.y - 86);
    }

    // click target marker
    if (Game.player.clickMark && Game.player.clickMark.t > 0) {
      const m = Game.player.clickMark;
      const s = ISO.toScreen(m.x, m.y);
      c.strokeStyle = `rgba(87,216,255,${m.t})`;
      c.lineWidth = 2;
      c.beginPath(); c.ellipse(s.x, s.y, 12 * (1.6 - m.t), 6 * (1.6 - m.t), 0, 0, Math.PI * 2); c.stroke();
      m.t -= dt * 1.6;
    }

    // ----- screen space -----
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (pal.rain > 0 && (floor.idx === "P")) Renderer.drawRain(c, cv, dt, pal.rain, 1);

    // vignette
    const vg = c.createRadialGradient(cv.width / 2, cv.height / 2, cv.height * 0.35, cv.width / 2, cv.height / 2, cv.height * 0.85);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.45)");
    c.fillStyle = vg; c.fillRect(0, 0, cv.width, cv.height);

    // retro post-process
    if (Game.flags.retro) {
      const lw = Math.floor(cv.width / 5), lh = Math.floor(cv.height / 5);
      Renderer.lowCanvas.width = lw; Renderer.lowCanvas.height = lh;
      const lc = Renderer.lowCanvas.getContext("2d");
      lc.imageSmoothingEnabled = true;
      lc.drawImage(cv, 0, 0, lw, lh);
      c.imageSmoothingEnabled = false;
      c.drawImage(Renderer.lowCanvas, 0, 0, lw, lh, 0, 0, cv.width, cv.height);
      c.imageSmoothingEnabled = true;
      // scanlines
      c.fillStyle = "rgba(0,0,0,0.18)";
      for (let y = 0; y < cv.height; y += 4) c.fillRect(0, y, cv.width, 1.4);
    }
  },

  drawRain(c, cv, dt, intensity, alphaMul) {
    const D = Renderer.dpr || 1;
    c.strokeStyle = `rgba(160,200,255,${0.28 * alphaMul})`;
    c.lineWidth = D;
    c.beginPath();
    const n = Math.floor(Renderer.rainDrops.length * intensity);
    for (let i = 0; i < n; i++) {
      const d = Renderer.rainDrops[i];
      d.y += d.s * dt * 1.4;
      if (d.y > 1) { d.y = -0.05; d.x = Math.random(); }
      const x = d.x * cv.width, y = d.y * cv.height;
      c.moveTo(x, y); c.lineTo(x - 3 * d.s * D, y + 14 * d.s * D);
    }
    c.stroke();
  },
};
