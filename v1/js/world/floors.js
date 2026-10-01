/* ============================================================
   SPARSH HQ — floors.js
   The architecture of the building: plaza, 8 floors, and one
   dungeon that does not appear on any map.
   ============================================================ */

/* --- scene-specific mega props --- */
Renderer.props.tower = function (c, p, t) {
  // the HQ tower rising behind the plaza doors
  const A = ISO.toScreen(p.x, p.y), B = ISO.toScreen(p.x + p.fw, p.y);
  const H = 560;
  const grad = c.createLinearGradient(0, A.y - H, 0, A.y);
  grad.addColorStop(0, "rgba(26,34,52,0.4)"); grad.addColorStop(1, "rgba(30,40,62,0.96)");
  c.fillStyle = grad;
  c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.lineTo(B.x - 30, B.y - H); c.lineTo(A.x + 30, A.y - H); c.closePath(); c.fill();
  c.strokeStyle = "rgba(140,190,255,0.25)"; c.lineWidth = 1.5; c.stroke();
  // window grid (anchored to the slanted base edge)
  c.save();
  c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.lineTo(B.x - 30, B.y - H); c.lineTo(A.x + 30, A.y - H); c.closePath(); c.clip();
  for (let fy = 1; fy < 14; fy++) {
    for (let fx = 0; fx < 18; fx++) {
      const fr = fx / 17;
      const wx = U.lerp(A.x + 40, B.x - 40, fr), wy = U.lerp(A.y, B.y, fr) - 30 - fy * 38;
      const lit = Math.sin(fx * 12.9 + fy * 78.2) > -0.2;
      const flicker = Math.sin(t * (1 + (fx * fy) % 3) + fx * 7 + fy * 3) > -0.95;
      c.fillStyle = lit && flicker ? "rgba(255,214,150,0.5)" : "rgba(80,110,160,0.18)";
      c.fillRect(wx, wy, 14, 20);
    }
  }
  c.restore();
  // marquee sign, centered above the entrance
  const midX = (A.x + B.x) / 2, edgeMidY = (A.y + B.y) / 2;
  const glow = 0.75 + Math.sin(t * 2) * 0.2;
  c.font = "800 34px 'Outfit',sans-serif"; c.textAlign = "center";
  c.shadowColor = "#ff6b57"; c.shadowBlur = 24 * glow;
  c.fillStyle = `rgba(255,120,100,${glow})`;
  c.fillText("S P A R S H   H Q", midX, edgeMidY - 150);
  c.shadowBlur = 0;
  c.font = "500 11px 'Outfit',sans-serif";
  c.fillStyle = "rgba(200,220,255,0.75)";
  c.fillText("welcome to the building where every room ships software", midX, edgeMidY - 126);
  // drone hovering with package
  const dx = midX + Math.sin(t * 0.5) * 150, dy = edgeMidY - 340 + Math.sin(t * 1.3) * 12;
  c.fillStyle = "#2c3140"; c.fillRect(dx - 8, dy, 16, 4);
  c.strokeStyle = "rgba(200,220,255,0.6)"; c.lineWidth = 1;
  c.beginPath(); c.ellipse(dx - 8, dy - 1, 6, 1.6, 0, 0, Math.PI * 2); c.ellipse(dx + 8, dy - 1, 6, 1.6, 0, 0, Math.PI * 2); c.stroke();
  c.fillStyle = "#c9a86a"; c.fillRect(dx - 3, dy + 5, 6, 5);
  Renderer.glowDot(c, dx, dy + 2, 6, "rgba(255,80,80,0.6)");
};

Renderer.props.holo = function (c, p, t) { // small hologram decoration
  const s = ISO.toScreen(p.x + 0.5, p.y + 0.5);
  Renderer.glowDot(c, s.x, s.y - 26, 22, p.color || "rgba(87,216,255,0.25)");
  c.strokeStyle = p.color || "rgba(87,216,255,0.7)"; c.lineWidth = 1;
  const r = 10 + Math.sin(t * 2 + p.x) * 2;
  c.beginPath(); c.ellipse(s.x, s.y - 26, r, r * 0.45, 0, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.ellipse(s.x, s.y - 26, r * 0.6, r, 0, 0, Math.PI * 2); c.stroke();
};

/* --- builder helpers --- */
const FB = {
  create(idx, w, h) {
    const mat = [], block = [];
    for (let y = 0; y < h; y++) { mat.push(new Array(w).fill(0)); block.push(new Array(w).fill(true)); }
    return { idx, w, h, mat, block, wallTiles: [], props: [], rooms: [], interact: [], exhibits: [], npcSpecs: [], transitions: [], spawn: { x: 2, y: 2 } };
  },
  fill(f, x, y, w, h, m) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      if (yy >= 0 && yy < f.h && xx >= 0 && xx < f.w) { f.mat[yy][xx] = m; f.block[yy][xx] = false; }
    }
  },
  wall(f, x, y, glassy = false) {
    if (y < 0 || y >= f.h || x < 0 || x >= f.w) return;
    f.wallTiles.push({ x, y, glassy });
    f.block[y][x] = true;
  },
  wallH(f, x, y, len, doors = [], glassy = false) {
    for (let i = 0; i < len; i++) if (!doors.includes(i)) FB.wall(f, x + i, y, glassy);
  },
  wallV(f, x, y, len, doors = [], glassy = false) {
    for (let i = 0; i < len; i++) if (!doors.includes(i)) FB.wall(f, x, y + i, glassy);
  },
  prop(f, type, x, y, opts = {}) {
    const p = Object.assign({ type, x, y }, opts);
    f.props.push(p);
    if (!opts.walk) {
      const fw = Math.ceil(p.fw || 1), fh = Math.ceil(p.fh || 1);
      for (let yy = Math.floor(y); yy < Math.floor(y) + fh; yy++)
        for (let xx = Math.floor(x); xx < Math.floor(x) + fw; xx++)
          if (yy >= 0 && yy < f.h && xx >= 0 && xx < f.w) f.block[yy][xx] = true;
    }
    return p;
  },
  inter(f, x, y, label, fn, r = 1.7, markerH) {
    f.interact.push({ x, y, r, label, fn, markerH });
  },
  zone(f, id, x, y, w, h, name, sub) {
    f.rooms.push({ id, x, y, w, h, name, sub: sub || "" });
  },
  ex(f, type, x, y, w, h, room) {
    f.exhibits.push({ type, x, y, w, h, room });
  },
  npc(f, kind, x, y, opts = {}) {
    f.npcSpecs.push(Object.assign({ kind, x, y }, opts));
  },
  elevator(f, x, y) {
    FB.prop(f, "elevator", x, y, { fw: 2 });
    FB.inter(f, x + 1, y + 1.6, "Elevator — choose a floor", () => UI.openElevator(), 1.8, 70);
  },
  trans(f, x, y, w, h, fn) { f.transitions.push({ x, y, w, h, fn, active: false }); },
};

const Floors = {
  cache: {},

  meta(idx) {
    if (idx === "P") return { label: "The Plaza", sub: "Outside Sparsh HQ" };
    if (idx === "D") return { label: "Developer Dungeon", sub: "??? · sub-basement" };
    const fdata = CONTENT.floors[idx];
    return { label: `F${idx} · ${fdata.name}`, sub: fdata.sub };
  },

  build(idx) {
    if (Floors.cache[idx]) {
      const f = Floors.cache[idx];
      for (const tr of f.transitions) tr.active = false;
      return f;
    }
    const f = Floors["make" + (typeof idx === "number" ? idx : idx)]();
    Floors.cache[idx] = f;
    return f;
  },

  /* ============ PLAZA ============ */
  makeP() {
    const f = FB.create("P", 26, 18);
    f.noGlass = true;
    FB.fill(f, 0, 0, 26, 18, 1);
    FB.fill(f, 11, 0, 4, 18, 3);               // walkway to doors
    FB.fill(f, 2, 13, 6, 3, 2);                // west court
    FB.fill(f, 18, 13, 6, 3, 2);               // east court
    // tower + doors on north edge
    FB.prop(f, "tower", 0, 0, { fw: 26, fh: 0.1, walk: true, bias: -1000 });
    FB.prop(f, "doors", 11.5, 0.1, { fw: 3, fh: 0.4, walk: true });
    // planters & lamps
    for (const x of [4, 8, 17, 21]) { FB.prop(f, "tallplant", x, 3); FB.prop(f, "lamp", x + 1, 3); }
    for (const x of [4, 8, 17, 21]) { FB.prop(f, "tallplant", x, 8); FB.prop(f, "lamp", x + 1, 8); }
    FB.prop(f, "sofa", 3, 14, { fw: 2, color: "#4a5568" });
    FB.prop(f, "sofa", 19, 14, { fw: 2, color: "#4a5568" });
    FB.prop(f, "plant", 6, 14); FB.prop(f, "plant", 22, 14);
    FB.zone(f, "plaza", 0, 0, 26, 18, "The Plaza", "rain, neon, and one very tall building");
    // enter building
    FB.trans(f, 11, 0, 4, 2.2, () => {
      AudioSys.sfx("doors");
      Game.flags.enteredBuilding = true;
      Game.loadFloor(0, { x: 17, y: 20 });
      ChatBot.firstWelcome();
    });
    FB.npc(f, "guard", 20, 6, { patrol: [[20, 6], [20, 11], [5, 11], [5, 6]] });
    FB.npc(f, "visitor", 9, 12, { wander: [2, 10, 22, 6] });
    f.spawn = { x: 13, y: 15 };
    return f;
  },

  /* ============ FLOOR 0 — LOBBY ============ */
  make0() {
    const f = FB.create(0, 34, 24);
    FB.fill(f, 1, 1, 32, 22, 1);
    FB.fill(f, 13, 1, 8, 22, 2);                 // central marble runway
    FB.fill(f, 24, 15, 9, 8, 5);                 // coffee corner (wood)
    FB.fill(f, 2, 14, 9, 8, 3);                  // lounge rug zone
    // reception
    FB.prop(f, "receptiondesk", 14, 4, { fw: 5 });
    FB.prop(f, "rug", 13, 6, { fw: 7, fh: 4, flat: true, walk: true, color: "rgba(51,198,164,0.14)" });
    // big screen + north wall content
    FB.prop(f, "bigscreen", 22, 1.2, { fw: 6 });
    FB.prop(f, "worldmap", 2, 1.2, { fw: 4 });
    FB.prop(f, "photowall", 7, 1.2, { fw: 4 });
    FB.prop(f, "mosswall", 12, 1.15, { fw: 2 });
    FB.prop(f, "mosswall", 29, 1.15, { fw: 3 });
    // aquarium + guest book
    FB.prop(f, "aquarium", 3, 8, { fw: 3 });
    FB.prop(f, "guestbook", 11, 8);
    // lounge
    FB.prop(f, "sofa", 3, 15, { fw: 3, color: "#7a5b45" });
    FB.prop(f, "sofa", 3, 19, { fw: 3, color: "#7a5b45" });
    FB.prop(f, "ctable", 4, 17, { fw: 2 });
    FB.prop(f, "plant", 8, 15); FB.prop(f, "tallplant", 2, 21);
    FB.prop(f, "lamp", 8, 20);
    // coffee bar
    FB.prop(f, "coffeemachine", 31, 16);
    FB.prop(f, "coffeemachine", 31, 18);
    FB.prop(f, "table", 26, 17, { fw: 2, fh: 2 });
    FB.prop(f, "chair", 25, 17); FB.prop(f, "chair", 28, 18);
    FB.prop(f, "vending", 31, 21);
    // elevator + misc
    FB.elevator(f, 29, 8);
    FB.prop(f, "emergencybtn", 27, 9);
    FB.prop(f, "watercooler", 21, 15);
    FB.prop(f, "plant", 12, 12); FB.prop(f, "plant", 21, 12);
    FB.prop(f, "pillar", 12, 10); FB.prop(f, "pillar", 21, 10);
    FB.prop(f, "holo", 13, 9, { walk: true });
    // zones
    FB.zone(f, "lobby", 12, 2, 10, 12, "Reception", "NOVA is watching. Kindly.");
    FB.zone(f, "coffee", 24, 15, 9, 8, "HQ Coffee Bar", "five-nines availability");
    FB.zone(f, "lounge", 2, 14, 9, 8, "Waiting Lounge", "soft chairs, softer lighting");
    // interacts
    FB.inter(f, 16.5, 6.8, "Talk to NOVA", () => ChatBot.open(true), 2.2, 60);
    FB.inter(f, 25, 3.5, "The Big Board", () => UI.showInfo("bigscreen"), 2.2, 90);
    FB.inter(f, 4, 3.5, "Visitor Map", () => UI.showInfo("worldmap"), 2, 80);
    FB.inter(f, 9, 3.5, "Photo Wall", () => UI.photoWall(), 2, 80);
    FB.inter(f, 4.5, 9.5, "Digital Aquarium", () => UI.showInfo("aquarium"), 2, 70);
    FB.inter(f, 11, 9.2, "Guest Book", () => UI.openGuestbook(false), 1.8, 55);
    FB.inter(f, 27, 10.2, "Emergency Button", () => Easter.emergency(), 1.4, 55);
    FB.inter(f, 30, 17.5, "Espresso Machine", () => { AudioSys.sfx("coffee"); UI.showInfo("coffee"); }, 1.8, 55);
    FB.inter(f, 2.8, 2.8, "Building Directory", () => UI.openElevator(), 2, 100);
    // exit to plaza (south of runway)
    FB.trans(f, 13, 22.2, 8, 1.8, () => UI.exitAttempt());
    // NPCs
    FB.npc(f, "nova", 16.5, 5.2, { static: true });
    FB.npc(f, "barista", 30, 17, { wander: [25, 16, 7, 6] });
    FB.npc(f, "recruiter", 8, 17, { wander: [2, 14, 9, 7] });
    FB.npc(f, "dev", 18, 14, { wander: [13, 8, 8, 14] });
    FB.npc(f, "guard", 24, 12, { patrol: [[24, 12], [24, 21], [13, 21], [13, 12]] });
    f.spawn = { x: 17, y: 20 };
    return f;
  },

  /* ============ FLOOR 1 — ENGINEERING ============ */
  make1() {
    const f = FB.create(1, 36, 24);
    FB.fill(f, 1, 1, 34, 22, 3);                  // carpet
    FB.fill(f, 1, 10, 34, 4, 2);                  // corridor
    // north offices: questionnaire | dashboard | campaign | emr
    FB.wallH(f, 1, 9, 34, [3, 4, 12, 13, 21, 22, 30, 31]);   // office fronts w/ doors
    FB.wallV(f, 9, 1, 8, []); FB.wallV(f, 18, 1, 8, []); FB.wallV(f, 27, 1, 8, []);
    // south rooms: b2b | meeting | break
    FB.wallH(f, 1, 14, 34, [4, 5, 15, 16, 26, 27]);
    FB.wallV(f, 11, 15, 8, []); FB.wallV(f, 22, 15, 8, [], true);
    // office props
    const office = (x, name) => {
      FB.prop(f, "desk", x + 1, 2, { fw: 2, screen: "#3fd0ff" });
      FB.prop(f, "chair", x + 1.5, 3.4);
      FB.prop(f, "plant", x + 6.5, 2);
      FB.prop(f, "sign", x + 2, 8.6, { text: name, size: 9, h: 62, walk: true, color: "rgba(160,200,255,0.9)" });
    };
    office(1, "QUESTIONNAIRE ENGINE"); office(10, "DASHBOARD"); office(19, "CAMPAIGN ENGINE"); office(28, "EMR PLATFORM");
    FB.prop(f, "servrack", 25.6, 2, {}); FB.prop(f, "servrack", 26.5, 2, {});
    FB.prop(f, "whiteboard", 10.5, 1.4, { fw: 2, text: "WIDGETS 100+" });
    FB.prop(f, "whiteboard", 1.5, 1.4, { fw: 2, text: "TREE → Rx" });
    // exhibits
    FB.ex(f, "tree", 3.5, 4, 4, 3.5, "questionnaire");
    FB.ex(f, "widgets", 12, 4, 4.5, 3.5, "dashboard");
    FB.ex(f, "mission", 20.5, 4, 5, 3.5, "campaign");
    FB.ex(f, "emr", 29.5, 4, 4.5, 3.5, "emr");
    FB.ex(f, "s3", 3.5, 17, 5, 3.5, "b2b");
    // south rooms setup
    FB.prop(f, "desk", 7, 16, { fw: 2, screen: "#ffd166" });
    FB.prop(f, "sign", 3, 14.6, { text: "B2B PARTNER PORTAL", size: 9, h: 62, walk: true, color: "rgba(255,209,102,0.85)" });
    FB.prop(f, "table", 15, 17, { fw: 4, fh: 2 });
    FB.prop(f, "chair", 14, 17.5); FB.prop(f, "chair", 19.4, 17.5); FB.prop(f, "chair", 16, 16); FB.prop(f, "chair", 18, 19.4);
    FB.prop(f, "whiteboard", 13, 15.4, { fw: 2.5, text: "TABS vs SPACES" });
    FB.prop(f, "sign", 15, 14.6, { text: "CONFERENCE ROOM C", size: 8, h: 58, walk: true, color: "rgba(200,220,255,0.7)" });
    FB.prop(f, "pedestal", 20.5, 20.5, { item: "chili", label: "Kevin's chili · in memoriam", glow: "rgba(192,57,43,0.2)" });
    // break area
    FB.prop(f, "coffeemachine", 32, 16);
    FB.prop(f, "vending", 32, 18);
    FB.prop(f, "sofa", 25, 20, { fw: 2, color: "#5a6b8c" });
    FB.prop(f, "watercooler", 29, 21);
    FB.prop(f, "plant", 24, 16); FB.prop(f, "tallplant", 33.5, 21.5);
    // zones
    FB.zone(f, "questionnaire", 1, 1, 8, 8, "Questionnaire Engine", "graphs & trees, healing people");
    FB.zone(f, "dashboard", 10, 1, 8, 8, "Dashboard Command Center", "100+ widgets · 1M visits");
    FB.zone(f, "campaign", 19, 1, 8, 8, "Campaign Mission Control", "12M users · 3 channels");
    FB.zone(f, "emr", 28, 1, 7, 8, "EMR Platform", "a hospital inside a JVM");
    FB.zone(f, "b2b", 1, 15, 10, 8, "B2B Portal Office", "census files → S3");
    FB.zone(f, "meeting", 12, 15, 10, 8, "Conference Room C", "the chili happened here");
    FB.zone(f, "break", 23, 15, 12, 8, "Break Room", "where deploys are mourned");
    // interacts
    FB.inter(f, 5, 6, "Questionnaire Engine — the story", () => UI.showInfo("questionnaire"), 2.4, 90);
    FB.inter(f, 14, 6, "Dashboard — the story", () => UI.showInfo("dashboard"), 2.4, 90);
    FB.inter(f, 23, 6, "Campaign Engine — the story", () => UI.showInfo("campaign"), 2.4, 90);
    FB.inter(f, 31.5, 6, "EMR Platform — the story", () => UI.showInfo("emr"), 2.4, 90);
    FB.inter(f, 6, 19, "B2B Portal — the story", () => UI.showInfo("b2b"), 2.4, 90);
    FB.inter(f, 20.5, 21.5, "A plaque about chili", () => UI.showInfo("chili"), 1.5, 55);
    FB.elevator(f, 1, 11);
    // NPCs
    FB.npc(f, "dev", 12, 11.5, { wander: [2, 10, 32, 3.5] });
    FB.npc(f, "dev", 24, 12, { wander: [2, 10, 32, 3.5] });
    FB.npc(f, "dev", 15.5, 16.5, { static: true, quote: "Tabs. Obviously tabs." });
    FB.npc(f, "dev", 18.5, 18.5, { static: true, quote: "Spaces. Like a civilized person." });
    FB.npc(f, "doctor", 30, 5, { wander: [28.5, 2, 5.5, 6] });
    FB.npc(f, "janitor", 6, 12, { wander: [2, 10, 30, 3.5] });
    f.spawn = { x: 4, y: 12 };
    return f;
  },

  /* ============ FLOOR 2 — PROJECTS LAB ============ */
  make2() {
    const f = FB.create(2, 32, 22);
    FB.fill(f, 1, 1, 30, 20, 1);
    FB.fill(f, 1, 9, 30, 4, 3);                    // corridor
    FB.wallH(f, 1, 8, 30, [4, 5, 15, 16, 25, 26]);
    FB.wallV(f, 10, 1, 7); FB.wallV(f, 21, 1, 7);
    FB.wallH(f, 1, 13, 30, [7, 8, 20, 21]);
    FB.wallV(f, 14, 14, 7);
    // chat app room (west-north)
    FB.prop(f, "sign", 3, 7.6, { text: "CHAT APP · MERN", size: 9, h: 60, walk: true, color: "rgba(192,132,252,0.9)" });
    FB.ex(f, "chatflow", 2, 3, 7, 3, "chatapp");
    FB.prop(f, "desk", 2, 1.6, { fw: 2, screen: "#c084fc" });
    FB.prop(f, "plant", 8.5, 1.6);
    // private server room (mid-north)
    FB.prop(f, "sign", 13, 7.6, { text: "PRIVATE SERVER", size: 9, h: 60, walk: true, color: "rgba(87,216,255,0.9)" });
    FB.prop(f, "securitygate", 14.5, 7.2, { walk: true });
    FB.ex(f, "packets", 12, 3, 8, 3, "privateserver");
    FB.prop(f, "servrack", 12, 1.6); FB.prop(f, "servrack", 13, 1.6);
    FB.prop(f, "servrack", 19, 1.6, { alert: true });
    // weather room (east-north)
    FB.prop(f, "sign", 24, 7.6, { text: "WEATHER ENGINE", size: 9, h: 60, walk: true, color: "rgba(122,229,130,0.9)" });
    FB.ex(f, "weather", 23, 3, 6, 3.5, "weather");
    FB.prop(f, "desk", 28.5, 1.6, { fw: 2, screen: "#7ae582" });
    // south: open lab + secret alcove
    FB.prop(f, "table", 4, 16, { fw: 3, fh: 2 });
    FB.prop(f, "whiteboard", 3, 14.4, { fw: 2.5, text: "IDEAS > SLEEP" });
    FB.prop(f, "desk", 9, 17, { fw: 2, screen: "#ffd166" });
    FB.prop(f, "chair", 9.5, 18.6);
    FB.prop(f, "plant", 2, 19.5); FB.prop(f, "tallplant", 12.8, 19.5);
    FB.prop(f, "sofa", 17, 16, { fw: 2, color: "#5b4a72" });
    FB.prop(f, "ctable", 17.5, 18);
    FB.prop(f, "vending", 29.5, 15);
    FB.prop(f, "portalbtn", 29.5, 19.5);
    // zones
    FB.zone(f, "chatapp", 1, 1, 9, 7, "Chat App HQ", "messages with frequent-flyer miles");
    FB.zone(f, "privateserver", 11, 1, 10, 7, "Classified Server Facility", "authorized personnel only");
    FB.zone(f, "weather", 22, 1, 9, 7, "Weather Mission Control", "storms, satellites, ships");
    FB.zone(f, "lab", 1, 14, 30, 7, "Makers' Commons", "personal builds live here");
    // interacts
    FB.inter(f, 5.5, 5, "Chat App — the story", () => UI.showInfo("chatapp"), 2.4, 90);
    FB.inter(f, 16, 5, "Private Server — the story", () => UI.showInfo("privateserver"), 2.4, 90);
    FB.inter(f, 26, 5.5, "Weather Engine — the story", () => UI.showInfo("weather"), 2.4, 90);
    FB.inter(f, 29.5, 20.6, "A strange button", () => Easter.portal(), 1.5, 40);
    FB.elevator(f, 1, 10);
    FB.npc(f, "dev", 6, 11, { wander: [2, 9, 28, 3.5] });
    FB.npc(f, "visitor", 20, 11, { wander: [2, 9, 28, 3.5] });
    FB.npc(f, "dev", 5, 17, { wander: [2, 14.5, 10, 5.5] });
    f.spawn = { x: 4, y: 11 };
    return f;
  },

  /* ============ FLOOR 3 — EDUCATION WING ============ */
  make3() {
    const f = FB.create(3, 32, 22);
    FB.fill(f, 1, 1, 30, 20, 2);
    FB.fill(f, 1, 1, 14, 10, 1);                    // lecture hall
    FB.fill(f, 17, 1, 14, 10, 5);                   // library (wood)
    FB.fill(f, 17, 13, 14, 8, 3);                   // computer lab
    FB.wallV(f, 15, 1, 10, [5, 6]);
    FB.wallH(f, 17, 12, 14, [2, 3]);
    // lecture hall
    for (let r = 0; r < 3; r++) FB.prop(f, "benchrow", 4, 3 + r * 2.2, { fw: 6, fh: 0.8 });
    FB.prop(f, "lectern", 6, 8.6);
    FB.prop(f, "whiteboard", 3, 1.4, { fw: 3, text: "DTU · COE '23 · CGPA 8.83" });
    FB.prop(f, "sign", 5, 0.8, { text: "LECTURE HALL 101", size: 9, h: 76, walk: true, color: "rgba(245,185,83,0.9)" });
    // library
    for (let i = 0; i < 3; i++) FB.prop(f, "bookshelf", 18 + i * 4.5, 2, { fw: 3 });
    FB.prop(f, "bookshelf", 18, 5.5, { fw: 3, murph: true });
    FB.prop(f, "bookshelf", 22.5, 5.5, { fw: 3 });
    FB.prop(f, "table", 20, 8, { fw: 3, fh: 1.5 });
    FB.prop(f, "lamp", 27.5, 8);
    FB.prop(f, "sign", 22, 0.8, { text: "THE LIBRARY", size: 9, h: 76, walk: true, color: "rgba(245,185,83,0.9)" });
    // computer lab
    for (let i = 0; i < 3; i++) FB.prop(f, "desk", 18 + i * 4.5, 14.5, { fw: 2, screen: "#4ade80" });
    for (let i = 0; i < 3; i++) FB.prop(f, "chair", 18.5 + i * 4.5, 16.2);
    FB.prop(f, "sign", 22, 12.6, { text: "COMPUTER LAB", size: 9, h: 60, walk: true, color: "rgba(122,229,130,0.85)" });
    FB.prop(f, "servrack", 29.5, 14);
    // memories corner (south-west)
    FB.prop(f, "desk", 3, 15, { fw: 2, screen: "#ffd166" });
    FB.prop(f, "coffeemachine", 2, 18);
    FB.prop(f, "lamp", 6, 15);
    FB.prop(f, "sign", 3, 14.2, { text: "THE LATE-NIGHT DESK", size: 8, h: 58, walk: true, color: "rgba(255,209,102,0.8)" });
    FB.prop(f, "photowall", 9, 17, { fw: 3 });
    FB.prop(f, "trophycase", 9, 20, { fw: 2 });
    FB.prop(f, "plant", 14, 18); FB.prop(f, "tallplant", 14, 15);
    // zones
    FB.zone(f, "education", 1, 1, 14, 10, "Lecture Hall", "8 AM classes, survived");
    FB.zone(f, "library", 17, 1, 14, 10, "The Library", "one shelf is watching you");
    FB.zone(f, "complab", 17, 13, 14, 8, "Computer Lab", "where the first bugs hatched");
    FB.zone(f, "memories", 1, 12, 14, 9, "Memories Corner", "coffee-stained and proud");
    // interacts
    FB.inter(f, 6, 6, "DTU — the story", () => UI.showInfo("dtu"), 2.6, 80);
    FB.inter(f, 21, 8.8, "Browse the library", () => UI.showInfo("library"), 2.2, 70);
    FB.inter(f, 19.5, 6.8, "This shelf feels… heavy", () => Easter.murph(), 1.6, 70);
    FB.inter(f, 4, 16.2, "The late-night desk", () => UI.showInfo("dtu"), 1.8, 60);
    FB.inter(f, 10.5, 18.2, "Old photographs", () => UI.photoWall(), 1.8, 70);
    FB.elevator(f, 1, 11);
    FB.npc(f, "student", 8, 11.5, { wander: [2, 10.5, 26, 4] });
    FB.npc(f, "student", 20, 10, { wander: [17, 7.5, 12, 3] });
    FB.npc(f, "student", 24, 17, { wander: [17.5, 13.5, 12, 6] });
    f.spawn = { x: 4, y: 12 };
    return f;
  },

  /* ============ FLOOR 4 — ACHIEVEMENTS GALLERY ============ */
  make4() {
    const f = FB.create(4, 30, 20);
    FB.fill(f, 1, 1, 28, 18, 1);
    FB.fill(f, 5, 5, 20, 10, 2);
    // exhibits along north wall
    FB.prop(f, "artframe", 3, 1.4, { fw: 3, big: "RANK 315", small: "CodeKaze · 200,000+ coders", color: "#e8b34b" });
    FB.prop(f, "artframe", 8, 1.4, { fw: 3, big: "TOP 30 / 800", small: "Hack with CW · 2020", color: "#57d8ff" });
    FB.prop(f, "artframe", 13, 1.4, { fw: 3, big: "5TH · NATIONAL", small: "IC² Business Plan · Enactus", color: "#7ae582" });
    FB.prop(f, "artframe", 18, 1.4, { fw: 3, big: "600 → 1200+", small: "Sahitya DTU · Joint Secretary", color: "#c084fc" });
    FB.prop(f, "artframe", 23, 1.4, { fw: 3, big: "8.83 CGPA", small: "DTU · Computer Engineering", color: "#ff9e4d" });
    // center pedestals
    FB.prop(f, "pedestal", 9, 8, { item: "trophy", label: "CodeKaze — AIR 315" });
    FB.prop(f, "pedestal", 14.5, 7, { item: "trophy", label: "Hack with CW — Top 30" });
    FB.prop(f, "pedestal", 20, 8, { item: "trophy", label: "IC² — 5th nationally" });
    FB.prop(f, "trophycase", 4, 16, { fw: 3 });
    FB.prop(f, "trophycase", 23, 16, { fw: 3 });
    FB.prop(f, "rug", 8, 6, { fw: 14, fh: 8, flat: true, walk: true, color: "rgba(232,179,75,0.06)" });
    FB.prop(f, "plant", 2, 10); FB.prop(f, "plant", 27, 10);
    FB.prop(f, "lamp", 6, 5.5); FB.prop(f, "lamp", 23, 5.5);
    FB.prop(f, "sign", 12, 18.4, { text: "TIMELINE WALL →", size: 9, h: 50, walk: true, color: "rgba(255,255,255,0.5)" });
    FB.prop(f, "whiteboard", 10, 17.4, { fw: 4, text: "2018 → 2026: XII 90.4% · DTU · Intern · SDE II · Senior SE" });
    // confetti trigger + zone
    FB.ex(f, "confetti", 12, 8, 6, 4, "gallery");
    FB.zone(f, "gallery", 1, 1, 28, 18, "Achievements Gallery", "please applaud responsibly");
    FB.inter(f, 9, 9.4, "CodeKaze — Rank 315", () => UI.showInfo("codekaze"), 1.8, 60);
    FB.inter(f, 14.5, 8.4, "Hack with CW — Top 30", () => UI.showInfo("hackathon"), 1.8, 60);
    FB.inter(f, 20, 9.4, "Enactus — IC² 5th", () => UI.showInfo("enactus"), 1.8, 60);
    FB.inter(f, 19.5, 3.6, "Sahitya DTU", () => UI.showInfo("sahitya"), 2, 80);
    FB.inter(f, 12, 17.6, "Interactive timeline", () => UI.timeline(), 2.2, 70);
    FB.elevator(f, 1, 9);
    FB.npc(f, "recruiter", 16, 12, { wander: [6, 6, 18, 8] });
    FB.npc(f, "visitor", 10, 12, { wander: [6, 6, 18, 8] });
    f.spawn = { x: 4, y: 10 };
    return f;
  },

  /* ============ FLOOR 5 — OPEN SOURCE LAB ============ */
  make5() {
    const f = FB.create(5, 28, 20);
    FB.fill(f, 1, 1, 26, 18, 1);
    FB.fill(f, 4, 3, 20, 8, 2);
    // subway exhibit center-north
    FB.ex(f, "subway", 8, 4, 8, 4, "opensource");
    FB.prop(f, "sign", 11, 2.6, { text: "COMMIT SUBWAY · LIVE", size: 9, h: 66, walk: true, color: "rgba(74,222,128,0.9)" });
    // github wall
    FB.prop(f, "whiteboard", 22, 1.4, { fw: 3, text: "github.com/benasus25" });
    // repo pods (floating crates)
    const repoCols = ["#2d4a3a", "#2a3d5c", "#4a3a2d", "#3d2d4a", "#2d4a4a"];
    CONTENT.repos.forEach((r, i) => {
      const px = 3 + (i % 5) * 4.6, py = 12.5 + Math.floor(i / 5) * 3.4;
      FB.prop(f, "crate", px, py, { fw: 1.4, fh: 1.4, hh: 16, z: 6, color: repoCols[i % 5], text: r.name.slice(0, 14) });
      FB.inter(f, px + 0.7, py + 2.2, `${r.name} (${r.lang})`, () => {
        UI.showInfo({ title: r.name, sub: `${r.lang} · github.com/benasus25`, body: r.desc + ".", links: [["Open GitHub", "github"]] });
      }, 1.4, 45);
    });
    FB.prop(f, "servrack", 26, 4); FB.prop(f, "servrack", 26, 6);
    FB.prop(f, "plant", 1.5, 4); FB.prop(f, "tallplant", 1.5, 16);
    FB.zone(f, "opensource", 1, 1, 26, 18, "Open Source Lab", "branches grow like trees");
    FB.inter(f, 12, 9, "The GitHub Wall", () => UI.showInfo("github"), 2.6, 80);
    FB.elevator(f, 1, 8);
    FB.npc(f, "dev", 14, 10.5, { wander: [3, 3, 20, 8] });
    FB.npc(f, "dev", 8, 16, { wander: [3, 12, 22, 6] });
    f.spawn = { x: 4, y: 9 };
    return f;
  },

  /* ============ FLOOR 6 — TECH ARSENAL ============ */
  make6() {
    const f = FB.create(6, 34, 24);
    FB.fill(f, 1, 1, 32, 22, 1);
    FB.fill(f, 1, 10, 32, 4, 2);                     // central corridor
    FB.wallH(f, 1, 9, 32, [4, 5, 13, 14, 22, 23, 29, 30]);
    FB.wallV(f, 9, 1, 8); FB.wallV(f, 18, 1, 8); FB.wallV(f, 26, 1, 8);
    FB.wallH(f, 1, 14, 32, [6, 7, 17, 18, 27, 28]);
    FB.wallV(f, 12, 15, 8); FB.wallV(f, 23, 15, 8);
    // JVM bay
    FB.prop(f, "sign", 3, 8.6, { text: "JAVA · JVM BAY", size: 9, h: 60, walk: true, color: "rgba(255,158,77,0.9)" });
    FB.ex(f, "jvm", 2, 3, 6, 3.5, "java");
    // RabbitMQ bay
    FB.prop(f, "sign", 12, 8.6, { text: "RABBITMQ CONTROL", size: 9, h: 60, walk: true, color: "rgba(255,158,77,0.9)" });
    FB.ex(f, "queue", 10, 3, 7, 3, "rabbitmq");
    // Redis chamber
    FB.prop(f, "sign", 21, 8.6, { text: "REDIS CHAMBER", size: 9, h: 60, walk: true, color: "rgba(255,95,69,0.9)" });
    FB.ex(f, "redis", 19.5, 3, 5.5, 3.5, "redis");
    // Docker yard
    FB.prop(f, "sign", 29, 8.6, { text: "CONTAINER YARD", size: 9, h: 60, walk: true, color: "rgba(87,216,255,0.9)" });
    FB.prop(f, "crate", 27.5, 2, { fw: 1.6, fh: 1.6, hh: 18, color: "#1d63a8", text: "app:v42" });
    FB.prop(f, "crate", 29.6, 2.2, { fw: 1.6, fh: 1.6, hh: 18, color: "#1d84a8", text: "redis:7" });
    FB.prop(f, "crate", 28.4, 4.2, { fw: 1.6, fh: 1.6, hh: 18, color: "#3d6ea5", text: "pg:16" });
    FB.prop(f, "crate", 28.4, 4.2, { fw: 1.6, fh: 1.6, hh: 18, z: 18, color: "#57a0d8", text: "nginx", walk: true });
    // south: postgres vault | death star core | storage
    FB.prop(f, "sign", 5, 14.6, { text: "POSTGRES VAULT", size: 9, h: 60, walk: true, color: "rgba(120,180,255,0.9)" });
    FB.prop(f, "securitygate", 6, 14.2, { walk: true });
    FB.prop(f, "crate", 4, 18, { fw: 2, fh: 2, hh: 34, color: "#2b4a6e", text: "PROD-DB-01" });
    FB.prop(f, "servrack", 8, 17); FB.prop(f, "servrack", 8, 19);
    FB.prop(f, "sign", 16, 14.6, { text: "DEATH STAR CORE", size: 9, h: 60, walk: true, color: "rgba(255,95,69,0.95)" });
    for (let i = 0; i < 4; i++) FB.prop(f, "servrack", 14 + i * 2, 17, { alert: i === 2 });
    for (let i = 0; i < 4; i++) FB.prop(f, "servrack", 14 + i * 2, 20);
    FB.prop(f, "holo", 18, 18.5, { walk: true, color: "rgba(255,95,69,0.3)" });
    FB.prop(f, "sign", 27, 14.6, { text: "STORAGE", size: 9, h: 60, walk: true, color: "rgba(200,200,200,0.7)" });
    FB.prop(f, "crate", 25, 17, { fw: 1.5, fh: 1.5, hh: 20, color: "#5c4a35", text: "" });
    FB.prop(f, "crate", 27, 18.5, { fw: 1.5, fh: 1.5, hh: 20, color: "#5c4a35" });
    FB.prop(f, "pedestal", 30, 17, { item: "pickaxe", label: "diamond pickaxe (found in storage)", glow: "rgba(87,216,255,0.25)" });
    FB.prop(f, "pedestal", 25, 21, { item: "crowbar", label: "in case of headcrabs", glow: "rgba(255,120,90,0.2)" });
    // hidden arc reactor alcove (NW behind jvm bay wall)
    FB.wallH(f, 1, 21, 3, [], false);
    FB.prop(f, "pedestal", 1.6, 22.4, { item: "reactor", label: "", glow: "rgba(120,220,255,0.3)" });
    // zones
    FB.zone(f, "java", 1, 1, 8, 8, "JVM Bay", "heap grows, GC mows");
    FB.zone(f, "rabbitmq", 10, 1, 8, 8, "RabbitMQ Control", "messages with somewhere to be");
    FB.zone(f, "redis", 19, 1, 7, 8, "Redis Chamber", "sub-millisecond crystals");
    FB.zone(f, "docker", 27, 1, 6, 8, "Container Yard", "works on every machine");
    FB.zone(f, "postgres", 1, 15, 11, 8, "Postgres Vault", "the truth lives here");
    FB.zone(f, "deathstar", 13, 15, 10, 8, "Death Star Core", "that's no moon");
    FB.zone(f, "storage", 24, 15, 9, 8, "Storage Room", "misc. legendary items");
    FB.zone(f, "arsenal", 1, 10, 32, 4, "Tech Arsenal", "the workshop hums");
    // interacts
    FB.inter(f, 4.5, 6, "Java — fire up the JVM", () => UI.showInfo("java"), 2.4, 90);
    FB.inter(f, 13, 5.5, "RabbitMQ — open the pipes", () => UI.showInfo("rabbitmq"), 2.4, 90);
    FB.inter(f, 22, 6, "Redis — touch the crystals", () => UI.showInfo("redis"), 2.2, 90);
    FB.inter(f, 29.5, 6, "Docker — inspect containers", () => UI.showInfo("docker"), 2.2, 70);
    FB.inter(f, 5, 20.5, "⚠ PRODUCTION DATABASE", () => Easter.youDied(), 2, 70);
    FB.inter(f, 9, 16, "Postgres — the vault", () => UI.showInfo("postgres"), 1.8, 70);
    FB.inter(f, 18, 19, "Death Star Core", () => UI.showInfo("deathstar"), 2.2, 70);
    FB.inter(f, 30, 18.2, "A very Minecraft pickaxe", () => { AudioSys.sfx("secret"); UI.toast("🔷 Diamond Pickaxe acquired (spiritually)."); }, 1.5, 55);
    FB.inter(f, 25, 22.2, "A familiar crowbar", () => { AudioSys.sfx("secret"); UI.toast("🔧 Gordon would be proud. No headcrabs detected."); }, 1.5, 55);
    FB.inter(f, 1.8, 23.2, "…is that an ARC REACTOR?", () => { AudioSys.sfx("secret"); UI.showInfo("arcreactor"); }, 1.6, 55);
    FB.elevator(f, 1, 11);
    FB.npc(f, "janitor", 20, 12, { wander: [2, 10, 30, 3.5] });
    FB.npc(f, "guard", 28, 11, { patrol: [[28, 11], [4, 11], [4, 12.5], [28, 12.5]] });
    FB.npc(f, "dev", 8, 12, { wander: [2, 10, 30, 3.5] });
    f.spawn = { x: 4, y: 12 };
    return f;
  },

  /* ============ FLOOR 7 — EXECUTIVE OFFICE ============ */
  make7() {
    const f = FB.create(7, 26, 18);
    FB.fill(f, 1, 1, 24, 16, 1);
    FB.fill(f, 6, 4, 14, 9, 6);
    FB.prop(f, "rug", 7, 5, { fw: 12, fh: 7, flat: true, walk: true, color: "rgba(224,181,102,0.08)" });
    // the desk
    FB.prop(f, "execdesk", 10, 5, { fw: 3 });
    FB.prop(f, "chair", 11.2, 7);
    // walls of wisdom
    FB.prop(f, "sign", 10, 1.2, { text: "SHIP. LEARN. REPEAT.", size: 15, h: 74, walk: true, color: "rgba(224,181,102,0.95)", glow: "rgba(224,181,102,0.12)" });
    FB.prop(f, "whiteboard", 17, 1.4, { fw: 3, text: "NEXT: AI · DIST-SYS · KERNELS" });
    FB.prop(f, "bookshelf", 3, 1.6, { fw: 2.5 });
    FB.prop(f, "bookshelf", 3, 5, { fw: 2.5 });
    // comfort
    FB.prop(f, "sofa", 18, 10, { fw: 2.5, color: "#6e5335" });
    FB.prop(f, "ctable", 18.5, 12);
    FB.prop(f, "lamp", 21.5, 10);
    FB.prop(f, "plant", 3, 9); FB.prop(f, "tallplant", 3, 14);
    FB.prop(f, "tallplant", 22, 3); FB.prop(f, "mosswall", 13, 1.15, { fw: 3 });
    FB.prop(f, "coffeemachine", 22.5, 14.5);
    FB.prop(f, "trophycase", 7, 14.5, { fw: 2 });
    FB.prop(f, "holo", 15, 8, { walk: true, color: "rgba(224,181,102,0.25)" });
    FB.zone(f, "executive", 1, 1, 24, 16, "Executive Office", "the rain works overtime here");
    FB.inter(f, 11.5, 7.6, "The desk (try the keyboard)", () => Easter.keyboard(), 2, 75);
    FB.inter(f, 18.2, 3.4, "Goals whiteboard", () => UI.showInfo("goals"), 2.2, 80);
    FB.inter(f, 4.2, 3, "Bookshelves", () => UI.showInfo("library"), 2, 75);
    FB.inter(f, 8, 15.6, "Awards shelf", () => UI.showInfo("codekaze"), 1.8, 55);
    FB.elevator(f, 1, 8);
    FB.npc(f, "dev", 16, 13, { wander: [6, 10, 12, 4], quotePool: "recruiter" });
    f.spawn = { x: 4, y: 9 };
    return f;
  },

  /* ============ SECRET — DEVELOPER DUNGEON ============ */
  makeD() {
    const f = FB.create("D", 20, 14);
    FB.fill(f, 1, 1, 18, 12, 1);
    FB.fill(f, 7, 4, 6, 6, 3);
    FB.prop(f, "sign", 7, 0.9, { text: "DEVELOPER DUNGEON", size: 12, h: 70, walk: true, color: "rgba(168,85,247,0.95)", glow: "rgba(168,85,247,0.15)" });
    FB.prop(f, "stovepot", 4, 3, {});
    FB.prop(f, "sign", 3.2, 2.6, { text: "bug containment", size: 7, h: 34, walk: true, color: "rgba(122,229,130,0.7)" });
    FB.prop(f, "pedestal", 9, 2.5, { item: "duck", label: "Sr. Rubber Duck, Debugging" });
    FB.prop(f, "pedestal", 12, 3, { item: "duck", label: "Staff Duck" });
    FB.prop(f, "pedestal", 15, 5, { item: "duck", label: "Distinguished Duck" });
    FB.prop(f, "shrine", 15.5, 9, {});
    FB.prop(f, "pedestal", 5, 9.5, { item: "cake", label: "the cake", glow: "rgba(255,180,200,0.2)" });
    FB.prop(f, "crate", 2, 6, { fw: 1.4, fh: 1.4, hh: 16, color: "#3d2d4a", text: "TODO: fix" });
    FB.prop(f, "crate", 2, 8.2, { fw: 1.4, fh: 1.4, hh: 16, color: "#3d2d4a", text: "WONTFIX" });
    FB.prop(f, "portal", 17.5, 11, { walk: true });
    FB.zone(f, "dungeon", 1, 1, 18, 12, "Developer Dungeon", "shhh. the bugs are sleeping");
    FB.inter(f, 5, 10.6, "A suspicious cake", () => { AudioSys.sfx("secret"); UI.toast("🎂 The cake is a lie. It has always been a lie."); }, 1.5, 55);
    FB.inter(f, 9, 3.6, "Consult the rubber duck", () => { AudioSys.sfx("pop"); UI.toast("🦆 The duck listens. The bug reveals itself. As foretold."); }, 1.5, 55);
    FB.inter(f, 16, 10.2, "Stack Overflow shrine", () => { AudioSys.sfx("blip"); UI.toast("🕯 Marked as duplicate of a question from 2011. Blessed be."); }, 1.7, 60);
    FB.inter(f, 4.5, 4.2, "Bug containment cauldron", () => { AudioSys.sfx("pop"); UI.toast("🐛 One production bug attempted escape. It was refactored."); }, 1.6, 55);
    FB.trans(f, 16.5, 10, 3, 3, () => {
      AudioSys.sfx("portal");
      Game.loadFloor(2, { x: 28.5, y: 19.5 });
      UI.toast("Back in the Projects Lab. That never happened. 🌀");
    });
    FB.npc(f, "janitor", 10, 8, { wander: [3, 3, 14, 8] });
    f.spawn = { x: 10, y: 11 };
    return f;
  },
};
