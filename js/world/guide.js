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
    // squash & stretch along the direction of travel (a ball of light still obeys the principles)
    const spd = g.vel.length(), st2 = U.clamp(spd * 0.11, 0, 0.75);
    g.stretch = U.damp(g.stretch || 0, st2, 10, dt);
    if (spd > 0.05) g.core.lookAt(r.x + g.vel.x, r.y + g.vel.y, r.z + g.vel.z);
    g.core.scale.set(s / (1 + g.stretch * 0.45), s / (1 + g.stretch * 0.45), s * (1 + g.stretch));
    // the glow sprite stretches the same way on screen
    const a2 = r.clone().project(Game.camera), b2 = r.clone().sub(g.vel.clone().multiplyScalar(0.1)).project(Game.camera);
    g.glow.material.rotation = Math.atan2((a2.y - b2.y) / Game.camera.aspect * 1, a2.x - b2.x);
    g.glow.scale.set(0.8 * s * (1 + g.pulse * 0.6) * (1 + g.stretch * 0.9), 0.8 * s * (1 + g.pulse * 0.6) / (1 + g.stretch * 0.4), 1);
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
    // he walks down the carpet toward you on a gentle curve, finds his mark, and turns to you
    const ex0 = sx + 0.7, ez0 = sz - 4.2, cx0 = sx + 0.8, cz0 = sz - 1.6;
    me.root.position.set(ex0, 0, ez0); me.root.rotation.y = Math.atan2(sx - ex0, sz - ez0);
    me._lx = ex0; me._lz = ez0; me._lry = me.root.rotation.y;
    F.group.add(me.root); me.play("idle", 0);
    const nameTag = new THREE.Sprite(new THREE.SpriteMaterial({ map: Kit.canvasTex(512, 96, (c) => {
      c.font = `800 44px ${Kit.FONT}`; c.textAlign = "center"; c.shadowColor = "rgba(0,0,0,0.7)"; c.shadowBlur = 10;
      c.fillStyle = "#ffd98a"; c.fillText("SPARSH SINHA", 256, 54);
      c.font = `600 22px ${Kit.FONT}`; c.fillStyle = "rgba(255,244,224,0.85)"; c.fillText("the one who built this place", 256, 84);
    }), transparent: true, depthWrite: false }));
    nameTag.scale.set(1.5, 0.28, 1); nameTag.position.y = People.H + 0.95; me.root.add(nameTag);
    // shot 1: over your right shoulder, watching him arrive
    const rig = Game.rig, mz = (p.z + sz) / 2;
    rig.pos.set(p.x + 1.5, 2.05, p.z + 3.1); rig.look.set(sx + 0.5, 1.1, sz - 1.2);
    let tick = 0;
    // eyes: he looks at you; your eyes follow him in — and later, the orb
    const eyes = { x: ex0, y: 1.5, z: ez0 };
    let watch = me.root;
    me.lookTarget = { x: p.x, y: 1.45, z: p.z };
    p.lookOverride = eyes;
    const animate = { update(dt) {
      if (me.root.parent) { me.animate(dt); me.tickBubble(dt); }
      tick += dt;
      // a closed set: anyone who wanders toward the scene steps out of it until we're done
      for (const n of F.npcs) {
        if (!n.root.visible) continue;
        if (Math.hypot(n.root.position.x - p.x, n.root.position.z - (sz + p.z) / 2) < 6.5) { n.root.visible = false; hidden.push(n); }
      }
      const w = watch.position; eyes.x = w.x; eyes.z = w.z; eyes.y = watch === me.root ? 1.5 : w.y;
    } };
    F.dynamic.push(animate);
    const line = (txt, dur) => { me.say(txt, dur); UI.say("Sparsh — " + txt, dur * 1000); AudioSys.sfx("pop"); };
    const glow = { k: 0 }, mats = [];
    const tl = gsap.timeline();
    Guide._meetTl = tl;
    // the walk: ease in, ease out — the body leans into the start and settles at the stop
    const walk = { u: 0 };
    const bez = (u) => { const q = 1 - u; return [q * q * ex0 + 2 * q * u * cx0 + u * u * sx, q * q * ez0 + 2 * q * u * cz0 + u * u * sz]; };
    tl.to(walk, { u: 1, duration: 2.0, ease: "sine.inOut", onUpdate: () => {
      const [x, z] = bez(walk.u), [x2, z2] = bez(Math.min(1, walk.u + 0.03));
      me.root.position.x = x; me.root.position.z = z;
      if (walk.u < 0.96) {
        let d = Math.atan2(x2 - x, z2 - z) - me.root.rotation.y;
        while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
        me.root.rotation.y += d * 0.3;
      }
    } }, 0.15);
    tl.to(me.root.rotation, { y: 0, duration: 0.55, ease: "power2.inOut" }, 2.05);     // turn to you: feet shuffle, no turntable
    // shot 2: cut on the stop to a side-on two-shot, drifting in
    tl.call(() => { rig.pos.set(p.x - 3.5, 1.72, mz + 0.95); rig.look.set(p.x + 0.12, 1.2, mz); }, null, 2.25);
    tl.to(rig.pos, { x: p.x - 3.0, y: 1.64, z: mz + 0.6, duration: 7.6, ease: "sine.inOut" }, 2.25);
    tl.call(() => { me.play("emote-yes", 0.2, true); line("Hey! I'm Sparsh — welcome to my HQ.", 2.6); }, null, 2.6);
    tl.call(() => p.play("emote-yes", 0.25, true), null, 4.1);                              // you nod back
    tl.call(() => { me.lookTarget = { x: sx - 1.5, y: 3.8, z: sz - 7 }; line("Everything I've built is somewhere in this building.", 2.6); }, null, 5.3);
    tl.call(() => { me.lookTarget = { x: p.x, y: 1.45, z: p.z }; }, null, 7.0);
    tl.call(() => { me.play("interact-right", 0.2, true); line("I'll show you around — in a slightly more portable form.", 2.4); }, null, 7.9);
    const T0 = 10.3;
    tl.call(() => {
      me.model.traverse((m) => {
        if (!m.isMesh) return;
        m.material = m.material.clone(); m.material.emissive = new THREE.Color(0x9fe6ff); m.material.emissiveIntensity = 0;
        mats.push(m.material);
      });
      nameTag.visible = false;
      AudioSys.sfx("whoosh");
    }, null, T0);
    // anticipation (a crouch), stretch up into light, then collapse to a point — squash & stretch, not a spin
    tl.to(me.root.scale, { x: 1.1, y: 0.86, z: 1.1, duration: 0.22, ease: "power2.out" }, T0);
    tl.to(me.root.scale, { x: 0.78, y: 1.26, z: 0.78, duration: 0.24, ease: "power2.in" }, T0 + 0.22);
    tl.to(glow, { k: 1, duration: 0.7, ease: "power2.in", onUpdate: () => { for (const m of mats) m.emissiveIntensity = glow.k * 3.4; } }, T0 + 0.05);
    tl.to(me.pivot.rotation, { y: Math.PI * 2, duration: 0.62, ease: "power3.in" }, T0 + 0.38);
    tl.to(me.root.position, { y: 1.55, duration: 0.6, ease: "power2.in" }, T0 + 0.4);
    tl.to(me.root.scale, { x: 0.03, y: 0.03, z: 0.03, duration: 0.42, ease: "power3.in" }, T0 + 0.58);
    // the lens leans in with it, then springs back on the pop
    const cam = Game.camera, proj = () => cam.updateProjectionMatrix();
    tl.to(cam, { fov: Game.fovFor(48), duration: 0.55, ease: "power2.in", onUpdate: proj }, T0 + 0.45);
    tl.to(cam, { fov: Game.fovFor(54), duration: 1.0, ease: "elastic.out(1, 0.45)", onUpdate: proj }, T0 + 1.0);
    tl.call(() => {
      F.group.remove(me.root);
      g.cine = true; g.root.visible = true;
      g.root.position.set(sx, 1.6, sz); g.vel.set(0, 0, 0); g.hist.length = 0; g.pulse = 1;
      Game.sparkle(sx, 1.6, sz, 0x9fe6ff, 26);
      AudioSys.sfx("secret");
      watch = g.root;
    }, null, T0 + 1.0);
    tl.fromTo(g.root.scale, { x: 0.01, y: 0.01, z: 0.01 }, { x: 1, y: 1, z: 1, duration: 0.45, ease: "back.out(3)" }, T0 + 1.0);
    // a little arc over to your shoulder
    const arc = { u: 0 };
    tl.to(arc, { u: 1, duration: 1.1, ease: "sine.inOut", onUpdate: () => {
      const u = arc.u, ex = p.x + 0.75, ez = p.z + 0.1, mx = (sx + ex) / 2 + 1.2, mz = (sz + ez) / 2;
      const q = 1 - u;
      g.root.position.set(q * q * sx + 2 * q * u * mx + u * u * ex, q * q * 1.6 + 2 * q * u * 2.9 + u * u * 2.0, q * q * sz + 2 * q * u * mz + u * u * ez);
    } }, T0 + 1.5);
    tl.call(() => Guide.say("Start with my experience on Floor 1, or my education on Floor 2 — the two signposts take you there."), null, T0 + 2.4);
    const finish = () => {
      if (Guide._met) return;
      Guide._met = true;
      document.removeEventListener("pointerdown", skip, true); window.removeEventListener("keydown", skipKey, true);
      if (F.group.children.includes(me.root)) F.group.remove(me.root);
      { const i = F.dynamic.indexOf(animate); if (i >= 0) F.dynamic.splice(i, 1); }
      g.cine = false; g.met = true; g.root.scale.setScalar(1); g.root.visible = true;
      p.lookOverride = null;
      Game.camera.fov = Game.fovFor(54); Game.camera.updateProjectionMatrix();
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
    tl.call(finish, null, T0 + 3.5);
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
