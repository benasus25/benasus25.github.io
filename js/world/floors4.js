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
  Kit.B(F.group, w + 0.24, h + 0.24, 0.12, frame, x - nx * 0.075, y, z - nz * 0.075, { ry, r: 0.03 });
  Kit.B(F.group, w + 0.24, 0.05, 0.14, Kit.G(cs.accent, 2.2), x - nx * 0.05, y - h / 2 - 0.12, z - nz * 0.05, { ry, r: 0.02, cast: false });
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

/* ---------- F4 (the penthouse): arrive facing into the room, not out of the window ---------- */
extend("f7", (F) => {
  F.elevator.spawn = { x: -8.5, z: -5.0, ry: 1.07 };
  F.spawn = F.elevator.spawn; F.yawOffset = 0;
});
