/* ============================================================
   SPARSH HQ v4 — floors4.js
   The consolidated building. Experience gets its own open floor
   (career walls + the systems I built + the stack), and the
   reading list moves into the Hogwarts library.
   ============================================================ */

/* ---------- canvas helpers for big, readable in-world type ---------- */
const Type = {
  /* word-wrap with **bold** runs; returns the y after the last line */
  rich(c, text, x, y, maxW, size, lh, colReg, colBold, maxLines = 99, font = Kit.FONT) {
    const runs = [];
    String(text).split(/(\*\*[^*]+\*\*)/).forEach((part) => {
      if (!part) return;
      const bold = part.startsWith("**");
      for (const w of part.replace(/\*\*/g, "").split(/(\s+)/)) if (w) runs.push({ w, bold });
    });
    const fontOf = (b) => `${b ? 750 : 450} ${size}px ${font}`;
    let line = [], lineW = 0, n = 0;
    const flush = () => {
      let cx = x;
      for (const r of line) { c.font = fontOf(r.bold); c.fillStyle = r.bold ? colBold : colReg; c.fillText(r.w, cx, y + n * lh); cx += c.measureText(r.w).width; }
      line = []; lineW = 0; n++;
    };
    for (const r of runs) {
      c.font = fontOf(r.bold);
      const ww = c.measureText(r.w).width;
      if (/^\s+$/.test(r.w) && !line.length) continue;
      if (lineW + ww > maxW && line.length && !/^\s+$/.test(r.w)) { if (n >= maxLines - 1) { flush(); return y + n * lh; } flush(); }
      if (/^\s+$/.test(r.w) && !line.length) continue;
      line.push(r); lineW += ww;
    }
    if (line.length) flush();
    return y + n * lh;
  },
  fit(c, text, weight, size, maxW, font = Kit.FONT) {
    let fs = size; c.font = `${weight} ${fs}px ${font}`;
    while (c.measureText(text).width > maxW && fs > 8) { fs *= 0.94; c.font = `${weight} ${fs}px ${font}`; }
    return fs;
  },
  rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); },
  hex: (n) => "#" + n.toString(16).padStart(6, "0"),
};

/* a backlit career lightbox: company, role, dates, numbers and the evidence — readable from across the room */
function careerPanel(F, cs, x, y, z, ry, w, h) {
  const nx = Math.sin(ry), nz = Math.cos(ry);
  const col = Type.hex(cs.accent);
  const frame = Kit.M(0x0c0e13, { rough: 0.35, metal: 0.6 });
  Kit.B(F.group, w + 0.24, h + 0.24, 0.12, frame, x - nx * 0.06, y, z - nz * 0.06, { ry, r: 0.03 });
  Kit.B(F.group, w + 0.24, 0.05, 0.14, Kit.G(cs.accent, 2.2), x - nx * 0.04, y - h / 2 - 0.12, z - nz * 0.04, { ry, r: 0.02, cast: false });
  Kit.screen(F, w, h, (c, cw, ch) => {
    const g = c.createLinearGradient(0, 0, 0, ch); g.addColorStop(0, "#0d1420"); g.addColorStop(1, "#070a10");
    c.fillStyle = g; c.fillRect(0, 0, cw, ch);
    c.fillStyle = col; c.fillRect(0, 0, cw, ch * 0.012);
    const pad = ch * 0.075, inner = cw - pad * 2;
    c.textBaseline = "alphabetic"; c.textAlign = "left";
    // kicker + status
    c.font = `800 ${ch * 0.046}px ${Kit.FONT}`; c.fillStyle = col;
    c.fillText(`${cs.no.replace(/ — .*/, "")}  ·  ${cs.dates.toUpperCase()}`, pad, ch * 0.11);
    const st = cs.chip || (cs.no.includes("OPEN") ? "CURRENT ROLE" : "CLOSED · SHIPPED");
    c.font = `800 ${ch * 0.04}px ${Kit.FONT}`;
    const sw = c.measureText(st).width + ch * 0.06;
    Type.rr(c, cw - pad - sw, ch * 0.06, sw, ch * 0.07, ch * 0.02);
    c.fillStyle = cs.no.includes("OPEN") ? col : "rgba(255,255,255,0.08)"; c.fill();
    c.fillStyle = cs.no.includes("OPEN") ? "#06121e" : "rgba(232,236,244,0.75)"; c.fillText(st, cw - pad - sw + ch * 0.03, ch * 0.11);
    // company + role
    const company = cs.title.replace(/\b\w+/g, (s) => s[0] + s.slice(1).toLowerCase());
    Type.fit(c, company, 800, ch * 0.14, inner * 0.7); c.fillStyle = "#ffffff";
    c.fillText(company, pad, ch * 0.255);
    c.font = `600 ${ch * 0.058}px ${Kit.FONT}`; c.fillStyle = "rgba(232,236,244,0.86)";
    c.fillText(cs.role, pad, ch * 0.335);
    // numbers
    let yb = ch * 0.355;
    const ms = (cs.metrics || []).slice(0, 4);
    if (ms.length) {
      const gap = ch * 0.03, bw = (inner - gap * (ms.length - 1)) / ms.length, bh = ch * 0.14;
      ms.forEach((m, i) => {
        const bx = pad + i * (bw + gap);
        Type.rr(c, bx, yb, bw, bh, ch * 0.02); c.fillStyle = "rgba(255,255,255,0.05)"; c.fill();
        c.strokeStyle = col + "77"; c.lineWidth = 2; c.stroke();
        Type.fit(c, m.v, 800, ch * 0.075, bw - ch * 0.06); c.fillStyle = col; c.fillText(m.v, bx + ch * 0.03, yb + bh * 0.52);
        c.font = `500 ${ch * 0.034}px ${Kit.FONT}`; c.fillStyle = "rgba(232,236,244,0.72)"; c.fillText(m.l, bx + ch * 0.03, yb + bh * 0.84);
      });
      yb += bh + ch * 0.05;
    } else yb += ch * 0.02;
    // the evidence — two columns when there's a lot of it
    const list = cs.wall || cs.bullets, cols = list.length > 3 ? 2 : 1;
    const fs = ch * (cols > 1 ? 0.04 : 0.046), lh = fs * 1.38, gapC = ch * 0.06;
    const colW = (inner - gapC * (cols - 1)) / cols, per = Math.ceil(list.length / cols);
    yb += fs * 0.6;
    for (let k = 0; k < cols; k++) {
      let yy = yb;
      const x0 = pad + k * (colW + gapC);
      for (const b of list.slice(k * per, (k + 1) * per)) {
        if (yy > ch * 0.92) break;
        c.fillStyle = col; c.beginPath(); c.arc(x0 + fs * 0.3, yy - fs * 0.33, fs * 0.2, 0, Math.PI * 2); c.fill();
        yy = Type.rich(c, b, x0 + fs * 0.9, yy, colW - fs * 0.9, fs, lh, "rgba(232,236,244,0.84)", "#ffffff", 2) + fs * 0.5;
      }
    }
    c.font = `700 ${ch * 0.034}px ${Kit.FONT}`; c.fillStyle = col;
    c.fillText("▸  CLICK FOR THE FULL CASE FILE", pad, ch * 0.965);
  }, x, y, z, ry, { fps: 0, px: Math.round(200 * w), glow: 1.0 });
  Kit.light(F, x + nx * 1.6, y + 1.2, z + nz * 1.6, 0xdfe9ff, 1.1, 6.5);
  Kit.hot(F, { x: x + nx * 1.5, z: z + nz * 1.5, y: y + h / 2 - 0.35, r: 2.8, label: `${cs.title.replace(/\b\w+/g, (s) => s[0] + s.slice(1).toLowerCase())} — ${cs.role}`, ref: cs, focus: { x, y, z }, fn: () => { AudioSys.sfx("open"); UI.panel(cs); } });
}

/* one tile of the stack wall */
function stackTile(F, sk, x, y, z, ry, w, h) {
  const nx = Math.sin(ry), nz = Math.cos(ry), col = Type.hex(sk.accent);
  const used = (sk.usedIn || []).map((id) => (CONTENT.labs.find((l) => l.id === id) || CONTENT.projects.find((p) => p.id === id) || {}).name).filter(Boolean);
  Kit.screen(F, w, h, (c, cw, ch) => {
    c.fillStyle = "#0b0f16"; c.fillRect(0, 0, cw, ch);
    c.fillStyle = col; c.fillRect(0, 0, cw, ch * 0.012);
    const pad = cw * 0.08, inner = cw - pad * 2;
    c.textAlign = "left"; c.textBaseline = "alphabetic";
    c.font = `800 ${cw * 0.05}px ${Kit.FONT}`; c.fillStyle = col; c.fillText(sk.level.toUpperCase(), pad, ch * 0.075);
    Type.fit(c, sk.name, 800, cw * 0.11, inner); c.fillStyle = "#fff"; c.fillText(sk.name, pad, ch * 0.15);
    let yy = Type.rich(c, sk.tagline, pad, ch * 0.215, inner, cw * 0.055, cw * 0.075, "rgba(232,236,244,0.85)", "#fff", 3) + cw * 0.04;
    for (const p of sk.points.slice(0, 4)) {
      if (yy > ch * 0.74) break;
      c.fillStyle = col; c.fillRect(pad, yy - cw * 0.03, cw * 0.022, cw * 0.022);
      yy = Type.rich(c, p, pad + cw * 0.05, yy, inner - cw * 0.05, cw * 0.047, cw * 0.064, "rgba(232,236,244,0.78)", "#fff", 2) + cw * 0.03;
    }
    if (used.length) {
      c.font = `800 ${cw * 0.042}px ${Kit.FONT}`; c.fillStyle = "rgba(232,236,244,0.5)"; c.fillText("SHIPPED IN", pad, ch * 0.83);
      Type.rich(c, used.join(" · "), pad, ch * 0.875, inner, cw * 0.046, cw * 0.062, col, col, 2);
    }
  }, x, y, z, ry, { fps: 0, px: 420, glow: 1.0 });
  Kit.hot(F, { x: x + nx * 1.3, z: z + nz * 1.3, y: y + h / 2 + 0.25, r: 1.6, label: `${sk.name} — where I've used it`, ref: sk, focus: { x, y, z }, fn: () => { AudioSys.sfx("open"); UI.panel(sk); } });
}

/* ============================================================
   F1 — EXPERIENCE · "The Career" (Avengers-Tower engineering)
   North wall: three backlit career panels on a floor timeline.
   South wall: six open bays — the systems I built at Pocketpills.
   East: the stack wall. Middle: an open atrium (camera-friendly).
   ============================================================ */
Floors.fx = function (F) {
  const dark = Look.mat("acoustic", 0x2b313c, { tile: 1.6 });
  shell(F, {
    w: 34, d: 24, h: 4.8, elevZ: 0,
    floor: Look.mat("terrazzo", 0xa9adb5, { tile: 3, rough: 0.32, env: 0.9, chips: ["#e4e2dc", "#7c8696", "#3e4858", "#9aa6b6", "#262c38"] }),
    wall: Look.mat("plaster", 0xc9ced6, { tile: 2 }),
    skirt: Kit.M(0x22262e, { rough: 0.4 }),
    ceil: Kit.M(0xeef0f3, { rough: 0.95 }),
    sides: { n: { type: "wall", mat: dark }, s: { type: "wall", mat: dark }, e: "glass", w: "wall" },
    theme: { wood: 0xc9a77a, carpet: 0x34445a, metal: 0xc0c7d2 },
    panelColor: 0xeef4ff, pcols: 6, prows: 4,
    mood: {
      exposure: 0.84, hemi: [0xdfe8ff, 0x3a3e48, 0.75], key: [0xfff0dc, 1.7, [0.5, 1, 0.3]], fill: [0x9fb8ff, 0.4],
      env: 0.55, fog: [0x141a26, 60, 220], bloom: [0.24, 0.5, 1.05], ao: 1.0,
      grade: { tint: [0.99, 1.0, 1.04], shadow: [0.03, 0.06, 0.15], high: [0.2, 0.15, 0.08], vig: 0.34, sat: 1.05 },
    },
  });
  // arrive looking up-room toward the career wall
  F.elevator.spawn.ry = Math.PI - 0.35; F.spawn = F.elevator.spawn; F.yawOffset = 0.15;

  // ---- the atrium runway ----
  Kit.rug(F, 0.5, 0, 29, 2.6, 0, { kind: "stripe", colors: [0x232c3a, 0x57d8ff, 0x2e3a4c] });
  Kit.neon(F, "EXPERIENCE", 0x57d8ff, -16.84, 3.75, -4.6, HP, { size: 0.34, glow: 1.9 });
  Kit.textPoster(F, ["2022 → NOW", "three companies · six systems · one stack"], 3.2, 0.8, -16.86, 2.85, -4.6, HP, { color: "#bfe8ff", bg: "#0b1420", decor: false });

  // ---- NORTH: the career, left to right in time ----
  const C = CONTENT.cases;
  const byId = (id) => C.find((c) => c.id === id);
  careerPanel(F, byId("xtreme"), -11.3, 2.3, -11.86, 0, 7.0, 3.3);
  careerPanel(F, byId("pocketpills"), 0, 2.3, -11.86, 0, 9.8, 3.3);
  careerPanel(F, byId("sprinklr"), 11.3, 2.3, -11.86, 0, 7.0, 3.3);
  for (const x of [-5.65, 5.65]) Kit.plant(F, x, -11.1, { kind: x < 0 ? "fiddle" : "monstera", s: 1.25, pot: "concrete", interact: false });
  F.npcSpecs.push({ model: "character-female-b", x: -2.6, z: -10.0, ry: Math.PI, behavior: "idle", quotes: "dev", greeting: "Read the Pocketpills one. It's a lot of backend." });

  // ---- SOUTH: the systems I built — six open bays ----
  Kit.neon(F, "SYSTEMS I BUILT · POCKETPILLS", 0x4ade80, 0, 4.35, 11.86, Math.PI, { size: 0.3, glow: 1.7 });
  const bays = [-12.5, -7.5, -2.5, 2.5, 7.5, 12.5];
  CONTENT.labs.forEach((lab, i) => {
    const bx = bays[i];
    Kit.holoWall(F, lab, bx, 2.3, 11.86, Math.PI, { w: 3.7, h: 2.15, fps: 3, px: 840 });
    Kit.textPoster(F, [`${lab.code} · ${lab.short}`], 2.6, 0.4, bx, 3.75, 11.88, Math.PI, { fs: 40, color: Type.hex(lab.accent), bg: "#0b1018", borderCol: Type.hex(lab.accent) + "88", decor: false });
    Kit.floorPlane(F, bx, 9.9, 4.6, 4.2, Look.mat("fabric", 0x26303f, { tile: 1.2 }), 0.008);
  });
  for (const x of [-10, -5, 0, 5, 10]) Props.rail(F, x, 8.1, x, 11.9, 1.1);
  // a prop per system, so each bay reads at a glance
  P(F, "bedSingle", -14.0, 9.4, HP, { tint: { wood: 0xd8dde4, carpet: 0x8fd0c0, carpetWhite: 0xffffff } });
  F.npcSpecs.push({ model: "character-female-f", x: -11.4, z: 9.0, ry: 2.6, behavior: "idle", hold: "files", quotes: "dev", greeting: "The AI suggested the right dosage again." });
  Props.treeSculpture(F, -7.5, 9.3);
  ws(F, -2.5, 9.3, Math.PI, { monitors: 2, screens: ["chart", "dash"], npc: { quotes: "dev" } });
  P(F, "loungeDesignSofa", 2.5, 8.8, 0, { tint: { carpet: 0x3a4a5e, metal: 0x2a2e36 } });
  Props.container(F, 5.85, 0, 9.9, HP, 0x2f6e9c, "S3");
  Props.container(F, 9.15, 0, 9.9, HP, 0x8c5a2e, "CENSUS");
  for (const rx of [11.0, 14.0]) Kit.serverRack(F, rx, 10.4, Math.PI, { alert: rx > 12 });
  F.npcSpecs.push({ model: "character-male-b", x: 12.5, z: 8.8, ry: Math.PI, behavior: "idle", hold: "laptop", quotes: "dev", greeting: "Camunda says the workflow is green." });

  // ---- EAST: the stack wall ----
  const sw = Kit.grp(F, 13.2, 0, -HP);
  Kit.B(sw, 9.6, 3.6, 0.3, Kit.M(0x161a22, { rough: 0.5, metal: 0.3 }), 0, 1.8, 0, { r: 0.04 });
  Kit.B(sw, 9.7, 0.06, 0.34, Kit.G(0xffd166, 1.8), 0, 3.62, 0, { r: 0.02, cast: false });
  Kit.colLocal(F, sw, 0, 0, 9.6, 0.5);
  Kit.camWall(F, 13.2, -4.8, 13.2, 4.8, 0, 3.7);
  Kit.neon(F, "THE STACK I SHIP WITH", 0xffd166, 13.03, 4.05, 0, -HP, { size: 0.26, glow: 1.7 });
  CONTENT.skills.forEach((sk, i) => stackTile(F, sk, 13.03, 1.85, -3.95 + i * 1.58, -HP, 1.42, 2.7));
  Kit.light(F, 10.6, 3.2, -2.2, 0xfff0d8, 1.0, 6);
  Kit.light(F, 10.6, 3.2, 2.2, 0xfff0d8, 1.0, 6);
  for (const z of [-6.2, 6.2]) Kit.plant(F, 15.6, z, { kind: "palm", s: 1.3, pot: "white", interact: false });
  P(F, "loungeChair", 15.2, -2.0, -HP + 0.3, { tint: { carpet: 0x34445a } });
  P(F, "loungeChair", 15.2, 2.0, -HP - 0.3, { tint: { carpet: 0x34445a } });

  // ---- WEST: coffee + a place to sit ----
  Kit.coffeeBar(F, -16.25, 6.2, HP, { w: 3.4, machine: 0x2a2e36, top: Look.mat("terrazzo", 0xeceef0, { tile: 1.2, rough: 0.3 }) });
  F.npcSpecs.push({ model: "character-female-d", x: -14.9, z: 5.2, ry: -HP, behavior: "coffee", hold: "cup", quotes: "barista" });
  lounge(F, -9.5, 4.2, 0, { sofa: "loungeSofa", chair: "loungeChair", rugColors: [0x1e2838, 0x57d8ff, 0x2a3a50], theme: F.theme });
  Kit.plant(F, -16.2, -11.0, { kind: "snake", s: 1.2, pot: "black", interact: false });
  Kit.plant(F, -16.2, 10.9, { kind: "fern", s: 1.1, pot: "white", interact: false });
  for (const [x, z] of [[-6, -3.2], [6, -3.2], [-6, 3.4], [6, 3.4]]) Kit.pendant(F, x, z, { drop: 1.4, style: "cylinder", light: false, color: 0xeef4ff, shade: Kit.M(0x1d2230, { rough: 0.3, metal: 0.6 }) });

  // ---- life ----
  F.npcSpecs.push({ model: "character-male-a", x: -10, z: 0.5, behavior: "route", hold: "files", speed: 1.15, quotes: "dev", waypoints: [[-10, 0.5, 1], [9.5, 0.5, 2], [9.5, -0.6, 0], [-12, -0.6, 3]] });
};

/* ---------- F4 (the penthouse): arrive facing into the room, not out of the window ---------- */
extend("f7", (F) => {
  F.elevator.spawn = { x: -8.5, z: -5.0, ry: 1.07 };
  F.spawn = F.elevator.spawn; F.yawOffset = 0;
});
