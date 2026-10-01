/* ============================================================
   SPARSH HQ v6 — floors6.js
   F3 — PROJECTS, rebuilt open: three project bays you can see
   the moment the doors open, the energy core in the middle (and
   what it actually runs on), the repo library and the
   open-source bench out in the open, the city through the glass.
   ============================================================ */
Floors.fp = function (F) {
  shell(F, {
    w: 32, d: 24, h: 4.8, elevZ: 0,
    floor: Look.mat("concrete", 0x8f8b86, { tile: 3, rough: 0.42, env: 0.8 }),
    wall: Look.mat("plaster", 0xc4beb4, { tile: 2 }),
    skirt: Kit.M(0x24262c, { rough: 0.4 }),
    ceil: Kit.M(0xeceae6, { rough: 0.95 }),
    sides: { n: { type: "wall", mat: Look.mat("acoustic", 0x2a303a, { tile: 1.6 }) }, s: { type: "wall", mat: Look.mat("panel", 0x4a3222, { tile: 2 }) }, e: "glass", w: "wall" },
    theme: { wood: 0xc9a77a, carpet: 0x2e3a4c, metal: 0xc0c7d2 },
    panelColor: 0xfff6e8, pcols: 6, prows: 4,
    mood: {
      exposure: 0.9, hemi: [0xeef2ff, 0x4a4038, 0.85], key: [0xfff0dc, 1.8, [0.5, 1, 0.3]], fill: [0xa8c0ff, 0.45],
      env: 0.6, fog: [0x141a26, 60, 220], bloom: [0.26, 0.5, 1.05], ao: 1.0,
      grade: { tint: [1.0, 1.0, 1.02], shadow: [0.03, 0.05, 0.12], high: [0.22, 0.16, 0.08], vig: 0.3, sat: 1.06 },
    },
  });
  // step out facing the room: the core ahead, the projects to the left
  F.elevator.spawn = { x: -10.4, z: 0.6, ry: HP + 0.25 }; F.spawn = F.elevator.spawn; F.yawOffset = 0;

  // ---- welcome ----
  Kit.neon(F, "PROJECTS", 0x57d8ff, -15.84, 3.9, -4.2, HP, { size: 0.4, glow: 1.8 });
  Kit.textPoster(F, ["THINGS I BUILT BECAUSE I WANTED TO", "three rooms · twelve repos · one core"], 3.4, 0.8, -15.86, 2.95, -4.2, HP, { color: "#bfe8ff", bg: "#0b1420", decor: false });
  Kit.rug(F, -2, 0.4, 24, 2.8, 0, { kind: "stripe", colors: [0x232c3a, 0xffb84d, 0x2e3a4c] });

  // ---- NORTH: three open project bays ----
  const bays = [-9, 0, 9];
  CONTENT.projects.forEach((pr, i) => {
    const bx = bays[i], col = Type.hex(pr.accent);
    Kit.holoWall(F, pr, bx, 2.4, -11.86, 0, { w: 4.6, h: 2.6, fps: 3, px: 900 });
    const short = { sprharness: "SPRHARNESS", lanserver: "LAN SERVER", voyage: "VOYAGES" }[pr.id] || pr.name.toUpperCase();
    Kit.textPoster(F, [`${pr.code} · ${short}`], 3.6, 0.42, bx, 4.05, -11.88, 0, { fs: 40, color: col, bg: "#0b1018", borderCol: col + "88", decor: false });
    Kit.floorPlane(F, bx, -9.1, 8.2, 5.6, Look.mat("fabric", 0x1e2532, { tile: 1.2 }), 0.008);
    Kit.B(F.group, 8.2, 0.012, 0.07, Kit.G(pr.accent, 2.0), bx, 0.014, -6.3, { r: 0.004, cast: false });
  });
  for (const x of [-4.5, 4.5]) Props.rail(F, x, -11.9, x, -7.6, 1.1);
  // P-01 sprHarness: the agents talking, two desks running them
  Props.chatBubbles(F, -9, -8.2);
  ws(F, -11.6, -9.4, 0, { monitors: 2, screens: ["code", "term"], npc: { quotes: "dev" } });
  ws(F, -6.4, -9.4, 0, { monitors: 1, screens: ["chat"] });
  // P-02 the LAN server: racks that never touch the internet
  for (const rx of [-2.3, 2.3]) Kit.serverRack(F, rx, -9.6, 0, { alert: rx > 0 });
  Kit.B(F.group, 2.4, 0.05, 0.05, Kit.G(0xff4030, 2.2), 0, 2.45, -10.9, { r: 0.02, cast: false });
  F.npcSpecs.push({ model: "character-male-f", x: 0.2, z: -8.0, ry: Math.PI, behavior: "idle", hold: "laptop", quotes: "dev", greeting: "LAN only. The internet can't see us." });
  // P-03 voyages: the globe and the routing table
  Props.globe(F, 9, -8.8);
  const mapT = Kit.grp(F, 12.2, -8.0, 0);
  Kit.B(mapT, 2.0, 0.8, 1.2, Kit.M(0x14171e, { metal: 0.5 }), 0, 0.4, 0, { r: 0.03 });
  const mt = Kit.screen(F, 1.9, 1.1, Kit.screens.map, 0, 0.81, 0, 0, { parent: mapT, fps: 3, px: 256, glow: 1.2 }); mt.rotation.x = -HP;
  Kit.colLocal(F, mapT, 0, 0, 2.0, 1.2);
  F.npcSpecs.push({ model: "character-female-e", x: 11.0, z: -6.9, ry: 2.6, behavior: "idle", quotes: "dev", greeting: "94% accurate. The ships write thank-you notes." });

  // ---- CENTRE: the energy core — and what it runs on ----
  Kit.rug(F, 3.2, 2.4, 7.4, 7.4, 0, { kind: "border", colors: [0x10161e, 0x57d8ff, 0x0c1118] });
  Props.energyCore(F, 3.2, 2.4);
  const core = CONTENT.core;
  // three rings of the core, named on the floor
  core.rings.forEach((r, i) => {
    const a = -0.5 + i * (Math.PI * 2 / 3);
    const m = Kit.screen(F, 1.7, 0.36, (c, w, h) => {
      c.clearRect(0, 0, w, h); c.fillStyle = "rgba(160,225,255,0.95)"; c.font = `800 ${h * 0.6}px ${Kit.FONT}`;
      c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(r.toUpperCase(), w / 2, h / 2);
    }, 3.2 + Math.sin(a) * 3.0, 0.016, 2.4 + Math.cos(a) * 3.0, 0, { fps: 0, px: 256, transparent: true, glow: 1.4, decor: false });
    m.rotation.x = -HP; m.rotation.z = -a;
  });
  // the explanation, standing where you first see the core
  // beside the core (not in front of it), angled toward the way you came in
  const gx = -0.4, gz = 6.4, gry = -HP + 0.55;
  const stand = Kit.grp(F, gx, gz, gry);
  Kit.B(stand, 2.5, 0.08, 0.5, Kit.M(0x14171e, { metal: 0.5 }), 0, 0.04, 0, { r: 0.02 });
  Kit.B(stand, 0.12, 1.2, 0.12, Kit.M(0x14171e, { metal: 0.5 }), 0, 0.6, 0, { r: 0.02 });
  Kit.collide(F, gx, gz, 2.4, 0.6, gry);
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
      c.font = `500 ${h * 0.04}px ${Kit.FONT}`; c.fillStyle = "rgba(232,236,244,0.75)";
      Type.rich(c, st.l, bx + 10, by + bh * 0.72, bw - 18, h * 0.04, h * 0.05, "rgba(232,236,244,0.75)", "#fff", 2);
    });
    c.font = `700 ${h * 0.045}px ${Kit.FONT}`; c.fillStyle = "#57d8ff"; c.fillText("▸  CLICK FOR WHAT IT RUNS ON", pad, h * 0.95);
  }, { px: 720, accent: 0x57d8ff });
  Kit.hot(F, { x: gx + Math.sin(gry) * 1.3, z: gz + Math.cos(gry) * 1.3, y: 3.3, r: 2.6, label: "The core — what powers every project here", ref: core, focus: { x: 3.2, y: 1.8, z: 2.4 }, fn: () => { AudioSys.sfx("open"); UI.panel(core); } });

  // ---- SOUTH-WEST: the repo library, out in the open ----
  Kit.neon(F, "THE ARCHIVE · EVERY REPO IS A BOOK", 0x4ade80, -8.6, 3.75, 11.84, Math.PI, { size: 0.26, glow: 1.7 });
  const shelves = [-12.2, -8.6, -5.0].map((x) => Kit.bookcase(F, x, 11.55, Math.PI, { w: 3.4, h: 2.7, rows: 5, skipRows: [2], noDecor: false, palette: [0x2f6e4a, 0x2f4a6e, 0x6e3a6e, 0x8c2f2f] }));
  CONTENT.repos.forEach((repo, i) => {
    const sh = shelves[Math.floor(i / 4)], j = i % 4;
    Kit.book(F, sh, -1.2 + j * 0.8, 0.08 + (2.7 - 0.16) * (2 / 5) + 0.02, 0.0, { title: repo.name, cat: repo.lang + " · " + repo.year, body: repo.desc, quote: repo.lesson, isRepo: true, repo }, [0x4ade80, 0x57d8ff, 0xc084fc, 0xffd166][i % 4]);
  });
  Kit.table(F, -8.6, 7.8, 0, { style: "rect", w: 2.6, d: 1.1, h: 0.76, top: Kit.M(0x4a3222, { rough: 0.4 }), books: true });
  Kit.deskLamp(F.group, -7.8, 0.785, 7.6, "banker");
  Kit.light(F, -8.6, 2.6, 9.2, 0xffe0a0, 1.2, 6);
  Kit.hot(F, { x: -8.6, z: 9.6, y: 3.2, r: 2.6, label: "The archive — every repo, on one shelf", ref: { kind: "repoIndex", id: "library" }, fn: () => { AudioSys.sfx("open"); UI.panel({ kind: "repoIndex", id: "library" }); } });
  F.npcSpecs.push({ model: "character-female-a", x: -10.4, z: 7.9, ry: HP, behavior: "idle", hold: "files", quotes: "student" });

  // ---- SOUTH-EAST: the open-source bench ----
  const oss = CONTENT.oss;
  Kit.table(F, 6.4, 9.6, 0, { style: "rect", w: 3.0, d: 1.1, h: 0.9, top: Kit.M(0x2a2e36, { metal: 0.4, rough: 0.4 }) });
  Props.roboArm(F, 7.6, 9.7, 0xffd166);
  lightbox(F, 6.4, 2.45, 11.86, Math.PI, 4.4, 1.9, (c, w, h) => {
    c.fillStyle = "#14110a"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#ffd166"; c.fillRect(0, 0, w, h * 0.014);
    const pad = w * 0.05;
    c.textAlign = "left"; c.textBaseline = "alphabetic";
    c.font = `800 ${h * 0.07}px ${Kit.FONT}`; c.fillStyle = "#ffd166"; c.fillText("THE BENCH · OPEN SOURCE & TEAM BUILDS", pad, h * 0.13);
    let yy = h * 0.27;
    for (const it of oss.items) {
      c.font = `800 ${h * 0.065}px ${Kit.FONT}`; c.fillStyle = "#fff"; c.fillText(it.name, pad, yy);
      yy = Type.rich(c, it.what, pad, yy + h * 0.065, w - pad * 2, h * 0.05, h * 0.062, "rgba(244,232,206,0.8)", "#fff", 1) + h * 0.07;
    }
  }, { px: 900, accent: 0xffd166 });
  Kit.light(F, 6.4, 3.0, 8.6, 0xffe2a8, 1.2, 6);
  Kit.hot(F, { x: 6.4, z: 8.2, y: 3.0, r: 2.4, label: "The bench — open source & team builds", ref: oss, focus: { x: 6.4, y: 2.4, z: 11.8 }, fn: () => { AudioSys.sfx("open"); UI.panel(oss); } });

  // ---- EAST: by the glass ----
  lounge(F, 12.4, 6.2, -HP, { sofa: "loungeSofa", chair: "loungeChair", rugColors: [0x1e2838, 0xffb84d, 0x2a3a50], theme: F.theme });
  for (const [x, z] of [[15.4, -3.6], [15.4, 10.8], [-15.3, 10.6], [-15.3, -10.8]]) Kit.plant(F, x, z, { kind: x > 0 ? "palm" : "monstera", s: 1.25, pot: "white", interact: false });
  Kit.coffeeBar(F, -15.25, 6.8, HP, { w: 3.0, machine: 0x2a2e36, top: Look.mat("terrazzo", 0xeceef0, { tile: 1.2, rough: 0.3 }) });
  for (const [x, z] of [[-9, -4.6], [0, -4.6], [9, -4.6]]) Kit.pendant(F, x, z, { drop: 1.3, style: "cylinder", light: false, color: 0xfff0d8, shade: Kit.M(0x1d2230, { rough: 0.3, metal: 0.6 }) });
  F.npcSpecs.push({ model: "character-male-d", x: -6, z: 4.6, behavior: "route", speed: 1.0, quotes: "dev", waypoints: [[-6, 4.6, 2], [9.5, 4.6, 1], [9.5, -4.6, 2], [-6, -4.6, 2]] });
};
