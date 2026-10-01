/* ============================================================
   SPARSH HQ — easter.js
   The secrets. If you're reading this file: yes, all of them
   are intentional, and yes, HR really has been notified.
   ============================================================ */

const Easter = {
  KONAMI: ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"],

  init() {
    window.addEventListener("keydown", () => {
      const buf = Input.konamiBuf.map(k => k.length === 1 ? k.toLowerCase() : k);
      const K = Easter.KONAMI;
      if (buf.length >= K.length && K.every((k, i) => buf[buf.length - K.length + i] === k)) {
        Input.konamiBuf.length = 0;
        Easter.konami();
      }
    });
  },

  konami() {
    Game.flags.retro = !Game.flags.retro;
    document.body.classList.toggle("retro", Game.flags.retro);
    AudioSys.sfx("secret");
    UI.toast(Game.flags.retro ? CONTENT.konamiToast : "Back to the future. Retro mode off.", 4000);
    if (Game.flags.retro) Game.burst(Game.player.x, Game.player.y, 40, i => ["#ff0044", "#ffee00", "#00ffcc", "#4488ff"][i % 4], 3);
  },

  emergency() {
    Game.flags.emergencyPresses++;
    const n = Game.flags.emergencyPresses;
    AudioSys.sfx(n >= 10 ? "alarm" : "blip");
    if (n < 10) {
      const lines = [
        "That's the emergency button.",
        "Still the emergency button.",
        "It does not dispense coffee.",
        "NOVA is watching you press that.",
        "Five times. Bold.",
        "The button is starting to feel used.",
        "Security has looked up from their donut.",
        "Two more and this becomes an HR matter.",
        "One more. Think carefully.",
      ];
      UI.toast(`🔴 ${lines[Math.min(n - 1, lines.length - 1)]} (${n}/10)`, 2200);
    } else if (n === 10) {
      UI.toast("🚨 " + CONTENT.hrToast, 5000);
      Camera.shake = 1;
      const nova = Game.npcs.find(x => x.kind === "nova");
      if (nova) nova.say("HR has been notified.", 5);
    } else {
      UI.toast("HR says: please stop. They have a folder now.", 3000);
    }
  },

  youDied() {
    if (Game.state === "dead") return;
    Game.state = "dead";
    AudioSys.sfx("died");
    const el = UI.els.died;
    UI.els["died-sub"].textContent = "You touched the production database.";
    el.classList.remove("hidden");
    void el.offsetWidth;
    el.classList.add("show");
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => {
        el.classList.add("hidden");
        Game.state = "play";
        UI.toast("Respawned. The database remains untouched. Mostly.", 3500);
      }, 900);
    }, 3200);
  },

  portal() {
    AudioSys.sfx("portal");
    UI.toast("🌀 A portal tears open beneath you…", 2000);
    Camera.shake = 0.8;
    setTimeout(() => {
      Game.loadFloor("D", null);
      UI.banner("Developer Dungeon", "this floor does not exist");
    }, 900);
  },

  murph() {
    AudioSys.sfx("whoosh");
    Camera.shake = 0.6;
    Game.guide.say("S-T-A-Y. It's spelling STAY. Probably about the merge conflict.", 5);
    UI.showInfo("murph");
  },

  keyboard() {
    // clacky typing burst
    let i = 0;
    const iv = setInterval(() => {
      AudioSys.sfx("type");
      if (++i > 14) clearInterval(iv);
    }, 70);
    UI.showInfo("execdesk");
  },
};
