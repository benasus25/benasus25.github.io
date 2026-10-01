/* ============================================================
   SPARSH HQ v4 — guide.js
   The guide is me. You meet me in the lobby as a whole person;
   I fold myself into a small glowing orb and float at your
   shoulder for the rest of the visit, narrating whatever you
   walk up to — no key presses needed.
   ============================================================ */

const Guide = {
  /* radial glow texture shared by the orb sprites */
  glowTex() {
    if (Guide._tex) return Guide._tex;
    Guide._tex = Kit.canvasTex(128, 128, (c, w, h) => {
      const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.18, "rgba(200,240,255,0.85)");
      g.addColorStop(0.45, "rgba(90,190,255,0.28)"); g.addColorStop(1, "rgba(40,120,255,0)");
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    });
    return Guide._tex;
  },

  create() {
    const root = new THREE.Group();
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.085, 20, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xd8f4ff).multiplyScalar(3.2) }));
    root.add(core);
    const sm = (op, sc) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: Guide.glowTex(), color: 0x8fdcff, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false }));
      s.scale.setScalar(sc); root.add(s); return s;
    };
    const glow = sm(1.0, 0.8), halo = sm(0.32, 1.9);
    const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: Kit.canvasTex(256, 64, (c) => {
      c.font = `800 26px ${Kit.FONT}`; c.textAlign = "center"; c.shadowColor = "#57d8ff"; c.shadowBlur = 12;
      c.fillStyle = "#e8f8ff"; c.fillText("SPARSH", 128, 40);
    }), transparent: true, opacity: 0.7, depthWrite: false }));
    tag.scale.set(0.5, 0.125, 1); tag.position.y = 0.24; root.add(tag);
    // a short comet tail
    const trail = [];
    for (let i = 0; i < 9; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: Guide.glowTex(), color: 0x7fd0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      s.scale.setScalar(0.22 * (1 - i / 10)); trail.push(s);
    }
    const G = { root, core, glow, halo, tag, trail, hist: [], histT: 0, vel: new THREE.Vector3(), pulse: 0, met: false, cine: false, focus: null, quipT: 40 };
    root.visible = false;
    Game.guide = G;
    return G;
  },

  /* follow the visitor: float at the shoulder on the camera's side, lean toward whatever they're looking at */
  update(dt, t) {
    const g = Game.guide, p = Game.player;
    if (!g) return;
    if (g.trailParent !== Game.F && Game.F) { for (const s of g.trail) Game.F.group.add(s); g.trailParent = Game.F; }
    g.root.visible = g.met || g.cine;
    for (const s of g.trail) s.visible = g.root.visible;
    if (!g.root.visible) return;
    const r = g.root.position;
    if (!g.cine) {
      const yaw = Game.cam.yaw, rx = -Math.cos(yaw), rz = Math.sin(yaw), fx = Math.sin(yaw), fz = Math.cos(yaw);
      let tx = p.x + rx * 0.75 - fx * 0.35, tz = p.z + rz * 0.75 - fz * 0.35, ty = 2.0 + Math.sin(t * 2.1) * 0.07;
      if (g.focus) { tx = U.lerp(tx, g.focus.x, 0.28); tz = U.lerp(tz, g.focus.z, 0.28); ty = U.lerp(ty, Math.min(2.6, g.focus.y || 2), 0.3); }
      if (Math.hypot(tx - r.x, tz - r.z) > 9) { r.set(tx, ty, tz); g.vel.set(0, 0, 0); }
      // critically-damped spring: swoops after you, never jitters
      const k = 34, c = 2 * Math.sqrt(k);
      g.vel.x += (k * (tx - r.x) - c * g.vel.x) * dt;
      g.vel.y += (k * (ty - r.y) - c * g.vel.y) * dt;
      g.vel.z += (k * (tz - r.z) - c * g.vel.z) * dt;
      r.addScaledVector(g.vel, dt);
      g.quipT -= dt;
      if (g.quipT <= 0 && Game.state === "play") { g.quipT = 70 + Math.random() * 50; Game.guideSay(U.pick(CONTENT.guideQuips)); }
    }
    g.pulse = Math.max(0, g.pulse - dt * 1.2);
    const s = 1 + g.pulse * 0.45 + Math.sin(t * 6.3) * 0.04;
    g.core.scale.setScalar(s);
    g.glow.scale.setScalar(0.8 * s * (1 + g.pulse * 0.6));
    g.halo.scale.setScalar(1.9 + Math.sin(t * 1.7) * 0.15 + g.pulse * 0.9);
    g.halo.material.opacity = 0.22 + g.pulse * 0.25;
    // tail
    g.histT += dt;
    if (g.histT > 0.028) { g.histT = 0; g.hist.unshift(r.clone()); if (g.hist.length > 10) g.hist.pop(); }
    const speed = g.vel.length();
    g.trail.forEach((sp, i) => {
      const h = g.hist[i + 1]; if (!h) return;
      sp.position.copy(h);
      sp.material.opacity = U.clamp(speed / 3, 0, 1) * 0.55 * (1 - i / 9);
    });
  },

  say(text) {
    UI.say("Sparsh — " + text, Math.max(3800, 1600 + text.length * 55));
    if (Game.guide) Game.guide.pulse = 1;
    AudioSys.sfx("pop");
  },

  /* ---------- walk up to an exhibit: a caption appears and I say a line (once) ---------- */
  cur: null, told: new Set(), lastTold: -99,
  scan() {
    const F = Game.F, p = Game.player, g = Game.guide;
    const el = document.getElementById("caption");
    if (!el) return;
    if (!F || Game.state !== "play") { if (Guide.cur) { Guide.show(null); Guide.cur = null; if (g) g.focus = null; } return; }
    let best = null, bd = 1e9;
    for (const it of F.interact) {
      if (!it.ref) continue;
      const d = Math.hypot(p.x - it.x, p.z - it.z);
      if (d < Math.max(2.4, it.r + 1.1) && d < bd) { bd = d; best = it; }
    }
    const c = Guide.cur;                                       // a little stickiness so it doesn't flicker
    if (c && c !== best) { const d = Math.hypot(p.x - c.x, p.z - c.z); if (d < Math.max(2.4, c.r + 1.1) + 0.6 && (!best || bd > d - 0.35)) best = c; }
    if (best !== Guide.cur) {
      Guide.cur = best;
      Guide.show(best);
      if (g) g.focus = best ? (best.focus || { x: best.x, y: best.y, z: best.z }) : null;
      if (best && g && g.met) {
        const id = Cards.idOf(Cards.kindOf(best.ref), best.ref), line = Guide.lineFor(best.ref);
        if (line && !Guide.told.has(id) && Game.time - Guide.lastTold > 4.5) { Guide.told.add(id); Guide.lastTold = Game.time; Guide.say(line); }
      }
    }
    el.classList.toggle("muted", !UI.els.panel.classList.contains("hidden") || !document.getElementById("modal-wrap").classList.contains("hidden"));
  },
  show(it) {
    const el = document.getElementById("caption");
    document.body.classList.toggle("has-cap", !!it);
    if (!it) { el.classList.remove("on"); return; }
    el.innerHTML = Cards.caption(it.ref);
    el.style.setProperty("--acc", Cards.hex(it.ref.accent));
    el.classList.add("on");
    if (Game.time > 1) Cards.markSeen(Cards.kindOf(it.ref), it.ref);
  },
  lineFor(o) {
    const k = Cards.kindOf(o);
    if (o.say) return o.say;
    if (k === "lab" || k === "project" || k === "oss") return o.tagline;
    if (k === "trophy") return Cards.first(o.story);
    if (k === "repo") return o.desc;
    if (k === "edu" || k === "year" || k === "role" || k === "school") return o.say || null;
    if (k === "exec") return "What I'm building next — and the fastest ways to reach me.";
    return null;
  },

  /* ---------- the lobby: meet me, then I become the orb ---------- */
  meet(done) {
    const g = Game.guide, p = Game.player, F = Game.F;
    if (!g || g.met) { if (done) done(); return; }
    Game.state = "cinematic"; Game.cam.mode = "cine"; UI.letterbox(true);
    p.path = null; p.vx = p.vz = 0; p.play("idle", 0.2);
    const me = People.make("character-male-d", {});
    const sx = p.x, sz = p.z - 2.3;
    // clear the set: nobody wanders through the shot, and no "YOU" tag floating about
    const hidden = F.npcs.filter((n) => n.root.visible && Math.hypot(n.root.position.x - sx, n.root.position.z - (sz + 1.2)) < 5.5);
    for (const n of hidden) n.root.visible = false;
    if (p.tag) p.tag.visible = false;
    p.ry = Math.PI; p.root.rotation.set(0, Math.PI, 0);
    me.root.position.set(sx, 0, sz); me.root.rotation.y = 0;
    F.group.add(me.root); me.play("idle", 0);
    const nameTag = new THREE.Sprite(new THREE.SpriteMaterial({ map: Kit.canvasTex(512, 96, (c) => {
      c.font = `800 44px ${Kit.FONT}`; c.textAlign = "center"; c.shadowColor = "rgba(0,0,0,0.7)"; c.shadowBlur = 10;
      c.fillStyle = "#ffd98a"; c.fillText("SPARSH SINHA", 256, 54);
      c.font = `600 22px ${Kit.FONT}`; c.fillStyle = "rgba(255,244,224,0.85)"; c.fillText("the one who built this place", 256, 84);
    }), transparent: true, depthWrite: false }));
    nameTag.scale.set(1.5, 0.28, 1); nameTag.position.y = People.H + 0.95; me.root.add(nameTag);
    // a side-on two-shot (you on the right, me on the left), slowly pushing in on me
    const rig = Game.rig, mz = (p.z + sz) / 2;
    rig.pos.set(p.x - 3.6, 1.8, mz + 1.5); rig.look.set(p.x, 1.2, mz - 0.1);
    let tick = 0;
    const animate = { update(dt) { me.mixer.update(dt); me.tickBubble(dt); tick += dt; } };
    F.dynamic.push(animate);
    const line = (txt, dur) => { me.say(txt, dur); UI.say("Sparsh — " + txt, dur * 1000); AudioSys.sfx("pop"); };
    const glow = { k: 0 }, mats = [];
    const tl = gsap.timeline();
    Guide._meetTl = tl;
    tl.to(rig.pos, { x: p.x - 2.6, y: 1.65, z: mz + 0.7, duration: 8, ease: "sine.inOut" }, 0);
    tl.to(rig.look, { x: p.x, y: 1.25, z: mz - 0.45, duration: 8, ease: "sine.inOut" }, 0);
    tl.call(() => { me.play("emote-yes", 0.2, true); line("Hey! I'm Sparsh — welcome to my HQ.", 2.6); }, null, 0.5);
    tl.call(() => { me.play("idle", 0.3); line("Everything I've built is somewhere in this building.", 2.6); }, null, 3.2);
    tl.call(() => { me.play("interact-right", 0.2, true); line("I'll show you around — in a slightly more portable form.", 2.4); }, null, 5.9);
    tl.call(() => {
      me.model.traverse((m) => {
        if (!m.isMesh) return;
        m.material = m.material.clone(); m.material.emissive = new THREE.Color(0x9fe6ff); m.material.emissiveIntensity = 0;
        mats.push(m.material);
      });
      nameTag.visible = false;
      AudioSys.sfx("whoosh");
    }, null, 8.2);
    tl.to(glow, { k: 1, duration: 1.0, ease: "power2.in", onUpdate: () => { for (const m of mats) m.emissiveIntensity = glow.k * 3.2; } }, 8.2);
    tl.to(me.root.rotation, { y: Math.PI * 6, duration: 1.5, ease: "power2.in" }, 8.3);
    tl.to(me.root.scale, { x: 0.03, y: 0.03, z: 0.03, duration: 1.35, ease: "power3.in" }, 8.45);
    tl.to(me.root.position, { y: 1.55, duration: 1.35, ease: "power2.in" }, 8.45);
    tl.call(() => {
      F.group.remove(me.root);
      const i = F.dynamic.indexOf(animate); if (i >= 0) F.dynamic.splice(i, 1);
      g.cine = true; g.root.visible = true;
      g.root.position.set(sx, 1.6, sz); g.vel.set(0, 0, 0); g.hist.length = 0; g.pulse = 1;
      Game.sparkle(sx, 1.6, sz, 0x9fe6ff, 26);
      AudioSys.sfx("secret");
    }, null, 9.8);
    tl.fromTo(g.root.scale, { x: 0.01, y: 0.01, z: 0.01 }, { x: 1, y: 1, z: 1, duration: 0.45, ease: "back.out(3)" }, 9.8);
    // a little arc over to your shoulder
    const arc = { u: 0 };
    tl.to(arc, { u: 1, duration: 1.1, ease: "sine.inOut", onUpdate: () => {
      const u = arc.u, ex = p.x + 0.75, ez = p.z + 0.1, mx = (sx + ex) / 2 + 1.2, mz = (sz + ez) / 2;
      const q = 1 - u;
      g.root.position.set(q * q * sx + 2 * q * u * mx + u * u * ex, q * q * 1.6 + 2 * q * u * 2.9 + u * u * 2.0, q * q * sz + 2 * q * u * mz + u * u * ez);
    } }, 10.3);
    tl.call(() => Guide.say("Start with my experience on Floor 1, or my education on Floor 2 — the two signposts take you there."), null, 11.2);
    const finish = () => {
      if (Guide._met) return;
      Guide._met = true;
      document.removeEventListener("pointerdown", skip, true); window.removeEventListener("keydown", skipKey, true);
      if (F.group.children.includes(me.root)) { F.group.remove(me.root); const i = F.dynamic.indexOf(animate); if (i >= 0) F.dynamic.splice(i, 1); }
      g.cine = false; g.met = true; g.root.scale.setScalar(1); g.root.visible = true;
      for (const n of hidden) n.root.visible = true;
      if (p.tag) p.tag.visible = true;
      const end = Game.followPose();
      gsap.to(rig.pos, { x: end.pos.x, y: end.pos.y, z: end.pos.z, duration: 1.0, ease: "power2.inOut" });
      gsap.to(rig.look, { x: end.look.x, y: end.look.y, z: end.look.z, duration: 1.0, ease: "power2.inOut", onComplete: () => {
        Game.snapCamera(); Game.cam.mode = "follow"; Game.state = "play"; UI.letterbox(false);
        if (typeof Analytics !== "undefined") Analytics.event("met_sparsh", { skipped: Guide._skipped ? "yes" : "no" });
        if (done) done();
      } });
    };
    tl.call(finish, null, 12.4);
    // impatient visitors can skip (click / Esc / Space / Enter)
    const skip = () => {
      if (Guide._met || Guide.noSkip || tl.time() < 1.2) return;
      Guide._skipped = true; tl.kill();
      if (!g.cine) { g.root.position.set(p.x + 0.75, 2.0, p.z + 0.1); }
      Guide.say("Start with my experience on Floor 1, or my education on Floor 2 — the two signposts take you there.");
      finish();
    };
    const skipKey = (e) => { if (["Escape", " ", "Enter"].includes(e.key)) skip(); };
    document.addEventListener("pointerdown", skip, true); window.addEventListener("keydown", skipKey, true);
  },
};
