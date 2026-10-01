/* ============================================================
   SPARSH HQ — ui.js
   HUD, info panels, elevator, guest book, endings.
   ============================================================ */

const UI = {
  root: null, els: {},
  bannerTimer: null, toastTimer: null,

  timeline: null, // becomes function below; data here:
  timelineData: [
    { year: "2018", title: "CBSE Class XII — 90.4%", sub: "Abhinav Public School, Delhi" },
    { year: "2019", title: "Joined DTU — Computer Engineering", sub: "Delhi Technological University · also Joint Secretary, Sahitya DTU" },
    { year: "2020", title: "Hack with CW — Top 30 / 800 teams", sub: "and Enactus DTU: IoT aquaponics, IC² 5th nationally" },
    { year: "2022", title: "CodeKaze — AIR 315 / 200,000+", sub: "plus Backend Intern @ Xtreme Technologies (weather engine, 94% accuracy)" },
    { year: "2023", title: "B.Tech complete — 8.83 CGPA", sub: "SDE II @ Pocketpills: EMR SaaS backend, built end-to-end" },
    { year: "2024", title: "Scale mode", sub: "12M+ user campaigns · 1M+ visit dashboards · 100+ widgets" },
    { year: "Now", title: "Senior Software Engineer @ Sprinklr", sub: "and this building you're standing in" },
  ],

  init() {
    UI.root = document.getElementById("ui");
    UI.root.innerHTML = `
      <div id="hud" class="hidden">
        <div id="floorpill"><div id="fp-label"></div><div id="fp-sub"></div></div>
        <div id="hudbtns">
          <button id="btn-chat" title="Talk to NOVA (C)">💬</button>
          <button id="btn-lift" title="Elevator / Directory (F)">🛗</button>
          <button id="btn-mute" title="Sound (M)">🔊</button>
          <button id="btn-help" title="Controls">?</button>
        </div>
      </div>
      <div id="banner" class="hidden"><div id="banner-title"></div><div id="banner-sub"></div></div>
      <div id="hint" class="hidden"></div>
      <div id="toast" class="hidden"></div>
      <div id="chat" class="hidden"></div>
      <div id="info" class="hidden"></div>
      <div id="modal-wrap" class="hidden"><div id="modal"></div></div>
      <div id="lift-overlay" class="hidden">
        <div class="lift-door left"></div><div class="lift-door right"></div>
        <div id="lift-display"><span id="lift-floor"></span><span id="lift-name"></span></div>
      </div>
      <div id="died" class="hidden"><div id="died-text">YOU DIED</div><div id="died-sub"></div></div>
      <div id="cine" class="hidden"></div>
      <div id="captions" class="hidden"></div>
    `;
    for (const id of ["hud", "floorpill", "fp-label", "fp-sub", "banner", "banner-title", "banner-sub", "hint", "toast", "chat", "info", "modal-wrap", "modal", "lift-overlay", "lift-floor", "lift-name", "died", "died-sub", "cine", "captions"])
      UI.els[id] = document.getElementById(id);

    document.getElementById("btn-chat").onclick = () => ChatBot.toggle();
    document.getElementById("btn-lift").onclick = () => UI.openElevator();
    document.getElementById("btn-mute").onclick = () => UI.muteToggle();
    document.getElementById("btn-help").onclick = () => UI.help();

    window.addEventListener("keydown", (e) => {
      if (UI.isTyping()) return;
      const k = e.key.toLowerCase();
      if (k === "m") UI.muteToggle();
      if (k === "c" || k === "t") ChatBot.toggle();
      if (k === "f") UI.openElevator();
      if (k === "escape") { UI.closeModal(); UI.closeInfo(); ChatBot.close(); }
    });
  },

  isTyping() {
    const a = document.activeElement;
    return a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA");
  },
  modalOpen() {
    return !UI.els["modal-wrap"].classList.contains("hidden") ||
           !UI.els.info.classList.contains("hidden") ||
           !UI.els.died.classList.contains("hidden") ||
           !UI.els.cine.classList.contains("hidden");
  },

  hudVisible(v) { UI.els.hud.classList.toggle("hidden", !v); },
  setFloorPill(label, sub) { UI.els["fp-label"].textContent = label; UI.els["fp-sub"].textContent = sub; },

  muteToggle() {
    const m = AudioSys.toggleMute();
    document.getElementById("btn-mute").textContent = m ? "🔇" : "🔊";
    UI.toast(m ? "Sound off" : "Sound on", 1200);
  },

  banner(title, sub) {
    const b = UI.els.banner;
    UI.els["banner-title"].textContent = title;
    UI.els["banner-sub"].textContent = sub || "";
    b.classList.remove("hidden"); b.classList.remove("show");
    void b.offsetWidth; b.classList.add("show");
    clearTimeout(UI.bannerTimer);
    UI.bannerTimer = setTimeout(() => b.classList.add("hidden"), 3400);
  },

  hint(text) {
    const h = UI.els.hint;
    if (!text) { h.classList.add("hidden"); return; }
    h.innerHTML = `<span class="key">E</span> ${text}`;
    h.classList.remove("hidden");
  },

  toast(text, dur = 3000) {
    const t = UI.els.toast;
    t.textContent = text;
    t.classList.remove("hidden"); t.classList.remove("show");
    void t.offsetWidth; t.classList.add("show");
    clearTimeout(UI.toastTimer);
    UI.toastTimer = setTimeout(() => t.classList.add("hidden"), dur);
  },

  /* ---------- info panel ---------- */
  showInfo(keyOrObj) {
    const d = typeof keyOrObj === "string" ? CONTENT.panels[keyOrObj] : keyOrObj;
    if (!d) return;
    AudioSys.sfx("open");
    const el = UI.els.info;
    let html = `<button class="x" onclick="UI.closeInfo()">✕</button>
      <div class="info-sub">${d.sub || ""}</div>
      <h2>${d.title}</h2>
      <p>${d.body || ""}</p>`;
    if (d.metrics) {
      html += `<div class="metrics">` + d.metrics.map(m => `<div class="metric"><b>${m[0]}</b><span>${m[1]}</span></div>`).join("") + `</div>`;
    }
    if (d.chips) {
      html += `<div class="chips">` + d.chips.map(c => `<span class="chip">${c}</span>`).join("") + `</div>`;
    }
    if (d.links) {
      html += `<div class="panel-links">` + d.links.map(l =>
        `<a class="btn small" target="_blank" rel="noopener" href="${CONTENT.links[l[1]] || l[1]}">${l[0]} ↗</a>`).join("") + `</div>`;
    }
    el.innerHTML = html;
    el.classList.remove("hidden");
  },
  closeInfo() { if (!UI.els.info.classList.contains("hidden")) { UI.els.info.classList.add("hidden"); AudioSys.sfx("close"); } },

  /* ---------- generic modal ---------- */
  openModal(html, cls = "") {
    UI.els.modal.className = cls;
    UI.els.modal.innerHTML = html;
    UI.els["modal-wrap"].classList.remove("hidden");
    AudioSys.sfx("open");
  },
  closeModal() {
    if (!UI.els["modal-wrap"].classList.contains("hidden")) {
      UI.els["modal-wrap"].classList.add("hidden");
      AudioSys.sfx("close");
    }
  },

  help() {
    UI.openModal(`
      <button class="x" onclick="UI.closeModal()">✕</button>
      <h2>How to explore</h2>
      <div class="help-grid">
        <div><span class="key">W A S D</span> / <span class="key">←↑↓→</span></div><div>walk</div>
        <div><span class="key">click</span></div><div>stroll anywhere / use nearby things</div>
        <div><span class="key">E</span></div><div>interact with glowing rings</div>
        <div><span class="key">C</span></div><div>talk to NOVA, the AI receptionist</div>
        <div><span class="key">F</span></div><div>elevator / building directory</div>
        <div><span class="key">M</span></div><div>sound on/off</div>
      </div>
      <p class="muted">There are at least 9 secrets in the building. One of them is 30 years old and involves arrows.</p>`);
  },

  /* ---------- elevator ---------- */
  openElevator() {
    const cur = Game.floorIndex;
    let rows = "";
    for (let i = CONTENT.floors.length - 1; i >= 0; i--) {
      const f = CONTENT.floors[i];
      rows += `<div class="lift-row ${cur === i ? "cur" : ""}" onclick="UI.closeModal();Game.changeFloor(${i})">
        <span class="lift-num">F${i}</span><span class="lift-label">${f.name}</span><span class="lift-sub">${f.sub}</span></div>`;
    }
    rows += `<div class="lift-row ${cur === "P" ? "cur" : ""}" onclick="UI.closeModal();Game.changeFloor('P')">
      <span class="lift-num">G</span><span class="lift-label">The Plaza</span><span class="lift-sub">street level · rain</span></div>`;
    UI.openModal(`<button class="x" onclick="UI.closeModal()">✕</button><h2>🛗 Sparsh HQ Directory</h2><div class="lift-list">${rows}</div>`, "wide");
  },

  elevatorRide(from, to, cb) {
    const ov = UI.els["lift-overlay"];
    const label = to === "P" ? "G" : "F" + to;
    const meta = Floors.meta(to);
    ov.classList.remove("hidden");
    AudioSys.sfx("doors");
    ov.classList.add("closing");
    setTimeout(() => {
      UI.els["lift-floor"].textContent = label;
      UI.els["lift-name"].textContent = meta.label.replace(/^F\d · /, "");
      cb(); // swap floor while doors closed
      AudioSys.sfx("chime");
      setTimeout(() => {
        ov.classList.remove("closing");
        AudioSys.sfx("doors");
        setTimeout(() => ov.classList.add("hidden"), 700);
      }, 900);
    }, 750);
  },

  /* ---------- photo wall ---------- */
  photoWall() {
    const shots = CONTENT.photos.map((cap, i) =>
      `<div class="polaroid" style="--rot:${(i % 5 - 2) * 2.4}deg;--hue:${(i * 47) % 360}"><div class="pic"></div><span>${cap}</span></div>`).join("");
    UI.openModal(`<button class="x" onclick="UI.closeModal()">✕</button><h2>📸 Photo Wall</h2><div class="polaroids">${shots}</div>`, "wide");
  },

  /* ---------- guest book ---------- */
  getGuestbook() {
    try { return JSON.parse(localStorage.getItem("sparshhq_guestbook") || "[]"); } catch (e) { return []; }
  },

  openGuestbook(exitMode) {
    const entries = UI.getGuestbook();
    const list = entries.length
      ? entries.slice(-4).reverse().map(g => `<div class="gb-entry"><b>${UI.esc(g.name)}</b>${g.company ? " · " + UI.esc(g.company) : ""}<p>${UI.esc(g.msg || "")}</p></div>`).join("")
      : `<div class="gb-entry muted">No entries yet. Be the first traveler to sign.</div>`;
    UI.openModal(`
      <button class="x" onclick="UI.closeModal();${exitMode ? "UI.outro()" : ""}">✕</button>
      <h2>${exitMode ? "Before you head out…" : "📖 Guest Book"}</h2>
      ${exitMode ? `<p class="muted">Every great collaboration begins with a conversation. I'd genuinely love to know who visited.</p>` : `<p class="muted">Leave a note — it stays in the building.</p>`}
      <div class="gb-form">
        <input id="gb-name" placeholder="Name" maxlength="60">
        <input id="gb-email" placeholder="Email" maxlength="80">
        <input id="gb-company" placeholder="Company (optional)" maxlength="60">
        <textarea id="gb-msg" placeholder="Message" rows="3" maxlength="400"></textarea>
      </div>
      <div class="gb-actions">
        <button class="btn primary" onclick="UI.signGuestbook(${!!exitMode},'build')">Let's Build Together</button>
        <button class="btn" onclick="UI.signGuestbook(${!!exitMode},'hire')">Hire Me</button>
        <button class="btn" onclick="UI.signGuestbook(${!!exitMode},'coffee')">Schedule Coffee ☕</button>
      </div>
      <div class="gb-links">
        <a class="btn small" target="_blank" rel="noopener" href="${CONTENT.links.linkedin}">LinkedIn ↗</a>
        <a class="btn small" target="_blank" rel="noopener" href="${CONTENT.links.github}">GitHub ↗</a>
        ${CONTENT.links.resume ? `<a class="btn small" href="${CONTENT.links.resume}" download>Download Resume ⬇</a>` : ""}
        ${exitMode ? `<button class="btn small ghost" onclick="UI.closeModal();UI.outro()">Just leaving quietly →</button>` : ""}
      </div>
      <div class="gb-list">${list}</div>`, "wide");
  },

  signGuestbook(exitMode, intent) {
    const name = document.getElementById("gb-name").value.trim();
    const email = document.getElementById("gb-email").value.trim();
    const company = document.getElementById("gb-company").value.trim();
    const msg = document.getElementById("gb-msg").value.trim();
    if (!name && !email && !msg) { UI.toast("Even just a name would make NOVA's day."); return; }
    const entries = UI.getGuestbook();
    entries.push({ name: name || "Anonymous traveler", email, company, msg, date: new Date().toISOString().slice(0, 10) });
    try { localStorage.setItem("sparshhq_guestbook", JSON.stringify(entries.slice(-100))); } catch (e) {}
    Game.flags.guestbookDone = true;
    AudioSys.sfx("confetti");
    Game.burst(Game.player.x, Game.player.y, 40, (i) => ["#ffd166", "#33c6a4", "#57d8ff"][i % 3], 2.5);
    // deliver to Sparsh's inbox (FormSubmit relay); email-app fallback if unreachable
    const subj = { build: "Let's build together", hire: "Opportunity for Sparsh", coffee: "Coffee chat?" }[intent] || "Hello from Sparsh HQ";
    fetch("https://formsubmit.co/ajax/" + CONTENT.profile.email, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name: name || "Anonymous traveler", email, company, message: msg, intent: subj,
        _subject: "Sparsh HQ guest book — " + (name || "a visitor"), _template: "table", _captcha: "false",
      }),
    }).then((r) => { if (!r.ok) throw new Error("relay"); return r.json(); })
      .then(() => UI.toast("✒ Signed — and delivered to Sparsh's inbox. " + CONTENT.ending.thanks, 5000))
      .catch(() => {
        const body = encodeURIComponent(`Hi Sparsh,\n\n${msg || "I just walked through your HQ."}\n\n— ${name}${company ? " (" + company + ")" : ""}${email ? "\n" + email : ""}`);
        window.open(`mailto:${CONTENT.profile.email}?subject=${encodeURIComponent(subj)}&body=${body}`, "_blank");
        UI.toast("✒ Signed — opening your email app to deliver it.", 5000);
      });
    UI.closeModal();
    if (exitMode) { UI.outro(); }
  },

  exitAttempt() {
    if (Game.state !== "play") return;
    Game.state = "cinematic";
    ChatBot.close(); UI.closeInfo();
    const caps = UI.els.captions;
    caps.classList.remove("hidden");
    const lines = CONTENT.ending.stop;
    let i = 0;
    const next = () => {
      if (i < lines.length) {
        caps.innerHTML = `<div class="cap">${lines[i]}</div>`;
        AudioSys.sfx("blip");
        i++; setTimeout(next, 1900);
      } else {
        caps.classList.add("hidden");
        Game.state = "play";
        Game.player.y -= 1.2; // step back inside
        UI.openGuestbook(true);
      }
    };
    next();
  },

  outro() {
    const cine = UI.els.cine;
    Game.state = "cinematic";
    ChatBot.close();
    UI.els.hud.classList.add("hidden");
    // night shot of the tower
    Game.loadFloor("P", { x: 13, y: 15 });
    Game.state = "cinematic";
    Camera.jumpTo(13, 9, 1.0);
    Camera.tzoom = 0.52; Camera.tx = 13; Camera.ty = 5;
    cine.classList.remove("hidden");
    cine.innerHTML = `<div class="cine-fade"></div><div class="cine-lines"></div>`;
    const linesEl = cine.querySelector(".cine-lines");
    const seq = [...CONTENT.ending.finale];
    let i = 0;
    const step = () => {
      if (i < seq.length) {
        const d = document.createElement("div");
        d.className = "cine-line"; d.textContent = seq[i];
        linesEl.appendChild(d);
        void d.offsetWidth; d.classList.add("show");
        i++; setTimeout(step, 2400);
      } else {
        const d = document.createElement("div");
        d.className = "cine-end";
        d.innerHTML = `
          <button class="btn primary" onclick="UI.reenter()">↺ Explore again</button>
          <a class="btn" target="_blank" rel="noopener" href="${CONTENT.links.linkedin}">LinkedIn ↗</a>
          ${CONTENT.links.resume ? `<a class="btn" href="${CONTENT.links.resume}" download>Resume ⬇</a>` : ""}`;
        linesEl.appendChild(d);
        void d.offsetWidth; d.classList.add("show");
      }
    };
    setTimeout(step, 1400);
  },

  reenter() {
    UI.els.cine.classList.add("hidden");
    UI.els.cine.innerHTML = "";
    UI.els.hud.classList.remove("hidden");
    Game.state = "play";
    Game.loadFloor(0, null);
  },

  /* ---------- interactive timeline ---------- */
  esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; },
};

UI.timeline = function () {
  const rows = UI.timelineData.map((t, i) =>
    `<div class="tl-row" style="animation-delay:${i * 90}ms"><div class="tl-year">${t.year}</div><div class="tl-dot"></div>
     <div class="tl-body"><b>${t.title}</b><span>${t.sub}</span></div></div>`).join("");
  UI.openModal(`<button class="x" onclick="UI.closeModal()">✕</button><h2>🕰 The Timeline</h2><div class="tl">${rows}</div>`, "wide");
};
