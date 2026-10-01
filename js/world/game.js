/* ============================================================
   SPARSH HQ v3 — game.js
   Renderer (three.js r170 + official post-processing: GTAO,
   Unreal bloom, output/tonemap, colour grade), the diorama
   camera with cut-away walls, point-and-click movement,
   floating interaction markers, and floor management.
   ============================================================ */

const U = {
  clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
  lerp: (a, b, t) => a + (b - a) * t,
  rand: (a, b) => a + Math.random() * (b - a),
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  angLerp(a, b, t) {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return a + d * t;
  },
  damp: (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt)),
};

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null }, uTime: { value: 0 },
    uTint: { value: new THREE.Vector3(1, 1, 1) }, uShadow: { value: new THREE.Vector3(0, 0, 0) },
    uHigh: { value: new THREE.Vector3(0, 0, 0) }, uVig: { value: 0.35 }, uSat: { value: 1.06 }, uLift: { value: 0.0 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime; uniform vec3 uTint; uniform vec3 uShadow; uniform vec3 uHigh;
    uniform float uVig; uniform float uSat; uniform float uLift; varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      c.rgb = mix(vec3(l), c.rgb, uSat);
      c.rgb += uShadow * pow(1.0 - l, 2.0) * 0.12 + uHigh * pow(l, 2.0) * 0.08;
      c.rgb = c.rgb * uTint + uLift;
      vec2 d = (vUv - 0.5) * vec2(1.0, 0.82);
      float v = smoothstep(0.78, 0.22, length(d));
      c.rgb *= mix(1.0 - uVig, 1.0, v);
      // interleaved-gradient noise: stable film grain without sine banding
      vec2 fc = gl_FragCoord.xy + fract(uTime * 7.31) * 64.0;
      float n = fract(52.9829189 * fract(dot(fc, vec2(0.06711056, 0.00583715))));
      c.rgb += (n - 0.5) * 0.014;
      gl_FragColor = c;
    }`,
};

const Game = {
  state: "loading", time: 0, dayT: 0.7,
  floorIndex: "P", floorsBuilt: {}, F: null,
  keys: new Set(), particles: [], events: { bell: 0 },
  nearInteract: null, hover: null, retro: false,
  quality: 2, renderScale: 1, perf: { t0: 0, frames: 0, good: 0 },
  cam: { yaw: Math.PI, pitch: 0.42, dist: 9.5, tYaw: Math.PI, tPitch: 0.42, tDist: 9.5, mode: "follow", target: null, drag: false, dragD: 0, lx: 0, ly: 0, manualT: 0 },
  rig: null,
  touch: { moveId: -1, lookId: -1, ox: 0, oy: 0, dx: 0, dy: 0 },

  /* ================= boot ================= */
  init(canvas) {
    Game.canvas = canvas;
    const r = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
    r.setPixelRatio(Game.pixelRatio());
    r.setSize(window.innerWidth, window.innerHeight);
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    Game.renderer = r;

    Game.scene = new THREE.Scene();
    Game.camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 900);
    Game.camera.position.set(0, 20, 30);
    Game.cam.target = new THREE.Vector3();
    Game.rig = { pos: new THREE.Vector3(), look: new THREE.Vector3() };

    // studio environment → soft reflections & fill on every PBR surface
    const pmrem = new THREE.PMREMGenerator(r);
    Game.scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
    Game.scene.environmentIntensity = 0.55;

    Game.buildComposer();
    window.addEventListener("resize", Game.onResize);
    // a fixed pool of real point lights, handed to whichever fixtures matter right now
    Game.lightPool = [];
    for (let i = 0; i < 8; i++) {
      const l = new THREE.PointLight(0xffffff, 0, 8, 2);
      Game.scene.add(l); Game.lightPool.push({ l, a: null });
    }

    // lights shared by all floors (mood re-tunes them)
    Game.hemi = new THREE.HemisphereLight(0xdbe6ff, 0x3a2a20, 1.0);
    Game.scene.add(Game.hemi);
    const key = new THREE.DirectionalLight(0xffe2bf, 2.2);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    const sc = key.shadow.camera;
    sc.left = -15; sc.right = 15; sc.top = 15; sc.bottom = -15; sc.near = 1; sc.far = 80;
    key.shadow.bias = -0.0006; key.shadow.normalBias = 0.045; key.shadow.radius = 3;
    sc.updateProjectionMatrix();
    Game.key = key; Game.scene.add(key); Game.scene.add(key.target);
    Game.fill = new THREE.DirectionalLight(0x9fb8ff, 0.5);
    Game.scene.add(Game.fill); Game.scene.add(Game.fill.target);
    Game.flashLight = new THREE.AmbientLight(0xdfe8ff, 0);
    Game.scene.add(Game.flashLight);

    Game.buildSky();
    Game.buildRain();
    Game.initInput();
    Game.clock = new THREE.Clock();
    Game.loop();
  },

  buildComposer() {
    const r = Game.renderer, w = window.innerWidth, h = window.innerHeight;
    const rt = new THREE.WebGLRenderTarget(w * r.getPixelRatio(), h * r.getPixelRatio(), { type: THREE.HalfFloatType, samples: 2 });
    const comp = new THREE.EffectComposer(r, rt);
    comp.addPass(new THREE.RenderPass(Game.scene, Game.camera));
    const gtao = new THREE.GTAOPass(Game.scene, Game.camera, w, h);
    gtao.output = THREE.GTAOPass.OUTPUT.Default;
    gtao.updateGtaoMaterial({ radius: 0.55, distanceExponent: 1.6, thickness: 1.5, scale: 1.1, samples: 8 });
    gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 5, rings: 2, samples: 8 });
    // ambient occlusion is soft by nature — compute it at half resolution (4x fewer pixels)
    const gtaoSize = gtao.setSize.bind(gtao);
    gtao.setSize = (sw, sh) => gtaoSize(Math.max(1, Math.round(sw * 0.5)), Math.max(1, Math.round(sh * 0.5)));
    gtao.blendIntensity = 0.9;
    // keep sprites, glass and other see-through things out of the AO depth/normal pass
    gtao.overrideVisibility = function () {
      const cache = this._visibilityCache;
      this.scene.traverse((o) => {
        cache.set(o, o.visible);
        const m = o.material;
        if (o.isPoints || o.isLine || o.isSprite || (m && !Array.isArray(m) && (m.transparent || m.alphaTest > 0))) o.visible = false;
      });
    };
    comp.addPass(gtao);
    const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(w / 2, h / 2), 0.3, 0.5, 1.0);
    const bloomSize = bloom.setSize.bind(bloom);
    bloom.setSize = (sw, sh) => bloomSize(Math.max(1, Math.round(sw * 0.5)), Math.max(1, Math.round(sh * 0.5)));
    comp.addPass(bloom);
    comp.addPass(new THREE.OutputPass());
    const grade = new THREE.ShaderPass(GradeShader);
    comp.addPass(grade);
    Game.composer = comp; Game.gtao = gtao; Game.bloom = bloom; Game.grade = grade;
  },

  onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    Game.camera.aspect = w / h; Game.camera.updateProjectionMatrix();
    const pr = Game.retro ? 0.2 : Game.pixelRatio();
    Game.renderer.setPixelRatio(pr);
    Game.renderer.setSize(w, h);
    Game.composer.setPixelRatio(pr);
    Game.composer.setSize(w, h);
  },

  /* how many pixels we can afford: a budget per quality level, never above 1.25x DPR,
     scaled live by the frame-rate governor in loop() */
  pixelRatio() {
    const dpr = window.devicePixelRatio || 1;
    const budget = [0.9e6, 1.5e6, 2.3e6][Game.quality] || 2.3e6;
    const px = Math.max(1, window.innerWidth * window.innerHeight);
    return Math.max(0.5, Math.min(dpr, 1.25, Math.sqrt(budget / px)) * (Game.renderScale || 1));
  },

  setQuality(q) {
    Game.quality = q;
    Game.renderScale = 1;
    Game.gtao.enabled = q >= 1;
    Game.key.shadow.mapSize.set(q >= 2 ? 2048 : 1024, q >= 2 ? 2048 : 1024);
    if (Game.key.shadow.map) { Game.key.shadow.map.dispose(); Game.key.shadow.map = null; }
    Game.onResize();
  },

  /* ================= sky, city, weather ================= */
  buildSky() {
    Game.skyTex = Kit.canvasTex(512, 256, (c, w, h) => Game.drawSky(c, w, h, Game.dayT));
    const sky = new THREE.Mesh(new THREE.SphereGeometry(700, 32, 16), new THREE.MeshBasicMaterial({ map: Game.skyTex, side: THREE.BackSide, fog: false, depthWrite: false }));
    Game.scene.add(sky);
    Game.sky = sky;
    Game.cityGroup = new THREE.Group();
    Game.scene.add(Game.cityGroup);
    // distant glowing towers (instanced) for depth beyond the modelled skyline
    const winTex = Kit.canvasTex(128, 256, (c, w, h) => {
      c.fillStyle = "#000"; c.fillRect(0, 0, w, h);
      for (let y = 6; y < h - 6; y += 10) for (let x = 6; x < w - 6; x += 9)
        if (Math.random() < 0.5) { c.fillStyle = Math.random() < 0.85 ? "#ffd896" : "#9ad2ff"; c.fillRect(x, y, 5, 6); }
    });
    const farMat = new THREE.MeshStandardMaterial({ color: 0x0c1220, roughness: 0.9, emissive: 0xffffff, emissiveMap: winTex, emissiveIntensity: 1.2, fog: false });
    Game.farMat = farMat;
    const far = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), farMat, 140);
    const dm = new THREE.Object3D();
    for (let i = 0; i < 140; i++) {
      const a = (i / 140) * Math.PI * 2 + Math.sin(i * 7.7) * 0.05;
      const rad = 230 + Math.abs(Math.sin(i * 3.3)) * 170;
      dm.position.set(Math.cos(a) * rad, 0, Math.sin(a) * rad);
      const bh = U.rand(40, 170);
      dm.scale.set(U.rand(14, 30), bh, U.rand(14, 30));
      dm.position.y = bh / 2 - 40;
      dm.rotation.y = U.rand(0, 3);
      dm.updateMatrix(); far.setMatrixAt(i, dm.matrix);
    }
    Game.cityGroup.add(far);
    // flying traffic lanes
    Game.cars = [];
    for (let i = 0; i < 14; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), Kit.G(U.pick([0xff5f45, 0x9ad2ff, 0xffd166]), 3));
      s.userData = { r: U.rand(90, 200), a: U.rand(0, 6.28), v: U.rand(0.02, 0.05) * (Math.random() < 0.5 ? 1 : -1), y: U.rand(8, 40) };
      Game.cityGroup.add(s); Game.cars.push(s);
    }
    // helicopter with blinking beacon
    Game.heli = new THREE.Group();
    Kit.B(Game.heli, 3.2, 1.2, 1.4, Kit.M(0x1a1e28), 0, 0, 0, { r: 0.4 });
    Game.heliRotor = Kit.B(Game.heli, 6, 0.05, 0.25, Kit.M(0x333a46), 0, 0.9, 0, { r: 0.02 });
    Game.heliBeacon = Kit.S(Game.heli, 0.3, Kit.G(0xff3030, 4), 0, -0.7, 0);
    Game.cityGroup.add(Game.heli);
  },

  buildSkyline() {
    // Kenney City Kit skyline ring, sunk so upper floors look down on the city
    const names = Assets.manifest.city.filter((n) => n.startsWith("building"));
    const lowNames = Assets.manifest.city.filter((n) => n.startsWith("low-detail"));
    Game.cityMats = new Set();
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2 + Math.sin(i * 5.1) * 0.04;
      const rad = 105 + Math.abs(Math.sin(i * 2.7)) * 110;
      const sky = i % 3 === 0;
      const nm = sky ? U.pick(names.filter((n) => n.includes("sky"))) : (i % 3 === 1 ? U.pick(names.filter((n) => !n.includes("sky"))) : U.pick(lowNames));
      const s = sky ? U.rand(22, 34) : nm.startsWith("low") ? U.rand(26, 38) : U.rand(26, 36);
      const b = Assets.building(Game.cityGroup, nm, Math.cos(a) * rad, Math.sin(a) * rad, -a + Math.PI / 2, s);
      if (b) b.traverse((m) => { if (m.isMesh) Game.cityMats.add(m.material); });
    }
    // night: windows glow
    for (const m of Game.cityMats) { m.color.multiplyScalar(0.32); m.emissive = new THREE.Color(0xffd9a0); m.emissiveMap = m.map; m.emissiveIntensity = 0.0; }
    // the city floor far below: a dark plane speckled with street lights
    const st = Kit.canvasTex(1024, 1024, (c, w, h) => {
      c.fillStyle = "#06080c"; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) { c.fillStyle = "rgba(255,190,110,0.5)"; const x = Math.random() * w, y = Math.random() * h; c.fillRect(x, 0, 1.5, h); c.fillRect(0, y, w, 1.5); }
      for (let i = 0; i < 2600; i++) { c.fillStyle = Math.random() < 0.8 ? "rgba(255,200,130,0.9)" : "rgba(150,210,255,0.9)"; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    });
    st.wrapS = st.wrapT = THREE.RepeatWrapping; st.repeat.set(3, 3);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(600, 48), new THREE.MeshBasicMaterial({ map: st, color: new THREE.Color(0.9, 0.9, 0.9), fog: false }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.3;
    Game.cityGroup.add(ground);
  },

  drawSky(c, w, h, dayT) {
    const lerpC = (a, b, t) => a.map((v, i) => Math.round(U.lerp(v, b[i], t)));
    const pal = [
      { t: 0.0, top: [30, 40, 78], mid: [120, 110, 150], bot: [238, 160, 118] },
      { t: 0.25, top: [70, 128, 196], mid: [140, 186, 226], bot: [214, 232, 244] },
      { t: 0.5, top: [40, 46, 100], mid: [150, 96, 132], bot: [236, 150, 104] },
      { t: 0.62, top: [14, 18, 44], mid: [40, 36, 80], bot: [110, 70, 96] },
      { t: 0.78, top: [6, 9, 22], mid: [16, 22, 48], bot: [44, 46, 80] },
      { t: 1.0, top: [30, 40, 78], mid: [120, 110, 150], bot: [238, 160, 118] },
    ];
    let a = pal[0], b = pal[1];
    for (let i = 0; i < pal.length - 1; i++) if (dayT >= pal[i].t && dayT <= pal[i + 1].t) { a = pal[i]; b = pal[i + 1]; break; }
    const f = (dayT - a.t) / (b.t - a.t || 1);
    const top = lerpC(a.top, b.top, f), mid = lerpC(a.mid, b.mid, f), bot = lerpC(a.bot, b.bot, f);
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, `rgb(${top})`); g.addColorStop(0.4, `rgb(${mid})`); g.addColorStop(0.5, `rgb(${bot})`);
    g.addColorStop(0.56, `rgb(${bot.map((v) => v * 0.35 | 0)})`); g.addColorStop(1, "rgb(6,7,10)");
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const night = U.clamp(1 - Math.abs(dayT - 0.8) * 4.5, 0, 1);
    if (night > 0.05) {
      for (let i = 0; i < 180; i++) {
        const sx = (Math.sin(i * 127.1) * 0.5 + 0.5) * w, sy = (Math.sin(i * 311.7) * 0.5 + 0.5) * h * 0.4;
        c.fillStyle = `rgba(255,255,255,${night * (0.25 + (i % 4) * 0.18)})`;
        c.fillRect(sx, sy, 1.3, 1.3);
      }
      c.fillStyle = `rgba(236,240,255,${night})`; c.beginPath(); c.arc(w * 0.7, h * 0.18, 9, 0, Math.PI * 2); c.fill();
    }
    // soft clouds
    for (let i = 0; i < 9; i++) {
      const cx = ((i * 97 + dayT * 900) % (w + 200)) - 100, cy = h * (0.18 + (i % 4) * 0.06);
      const cg = c.createRadialGradient(cx, cy, 0, cx, cy, 70);
      const cl = night > 0.5 ? "60,70,100" : "255,240,230";
      cg.addColorStop(0, `rgba(${cl},0.18)`); cg.addColorStop(1, `rgba(${cl},0)`);
      c.fillStyle = cg; c.fillRect(cx - 80, cy - 40, 160, 80);
    }
  },

  buildRain() {
    const N = 2400;
    const pos = new Float32Array(N * 6);
    Game.rainSpeed = new Float32Array(N);
    for (let i = 0; i < N; i++) { Game.resetDrop(pos, i, true); Game.rainSpeed[i] = U.rand(13, 20); }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    Game.rainGeo = g;
    Game.rain = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xa9c8ee, transparent: true, opacity: 0.35, depthWrite: false }));
    Game.rain.frustumCulled = false;
    Game.scene.add(Game.rain);
    Game.rainLevel = 1;
  },

  // rain lives in a tall column centred on the lens: it always starts well above the frame
  // (so there's never a visible "top" to it), and indoors it only falls outside the walls
  rainTop() { const cy = Game.camera ? Game.camera.position.y : 10; return Math.max(26, cy + 24); },
  rainFloor() { return Game.floorIndex === "P" ? -0.2 : -14; },
  resetDrop(pos, i, randomY) {
    const b = Game.F ? Game.F.bounds : { x1: -1, x2: 1, z1: -1, z2: 1 };
    const indoor = Game.F && Game.floorIndex !== "P";
    let x, z, tries = 0;
    const cam = Game.camera ? Game.camera.position : { x: 0, z: 0 };
    do { x = cam.x + U.rand(-34, 34); z = cam.z + U.rand(-34, 34); tries++; }
    while (indoor && tries < 12 && x > b.x1 - 0.5 && x < b.x2 + 0.5 && z > b.z1 - 0.5 && z < b.z2 + 0.5);
    const top = Game.rainTop();
    const y = randomY ? U.rand(Game.rainFloor(), top) : top + U.rand(0, 8);
    pos[i * 6] = x; pos[i * 6 + 1] = y; pos[i * 6 + 2] = z;
    pos[i * 6 + 3] = x - 0.05; pos[i * 6 + 4] = y - 0.55; pos[i * 6 + 5] = z;
  },

  updateEnvironment(dt) {
    Game.dayT = (Game.dayT + dt / 720) % 1;
    if (Math.abs(Game.dayT - (Game._skyDrawn || -1)) > 0.004) {
      Game._skyDrawn = Game.dayT;
      Game.drawSky(Game.skyTex.image.getContext("2d"), 512, 256, Game.dayT);
      Game.skyTex.needsUpdate = true;
      const night = U.clamp(1 - Math.abs(Game.dayT - 0.8) * 4, 0, 1);
      Game.night = night;
      Game.farMat.emissiveIntensity = 0.2 + night * 1.4;
      if (Game.cityMats) for (const m of Game.cityMats) m.emissiveIntensity = 0.06 + night * 0.12;
    }
    // rain
    const want = Game.floorIndex === "P" ? 0.9 : U.clamp(0.4 + Math.sin(Game.time * 0.02) * 0.5, 0, 1);
    Game.rainLevel = U.damp(Game.rainLevel, want, 0.3, dt);
    const pos = Game.rainGeo.attributes.position.array;
    const active = Math.floor(2400 * Game.rainLevel);
    Game.rainGeo.setDrawRange(0, active * 2);
    const floorY = Game.rainFloor();
    for (let i = 0; i < active; i++) {
      const dy = Game.rainSpeed[i] * dt;
      pos[i * 6 + 1] -= dy; pos[i * 6 + 4] -= dy;
      if (pos[i * 6 + 1] < floorY) Game.resetDrop(pos, i, false);
    }
    Game.rainGeo.attributes.position.needsUpdate = true;
    Game.rain.visible = Game.rainLevel > 0.05;
    AudioSys.setRain(Game.rainLevel * (Game.floorIndex === "P" ? 1 : 0.35));
    if (Game.F) for (const rg of Game.F.rainGlass) { rg.material.map.offset.y += dt * 0.08 * Game.rainLevel; rg.visible = Game.rainLevel > 0.15; }
    // thunder
    if (Game.rainLevel > 0.6 && (Game.night || 0) > 0.5 && Math.random() < dt * 0.04) {
      Game.flash = 1;
      setTimeout(() => AudioSys.thunder(), 500 + Math.random() * 800);
    }
    Game.flash = Math.max(0, (Game.flash || 0) - dt * 2.5);
    Game.flashLight.intensity = Game.flash * 1.4;
    // traffic, helicopter
    for (const c of Game.cars) { const u = c.userData; u.a += u.v * dt; c.position.set(Math.cos(u.a) * u.r, u.y + Game.cityGroup.userData.y0, Math.sin(u.a) * u.r); }
    const ha = Game.time * 0.04;
    Game.heli.position.set(Math.cos(ha) * 120, 38, Math.sin(ha) * 120);
    Game.heli.rotation.y = -ha;
    Game.heliRotor.rotation.y += dt * 28;
    Game.heliBeacon.visible = Math.sin(Game.time * 6) > 0.3;
  },

  /* ================= floors ================= */
  makeF(idx) {
    return {
      idx, group: new THREE.Group(), colliders: [], ao: [], interact: [], dynamic: [], npcSpecs: [], npcs: [],
      cut: [], camWalls: [], decor: [], ceilings: [], rainGlass: [], markers: null,
      bounds: { x1: -14, z1: -10, x2: 14, z2: 10 }, spawn: { x: 0, z: 6, ry: Math.PI },
      ceilH: 3.3, wallMat: Kit.M(0x3a3f4a), theme: null, mood: null, elevation: 0, elevator: null,
    };
  },

  build(idx) {
    const F = Game.makeF(idx);
    Game.buildingF = F;
    Floors[typeof idx === "number" ? CONTENT.floors[idx].key : idx](F);
    for (const s of F.npcSpecs) F.npcs.push(People.npc(F, s));
    Game.bakeAO(F);
    Game.attachDecor(F);
    Game.buildMarkers(F);
    Game.buildNav(F);
    Game.scene.add(F.group);
    Game.floorsBuilt[idx] = F;
    return F;
  },

  loadFloor(idx, opts = {}) {
    if (Game.F) Game.F.group.visible = false;
    Game.floorIndex = idx;
    const F = Game.floorsBuilt[idx] || Game.build(idx);
    F.group.visible = true;
    Game.F = F;
    Game.applyMood(F.mood || {});
    Game.cityGroup.position.y = -F.elevation;
    Game.cityGroup.userData.y0 = 0;
    const sp = opts.spawn || F.spawn;
    const p = Game.player;
    p.x = sp.x; p.z = sp.z; p.ry = sp.ry; p.vx = p.vz = 0; p.path = null; p.sitting = null; p.pending = null;
    p.root.position.set(p.x, 0, p.z); p.root.rotation.y = p.ry;
    p.play("idle", 0);
    F.group.add(p.root);
    // the guide waits a step ahead and to the side — in the shot, never between you and the lens
    Game.guide.root.position.set(sp.x + Math.sin(sp.ry + 0.55) * 1.2, 2.0, sp.z + Math.cos(sp.ry + 0.55) * 1.2);
    Game.guide.vel.set(0, 0, 0); Game.guide.hist.length = 0;
    F.group.add(Game.guide.root);
    // frame arrivals from a diagonal (over the shoulder), not dead-behind
    Game.cam.tYaw = sp.ry + (opts.yawOffset !== undefined ? opts.yawOffset : F.yawOffset !== undefined ? F.yawOffset : -0.6);
    Game.cam.tDist = idx === "P" ? 9.5 : 8.6; Game.cam.tPitch = idx === "P" ? 0.36 : 0.6;
    Game.camera.fov = idx === "P" ? 48 : 54; Game.camera.updateProjectionMatrix();
    if (idx !== "P") Game.cam.tYaw = Game.bestYaw(Game.pivotFor(p), Game.cam.tYaw, Game.cam.tPitch, Game.cam.tDist);
    Game.snapCamera();
    for (const c of F.cut) { c.k = 1; c.g.scale.y = 1; }
    for (const s of Game.lightPool || []) { if (s.a) s.a.slot = null; s.a = null; }
    for (const a of F.lightAnchors || []) { a.w = 0; a.slot = null; }
    Game._lightSnap = true;
    const pos = Game.rainGeo.attributes.position.array;
    for (let i = 0; i < 2400; i++) Game.resetDrop(pos, i, true);
    AudioSys.setFloor(typeof idx === "number" ? CONTENT.floors[idx].audio : idx);
    const meta = idx === "P" ? { name: "The Plaza", theme: "outside, in the rain", track: CONTENT.plazaTrack } : CONTENT.floors[idx];
    if (Game.state !== "cinematic" && meta) {
      UI.floorIntro(idx, meta);
      const gl = CONTENT.guideLines[idx === "P" ? "plaza" : "f" + idx];
      if (gl && !Game["_guided" + idx]) { Game["_guided" + idx] = true; setTimeout(() => Game.guideSay(gl), 2600); }
    }
    Game.renderer.compile(Game.scene, Game.camera);
  },

  applyMood(m) {
    const d = (v, def) => (v === undefined ? def : v);
    Game.renderer.toneMappingExposure = d(m.exposure, 1.0);
    const h = m.hemi || [0xdbe6ff, 0x3a2a20, 1.0];
    Game.hemi.color.setHex(h[0]); Game.hemi.groundColor.setHex(h[1]); Game.hemi.intensity = h[2];
    const k = m.key || [0xffe2bf, 2.2, [0.5, 1, 0.35]];
    Game.key.color.setHex(k[0]); Game.key.intensity = k[1]; Game.keyDir = new THREE.Vector3(...k[2]).normalize();
    const f = m.fill || [0x9fb8ff, 0.5];
    Game.fill.color.setHex(f[0]); Game.fill.intensity = f[1];
    Game.scene.environmentIntensity = d(m.env, 0.55);
    const fog = m.fog || [0x0b0e16, 40, 160];
    Game.scene.fog = new THREE.Fog(fog[0], fog[1], fog[2]);
    const b = m.bloom || [0.3, 0.5, 1.0];
    Game.bloom.strength = b[0]; Game.bloom.radius = b[1]; Game.bloom.threshold = b[2];
    const gr = m.grade || {};
    const u = Game.grade.uniforms;
    u.uTint.value.set(...(gr.tint || [1, 1, 1]));
    u.uShadow.value.set(...(gr.shadow || [0.1, 0.05, 0.2]));
    u.uHigh.value.set(...(gr.high || [0.25, 0.15, 0.0]));
    u.uVig.value = d(gr.vig, 0.34); u.uSat.value = d(gr.sat, 1.08); u.uLift.value = d(gr.lift, 0.0);
    Game.gtao.blendIntensity = d(m.ao, 0.9);
  },

  changeFloor(idx) {
    if (Game.state === "transition") return;
    if (idx === Game.floorIndex) { UI.say("You're already here."); return; }
    Game.state = "transition";
    if (typeof Tutorial !== "undefined") Tutorial.notify("elevator");
    UI.elevatorRide(idx, () => {
      const F = Game.floorsBuilt[idx] || Game.build(idx);
      const sp = F.elevator ? F.elevator.spawn : null;
      Game.loadFloor(idx, { spawn: sp });
      Game.state = "play";
      if (F.elevator) Game.arrivalShot(F);
    });
  },

  arrivalShot(F) {
    const e = F.elevator;
    const p = Game.player;
    Game.cam.mode = "cine";
    const start = new THREE.Vector3(e.x + Math.sin(e.ry) * 0.2, 1.7, e.z + Math.cos(e.ry) * 0.2);
    Game.rig.pos.copy(start);
    Game.rig.look.set(p.x + Math.sin(e.ry) * 3, 1.2, p.z + Math.cos(e.ry) * 3);
    const end = Game.followPose();
    gsap.to(Game.rig.pos, { x: end.pos.x, y: end.pos.y, z: end.pos.z, duration: 2.2, ease: "power2.inOut" });
    gsap.to(Game.rig.look, { x: end.look.x, y: end.look.y, z: end.look.z, duration: 2.2, ease: "power2.inOut", onComplete: () => { Game.snapCamera(); Game.cam.mode = "follow"; } });
  },

  /* ================= baked contact shadows ================= */
  bakeAO(F) {
    const b = F.bounds, PPM = 20;
    const W = Math.ceil((b.x2 - b.x1) * PPM), H = Math.ceil((b.z2 - b.z1) * PPM);
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const c = cv.getContext("2d");
    c.fillStyle = "#000"; c.fillRect(0, 0, W, H);
    c.filter = "blur(9px)";
    for (const a of F.ao) {
      c.save();
      c.translate((a.x - b.x1) * PPM, (a.z - b.z1) * PPM);
      c.rotate(-(a.ry || 0));
      c.fillStyle = `rgba(255,255,255,${0.5 * (a.k || 1)})`;
      const pad = 0.12 * PPM;
      c.fillRect(-(a.w * PPM) / 2 - pad, -(a.d * PPM) / 2 - pad, a.w * PPM + pad * 2, a.d * PPM + pad * 2);
      c.restore();
    }
    c.filter = "none";
    const tex = new THREE.CanvasTexture(cv);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(b.x2 - b.x1, b.z2 - b.z1), new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: tex, transparent: true, opacity: F.aoStrength || 0.45, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.set((b.x1 + b.x2) / 2, 0.022, (b.z1 + b.z2) / 2);
    m.renderOrder = 1;
    F.group.add(m);
  },

  /* decor on walls hides when its wall is lowered */
  attachDecor(F) {
    const wp = new THREE.Vector3();
    for (const d of F.decor) {
      d.getWorldPosition(wp);
      let best = null, bd = 0.45;
      for (const c of F.cut) {
        const dd = Game.segDist(wp.x, wp.z, c.x1, c.z1, c.x2, c.z2);
        if (dd < bd) { bd = dd; best = c; }
      }
      if (best) best.decor.push(d);
    }
  },

  segDist(px, pz, x1, z1, x2, z2) {
    const dx = x2 - x1, dz = z2 - z1;
    const t = U.clamp(((px - x1) * dx + (pz - z1) * dz) / (dx * dx + dz * dz || 1), 0, 1);
    return Math.hypot(px - (x1 + dx * t), pz - (z1 + dz * t));
  },

  /* ================= interaction markers ================= */
  buildMarkers(F) {
    const g = new THREE.Group();
    const geo = new THREE.OctahedronGeometry(0.1, 0);
    const pick = new THREE.SphereGeometry(0.62, 8, 6);
    const pickMat = new THREE.MeshBasicMaterial({ visible: false });
    const ringGeo = new THREE.RingGeometry(0.2, 0.26, 32);
    for (const it of F.interact) {
      const m = new THREE.Group();
      const gem = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffc861).multiplyScalar(2.2) }));
      gem.scale.y = 1.5;
      m.add(gem);
      const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffc861).multiplyScalar(1.5), transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -it.y + 0.03;
      m.add(ring);
      const hit = new THREE.Mesh(pick, pickMat);
      hit.userData.interact = it;
      m.add(hit);
      m.position.set(it.x, it.y, it.z);
      m.userData = { it, gem, ring, seed: Math.random() * 6 };
      it.marker = m;
      g.add(m);
    }
    F.markers = g;
    F.group.add(g);
  },

  updateMarkers(dt, t) {
    const F = Game.F; if (!F || !F.markers) return;
    const p = Game.player;
    for (const m of F.markers.children) {
      const { it, gem, ring, seed } = m.userData;
      if (it.dynamicPos) { const q = it.dynamicPos(); it.x = q.x; it.z = q.z; }
      m.position.set(it.x, it.y + Math.sin(t * 2 + seed) * 0.06, it.z);
      const d = Math.hypot(p.x - it.x, p.z - it.z);
      const vis = d < 13 && Game.state === "play";
      m.visible = vis;
      if (!vis) continue;
      const hot = it === Game.nearInteract || it === Game.hover;
      const s = U.damp(gem.scale.x, hot ? 1.8 : 1, 10, dt);
      gem.scale.set(s, s * 1.5, s);
      gem.rotation.y += dt * (hot ? 3 : 1.2);
      ring.material.opacity = (hot ? 0.75 : 0.35) * U.clamp((13 - d) / 4, 0, 1);
      ring.scale.setScalar(1 + (hot ? Math.sin(t * 5) * 0.15 : 0));
    }
  },

  /* ================= navigation grid + A* ================= */
  buildNav(F) {
    const b = F.bounds, res = 0.25, R = 0.32;
    const cols = Math.ceil((b.x2 - b.x1) / res), rows = Math.ceil((b.z2 - b.z1) / res);
    const grid = new Uint8Array(cols * rows);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = b.x1 + (i + 0.5) * res, z = b.z1 + (j + 0.5) * res;
      if (x < b.x1 + R || x > b.x2 - R || z < b.z1 + R || z > b.z2 - R) { grid[j * cols + i] = 1; continue; }
      for (const c of F.colliders) if (x > c.x1 - R && x < c.x2 + R && z > c.z1 - R && z < c.z2 + R) { grid[j * cols + i] = 1; break; }
    }
    F.nav = { grid, cols, rows, res, x1: b.x1, z1: b.z1 };
  },

  navCell(F, x, z) { const n = F.nav; return [Math.floor((x - n.x1) / n.res), Math.floor((z - n.z1) / n.res)]; },
  navFree(F, i, j) { const n = F.nav; return i >= 0 && j >= 0 && i < n.cols && j < n.rows && !n.grid[j * n.cols + i]; },

  findPath(F, sx, sz, tx, tz) {
    const n = F.nav;
    let [si, sj] = Game.navCell(F, sx, sz), [ti, tj] = Game.navCell(F, tx, tz);
    // nudge target to nearest free cell
    if (!Game.navFree(F, ti, tj)) {
      let best = null, bd = 1e9;
      for (let r = 1; r < 10 && !best; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
        if (Game.navFree(F, ti + di, tj + dj)) { const dd = di * di + dj * dj; if (dd < bd) { bd = dd; best = [ti + di, tj + dj]; } }
      }
      if (!best) return null;
      [ti, tj] = best;
    }
    if (!Game.navFree(F, si, sj)) {
      for (let r = 1; r < 4; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) if (Game.navFree(F, si + di, sj + dj)) { si += di; sj += dj; r = 9; dj = 99; break; }
    }
    const N = n.cols * n.rows, start = sj * n.cols + si, goal = tj * n.cols + ti;
    const gS = new Float32Array(N).fill(1e9), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    const heap = []; // [f, idx]
    const push = (f, i) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = k * 2 + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
    const h = (i) => { const x = i % n.cols, y = (i / n.cols) | 0, dx = Math.abs(x - ti), dy = Math.abs(y - tj); return dx + dy + (1.414 - 2) * Math.min(dx, dy); };
    gS[start] = 0; push(h(start), start);
    let iter = 0;
    while (heap.length && iter++ < 60000) {
      const [, cur] = pop();
      if (cur === goal) break;
      if (closed[cur]) continue;
      closed[cur] = 1;
      const cx = cur % n.cols, cy = (cur / n.cols) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = cx + dx, ny = cy + dy;
        if (!Game.navFree(F, nx, ny)) continue;
        if (dx && dy && (!Game.navFree(F, cx + dx, cy) || !Game.navFree(F, cx, cy + dy))) continue;
        const ni = ny * n.cols + nx, ng = gS[cur] + (dx && dy ? 1.414 : 1);
        if (ng < gS[ni]) { gS[ni] = ng; from[ni] = cur; push(ng + h(ni), ni); }
      }
    }
    if (from[goal] === -1 && goal !== start) return null;
    const cells = [];
    for (let c = goal; c !== -1 && c !== start; c = from[c]) cells.push(c);
    cells.reverse();
    const pts = cells.map((c) => ({ x: n.x1 + ((c % n.cols) + 0.5) * n.res, z: n.z1 + (((c / n.cols) | 0) + 0.5) * n.res }));
    // string-pull smoothing
    const out = []; let anchor = { x: sx, z: sz }, i = 0;
    while (i < pts.length) {
      let j = pts.length - 1;
      while (j > i && !Game.los(F, anchor, pts[j])) j--;
      out.push(pts[j]); anchor = pts[j]; i = j + 1;
    }
    return out;
  },

  los(F, a, b) {
    const d = Math.hypot(b.x - a.x, b.z - a.z), steps = Math.ceil(d / 0.12);
    for (let s = 1; s <= steps; s++) {
      const x = a.x + (b.x - a.x) * s / steps, z = a.z + (b.z - a.z) * s / steps;
      const [i, j] = Game.navCell(F, x, z);
      if (!Game.navFree(F, i, j)) return false;
    }
    return true;
  },

  /* ================= player & guide ================= */
  createActors() {
    const P = People.make("character-male-c", { x: 0, z: 6 });
    Object.assign(P, { x: 0, z: 6, ry: Math.PI, vx: 0, vz: 0, path: null, sitting: null, stepAcc: 0 });
    Game.player = P;
    const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: Kit.canvasTex(256, 64, (c) => {
      c.font = `800 30px ${Kit.FONT}`; c.textAlign = "center"; c.fillStyle = "rgba(255,255,255,0.85)";
      c.shadowColor = "rgba(0,0,0,0.6)"; c.shadowBlur = 6; c.fillText("YOU", 128, 44);
    }), transparent: true, depthWrite: false }));
    tag.scale.set(0.7, 0.18, 1); tag.position.y = People.H + 0.28; P.root.add(tag); P.tag = tag;

    Guide.create();
  },

  guideSay(text) { Guide.say(text); },

  updatePlayer(dt) {
    const p = Game.player;
    p.mixer.update(dt);
    p.tickBubble(dt);
    if (Game.state !== "play") return;
    let ix = 0, iz = 0, turn = 0;
    if (!UI.isTyping()) {
      if (Game.keys.has("w") || Game.keys.has("ArrowUp")) iz += 1;
      if (Game.keys.has("s") || Game.keys.has("ArrowDown")) iz -= 1;
      if (Game.keys.has("a")) ix -= 1;
      if (Game.keys.has("d")) ix += 1;
      if (Game.keys.has("ArrowLeft") || Game.keys.has("q")) turn += 1;
      if (Game.keys.has("ArrowRight") || Game.keys.has("e_turn")) turn -= 1;
    }
    ix += Game.touch.dx; iz -= Game.touch.dy;
    if (turn) {
      Game.cam.tYaw += turn * dt * 1.9; Game.cam.manualT = Game.time;
      if (typeof Tutorial !== "undefined" && Tutorial.active) { Tutorial.lookAcc += dt * 2; if (Tutorial.lookAcc > 0.8) Tutorial.notify("look"); }
    }
    if (p.sitting) {
      if (ix || iz || p.path) { p.sitting = null; p.x = p.standX; p.z = p.standZ; p.root.position.y = 0; }
      else { p.play("sit"); p.root.position.set(p.x, p.seatY || 0, p.z); p.root.rotation.y = p.ry; return; }
    }
    let dx = 0, dz = 0, ease = 1;
    const manual = Math.hypot(ix, iz) > 0.05;
    if (manual) {
      p.path = null; p.pending = null;
      const y = Game.cam.yaw, fx = Math.sin(y), fz = Math.cos(y), rx = -Math.cos(y), rz = Math.sin(y);
      const m = Math.max(1, Math.hypot(ix, iz));
      dx = (fx * iz + rx * ix) / m; dz = (fz * iz + rz * ix) / m;
      if (typeof Tutorial !== "undefined" && Tutorial.active) { Tutorial.moveAcc += dt * 3; if (Tutorial.moveAcc > 2.5) Tutorial.notify("move"); }
    } else if (p.path && p.path.length) {
      // corner-cutting path follow: aim past intermediate waypoints, ease into the last one
      const last = p.path.length === 1, wp = p.path[0];
      const ddx = wp.x - p.x, ddz = wp.z - p.z, d = Math.hypot(ddx, ddz);
      if (d < (last ? 0.16 : 0.45)) { p.path.shift(); if (!p.path.length) { p.path = null; Game.arrive(); } }
      else {
        dx = ddx / d; dz = ddz / d;
        if (last) ease = U.clamp(d / 0.9, 0.3, 1);
        // give up gracefully if something (an NPC, a chair) pins us in place
        p.stuckT = (p.stuckT || 0) + dt;
        if (p.stuckT > 0.6) { if (Math.hypot(p.x - (p.stuckX || 0), p.z - (p.stuckZ || 0)) < 0.12) { p.path = null; Game.arrive(); } p.stuckT = 0; p.stuckX = p.x; p.stuckZ = p.z; }
      }
    } else if (p.pending) Game.arrive();
    const run = Game.keys.has("Shift") || (p.path && p.path.length > 0 && p.pathLen > 9);
    const sp = (run ? 6.2 : 3.8) * ease;
    // quick to start, a touch quicker to stop — feet, not ice
    const want = Math.hypot(dx, dz) > 0;
    p.vx = U.damp(p.vx, dx * sp, want ? 13 : 17, dt);
    p.vz = U.damp(p.vz, dz * sp, want ? 13 : 17, dt);
    const R = 0.3, F = Game.F;
    const ox = p.x, oz = p.z;
    let x = p.x + p.vx * dt, z = p.z + p.vz * dt;
    // circle-vs-box resolution: slides along walls and rolls around corners instead of snagging
    for (let it = 0; it < 3; it++) {
      for (const c of F.colliders) {
        if (x < c.x1 - R || x > c.x2 + R || z < c.z1 - R || z > c.z2 + R) continue;
        const qx = U.clamp(x, c.x1, c.x2), qz = U.clamp(z, c.z1, c.z2);
        const ex = x - qx, ez = z - qz, d2 = ex * ex + ez * ez;
        if (d2 >= R * R) continue;
        if (d2 < 1e-9) {
          const l = x - c.x1, r = c.x2 - x, b = z - c.z1, t = c.z2 - z, mn = Math.min(l, r, b, t);
          if (mn === l) x = c.x1 - R; else if (mn === r) x = c.x2 + R; else if (mn === b) z = c.z1 - R; else z = c.z2 + R;
        } else { const d = Math.sqrt(d2); x = qx + ex / d * R; z = qz + ez / d * R; }
      }
    }
    x = U.clamp(x, F.bounds.x1 + R, F.bounds.x2 - R); z = U.clamp(z, F.bounds.z1 + R, F.bounds.z2 - R);
    p.x = x; p.z = z;
    // what actually happened becomes the velocity (no pushing into walls at full speed)
    if (dt > 0) { p.vx = U.lerp(p.vx, (x - ox) / dt, 0.6); p.vz = U.lerp(p.vz, (z - oz) / dt, 0.6); }
    const speed = Math.hypot(p.vx, p.vz);
    let lean = 0;
    if (speed > 0.25) {
      const face = Math.atan2(p.vx, p.vz);
      let turnD = face - p.ry; while (turnD > Math.PI) turnD -= Math.PI * 2; while (turnD < -Math.PI) turnD += Math.PI * 2;
      p.ry = U.angLerp(p.ry, face, Math.min(1, dt * (Math.abs(turnD) > 1.6 ? 20 : 14)));
      lean = U.clamp(-turnD * speed * 0.03, -0.09, 0.09);
      p.play(speed > 4.8 ? "sprint" : "walk", 0.15);
      const walk = p.actions.walk; if (walk) walk.timeScale = U.clamp(speed / 2.9, 0.6, 1.45);
      const spr = p.actions.sprint; if (spr) spr.timeScale = U.clamp(speed / 5.6, 0.8, 1.3);
      p.stepAcc += speed * dt;
      if (p.stepAcc > (speed > 4 ? 1.25 : 0.82)) { p.stepAcc = 0; AudioSys.sfx("step"); }
      // the camera drifts gently in behind you — only when you're heading away from it,
      // never while you steer it, never when strafing (that's what made walks spiral)
      if (!Game.cam.drag && Game.touch.lookId < 0 && Game.time - Game.cam.manualT > 1.6 && (!manual || iz > 0.3)) {
        let d = face - Game.cam.tYaw;
        while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
        if (Math.abs(d) < 1.15) Game.cam.tYaw += d * Math.min(1, dt * (manual ? 0.7 : 0.5) * Math.min(1, speed / 3));
      }
      if (Game.cam.mode === "focus") Game.release();
    } else if (p.cur !== p.actions["interact-right"] && p.cur !== p.actions["emote-yes"]) p.play("idle", 0.3);
    p.lean = U.damp(p.lean || 0, lean, 6, dt);
    p.root.position.set(p.x, 0, p.z);
    p.root.rotation.set(0, p.ry, p.lean);
    if (Game.cam.mode === "follow" || Game.cam.mode === "focus") p.tag.material.opacity = U.clamp((Game.cam.dist - 4) / 3, 0, 0.85);
  },

  walkTo(x, z, pending) {
    const F = Game.F, p = Game.player;
    const path = Game.findPath(F, p.x, p.z, x, z);
    if (!path) { p.pending = pending && Math.hypot(p.x - pending.x, p.z - pending.z) < pending.r ? pending : null; if (p.pending) Game.arrive(); return; }
    p.path = path; p.pending = pending || null; p.stuckT = 0; p.stuckX = p.x; p.stuckZ = p.z;
    p.pathLen = path.reduce((acc, w, i) => acc + (i ? Math.hypot(w.x - path[i - 1].x, w.z - path[i - 1].z) : Math.hypot(w.x - p.x, w.z - p.z)), 0);
    Game.showClick(x, z);
  },

  arrive() {
    const p = Game.player, it = p.pending;
    p.pending = null;
    if (!it) return;
    if (Math.hypot(p.x - it.x, p.z - it.z) <= it.r + 0.4) Game.useInteract(it);
  },

  useInteract(it) {
    const p = Game.player;
    p.ry = Math.atan2(it.x - p.x, it.z - p.z);
    p.play("interact-right", 0.15, true);
    setTimeout(() => { if (p.cur === p.actions["interact-right"]) p.play("idle"); }, 900);
    AudioSys.sfx("blip");
    if (it.focus) Game.focusOn(it.focus);
    it.fn();
    if (typeof Tutorial !== "undefined") Tutorial.notify("interact");
  },

  sit(seat) {
    const p = Game.player;
    p.standX = p.x; p.standZ = p.z;
    p.sitting = true; p.path = null;
    p.x = seat.x; p.z = seat.z; p.ry = seat.ry; p.seatY = seat.y || 0;
    p.vx = p.vz = 0;
    p.play("sit", 0.3);
    AudioSys.sfx("pop");
    UI.say(CONTENT.texts.sit);
  },

  updateGuide(dt, t) {
    Look.tick(t);
    Guide.update(dt, t);
  },

  /* ================= camera ================= */
  pivotFor(p) {
    const sp = Math.hypot(p.vx || 0, p.vz || 0), lead = Math.min(1, sp / 3) * 0.9;
    // aim a little above the head: the character sits in the lower third, the room fills the frame
    return new THREE.Vector3(p.x + Math.sin(p.ry) * lead, 1.5, p.z + Math.cos(p.ry) * lead);
  },
  orbit(pivot, yaw, pitch, dist) {
    const cp = Math.cos(pitch);
    return new THREE.Vector3(pivot.x - Math.sin(yaw) * cp * dist, Math.max(1.4, pivot.y + Math.sin(pitch) * dist), pivot.z - Math.cos(yaw) * cp * dist);
  },
  /* ---- spring arm ----
     The camera lives INSIDE the building: under the ceiling, inside the outer walls,
     and on the visitor's side of every partition. Walls never have to vanish. */
  camCeil(F) { return F && F.idx !== "P" ? (F.camCeil || F.ceilH) - 0.35 : 60; },
  armSolve(pivot, yaw, pitch, dist) {
    const F = Game.F, ceil = Game.camCeil(F);
    // zoom sets how far back we stand, pitch how high we'd like to be; the ceiling caps the height
    // (so indoors a steeper pitch walks the lens in closer instead of punching through the roof)
    const y = Math.max(1.3, Math.min(ceil, pivot.y + Math.sin(pitch) * dist));
    const hd = Math.max(0.6, Math.cos(pitch) * dist);
    const dx = -Math.sin(yaw), dz = -Math.cos(yaw);
    return { y, hd, dx, dz, free: Game.armFree(pivot, dx, dz, hd, y) };
  },
  /* how far (horizontally) the arm can reach from the pivot before something solid gets in the way */
  armFree(pv, dx, dz, hd, cy) {
    const F = Game.F; if (!F) return hd;
    const M = 0.42;                          // clearance so the near plane never kisses a wall
    let best = hd;
    const b = F.bounds;
    if (b) {
      // outdoors the lens may drift past the walkable plaza (but never into the tower face)
      const g = F.idx === "P" ? 12 : 0;
      const x1 = b.x1 + M - g, x2 = b.x2 - M + g, z1 = b.z1 + M, z2 = b.z2 - M + g;
      if (dx > 1e-6) best = Math.min(best, (x2 - pv.x) / dx); else if (dx < -1e-6) best = Math.min(best, (x1 - pv.x) / dx);
      if (dz > 1e-6) best = Math.min(best, (z2 - pv.z) / dz); else if (dz < -1e-6) best = Math.min(best, (z1 - pv.z) / dz);
    }
    for (const w of F.camWalls) {
      const ex = w.x2 - w.x1, ez = w.z2 - w.z1, len = Math.hypot(ex, ez); if (len < 1e-4) continue;
      const den = dx * ez - dz * ex; if (Math.abs(den) < 1e-6) continue;
      const ax = w.x1 - pv.x, az = w.z1 - pv.z;
      const t = (ax * ez - az * ex) / den;                // distance along the arm
      if (t <= 0 || t > best + M * 3) continue;
      const u = (ax * dz - az * dx) / den;                // position along the wall (0..1)
      const pad = 0.25 / len;
      if (u < -pad || u > 1 + pad) continue;
      const yy = pv.y + (cy - pv.y) * (t / Math.max(0.01, hd));   // height where the arm crosses
      let y0 = w.y0;
      if (w.door && !Game._strictDoors) {
        // while you're in the doorway the lens may trail you through it (under the lintel)
        const l2 = len * len, uu = U.clamp(((pv.x - w.x1) * ex + (pv.z - w.z1) * ez) / l2, 0, 1);
        if (Math.hypot(pv.x - (w.x1 + ex * uu), pv.z - (w.z1 + ez * uu)) < 1.6) y0 = w.lintel - 0.1;
      }
      if (yy < y0 - 0.15 || yy > w.y1 + 0.15) continue;
      const sin = Math.abs(den) / len;                     // grazing walls need more backing-off
      best = Math.min(best, t - M / Math.max(0.3, sin));
    }
    return Math.max(0.25, Math.min(hd, best));
  },
  /* the yaw near `want` with the most breathing room behind the visitor */
  bestYaw(pivot, want, pitch, dist, range = 1.6, steps = 16) {
    let best = want, bs = -1e9;
    Game._strictDoors = true;              // framing choices never aim through a doorway
    for (let i = 0; i <= steps; i++) {
      const off = -range + (2 * range * i) / steps;
      const a = Game.armSolve(pivot, want + off, pitch, dist);
      const sc = Math.min(a.free, a.hd) / a.hd - Math.abs(off) * 0.16;
      if (sc > bs) { bs = sc; best = want + off; }
    }
    Game._strictDoors = false;
    return best;
  },
  /* never let the lens sit inside a wall's clearance (slides along instead) */
  armPush(pos) {
    const F = Game.F; if (!F) return pos;
    const M = 0.36;
    for (let k = 0; k < 2; k++) for (const w of F.camWalls) {
      if (w.door || pos.y < w.y0 - 0.1 || pos.y > w.y1 + 0.1) continue;
      const ex = w.x2 - w.x1, ez = w.z2 - w.z1, l2 = ex * ex + ez * ez; if (l2 < 1e-8) continue;
      const u = U.clamp(((pos.x - w.x1) * ex + (pos.z - w.z1) * ez) / l2, 0, 1);
      const qx = w.x1 + ex * u, qz = w.z1 + ez * u, ddx = pos.x - qx, ddz = pos.z - qz, d = Math.hypot(ddx, ddz);
      if (d < M && d > 1e-5) { pos.x = qx + ddx / d * M; pos.z = qz + ddz / d * M; }
    }
    return pos;
  },
  /* a camera pose that respects the arm (used by cinematics that land on the follow view) */
  safePose(pivot, yaw, pitch, dist) {
    const a = Game.armSolve(pivot, yaw, pitch, dist);
    return Game.armPush(new THREE.Vector3(pivot.x + a.dx * a.free, a.y, pivot.z + a.dz * a.free));
  },
  /* clamp an arbitrary cinematic camera position into the room the subject is in */
  safeShot(subject, pos) {
    const F = Game.F; if (!F || F.idx === "P") return pos;
    const dx = pos.x - subject.x, dz = pos.z - subject.z, hd = Math.hypot(dx, dz) || 0.001;
    const y = Math.min(Game.camCeil(F), pos.y);
    const free = Game.armFree(subject, dx / hd, dz / hd, hd, y);
    return Game.armPush(new THREE.Vector3(subject.x + dx / hd * free, y, subject.z + dz / hd * free));
  },
  followPose() {
    const c = Game.cam, look = Game.pivotFor(Game.player);
    return { pos: Game.safePose(look, c.tYaw, c.tPitch, c.tDist), look };
  },

  snapCamera() {
    const c = Game.cam;
    c.yaw = c.tYaw; c.pitch = c.tPitch; c.dist = c.tDist;
    const f = Game.followPose();
    c.target.copy(f.look);
    const a = Game.armSolve(f.look, c.yaw, c.pitch, c.dist);
    c.arm = a.free; c.armY = a.y;
    Game.camera.position.copy(f.pos);
    Game.camera.lookAt(f.look);
  },

  setView(yaw, pitch, dist) {
    const c = Game.cam;
    if (yaw !== undefined) c.tYaw = yaw;
    if (pitch !== undefined) c.tPitch = pitch;
    if (dist !== undefined) c.tDist = dist;
    Game.snapCamera();
  },

  updateCamera(dt) {
    const cam = Game.camera, c = Game.cam;
    if (c.mode === "cine" || c.mode === "focus") {
      cam.position.copy(Game.rig.pos);
      cam.lookAt(Game.rig.look);
    } else {
      // smooth the orbit parameters (not the position) → turns swing around you, never cut across
      let dy = c.tYaw - c.yaw;
      while (dy > Math.PI) { dy -= Math.PI * 2; c.yaw += Math.PI * 2; }
      while (dy < -Math.PI) { dy += Math.PI * 2; c.yaw -= Math.PI * 2; }
      c.yaw = U.damp(c.yaw, c.tYaw, 12, dt);
      c.pitch = U.damp(c.pitch, c.tPitch, 12, dt);
      c.dist = U.damp(c.dist, c.tDist, 9, dt);
      const piv = Game.pivotFor(Game.player);
      c.target.x = U.damp(c.target.x, piv.x, 11, dt);
      c.target.y = U.damp(c.target.y, piv.y, 11, dt);
      c.target.z = U.damp(c.target.z, piv.z, 11, dt);
      // whiskers: when the arm is squeezed and you're not steering, swing toward open space
      if (!c.drag && Game.touch.lookId < 0 && Game.time - c.manualT > 1.2 && Game.time - (c.whiskT || 0) > 0.25) {
        c.whiskT = Game.time;
        const now = Game.armSolve(c.target, c.tYaw, c.pitch, c.dist);
        if (now.free < now.hd * 0.62) {
          const by = Game.bestYaw(c.target, c.tYaw, c.pitch, c.dist, 0.9, 6);
          c.whiskYaw = by;
        } else c.whiskYaw = null;
      }
      if (c.drag || Game.touch.lookId >= 0 || Game.time - c.manualT <= 1.2) c.whiskYaw = null;
      if (c.whiskYaw != null) {
        let d = c.whiskYaw - c.tYaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
        c.tYaw += d * Math.min(1, dt * 1.6);
      }
      const a = Game.armSolve(c.target, c.yaw, c.pitch, c.dist);
      // snap in fast when something gets between us, ease back out slowly
      if (c.arm === undefined) c.arm = a.free;
      // a big squeeze is a cut (like an edit), a small one a quick dolly; space opening up eases out
      if (a.free < c.arm - 2.2) c.arm = a.free;
      else c.arm = a.free < c.arm ? U.damp(c.arm, a.free, 28, dt) : U.damp(c.arm, a.free, 3.2, dt);
      // a squeezed arm drops toward shoulder height: over-the-shoulder, not a bird's-eye of your scalp
      // the lens keeps its height when squeezed: in tall rooms that's a clean three-quarter view of
      // the whole character, never a close-up of the back of their head
      const wantY = c.arm < 1.6 ? Math.max(a.y, c.target.y + 2.6) : a.y;
      c.armY = c.armY === undefined ? wantY : U.damp(c.armY, Math.min(Game.camCeil(Game.F), wantY), 8, dt);
      cam.position.set(c.target.x + a.dx * c.arm, c.armY, c.target.z + a.dz * c.arm);
      Game.armPush(cam.position);
      cam.lookAt(c.target);
    }
    Game.updateCutaway(dt);
    Game.updateOccluders(dt);
    Game.updateLights(dt);
    // shadow frustum follows the action, snapped to texels to avoid shimmer
    const tx = Game.player.x, tz = Game.player.z;
    const texel = 30 / Game.key.shadow.mapSize.x;
    const sx = Math.round(tx / texel) * texel, sz = Math.round(tz / texel) * texel;
    const kd = Game.keyDir || new THREE.Vector3(0.5, 1, 0.35);
    Game.key.target.position.set(sx, 0, sz);
    Game.key.position.set(sx + kd.x * 30, kd.y * 30, sz + kd.z * 30);
    Game.fill.target.position.set(sx, 0, sz);
    Game.fill.position.set(sx - kd.x * 20, 14, sz - kd.z * 20);
  },

  /* light pool: the 8 fixtures nearest to what you're looking at get real lights; the rest fade out
     (their bulbs and lampshades still glow — that's emissive + bloom, not a light) */
  updateLights(dt) {
    const F = Game.F, pool = Game.lightPool;
    if (!F || !pool) return;
    const A = F.lightAnchors || [];
    const cam = Game.camera.position, tg = Game.cam.mode === "follow" ? Game.cam.target : (Game.rig ? Game.rig.look : Game.cam.target);
    const fx = tg.x + (tg.x - cam.x) * 0.25, fz = tg.z + (tg.z - cam.z) * 0.25;
    const ranked = A.slice().sort((p, q) => Math.hypot(p.position.x - fx, p.position.z - fz) / Math.max(4, p.distance)
                                         - Math.hypot(q.position.x - fx, q.position.z - fz) / Math.max(4, q.distance));
    const want = new Set(ranked.slice(0, pool.length));
    const snap = Game._lightSnap; Game._lightSnap = false;
    for (const a of A) a.w = snap ? (want.has(a) ? 1 : 0) : U.damp(a.w, want.has(a) ? 1 : 0, 5, dt);
    for (const s of pool) if (s.a && (s.a.w < 0.02 && !want.has(s.a))) { s.a.slot = null; s.a = null; }
    for (const a of ranked.slice(0, pool.length)) {
      if (a.slot) continue;
      const free = pool.find((s) => !s.a);
      if (free) { free.a = a; a.slot = free; }
    }
    for (const s of pool) {
      const l = s.l, a = s.a;
      if (!a) { l.intensity = 0; continue; }
      l.position.copy(a.position); l.color.copy(a.color); l.distance = a.distance; l.decay = a.decay;
      l.intensity = a.intensity * a.w;
    }
  },

  /* furniture and props that get between the lens and the visitor fade to a ghost (walls never do —
     the spring arm keeps them out of the way) */
  updateOccluders(dt) {
    const F = Game.F; if (!F) return;
    const occ = Game.occ || (Game.occ = new Map());
    const now = Game.time;
    if (Game.cam.mode === "follow" && now - (Game._occT || 0) > 0.07) {
      Game._occT = now;
      const want = new Set();
      const cam = Game.camera.position, p = Game.player;
      const ray = Game._occRay || (Game._occRay = new THREE.Raycaster());
      for (const hy of [0.7, 1.5]) {
        const to = new THREE.Vector3(p.x, hy, p.z), dir = to.clone().sub(cam), len = dir.length();
        ray.set(cam, dir.normalize()); ray.far = Math.max(0.1, len - 0.45); ray.camera = Game.camera;
        for (const h of ray.intersectObject(F.group, true)) {
          const o = h.object;
          if (!o.isMesh || o.isInstancedMesh || !o.visible || Game.isActor(o)) continue;
          const g = Game.occGroup(o);
          if (g) want.add(g);
        }
      }
      for (const g of want) if (!occ.has(g)) occ.set(g, { k: 1, mats: null });
      for (const [g, st] of occ) st.want = want.has(g) ? 0.22 : 1;
    }
    for (const [g, st] of occ) {
      st.k = U.damp(st.k, st.want === undefined ? 1 : st.want, 10, dt);
      if (st.k < 0.985 && !st.mats) {
        st.mats = [];
        g.traverse((m) => {
          if (!m.isMesh || !m.material) return;
          const orig = m.material, list = Array.isArray(orig) ? orig : [orig];
          const faded = list.map((mt) => {
            const c = mt.clone(); c.transparent = true; c.depthWrite = false; c.userData.baseOpacity = mt.opacity;
            if (mt.onBeforeCompile) { c.onBeforeCompile = mt.onBeforeCompile; c.customProgramCacheKey = mt.customProgramCacheKey; }
            return c;
          });
          st.mats.push({ m, orig, faded: Array.isArray(orig) ? faded : faded[0], list: faded });
          m.material = Array.isArray(orig) ? faded : faded[0];
        });
      }
      if (st.mats) for (const e of st.mats) for (const mt of e.list) mt.opacity = mt.userData.baseOpacity * st.k;
      if (st.k > 0.985 && st.mats && st.want === 1) {
        for (const e of st.mats) { e.m.material = e.orig; for (const mt of e.list) mt.dispose(); }
        st.mats = null; occ.delete(g);
      }
    }
  },
  /* the thing to fade when `o` blocks the view: its prop group, if that's a modest-sized prop */
  occGroup(o) {
    const F = Game.F;
    let n = o;
    while (n.parent && n.parent !== F.group) n = n.parent;
    if (!n.parent) return null;
    for (const c of F.cut) if (c.g === n && c.solid) return null;      // walls, glass, elevator: never
    if (n.userData.noFade) return null;
    if (!n.userData.occSize) {
      const b = new THREE.Box3().setFromObject(n), sz = b.getSize(new THREE.Vector3());
      n.userData.occSize = Math.max(sz.x, sz.z); n.userData.occTop = b.max.y;
    }
    if (n.userData.occSize > 7 || n.userData.occTop < 0.9) {
      // big container (or something low you can see over): fade just the mesh, unless it's floor-level
      if (o.geometry && !o.geometry.boundingBox) o.geometry.computeBoundingBox();
      return n.userData.occTop < 0.9 ? null : o;
    }
    return n;
  },

  updateCutaway(dt) {
    const F = Game.F; if (!F) return;
    const cam = Game.camera.position, p = Game.player;
    const side = (c, x, z) => Math.sign((c.x2 - c.x1) * (z - c.z1) - (c.z2 - c.z1) * (x - c.x1));
    for (const c of F.cut) {
      if (c.solid) { if (c.k !== 1) { c.k = 1; c.g.scale.y = 1; for (const d of c.decor) d.visible = true; } continue; }
      // dollhouse rule: a wall drops when the camera and the visitor are on opposite sides of it
      // and it's close enough to matter
      let block = false;
      const sc = side(c, cam.x, cam.z), sp = side(c, p.x, p.z);
      if (sc !== 0 && sp !== 0 && sc !== sp) {
        const d = Game.segDist(p.x, p.z, c.x1, c.z1, c.x2, c.z2);
        if (d < 10) {
          // only if the wall actually sits in front of the camera's view cone
          const mx = U.clamp(p.x, Math.min(c.x1, c.x2), Math.max(c.x1, c.x2)), mz = U.clamp(p.z, Math.min(c.z1, c.z2), Math.max(c.z1, c.z2));
          const vx = p.x - cam.x, vz = p.z - cam.z, wx = mx - cam.x, wz = mz - cam.z;
          const cos = (vx * wx + vz * wz) / (Math.hypot(vx, vz) * Math.hypot(wx, wz) || 1);
          if (cos > 0.2) block = true;
        }
      }
      const target = block ? 0.12 : 1;
      c.k = U.damp(c.k, target, 8, dt);
      c.g.scale.y = c.k;
      const show = c.k > 0.8;
      for (const d of c.decor) d.visible = show;
    }
  },

  focusOn(pt) {
    const c = Game.cam;
    c.mode = "focus";
    Game.rig.pos.copy(Game.camera.position);
    Game.rig.look.copy(c.target);
    const p = Game.player;
    const dir = new THREE.Vector3(p.x - pt.x, 0, p.z - pt.z).normalize();
    const to = Game.safeShot(new THREE.Vector3(pt.x + dir.x * 0.45, pt.y || 1.5, pt.z + dir.z * 0.45),
      new THREE.Vector3(pt.x + dir.x * 4.2, (pt.y || 1.5) + 1.2, pt.z + dir.z * 4.2));
    gsap.killTweensOf(Game.rig.pos); gsap.killTweensOf(Game.rig.look);
    gsap.to(Game.rig.pos, { x: to.x, y: to.y, z: to.z, duration: 1.1, ease: "power2.inOut" });
    gsap.to(Game.rig.look, { x: pt.x, y: pt.y || 1.5, z: pt.z, duration: 1.1, ease: "power2.inOut" });
  },

  release() {
    if (Game.cam.mode !== "focus") return;
    const end = Game.followPose();
    gsap.killTweensOf(Game.rig.pos); gsap.killTweensOf(Game.rig.look);
    Game.cam.mode = "cine";
    gsap.to(Game.rig.pos, { x: end.pos.x, y: end.pos.y, z: end.pos.z, duration: 0.8, ease: "power2.inOut" });
    gsap.to(Game.rig.look, { x: end.look.x, y: end.look.y, z: end.look.z, duration: 0.8, ease: "power2.inOut", onComplete: () => { Game.snapCamera(); Game.cam.mode = "follow"; } });
  },

  /* ================= input ================= */
  initInput() {
    window.addEventListener("keydown", (e) => {
      if (UI.isTyping()) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      Game.keys.add(k);
      if (Game.state !== "play") return;
      if (k === "e" || k === "Enter") Game.tryInteract();
      if (k === "v") { const P = Game.floorIndex === "P", close = Game.cam.tDist > 5; Game.cam.tDist = close ? 4.2 : P ? 9.5 : 8.6; Game.cam.tPitch = close ? 0.32 : P ? 0.36 : 0.6; Game.cam.manualT = Game.time; }
      if (k === "m") UI.muteToggle();
      if (k === "f") UI.openElevator();
      if (k === "c") { if (Game.floorIndex === 0) ChatBot.toggle(); else Game.guideSay("NOVA's at the front desk on Floor 0 — or press F for the elevator."); }
      if (k === "Escape") { UI.closeAll(); Game.release(); }
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
    });
    window.addEventListener("keyup", (e) => Game.keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key));
    window.addEventListener("blur", () => Game.keys.clear());

    const cv = Game.canvas;
    Game.ray = new THREE.Raycaster();
    Game.mouse = new THREE.Vector2();
    cv.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "touch") return;
      Game.cam.drag = true; Game.cam.dragD = 0; Game.cam.lx = e.clientX; Game.cam.ly = e.clientY;
    });
    window.addEventListener("pointerup", (e) => {
      if (e.pointerType === "touch") return;
      const wasDrag = Game.cam.dragD > 6;
      Game.cam.drag = false;
      if (!wasDrag && e.target === cv && Game.state === "play") Game.click(e.clientX, e.clientY);
    });
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      if (Game.cam.drag) {
        const dx = e.clientX - Game.cam.lx, dy = e.clientY - Game.cam.ly;
        Game.cam.lx = e.clientX; Game.cam.ly = e.clientY;
        Game.cam.dragD += Math.abs(dx) + Math.abs(dy);
        if (Game.cam.dragD > 6) {
          Game.cam.tYaw -= dx * 0.0055;
          Game.cam.tPitch = U.clamp(Game.cam.tPitch + dy * 0.004, 0.08, 1.2);
          Game.cam.manualT = Game.time;
          if (Game.cam.mode === "focus") Game.release();
          if (typeof Tutorial !== "undefined" && Tutorial.active) { Tutorial.lookAcc += Math.abs(dx) * 0.006; if (Tutorial.lookAcc > 0.8) Tutorial.notify("look"); }
        }
      } else if (e.target === cv) Game.hoverAt(e.clientX, e.clientY);
    });
    cv.addEventListener("wheel", (e) => {
      Game.cam.tDist = U.clamp(Game.cam.tDist * (1 + e.deltaY * 0.0012), 3, Game.floorIndex === "P" ? 18 : 13);
      Game.cam.manualT = Game.time;
    }, { passive: true });

    cv.addEventListener("touchstart", (e) => {
      for (const t of e.changedTouches) {
        if (t.clientX < window.innerWidth * 0.4 && Game.touch.moveId < 0) { Game.touch.moveId = t.identifier; Game.touch.ox = t.clientX; Game.touch.oy = t.clientY; }
        else if (Game.touch.lookId < 0) { Game.touch.lookId = t.identifier; Game.touch.lx = t.clientX; Game.touch.ly = t.clientY; Game.touch.moved = 0; }
      }
    }, { passive: true });
    cv.addEventListener("touchmove", (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === Game.touch.moveId) {
          Game.touch.dx = U.clamp((t.clientX - Game.touch.ox) / 50, -1, 1);
          Game.touch.dy = U.clamp((t.clientY - Game.touch.oy) / 50, -1, 1);
        } else if (t.identifier === Game.touch.lookId) {
          const dx = t.clientX - Game.touch.lx, dy = t.clientY - Game.touch.ly;
          Game.touch.moved += Math.abs(dx) + Math.abs(dy);
          Game.cam.tYaw -= dx * 0.006;
          Game.cam.tPitch = U.clamp(Game.cam.tPitch + dy * 0.004, 0.08, 1.2);
          Game.cam.manualT = Game.time;
          Game.touch.lx = t.clientX; Game.touch.ly = t.clientY;
        }
      }
    }, { passive: true });
    cv.addEventListener("touchend", (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === Game.touch.moveId) { Game.touch.moveId = -1; Game.touch.dx = Game.touch.dy = 0; }
        if (t.identifier === Game.touch.lookId) { Game.touch.lookId = -1; if (Game.touch.moved < 8 && Game.state === "play") Game.click(t.clientX, t.clientY); }
      }
    }, { passive: true });
  },

  pickAt(cx, cy) {
    Game.mouse.set((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1);
    Game.ray.setFromCamera(Game.mouse, Game.camera);
    const F = Game.F;
    if (F && F.markers) {
      const hits = Game.ray.intersectObjects(F.markers.children.filter((m) => m.visible), true);
      for (const h of hits) if (h.object.userData.interact) return { it: h.object.userData.interact };
    }
    // touch the thing itself: whatever solid object is under the cursor, if it sits next to
    // something interactive, that's what you meant
    if (F) {
      const hits = Game.ray.intersectObject(F.group, true);
      for (const h of hits) {
        const o = h.object, m = o.material;
        if (!o.visible || o.isSprite || o.isPoints || o.isLine || o.userData.interact) continue;
        // glass, frosting bands and other see-through layers don't count as "the thing you clicked"
        if (m && !Array.isArray(m) && ((m.transparent && (m.opacity < 0.95 || m.depthWrite === false)) || m.visible === false || o.renderOrder >= 2)) continue;
        if (Game.isActor(o)) continue;
        if (h.point.y < 0.15) return { floor: h.point };      // the floor means "walk here", always
        let best = null, bd = 1.35;
        for (const it of F.interact) {
          if (it.marker && !it.marker.visible) continue;
          const f = it.focus || it;
          const d = Math.min(h.point.distanceTo(new THREE.Vector3(f.x, f.y === undefined ? 1.2 : f.y, f.z)),
            h.point.y > 0.5 ? Math.hypot(h.point.x - it.x, h.point.z - it.z) + Math.max(0, h.point.y - 2.6) : 99);
          if (d < bd) { bd = d; best = it; }
        }
        if (best) return { it: best, point: h.point };
        break;
      }
    }
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const pt = new THREE.Vector3();
    if (Game.ray.ray.intersectPlane(plane, pt)) return { floor: pt };
    return null;
  },
  isActor(o) {
    for (let n = o; n; n = n.parent) {
      if (n === Game.player.root || (Game.guide && n === Game.guide.root) || n === Game.F.markers) return true;
      if (n === Game.F.group) return false;
    }
    return false;
  },

  hoverAt(cx, cy) {
    const now = performance.now();
    if (now - (Game._hoverT || 0) < 70) { if (Game.hover) UI.tooltip(Game.hover.label, cx, cy); return; }
    Game._hoverT = now;
    const h = Game.pickAt(cx, cy);
    const it = h && h.it ? h.it : null;
    if (it !== Game.hover) {
      Game.hover = it;
      Game.canvas.style.cursor = it ? "pointer" : "default";
      UI.tooltip(it ? it.label : null, cx, cy);
    } else if (it) UI.tooltip(it.label, cx, cy);
  },

  click(cx, cy) {
    const h = Game.pickAt(cx, cy);
    if (!h) return;
    const p = Game.player;
    if (h.it) {
      const it = h.it;
      if (Math.hypot(p.x - it.x, p.z - it.z) <= it.r) { Game.useInteract(it); return; }
      const ang = Math.atan2(p.x - it.x, p.z - it.z);
      Game.walkTo(it.x + Math.sin(ang) * Math.min(1.1, it.r * 0.6), it.z + Math.cos(ang) * Math.min(1.1, it.r * 0.6), it);
    } else if (h.floor) Game.walkTo(h.floor.x, h.floor.z, null);
  },

  showClick(x, z) {
    if (!Game.clickRing) {
      Game.clickRing = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.26, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x9fe6ff).multiplyScalar(1.6), transparent: true, depthWrite: false }));
      Game.clickRing.rotation.x = -Math.PI / 2;
      Game.scene.add(Game.clickRing);
    }
    const r = Game.clickRing;
    r.position.set(x, 0.04, z); r.scale.setScalar(0.4); r.material.opacity = 1; r.visible = true;
    gsap.killTweensOf(r.scale); gsap.killTweensOf(r.material);
    gsap.to(r.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 0.7, ease: "power2.out" });
    gsap.to(r.material, { opacity: 0, duration: 0.7, ease: "power1.in", onComplete: () => { r.visible = false; } });
  },

  scanInteract() {
    const p = Game.player;
    let best = null, bd = 1e9;
    if (Game.F && Game.state === "play") for (const it of Game.F.interact) {
      const d = Math.hypot(p.x - it.x, p.z - it.z);
      if (d < it.r && d < bd) { bd = d; best = it; }
    }
    if (best !== Game.nearInteract) { Game.nearInteract = best; UI.prompt(best ? best.label : null); }
    Guide.scan();
  },

  tryInteract() { if (Game.nearInteract && Game.state === "play") Game.useInteract(Game.nearInteract); },

  /* ================= effects ================= */
  sparkle(x, y, z, color = 0xffd166, n = 14) {
    for (let i = 0; i < n; i++) {
      const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.035, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2.5), transparent: true }));
      s.position.set(x, y, z);
      Game.scene.add(s);
      Game.particles.push({ s, life: U.rand(0.6, 1.2), vx: U.rand(-1.2, 1.2), vy: U.rand(0.8, 2.6), vz: U.rand(-1.2, 1.2) });
    }
  },

  updateParticles(dt) {
    for (let i = Game.particles.length - 1; i >= 0; i--) {
      const p = Game.particles[i];
      p.life -= dt;
      if (p.life <= 0) { Game.scene.remove(p.s); Game.particles.splice(i, 1); continue; }
      p.s.position.x += p.vx * dt; p.s.position.y += p.vy * dt; p.s.position.z += p.vz * dt;
      p.vy -= dt * 3.5; p.s.rotation.y += dt * 6;
      p.s.material.opacity = Math.min(1, p.life * 2);
    }
  },

  event(name) {
    if (name === "bell" && ++Game.events.bell === 10) {
      UI.say(CONTENT.texts.hr); AudioSys.sfx("secret");
      Game.sparkle(Game.player.x, 1.6, Game.player.z, 0xff5f45, 24);
    }
  },

  setRetro(on) {
    Game.retro = on;
    AudioSys.retro = on;
    Game.renderer.setPixelRatio(on ? 0.2 : Game.pixelRatio());
    Game.onResize();
    document.body.classList.toggle("retro", on);
    UI.say(on ? CONTENT.texts.konami : "Back to the future. Retro off.");
    AudioSys.sfx("secret");
  },

  /* ================= intro cinematic ================= */
  intro(done) {
    Game.state = "cinematic";
    Game.loadFloor("P", { yawOffset: 0 });
    Game.cam.mode = "cine";
    UI.letterbox(true);
    const rig = Game.rig;
    rig.pos.set(38, 34, 46); rig.look.set(0, 16, -14);
    const mid = { pos: new THREE.Vector3(-9, 7, 22), look: new THREE.Vector3(0, 7, -12) };
    const tl = gsap.timeline({ onComplete: () => { Game.snapCamera(); Game.cam.mode = "follow"; Game.state = "play"; UI.letterbox(false); done && done(); } });
    tl.to(rig.pos, { x: mid.pos.x, y: mid.pos.y, z: mid.pos.z, duration: 4.2, ease: "power2.inOut" }, 0);
    tl.to(rig.look, { x: mid.look.x, y: mid.look.y, z: mid.look.z, duration: 4.2, ease: "power2.inOut" }, 0);
    const end = Game.followPose();
    tl.to(rig.pos, { x: end.pos.x, y: end.pos.y, z: end.pos.z, duration: 2.4, ease: "power2.inOut" });
    tl.to(rig.look, { x: end.look.x, y: end.look.y, z: end.look.z, duration: 2.4, ease: "power2.inOut" }, "<");
    tl.call(() => UI.title("SPARSH HQ", "a building you can walk through"), null, 0.8);
  },

  /* the ending: you walk out into the rain, the lens lets go of you and rises up the tower */
  outroShot() {
    const p = Game.player, rig = Game.rig;
    Game.cam.mode = "cine";
    UI.letterbox(true);
    gsap.killTweensOf(rig.pos); gsap.killTweensOf(rig.look);
    p.x = 0; p.z = 9.2; p.ry = 0; p.path = null;
    p.root.position.set(p.x, 0, p.z); p.root.rotation.set(0, 0, 0);
    p.play("walk", 0.2);
    const walk = { z: 9.2 };
    gsap.to(walk, { z: 15.5, duration: 5.5, ease: "none", onUpdate: () => { p.z = walk.z; p.root.position.z = walk.z; }, onComplete: () => p.play("idle", 0.4) });
    rig.pos.set(1.6, 1.9, 13.2); rig.look.set(0, 1.4, 9.4);
    const tl = gsap.timeline();
    tl.to(rig.look, { x: 0, y: 1.5, z: 15, duration: 4.5, ease: "sine.inOut" }, 0);
    tl.to(rig.pos, { x: 4.5, y: 3.2, z: 20, duration: 4.5, ease: "sine.inOut" }, 0);
    tl.to(rig.pos, { x: -16, y: 22, z: 44, duration: 10, ease: "power1.inOut" }, 4.2);
    tl.to(rig.look, { x: 0, y: 18, z: -12, duration: 10, ease: "power1.inOut" }, 4.2);
  },

  /* ================= main loop ================= */
  loop() {
    requestAnimationFrame(Game.loop);
    const dt = Math.min(0.05, Game.clock.getDelta());
    Game.time += dt;
    const t = Game.time;
    if (Game.state === "loading") { Game.composer.render(); return; }
    Game.updateEnvironment(dt);
    Kit.tickScreens(dt, t);
    if (Game.F) {
      for (const d of Game.F.dynamic) d.update(dt, t);
      for (const n of Game.F.npcs) n.update(dt, t);
    }
    Game.updatePlayer(dt);
    Game.updateGuide(dt, t);
    Game.updateCamera(dt);
    Game.scanInteract();
    Game.updateMarkers(dt, t);
    Game.updateParticles(dt);
    Game.grade.uniforms.uTime.value = t;
    if (Game.retro) Game.renderer.render(Game.scene, Game.camera);
    else Game.composer.render();
    Game.governor();
  },

  /* keep the frame rate up: trim resolution first, then effects; give it back when there's headroom */
  governor() {
    const pf = Game.perf, now = performance.now();
    if (Game.state !== "play" || document.hidden) { pf.t0 = 0; return; }
    if (!pf.t0) { pf.t0 = now; pf.frames = 0; return; }
    pf.frames++;
    const span = now - pf.t0;
    if (span < 2000) return;
    const fps = pf.frames * 1000 / span;
    pf.t0 = now; pf.frames = 0;
    if (fps > 200) return;                                   // a tab coming back from the background
    let changed = false;
    if (fps < 50) {
      pf.good = 0;
      if (Game.renderScale > 0.62) { Game.renderScale = Math.max(0.6, Game.renderScale - 0.14); changed = true; }
      else if (Game.quality > 0) { Game.setQuality(Game.quality - 1); Game.renderScale = 0.85; changed = true; }
    } else if (fps > 58) {
      if (++pf.good >= 3 && Game.renderScale < 1) { Game.renderScale = Math.min(1, Game.renderScale + 0.08); pf.good = 0; changed = true; }
    } else pf.good = 0;
    if (changed) {
      Game.onResize();
      if (typeof Analytics !== "undefined" && !Game._qReported && (Game.quality < 2 || Game.renderScale < 0.75)) {
        Game._qReported = true;
        Analytics.event("quality_auto", { fps: Math.round(fps), level: Game.quality, scale: Math.round(Game.renderScale * 100) });
      }
    }
  },
};
