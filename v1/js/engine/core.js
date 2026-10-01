/* ============================================================
   SPARSH HQ — core.js
   Game loop, input, camera, isometric math, shared utilities.
   ============================================================ */

/* ---------- utilities ---------- */
const U = {
  clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
  lerp: (a, b, t) => a + (b - a) * t,
  rand: (a, b) => a + Math.random() * (b - a),
  randi: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
  easeOut: (t) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
};

/* ---------- isometric projection ---------- */
const ISO = {
  HX: 32, HY: 16, WALL: 68,
  toScreen(wx, wy, wz = 0) { return { x: (wx - wy) * ISO.HX, y: (wx + wy) * ISO.HY - wz }; },
  toWorld(sx, sy) { return { x: sx / (2 * ISO.HX) + sy / (2 * ISO.HY), y: sy / (2 * ISO.HY) - sx / (2 * ISO.HX) }; },
};

/* ---------- input ---------- */
const Input = {
  keys: new Set(),
  pressed: new Set(),           // consumed-once keys
  mouse: { x: 0, y: 0, down: false, clicked: false, wx: 0, wy: 0 },
  konamiBuf: [],

  init(canvas) {
    window.addEventListener("keydown", (e) => {
      if (e.repeat) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      Input.keys.add(k); Input.pressed.add(k);
      Input.konamiBuf.push(e.key); if (Input.konamiBuf.length > 12) Input.konamiBuf.shift();
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        if (!UI.isTyping()) e.preventDefault();
      }
    });
    window.addEventListener("keyup", (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      Input.keys.delete(k);
    });
    window.addEventListener("blur", () => Input.keys.clear());
    canvas.addEventListener("mousemove", (e) => {
      const r = canvas.getBoundingClientRect();
      Input.mouse.x = e.clientX - r.left; Input.mouse.y = e.clientY - r.top;
    });
    canvas.addEventListener("mousedown", () => { Input.mouse.down = true; });
    canvas.addEventListener("mouseup", () => { Input.mouse.down = false; });
    canvas.addEventListener("click", (e) => {
      const r = canvas.getBoundingClientRect();
      Input.mouse.x = e.clientX - r.left; Input.mouse.y = e.clientY - r.top;
      Input.mouse.clicked = true;
    });
    // touch → treat as click-to-walk
    canvas.addEventListener("touchend", (e) => {
      if (e.changedTouches.length) {
        const t = e.changedTouches[0], r = canvas.getBoundingClientRect();
        Input.mouse.x = t.clientX - r.left; Input.mouse.y = t.clientY - r.top;
        Input.mouse.clicked = true;
      }
    }, { passive: true });
  },

  // WASD/arrows → world-space direction (screen-up = NW in world)
  axis() {
    if (UI.isTyping()) return { x: 0, y: 0 };
    let kx = 0, ky = 0;
    if (Input.keys.has("a") || Input.keys.has("ArrowLeft")) kx -= 1;
    if (Input.keys.has("d") || Input.keys.has("ArrowRight")) kx += 1;
    if (Input.keys.has("w") || Input.keys.has("ArrowUp")) ky -= 1;
    if (Input.keys.has("s") || Input.keys.has("ArrowDown")) ky += 1;
    if (!kx && !ky) return { x: 0, y: 0 };
    let wx = kx + ky, wy = ky - kx;
    const m = Math.hypot(wx, wy) || 1;
    return { x: wx / m, y: wy / m };
  },

  consume(k) { const had = Input.pressed.has(k); Input.pressed.delete(k); return had; },
  endFrame() { Input.pressed.clear(); Input.mouse.clicked = false; },
};

/* ---------- camera ---------- */
const Camera = {
  x: 0, y: 0, zoom: 1.1,
  tx: 0, ty: 0, tzoom: 1.1,
  shake: 0,

  jumpTo(wx, wy, zoom) {
    Camera.x = Camera.tx = wx; Camera.y = Camera.ty = wy;
    if (zoom) Camera.zoom = Camera.tzoom = zoom;
  },
  follow(wx, wy) { Camera.tx = wx; Camera.ty = wy; },

  update(dt) {
    const s = 1 - Math.pow(0.0015, dt);
    Camera.x = U.lerp(Camera.x, Camera.tx, s);
    Camera.y = U.lerp(Camera.y, Camera.ty, s);
    Camera.zoom = U.lerp(Camera.zoom, Camera.tzoom, 1 - Math.pow(0.005, dt));
    Camera.shake = Math.max(0, Camera.shake - dt * 3);
  },

  // CSS pixel → world tile coords (mouse coords are CSS px; buffer is DPR-scaled)
  screenToWorld(sx, sy, canvas) {
    const D = (typeof Renderer !== "undefined" && Renderer.dpr) || 1;
    const c = ISO.toScreen(Camera.x, Camera.y);
    const px = (sx - canvas.width / (2 * D)) / Camera.zoom + c.x;
    const py = (sy - canvas.height / (2 * D)) / Camera.zoom + c.y;
    return ISO.toWorld(px, py);
  },

  // apply world-pixel transform to ctx (DPR-aware for crisp hiDPI rendering)
  apply(ctx, canvas) {
    const D = (typeof Renderer !== "undefined" && Renderer.dpr) || 1;
    const c = ISO.toScreen(Camera.x, Camera.y);
    const shx = Camera.shake ? U.rand(-6, 6) * Camera.shake : 0;
    const shy = Camera.shake ? U.rand(-4, 4) * Camera.shake : 0;
    ctx.setTransform(Camera.zoom * D, 0, 0, Camera.zoom * D,
      canvas.width / 2 - (c.x * Camera.zoom - shx) * D,
      canvas.height / 2 - (c.y * Camera.zoom - shy) * D);
  },
};

/* ---------- game ---------- */
const Game = {
  state: "splash",         // splash | play | transition | cinematic | dead
  floorIndex: "P",         // "P" plaza | 0..7 | "D" dungeon
  floor: null,
  player: null,
  guide: null,
  npcs: [],
  particles: [],
  time: 0,
  visited: new Set(),
  flags: { emergencyPresses: 0, retro: false, enteredBuilding: false, guestbookDone: false },
  currentRoom: null,
  _accum: 0, _last: 0,

  init(canvas) {
    Game.canvas = canvas;
    Input.init(canvas);
    Game._last = performance.now();
    requestAnimationFrame(Game.loop);
  },

  start() {
    Game.state = "play";
    Game.loadFloor("P", null);
    UI.hudVisible(true);
    UI.toast("WASD / arrows to walk · E to interact · click to stroll", 6000);
  },

  loadFloor(idx, spawn) {
    Game.floorIndex = idx;
    Game.floor = Floors.build(idx);
    const sp = spawn || Game.floor.spawn;
    if (!Game.player) Game.player = new Player(sp.x, sp.y);
    Game.player.x = sp.x; Game.player.y = sp.y;
    Game.player.path = []; Game.player.target = null;
    Game.guide = Game.guide || new Guide();
    Game.guide.x = sp.x - 0.9; Game.guide.y = sp.y + 0.9;
    Game.npcs = Actors.spawnNPCs(Game.floor);
    Game.particles = [];
    Game.currentRoom = null;
    Camera.jumpTo(idx === "P" ? U.lerp(sp.x, 13, 0.55) : sp.x, idx === "P" ? U.lerp(sp.y, 2, 0.55) : sp.y,
      idx === "P" ? Math.min(0.68, Game.canvas.width / 780) : 1.12);
    Renderer.onFloorChange(Game.floor);
    AudioSys.setFloor(idx);
    const meta = Floors.meta(idx);
    UI.setFloorPill(meta.label, meta.sub);
    if (idx !== "P" && idx !== "D" && !Game.visited.has(idx)) {
      Game.visited.add(idx);
      UI.banner(meta.label, meta.sub);
    }
  },

  changeFloor(idx, viaElevator = true) {
    if (Game.state === "transition") return;
    if (idx === Game.floorIndex) { UI.toast("You're already on this floor."); return; }
    Game.state = "transition";
    UI.elevatorRide(Game.floorIndex, idx, () => {
      Game.loadFloor(idx, null);
      Game.state = "play";
    });
  },

  spawnParticle(p) {
    p.life = p.life || 1; p.maxLife = p.life;
    if (Game.particles.length < 600) Game.particles.push(p);
  },

  burst(wx, wy, n, colorFn, speed = 2) {
    for (let i = 0; i < n; i++) {
      const a = U.rand(0, Math.PI * 2), v = U.rand(0.3, 1) * speed;
      Game.spawnParticle({
        x: wx, y: wy, z: U.rand(10, 40),
        vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: U.rand(30, 110),
        grav: -160, size: U.rand(2, 4.5), life: U.rand(0.8, 1.6),
        color: colorFn(i), type: "confetti",
      });
    }
  },

  updateParticles(dt) {
    for (let i = Game.particles.length - 1; i >= 0; i--) {
      const p = Game.particles[i];
      p.life -= dt;
      if (p.life <= 0) { Game.particles.splice(i, 1); continue; }
      p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt;
      if (p.vz !== undefined) { p.z += p.vz * dt; p.vz += (p.grav || 0) * dt; if (p.z < 0) { p.z = 0; p.vz *= -0.4; } }
    }
  },

  loop(now) {
    let dt = Math.min(0.05, (now - Game._last) / 1000);
    Game._last = now;
    Game.time += dt;

    if (Game.state === "play" || Game.state === "cinematic") {
      if (Game.state === "play") {
        Game.player.update(dt);
        Game.guide.update(dt);
        for (const n of Game.npcs) n.update(dt);
        Actors.checkRoom();
        Actors.checkInteract();
      }
      Game.updateParticles(dt);
      Exhibits.updateAll(dt);
      if (Game.floorIndex === "P") {
        // outside: keep the tower and its sign in frame, whatever the viewport
        Camera.follow(U.lerp(Game.player.x, 13, 0.55), U.lerp(Game.player.y, 2, 0.55));
        Camera.tzoom = Math.min(0.68, Game.canvas.width / 780);
      } else {
        Camera.follow(Game.player.x, Game.player.y);
      }
    }
    Camera.update(dt);
    Renderer.frame(dt);
    Input.endFrame();
    requestAnimationFrame(Game.loop);
  },
};
