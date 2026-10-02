/* ============================================================
   SPARSH HQ v3 — assets.js
   Real models, not programmer art: Kenney's CC0 Furniture Kit,
   Mini Characters (32 animations each) and City Kit, loaded
   with three.js' GLTFLoader, re-themed per floor.
   ============================================================ */

const Assets = {
  FS: 2.0,                              // Kenney furniture units → metres
  base: "assets/models/",
  gltf: {},
  info: {},                             // cached bbox per model
  _themed: {},

  manifest: {
    furniture: [
      "desk", "deskCorner", "chairDesk", "chair", "chairCushion", "chairModernCushion", "chairModernFrameCushion", "chairRounded",
      "loungeSofa", "loungeSofaLong", "loungeSofaCorner", "loungeSofaOttoman", "loungeChair", "loungeChairRelax", "loungeDesignSofa", "loungeDesignChair",
      "tableCoffee", "tableCoffeeGlass", "tableCoffeeSquare", "tableRound", "table", "tableCloth", "tableGlass", "tableCross", "sideTable", "sideTableDrawers",
      "bookcaseOpen", "bookcaseOpenLow", "bookcaseClosed", "bookcaseClosedWide", "bookcaseClosedDoors", "books",
      "computerScreen", "computerKeyboard", "computerMouse", "laptop", "televisionModern", "televisionVintage", "speaker", "speakerSmall", "radio",
      "lampRoundFloor", "lampSquareFloor", "lampRoundTable", "lampSquareTable", "lampWall", "lampSquareCeiling", "ceilingFan",
      "pottedPlant", "plantSmall1", "plantSmall2", "plantSmall3",
      "rugRectangle", "rugRound", "rugRounded", "rugSquare", "rugDoormat",
      "kitchenBar", "kitchenBarEnd", "kitchenCabinet", "kitchenCabinetUpper", "kitchenCoffeeMachine", "kitchenFridge", "kitchenFridgeLarge", "kitchenMicrowave", "kitchenSink", "kitchenBlender", "toaster",
      "stoolBar", "stoolBarSquare", "bench", "benchCushion", "benchCushionLow", "coatRackStanding", "trashcan", "cardboardBoxClosed", "cardboardBoxOpen",
      "pillow", "pillowBlue", "pillowLong", "bear", "stairs", "paneling", "bedSingle", "cabinetTelevision", "washer", "kitchenStove",
    ],
    people: ["character-male-a", "character-male-b", "character-male-c", "character-male-d", "character-male-e", "character-male-f",
             "character-female-a", "character-female-b", "character-female-c", "character-female-d", "character-female-e", "character-female-f"],
    city: ["building-skyscraper-a", "building-skyscraper-b", "building-skyscraper-c", "building-skyscraper-d", "building-skyscraper-e",
           "building-a", "building-b", "building-c", "building-d", "building-e", "building-f", "building-g", "building-h",
           "low-detail-building-a", "low-detail-building-b", "low-detail-building-c", "low-detail-building-d", "low-detail-building-e",
           "low-detail-building-wide-a", "low-detail-building-wide-b", "detail-awning-wide", "detail-parasol-a"],
  },

  async loadAll(onProgress) {
    const loader = new THREE.GLTFLoader();
    const jobs = [];
    for (const n of Assets.manifest.furniture) jobs.push(["furniture/" + n, n]);
    for (const n of Assets.manifest.people) jobs.push(["people/" + n, n]);
    for (const n of Assets.manifest.city) jobs.push(["city/" + n, n]);
    let done = 0;
    const one = async ([path, name]) => {
      try {
        const g = await loader.loadAsync(Assets.base + path + ".glb");
        Assets.gltf[name] = g;
        g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      } catch (e) { console.warn("asset failed", name, e); }
      done++; if (onProgress) onProgress(done / jobs.length);
    };
    // modest parallelism
    const q = jobs.slice();
    const workers = Array.from({ length: 8 }, async () => { while (q.length) await one(q.shift()); });
    await Promise.all(workers);
    Assets.tuneMaterials();
  },

  /* give Kenney's flat colours proper physical properties */
  tuneMaterials() {
    const seen = new Set();
    const tune = (m) => {
      if (!m || seen.has(m)) return; seen.add(m);
      const n = (m.name || "").toLowerCase();
      m.envMapIntensity = 1;
      if (n.startsWith("metal")) { m.metalness = 0.75; m.roughness = n.includes("dark") ? 0.35 : 0.28; }
      else if (n.startsWith("wood")) { m.metalness = 0; m.roughness = 0.5; }
      else if (n.startsWith("carpet")) { m.metalness = 0; m.roughness = 0.95; }
      else if (n === "plant") { m.metalness = 0; m.roughness = 0.7; }
      else if (n === "lamp") { m.emissive = new THREE.Color(0xffd9a0); m.emissiveIntensity = 2.2; m.roughness = 0.6; }
      else if (n.includes("glass")) { m.transparent = true; m.opacity = 0.35; m.roughness = 0.05; m.metalness = 0.4; }
      else if (n === "colormap") { m.roughness = 0.75; m.metalness = 0; }
    };
    for (const k in Assets.gltf) Assets.gltf[k].scene.traverse((o) => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach(tune); });
  },

  bbox(name) {
    if (Assets.info[name]) return Assets.info[name];
    const g = Assets.gltf[name];
    if (!g) return null;
    const b = new THREE.Box3().setFromObject(g.scene);
    Assets.info[name] = b;
    return b;
  },

  /* per-floor palette remap: { wood: 0x.., carpet: 0x.., metal: 0x.. } */
  themedMat(m, theme) {
    if (!theme) return m;
    const n = m.name;
    let col = theme[n];
    if (col === undefined) {
      const base = n.replace(/(Dark|Darker|Medium|White)$/, "");
      col = theme[base];
      if (col !== undefined) {
        const k = /Darker/.test(n) ? 0.6 : /Dark/.test(n) ? 0.72 : /Medium/.test(n) ? 0.88 : /White/.test(n) ? 1.6 : 1;
        col = new THREE.Color(col).multiplyScalar(k).getHex();
      }
    }
    if (col === undefined) return m;
    const key = n + ":" + col;
    if (!Assets._themed[key]) {
      const c = m.clone();
      c.color = new THREE.Color(col);
      Assets._themed[key] = c;
    }
    return Assets._themed[key];
  },

  /* clone a model into the floor. Kenney pivots sit at a corner, so the
     clone is re-centred: footprint centred on (x,z), base on the floor. */
  place(F, name, x, z, ry = 0, o = {}) {
    const g = Assets.gltf[name];
    if (!g) { console.warn("missing model", name); return new THREE.Group(); }
    const s = (o.s || 1) * (o.unit || Assets.FS);
    const b = Assets.bbox(name);
    const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2;
    const outer = new THREE.Group();
    outer.position.set(x, o.y || 0, z);
    outer.rotation.y = ry;
    const inner = g.scene.clone(true);
    inner.scale.setScalar(s);
    inner.position.set(-cx * s, -b.min.y * s, -cz * s);
    const theme = o.theme || F.theme;
    if (theme || o.tint) {
      inner.traverse((m) => {
        if (!m.isMesh) return;
        if (Array.isArray(m.material)) m.material = m.material.map((mm) => Assets.themedMat(mm, o.tint || theme));
        else m.material = Assets.themedMat(m.material, o.tint || theme);
      });
    }
    outer.add(inner);
    (o.parent || F.group).add(outer);
    const w = (b.max.x - b.min.x) * s, d = (b.max.z - b.min.z) * s;
    outer.userData.size = { w, d, h: (b.max.y - b.min.y) * s };
    if (o.collide !== false && !o.parent) Kit.collide(F, x, z, w * (o.colK || 1), d * (o.colK || 1), ry, { aoK: o.aoK || 0.8 });
    else if (o.ao !== false && !o.parent) F.ao.push({ x, z, w, d, ry, k: 0.5 });
    return outer;
  },

  /* skyline building (city kit) */
  building(parent, name, x, z, ry, s) {
    const g = Assets.gltf[name];
    if (!g) return null;
    const b = Assets.bbox(name);
    const inner = g.scene.clone(true);
    inner.scale.setScalar(s);
    inner.position.set(x - (b.min.x + b.max.x) / 2 * s, -b.min.y * s, z - (b.min.z + b.max.z) / 2 * s);
    inner.rotation.y = ry;
    inner.traverse((m) => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; } });
    parent.add(inner);
    return inner;
  },
};

/* ============================================================
   PEOPLE — Kenney Mini Characters with real skeletal animation
   v7 animation layer:
   · locomotion is a blend tree driven by MEASURED ground speed
     (idle ↔ walk ↔ sprint weights + matched playback rate), so
     feet never slide, whatever moves the character
   · poses and gestures are layers that blend over locomotion
   · heads (then torsos) turn to look at things procedurally
   · bodies lean into acceleration and turns (weight)
   ============================================================ */
const People = {
  H: 1.62,                // standing height in metres
  WALK_NAT: 2.7,          // ground speed (m/s) at which the walk clip's feet plant cleanly (measured: foot sweep at the stance low point)
  SPRINT_NAT: 5.0,
  _scale: {},

  scaleFor(name) {
    if (People._scale[name]) return People._scale[name];
    const g = Assets.gltf[name];
    const b = new THREE.Box3().setFromObject(g.scene);
    People._scale[name] = People.H / (b.max.y - b.min.y);
    return People._scale[name];
  },

  make(name, o = {}) {
    const g = Assets.gltf[name] || Assets.gltf["character-male-a"];
    const model = THREE.SkeletonUtils.clone(g.scene);
    const s = People.scaleFor(name) * (o.s || 1);
    model.scale.setScalar(s);
    const root = new THREE.Group();
    const pivot = new THREE.Group();          // lean / weight lives here, never on the model itself
    root.add(pivot); pivot.add(model);
    root.position.set(o.x || 0, 0, o.z || 0);
    root.rotation.y = o.ry || 0;
    if (o.holo) {
      model.traverse((m) => { if (m.isMesh) { m.material = Look.holo(0x57d8ff, 1); m.castShadow = false; } });
    } else if (o.tint) {
      model.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.lerp(new THREE.Color(o.tint), 0.35); } });
    }
    // contact shadow
    const blob = new THREE.Mesh(People.blobGeo(), People.blobMat());
    blob.rotation.x = -Math.PI / 2; blob.position.y = 0.015; blob.renderOrder = 1;
    root.add(blob);

    const mixer = new THREE.AnimationMixer(model);
    const actions = {};
    for (const clip of g.animations) actions[clip.name] = mixer.clipAction(clip);
    const nodes = {};
    model.traverse((n) => { if (n.name) nodes[n.name] = n; });
    const rest = {};
    for (const b of ["head", "torso"]) if (nodes[b]) rest[b] = nodes[b].quaternion.clone();

    // speech bubble (small, above the head)
    const bubbleTex = Kit.canvasTex(256, 96, (c) => c.clearRect(0, 0, 256, 96));
    const bubble = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex, transparent: true, opacity: 0, depthWrite: false, depthTest: false }));
    bubble.scale.set(1.25, 0.47, 1);
    bubble.position.y = People.H + 0.45;
    bubble.renderOrder = 10;
    root.add(bubble);

    // locomotion actions run all the time; their weights do the talking
    const LOCO = ["idle", "walk", "sprint"];
    const w = new Map();                       // action -> current weight
    for (const n of LOCO) { const a = actions[n]; if (a) { a.enabled = true; a.setEffectiveWeight(n === "idle" ? 1 : 0); a.play(); w.set(a, n === "idle" ? 1 : 0); } }
    const seed = Math.random() * 100;

    const P = {
      name, root, pivot, model, mixer, actions, nodes, blob, bubble, bubbleTex, bubbleT: 0,
      cur: actions.idle || null, speed: 0, mspeed: 0,
      layer: null, layerName: null, layerOnce: false, fadeRate: 7,
      look: { yaw: 0, pitch: 0 }, lookTarget: null, turnStep: 0,
      lean: { pitch: 0, roll: 0, vp: 0 }, _lx: root.position.x, _lz: root.position.z, _lry: root.rotation.y, _ls: 0,

      /* legacy-compatible: locomotion names hand control back to the blend tree, anything else is a layer */
      play(anim, fade = 0.25, once = false) {
        if (anim === "idle" || anim === "walk" || anim === "sprint") {
          if (P.layer && !P.layerOnce) { P.layer = null; P.layerName = null; }   // gestures finish on their own
          P.fadeRate = 1 / Math.max(0.08, fade);
          return actions[anim];
        }
        const a = actions[anim] || actions.idle;
        if (!a) return a;
        if (P.layerName === anim && !once) return a;
        if (P.layer && P.layer !== a && !LOCO.includes(P.layerName)) { /* the old layer fades out on its own */ }
        a.reset();
        a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat);
        a.clampWhenFinished = once;
        a.enabled = true;
        if (!w.has(a)) w.set(a, 0);
        a.setEffectiveWeight(w.get(a));
        a.play();
        P.layer = a; P.layerName = anim; P.layerOnce = once;
        P.fadeRate = 1 / Math.max(0.08, fade);
        P.cur = a;
        return a;
      },

      /* one frame of animation: measure speed → blend weights → pose → procedural look + lean */
      animate(dt) {
        if (dt <= 0) return;
        // measured ground speed (whatever moved us — paths, routes, scripts, tweens)
        const px = root.position.x, pz = root.position.z;
        const inst = Math.hypot(px - P._lx, pz - P._lz) / dt;
        P._lx = px; P._lz = pz;
        P.mspeed = U.damp(P.mspeed, Math.min(inst, 9), 12, dt);
        let sp = P.mspeed;
        // turning on the spot moves the feet a little (no turntable spins)
        let dry = root.rotation.y - P._lry; while (dry > Math.PI) dry -= Math.PI * 2; while (dry < -Math.PI) dry += Math.PI * 2;
        P._lry = root.rotation.y;
        const turnRate = Math.abs(dry) / dt;
        if (sp < 0.4 && turnRate > 0.8) sp = Math.max(sp, Math.min(0.9, turnRate * 0.35));
        if (P.turnStep > 0) sp = Math.max(sp, 0.55);

        // a pose layer gives way to legs when we actually move (unless we're seated / mid-gesture)
        const layerYields = P.layer && P.layerName !== "sit" && sp > (P.layerOnce ? 0.6 : 0.35);
        if (layerYields && P.layerOnce) { P.layer = null; P.layerName = null; }
        const layerTarget = P.layer && !layerYields ? 1 : 0;
        const sm = (a, b, x) => { const t = U.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
        const wsT = sm(4.0, 5.2, sp), wwT = sm(0.06, 0.75, sp) * (1 - wsT), wiT = Math.max(0, 1 - wwT - wsT);
        const locoK = 1 - layerTarget;
        const rate = P.fadeRate;
        const targets = new Map();
        if (actions.idle) targets.set(actions.idle, wiT * locoK);
        if (actions.walk) targets.set(actions.walk, wwT * locoK);
        if (actions.sprint) targets.set(actions.sprint, wsT * locoK);
        if (P.layer) targets.set(P.layer, layerTarget);
        for (const [a, cw] of w) {
          const tw = targets.has(a) ? targets.get(a) : 0;
          const nw = U.damp(cw, tw, rate, dt);
          w.set(a, nw);
          a.setEffectiveWeight(nw);
          if (nw < 0.002 && tw === 0 && !LOCO.includes(a.getClip().name)) { a.stop(); w.delete(a); }
        }
        // playback rate follows ground speed → planted feet; walk and sprint share one phase
        // (both clips put the left foot forward first) so a blend never scissors the legs
        const aw = actions.walk, as = actions.sprint;
        if (aw && as) {
          const dW = aw.getClip().duration, dS = as.getClip().duration;
          const ww = w.get(aw) || 0, ws = w.get(as) || 0, k = ws / Math.max(1e-3, ww + ws);
          const fW = U.clamp(sp / People.WALK_NAT, 0.45, 1.6) / dW, fS = U.clamp(sp / People.SPRINT_NAT, 0.7, 1.4) / dS;
          const f = fW + (fS - fW) * k;
          aw.timeScale = f * dW; as.timeScale = f * dS;
          if (ww > 0.01 && ws > 0.01) {
            const lead = k < 0.5 ? aw : as, other = lead === aw ? as : aw;
            other.time = ((lead.time / lead.getClip().duration) % 1) * other.getClip().duration;
          }
        } else if (aw) aw.timeScale = U.clamp(sp / People.WALK_NAT, 0.45, 1.6);
        // the dominant action, for code that asks
        let best = null, bw = -1; for (const [a, cw] of w) if (cw > bw) { bw = cw; best = a; }
        P.cur = best;
        // one-shot gestures hand back to locomotion when done
        if (P.layer && P.layerOnce && P.layer.time >= P.layer.getClip().duration - 0.02) {
          P.layer = null; P.layerName = null; P.fadeRate = 5;
          if (P.restPose) P.play(P.restPose, 0.35);
        }
        P.fadeRate += (7 - P.fadeRate) * Math.min(1, dt * 1.5);      // a slow fade request relaxes back to the default

        for (const b in rest) nodes[b].quaternion.copy(rest[b]);   // clips overwrite these; if one doesn't, no drift
        mixer.update(dt);

        // ---- procedural look-at (head first, torso follows a little) ----
        const L = P.look;
        let tYaw = 0, tPitch = 0;
        const tgt = P.lookTarget;
        if (tgt) {
          const dx = tgt.x - px, dz = tgt.z - pz, hd = Math.hypot(dx, dz);
          let a = Math.atan2(dx, dz) - root.rotation.y;
          while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2;
          if (Math.abs(a) < 1.9 && hd > 0.3) {
            tYaw = U.clamp(a, -1.15, 1.15);
            tPitch = U.clamp(Math.atan2((tgt.y === undefined ? 1.4 : tgt.y) - (root.position.y + 1.35), hd), -0.45, 0.4);
          }
        } else {
          // idle eyes wander a little
          tYaw = Math.sin(performance.now() * 0.00031 + seed) * 0.18;
        }
        L.yaw = U.damp(L.yaw, tYaw, 5.5, dt);
        L.pitch = U.damp(L.pitch, tPitch, 5.5, dt);
        if (nodes.head) { nodes.head.rotateY(L.yaw * 0.72); nodes.head.rotateX(-L.pitch * 0.7); }
        if (nodes.torso) nodes.torso.rotateY(L.yaw * 0.25);

        // ---- weight: lean into acceleration (pitch) and into turns (roll) ----
        const acc = (P.mspeed - P._ls) / dt; P._ls = P.mspeed;
        const tp = U.clamp(acc * 0.014, -0.09, 0.12) + U.clamp(P.mspeed * 0.012, 0, 0.05);
        // a soft spring with a touch of overshoot: anticipation on the way in, settle on the way out
        const k = 90, c = 2 * 0.62 * Math.sqrt(k);
        P.lean.vp += (k * (tp - P.lean.pitch) - c * P.lean.vp) * dt;
        P.lean.pitch += P.lean.vp * dt;
        const troll = U.clamp(-dry / dt * P.mspeed * 0.012, -0.1, 0.1);
        P.lean.roll = U.damp(P.lean.roll, troll, 6, dt);
        pivot.rotation.x = P.lean.pitch;
        pivot.rotation.z = P.lean.roll;
      },

      attach(nodeName, obj) { const n = nodes[nodeName]; if (n) { n.add(obj); } return obj; },
      say(text, dur = 3.8) {
        const c = bubbleTex.image.getContext("2d");
        c.clearRect(0, 0, 256, 96);
        c.font = `600 19px ${Kit.FONT}`;
        const lines = Kit.wrap(c, text, 214);
        const bh = Math.min(3, lines.length) * 22 + 18;
        const y0 = 96 - bh - 10;
        c.fillStyle = "rgba(255,255,255,0.96)";
        c.beginPath();
        c.roundRect(12, y0, 232, bh, 14);
        c.moveTo(118, y0 + bh); c.lineTo(128, 94); c.lineTo(138, y0 + bh);
        c.fill();
        c.fillStyle = "#1c1f26"; c.textAlign = "center"; c.textBaseline = "top";
        lines.slice(0, 3).forEach((l, i) => c.fillText(l, 128, y0 + 10 + i * 22));
        bubbleTex.needsUpdate = true;
        P.bubbleT = dur;
        P.bubblePop = 0;
      },
      tickBubble(dt) {
        if (P.bubbleT > 0) P.bubbleT -= dt;
        const cam = Game.camera.position;
        const d = cam.distanceTo(root.position);
        const fade = U.clamp((d - 2.2) / 1.5, 0, 1);
        bubble.material.opacity += ((P.bubbleT > 0 ? fade : 0) - bubble.material.opacity) * Math.min(1, dt * 8);
        bubble.visible = bubble.material.opacity > 0.01;
        // bubbles pop in with a little overshoot instead of fading on flat
        if (P.bubblePop !== undefined && P.bubblePop < 1) {
          P.bubblePop = Math.min(1, P.bubblePop + dt * 4);
          const u = P.bubblePop, s2 = 1 + Math.sin(u * Math.PI) * 0.18 * (1 - u * 0.4);
          bubble.scale.set(1.25 * s2 * (0.6 + 0.4 * u), 0.47 * s2 * (0.6 + 0.4 * u), 1);
        }
      },
    };
    // de-sync crowds
    if (actions.idle) actions.idle.time = Math.random() * actions.idle.getClip().duration;
    if (actions.walk) actions.walk.time = Math.random() * actions.walk.getClip().duration;
    if (o.anim && o.anim !== "idle") P.play(o.anim, 0);
    return P;
  },

  _blobGeo: null, _blobMat: null,
  blobGeo() { return People._blobGeo || (People._blobGeo = new THREE.PlaneGeometry(0.9, 0.9)); },
  blobMat() {
    if (People._blobMat) return People._blobMat;
    const t = Kit.canvasTex(64, 64, (c, w, h) => {
      const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, "rgba(0,0,0,0.55)"); g.addColorStop(0.6, "rgba(0,0,0,0.25)"); g.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    });
    return (People._blobMat = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
  },

  /* props held in hands */
  prop(kind) {
    const g = new THREE.Group();
    if (kind === "cup") { Kit.mug(g, 0, -0.05, 0.02, 0xf4f1ea); g.scale.setScalar(1.3); }
    else if (kind === "phone") Kit.B(g, 0.05, 0.1, 0.012, Kit.M(0x121317, { rough: 0.3 }), 0, 0, 0.03, { r: 0.006 });
    else if (kind === "files") { Kit.B(g, 0.24, 0.3, 0.04, Kit.M(0xd8b86a, { rough: 0.9 }), 0, 0, 0, { r: 0.006 }); }
    else if (kind === "laptop") Kit.B(g, 0.3, 0.02, 0.22, Kit.metal(0xb8bcc4), 0, 0, 0.1, { r: 0.006 });
    return g;
  },

  /* NPC: a person with a daily routine — steered, not slid */
  npc(F, spec) {
    // the visitor (male-c) and Sparsh himself (male-d) are never extras
    const cast = (n) => n && n !== "character-male-c" && n !== "character-male-d";
    const P = People.make(cast(spec.model) ? spec.model : U.pick(Assets.manifest.people.filter(cast)), { x: spec.x, z: spec.z, ry: spec.ry || 0 });
    F.group.add(P.root);
    P.spec = spec;
    P.behavior = spec.behavior || "idle";
    P.quoteT = 5 + Math.random() * 12;
    P.wp = 0; P.pause = 0; P.waved = false; P.gestureT = 1 + Math.random() * 4;
    P.heading = P.root.rotation.y; P.v = 0; P.glanceT = Math.random() * 3; P.glance = null;
    P.paceDir = 1; P.paceWait = Math.random() * 2;
    const holdK = spec.hold || (P.behavior === "phone" ? "phone" : null);     // a phone call needs a phone
    if (holdK) {
      const hand = holdK === "phone" ? "arm-left" : "arm-right";
      const pr = People.prop(holdK);
      pr.position.set(holdK === "phone" ? 0.05 : -0.05, -0.23, 0.08);
      pr.scale.multiplyScalar(1 / P.model.scale.x);
      P.attach(hand, pr);
    }
    const startPose = { sit: "sit", type: "sit", read: "sit", coffee: "holding-right", phone: "holding-left" }[P.behavior];
    if (startPose) P.play(startPose, 0);
    P.restPose = P.behavior === "coffee" ? startPose : null;     // a greeting nod hands this back when it's done
    if (P.behavior === "sit" || P.behavior === "type" || P.behavior === "read") P.root.position.y = spec.seatY !== undefined ? spec.seatY : 0.02;

    /* steer toward a point: turn-rate limited, eases in and out, gives way to the visitor */
    const steer = (tx, tz, maxSp, dt, arrive = true) => {
      const r = P.root.position;
      const mx = tx - r.x, mz = tz - r.z, d = Math.hypot(mx, mz);
      if (d < 0.05) { P.v = U.damp(P.v, 0, 8, dt); return d; }
      let want = Math.atan2(mx, mz);
      // personal space: veer around the visitor instead of walking through them
      const pl = Game.player, ax = pl.x - r.x, az = pl.z - r.z, ad = Math.hypot(ax, az);
      // someone's standing on my mark: stop short of them and call it arrived
      if (Math.hypot(tx - pl.x, tz - pl.z) < 0.9 && d < 1.4) { P.v = U.damp(P.v, 0, 8, dt); return 0; }
      let slow = 1;
      if (ad < 1.6) {
        const fwd = Math.sin(P.heading) * ax + Math.cos(P.heading) * az;
        if (fwd > 0) {
          const side = Math.sin(P.heading) * az - Math.cos(P.heading) * ax;
          want += (side > 0 ? -1 : 1) * (1.6 - ad) * 0.9;
          slow = U.clamp(ad / 1.6, 0.35, 1);
        }
      }
      let dh = want - P.heading; while (dh > Math.PI) dh -= Math.PI * 2; while (dh < -Math.PI) dh += Math.PI * 2;
      P.heading += U.clamp(dh, -3.2 * dt, 3.2 * dt);
      // slow for sharp turns and for the stop at the end
      const turnSlow = U.clamp(1 - Math.abs(dh) / 2.2, 0.25, 1);
      const arriveSlow = arrive ? U.clamp(d / 1.1, 0.15, 1) : 1;
      const target = maxSp * Math.min(turnSlow, arriveSlow) * slow;
      P.v += U.clamp(target - P.v, -2.4 * dt, 1.6 * dt);
      r.x += Math.sin(P.heading) * P.v * dt;
      r.z += Math.cos(P.heading) * P.v * dt;
      { const sx = r.x - pl.x, sz = r.z - pl.z, sd = Math.hypot(sx, sz);    // never inside the visitor
        if (sd < 0.72 && sd > 1e-4) { r.x = pl.x + sx / sd * 0.72; r.z = pl.z + sz / sd * 0.72; } }
      P.root.rotation.y = P.heading;
      return d;
    };

    P.update = (dt, t) => {
      P.tickBubble(dt);
      const pl = Game.player;
      const dx = pl.x - P.root.position.x, dz = pl.z - P.root.position.z;
      const dist = Math.hypot(dx, dz);
      // chatter
      if (spec.quotes && dist < 7) {
        P.quoteT -= dt;
        if (P.quoteT <= 0 && P.bubbleT <= 0) { P.quoteT = 12 + Math.random() * 16; P.say(U.pick(CONTENT.npcQuotes[spec.quotes])); }
      }
      // greet once
      if (!P.waved && dist < 2.4 && P.behavior !== "route") {
        P.waved = true;
        if (spec.greeting) P.say(spec.greeting, 3.2);
        if (P.behavior === "idle" || P.behavior === "chat" || P.behavior === "coffee") P.play("emote-yes", 0.2, true);
      }
      // where are my eyes?
      P.glanceT -= dt;
      if (P.glanceT <= 0) {
        P.glanceT = 2.5 + Math.random() * 4;
        const a = P.root.rotation.y + (Math.random() - 0.5) * 2.2;
        P.glance = Math.random() < 0.35 ? null : { x: P.root.position.x + Math.sin(a) * 4, y: 1.0 + Math.random() * 1.2, z: P.root.position.z + Math.cos(a) * 4 };
      }
      const seated = P.behavior === "sit" || P.behavior === "type" || P.behavior === "read";
      P.lookTarget = dist < 4.2 ? { x: pl.x, y: 1.45, z: pl.z } : (P.bubbleT > 0 || seated ? null : P.glance);
      if (seated && dist >= 4.2) P.lookTarget = { x: P.root.position.x + Math.sin(P.root.rotation.y) * 0.8, y: 0.85, z: P.root.position.z + Math.cos(P.root.rotation.y) * 0.8 };

      switch (P.behavior) {
        case "route": {
          if (P.pause > 0) {
            P.pause -= dt;
            P.v = U.damp(P.v, 0, 8, dt);
            if (P.pause <= 0 && P.layer && !P.layerOnce) P.play("walk");
            break;
          }
          const wpt = spec.waypoints[P.wp];
          const willPause = !!wpt[2];
          const d = steer(wpt[0], wpt[1], spec.speed || 1.1, dt, willPause);
          if (d < (willPause ? 0.18 : 0.6)) {
            P.wp = (P.wp + 1) % spec.waypoints.length;
            if (willPause) { P.pause = wpt[2]; if (wpt[3] || spec.hold === "cup") P.play(wpt[3] || "holding-right", 0.35); }
          }
          break;
        }
        case "chat": {
          P.gestureT -= dt;
          if (P.gestureT <= 0) {
            P.gestureT = 2.6 + Math.random() * 4.5;
            const g = U.pick(["emote-yes", "emote-no", "interact-right", "interact-left", null, null]);
            if (g) P.play(g, 0.3, true);
          }
          // talk to the nearest neighbour when the visitor isn't close
          if (dist >= 4.2 && !P.partner) {
            let best = null, bd = 3.5;
            for (const n of F.npcs) { if (n === P) continue; const d2 = Math.hypot(n.root.position.x - P.root.position.x, n.root.position.z - P.root.position.z); if (d2 < bd) { bd = d2; best = n; } }
            P.partner = best || false;
          }
          if (dist >= 4.2 && P.partner) P.lookTarget = { x: P.partner.root.position.x, y: 1.5, z: P.partner.root.position.z };
          break;
        }
        case "phone": {
          // pace a short line while talking: walk, stop, turn, talk, walk back
          const half = spec.pace || 0.9;
          if (P.paceWait > 0) {
            P.paceWait -= dt; P.v = U.damp(P.v, 0, 8, dt);
            if (!P.layer) P.play("holding-left", 0.35);
            if (dist >= 4.2) { const ry = P.root.rotation.y; P.lookTarget = { x: P.root.position.x + Math.sin(ry) * 0.45, y: 0.95, z: P.root.position.z + Math.cos(ry) * 0.45 }; }
            if (P.paceWait <= 0) P.paceDir *= -1;
            break;
          }
          const tx = spec.x + P.paceDir * half;
          if (steer(tx, spec.z, 0.7, dt, true) < 0.12) P.paceWait = 1.6 + Math.random() * 2.4;
          break;
        }
        default: break;
      }
      // idle folk turn to face a visitor who lingers — head first, then a couple of steps round
      if ((P.behavior === "idle" || P.behavior === "coffee" || P.behavior === "chat") && dist < 3 && dist > 0.5) {
        let a = Math.atan2(dx, dz) - P.root.rotation.y; while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2;
        if (Math.abs(a) > 0.95 || P.turnStep > 0) {
          P.turnStep = Math.abs(a) > 0.25 ? 1 : 0;
          P.root.rotation.y += U.clamp(a, -2.4 * dt, 2.4 * dt);
          P.heading = P.root.rotation.y;
        }
      } else P.turnStep = 0;

      P.animate(dt);
    };
    return P;
  },
};

