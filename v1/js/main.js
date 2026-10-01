/* ============================================================
   SPARSH HQ — main.js
   Bootstrap: splash screen → the building.
   ============================================================ */

window.addEventListener("load", () => {
  const canvas = document.getElementById("scene");

  UI.init();
  ChatBot.init();
  Easter.init();
  Renderer.init(canvas);
  Game.init(canvas);

  // splash
  const splash = document.createElement("div");
  splash.id = "splash";
  splash.innerHTML = `
    <div class="splash-rain"></div>
    <div class="splash-inner">
      <div class="splash-kicker">A WALKABLE CAREER · NOT A RESUME</div>
      <h1><span>SPARSH</span> HQ</h1>
      <div class="splash-tag">Welcome to the building where every room ships software.</div>
      <button id="enter-btn" class="btn primary big">◈ &nbsp;ENTER THE BUILDING</button>
      <div class="splash-controls">
        <span><b>WASD</b> walk</span><span><b>E</b> interact</span><span><b>click</b> stroll</span><span><b>C</b> talk to NOVA</span>
      </div>
      <div style="margin-top:20px"><a class="btn small ghost" href="../">→ walk the full 3D building (v2)</a></div>
      <div class="splash-credit">${CONTENT.profile.name} · ${CONTENT.bigScreen.currentRole} · headphones recommended 🎧</div>
    </div>`;
  document.body.appendChild(splash);

  document.getElementById("enter-btn").addEventListener("click", () => {
    AudioSys.init();
    AudioSys.sfx("chime");
    splash.classList.add("gone");
    setTimeout(() => splash.remove(), 1400);
    Game.start();
  });
});
