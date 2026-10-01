/* ============================================================
   SPARSH HQ — actors.js
   Player, NPCs, the holographic guide, and pathfinding.
   ============================================================ */

const Path = {
  bfs(floor, sx, sy, tx, ty) {
    sx = Math.floor(sx); sy = Math.floor(sy); tx = Math.floor(tx); ty = Math.floor(ty);
    if (tx < 0 || ty < 0 || tx >= floor.w || ty >= floor.h) return null;
    // snap target to nearest walkable
    if (floor.block[ty][tx]) {
      let best = null, bd = 1e9;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const nx = tx + dx, ny = ty + dy;
        if (nx < 0 || ny < 0 || nx >= floor.w || ny >= floor.h || floor.block[ny][nx]) continue;
        const d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = [nx, ny]; }
      }
      if (!best) return null;
      tx = best[0]; ty = best[1];
    }
    const key = (x, y) => y * floor.w + x;
    const prev = new Map(); const q = [[sx, sy]];
    prev.set(key(sx, sy), null);
    let found = false;
    while (q.length) {
      const [cx, cy] = q.shift();
      if (cx === tx && cy === ty) { found = true; break; }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= floor.w || ny >= floor.h) continue;
        if (floor.block[ny][nx] || prev.has(key(nx, ny))) continue;
        prev.set(key(nx, ny), [cx, cy]);
        q.push([nx, ny]);
      }
    }
    if (!found) return null;
    const path = []; let cur = [tx, ty];
    while (cur) { path.push({ x: cur[0] + 0.5, y: cur[1] + 0.5 }); cur = prev.get(key(cur[0], cur[1])); }
    path.reverse(); path.shift();
    return path;
  },
};

/* ---------- shared person base ---------- */
class Person {
  constructor(x, y, cfg) {
    this.x = x; this.y = y;
    this.cfg = cfg;
    this.speed = 3.4;
    this.moving = false;
    this.faceX = 0; this.faceY = 1;
    this.seed = Math.random() * 100;
    this.bubble = null;
    this.path = [];
  }
  say(text, dur = 3.5) { this.bubble = { text, t: dur }; }
  tickBubble(dt) { if (this.bubble) { this.bubble.t -= dt; if (this.bubble.t <= 0) this.bubble = null; } }

  tryMove(dx, dy, dt) {
    const f = Game.floor, r = 0.28;
    const walkable = (wx, wy) => {
      const tx = Math.floor(wx), ty = Math.floor(wy);
      return tx >= 0 && ty >= 0 && tx < f.w && ty < f.h && !f.block[ty][tx];
    };
    let nx = this.x + dx * this.speed * dt;
    if (walkable(nx + Math.sign(dx) * r, this.y)) this.x = nx;
    let ny = this.y + dy * this.speed * dt;
    if (walkable(this.x, ny + Math.sign(dy) * r)) this.y = ny;
    if (dx || dy) { this.faceX = dx; this.faceY = dy; }
  }

  followPath(dt) {
    if (!this.path.length) return false;
    const wp = this.path[0];
    const dx = wp.x - this.x, dy = wp.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.15) { this.path.shift(); return this.path.length > 0; }
    this.tryMove(dx / d, dy / d, dt);
    return true;
  }
}

/* ---------- player ---------- */
class Player extends Person {
  constructor(x, y) {
    super(x, y, { skin: "#e8b88a", hair: "#2b2018", shirt: "#33506e", pants: "#252a35", acc: null });
    this.speed = 4.3;
    this.tag = "YOU";
    this.clickMark = null;
    this.stepT = 0;
  }
  update(dt) {
    const ax = Input.axis();
    let moved = false;
    if (ax.x || ax.y) {
      this.path = [];
      this.tryMove(ax.x, ax.y, dt);
      moved = true;
    } else if (this.followPath(dt)) {
      moved = true;
    }
    this.moving = moved;
    if (moved) {
      this.stepT -= dt;
      if (this.stepT <= 0) { this.stepT = 0.28; AudioSys.sfx("steps"); }
    }
    // click to walk
    if (Input.mouse.clicked && !UI.modalOpen()) {
      const w = Camera.screenToWorld(Input.mouse.x, Input.mouse.y, Game.canvas);
      // clicking near an interactable you're close to = use it
      let used = false;
      for (const it of Game.floor.interact) {
        if (U.dist(w.x, w.y, it.x, it.y) < 1.3 && U.dist(this.x, this.y, it.x, it.y) < it.r) {
          AudioSys.sfx("blip"); it.fn(); used = true; break;
        }
      }
      if (!used) {
        const p = Path.bfs(Game.floor, this.x, this.y, w.x, w.y);
        if (p) { this.path = p; this.clickMark = { x: w.x, y: w.y, t: 1 }; }
      }
    }
    this.tickBubble(dt);
    // transitions
    for (const tr of Game.floor.transitions) {
      const inside = this.x >= tr.x && this.x < tr.x + tr.w && this.y >= tr.y && this.y < tr.y + tr.h;
      if (inside && !tr.active) { tr.active = true; tr.fn(); }
      else if (!inside) tr.active = false;
    }
  }
}

/* ---------- NPCs ---------- */
const NPC_KINDS = {
  dev:      { pool: "dev",      cfgs: [{ shirt: "#4a6e8c", hair: "#2b2018" }, { shirt: "#6e4a8c", hair: "#4a3020" }, { shirt: "#3f6e50", hair: "#101010" }, { shirt: "#8c6e4a", hair: "#3a2a1a" }] },
  barista:  { pool: "barista",  cfgs: [{ shirt: "#5c4033", hair: "#1a1a1a", acc: "mug" }] },
  guard:    { pool: "guard",    cfgs: [{ shirt: "#2b3a55", hair: "#111", acc: "cap", pants: "#1c2333" }] },
  janitor:  { pool: "janitor",  cfgs: [{ shirt: "#66707e", hair: "#555", acc: "mop" }] },
  recruiter:{ pool: "recruiter",cfgs: [{ shirt: "#7e3a4a", hair: "#2a1a10", acc: "clipboard" }] },
  student:  { pool: "student",  cfgs: [{ shirt: "#8c8c3f", hair: "#222" }, { shirt: "#3f7e8c", hair: "#3a2a1a" }] },
  doctor:   { pool: "doctor",   cfgs: [{ shirt: "#e8ecf0", hair: "#333", pants: "#3a4a5c" }] },
  visitor:  { pool: "recruiter",cfgs: [{ shirt: "#6e6e7e", hair: "#2a2a2a" }, { shirt: "#4a5e3f", hair: "#1a1a1a" }] },
  nova:     { pool: null,       cfgs: [{ shirt: "#28c8b4", hair: "#d8e8f0", skin: "#cfd8e8", pants: "#1e6e64" }] },
};

class NPC extends Person {
  constructor(spec) {
    const kind = NPC_KINDS[spec.kind] || NPC_KINDS.dev;
    const base = U.pick(kind.cfgs);
    super(spec.x, spec.y, Object.assign({ skin: U.pick(["#e8b88a", "#c68a5c", "#8c5a3a", "#f0c8a0"]), pants: "#2a2f3a", acc: null }, base));
    this.spec = spec;
    this.kind = spec.kind;
    this.pool = spec.quotePool || kind.pool;
    this.speed = U.rand(1.4, 2.1);
    this.wait = U.rand(1, 4);
    this.quoteT = U.rand(4, 14);
    this.patrolIdx = 0;
    if (spec.kind === "nova") { this.tag = "NOVA"; this.novaT = U.rand(6, 10); }
  }

  update(dt) {
    this.tickBubble(dt);
    const s = this.spec;
    if (s.static) {
      this.moving = false;
      if (s.quote && !this.bubble && Math.random() < dt * 0.12) this.say(s.quote, 4);
      if (this.kind === "nova") {
        this.novaT -= dt;
        if (this.novaT <= 0 && !this.bubble) {
          this.novaT = U.rand(10, 18);
          if (U.dist(Game.player.x, Game.player.y, this.x, this.y) < 5)
            this.say(U.pick(["Welcome to Sparsh HQ. ✨", "Press E to talk to me!", "The elevator is to the east.", "Do try the coffee bar."]), 4);
        }
      }
      return;
    }
    if (s.patrol) {
      const t = s.patrol[this.patrolIdx];
      const d = U.dist(this.x, this.y, t[0], t[1]);
      if (d < 0.3) this.patrolIdx = (this.patrolIdx + 1) % s.patrol.length;
      else { this.tryMove((t[0] - this.x) / d, (t[1] - this.y) / d, dt); this.moving = true; }
    } else if (s.wander) {
      if (this.path.length) { this.moving = this.followPath(dt); }
      else {
        this.moving = false;
        this.wait -= dt;
        if (this.wait <= 0) {
          this.wait = U.rand(2, 6);
          const [wx, wy, ww, wh] = s.wander;
          const p = Path.bfs(Game.floor, this.x, this.y, wx + Math.random() * ww, wy + Math.random() * wh);
          if (p && p.length) this.path = p;
        }
      }
    }
    // chatter
    if (this.pool) {
      this.quoteT -= dt;
      if (this.quoteT <= 0) {
        this.quoteT = U.rand(9, 22);
        if (U.dist(Game.player.x, Game.player.y, this.x, this.y) < 8 && !this.bubble)
          this.say(U.pick(CONTENT.npcQuotes[this.pool]), 4);
      }
    }
  }
}

/* ---------- the guide hologram ---------- */
class Guide extends Person {
  constructor() {
    super(0, 0, { skin: "#9fd8e8", hair: "#57a8c8", shirt: "#2a7e9e", pants: "#1e5a72" });
    this.holo = true;
    this.tag = "SPARSH.AI";
    this.speed = 4.1;
    this.spoken = new Set();
  }
  update(dt) {
    this.tickBubble(dt);
    const px = Game.player.x - Game.player.faceX * 0.4 - 0.8;
    const py = Game.player.y - Game.player.faceY * 0.4 + 0.8;
    const d = U.dist(this.x, this.y, px, py);
    if (d > 6) { this.x = px; this.y = py; }
    else if (d > 1.1) {
      // drift toward heel position (holograms ignore walls; it's fine, he's software)
      this.x += ((px - this.x) / d) * Math.min(this.speed, d * 2.4) * dt;
      this.y += ((py - this.y) / d) * Math.min(this.speed, d * 2.4) * dt;
      this.moving = true;
      this.faceX = px - this.x; this.faceY = py - this.y;
    } else this.moving = false;
  }
  roomLine(roomId) {
    const lines = CONTENT.guideLines[roomId];
    if (!lines || this.spoken.has(roomId)) return;
    this.spoken.add(roomId);
    setTimeout(() => this.say(U.pick(lines), 5), 700);
  }
}

/* ---------- world logic helpers ---------- */
const Actors = {
  spawnNPCs(floor) {
    return floor.npcSpecs.map((s) => new NPC(s));
  },

  checkRoom() {
    const p = Game.player, f = Game.floor;
    let found = null;
    for (const r of f.rooms) {
      if (p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h) { found = r; }
    }
    const id = found ? found.id : null;
    if (id !== Game.currentRoom) {
      Game.currentRoom = id;
      if (found) {
        UI.banner(found.name, found.sub);
        Game.guide.roomLine(id);
      }
    }
  },

  checkInteract() {
    const p = Game.player, f = Game.floor;
    let best = null, bd = 1e9;
    for (const it of f.interact) {
      const d = U.dist(p.x, p.y, it.x, it.y);
      if (d < it.r && d < bd) { bd = d; best = it; }
    }
    UI.hint(best ? best.label : null);
    if (best && Input.consume("e")) { AudioSys.sfx("blip"); best.fn(); }
  },
};
