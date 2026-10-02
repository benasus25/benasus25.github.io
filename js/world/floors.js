/* ============================================================
   SPARSH HQ v3 — floors.js
   Set dressing. Architecture is ours; furniture and people are
   Kenney's CC0 models placed by hand. x east, z south (metres).
   Every floor: 28 × 20 m, elevator on the west wall.
   ============================================================ */

/* Kenney models natively face +z; P() turns them to face direction ry */
const ROT = {};

/* place a Kenney model: front faces the direction ry */
function P(F, name, x, z, ry = 0, o = {}) { return Assets.place(F, name, x, z, ry + (ROT[name] || 0), o); }

/* seated person: returns spec to push */
const SEAT_Y = 0.42;

function shell(F, o = {}) {
  // every room is at least 4.8 m tall: the camera can sit high enough to show the whole space
  const W = o.w || 28, D = o.d || 20, H = Math.max(o.h || 0, 4.8);
  F.bounds = { x1: -W / 2, z1: -D / 2, x2: W / 2, z2: D / 2 };
  F.ceilH = H;
  F.wallMat = o.wall || Look.mat("plaster", 0xe8e2d8, { tile: 2 });
  F.skirtMat = o.skirt || Kit.M(0x2a241e, { rough: 0.5 });
  F.theme = o.theme || null;
  F.mood = o.mood || {};
  F.elevation = o.elevation !== undefined ? o.elevation : 6 + (typeof F.idx === "number" ? F.idx : 0) * 4.5;
  F.aoStrength = o.ao || 0.42;
  Kit.B(F.group, W + 1.2, 0.8, D + 1.2, Kit.M(0x15171b, { rough: 0.9 }), 0, -0.43, 0, { r: 0.08, cast: false });
  Kit.floorPlane(F, 0, 0, W, D, o.floor || Look.mat("wood", 0x8a6440, { tile: 2.2 }));
  Kit.ceiling(F, 0, 0, W, D, H, o.ceil || Kit.M(0xf2eee6, { rough: 0.95 }));
  const sides = Object.assign({ n: "glass", s: "glass", e: "glass", w: "wall" }, o.sides || {});
  const run = (side, x1, z1, x2, z2) => {
    const s = sides[side];
    const type = typeof s === "string" ? s : s.type;
    if (type === "glass") Kit.curtainWall(F, x1, z1, x2, z2, { h: H, tint: o.tint });
    else if (type === "wall") Kit.wallRun(F, x1, z1, x2, z2, { gaps: s.gaps, mat: s.mat });
  };
  run("n", -W / 2, -D / 2, W / 2, -D / 2);
  run("s", -W / 2, D / 2, W / 2, D / 2);
  run("e", W / 2, -D / 2, W / 2, D / 2);
  run("w", -W / 2, -D / 2, -W / 2, D / 2);
  if (o.elev !== false) {
    const ez = o.elevZ !== undefined ? o.elevZ : 0;
    Kit.elevator(F, -W / 2 + 0.55, ez, Math.PI / 2);
    F.spawn = F.elevator.spawn;
  }
  if (o.panels !== false) {
    const cols = o.pcols || 5, rows = o.prows || 3;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++)
      Kit.ceilPanel(F, -W / 2 + W * (i + 0.5) / cols, -D / 2 + D * (j + 0.5) / rows, 1.6, 0.45, H, o.panelColor || 0xfff4e0, 1.2);
  }
}

/* a workstation: desk + chair + monitor(s) + clutter (+ optional seated NPC). Front (sitter side) faces ry. */
function ws(F, x, z, ry, o = {}) {
  P(F, "desk", x, z, ry, { theme: o.theme, s: 0.9 });
  const c = Math.cos(ry), s = Math.sin(ry);
  const local = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
  // monitor + keyboard via our screen kit (animated code/dashboards)
  const g = Kit.grp(F, x, z, ry);
  const top = 0.69;
  const mons = o.monitors || 1;
  const bez = Kit.M(0x15161a, { rough: 0.35, metal: 0.4 });
  for (let i = 0; i < mons; i++) {
    const mx = mons === 1 ? 0 : (i - 0.5) * 0.62;
    const mg = new THREE.Group(); mg.position.set(mx, top, -0.22); mg.rotation.y = mons === 1 ? 0 : (i ? -0.2 : 0.2); g.add(mg);
    Kit.B(mg, 0.2, 0.014, 0.16, bez, 0, 0.007, 0, { r: 0.006 });
    Kit.B(mg, 0.045, 0.24, 0.035, bez, 0, 0.13, -0.02, { r: 0.012 });
    Kit.B(mg, 0.62, 0.38, 0.03, bez, 0, 0.36, 0, { r: 0.014 });
    const scr = new THREE.Mesh(Kit.geo("wsscr", () => new THREE.PlaneGeometry(0.575, 0.335)), new THREE.MeshBasicMaterial({ map: Kit.poolTex(o.screens ? o.screens[i % o.screens.length] : U.pick(["code", "dash", "term", "chart"])) }));
    scr.position.set(0, 0.36, 0.016); mg.add(scr);
  }
  Kit.B(g, 0.44, 0.02, 0.15, Kit.M(0x24262c, { rough: 0.5 }), 0, top + 0.012, 0.08, { r: 0.006 });
  Kit.S(g, 0.03, Kit.M(0x24262c), 0.33, top + 0.02, 0.1, { sy: 0.5, sz: 1.4, cast: false });
  const R = Kit.seeded(x, z);
  if (o.clutter !== false) {
    if (R() < 0.7) Kit.mug(g, -0.5, top, 0.12, U.pick([0xe8e2d4, 0xc0392b, 0x2e86c1, 0x27ae60]));
    if (R() < 0.5) P(F, "plantSmall" + (1 + Math.floor(R() * 3)), 0, 0, 0, { parent: g, y: top, s: 0.7 }).position.set(0.52, top, -0.2);
    if (R() < 0.45) Kit.papers(g, -0.42, top + 0.004, -0.12, R() - 0.5);
    if (R() < 0.18) Kit.duck(g, 0.45, top, 0.15, 0.7);
  }
  if (o.chair !== false) {
    const [cx, cz] = local(0, 0.72);
    P(F, "chairDesk", cx, cz, ry + Math.PI + (o.chairTurn || 0), { collide: false, s: 1.05 });
    Kit.collide(F, cx, cz, 0.6, 0.6, 0, { aoK: 0.4 });
    if (o.npc) F.npcSpecs.push(Object.assign({ x: cx, z: cz - (0) , ry: ry + Math.PI, behavior: "type", seatY: SEAT_Y }, o.npc === true ? {} : o.npc));
  }
  return g;
}

/* lounge cluster: rug + sofa + chairs + coffee table + lamp */
function lounge(F, x, z, ry, o = {}) {
  const c = Math.cos(ry), s = Math.sin(ry);
  const L = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
  Kit.rug(F, x, z, o.rw || 4.2, o.rd || 3.2, ry, { kind: o.rug || "border", colors: o.rugColors || [0x2c3440, 0xc9a86a, 0x6a2a2a] });
  let [a, b] = L(0, -1.1); P(F, o.sofa || "loungeSofa", a, b, ry, { theme: o.theme });
  [a, b] = L(0, 0.15); P(F, o.table || "tableCoffee", a, b, ry, { theme: o.theme, s: 0.85 });
  if (o.chairs !== false) {
    [a, b] = L(-1.55, 0.5); P(F, o.chair || "loungeChair", a, b, ry + Math.PI * 0.72, { theme: o.theme });
    [a, b] = L(1.55, 0.5); P(F, o.chair || "loungeChair", a, b, ry - Math.PI * 0.72, { theme: o.theme });
  }
  if (o.lamp !== false) { [a, b] = L(-1.6, -1.2); P(F, "lampRoundFloor", a, b, 0, { theme: o.theme }); Kit.light(F, a, 1.65, b, 0xffd9a0, 0.7, 5); }
  if (o.plant !== false) { [a, b] = L(1.7, -1.25); P(F, "pottedPlant", a, b, 0); }
  // cup + book on the coffee table
  [a, b] = L(0.25, 0.15); Kit.mug(F.group, a, 0.46, b, 0xf4f1ea);
  [a, b] = L(-0.3, 0.2); P(F, "books", a, b, ry + 0.3, { y: 0.46, collide: false, s: 0.8 });
}

/* sittable spot */
function sitSpot(F, x, z, ry, label = "Sit for a moment", y = SEAT_Y) {
  Kit.hot(F, { x, z, y: 1.3, r: 1.3, label, fn: () => Game.sit({ x, z, ry, y }) });
}

/* a whole meeting table with chairs */
function meeting(F, x, z, o = {}) {
  const w = o.w || 3.2, d = o.d || 1.4;
  const top = o.top || Kit.M(0x3a2c20, { rough: 0.3, env: 1.2 });
  Kit.B(F.group, w, 0.06, d, top, x, 0.76, z, { r: 0.03 });
  Kit.B(F.group, w * 0.5, 0.72, 0.18, Kit.metal(0x2a2c32, 0.35), x, 0.37, z, { r: 0.04 });
  Kit.B(F.group, w * 0.7, 0.04, d * 0.6, Kit.metal(0x2a2c32, 0.35), x, 0.02, z, { r: 0.02 });
  Kit.collide(F, x, z, w, d);
  const n = o.n || 3;
  for (let i = 0; i < n; i++) {
    const cx = x - w / 2 + (w / n) * (i + 0.5);
    P(F, o.chair || "chairModernCushion", cx, z - d / 2 - 0.45, 0, { collide: false, theme: o.theme });
    P(F, o.chair || "chairModernCushion", cx, z + d / 2 + 0.45, Math.PI, { collide: false, theme: o.theme });
  }
  Kit.collide(F, x, z, w, d + 1.6, 0, { ao: false });
  if (o.laptops) for (let i = 0; i < n; i++) Kit.B(F.group, 0.3, 0.015, 0.22, Kit.metal(0xb8bcc4), x - w / 2 + (w / n) * (i + 0.5), 0.8, z - 0.3, { r: 0.006 });
}

const Floors = {

  /* ============================================================
     PLAZA — arrival in the rain
     ============================================================ */
  P(F) {
    F.bounds = { x1: -15, z1: -11.4, x2: 15, z2: 13 };
    F.ceilH = 30;
    F.elevation = 0;
    F.spawn = { x: 0, z: 8.8, ry: Math.PI };
    F.aoStrength = 0.5;
    F.mood = {
      exposure: 1.1, hemi: [0x8aa0d0, 0x20242e, 0.7], key: [0xb8c8ff, 0.9, [-0.4, 1, 0.5]], fill: [0xffb070, 0.35],
      env: 0.4, fog: [0x10141f, 40, 190], bloom: [0.4, 0.55, 1.0], ao: 0.8,
      grade: { tint: [0.97, 1.0, 1.06], shadow: [0.05, 0.1, 0.25], high: [0.3, 0.18, 0.05], vig: 0.42, sat: 1.1 },
    };
    const wet = Look.mat("concrete", 0x2a2d33, { tile: 3, rough: 0.16, metal: 0.25, env: 1.4 });
    Kit.floorPlane(F, 0, 0, 60, 60, Look.mat("concrete", 0x1d1f24, { tile: 4, rough: 0.12, metal: 0.3, env: 1.2 }), -0.02);
    Kit.floorPlane(F, 0, -2, 30, 19, Look.mat("tiles", 0x5a5c62, { n: 4, tile: 2.4, rough: 0.2, metal: 0.15, env: 1.4 }));
    // street
    Kit.floorPlane(F, 0, 16.5, 80, 7, Look.mat("concrete", 0x141519, { tile: 5, rough: 0.1, metal: 0.35, env: 1.5 }), 0.005);
    for (let i = -8; i <= 8; i++) Kit.B(F.group, 2.2, 0.01, 0.14, Kit.M(0xe8e2c8, { rough: 0.4 }), i * 4.4, 0.012, 16.5, { r: 0.002, cast: false });
    Kit.B(F.group, 80, 0.16, 0.3, Kit.M(0x6a6c72, { rough: 0.6 }), 0, 0.08, 12.95, { r: 0.03, cast: false });
    // puddles
    for (const [px, pz, r] of [[-5, 4, 1.1], [6, 6.5, 0.8], [-8, -3, 0.9], [3, 10.5, 1.3], [9, 0, 0.7]]) {
      const pd = new THREE.Mesh(new THREE.CircleGeometry(r, 28), Kit.M(0x3a4458, { rough: 0.03, metal: 1.0, env: 1.6, opacity: 0.55 }));
      pd.rotation.x = -Math.PI / 2; pd.scale.set(1.4, 1, 1); pd.position.set(px, 0.012, pz); pd.receiveShadow = true;
      F.group.add(pd);
    }
    // red carpet
    Kit.rug(F, 0, 1.5, 2.6, 21, 0, { kind: "border", colors: [0x4a0f1a, 0xd9a441, 0x2a070e] });
    Kit.stanchions(F, -1.8, -6, -1.8, 6, 5); Kit.stanchions(F, 1.8, -6, 1.8, 6, 5);

    /* ---- the tower ---- */
    const facadeM = Kit.M(0x1a1d24, { rough: 0.35, metal: 0.5, env: 1.2 });
    const winTex = Kit.canvasTex(512, 1024, (c, w, h) => {
      c.fillStyle = "#0a0d14"; c.fillRect(0, 0, w, h);
      const R = Look.rng(9);
      for (let y = 0; y < 40; y++) for (let x = 0; x < 16; x++) {
        const lit = R() < 0.42;
        c.fillStyle = lit ? (R() < 0.85 ? `rgba(255,${200 + R() * 40 | 0},${140 + R() * 50 | 0},1)` : "rgba(160,210,255,1)") : "rgba(30,40,60,1)";
        c.fillRect(x * 32 + 3, y * 25.6 + 3, 26, 19);
      }
    });
    winTex.wrapS = winTex.wrapT = THREE.RepeatWrapping; winTex.repeat.set(2, 3);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x141820, roughness: 0.2, metalness: 0.6, emissive: 0xffffff, emissiveMap: winTex, emissiveIntensity: 0.55 });
    const tower = new THREE.Mesh(new THREE.BoxGeometry(26, 70, 14), towerMat);
    tower.position.set(0, 5.2 + 35, -19); F.group.add(tower);
    for (let i = 0; i < 16; i++) Kit.B(F.group, 0.35, 70, 0.4, facadeM, -13 + i * (26 / 15), 5.2 + 35, -11.9, { r: 0.04, cast: false });
    // podium (lobby level)
    Kit.B(F.group, 30, 0.6, 1.4, facadeM, 0, 5.0, -11.8, { r: 0.1 });
    Kit.B(F.group, 30, 0.08, 0.2, Kit.G(0xffc36a, 1.8), 0, 4.66, -11.1, { r: 0.02, cast: false });
    // lobby glass with warm interior glow behind it
    const glow = Kit.canvasTex(1024, 256, (c, w, h) => {
      const g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#3a2414"); g.addColorStop(0.5, "#b07038"); g.addColorStop(1, "#5a3418");
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 12; i++) { c.fillStyle = "rgba(20,10,4,0.55)"; c.fillRect(40 + i * 82, 60, 20, 196); }
      c.fillStyle = "rgba(255,210,140,0.9)"; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(120 + i * 200, 40, 18, 0, Math.PI * 2); c.fill(); }
    });
    const inner = new THREE.Mesh(new THREE.PlaneGeometry(28, 4.6), new THREE.MeshBasicMaterial({ map: glow, color: new THREE.Color(1.1, 1.1, 1.1) }));
    inner.position.set(0, 2.3, -13.2); F.group.add(inner);
    Kit.curtainWall(F, -14, -11.4, -2.3, -11.4, { h: 4.6 });
    Kit.curtainWall(F, 2.3, -11.4, 14, -11.4, { h: 4.6 });
    Kit.B(F.group, 4.8, 0.3, 0.4, facadeM, 0, 3.05, -11.4, { r: 0.04 });
    // sliding entrance doors
    const dg = new THREE.Group(); F.group.add(dg);
    Kit.door(F, dg, 0, -11.4, 0, 4.4, 2.9, "slide");
    // canopy + downlights
    Kit.B(F.group, 9, 0.28, 4.2, Kit.M(0x121419, { rough: 0.3, metal: 0.6 }), 0, 3.7, -9.6, { r: 0.06 });
    Kit.B(F.group, 8.6, 0.04, 3.9, Kit.M(0x3a2a18, { rough: 0.4, metal: 0.6, env: 1.5 }), 0, 3.55, -9.6, { r: 0.01, cast: false });
    for (let i = 0; i < 5; i++) Kit.C(F.group, 0.12, 0.12, 0.03, Kit.G(0xffd9a0, 3), -3.6 + i * 1.8, 3.53, -9.6, { seg: 16, cast: false });
    for (const sx of [-4.3, 4.3]) Kit.B(F.group, 0.18, 3.6, 0.18, Kit.gold(), sx, 1.8, -7.7, { r: 0.04 });
    Kit.collide(F, -4.3, -7.7, 0.3, 0.3); Kit.collide(F, 4.3, -7.7, 0.3, 0.3);
    Kit.light(F, 0, 3.2, -8.8, 0xffcf90, 5, 11);
    Kit.light(F, 0, 2.2, -12.5, 0xffa860, 4, 9);
    // marquee
    Kit.neon(F, "S P A R S H   H Q", 0xff6b57, 0, 7.6, -11.2, 0, { size: 1.4, px: 1024, glow: 2.2, plate: false });
    Kit.poster(F, 12, 0.7, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.font = `500 ${h * 0.5}px ${Kit.FONT}`; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillStyle = "rgba(255,236,210,0.9)";
      c.fillText("welcome to the building where every room ships software", w / 2, h / 2);
    }, 0, 6.3, -11.2, 0, { transparent: true, glow: 1.3 });
    Kit.light(F, 0, 7.5, -9.5, 0xff6b57, 3, 14);

    /* ---- street life ---- */
    for (const sx of [-11, -5.5, 5.5, 11]) {
      const g = Kit.grp(F, sx, 11.8, 0);
      Kit.C(g, 0.07, 0.1, 5.2, Kit.M(0x1b1e24, { metal: 0.6, rough: 0.4 }), 0, 2.6, 0, { seg: 10 });
      Kit.B(g, 1.1, 0.08, 0.1, Kit.M(0x1b1e24, { metal: 0.6, rough: 0.4 }), -0.45, 5.15, 0, { r: 0.02 });
      Kit.B(g, 0.5, 0.12, 0.3, Kit.M(0x1b1e24), -0.9, 5.05, 0, { r: 0.04 });
      Kit.B(g, 0.44, 0.03, 0.24, Kit.G(0xfff0d0, 3), -0.9, 4.98, 0, { r: 0.01, cast: false });
      Kit.light(F, sx - 0.9, 4.6, 11.8, 0xffe2b0, 3.2, 12);
      Kit.collide(F, sx, 11.8, 0.3, 0.3);
    }
    for (const [tx, tz] of [[-9, -6], [9, -6], [-9, 3], [9, 3], [-13, 9], [13, 9]]) Kit.tree(F, tx, tz, { s: 1 });
    for (const [bx, bz, br] of [[-6.5, -1, Math.PI / 2], [6.5, -1, -Math.PI / 2], [-6.5, 6, Math.PI / 2], [6.5, 6, -Math.PI / 2]]) P(F, "benchCushion", bx, bz, br, { s: 1.9, tint: { wood: 0x6a4a30, carpet: 0x7a2a2a } });
    for (const px of [-3, 3]) Kit.plant(F, px, -10.4, { kind: "palm", s: 1.3, pot: "black", interact: false });
    // across the street
    const across = ["building-a", "building-c", "building-e", "building-g", "building-b", "building-d", "building-h", "building-f"];
    across.forEach((n, i) => {
      const b = Assets.building(F.group, n, -36 + i * 10.5, 36, Math.PI, 10.5);
      if (b) b.traverse((m) => { if (m.isMesh && !m.material._night) { m.material = m.material.clone(); m.material._night = true; m.material.color.multiplyScalar(0.55); m.material.emissive = new THREE.Color(0xffd9a0); m.material.emissiveMap = m.material.map; m.material.emissiveIntensity = 0.12; } });
    });
    // vertical blade sign down the tower corner (Continental-hotel style) + roof beacon
    const blade = Kit.grp(F, 11.2, -11.9, 0, 6.5);
    Kit.B(blade, 1.7, 15.5, 0.4, Kit.M(0x14161c, { rough: 0.3, metal: 0.6 }), 0, 7.75, 0, { r: 0.08 });
    "SPARSHHQ".split("").forEach((ch, i) => {
      Kit.poster(F, 1.5, 1.6, (c, w, h) => {
        c.clearRect(0, 0, w, h); c.font = `800 ${h * 0.78}px ${Kit.FONT}`; c.textAlign = "center"; c.textBaseline = "middle";
        c.shadowColor = "#ff6b57"; c.shadowBlur = 24; c.fillStyle = "#ff8a70"; c.fillText(ch, w / 2, h / 2 + 4);
        c.shadowBlur = 0; c.fillStyle = "#fff0e8"; c.fillText(ch, w / 2, h / 2 + 4);
      }, 11.2, 6.5 + 14.4 - i * 1.8 - (i > 5 ? 0.6 : 0), -11.68, 0, { transparent: true, glow: 2.2, px: 192, decor: false });
    });
    Kit.light(F, 11.2, 14, -10.2, 0xff6b57, 6, 16);
    const beacon = Kit.S(F.group, 0.4, Kit.G(0xff3030, 4), 0, 75.8, -19);
    Kit.C(F.group, 0.12, 0.12, 5, Kit.M(0x2a2e36, { metal: 0.6 }), 0, 73, -19, { seg: 8 });
    F.dynamic.push({ update(dt, t) { beacon.visible = Math.sin(t * 3) > 0.2; } });
    Kit.floorPlane(F, 0, 26, 90, 12, Look.mat("tiles", 0x4a4c52, { n: 4, tile: 2.4, rough: 0.2, metal: 0.15, env: 1.3 }), 0.004);
    for (const tx of [-24, -12, 0, 12, 24]) Kit.tree(F, tx + 5, 24, { s: 1.1 });
    P(F, "benchCushion", -12, 14.6, Math.PI, { s: 1.9 });
    const para = Assets.building(F.group, "detail-parasol-a", -8, 27, 0, 6);

    /* ---- people ---- */
    F.npcSpecs.push({ model: "character-male-f", x: 2.7, z: -8.6, ry: Math.PI * 0.85, behavior: "idle", quotes: "concierge", greeting: "Good evening. They're expecting you." });
    F.npcSpecs.push({ model: "character-female-c", x: -8, z: 8, behavior: "route", hold: "phone", speed: 1.0, waypoints: [[-8, 8, 2], [-12, 1, 1], [-6, -4, 3], [-11, 4, 1]] });
    F.npcSpecs.push({ model: "character-male-b", x: 7.5, z: 9.8, ry: -1.2, behavior: "chat" });
    F.npcSpecs.push({ model: "character-female-a", x: 6.6, z: 9.2, ry: 2.0, behavior: "chat", quotes: "dev" });

    // entering the building
    let entered = false;
    F.dynamic.push({ update() {
      const p = Game.player;
      if (Game.state === "play" && p.z < -10.9 && Math.abs(p.x) < 1.8 && !entered) {
        entered = true;
        AudioSys.sfx("doors");
        Game.loadFloor(0, { spawn: { x: 0, z: 5.6, ry: Math.PI }, yawOffset: 0 });
        setTimeout(() => { entered = false; }, 1500);
        if (!Game.guide.met) setTimeout(() => Guide.meet(), 350);
      }
    }});
    Kit.hot(F, { x: 0, z: -9.2, y: 2.6, r: 2.2, label: "Walk in", fn: () => Game.walkTo(0, -11.2, null) });
  },

  /* ============================================================
     F0 — RECEPTION · The Continental
     ============================================================ */
  f0(F) {
    shell(F, {
      h: 4.2, elevation: 0.2,
      floor: Look.mat("marble", 0x4a3a2e, { v: "rgba(236,200,140,A)", tile: 3.2, rough: 0.14, env: 1.1 }),
      wall: Look.mat("damask", 0x3a2418, { c2: "rgba(214,160,80,0.22)", tile: 1.1, rough: 0.8 }),
      skirt: Kit.M(0x1a120c, { rough: 0.35 }),
      ceil: Kit.M(0x2a1c14, { rough: 0.9 }),
      sides: { n: "wall", s: "none", e: "glass", w: "wall" },
      elevZ: -6, panels: false, tint: 0xffd9a0,
      theme: { wood: 0x3a2416, carpet: 0x6a1c28, metal: 0xd9a441 },
      mood: {
        exposure: 1.05, hemi: [0xffe0c0, 0x2a160c, 0.55], key: [0xffc890, 1.6, [0.35, 1, 0.55]], fill: [0x8ea8ff, 0.3],
        env: 0.5, fog: [0x140c08, 40, 160], bloom: [0.35, 0.5, 1.0], ao: 1.0,
        grade: { tint: [1.05, 1.0, 0.93], shadow: [0.12, 0.04, 0.12], high: [0.35, 0.2, 0.02], vig: 0.4, sat: 1.12 },
      },
    });
    // entrance: glass with sliding doors on the south wall
    Kit.curtainWall(F, -14, 10, -2.3, 10, { h: 4.2 });
    Kit.curtainWall(F, 2.3, 10, 14, 10, { h: 4.2 });
    const dg = Kit.cutGroup(F, -2.4, 10, 2.4, 10, 4.2);
    Kit.B(dg, 4.8, 1.3, 0.3, Kit.M(0x1a120c, { rough: 0.4 }), 0, 3.55, 10, { r: 0.03 });
    Kit.door(F, dg, 0, 10, 0, 4.4, 2.9, "slide");
    F.spawn = { x: 0, z: 5.6, ry: Math.PI };

    /* ---- grand axis: runner, ropes, desk, logo ---- */
    Kit.rug(F, 0, 3.4, 2.8, 11.5, 0, { kind: "border", colors: [0x4a0f1a, 0xd9a441, 0x2a070e] });
    Kit.stanchions(F, -1.9, 0.2, -1.9, 7.2, 4); Kit.stanchions(F, 1.9, 0.2, 1.9, 7.2, 4);
    Kit.receptionDesk(F, 0, -3.3, { r: 2.8 });
    Kit.bell(F, 0.9, 1.12, -3.75);
    Kit.B(F.group, 0.5, 0.06, 0.34, Kit.M(0xece4d0, { rough: 0.8 }), -0.9, 1.13, -3.8, { r: 0.01, ry: 0.2 });   // ledger

    P(F, "lampRoundTable", -1.9, -4.7, 0, { y: 1.1, collide: false, s: 0.9 });
    Kit.light(F, -1.9, 1.9, -4.7, 0xffd9a0, 0.6, 4);
    F.npcSpecs.push({ model: "character-female-e", x: 0.2, z: -5.4, ry: 0, behavior: "idle", quotes: "concierge", greeting: "Welcome to Sparsh HQ. I'm NOVA." });
    Kit.hot(F, { x: 0, z: -2.2, y: 2.1, r: 2.1, label: "Talk to NOVA", fn: () => ChatBot.open(true) });
    // guest book on a lectern
    const gb = Kit.grp(F, 3.8, -2.2, -0.4);
    Kit.B(gb, 0.5, 1.0, 0.4, Kit.M(0x2a1a10, { rough: 0.4 }), 0, 0.5, 0, { r: 0.03 });
    Kit.B(gb, 0.62, 0.05, 0.46, Kit.M(0x2a1a10, { rough: 0.4 }), 0, 1.02, 0, { r: 0.02, rx: -0.25 });
    Kit.B(gb, 0.52, 0.03, 0.36, Kit.M(0xf2ead6, { rough: 0.8 }), 0, 1.06, 0.01, { r: 0.01, rx: -0.25 });
    Kit.C(gb, 0.006, 0.006, 0.16, Kit.gold(), 0.12, 1.1, 0.05, { rz: 1.2, seg: 5, cast: false });
    Kit.colLocal(F, gb, 0, 0, 0.6, 0.5);
    Kit.hot(F, { x: 3.8, z: -2.2, y: 1.7, r: 1.7, label: "Sign the guest book", fn: () => UI.openGuestbook(false) });

    // north wall: the backdrop
    Kit.neon(F, "SPARSH HQ", 0xffc36a, 0, 3.4, -9.76, 0, { size: 0.55, glow: 1.9, plate: false });
    Kit.poster(F, 7, 0.34, (c, w, h) => { c.clearRect(0, 0, w, h); c.font = `500 ${h * 0.62}px ${Kit.FONT}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#e9cf9a"; c.fillText(CONTENT.profile.motto.toUpperCase().split("").join(" "), w / 2, h / 2); }, 0, 2.72, -9.76, 0, { transparent: true, glow: 1.3 });
    Kit.B(F.group, 9.5, 3.2, 0.06, Kit.M(0x120c08, { rough: 0.3, env: 1.3 }), 0, 2.3, -9.86, { r: 0.02, cast: false });
    for (const sx of [-5.6, 5.6]) {
      Kit.art(F, sx, 2.3, -9.85, 0, sx > 0 ? 7 : 3, 1.6, 2.0);
      Kit.sconce(F, sx - 1.25, 2.6, -9.9, 0); Kit.sconce(F, sx + 1.25, 2.6, -9.9, 0);
    }
    Kit.wallClock(F, -9.5, 2.9, -9.88, 0);
    for (const px of [-3.4, 3.4]) Kit.plant(F, px, -8.9, { kind: "palm", s: 1.25, pot: "brass", interact: px < 0 });

    // pillars
    for (const px of [-6, 6]) for (const pz of [-1.5, 5.5]) {
      const pg = Kit.cutGroup(F, px - 0.45, pz, px + 0.45, pz, 4.2);
      Kit.C(pg, 0.42, 0.42, 4.2, Look.mat("marble", 0xe6ded0, { rough: 0.2, tile: 1.3 }), px, 2.1, pz, { seg: 24 });
      Kit.C(pg, 0.55, 0.55, 0.3, Kit.gold(), px, 0.15, pz, { seg: 24 });
      Kit.C(pg, 0.55, 0.47, 0.34, Kit.gold(), px, 4.03, pz, { seg: 24 });
      Kit.collide(F, px, pz, 1.1, 1.1);
    }
    Kit.chandelier(F, 0, 1.2, { h: 4.2, drop: 1.1, r: 0.95, n: 12, intensity: 3.2, dist: 14 });
    Kit.chandelier(F, 0, 6.8, { h: 4.2, drop: 1.0, r: 0.7, n: 10, intensity: 2.0, dist: 10 });

    /* ---- the lounge (south-west) with fireplace ---- */
    Kit.fireplace(F, -13.7, 5, Math.PI / 2, { stone: Look.mat("marble", 0x2a2018, { v: "rgba(217,164,65,A)", rough: 0.2, tile: 1.2 }) });
    Kit.art(F, -13.87, 3.0, 5, Math.PI / 2, 11, 1.3, 0.9);
    Kit.rug(F, -9.8, 5, 4.6, 5.2, 0, { kind: "persian", colors: [0x4a1a1a, 0xd9a441, 0x1a2a3a] });
    P(F, "loungeDesignSofa", -9.6, 7.2, Math.PI, { tint: { carpet: 0x4a2a20, wood: 0x2a1a10, metal: 0xd9a441 } });
    P(F, "loungeDesignSofa", -9.6, 2.9, 0, { tint: { carpet: 0x4a2a20, wood: 0x2a1a10, metal: 0xd9a441 } });
    P(F, "tableCoffee", -9.6, 5.0, 0, { tint: { wood: 0x2a1a10 } });
    Kit.mug(F.group, -9.3, 0.46, 5.0, 0xf4f1ea);
    P(F, "books", -9.95, 5.1, 0.4, { y: 0.46, collide: false, s: 0.8 });
    P(F, "lampSquareFloor", -12.6, 8.4, 0, { tint: { metal: 0xd9a441 } });
    Kit.light(F, -12.6, 1.6, 8.4, 0xffd09a, 0.7, 5);
    P(F, "bookcaseOpenLow", -7.2, 9.55, Math.PI, { tint: { wood: 0x2a1a10 } });
    Kit.plant(F, -13.2, 9.2, { kind: "monstera", s: 1.1, pot: "black" });
    F.npcSpecs.push({ model: "character-male-b", x: -10.1, z: 7.25, ry: Math.PI, behavior: "sit", seatY: SEAT_Y, quotes: "dev" });
    sitSpot(F, -9.0, 2.85, 0, "Sink into the lounge");

    /* ---- the café (north-east), behind a glass screen ---- */
    Kit.glassRun(F, 7, -3.2, 14, -3.2, { h: 4.2, gaps: [[0.4, 2.2, "open"]], bandText: "CAFÉ" });
    Kit.rug(F, 10.5, -6.5, 6.8, 6.4, 0, { kind: "geo", colors: [0x2a1c14, 0x5a3a24, 0x3a2618] });
    Kit.coffeeBar(F, 10.6, -9.25, 0, { w: 4.8, machine: 0x2a2a2e });
    Kit.neon(F, "CAFÉ", 0xffb46a, 10.6, 2.6, -9.86, 0, { size: 0.48, glow: 1.8 });
    for (const px of [9.0, 10.6, 12.2]) Kit.pendant(F, px, -8.6, { h: 4.2, drop: 1.5, style: "dome", color: 0xffc98a, light: px === 10.6, intensity: 1.2, shade: Kit.gold() });
    for (let i = 0; i < 4; i++) P(F, "stoolBar", 8.9 + i * 1.15, -8.1, 0, { tint: { wood: 0x2a1a10, carpet: 0x6a1c28 }, collide: false });
    for (const [tx, tz] of [[9.2, -5.0], [12.2, -5.0]]) {
      Kit.table(F, tx, tz, 0, { style: "round", w: 0.9, h: 0.74, top: Look.mat("marble", 0xe8e4dc, { rough: 0.15, tile: 1 }) });
      P(F, "chairModernCushion", tx - 0.8, tz, Math.PI / 2, { collide: false, tint: { carpet: 0x6a1c28, metal: 0xd9a441 } });
      P(F, "chairModernCushion", tx + 0.8, tz, -Math.PI / 2, { collide: false, tint: { carpet: 0x6a1c28, metal: 0xd9a441 } });
      Kit.mug(F.group, tx + 0.15, 0.765, tz, 0xf4f1ea);
    }
    F.npcSpecs.push({ model: "character-female-d", x: 10.2, z: -9.95, ry: 0, behavior: "coffee", hold: "cup", quotes: "barista" });
    F.npcSpecs.push({ model: "character-male-e", x: 12.95, z: -5.0, ry: -Math.PI / 2, behavior: "sit", seatY: SEAT_Y, quotes: "dev" });
    Kit.plant(F, 13.4, -3.8, { kind: "snake", s: 1.2, pot: "white" });

    /* ---- waiting & gallery (south-east) ---- */
    for (const ax of [8.5, 11.5]) Kit.art(F, ax, 2.0, 2.93, 0, ax > 10 ? 21 : 17, 1.6, 1.1);
    Kit.B(F.group, 7.2, 3.4, 0.2, Look.mat("damask", 0x3a2418, { c2: "rgba(214,160,80,0.22)", tile: 1.1 }), 10, 1.7, 2.8, { r: 0.02 });
    Kit.collide(F, 10, 2.8, 7.2, 0.3);
    for (const bx of [8.8, 11.4]) P(F, "benchCushionLow", bx, 4.4, Math.PI, { tint: { carpet: 0x6a1c28, wood: 0x2a1a10 } });
    Kit.plant(F, 13.3, 8.9, { kind: "fern", s: 1.3, pot: "black" });
    Kit.plant(F, 6.8, 8.9, { kind: "monstera", s: 1.0, pot: "brass", interact: false });
    F.npcSpecs.push({ model: "character-female-b", x: 9.2, z: 5.6, behavior: "phone", pace: 1.1, quotes: "dev" });
    F.npcSpecs.push({ model: "character-male-a", x: 5, z: 1, behavior: "route", hold: "files", speed: 1.0, quotes: "dev", waypoints: [[5, 1, 1], [5, 7, 2], [-4, 7.5, 1], [-4, 0.4, 3], [4, -1, 2]] });
    // entrance mats + plants
    P(F, "rugDoormat", 0, 9.1, 0, { collide: false, s: 1.6 });
    for (const px of [-3.3, 3.3]) Kit.plant(F, px, 9.2, { kind: "fern", s: 1.1, pot: "brass", interact: false });

    // leaving → the ending
    let armed = false;
    F.dynamic.push({ update() {
      const p = Game.player;
      if (p.z < 6.5) armed = true;
      if (armed && Game.state === "play" && p.z > 9.3 && Math.abs(p.x) < 2) { armed = false; UI.exitAttempt(); }
    }});
    // painting lore
    Kit.hot(F, { x: -5.6, z: -8.8, y: 3.6, r: 1.8, label: "A curious painting", fn: () => UI.say("« The Founder's First Debugger », oil on canvas. The duck has heard every 3 AM confession this building has to offer.") });
  },

  /* calibration room — not reachable from the elevator */
  LINEUP(F) {
    shell(F, { elev: false, panels: false, sides: { n: "none", s: "none", e: "none", w: "none" } });
    const names = ["desk", "chairDesk", "loungeSofa", "loungeDesignSofa", "bookcaseOpen", "kitchenBar", "stoolBar", "televisionModern", "chairModernCushion", "benchCushion", "loungeChair", "tableCoffee"];
    names.forEach((n, i) => {
      const x = -12 + (i % 6) * 4.6, z = -4 + Math.floor(i / 6) * 6;
      P(F, n, x, z, 0, {});
      Kit.neon(F, n, 0xffffff, x, 0.2, z + 1.5, -Math.PI / 2 * 0, { size: 0.15, plate: false });
    });
    for (let i = 0; i < 4; i++) {
      const sx = -3 + i * 1.6, sy = [0.2, 0.3, 0.4, 0.5][i];
      P(F, "chairDesk", sx, 6, 0, { collide: false, s: 0.9 });
      F.npcSpecs.push({ model: "character-male-a", x: sx, z: 6.05, ry: 0, behavior: "sit", seatY: sy });
      Kit.neon(F, String(sy), 0xffffff, sx, 0.1, 7, 0, { size: 0.12, plate: false });
    }
    F.npcSpecs.push({ model: "character-female-a", x: -7.4, z: 0, ry: 0, behavior: "idle" });
  },
};
