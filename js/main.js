/* ============================================================
   SPARSH HQ v3 — main.js
   Splash → load the real models → cinematic arrival.
   ============================================================ */

(function boot() {
  const start = () => {
    const canvas = document.getElementById("scene");
    UI.init();
    try {
      if (/nowebgl/.test(location.hash)) throw new Error("forced fallback (#nowebgl)");
      Game.init(canvas);
      if (UI.touch) Game.setQuality(0);          // phones and tablets: no AO, lighter shadows
    } catch (e) {
      // no WebGL (locked-down laptop, old browser): the building can't open, but the résumé can
      console.error(e);
      Analytics.event("no_webgl", {});
      Game.state = "fallback";
      const note = document.createElement("div");
      note.className = "no3d-note";
      note.textContent = "Your browser can't run the 3D building (WebGL is off) — so here's the one-page version.";
      document.body.appendChild(note);
      document.getElementById("dossier").classList.add("over-splash");
      UI.dossier("no_webgl");
      document.querySelectorAll("#dossier .d-x, #dossier .d-visit, #dossier [onclick*='openGuestbook']").forEach((b) => b.remove());
      return;
    }

    const splash = document.createElement("div");
    splash.id = "splash";
    splash.innerHTML = `
      <div class="sp-in">
        <div class="sp-kick">NOT JUST A PORTFOLIO · AN EXPERIENCE</div>
        <h1><span>SPARSH</span> HQ</h1>
        <div class="sp-tag">A building you can walk through. Every room ships software.</div>
        <div class="sp-load"><div class="sp-bar"><i id="sp-fill"></i></div><div id="sp-status">Furnishing the building…</div></div>
        <button id="enter-btn" class="btn primary big" disabled>◈ &nbsp;STEP INSIDE</button>
        <div class="sp-fast"><button id="fast-btn" class="btn ghost">In a hurry? Read the one-page résumé →</button></div>
        <div class="sp-ctrl k-desk">
          <span><b>click</b> walk &amp; open things</span><span><b>WASD</b> walk</span><span><b>drag</b> look</span><span><b>R</b> résumé</span>
        </div>
        <div class="sp-ctrl k-touch">
          <span><b>tap</b> walk &amp; open things</span><span><b>left thumb</b> walk</span><span><b>right thumb</b> look</span><span><b>pinch</b> zoom</span>
        </div>
        <div style="margin-top:20px"><a class="btn ghost sm" href="v1/">prefer the classic isometric tour? → v1</a></div>
        <div class="sp-cred">${CONTENT.profile.name} · ${CONTENT.profile.role} @ ${CONTENT.profile.company} · headphones recommended 🎧${Analytics.on || Analytics.replay ? `<br><span class="sp-priv">Visits are counted anonymously (Google Analytics${Analytics.replay ? " · Microsoft Clarity" : ""}).</span>` : ""}</div>
      </div>`;
    document.body.appendChild(splash);
    const btn = document.getElementById("enter-btn");
    const fill = document.getElementById("sp-fill"), status = document.getElementById("sp-status");

    const lines = ["Furnishing the building…", "Hiring the staff…", "Watering the plants…", "Brewing the espresso…", "Polishing the marble…"];
    Assets.loadAll((p) => {
      fill.style.width = Math.round(p * 100) + "%";
      status.textContent = lines[Math.min(lines.length - 1, Math.floor(p * lines.length))];
    }).then(() => {
      Game.buildSkyline();
      Game.createActors();
      // pre-build the plaza and lobby behind the splash so the first walk is smooth
      Game.build("P"); Game.floorsBuilt.P.group.visible = false;
      Game.build(0); Game.floorsBuilt[0].group.visible = false;
      status.textContent = "The doors are open.";
      btn.disabled = false;
      btn.classList.add("ready");
      if (location.hash.includes("dev")) {   // dev shortcut: skip the intro, expose a shot helper
        try { localStorage.setItem("shq_tut_done", "1"); } catch (e) {}
        splash.remove(); AudioSys.init(); Game.state = "play"; Game.guide.met = true;
        window.T = {
          go(f, x, z, ry, yaw, pitch, dist) {
            gsap.globalTimeline.clear(); UI.letterbox(false); Game.cam.mode = "follow"; Game.state = "play";
            Game.loadFloor(f, x === undefined ? undefined : { spawn: { x, z, ry } });
            ChatBot.close(); UI.closeAll();
            Game.setView(yaw, pitch, dist);
            setTimeout(() => ["intro", "subtitle", "tryhint", "nowplaying"].forEach((k) => UI.els[k].classList.add("hidden")), 50);
            return "ok";
          },
        };
        // render a settled frame into an <img> (works even when the tab is backgrounded)
        T.shot = (f, x, z, ry, yaw, pitch, dist, n = 45) => {
          if (f !== null) T.go(f, x, z, ry, yaw, pitch, dist);
          ["intro", "subtitle", "tryhint", "nowplaying", "prompt"].forEach((k) => UI.els[k].classList.add("hidden"));
          const dt = 1 / 30;
          for (let i = 0; i < n; i++) {
            Game.time += dt; const t = Game.time;
            Game.updateEnvironment(dt); Kit.tickScreens(dt, t);
            for (const d of Game.F.dynamic) d.update(dt, t);
            for (const np of Game.F.npcs) np.update(dt, t);
            Game.updatePlayer(dt); Game.updateGuide(dt, t); Game.updateCamera(dt); Game.updateMarkers(dt, t); Game.updateParticles(dt);
          }
          Game.composer.render();
          const url = Game.renderer.domElement.toDataURL("image/jpeg", 0.9);
          let img = document.getElementById("__snap");
          if (!img) { img = document.createElement("img"); img.id = "__snap"; img.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;z-index:9;pointer-events:none"; document.body.appendChild(img); }
          img.src = url;
          return Game.floorIndex;
        };
        T.go(0);
      }
    }).catch((e) => { console.error(e); status.textContent = "Couldn't load the models — please serve this folder over http (see README)."; });

    document.getElementById("fast-btn").addEventListener("click", () => {
      document.getElementById("dossier").classList.add("over-splash");
      UI.dossier("splash");
    });
    btn.addEventListener("click", () => {
      Analytics.event("experience_start", {});
      document.getElementById("dossier").classList.remove("over-splash");
      AudioSys.init();
      AudioSys.sfx("chime");
      splash.classList.add("gone");
      setTimeout(() => splash.remove(), 1500);
      Game.intro(() => {
        Tutorial.start();
        // quietly furnish the upper floors while the visitor explores the plaza
        let k = 1;
        const next = () => {
          if (k >= CONTENT.floors.length) return;
          if (!Game.floorsBuilt[k]) { const F = Game.build(k); if (Game.F !== F) F.group.visible = false; }
          k++; setTimeout(next, 900);
        };
        setTimeout(next, 2500);
      });
    });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
