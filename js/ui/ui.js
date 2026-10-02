/* ============================================================
   SPARSH HQ v2 — ui.js
   Deliberately minimal chrome. The building does the talking;
   the UI whispers. Includes NOVA (the concierge chat).
   ============================================================ */

const UI = {
  els: {}, sayTimer: null, promptShown: null,

  init() {
    // phones and tablets: a coarse pointer and no hover (a touchscreen laptop keeps the desktop controls)
    UI.touch = matchMedia("(pointer: coarse)").matches || (navigator.maxTouchPoints > 0 && !matchMedia("(pointer: fine)").matches);
    document.body.classList.toggle("touch", UI.touch);
    const root = document.getElementById("ui");
    root.innerHTML = `
      <div id="hud-floor" class="hidden"></div>
      <div id="hud-btns">
        <button id="b-chat" title="Ask NOVA (C)">💬</button>
        <button id="b-lift" title="Elevator (F)">🛗</button>
        <button id="b-mute" title="Sound (M)">🔊</button>
        <button id="b-help" title="Help (?)">?</button>
      </div>
      <div id="intro" class="hidden"><div id="intro-name"></div><div id="intro-theme"></div></div>
      <div id="nowplaying" class="hidden"></div>
      <div id="tryhint" class="hidden"></div>
      <div id="tutorial" class="hidden"></div>
      <div id="tip" class="hidden"></div>
      <div id="lb-top" class="lb"></div><div id="lb-bot" class="lb"></div>
      <div id="titlecard" class="hidden"><div id="tc-big"></div><div id="tc-small"></div></div>
      <div id="prompt" class="hidden"></div>
      <div id="subtitle" class="hidden"></div>
      <div id="panel" class="hidden"></div>
      <div id="bookview" class="hidden"></div>
      <div id="modal-wrap" class="hidden"><div id="modal"></div></div>
      <div id="lift-ov" class="hidden">
        <div class="lift-door l"></div><div class="lift-door r"></div>
        <div id="lift-disp"><span id="lift-f"></span><span id="lift-n"></span></div>
      </div>
      <div id="died" class="hidden"><div id="died-t">YOU DIED</div><div id="died-s"></div></div>
      <div id="caps" class="hidden"></div>
      <div id="cine" class="hidden"></div>
      <div id="chat" class="hidden"></div>
      <div id="joy" class="hidden"><i></i></div>
      <button id="act" class="hidden"><b>◆</b><span></span></button>
    `;
    for (const id of ["hud-floor", "intro", "intro-name", "intro-theme", "nowplaying", "tryhint", "tutorial", "tip", "lb-top", "lb-bot", "titlecard", "tc-big", "tc-small", "prompt", "subtitle", "panel", "bookview", "modal-wrap", "modal", "lift-ov", "lift-f", "lift-n", "died", "died-s", "caps", "cine", "chat"])
      UI.els[id] = document.getElementById(id);
    document.getElementById("b-lift").onclick = () => UI.openElevator();
    document.getElementById("b-chat").onclick = () => { if (Game.state === "play" && !document.body.classList.contains("cinema")) ChatBot.toggle(); };
    // on a touchscreen the nearest thing to use is one big button under your right thumb
    document.getElementById("act").onclick = () => { const it = Game.nearInteract; if (it && Game.state === "play") Game.useInteract(it); };
    // a phone keyboard shouldn't bury the chat box: track how much of the screen it takes
    if (window.visualViewport) {
      const kb = () => document.documentElement.style.setProperty("--kb", visualViewport.scale > 1.01 ? "0px" : Math.max(0, window.innerHeight - visualViewport.height - visualViewport.offsetTop) + "px");
      visualViewport.addEventListener("resize", kb); visualViewport.addEventListener("scroll", kb);
    }
    document.getElementById("b-mute").onclick = () => UI.muteToggle();
    document.getElementById("b-help").onclick = () => UI.help();
    ChatBot.init();

    // konami
    const K = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    let buf = [];
    window.addEventListener("keydown", (e) => {
      buf.push(e.key.length === 1 ? e.key.toLowerCase() : e.key);
      if (buf.length > K.length) buf.shift();
      if (K.every((k, i) => buf[i] === k)) { buf = []; Game.setRetro(!Game.retro); }
    });
  },

  isTyping() {
    const a = document.activeElement;
    return a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA");
  },

  closeAll() {
    UI.els.panel.classList.add("hidden");
    UI.els.bookview.classList.add("hidden");
    UI.els["modal-wrap"].classList.add("hidden");
    ChatBot.close();
  },

  tooltip(label, x, y) {
    const t = UI.els.tip;
    if (!label) { t.classList.add("hidden"); return; }
    t.textContent = label;
    t.style.left = x + 16 + "px"; t.style.top = y + 14 + "px";
    t.classList.remove("hidden");
  },

  letterbox(on) {
    document.body.classList.toggle("cinema", on);
  },

  title(big, small) {
    UI.els["tc-big"].textContent = big;
    UI.els["tc-small"].textContent = small;
    const el = UI.els.titlecard;
    el.classList.remove("hidden", "show");
    void el.offsetWidth; el.classList.add("show");
    setTimeout(() => el.classList.add("hidden"), 5200);
  },

  /* ---------- ambient text ---------- */
  prompt(label) {
    if (label === UI.promptShown) return;
    UI.promptShown = label;
    const p = UI.els.prompt;
    const act = document.getElementById("act");
    if (!label) { p.classList.add("hidden"); if (act) act.classList.add("hidden"); return; }
    p.innerHTML = `<span class="key">${UI.touch ? "TAP" : "E"}</span>${UI.esc(label)}`;
    p.classList.remove("hidden");
    if (act) { act.querySelector("span").textContent = label.split(" — ")[0]; act.classList.remove("hidden"); }
  },

  say(text, dur = 4200) {
    const s = UI.els.subtitle;
    s.textContent = text;
    s.classList.remove("hidden", "show");
    void s.offsetWidth; s.classList.add("show");
    clearTimeout(UI.sayTimer);
    UI.sayTimer = setTimeout(() => s.classList.add("hidden"), dur);
  },

  nova(text) { UI.say("NOVA — " + text, 5200); AudioSys.sfx("pop"); },

  floorIntro(idx, meta) {
    const el = UI.els.intro;
    UI.els["intro-name"].textContent = (idx === "P" ? "" : "F" + idx + " · ") + meta.name.toUpperCase();
    UI.els["intro-theme"].textContent = meta.theme;
    el.classList.remove("hidden", "show");
    void el.offsetWidth; el.classList.add("show");
    setTimeout(() => el.classList.add("hidden"), 3600);
    const np = UI.els.nowplaying;
    np.textContent = "♪ " + meta.track;
    np.classList.remove("hidden", "show");
    void np.offsetWidth; np.classList.add("show");
    setTimeout(() => np.classList.add("hidden"), 6000);
    UI.els["hud-floor"].textContent = idx === "P" ? "THE PLAZA" : "F" + idx + " · " + meta.name;
    UI.els["hud-floor"].classList.remove("hidden");
    // gentle "things to try here" hint, after the title settles
    const tryTxt = idx === "P" ? CONTENT.plazaTry : meta.try;
    clearTimeout(UI._tryT1); clearTimeout(UI._tryT2);
    UI.els.tryhint.classList.add("hidden");
    if (tryTxt) {
      UI._tryT1 = setTimeout(() => {
        UI.els.tryhint.innerHTML = `<b>things to try</b> ${UI.esc(tryTxt)}`;
        UI.els.tryhint.classList.remove("hidden");
        UI._tryT2 = setTimeout(() => UI.els.tryhint.classList.add("hidden"), 11000);
      }, 4500);
    }
  },

  muteToggle() {
    const m = AudioSys.toggleMute();
    document.getElementById("b-mute").textContent = m ? "🔇" : "🔊";
  },

  help() {
    if (UI.touch) {
      UI.openModal(`
      <button class="x" onclick="UI.closeModal()">✕</button>
      <h2>Visiting Sparsh HQ</h2>
      <div class="help-grid">
        <div><span class="key">tap</span></div><div>walk there · tap a ◆ or the object itself to open its story</div>
        <div><span class="key">left thumb</span></div><div>drag anywhere on the left to walk</div>
        <div><span class="key">right thumb</span></div><div>drag to look around · <b>pinch</b> to zoom</div>
        <div><span class="key">◆ button</span></div><div>bottom-right: use whatever's nearby</div>
        <div><span class="key">Résumé</span></div><div>the one-page version — everything, fast</div>
        <div><span class="key">🛗</span></div><div>elevator — five floors</div>
        <div><span class="key">💬</span></div><div>NOVA, the concierge — ask anything</div>
        <div><span class="key">F1 tag</span></div><div>top-left: this floor's checklist</div>
      </div>
      <p class="muted">Turn your phone sideways for a wider view.</p>`);
      return;
    }
    UI.openModal(`
      <button class="x" onclick="UI.closeModal()">✕</button>
      <h2>Visiting Sparsh HQ</h2>
      <div class="help-grid">
        <div><span class="key">click</span></div><div>walk there · click a ◆ or the object itself to open its story</div>
        <div><span class="key">WASD</span></div><div>walk · <b>Shift</b> to hurry · <b>Q</b> / <b>←→</b> turn</div>
        <div><span class="key">drag</span></div><div>look around · <b>scroll</b> to zoom · <b>V</b> close-up</div>
        <div><span class="key">E</span></div><div>use whatever's nearby</div>
        <div><span class="key">R</span></div><div>the one-page résumé — everything, fast</div>
        <div><span class="key">Tab</span></div><div>show / hide this floor's checklist</div>
        <div><span class="key">F</span></div><div>elevator — five floors</div>
        <div><span class="key">C</span></div><div>NOVA, the concierge (or 💬, top-right)</div>
        <div><span class="key">M</span></div><div>sound</div>
      </div>
      <p class="muted">The building rewards curiosity. Rumour has it an old cheat code still works.</p>`);
  },

  /* ---------- diegetic panels ---------- */
  panel(lab) {
    const col = lab.accent !== undefined ? "#" + new THREE.Color(lab.accent).getHexString() : "#57d8ff";
    const el = UI.els.panel;
    el.innerHTML = `
      <button class="x" onclick="UI.els.panel.classList.add('hidden');AudioSys.sfx('close');Game.release()">✕</button>
      <div class="p-kicker" style="color:${col}">◈ ${lab.lines ? UI.esc(lab.lines[0] || "") : ""}</div>
      <h2>${UI.esc(lab.name)}</h2>
      ${(lab.lines || []).slice(1).map((l) => `<div class="p-line">· ${UI.esc(l)}</div>`).join("")}
      <p>${UI.esc(lab.body || "")}</p>
      ${lab.linkKey ? `<a class="btn" target="_blank" rel="noopener" href="${CONTENT.links[lab.linkKey]}">View on GitHub ↗</a>` : ""}
    `;
    el.style.borderColor = col + "44";
    el.classList.remove("hidden");
  },

  openBook(book) {
    AudioSys.sfx("page");
    const stars = book.rating ? "★".repeat(book.rating) + "☆".repeat(5 - book.rating) : "";
    const el = UI.els.bookview;
    el.innerHTML = `
      <div class="book">
        <button class="x" onclick="UI.els.bookview.classList.add('hidden');AudioSys.sfx('close')">✕</button>
        <div class="page left">
          <div class="b-cat">${UI.esc(book.cat || book.sub || "")}</div>
          <h2>${UI.esc(book.title)}</h2>
          <div class="b-author">${UI.esc(book.author || "")}</div>
          ${stars ? `<div class="b-stars">${stars}</div>` : ""}
          <div class="b-quote">“${UI.esc(book.quote || "")}”</div>
        </div>
        <div class="page right">
          <div class="b-why-h">${book.isRepo ? "What it is" : "Why this book"}</div>
          <p>${UI.esc(book.why || book.body || "")}</p>
          ${book.isRepo ? `<a class="btn" target="_blank" rel="noopener" href="${CONTENT.links.github}">Open GitHub ↗</a>` : ""}
          ${book.egg ? `<div class="b-egg">✦ ${UI.esc(book.egg)}</div>` : ""}
        </div>
      </div>`;
    el.classList.remove("hidden");
    if (book.egg) { AudioSys.sfx("secret"); Game.sparkle(Game.player.x, 1.8, Game.player.z, 0xffd166, 10); }
  },

  caseFile(cs) {
    UI.openModal(`
      <button class="x" onclick="UI.closeModal()">✕</button>
      <div class="case">
        <div class="c-no">${UI.esc(cs.no)}</div>
        <h2>${UI.esc(cs.title)} <span>· ${UI.esc(cs.role)}</span></h2>
        <div class="c-dates">${UI.esc(cs.dates)}</div>
        <p>${UI.esc(cs.body)}</p>
        <div class="c-ev">${cs.evidence.map((e) => `<span>${UI.esc(e)}</span>`).join("")}</div>
        <div class="c-stamp">${UI.esc(cs.status)}</div>
      </div>`, "case-modal");
  },

  story(label, story) {
    UI.openModal(`<button class="x" onclick="UI.closeModal()">✕</button><h2>${UI.esc(label || "")}</h2><p>${UI.esc(story)}</p>`);
  },

  /* ---------- modal ---------- */
  openModal(html, cls = "") {
    UI.els.modal.className = cls;
    UI.els.modal.innerHTML = html;
    UI.els["modal-wrap"].classList.remove("hidden");
    AudioSys.sfx("open");
  },
  closeModal() { UI.els["modal-wrap"].classList.add("hidden"); AudioSys.sfx("close"); },

  /* ---------- elevator ---------- */
  openElevator() {
    let rows = "";
    for (let i = CONTENT.floors.length - 1; i >= 0; i--) {
      const f = CONTENT.floors[i];
      rows += `<div class="lift-row ${Game.floorIndex === i ? "cur" : ""}" onclick="UI.closeModal();Game.changeFloor(${i})">
        <b>F${i}</b><span>${f.name}</span><i>${f.theme}</i></div>`;
    }
    rows += `<div class="lift-row ${Game.floorIndex === "P" ? "cur" : ""}" onclick="UI.closeModal();Game.changeFloor('P')"><b>G</b><span>The Plaza</span><i>street level · rain</i></div>`;
    UI.openModal(`<button class="x" onclick="UI.closeModal()">✕</button><h2>Sparsh HQ</h2><div class="lift-list">${rows}</div>`);
  },

  elevatorRide(idx, cb) {
    const ov = UI.els["lift-ov"];
    ov.classList.remove("hidden");
    AudioSys.sfx("doors");
    ov.classList.add("closing");
    setTimeout(() => {
      const meta = idx === "P" ? { name: "The Plaza" } : CONTENT.floors[idx];
      UI.els["lift-f"].textContent = idx === "P" ? "G" : "F" + idx;
      UI.els["lift-n"].textContent = meta.name;
      cb();
      AudioSys.sfx("chime");
      setTimeout(() => {
        ov.classList.remove("closing");
        AudioSys.sfx("doors");
        setTimeout(() => ov.classList.add("hidden"), 750);
      }, 950);
    }, 800);
  },

  /* ---------- guest book & endings ---------- */
  getGuestbook() { try { return JSON.parse(localStorage.getItem("sparshhq_gb") || "[]"); } catch (e) { return []; } },

  openGuestbook(exitMode) {
    const entries = UI.getGuestbook();
    const list = entries.length
      ? entries.slice(-3).reverse().map((g) => `<div class="gb-e"><b>${UI.esc(g.name)}</b>${g.company ? " · " + UI.esc(g.company) : ""}<p>${UI.esc(g.msg || "")}</p></div>`).join("")
      : "";
    UI.openModal(`
      <button class="x" onclick="UI.closeModal();${exitMode ? "UI.outro()" : ""}">✕</button>
      <h2>${exitMode ? "Before you head out…" : "The Guest Book"}</h2>
      <p class="muted">${exitMode ? "Every great collaboration begins with a conversation. I'd genuinely love to know who visited." : "Leave a note — it stays at the front desk."}</p>
      <div class="gb-form">
        <input id="g-name" placeholder="Name" maxlength="60">
        <input id="g-email" placeholder="Email" maxlength="80">
        <input id="g-company" placeholder="Company (optional)" maxlength="60">
        <textarea id="g-msg" rows="3" placeholder="Message" maxlength="400"></textarea>
      </div>
      <div class="gb-row">
        <button class="btn primary" onclick="UI.signGuestbook(${!!exitMode},'build')">Let's Build Together</button>
        <button class="btn" onclick="UI.signGuestbook(${!!exitMode},'hire')">Hire Me</button>
        <button class="btn" onclick="UI.signGuestbook(${!!exitMode},'coffee')">Schedule Coffee ☕</button>
      </div>
      <div class="gb-row links">
        <a class="btn sm" target="_blank" rel="noopener" href="${CONTENT.links.linkedin}">LinkedIn ↗</a>
        <a class="btn sm" target="_blank" rel="noopener" href="${CONTENT.links.github}">GitHub ↗</a>
        ${CONTENT.links.resume ? `<a class="btn sm" href="${CONTENT.links.resume}" download>Resume ⬇</a>` : ""}
        ${exitMode ? `<button class="btn sm ghost" onclick="UI.closeModal();UI.outro()">Just leaving quietly →</button>` : ""}
      </div>
      ${list ? `<div class="gb-list">${list}</div>` : ""}`);
  },

  signGuestbook(exitMode, intent) {
    const v = (id) => document.getElementById(id).value.trim();
    const name = v("g-name"), email = v("g-email"), company = v("g-company"), msg = v("g-msg");
    if (!name && !email && !msg) { UI.say("Even just a name would make NOVA's day."); return; }
    const entries = UI.getGuestbook();
    entries.push({ name: name || "Anonymous traveler", email, company, msg, d: new Date().toISOString().slice(0, 10) });
    try { localStorage.setItem("sparshhq_gb", JSON.stringify(entries.slice(-100))); } catch (e) {}
    AudioSys.sfx("confetti");
    Game.sparkle(Game.player.x, 1.8, Game.player.z, 0xffd166, 24);
    const subj = { build: "Let's build together", hire: "Opportunity for Sparsh", coffee: "Coffee chat?" }[intent] || "Hello from Sparsh HQ";
    // deliver to Sparsh's inbox (FormSubmit relay — no backend needed);
    // falls back to the visitor's email app if the relay is unreachable
    fetch("https://formsubmit.co/ajax/" + CONTENT.profile.email, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name: name || "Anonymous traveler", email, company, message: msg, intent: subj,
        _subject: "Sparsh HQ guest book — " + (name || "a visitor"), _template: "table", _captcha: "false",
      }),
    }).then((r) => { if (!r.ok) throw new Error("relay"); return r.json(); })
      .then(() => UI.say("✒ Signed — and delivered to Sparsh's inbox. " + CONTENT.ending.thanks, 5600))
      .catch(() => {
        const body = encodeURIComponent(`Hi Sparsh,\n\n${msg || "I just walked through your HQ."}\n\n— ${name}${company ? " (" + company + ")" : ""}${email ? "\n" + email : ""}`);
        window.open(`mailto:${CONTENT.profile.email}?subject=${encodeURIComponent(subj)}&body=${body}`, "_blank");
        UI.say("✒ Signed — opening your email app to deliver it.", 5000);
      });
    UI.closeModal();
    if (exitMode) UI.outro();
  },

  exitAttempt() {
    if (Game.state !== "play") return;
    Game.state = "cinematic-hold";
    UI.closeAll();
    const caps = UI.els.caps;
    caps.classList.remove("hidden");
    const lines = CONTENT.ending.stop;
    let i = 0;
    const next = () => {
      if (i < lines.length) {
        caps.innerHTML = `<div class="cap">${UI.esc(lines[i])}</div>`;
        AudioSys.sfx("pop");
        i++; setTimeout(next, 1900);
      } else {
        caps.classList.add("hidden");
        Game.state = "play";
        Game.player.z -= 1.6;
        UI.openGuestbook(true);
      }
    };
    next();
  },

  outro() {
    UI.closeAll();
    Game.state = "cinematic";
    Game.loadFloor("P", { spawn: { x: 0, z: 9.2, ry: 0 } });
    Game.state = "cinematic";
    Game.outroShot();
    if (typeof Analytics !== "undefined") Analytics.event("outro_reached", {});
    const cine = UI.els.cine;
    cine.classList.remove("hidden");
    cine.innerHTML = `<div class="cine-fade"></div><div class="cine-lines"></div>`;
    const lines = cine.querySelector(".cine-lines");
    let i = 0;
    const seq = CONTENT.ending.finale;
    const step = () => {
      if (i < seq.length) {
        const d = document.createElement("div");
        d.className = "cine-line"; d.textContent = seq[i];
        lines.appendChild(d);
        void d.offsetWidth; d.classList.add("show");
        i++; setTimeout(step, 2500);
      } else {
        const d = document.createElement("div");
        d.className = "cine-end show";
        d.innerHTML = `
          <button class="btn primary" onclick="UI.reenter()">↺ Walk in again</button>
          <a class="btn" target="_blank" rel="noopener" href="${CONTENT.links.linkedin}">LinkedIn ↗</a>
          ${CONTENT.links.resume ? `<a class="btn" href="${CONTENT.links.resume}" download>Resume ⬇</a>` : ""}`;
        lines.appendChild(d);
      }
    };
    setTimeout(step, 1600);
  },

  reenter() {
    UI.els.cine.classList.add("hidden");
    UI.els.cine.innerHTML = "";
    gsap.killTweensOf(Game.rig.pos); gsap.killTweensOf(Game.rig.look);
    UI.letterbox(false);
    Game.cam.mode = "follow";
    Game.state = "play";
    Game.loadFloor(0, { spawn: { x: 0, z: 6.9, ry: Math.PI }, yawOffset: 0 });
  },

  youDied() {
    if (Game.state === "dead") return;
    Game.state = "dead";
    AudioSys.sfx("died");
    const el = UI.els.died;
    UI.els["died-s"].textContent = "You touched the production database.";
    el.classList.remove("hidden");
    void el.offsetWidth; el.classList.add("show");
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => { el.classList.add("hidden"); Game.state = "play"; UI.say("Respawned. The database remains untouched. Mostly."); }, 900);
    }, 3200);
  },

  esc(s) { const d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; },
};

/* ============================================================
   NOVA — concierge chat (scripted brains, genuine charm)
   ============================================================ */
const ChatBot = {
  el: null, msgs: null, input: null, chips: null, welcomed: false, busy: false,

  init() {
    ChatBot.el = document.getElementById("chat");
    ChatBot.el.innerHTML = `
      <div class="chat-head"><div class="chat-av">◈</div><div><b>NOVA</b><span>concierge · front desk</span></div>
        <button class="x" onclick="ChatBot.close()">✕</button></div>
      <div class="chat-msgs" id="ch-m"></div>
      <div class="chat-chips" id="ch-c"></div>
      <div class="chat-in"><input id="ch-i" placeholder="Ask NOVA anything…" maxlength="200" autocomplete="off"><button id="ch-s">➤</button></div>`;
    ChatBot.msgs = document.getElementById("ch-m");
    ChatBot.input = document.getElementById("ch-i");
    ChatBot.chips = document.getElementById("ch-c");
    document.getElementById("ch-s").onclick = () => ChatBot.submit();
    ChatBot.input.addEventListener("keydown", (e) => { if (e.key === "Enter") ChatBot.submit(); e.stopPropagation(); });
  },

  open(focus) {
    ChatBot.el.classList.remove("hidden");
    if (!ChatBot.welcomed) ChatBot.firstWelcome();
    if (focus) setTimeout(() => ChatBot.input.focus(), 60);
    AudioSys.sfx("open");
  },
  close() { if (ChatBot.el) { ChatBot.el.classList.add("hidden"); if (ChatBot.input) ChatBot.input.blur(); } },
  toggle() { ChatBot.el.classList.contains("hidden") ? ChatBot.open(true) : ChatBot.close(); },

  firstWelcome() {
    if (ChatBot.welcomed) return;
    ChatBot.welcomed = true;
    ChatBot.el.classList.remove("hidden");
    let d = 400;
    for (const line of CONTENT.chat.welcome) { setTimeout(() => ChatBot.bot(line), d); d += 1300; }
    setTimeout(() => ChatBot.suggest(CONTENT.chat.suggestions), d);
  },

  bubble(cls, text) {
    const el = document.createElement("div");
    el.className = "msg " + cls;
    el.textContent = text;
    ChatBot.msgs.appendChild(el);
    ChatBot.msgs.scrollTop = ChatBot.msgs.scrollHeight;
    return el;
  },
  bot(t) { ChatBot.bubble("bot", t); AudioSys.sfx("pop"); },

  suggest(items) {
    ChatBot.chips.innerHTML = "";
    for (const it of items) {
      const b = document.createElement("button");
      b.textContent = it;
      b.onclick = () => ChatBot.send(it);
      ChatBot.chips.appendChild(b);
    }
  },

  submit() {
    const v = ChatBot.input.value.trim();
    if (!v) return;
    ChatBot.input.value = "";
    ChatBot.send(v);
  },

  send(text) {
    if (ChatBot.busy) return;
    ChatBot.bubble("user", text);
    ChatBot.chips.innerHTML = "";
    ChatBot.busy = true;
    const typing = ChatBot.bubble("bot typing", "…");
    setTimeout(() => {
      typing.remove();
      ChatBot.respond(text);
      ChatBot.busy = false;
    }, 600 + Math.random() * 700);
  },

  respond(text) {
    let intent = null;
    for (const it of CONTENT.chat.intents) if (it.match.test(text)) { intent = it; break; }
    if (typeof Analytics !== "undefined") Analytics.event("chat_query", { intent: intent ? intent.id || "matched" : "fallback" });
    if (!intent) {
      ChatBot.bot(U.pick(CONTENT.chat.fallback));
      ChatBot.suggest(CONTENT.chat.suggestions.slice(0, 3));
      return;
    }
    let d = 0;
    for (const r of intent.reply) { setTimeout(() => ChatBot.bot(r), d); d += 1100; }
    if (intent.floor !== null && intent.floor !== undefined) {
      setTimeout(() => { ChatBot.close(); Game.changeFloor(intent.floor); }, d + 400);
    } else if (intent.action === "contact") {
      setTimeout(() => { ChatBot.close(); UI.openGuestbook(false); }, d + 400);
    } else if (intent.action === "dossier") {
      setTimeout(() => { ChatBot.close(); UI.dossier("nova"); }, d + 400);
    }
  },
};

/* ============================================================
   Tutorial — slow, gentle onboarding. One step at a time,
   each advancing only when the visitor actually does it.
   ============================================================ */
const Tutorial = {
  idx: 0, active: false, moveAcc: 0, lookAcc: 0,

  start() {
    try { if (localStorage.getItem("shq_tut_done")) return; } catch (e) {}
    Tutorial.active = true;
    setTimeout(() => Tutorial.show(), 2000);
  },

  show() {
    if (!Tutorial.active) return;
    const st = CONTENT.tutorial[Tutorial.idx];
    if (!st) { Tutorial.finish(); return; }
    const el = UI.els.tutorial;
    el.innerHTML = `<span class="tut-dot"></span><span>${UI.esc(UI.touch && st.touch ? st.touch : st.text)}</span>`;
    el.classList.remove("hidden", "done");
    if (st.id === "free") setTimeout(() => Tutorial.advance(), 8000);
  },

  notify(evt) {
    if (!Tutorial.active) return;
    const st = CONTENT.tutorial[Tutorial.idx];
    if (st && st.id === evt) Tutorial.advance();
  },

  advance() {
    if (!Tutorial.active) return;
    UI.els.tutorial.classList.add("done");
    AudioSys.sfx("blip");
    Tutorial.idx++;
    if (Tutorial.idx >= CONTENT.tutorial.length) { Tutorial.finish(); return; }
    setTimeout(() => Tutorial.show(), 1600);
  },

  finish() {
    Tutorial.active = false;
    try { localStorage.setItem("shq_tut_done", "1"); } catch (e) {}
    setTimeout(() => UI.els.tutorial.classList.add("hidden"), 1400);
  },
};
