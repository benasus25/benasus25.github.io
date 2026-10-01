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
   ============================================================ */
const People = {
  H: 1.62,                // standing height in metres
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
    root.add(model);
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

    // speech bubble (small, above the head)
    const bubbleTex = Kit.canvasTex(256, 96, (c) => c.clearRect(0, 0, 256, 96));
    const bubble = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex, transparent: true, opacity: 0, depthWrite: false, depthTest: false }));
    bubble.scale.set(1.25, 0.47, 1);
    bubble.position.y = People.H + 0.45;
    bubble.renderOrder = 10;
    root.add(bubble);

    const P = {
      name, root, model, mixer, actions, nodes, blob, bubble, bubbleTex, bubbleT: 0,
      cur: null, speed: 0,
      play(anim, fade = 0.25, once = false) {
        const a = actions[anim] || actions.idle;
        if (!a || P.cur === a) return a;
        a.reset();
        a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat);
        a.clampWhenFinished = once;
        if (P.cur) a.crossFadeFrom(P.cur, fade, false);
        a.play();
        P.cur = a;
        return a;
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
      },
      tickBubble(dt) {
        if (P.bubbleT > 0) P.bubbleT -= dt;
        const cam = Game.camera.position;
        const d = cam.distanceTo(root.position);
        const fade = U.clamp((d - 2.2) / 1.5, 0, 1);
        bubble.material.opacity += ((P.bubbleT > 0 ? fade : 0) - bubble.material.opacity) * Math.min(1, dt * 8);
        bubble.visible = bubble.material.opacity > 0.01;
      },
    };
    P.play(o.anim || "idle", 0);
    // de-sync crowds
    if (P.cur) P.cur.time = Math.random() * P.cur.getClip().duration;
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

  /* NPC: a person with a daily routine */
  npc(F, spec) {
    const P = People.make(spec.model && spec.model !== "character-male-c" ? spec.model : U.pick(Assets.manifest.people.filter((n) => n !== "character-male-c")), { x: spec.x, z: spec.z, ry: spec.ry || 0 });
    F.group.add(P.root);
    P.spec = spec;
    P.behavior = spec.behavior || "idle";
    P.quoteT = 5 + Math.random() * 12;
    P.wp = 0; P.pause = 0; P.waved = false; P.gestureT = Math.random() * 4;
    if (spec.hold) {
      const hand = spec.hold === "phone" ? "arm-left" : "arm-right";
      const pr = People.prop(spec.hold);
      pr.position.set(spec.hold === "phone" ? 0.05 : -0.05, -0.23, 0.08);
      pr.scale.multiplyScalar(1 / P.model.scale.x);
      P.attach(hand, pr);
    }
    const startAnim = { sit: "sit", type: "sit", coffee: "holding-right", phone: "holding-left", chat: "idle", idle: "idle", route: "walk", read: "sit" }[P.behavior] || "idle";
    P.play(startAnim, 0);
    if (P.behavior === "sit" || P.behavior === "type" || P.behavior === "read") P.root.position.y = spec.seatY !== undefined ? spec.seatY : 0.02;

    P.update = (dt, t) => {
      P.mixer.update(dt);
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
        if (P.behavior === "idle" || P.behavior === "chat") { P.play("emote-yes", 0.2, true); setTimeout(() => P.play(P.behavior === "chat" ? "idle" : "idle"), 1400); }
      }
      switch (P.behavior) {
        case "route": {
          if (P.pause > 0) {
            P.pause -= dt;
            if (P.pause <= 0) P.play(spec.hold === "phone" ? "holding-left" : "walk");
            break;
          }
          const w = spec.waypoints[P.wp];
          const mx = w[0] - P.root.position.x, mz = w[1] - P.root.position.z;
          const d = Math.hypot(mx, mz);
          if (d < 0.2) {
            P.wp = (P.wp + 1) % spec.waypoints.length;
            if (w[2]) { P.pause = w[2]; P.play(w[3] || (spec.hold === "cup" ? "holding-right" : "idle")); }
          } else {
            const sp = spec.speed || 1.1;
            P.root.position.x += (mx / d) * sp * dt;
            P.root.position.z += (mz / d) * sp * dt;
            P.root.rotation.y = U.angLerp(P.root.rotation.y, Math.atan2(mx, mz), Math.min(1, dt * 8));
            P.play("walk");
          }
          break;
        }
        case "chat": {
          P.gestureT -= dt;
          if (P.gestureT <= 0) {
            P.gestureT = 2.5 + Math.random() * 4;
            const g = U.pick(["emote-yes", "emote-no", "idle", "idle", "interact-right"]);
            P.play(g, 0.25, g !== "idle");
            if (g !== "idle") setTimeout(() => { if (P.behavior === "chat") P.play("idle"); }, 1500);
          }
          break;
        }
        case "phone": {
          const px = spec.x + Math.sin(t * 0.35 + spec.x) * (spec.pace || 0.9);
          const vx = (px - P.root.position.x);
          P.root.position.x += vx * Math.min(1, dt * 2);
          if (Math.abs(vx) > 0.02) P.root.rotation.y = U.angLerp(P.root.rotation.y, vx > 0 ? Math.PI / 2 : -Math.PI / 2, dt * 3);
          break;
        }
        default: break;
      }
      // turn to face the visitor when they come close (idle folk only)
      if ((P.behavior === "idle" || P.behavior === "coffee" || P.behavior === "chat") && dist < 3 && dist > 0.5) {
        P.root.rotation.y = U.angLerp(P.root.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 2.5));
      }
    };
    return P;
  },
};
