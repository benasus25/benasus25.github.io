/* ============================================================
   SPARSH HQ — chat.js
   NOVA, the AI receptionist. Scripted brains, genuine charm.
   ============================================================ */

const ChatBot = {
  el: null, msgsEl: null, inputEl: null, chipsEl: null,
  welcomed: false, busy: false,

  init() {
    ChatBot.el = document.getElementById("chat");
    ChatBot.el.innerHTML = `
      <div class="chat-head">
        <div class="chat-avatar">◈</div>
        <div><b>${CONTENT.chat.botName}</b><span>${CONTENT.chat.botRole} · online</span></div>
        <button class="x" onclick="ChatBot.close()">✕</button>
      </div>
      <div class="chat-msgs" id="chat-msgs"></div>
      <div class="chat-chips" id="chat-chips"></div>
      <div class="chat-input">
        <input id="chat-in" placeholder="Ask NOVA anything…" maxlength="200" autocomplete="off">
        <button id="chat-send">➤</button>
      </div>`;
    ChatBot.msgsEl = document.getElementById("chat-msgs");
    ChatBot.inputEl = document.getElementById("chat-in");
    ChatBot.chipsEl = document.getElementById("chat-chips");
    document.getElementById("chat-send").onclick = () => ChatBot.submit();
    ChatBot.inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") ChatBot.submit();
      e.stopPropagation();
    });
  },

  open(focus) {
    ChatBot.el.classList.remove("hidden");
    if (!ChatBot.welcomed) ChatBot.firstWelcome();
    if (focus) setTimeout(() => ChatBot.inputEl.focus(), 60);
    AudioSys.sfx("open");
  },
  close() { if (ChatBot.el && !ChatBot.el.classList.contains("hidden")) { ChatBot.el.classList.add("hidden"); ChatBot.inputEl.blur(); } },
  toggle() { ChatBot.el.classList.contains("hidden") ? ChatBot.open(true) : ChatBot.close(); },

  firstWelcome() {
    if (ChatBot.welcomed) return;
    ChatBot.welcomed = true;
    ChatBot.el.classList.remove("hidden");
    let delay = 500;
    for (const line of CONTENT.chat.welcome) {
      setTimeout(() => ChatBot.botSay(line), delay);
      delay += 1300;
    }
    setTimeout(() => ChatBot.suggest(CONTENT.chat.suggestions), delay);
  },

  bubbleEl(cls, text) {
    const d = document.createElement("div");
    d.className = "msg " + cls;
    d.innerHTML = UI.esc(text).replace(/\*(.+?)\*/g, "<i>$1</i>");
    ChatBot.msgsEl.appendChild(d);
    ChatBot.msgsEl.scrollTop = ChatBot.msgsEl.scrollHeight;
    return d;
  },

  botSay(text) { ChatBot.bubbleEl("bot", text); AudioSys.sfx("pop"); },

  suggest(items) {
    ChatBot.chipsEl.innerHTML = "";
    for (const it of items) {
      const b = document.createElement("button");
      b.className = "chip-btn";
      b.textContent = it;
      b.onclick = () => { ChatBot.send(it); };
      ChatBot.chipsEl.appendChild(b);
    }
  },

  submit() {
    const v = ChatBot.inputEl.value.trim();
    if (!v) return;
    ChatBot.inputEl.value = "";
    ChatBot.send(v);
  },

  send(text) {
    if (ChatBot.busy) return;
    ChatBot.bubbleEl("user", text);
    ChatBot.chipsEl.innerHTML = "";
    ChatBot.busy = true;
    // typing indicator
    const typing = ChatBot.bubbleEl("bot typing", "");
    typing.innerHTML = `<span class="tdot"></span><span class="tdot"></span><span class="tdot"></span>`;
    setTimeout(() => {
      typing.remove();
      ChatBot.respond(text);
      ChatBot.busy = false;
    }, U.rand(600, 1300));
  },

  respond(text) {
    let intent = null;
    for (const it of CONTENT.chat.intents) {
      if (it.match.test(text)) { intent = it; break; }
    }
    if (!intent) {
      ChatBot.botSay(U.pick(CONTENT.chat.fallback));
      ChatBot.suggest(CONTENT.chat.suggestions.slice(0, 3));
      return;
    }
    const replies = Array.isArray(intent.reply) ? intent.reply : [intent.reply];
    let delay = 0;
    for (const r of replies) { setTimeout(() => ChatBot.botSay(r), delay); delay += 1100; }
    if (intent.action) setTimeout(() => ChatBot.act(intent.action), delay + 300);
  },

  act(a) {
    switch (a.type) {
      case "goto":
        if (Game.floorIndex !== a.floor) {
          setTimeout(() => { ChatBot.close(); Game.changeFloor(a.floor); }, 500);
        } else ChatBot.botSay("…you're already here, actually. Look around!");
        break;
      case "suggest": ChatBot.suggest(a.items); break;
      case "contact": setTimeout(() => { ChatBot.close(); UI.openGuestbook(false); }, 400); break;
      case "resume": {
        if (!CONTENT.links.resume) { ChatBot.botSay("The PDF isn't online yet — the guest book reaches me directly, or try LinkedIn."); break; }
        const link = document.createElement("a");
        link.href = CONTENT.links.resume; link.download = "Sparsh_Sinha_Resume.pdf";
        document.body.appendChild(link); link.click(); link.remove();
        break;
      }
      case "link": window.open(CONTENT.links[a.key], "_blank", "noopener"); break;
    }
  },
};
