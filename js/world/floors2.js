/* ============================================================
   SPARSH HQ v3 — floors2.js  (floors 1–7)
   Each floor is a real office plan: rooms with walls & doors,
   corridors, and dense, purposeful set dressing.
   ============================================================ */

const HP = Math.PI / 2;

/* ---------- storytelling props ---------- */
const Props = {
  stand(F, x, z, h = 0.95, w = 0.5) {
    Kit.B(F.group, w, h, 0.34, Kit.M(0x15171d, { rough: 0.35, metal: 0.5 }), x, h / 2, z, { r: 0.04 });
    Kit.C(F.group, w * 0.9, w, 0.04, Kit.M(0x15171d, { rough: 0.35, metal: 0.5 }), x, 0.02, z, { seg: 24 });
    Kit.collide(F, x, z, w + 0.2, 0.5);
  },

  // a holo wall on its own stand, facing ry
  holoStand(F, lab, x, z, ry, o = {}) {
    const nx = Math.sin(ry), nz = Math.cos(ry);
    const w = o.w || 3.0, h = o.h || 1.75, y = o.y || 1.9;
    const g = Kit.grp(F, x - nx * 0.12, z - nz * 0.12, ry);
    Kit.B(g, 0.12, y - h / 2, 0.12, Kit.M(0x15171d, { rough: 0.35, metal: 0.5 }), -w / 2 + 0.3, (y - h / 2) / 2, 0, { r: 0.03 });
    Kit.B(g, 0.12, y - h / 2, 0.12, Kit.M(0x15171d, { rough: 0.35, metal: 0.5 }), w / 2 - 0.3, (y - h / 2) / 2, 0, { r: 0.03 });
    Kit.B(g, w * 0.7, 0.05, 0.5, Kit.M(0x15171d, { rough: 0.35, metal: 0.5 }), 0, 0.025, 0, { r: 0.02 });
    Kit.colLocal(F, g, 0, 0, w, 0.5);
    return Kit.holoWall(F, lab, x, y, z, ry, { w, h });
  },

  energyCore(F, x, z) {
    const g = Kit.grp(F, x, z, 0);
    Kit.C(g, 1.9, 2.1, 0.3, Kit.M(0x14171e, { metal: 0.6, rough: 0.35 }), 0, 0.15, 0, { seg: 40 });
    Kit.T(g, 2.0, 0.04, Kit.G(0x57d8ff, 2.2), 0, 0.31, 0, { rx: HP, cast: false });
    const coreMat = new THREE.MeshStandardMaterial({ color: 0x9fdcff, emissive: 0x57d8ff, emissiveIntensity: 2.5, transparent: true, opacity: 0.85, roughness: 0.1 });
    const core = Kit.C(g, 0.5, 0.65, 2.4, coreMat, 0, 1.55, 0, { seg: 28, cast: false });
    Kit.C(g, 0.75, 0.75, 0.18, Kit.metal(0x2a3240, 0.3), 0, 0.4, 0, { seg: 28 });
    Kit.C(g, 0.7, 0.7, 0.18, Kit.metal(0x2a3240, 0.3), 0, 2.75, 0, { seg: 28 });
    const ringM = Kit.M(0x2a3a55, { emissive: 0x57d8ff, ei: 1.4, metal: 0.7, rough: 0.3 });
    const r1 = Kit.T(g, 1.1, 0.05, ringM, 0, 1.55, 0, { cast: false });
    const r2 = Kit.T(g, 1.45, 0.04, ringM, 0, 1.55, 0, { cast: false });
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; Kit.B(g, 0.08, 0.9, 0.08, Kit.metal(0x8a94a4, 0.3), Math.cos(a) * 1.85, 0.75, Math.sin(a) * 1.85, { r: 0.02 }); }
    Kit.T(g, 1.85, 0.03, Kit.metal(0xb0b8c4, 0.25), 0, 1.2, 0, { rx: HP });
    Kit.light(F, x, 2.2, z, 0x57d8ff, 6, 14);
    F.dynamic.push({ update(dt, t) {
      r1.rotation.x = t * 0.9; r1.rotation.y = t * 0.4;
      r2.rotation.x = -t * 0.5; r2.rotation.z = t * 0.7;
      coreMat.emissiveIntensity = 2.2 + Math.sin(t * 2.2) * 0.6;
      if (Math.random() < dt * 1.5) Game.sparkle(x + U.rand(-0.5, 0.5), U.rand(1, 2.6), z + U.rand(-0.5, 0.5), 0x9fdcff, 2);
    }});
    Kit.collide(F, x, z, 4.0, 4.0);
    Kit.hot(F, { x, z: z + 2.4, y: 3.2, r: 2.6, label: "The core — what powers this floor", ref: CONTENT.core, focus: { x, y: 1.6, z }, fn: () => { AudioSys.sfx("open"); UI.panel(CONTENT.core); } });
  },

  roboArm(F, x, z, col = 0xff9e4d) {
    const base = Kit.grp(F, x, z, 0);
    Kit.C(base, 0.38, 0.45, 0.3, Kit.M(0x22262e, { metal: 0.6, rough: 0.35 }), 0, 0.15, 0, { seg: 20 });
    const m = Kit.M(col, { rough: 0.35, metal: 0.3 });
    const s1 = new THREE.Group(); s1.position.y = 0.3; base.add(s1);
    Kit.S(s1, 0.16, Kit.M(0x22262e, { metal: 0.6 }), 0, 0, 0);
    Kit.B(s1, 0.18, 1.0, 0.18, m, 0, 0.5, 0, { r: 0.07 });
    const s2 = new THREE.Group(); s2.position.y = 1.0; s1.add(s2);
    Kit.S(s2, 0.13, Kit.M(0x22262e, { metal: 0.6 }), 0, 0, 0);
    Kit.B(s2, 0.14, 0.8, 0.14, m, 0, 0.4, 0, { r: 0.06 });
    const hand = new THREE.Group(); hand.position.y = 0.8; s2.add(hand);
    Kit.B(hand, 0.2, 0.08, 0.12, Kit.M(0x22262e, { metal: 0.6 }), 0, 0, 0, { r: 0.03 });
    Kit.S(hand, 0.05, Kit.G(0x57d8ff, 2), 0, 0.06, 0);
    const seed = x;
    F.dynamic.push({ update(dt, t) { s1.rotation.y = t * 0.3 + seed; s1.rotation.z = Math.sin(t * 0.7 + seed) * 0.5; s2.rotation.z = Math.sin(t * 1.1 + 1 + seed) * 0.9; } });
    Kit.collide(F, x, z, 1.0, 1.0);
  },

  globe(F, x, z) {
    const tex = Kit.canvasTex(512, 256, (c, w, h) => {
      const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#0d2c46"); g.addColorStop(0.5, "#154a6e"); g.addColorStop(1, "#0d2c46");
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.fillStyle = "#3f8a52";
      const R = Look.rng(3);
      for (let i = 0; i < 12; i++) { c.beginPath(); c.ellipse(R() * w, h * (0.2 + R() * 0.6), 20 + R() * 50, 12 + R() * 30, R() * 3, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = "rgba(255,255,255,0.55)";
      for (let i = 0; i < 18; i++) { c.beginPath(); c.ellipse(R() * w, R() * h, 18 + R() * 30, 4, R(), 0, Math.PI * 2); c.fill(); }
    });
    const g = Kit.grp(F, x, z, 0);
    Kit.C(g, 0.55, 0.7, 0.9, Kit.M(0x14171e, { metal: 0.5, rough: 0.35 }), 0, 0.45, 0, { seg: 24 });
    const earth = new THREE.Mesh(new THREE.SphereGeometry(0.85, 40, 28), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, emissive: 0x3070a0, emissiveIntensity: 0.35 }));
    earth.position.y = 1.9; earth.castShadow = true; g.add(earth);
    const atmo = new THREE.Mesh(new THREE.SphereGeometry(0.93, 32, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x7ad0ff).multiplyScalar(1.2), transparent: true, opacity: 0.15, depthWrite: false }));
    atmo.position.y = 1.9; g.add(atmo);
    Kit.T(g, 1.35, 0.01, Kit.G(0x7ae582, 1.5), 0, 1.9, 0, { rx: HP + 0.3, cast: false });
    const sat = new THREE.Group(); sat.position.y = 1.9; g.add(sat);
    Kit.B(sat, 0.1, 0.1, 0.1, Kit.metal(0xd0d4da), 1.35, 0, 0, { r: 0.01 });
    Kit.B(sat, 0.3, 0.01, 0.1, Kit.G(0x57d8ff, 1.4), 1.35, 0, 0, { r: 0.003, cast: false });
    Kit.light(F, x, 2.9, z, 0x7ae582, 3, 7);
    F.dynamic.push({ update(dt, t) { earth.rotation.y = t * 0.25; sat.rotation.set(0.3, t * 0.8, 0); } });
    Kit.collide(F, x, z, 1.5, 1.5);
    return g;
  },

  treeSculpture(F, x, z) {
    const g = Kit.grp(F, x, z, 0);
    Kit.C(g, 0.5, 0.6, 0.7, Kit.M(0x14171e, { metal: 0.5, rough: 0.3 }), 0, 0.35, 0, { seg: 24 });
    const nodeM = Kit.G(0x9fd0ff, 2.2), lineM = Kit.M(0x5aa7ff, { emissive: 0x5aa7ff, ei: 1.2 });
    const nodes = [];
    const add = (px, py, pz, depth) => {
      const n = Kit.S(g, depth === 0 ? 0.09 : 0.065, nodeM, px, py, pz, { cast: false });
      nodes.push(n);
      if (depth >= 3) return;
      for (const s of [-1, 1]) {
        const spread = 0.55 / (depth + 1);
        const cx = px + s * spread, cy = py + 0.38, cz = pz + (depth % 2 ? s * 0.15 : 0);
        const len = Math.hypot(cx - px, cy - py, cz - pz);
        const cyl = Kit.C(g, 0.012, 0.012, len, lineM, (px + cx) / 2, (py + cy) / 2, (pz + cz) / 2, { seg: 6, cast: false });
        cyl.lookAt(g.localToWorld(new THREE.Vector3(cx, cy, cz)));
        cyl.rotateX(HP);
        add(cx, cy, cz, depth + 1);
      }
    };
    add(0, 0.95, 0, 0);
    F.dynamic.push({ update(dt, t) { g.rotation.y = t * 0.3; nodes.forEach((n, i) => n.scale.setScalar(1 + Math.max(0, Math.sin(t * 3 - i * 0.4)) * 0.6)); } });
    Kit.light(F, x, 2.2, z, 0x5aa7ff, 2.5, 6);
    Kit.collide(F, x, z, 1.1, 1.1);
  },

  chatBubbles(F, x, z) {
    const bs = [];
    for (let i = 0; i < 5; i++) {
      const me = i % 2;
      const m = Kit.poster(F, 0.8, 0.36, (c, w, h) => {
        c.clearRect(0, 0, w, h);
        c.fillStyle = me ? "#c084fc" : "#f4f0ff";
        c.beginPath(); c.roundRect(4, 4, w - 8, h - 20, 22); c.fill();
        c.beginPath(); c.moveTo(me ? w - 50 : 40, h - 18); c.lineTo(me ? w - 30 : 30, h - 2); c.lineTo(me ? w - 70 : 60, h - 18); c.fill();
        c.fillStyle = me ? "#fff" : "#6a4aa0";
        for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(w / 2 - 30 + k * 30, (h - 16) / 2 + 2, 7, 0, Math.PI * 2); c.fill(); }
      }, x, 2, z, 0, { transparent: true, px: 256, glow: 1.3, decor: false });
      m.material.side = THREE.DoubleSide; m.material.depthWrite = false;
      bs.push({ m, seed: i * 1.3 });
    }
    F.dynamic.push({ update(dt, t) {
      bs.forEach((b, i) => {
        const p = (t * 0.12 + i / bs.length) % 1;
        b.m.position.set(x + Math.sin(i * 2.1) * 1.4 + Math.sin(t + i) * 0.1, 1.2 + p * 1.9, z + Math.cos(i * 1.7) * 0.9);
        b.m.material.opacity = Math.sin(p * Math.PI);
        b.m.lookAt(Game.camera.position);
      });
    }});
  },

  pipes(F, x1, x2, z, y0, col = 0x8c5a2e) {
    const pm = Kit.M(col, { metal: 0.85, rough: 0.3 });
    const len = x2 - x1;
    for (let i = 0; i < 3; i++) {
      Kit.C(F.group, 0.11, 0.11, len, pm, (x1 + x2) / 2, y0 - i * 0.42, z, { rz: HP, seg: 14 });
      for (let k = 0; k < 4; k++) Kit.T(F.group, 0.13, 0.025, Kit.metal(0x2a2a2e), x1 + (k + 0.5) * len / 4, y0 - i * 0.42, z, { ry: HP, cast: false });
    }
    // valve wheels
    for (let k = 0; k < 3; k++) { const w = Kit.T(F.group, 0.18, 0.03, Kit.M(0xb03a2a, { metal: 0.5, rough: 0.4 }), x1 + 1 + k * (len - 2) / 2, y0 + 0.3, z + 0.1, { cast: false }); F.dynamic.push({ update(dt, t) { w.rotation.z = t * 0.4 * (k % 2 ? 1 : -1); } }); }
    const dots = [];
    for (let i = 0; i < 7; i++) dots.push(Kit.S(F.group, 0.075, Kit.G(0xffd166, 2.4), x1, y0, z + 0.16, { cast: false }));
    F.dynamic.push({ update(dt, t) {
      dots.forEach((d, i) => {
        const lane = i % 3, f = (t * 0.2 + i * 0.143) % 1;
        d.position.set(x1 + f * len, y0 - lane * 0.42, z + 0.13);
        d.visible = !(lane === 2 && f > 0.62);
      });
    }});
  },

  container(F, x, y, z, ry, col, label) {
    const g = Kit.grp(F, x, z, ry, y);
    const tex = Kit.canvasTex(256, 128, (c, w, h) => {
      c.fillStyle = "#" + new THREE.Color(col).getHexString(); c.fillRect(0, 0, w, h);
      for (let i = 0; i < w; i += 10) { c.fillStyle = "rgba(0,0,0,0.18)"; c.fillRect(i, 0, 3, h); c.fillStyle = "rgba(255,255,255,0.08)"; c.fillRect(i + 4, 0, 2, h); }
      c.fillStyle = "rgba(255,255,255,0.92)"; c.font = `800 26px ${Kit.FONT}`; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(label, w / 2, h / 2);
    });
    const side = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.35 });
    const plain = Kit.M(col, { rough: 0.55, metal: 0.35 });
    const m = new THREE.Mesh(Kit.geo("cont", () => new THREE.BoxGeometry(2.4, 1.1, 1.1)), [plain, plain, plain, plain, side, side]);
    m.position.y = 0.55; m.castShadow = true; m.receiveShadow = true; g.add(m);
    if (!y) Kit.colLocal(F, g, 0, 0, 2.5, 1.2);
    return g;
  },

  bars(F, x1, z1, x2, z2, h = 2.8) {
    const len = Math.hypot(x2 - x1, z2 - z1), n = Math.round(len / 0.22);
    const bm = Kit.metal(0x3a3e46, 0.35);
    for (let i = 0; i <= n; i++) { const f = i / n; Kit.C(F.group, 0.028, 0.028, h, bm, x1 + (x2 - x1) * f, h / 2, z1 + (z2 - z1) * f, { seg: 8 }); }
    for (const y of [0.12, h - 0.1, h * 0.55]) {
      const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
      Kit.B(F.group, len, 0.06, 0.08, bm, cx, y, cz, { ry: -Math.atan2(z2 - z1, x2 - x1), r: 0.01 });
    }
    Kit.collide(F, (x1 + x2) / 2, (z1 + z2) / 2, Math.max(0.2, Math.abs(x2 - x1)), Math.max(0.2, Math.abs(z2 - z1)), 0, { aoK: 0.3 });
  },

  ladder(F, x, z, ry) {
    const g = Kit.grp(F, x, z, ry);
    const w = Kit.M(0x6a4a2e, { rough: 0.55 });
    for (const s of [-1, 1]) Kit.B(g, 0.05, 2.5, 0.05, w, s * 0.22, 1.2, 0.3, { rx: -0.2, r: 0.01 });
    for (let i = 0; i < 7; i++) Kit.B(g, 0.44, 0.04, 0.04, w, 0, 0.25 + i * 0.32, 0.36 - i * 0.065, { r: 0.01 });
  },

  jersey(F, x, y, z, ry) {
    const nx = Math.sin(ry), nz = Math.cos(ry);
    Kit.B(F.group, 1.15, 1.45, 0.06, Kit.M(0x14161e, { rough: 0.4 }), x, y, z, { ry, cast: false });
    Kit.poster(F, 1.0, 1.3, (c, w, h) => {
      c.fillStyle = "#101318"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#f4f4f2";
      c.beginPath();
      c.moveTo(w * 0.32, h * 0.14); c.lineTo(w * 0.12, h * 0.3); c.lineTo(w * 0.2, h * 0.44); c.lineTo(w * 0.28, h * 0.38);
      c.lineTo(w * 0.28, h * 0.88); c.lineTo(w * 0.72, h * 0.88); c.lineTo(w * 0.72, h * 0.38); c.lineTo(w * 0.8, h * 0.44);
      c.lineTo(w * 0.88, h * 0.3); c.lineTo(w * 0.68, h * 0.14); c.quadraticCurveTo(w * 0.5, h * 0.24, w * 0.32, h * 0.14);
      c.fill();
      c.fillStyle = "#c9a227"; c.font = `800 ${h * 0.085}px ${Kit.FONT}`; c.textAlign = "center";
      c.fillText(CONTENT.exec.jersey.name, w * 0.5, h * 0.42);
      c.font = `800 ${h * 0.3}px ${Kit.FONT}`; c.fillStyle = "#1a2c5a";
      c.fillText(String(CONTENT.exec.jersey.number), w * 0.5, h * 0.76);
      c.strokeStyle = "#1a1a1a"; c.lineWidth = 2; c.beginPath(); c.moveTo(w * 0.34, h * 0.82); c.bezierCurveTo(w * 0.42, h * 0.76, w * 0.5, h * 0.86, w * 0.6, h * 0.8); c.stroke();
    }, x + nx * 0.04, y, z + nz * 0.04, ry, { lit: true });
    Kit.light(F, x + nx * 0.8, y + 0.8, z + nz * 0.8, 0xffe6c0, 1.2, 3);
    Kit.hot(F, { x: x + nx * 1.1, z: z + nz * 1.1, y: y + 0.95, r: 1.8, label: "Signed jersey · #7", fn: () => UI.say(CONTENT.texts.jersey) });
  },

  futCard(F, x, y, z, ry) {
    const d = CONTENT.exec.card;
    const nx = Math.sin(ry), nz = Math.cos(ry);
    Kit.B(F.group, 1.3, 1.9, 0.06, Kit.M(0x14161e), x, y, z, { ry, cast: false });
    Kit.poster(F, 1.16, 1.76, (c, w, h) => {
      const g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#f0cc70"); g.addColorStop(0.5, "#c99b3f"); g.addColorStop(1, "#8a6a26");
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.fillStyle = "rgba(20,16,8,0.15)"; c.fillRect(w * 0.05, h * 0.04, w * 0.9, h * 0.92);
      c.fillStyle = "#241c08"; c.textAlign = "left";
      c.font = `800 ${h * 0.13}px ${Kit.FONT}`; c.fillText(String(d.rating), w * 0.1, h * 0.17);
      c.font = `700 ${h * 0.05}px ${Kit.FONT}`; c.fillText(d.pos, w * 0.1, h * 0.23);
      c.fillStyle = "rgba(36,28,8,0.85)";
      c.beginPath(); c.arc(w * 0.62, h * 0.24, h * 0.095, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(w * 0.62, h * 0.44, h * 0.13, h * 0.1, 0, Math.PI, Math.PI * 2); c.fill();
      c.fillStyle = "#241c08"; c.textAlign = "center";
      c.font = `800 ${h * 0.062}px ${Kit.FONT}`; c.fillText(d.name, w * 0.5, h * 0.58);
      c.font = `600 ${h * 0.04}px ${Kit.FONT}`; c.fillText(d.sub, w * 0.5, h * 0.64);
      c.font = `600 ${h * 0.042}px ${Kit.FONT}`;
      d.stats.forEach((s, i) => { const col = i % 2 === 0, row = Math.floor(i / 2); c.textAlign = col ? "right" : "left"; c.fillText(`${s[1]} ${s[0]}`, col ? w * 0.47 : w * 0.53, h * (0.73 + row * 0.075)); });
    }, x + nx * 0.04, y, z + nz * 0.04, ry, { px: 384, glow: 1.05 });
    Kit.light(F, x + nx * 0.8, y + 0.8, z + nz * 0.8, 0xffd98a, 1.2, 3);
    Kit.hot(F, { x: x + nx * 1.1, z: z + nz * 1.1, y: y + 1.2, r: 1.8, label: "Player card — 99 VISION", fn: () => UI.say("99 overall. The scouts said the work-ethic stat is undervalued.") });
  },

  goals(F, x, y, z, ry) {
    const nx = Math.sin(ry), nz = Math.cos(ry);
    Kit.B(F.group, 2.7, 1.8, 0.08, Kit.M(0x121419, { rough: 0.3, metal: 0.4 }), x, y, z, { ry, r: 0.03 });
    Kit.screen(F, 2.55, 1.65, (c, w, h, t) => {
      t = t || 0;
      c.fillStyle = "#0b0e14"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#e0b060"; c.font = `800 ${h * 0.085}px ${Kit.FONT}`; c.textAlign = "left";
      c.fillText("GOALS BOARD", w * 0.06, h * 0.14);
      c.font = `500 ${h * 0.06}px ${Kit.FONT}`;
      CONTENT.exec.goals.forEach((gl, i) => {
        const on = Math.floor(t * 0.5) % CONTENT.exec.goals.length === i;
        c.fillStyle = on ? "#ffd166" : "rgba(232,236,244,0.82)";
        c.fillText((on ? "▸ " : "• ") + gl, w * 0.07, h * (0.28 + i * 0.112));
      });
      c.fillStyle = "rgba(224,176,96,0.55)"; c.font = `500 ${h * 0.042}px ${Kit.FONT}`;
      c.fillText("status: all in progress, permanently", w * 0.06, h * 0.95);
    }, x + nx * 0.05, y, z + nz * 0.05, ry, { fps: 1, px: 512, decor: false });
    Kit.hot(F, { x: x + nx * 1.4, z: z + nz * 1.4, y: y + 1.1, r: 2.1, label: "The goals board — what's next", ref: CONTENT.exec, focus: { x, y, z }, fn: () => { AudioSys.sfx("open"); UI.panel(CONTENT.exec); } });
  },

  caseBoard(F, cs, x, y, z, ry) {
    const col = "#" + new THREE.Color(cs.accent).getHexString();
    const nx = Math.sin(ry), nz = Math.cos(ry);
    Kit.B(F.group, 2.5, 1.75, 0.06, Kit.M(0x4a3a28, { rough: 0.9 }), x, y, z, { ry, cast: false });
    Kit.poster(F, 2.34, 1.6, (c, w, h) => {
      c.fillStyle = "#c2b08c"; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(90,70,45,${Math.random() * 0.09})`; c.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
      c.save(); c.translate(w * 0.5, h * 0.16); c.rotate(-0.015);
      c.fillStyle = "#f6eedc"; c.fillRect(-w * 0.43, -h * 0.1, w * 0.86, h * 0.2);
      c.fillStyle = "#8c2f2f"; c.font = `800 ${h * 0.06}px Courier, monospace`; c.textAlign = "left"; c.fillText(cs.no, -w * 0.4, -h * 0.02);
      c.fillStyle = "#241c10"; c.font = `800 ${h * 0.075}px ${Kit.FONT}`; c.fillText(cs.title + " · " + cs.role, -w * 0.4, h * 0.065);
      c.restore();
      c.save(); c.translate(w * 0.82, h * 0.34); c.rotate(0.06);
      c.strokeStyle = col; c.lineWidth = 4; c.strokeRect(-w * 0.15, -h * 0.045, w * 0.3, h * 0.09);
      c.fillStyle = col; c.font = `700 ${h * 0.04}px Courier, monospace`; c.textAlign = "center"; c.fillText(cs.dates, 0, h * 0.014);
      c.restore();
      c.save(); c.translate(w * 0.34, h * 0.6); c.rotate(0.01);
      c.fillStyle = "#fdf6e2"; c.fillRect(-w * 0.29, -h * 0.23, w * 0.58, h * 0.46);
      c.fillStyle = "#2c2416"; c.font = `500 ${h * 0.04}px ${Kit.FONT}`; c.textAlign = "left";
      Kit.wrap(c, cs.summary || cs.body || "", w * 0.52).slice(0, 8).forEach((ln, i) => c.fillText(ln, -w * 0.26, -h * 0.16 + i * h * 0.05));
      c.restore();
      c.strokeStyle = "rgba(180,40,40,0.85)"; c.lineWidth = 2.5;
      cs.evidence.forEach((ev, i) => {
        const ex = w * 0.78, ey = h * (0.5 + i * 0.12);
        c.beginPath(); c.moveTo(w * 0.62, h * 0.55); c.lineTo(ex - w * 0.12, ey); c.stroke();
        c.save(); c.translate(ex, ey); c.rotate(-0.03 + i * 0.03);
        c.fillStyle = "#f6eedc"; c.fillRect(-w * 0.14, -h * 0.035, w * 0.28, h * 0.07);
        c.fillStyle = "#241c10"; c.font = `600 ${h * 0.032}px Courier, monospace`; c.textAlign = "center"; c.fillText(ev, 0, h * 0.012);
        c.restore();
        c.fillStyle = "#c0392b"; c.beginPath(); c.arc(ex - w * 0.12, ey, 5, 0, Math.PI * 2); c.fill();
      });
      c.save(); c.translate(w * 0.36, h * 0.92); c.rotate(-0.04);
      c.strokeStyle = "rgba(180,40,40,0.9)"; c.lineWidth = 4; c.strokeRect(-w * 0.28, -h * 0.045, w * 0.56, h * 0.09);
      c.fillStyle = "rgba(180,40,40,0.9)"; c.font = `800 ${h * 0.045}px Courier, monospace`; c.textAlign = "center"; c.fillText(cs.status, 0, h * 0.016);
      c.restore();
    }, x + nx * 0.04, y, z + nz * 0.04, ry, { px: 700, lit: true });
    Kit.light(F, x + nx * 1.2, y + 1.0, z + nz * 1.2, 0xfff0d0, 1.4, 4);
    Kit.hot(F, { x: x + nx * 1.3, z: z + nz * 1.3, y: y + 1.15, r: 2.2, label: `${cs.no} · ${cs.title} — open the file`, ref: cs, focus: { x, y, z }, fn: () => { AudioSys.sfx("open"); UI.caseFile(cs); } });
  },

  rail(F, x1, z1, x2, z2, h = 1.1) {
    const len = Math.hypot(x2 - x1, z2 - z1), ry = -Math.atan2(z2 - z1, x2 - x1), cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(len, h - 0.08), Kit.glassM(0xcfe8ff, 0.18));
    pane.position.set(cx, (h - 0.08) / 2 + 0.04, cz); pane.rotation.y = ry; pane.renderOrder = 2; F.group.add(pane);
    Kit.B(F.group, len, 0.06, 0.09, Kit.metal(0xc8ccd4, 0.25), cx, h, cz, { ry, r: 0.02 });
    Kit.B(F.group, len, 0.04, 0.06, Kit.metal(0x2a2e36, 0.35), cx, 0.03, cz, { ry, r: 0.01 });
    Kit.collide(F, cx, cz, len, 0.25, ry, { aoK: 0.3 });
  },

  starfield(F, x1, x2, z1, z2, y) {
    const N = 500, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { pos[i * 3] = U.rand(x1, x2); pos[i * 3 + 1] = y + U.rand(0, 0.5); pos[i * 3 + 2] = U.rand(z1, z2); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ color: new THREE.Color(0xfff4d8).multiplyScalar(2), size: 0.06, transparent: true, opacity: 0.9, depthWrite: false });
    const pts = new THREE.Points(g, m); F.group.add(pts);
    F.dynamic.push({ update(dt, t) { m.opacity = 0.7 + Math.sin(t * 1.3) * 0.2; pts.rotation.y = Math.sin(t * 0.05) * 0.02; } });
  },
};

/* F1 (Engineering) moved: the Experience floor is the enfilade in floors7.js (Floors.fx2). */

/* F2 (closed-room Projects) became the Projects rotunda: Floors.fp2 in floors7.js. */

/* F3 (the old Hogwarts floor) became the Great Hall: Floors.fe in floors5.js. */

/* F4 (Workshop), F5 (Knowledge Vault) and F6 (Precinct) were merged away in v4:
   skills → the stack wall (floors4.js), books → the Hogwarts library, career → Floors.fx2. */

/* ============================================================
   F7 — EXECUTIVE OFFICE · Real Madrid Suite
   ============================================================ */
Floors.f7 = function (F) {
  shell(F, {
    h: 3.9, elevZ: -7.8,
    floor: Look.mat("wood", 0x4a3020, { tile: 2.4, rough: 0.2, env: 1.2 }),
    wall: Look.mat("panel", 0x3a281a, { tile: 2 }),
    skirt: Kit.M(0x1a120c, { rough: 0.4 }),
    ceil: Kit.M(0x1a120c, { rough: 0.95 }),
    sides: { n: "glass", s: "none", e: "glass", w: "wall" },
    theme: { wood: 0x3a2416, carpet: 0x2a2e3a, metal: 0xd9a441 },
    panels: false,
    mood: {
      exposure: 1.06, hemi: [0x9aa8d8, 0x201410, 0.55], key: [0xffd8a8, 1.5, [0.5, 1, 0.2]], fill: [0x6a88ff, 0.6],
      env: 0.55, fog: [0x0c1020, 60, 240], bloom: [0.55, 0.6, 0.9], ao: 1.0,
      grade: { tint: [1.03, 1.0, 0.97], shadow: [0.04, 0.06, 0.2], high: [0.32, 0.2, 0.04], vig: 0.42, sat: 1.1 },
    },
  });
  // south glass with a balcony door, and the balcony itself
  Kit.curtainWall(F, -14, 10, 5.5, 10, { h: 3.9 });
  Kit.curtainWall(F, 8.5, 10, 14, 10, { h: 3.9 });
  const bd = Kit.cutGroup(F, 5.5, 10, 8.5, 10, 3.9);
  Kit.B(bd, 3.0, 1.4, 0.2, Kit.M(0x1a120c), 7, 3.2, 10, { r: 0.02 });
  Kit.door(F, bd, 7, 10, 0, 2.9, 2.5, "slide");
  F.bounds.z2 = 13.6;
  Kit.floorPlane(F, 7, 11.8, 9, 3.6, Look.mat("tiles", 0x3a3a3e, { n: 4, tile: 1.2, rough: 0.15, metal: 0.3 }), 0);
  Kit.B(F.group, 9.4, 0.5, 4.0, Kit.M(0x15171b, { rough: 0.9 }), 7, -0.28, 11.8, { r: 0.04, cast: false });
  Props.rail(F, 2.5, 13.6, 11.5, 13.6); Props.rail(F, 2.5, 10.2, 2.5, 13.6); Props.rail(F, 11.5, 10.2, 11.5, 13.6);
  Kit.plant(F, 3.4, 12.8, { kind: "palm", s: 1.1, pot: "black", interact: false });
  P(F, "loungeChairRelax", 9.6, 12.2, Math.PI * 0.85, { tint: { carpet: 0xe8e2d4, wood: 0x3a2416 } });
  Kit.hot(F, { x: 7, z: 12.2, y: 2.2, r: 2.4, label: "Breathe. It's raining.", fn: () => UI.say("The city hums below. Rain on your shoulders. Every goal on the board started as a night like this.") });

  // the founder's desk
  Kit.rug(F, 0, -4.6, 7.2, 5.2, 0, { kind: "border", colors: [0x1c2230, 0xd9a441, 0x2a3040] });
  Kit.desk(F, 0, -5.4, Math.PI, { style: "exec", w: 2.4, d: 1.0, monitors: 2, lamp: "banker", screens: ["code", "dash"], clutter: false });
  Kit.chair(F, 0, -6.3, Math.PI, { style: "exec", color: 0x1c120c });
  const plate = Kit.poster(F, 0.9, 0.16, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, "#8a6a26"); g.addColorStop(0.5, "#f0cc70"); g.addColorStop(1, "#8a6a26");
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = "#241c08"; c.font = `800 ${h * 0.5}px ${Kit.FONT}`; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("SPARSH SINHA · FOUNDER", w / 2, h / 2);
  }, 0, 0.84, -4.88, 0, { lit: true, decor: false });
  Kit.B(F.group, 0.2, 0.1, 0.2, Kit.metal(0xc9ccd4, 0.2), 0.9, 0.82, -5.6, { r: 0.02 });
  Kit.mug(F.group, -0.9, 0.765, -5.2, 0xf4f1ea);
  Kit.duck(F.group, -0.6, 0.765, -5.7, 0.8);
  sitSpot(F, 0, -6.3, 0, "Sit in the founder's chair", 0.44);
  Kit.hot(F, { x: 0.4, z: -4.2, y: 1.8, r: 1.8, label: "The mechanical keyboard", fn: () => { let i = 0; const iv = setInterval(() => { AudioSys.sfx("type"); if (++i > 12) clearInterval(iv); }, 75); UI.say("Lubed switches. The rain provides the backing track. This is where ‘next’ gets typed."); } });
  Kit.pendant(F, -0.6, -5.2, { h: 3.9, drop: 1.4, style: "globe", light: true, intensity: 1.4, color: 0xffd8a0 });
  Kit.pendant(F, 0.6, -5.2, { h: 3.9, drop: 1.6, style: "globe", color: 0xffd8a0 });
  // the Madrid wall (west)
  Props.futCard(F, -13.84, 1.85, -1.6, HP);
  Props.jersey(F, -13.84, 1.85, 1.6, HP);
  Kit.frameArt(F, 0.8, 0.55, (c, w, h) => {
    c.fillStyle = "#f4f0e6"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#241c10"; c.textAlign = "center";
    c.font = `700 ${h * 0.16}px ${Kit.FONT}`; c.fillText("SPARSH SINHA", w / 2, h * 0.42);
    c.font = `500 ${h * 0.11}px ${Kit.FONT}`; c.fillStyle = "#8a6a26"; c.fillText("CEO OF MY LIFE", w / 2, h * 0.62);
    c.font = `400 ${h * 0.085}px ${Kit.FONT}`; c.fillStyle = "#6a665a"; c.fillText("(HR approved this reluctantly)", w / 2, h * 0.82);
  }, -13.84, 1.7, 4.2, HP, { frame: Kit.gold() });
  Kit.hot(F, { x: -12.9, z: 4.2, y: 2.4, r: 1.6, label: "A framed business card", fn: () => UI.say(CONTENT.texts.ceoCard) });
  Kit.trophy(F, -12.8, 6.4, { scale: 1.2, label: "La Decimocuarta (replica)", story: CONTENT.texts.trophy14 });
  Kit.trophy(F, -12.8, 8.2, { scale: 0.85, label: "The Shipping Award", story: "For services to production. The pager was quiet for a whole quarter." });
  Kit.screen(F, 2.1, 1.4, (c, w, h, t) => {
    t = t || 0; c.fillStyle = "#0e3a1e"; c.fillRect(0, 0, w, h);
    c.strokeStyle = "rgba(255,255,255,0.65)"; c.lineWidth = 2; c.strokeRect(w * 0.05, h * 0.08, w * 0.9, h * 0.84);
    c.beginPath(); c.moveTo(w / 2, h * 0.08); c.lineTo(w / 2, h * 0.92); c.stroke();
    c.beginPath(); c.arc(w / 2, h / 2, h * 0.14, 0, Math.PI * 2); c.stroke();
    const nm = ["gateway", "auth", "EMR", "queue", "modrić", "cache", "notify"];
    nm.forEach((n, i) => {
      const px = w * (0.18 + (i % 3) * 0.25) + Math.sin(t * 0.8 + i) * 6, py = h * (0.25 + Math.floor(i / 3) * 0.25) + Math.cos(t * 0.6 + i) * 4;
      if (i > 0) { c.strokeStyle = "rgba(255,209,102,0.4)"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(px, py); c.lineTo(w * (0.18 + ((i - 1) % 3) * 0.25), h * (0.25 + Math.floor((i - 1) / 3) * 0.25)); c.stroke(); }
      c.fillStyle = i === 4 ? "#ffd166" : "#e8ecf4"; c.beginPath(); c.arc(px, py, 7, 0, Math.PI * 2); c.fill();
      c.font = `500 ${h * 0.05}px ${Kit.FONT}`; c.textAlign = "center"; c.fillText(n, px, py + 18);
    });
  }, -13.84, 1.85, -4.6, HP, { fps: 3, px: 448, glow: 1.05 });
  Kit.hot(F, { x: -12.7, z: -4.6, y: 3.0, r: 1.9, label: "The tactics board", fn: () => UI.say(CONTENT.texts.tactics) });
  // goals board (freestanding, facing the desk)
  const gb = Kit.grp(F, 6.4, -6.8, -0.5);
  Kit.B(gb, 0.1, 1.0, 0.1, Kit.M(0x1a120c), -1.1, 0.5, 0, { r: 0.02 }); Kit.B(gb, 0.1, 1.0, 0.1, Kit.M(0x1a120c), 1.1, 0.5, 0, { r: 0.02 });
  Kit.colLocal(F, gb, 0, 0, 2.6, 0.4);
  Props.goals(F, 6.4, 1.9, -6.8, -0.5);
  // lounge + chess + espresso
  Kit.rug(F, -5.2, 5.2, 6, 4.4, 0, { kind: "persian", colors: [0x1c2230, 0xd9a441, 0x3a1a1a] });
  P(F, "loungeSofaLong", -5.6, 6.6, Math.PI, { tint: { carpet: 0x2a2e3a, wood: 0x1a120c } });
  P(F, "tableCoffeeGlass", -5.2, 4.8, 0, { tint: { metal: 0xd9a441 } });
  P(F, "loungeDesignChair", -2.4, 4.6, -HP, { tint: { carpet: 0x7a2a20, metal: 0xd9a441 } });
  Kit.floorLamp(F, -8.4, 7.8, { intensity: 1.2 });
  sitSpot(F, -5.0, 6.6, Math.PI, "Sit with the skyline");
  Kit.chessTable(F, -1.6, 7.6);
  Kit.coffeeBar(F, 13.3, -2.4, -HP, { w: 2.2, machine: 0x1d1e22 });
  P(F, "bookcaseOpenLow", -9.6, -9.5, 0, { tint: { wood: 0x2a1a10 } });
  P(F, "bookcaseOpenLow", -8.8, -9.5, 0, { tint: { wood: 0x2a1a10 } });
  Kit.plant(F, 13.2, -9.2, { kind: "fiddle", s: 1.3, pot: "black" });
  Kit.plant(F, -8.8, -9.2, { kind: "monstera", s: 1.2, pot: "brass", interact: false });
  Kit.plant(F, 13.2, 9.2, { kind: "snake", s: 1.2, pot: "black", interact: false });
  Kit.football(F, 3.6, 3.4);
  F.npcSpecs.push({ model: "character-female-e", x: 5, z: 1, behavior: "route", speed: 0.7, hold: "cup", quotes: "exec", waypoints: [[5, 1, 4], [-3, 1, 3], [-3, 3, 5], [4, 3, 2]] });
};
