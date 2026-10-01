/* ============================================================
   SPARSH HQ v3 — floors3.js
   Set-dressing pass: the details that make a floor feel lived
   in. Layered on top of the base floors without touching them.
   ============================================================ */

function extend(key, fn) {
  const base = Floors[key];
  Floors[key] = function (F) { base(F); fn(F); };
}

const Dress = {
  hazard(F, x, z, w, d) {
    const tex = Kit.canvasTex(512, 512, (c, cw, ch) => {
      c.clearRect(0, 0, cw, ch);
      const b = 26;
      c.save();
      c.beginPath(); c.rect(0, 0, cw, ch); c.rect(b, b, cw - 2 * b, ch - 2 * b); c.clip("evenodd");
      for (let i = -ch; i < cw + ch; i += 36) { c.fillStyle = "#f2c230"; c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 18, 0); c.lineTo(i + 18 - ch, ch); c.lineTo(i - ch, ch); c.fill(); }
      c.restore();
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.6, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.014, z); m.receiveShadow = true;
    F.group.add(m);
  },
  toolCart(F, x, z, ry, col = 0xb8302a) {
    const g = Kit.grp(F, x, z, ry);
    const m = Kit.M(col, { rough: 0.35, metal: 0.4 });
    Kit.B(g, 0.9, 0.9, 0.5, m, 0, 0.55, 0, { r: 0.03 });
    for (let i = 0; i < 4; i++) { Kit.B(g, 0.84, 0.18, 0.02, m, 0, 0.25 + i * 0.2, 0.26, { r: 0.01 }); Kit.B(g, 0.3, 0.025, 0.03, Kit.metal(0xc8ccd2), 0, 0.3 + i * 0.2, 0.28, { r: 0.008, cast: false }); }
    for (const [wx, wz] of [[-0.38, -0.2], [0.38, -0.2], [-0.38, 0.2], [0.38, 0.2]]) Kit.S(g, 0.05, Kit.M(0x1a1a1e), wx, 0.05, wz);
    Kit.B(g, 0.3, 0.04, 0.12, Kit.metal(0x8a9098), 0.2, 1.02, 0, { r: 0.01 });
    Kit.C(g, 0.02, 0.02, 0.28, Kit.M(0xd9a441), -0.2, 1.02, 0, { rz: Math.PI / 2, seg: 6 });
    Kit.colLocal(F, g, 0, 0, 1.0, 0.6);
  },
  barrel(F, x, z, col) {
    const g = Kit.grp(F, x, z, 0);
    Kit.C(g, 0.3, 0.3, 0.9, Kit.M(col, { rough: 0.45, metal: 0.35 }), 0, 0.45, 0, { seg: 20 });
    for (const y of [0.15, 0.45, 0.75]) Kit.T(g, 0.305, 0.018, Kit.metal(0x5a606a), 0, y, 0, { rx: Math.PI / 2, cast: false });
    Kit.collide(F, x, z, 0.65, 0.65);
  },
  lockers(F, x, z, ry, n = 4) {
    const g = Kit.grp(F, x, z, ry);
    const cols = [0x3a5a7a, 0x4a6a8a];
    for (let i = 0; i < n; i++) {
      const lx = (i - (n - 1) / 2) * 0.5;
      Kit.B(g, 0.48, 1.9, 0.5, Kit.M(cols[i % 2], { rough: 0.45, metal: 0.4 }), lx, 0.95, 0, { r: 0.015 });
      for (let v = 0; v < 3; v++) Kit.B(g, 0.26, 0.015, 0.01, Kit.M(0x1a2230), lx, 1.6 + v * 0.05, 0.255, { r: 0.004, cast: false });
      Kit.B(g, 0.03, 0.12, 0.03, Kit.metal(0xc8ccd2), lx + 0.16, 1.05, 0.26, { r: 0.01, cast: false });
    }
    Kit.colLocal(F, g, 0, 0, n * 0.5, 0.55);
  },
  crate(F, x, z, ry, s = 1, y = 0) {
    const g = Kit.grp(F, x, z, ry, y);
    const wm = Look.mat("wood", 0x9a7446, { tile: 1, rough: 0.8 });
    Kit.B(g, 0.8 * s, 0.7 * s, 0.8 * s, wm, 0, 0.35 * s, 0, { r: 0.02 });
    for (const sx of [-1, 1]) Kit.B(g, 0.06 * s, 0.72 * s, 0.82 * s, Kit.M(0x6a4a28, { rough: 0.8 }), sx * 0.38 * s, 0.35 * s, 0, { r: 0.01 });
    if (!y) Kit.colLocal(F, g, 0, 0, 0.85 * s, 0.85 * s);
  },
  luggageCart(F, x, z, ry) {
    const g = Kit.grp(F, x, z, ry);
    const gold = Kit.gold();
    Kit.B(g, 1.2, 0.08, 0.7, Look.mat("carpet", 0x6a1c28, { tile: 0.6 }), 0, 0.2, 0, { r: 0.02 });
    Kit.B(g, 1.24, 0.04, 0.74, gold, 0, 0.16, 0, { r: 0.02 });
    for (const s of [-1, 1]) {
      Kit.C(g, 0.025, 0.025, 1.6, gold, s * 0.58, 1.0, 0, { seg: 10 });
      for (const w of [-0.3, 0.3]) Kit.S(g, 0.07, Kit.M(0x1a1a1e), s * 0.5, 0.07, w);
    }
    const arch = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.025, 8, 24, Math.PI), gold);
    arch.position.y = 1.8; arch.castShadow = true; g.add(arch);
    const cases = [[0x2a4a6a, 0.7, 0.45, 0.28], [0xb8683a, 0.55, 0.38, 0.24], [0x3a2a1a, 0.5, 0.5, 0.22]];
    cases.forEach(([col, w, h, d], i) => {
      Kit.B(g, w, h, d, Kit.M(col, { rough: 0.5 }), -0.2 + i * 0.25, 0.24 + h / 2 + (i === 2 ? 0.45 : 0), -0.12 + (i % 2) * 0.22, { r: 0.04, ry: i * 0.3 });
    });
    Kit.colLocal(F, g, 0, 0, 1.3, 0.8);
    Kit.hot(F, { x, z: z + 0.9, y: 2.3, r: 1.7, label: "A luggage cart", fn: () => UI.say("Someone checked in for a very long stay. The tag says: ‘Senior Engineer — indefinite.’") });
  },
  keyRack(F, x, z, ry) {
    const g = Kit.grp(F, x, z, ry);
    Kit.B(g, 3.0, 2.3, 0.4, Kit.M(0x3a2416, { rough: 0.45 }), 0, 1.15, 0, { r: 0.03 });
    const tex = Kit.canvasTex(512, 384, (c, w, h) => {
      c.fillStyle = "#2a180c"; c.fillRect(0, 0, w, h);
      for (let r = 0; r < 6; r++) for (let i = 0; i < 10; i++) {
        const cx = 14 + i * 49, cy = 14 + r * 61;
        c.fillStyle = "#140a04"; c.fillRect(cx, cy, 42, 52);
        c.strokeStyle = "rgba(217,164,65,0.5)"; c.lineWidth = 2; c.strokeRect(cx, cy, 42, 52);
        if ((r * 7 + i * 3) % 4) { c.fillStyle = "#d9a441"; c.fillRect(cx + 18, cy + 8, 6, 22); c.beginPath(); c.arc(cx + 21, cy + 36, 7, 0, Math.PI * 2); c.fill(); }
        c.fillStyle = "rgba(240,220,180,0.7)"; c.font = "600 11px sans-serif"; c.fillText(String(100 + r * 10 + i), cx + 8, cy + 50);
      }
    });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.1), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
    face.position.set(0, 1.2, 0.205); g.add(face);
    Kit.colLocal(F, g, 0, 0, 3.0, 0.45);
  },
  fan(F, x, z, h) {
    const f = P(F, "ceilingFan", x, z, 0, { y: h - 0.5, collide: false, ao: false });
    const seed = x;
    F.dynamic.push({ update(dt) { f.rotation.y += dt * 3.5; } });
    return f;
  },
  mostWanted(F, x, y, z, ry) {
    const bugs = [["NullPointerException", "#c0392b"], ["Race Condition", "#8e44ad"], ["Off-By-One", "#d35400"], ["Memory Leak", "#2c3e50"], ["Heisenbug", "#16a085"], ["Works On My Machine", "#7f8c8d"]];
    Kit.frameArt(F, 3.0, 1.5, (c, w, h) => {
      c.fillStyle = "#f2ead6"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#8c1c1c"; c.font = `800 ${h * 0.11}px Courier, monospace`; c.textAlign = "center"; c.fillText("MOST WANTED", w / 2, h * 0.14);
      bugs.forEach(([name, col], i) => {
        const cx = w * (0.1 + (i % 3) * 0.4) + w * 0.07, cy = h * (0.24 + Math.floor(i / 3) * 0.38);
        c.fillStyle = "#d8d0bc"; c.fillRect(cx - w * 0.1, cy, w * 0.2, h * 0.24);
        c.fillStyle = col; c.beginPath(); c.arc(cx, cy + h * 0.1, h * 0.07, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#1a1a1a"; c.fillRect(cx - h * 0.03, cy + h * 0.08, h * 0.015, h * 0.015); c.fillRect(cx + h * 0.015, cy + h * 0.08, h * 0.015, h * 0.015);
        c.fillStyle = "#241c10"; c.font = `700 ${h * 0.042}px Courier, monospace`; c.fillText(name, cx, cy + h * 0.3);
      });
    }, x, y, z, ry, { frame: Kit.M(0x3a2a1a) });
    const nx = Math.sin(ry), nz = Math.cos(ry);
    Kit.hot(F, { x: x + nx * 1.2, z: z + nz * 1.2, y: y + 1.0, r: 2.0, label: "MOST WANTED", fn: () => UI.say("Six fugitives. All caught in production. All will return. The Heisenbug vanishes whenever you look at it.") });
  },
  tvMatch(F, x, y, z, ry) {
    const nx = Math.sin(ry), nz = Math.cos(ry);
    Kit.B(F.group, 1.95, 1.15, 0.06, Kit.M(0x0c0d10, { rough: 0.25, metal: 0.4 }), x, y, z, { ry, r: 0.03 });
    Kit.screen(F, 1.85, 1.05, (c, w, h, t) => {
      t = t || 0;
      c.fillStyle = "#1e6a34"; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? "#1e6a34" : "#237a3c"; c.fillRect(i * w / 8, 0, w / 8, h); }
      c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 3; c.strokeRect(w * 0.04, h * 0.08, w * 0.92, h * 0.84);
      c.beginPath(); c.moveTo(w / 2, h * 0.08); c.lineTo(w / 2, h * 0.92); c.stroke(); c.beginPath(); c.arc(w / 2, h / 2, h * 0.14, 0, Math.PI * 2); c.stroke();
      for (let i = 0; i < 11; i++) {
        const px = w * (0.1 + ((i * 37) % 80) / 100) + Math.sin(t * 0.9 + i) * 20, py = h * (0.15 + ((i * 53) % 70) / 100) + Math.cos(t * 0.7 + i * 2) * 14;
        c.fillStyle = i < 6 ? "#f4f4f2" : "#2a2a6a"; c.beginPath(); c.arc(px, py, 7, 0, Math.PI * 2); c.fill();
      }
      const bx = w / 2 + Math.sin(t * 1.3) * w * 0.35, by = h / 2 + Math.sin(t * 2.1) * h * 0.3;
      c.fillStyle = "#fff"; c.beginPath(); c.arc(bx, by, 4, 0, Math.PI * 2); c.fill();
      c.fillStyle = "rgba(0,0,0,0.6)"; c.fillRect(8, 8, 180, 28);
      c.fillStyle = "#fff"; c.font = `700 18px ${Kit.FONT}`; c.fillText("RMA 3 – 1 FCB  87'", 16, 28);
    }, x + nx * 0.035, y, z + nz * 0.035, ry, { fps: 10, px: 384, glow: 1.1 });
    Kit.light(F, x + nx * 1.2, y, z + nz * 1.2, 0x7ae582, 1.0, 4);
    Kit.hot(F, { x: x + nx * 1.6, z: z + nz * 1.6, y: y + 1.0, r: 2.0, label: "El Clásico replay", fn: () => UI.say("87th minute. 3–1. He's watched this replay forty-one times. It gets better every time.") });
  },
  trophyCabinet(F, x, z, ry) {
    const g = Kit.grp(F, x, z, ry);
    Kit.B(g, 1.6, 0.8, 0.6, Kit.M(0x1c120c, { rough: 0.35 }), 0, 0.4, 0, { r: 0.03 });
    const glass = Kit.glassM(0xdfeeff, 0.14);
    Kit.B(g, 1.6, 1.4, 0.6, glass, 0, 1.5, 0, { r: 0.02, cast: false });
    Kit.B(g, 1.64, 0.06, 0.64, Kit.gold(), 0, 2.22, 0, { r: 0.02 });
    for (let i = 0; i < 3; i++) Kit.L(g, [[0, 0], [0.05, 0], [0.02, 0.05], [0.02, 0.14], [0.1, 0.24], [0.11, 0.33], [0, 0.26]], Kit.gold(), -0.5 + i * 0.5, 0.82, 0, { seg: 18 });
    Kit.S(g, 0.12, Kit.M(0xf4f4f0, { rough: 0.5 }), 0.2, 1.36, 0.05);
    Kit.light(F, x, 2.0, z, 0xffe6b0, 1.0, 3);
    Kit.colLocal(F, g, 0, 0, 1.7, 0.7);
    Kit.hot(F, { x: x + Math.sin(ry) * 1.2, z: z + Math.cos(ry) * 1.2, y: 2.6, r: 1.8, label: "The trophy cabinet", fn: () => UI.say("Three small cups and a ball signed by the whole squad. The cabinet is locked. The key is ‘ship it’.") });
  },
  barCart(F, x, z, ry) {
    const g = Kit.grp(F, x, z, ry);
    const gold = Kit.gold();
    for (const y of [0.3, 0.75]) Kit.B(g, 0.9, 0.03, 0.5, Kit.glassM(0xffffff, 0.3), 0, y, 0, { r: 0.01, cast: false });
    for (const [sx, sz] of [[-0.42, -0.22], [0.42, -0.22], [-0.42, 0.22], [0.42, 0.22]]) Kit.C(g, 0.012, 0.012, 0.8, gold, sx, 0.4, sz, { seg: 6 });
    const cols = [0x6a1a1a, 0x1a4a2a, 0xc9a227, 0x2a2a6a, 0x8a4a1a];
    cols.forEach((c, i) => {
      Kit.C(g, 0.035, 0.035, 0.22, Kit.M(c, { rough: 0.1, opacity: 0.85, env: 2 }), -0.3 + i * 0.15, 0.88, -0.05, { seg: 10 });
      Kit.C(g, 0.012, 0.015, 0.08, Kit.M(c, { rough: 0.1 }), -0.3 + i * 0.15, 1.03, -0.05, { seg: 6 });
    });
    for (let i = 0; i < 3; i++) Kit.C(g, 0.03, 0.025, 0.08, Kit.M(0xffffff, { rough: 0.05, opacity: 0.5, env: 2 }), -0.2 + i * 0.2, 0.36, 0.05, { seg: 10 });
    Kit.colLocal(F, g, 0, 0, 1.0, 0.6);
  },
  telescope(F, x, z, ry) {
    const g = Kit.grp(F, x, z, ry);
    for (let i = 0; i < 3; i++) { const a = i * 2.09; Kit.C(g, 0.015, 0.015, 1.1, Kit.gold(), Math.cos(a) * 0.2, 0.52, Math.sin(a) * 0.2, { rz: Math.cos(a) * 0.3, rx: -Math.sin(a) * 0.3, seg: 6 }); }
    Kit.C(g, 0.06, 0.09, 0.9, Kit.M(0x1a1c22, { metal: 0.6, rough: 0.3 }), 0, 1.25, 0.1, { rx: -1.1, seg: 16 });
    Kit.T(g, 0.09, 0.015, Kit.gold(), 0, 1.44, 0.46, { rx: -1.1 + Math.PI / 2, cast: false });
    Kit.collide(F, x, z, 0.6, 0.6);
    Kit.hot(F, { x, z: z + 0.8, y: 2.1, r: 1.6, label: "Look through the telescope", fn: () => UI.say("Stadium lights on the horizon. A helicopter. Somebody's deploy dashboard on the 40th floor across the street — it's all green. Good for them.") });
  },
};

/* ---------------- F0 · Continental: a hotel lobby's finishing touches ---------------- */
/* the lobby directory totem: who this is, the numbers, what's on every floor — click for the one-page résumé */
Dress.kiosk = (F, x, z, ry) => {
  const g = Kit.grp(F, x, z, ry);
  const dark = Kit.M(0x14110e, { rough: 0.35, metal: 0.5 });
  Kit.B(g, 1.12, 0.08, 0.5, Kit.gold(), 0, 0.04, 0, { r: 0.02 });
  Kit.B(g, 1.04, 2.36, 0.2, dark, 0, 1.22, 0, { r: 0.04 });
  Kit.B(g, 1.08, 0.04, 0.24, Kit.gold(), 0, 2.42, 0, { r: 0.01 });
  Kit.colLocal(F, g, 0, 0, 1.15, 0.55);
  const P = CONTENT.profile, C = CONTENT;
  Kit.screen(F, 0.9, 2.04, (c, w, h, t) => {
    t = t || 0;
    const bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, "#120e0a"); bg.addColorStop(1, "#08070a");
    c.fillStyle = bg; c.fillRect(0, 0, w, h);
    const pad = w * 0.08, col = "#e8c268";
    c.textAlign = "left"; c.textBaseline = "alphabetic";
    c.fillStyle = col; c.font = `800 ${w * 0.045}px ${Kit.FONT}`; c.fillText("WELCOME TO SPARSH HQ", pad, h * 0.05);
    c.fillStyle = "#fff4e0"; c.font = `700 ${w * 0.115}px Fraunces, Georgia, serif`; c.fillText(P.name, pad, h * 0.11);
    c.fillStyle = "rgba(255,244,224,0.8)"; c.font = `500 ${w * 0.043}px ${Kit.FONT}`; c.fillText(`${P.role} · ${P.company}`, pad, h * 0.143);
    // the four numbers
    P.stats.forEach((st, i) => {
      const cx = pad + (i % 2) * (w - pad * 2) / 2, cy = h * 0.19 + Math.floor(i / 2) * h * 0.09;
      c.fillStyle = col; c.font = `800 ${w * 0.085}px ${Kit.FONT}`; c.fillText(st.v, cx, cy + h * 0.035);
      c.fillStyle = "rgba(255,244,224,0.65)"; c.font = `500 ${w * 0.03}px ${Kit.FONT}`;
      const words = st.l.split(" "); let ln = "", row = 0;
      for (const wd of words) { const tt = ln ? ln + " " + wd : wd; if (c.measureText(tt).width > (w - pad * 2) / 2 - 10 && ln) { c.fillText(ln, cx, cy + h * 0.053 + row * h * 0.017); ln = wd; row++; } else ln = tt; }
      if (ln && row < 2) c.fillText(ln, cx, cy + h * 0.053 + row * h * 0.017);
    });
    // floor directory
    c.strokeStyle = "rgba(232,194,104,0.35)"; c.lineWidth = 2; c.beginPath(); c.moveTo(pad, h * 0.385); c.lineTo(w - pad, h * 0.385); c.stroke();
    c.fillStyle = col; c.font = `800 ${w * 0.04}px ${Kit.FONT}`; c.fillText("DIRECTORY", pad, h * 0.415);
    C.floors.slice().reverse().forEach((f, i) => {
      const y = h * 0.455 + i * h * 0.052;
      c.fillStyle = col; c.font = `800 ${w * 0.05}px ${Kit.FONT}`; c.fillText(String(f.idx), pad, y);
      c.fillStyle = "#fff4e0"; c.font = `700 ${w * 0.042}px ${Kit.FONT}`; c.fillText(f.name, pad + w * 0.09, y - h * 0.006);
      c.fillStyle = "rgba(255,244,224,0.55)"; c.font = `500 ${w * 0.032}px ${Kit.FONT}`; c.fillText(f.what, pad + w * 0.09, y + h * 0.014);
    });
    // call to action
    const pulse = 0.75 + Math.sin(t * 2.2) * 0.25;
    c.fillStyle = `rgba(232,194,104,${0.16 * pulse})`; c.fillRect(pad - 6, h * 0.893, w - pad * 2 + 12, h * 0.07);
    c.strokeStyle = `rgba(232,194,104,${0.8 * pulse})`; c.strokeRect(pad - 6, h * 0.893, w - pad * 2 + 12, h * 0.07);
    c.fillStyle = "#fff4e0"; c.font = `800 ${w * 0.043}px ${Kit.FONT}`; c.textAlign = "center";
    c.fillText("▸ TAP FOR THE ONE-PAGE RÉSUMÉ", w / 2, h * 0.925);
    c.fillStyle = "rgba(255,244,224,0.5)"; c.font = `500 ${w * 0.03}px ${Kit.FONT}`; c.fillText("or keep walking — every line has a room", w / 2, h * 0.95);
  }, 0, 1.24, 0.105, 0, { parent: g, fps: 2, px: 600, glow: 1.15 });
  Kit.light(F, x + Math.sin(ry) * 1.0, 2.0, z + Math.cos(ry) * 1.0, 0xffd9a0, 0.8, 4);
  Kit.hot(F, { x: x + Math.sin(ry) * 1.1, z: z + Math.cos(ry) * 1.1, y: 2.65, r: 2.2, label: "Building directory — the one-page résumé", focus: { x, y: 1.4, z }, fn: () => UI.dossier("lobby_totem") });
  return g;
};

extend("f0", (F) => {
  Dress.kiosk(F, 3.35, 4.7, -0.85);
  Dress.luggageCart(F, 4.6, 6.6, -0.4);
  Dress.keyRack(F, 0, -9.55, 0);
  F.npcSpecs.push({ model: "character-male-e", x: -4.2, z: 2.2, ry: 1.3, behavior: "chat", quotes: "concierge" });
  F.npcSpecs.push({ model: "character-female-f", x: -3.1, z: 2.6, ry: -1.9, behavior: "chat" });
  for (const px of [-12.6, 12.6]) Kit.floorLamp(F, px, -1.8, { intensity: 0.9, light: false });
});

/* ---------------- F1 · warmer tones, lighter glass frames ---------------- */
extend("f7", (F) => {
  // TV + match in the lounge
  const tvc = Kit.grp(F, -5.2, 2.5, 0);
  Kit.B(tvc, 2.6, 0.5, 0.5, Kit.M(0x1c120c, { rough: 0.35 }), 0, 0.25, 0, { r: 0.03 });
  Kit.colLocal(F, tvc, 0, 0, 2.6, 0.55);
  Dress.tvMatch(F, -5.2, 1.2, 2.45, 0);
  P(F, "speakerSmall", -6.8, 2.55, 0, { y: 0.5, collide: false });
  P(F, "speakerSmall", -3.6, 2.55, 0, { y: 0.5, collide: false });
  // trophy cabinet & bar
  Dress.trophyCabinet(F, 12.9, 5.8, -Math.PI / 2);
  Dress.barCart(F, 13.0, 0.4, -Math.PI / 2);
  // dining / meeting table by the north glass
  Kit.table(F, 3.6, -8.2, 0, { style: "rect", w: 3.0, d: 1.2, h: 0.76, top: Kit.M(0x1c120c, { rough: 0.2, env: 1.4 }) });
  for (const [cx, cz, cr] of [[2.6, -7.3, Math.PI], [4.6, -7.3, Math.PI], [2.6, -9.1, 0], [4.6, -9.1, 0]]) Kit.chair(F, cx, cz, cr, { style: "arm", color: 0x2a2e3a, noCollide: true });
  Kit.pendant(F, 3.6, -8.2, { h: 3.9, drop: 1.3, style: "cylinder", light: true, intensity: 1.2, shade: Kit.gold() });
  // window nook with telescope
  P(F, "loungeChair", 10.6, -7.6, 0.6, { tint: { carpet: 0xe8e2d4, wood: 0x1c120c } });
  Dress.telescope(F, 12.2, -8.8, 0.4);
  // books, sculpture, plants, extra lights
  Kit.bookcase(F, -13.6, 7.4, Math.PI / 2, { w: 3.2, h: 2.6, rows: 5, wood: Kit.M(0x2a1a10, { rough: 0.5 }) });
  const sc = Kit.grp(F, 1.2, 1.4, 0);
  Kit.B(sc, 0.5, 1.0, 0.5, Look.mat("marble", 0xe8e2d6, { rough: 0.2, tile: 1 }), 0, 0.5, 0, { r: 0.02 });
  const orb = Kit.S(sc, 0.3, Kit.gold(), 0, 1.35, 0, { seg: 28 });
  Kit.T(sc, 0.42, 0.02, Kit.gold(), 0, 1.35, 0, { rx: 1.1, cast: false });
  F.dynamic.push({ update(dt, t) { orb.position.y = 1.35 + Math.sin(t) * 0.04; } });
  Kit.collide(F, 1.2, 1.4, 0.6, 0.6);
  Kit.plant(F, -2.2, 9.2, { kind: "fiddle", s: 1.2, pot: "black", interact: false });
  Kit.plant(F, 8.6, -9.2, { kind: "palm", s: 1.2, pot: "brass", interact: false });
  Kit.floorLamp(F, 9.4, -6.6, { intensity: 1.0 });
  Kit.rug(F, 11.4, -7.6, 3.6, 3.0, 0, { kind: "persian", colors: [0x1c2230, 0xd9a441, 0x3a1a1a] });
  for (const px of [-6.4, -4.0]) Kit.pendant(F, px, 5.2, { h: 3.9, drop: 1.5, style: "globe", color: 0xffd8a0, light: px < -5, intensity: 1.0 });
  // mini football goal (the ball lives nearby)
  const goal = Kit.grp(F, 6.4, 5.6, -0.3);
  const post = Kit.M(0xf4f4f2, { rough: 0.4 });
  for (const s of [-1, 1]) Kit.C(goal, 0.04, 0.04, 1.2, post, s * 1.1, 0.6, 0, { seg: 8 });
  Kit.C(goal, 0.04, 0.04, 2.24, post, 0, 1.2, 0, { rz: Math.PI / 2, seg: 8 });
  const net = Kit.canvasTex(256, 128, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = "rgba(255,255,255,0.7)"; c.lineWidth = 1.5; for (let x = 0; x <= w; x += 12) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y <= h; y += 12) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } });
  const netM = new THREE.MeshBasicMaterial({ map: net, transparent: true, side: THREE.DoubleSide, depthWrite: false });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.2), netM); back.position.set(0, 0.6, -0.6); back.rotation.x = 0.4; goal.add(back);
  Kit.colLocal(F, goal, 0, -0.3, 2.3, 0.7);
  // L-shaped conversation lounge in the middle of the room
  Kit.rug(F, 4.2, 1.2, 4.6, 3.6, 0, { kind: "geo", colors: [0x1c2230, 0x2a3040, 0xd9a441] });
  P(F, "loungeDesignSofa", 4.0, -0.2, 0, { tint: { carpet: 0xe8e2d4, metal: 0xd9a441 } });
  P(F, "loungeDesignChair", 6.1, 1.6, -Math.PI / 2, { tint: { carpet: 0x7a2a20, metal: 0xd9a441 } });
  P(F, "tableCoffeeSquare", 4.0, 1.5, 0, { tint: { wood: 0x1c120c } });
  Kit.mug(F.group, 4.2, 0.46, 1.4, 0xf4f1ea);
  sitSpot(F, 4.0, -0.25, 0, "Sink into the sofa");
  // upright piano
  const pi = Kit.grp(F, 10.8, 7.8, -Math.PI / 2);
  Kit.B(pi, 1.5, 1.2, 0.55, Kit.M(0x0e0c0c, { rough: 0.15, env: 1.6 }), 0, 0.6, -0.1, { r: 0.03 });
  Kit.B(pi, 1.45, 0.05, 0.3, Kit.M(0xf4f2ea, { rough: 0.3 }), 0, 0.76, 0.28, { r: 0.01 });
  for (let i = 0; i < 20; i++) if ([1, 2, 4, 5, 6].includes(i % 7)) Kit.B(pi, 0.03, 0.03, 0.16, Kit.M(0x0e0c0c), -0.68 + i * 0.07, 0.8, 0.22, { r: 0.004, cast: false });
  Kit.B(pi, 0.9, 0.08, 0.4, Kit.M(0x0e0c0c, { rough: 0.2 }), 0, 0.46, 0.75, { r: 0.02 });
  Kit.colLocal(F, pi, 0, 0.2, 1.6, 1.3);
  Kit.hot(F, { x: 9.8, z: 7.8, y: 1.8, r: 1.6, label: "Play the piano", fn: () => { [523, 659, 784, 1047].forEach((f, i) => AudioSys.tone(f, 0.6, "triangle", 0.08, i * 0.18)); UI.say("Four notes of the Champions League anthem. Everyone in the building stands up a little straighter."); } });
  Kit.neon(F, "HALA MADRID", 0xffd166, -13.84, 3.3, 0, Math.PI / 2, { size: 0.32, glow: 1.9, plate: false });
  Kit.plant(F, 12.6, 9.0, { kind: "monstera", s: 1.2, pot: "black", interact: false });
});
