/* ============================================================
   SPARSH HQ v3 — cards.js
   The information layer. Every exhibit in the building opens a
   compact case-study card; every floor has a checklist of what's
   on it; and one click gives a recruiter the whole building as a
   single page (UI.dossier). The 3D world is the hook — this is
   where the substance lives.
   ============================================================ */

const Cards = {
  seen: new Set(), ctx: null, dirOpen: true,

  init() {
    try { Cards.seen = new Set(JSON.parse(localStorage.getItem("shq_seen") || "[]")); } catch (e) {}
    let stored = null;
    try { stored = localStorage.getItem("shq_dir"); } catch (e) {}
    // collapsed by default — the walk-up captions do the talking; the list is there when you want it
    Cards.dirOpen = stored === "1" && !matchMedia("(max-width: 720px)").matches;
    const root = document.getElementById("ui");
    const dir = document.createElement("div");
    dir.id = "dir"; dir.className = "hidden";
    root.appendChild(dir);
    const cap = document.createElement("div");
    cap.id = "caption";
    root.appendChild(cap);
    const dos = document.createElement("div");
    dos.id = "dossier"; dos.className = "hidden";
    document.body.appendChild(dos);          // outside #ui so it can also sit above the splash
    // the most important button in the building
    const btns = document.getElementById("hud-btns");
    const b = document.createElement("button");
    b.id = "b-dossier"; b.className = "wide"; b.title = "Everything on one page (R)";
    b.innerHTML = `<span>📄</span> Résumé`;
    b.onclick = () => UI.dossier("hud");
    btns.insertBefore(b, btns.firstChild);
    window.addEventListener("keydown", (e) => {
      if (UI.isTyping() || e.ctrlKey || e.metaKey || e.altKey) return;
      const dos = document.getElementById("dossier");
      if (e.key === "Escape" && !dos.classList.contains("hidden")) { Cards.closeDossier(); e.stopPropagation(); return; }
      if (e.repeat) return;
      if (e.key === "r" || e.key === "R") {
        if (Game.state === "play") UI.dossier("key");
        else if (document.getElementById("splash") && dos.classList.contains("hidden")) { dos.classList.add("over-splash"); UI.dossier("splash_key"); }
      }
      const modal = !document.getElementById("modal-wrap").classList.contains("hidden");
      if (e.key === "Tab" && Game.state === "play" && typeof Game.floorIndex === "number" && !modal && dos.classList.contains("hidden")) { e.preventDefault(); Cards.toggleDir(); }
    }, true);
    // session-replay tools (if enabled) must never record what visitors type
    for (const id of ["chat", "modal-wrap"]) { const el = document.getElementById(id); if (el) el.setAttribute("data-clarity-mask", "true"); }
  },

  first: (t) => (String(t).match(/^[^.!?]*[.!?]/) || [String(t)])[0],
  groupName: { case: "Career", lab: "Systems I built", skill: "The stack", project: "Project rooms", trophy: "Achievements", year: "Year by year", role: "Leadership" },

  /* ---------------- tiny formatting helpers ---------------- */
  esc: (s) => String(s === undefined || s === null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])),
  md: (s) => Cards.esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"),
  hex: (n) => "#" + (n === undefined ? 0xd8a54a : n).toString(16).padStart(6, "0"),
  metrics: (ms) => ms && ms.length ? `<div class="c-metrics n${Math.min(ms.length, 4)}">${ms.map((m) => `<div class="c-m"><b>${Cards.esc(m.v)}</b><span>${Cards.esc(m.l)}</span></div>`).join("")}</div>` : "",
  flow: (nodes) => nodes && nodes.length ? `<div class="c-flow">${nodes.map((n, i) => `${i ? "<i>→</i>" : ""}<span>${Cards.esc(n)}</span>`).join("")}</div>` : "",
  chips: (arr, cls = "") => arr && arr.length ? `<div class="c-chips ${cls}">${arr.map((c) => `<span>${Cards.esc(c)}</span>`).join("")}</div>` : "",
  list: (arr) => arr && arr.length ? `<ul class="c-list">${arr.map((x) => `<li>${Cards.md(x)}</li>`).join("")}</ul>` : "",
  sec: (h, body) => body ? `<section class="c-sec"><h4>${h}</h4>${body}</section>` : "",
  links: (ls) => ls && ls.length ? `<div class="c-links">${ls.map((l) => `<a class="btn" target="_blank" rel="noopener" href="${Cards.esc(l.url)}">${Cards.esc(l.label)} ↗</a>`).join("")}</div>` : "",

  /* ---------------- what is this object? ---------------- */
  kindOf(o) {
    if (!o) return null;
    if (o.kind) return o.kind;
    const C = CONTENT;
    if (C.labs.includes(o)) return "lab";
    if (C.projects.includes(o)) return "project";
    if (C.repos.includes(o)) return "repo";
    if (C.cases.includes(o)) return "case";
    if (C.skills.includes(o)) return "skill";
    if (C.education.trophies.includes(o)) return "trophy";
    if (o === C.education.dtu) return "edu";
    if (C.education.years.includes(o)) return "year";
    if (C.education.dtu.roles.includes(o)) return "role";
    if (o === C.education.schoolInfo) return "school";
    if (o === C.oss) return "oss";
    if (o === C.core) return "core";
    if (o === C.exec) return "exec";
    if (C.books.includes(o)) return "book";
    return "legacy";
  },
  idOf(kind, o) { return kind + ":" + (o.id || o.name || o.title || kind); },
  floorOf(kind) { return { lab: 1, case: 1, skill: 1, matrix: 1, edu: 2, year: 2, role: 2, school: 2, trophy: 2, timeline: 2, book: 2, reading: 2, core: 3, project: 3, repo: 3, repoIndex: 3, oss: 3, exec: 4 }[kind]; },

  /* ---------------- per-floor directory ---------------- */
  dir(idx) {
    const C = CONTENT, d = [];
    const add = (kind, obj, title, sub) => d.push({ kind, obj, title, sub });
    if (idx === 0) {
      add("action", { id: "dossier", run: () => UI.dossier("directory") }, "One-page résumé", "the whole building, fast");
      add("action", { id: "nova", run: () => { ChatBot.open(true); ChatBot.firstWelcome(); } }, "Ask NOVA", "the AI concierge");
      add("action", { id: "guestbook", run: () => UI.openGuestbook(false) }, "Guest book", "a note straight to Sparsh");
      add("action", { id: "lift", run: () => UI.openElevator() }, "Building directory", "5 floors · pick one");
    } else if (idx === 1) {
      ["sprinklr", "pocketpills", "xtreme"].forEach((id) => { const c = C.cases.find((x) => x.id === id); add("case", c, c.title.replace(/\b\w+/g, (w) => w[0] + w.slice(1).toLowerCase()), `${c.role} · ${c.dates}`); });
      C.labs.forEach((l) => add("lab", l, l.name, l.tagline.split(/[—.]/)[0]));
      C.skills.forEach((s) => add("skill", s, s.name.replace(/\b\w+/g, (w) => w[0] + w.slice(1).toLowerCase()), s.level));
      add("matrix", { kind: "matrix", id: "matrix" }, "Full stack matrix", "everything, grouped");
    } else if (idx === 2) {
      add("edu", C.education.dtu, "DTU · B.Tech CoE", "2019 – 2023 · 8.83 CGPA");
      add("school", C.education.schoolInfo, "Abhinav Public School", "CBSE XII · 90.4%");
      C.education.years.forEach((y) => add("year", y, `${y.year} · ${y.label}`, y.points[0].replace(/\*\*/g, "")));
      ["leetcode", "codekaze", "hackcw", "ic2"].forEach((id) => { const t = C.education.trophies.find((q) => q.id === id); add("trophy", t, t.big, t.small); });
      C.education.dtu.roles.forEach((r) => add("role", r, r.name.split(" · ")[1], r.name.split(" · ")[0]));
      add("reading", { kind: "reading", id: "all" }, "The reading list", `${C.books.length} books, one line each`);
    } else if (idx === 3) {
      add("core", C.core, "The Core", "what powers this floor");
      C.projects.forEach((p) => add("project", p, p.name, p.org));
      add("repoIndex", { kind: "repoIndex", id: "library" }, "The repo library", `${C.repos.length} real repositories`);
      add("oss", C.oss, C.oss.name, "merged PRs · team builds");
    } else if (idx === 4) add("exec", C.exec, "What's next", "now · goals · get in touch");
    return d;
  },

  onFloor(idx) {
    const el = document.getElementById("dir");
    if (!el) return;
    if (idx === "P" || idx === undefined) { el.classList.add("hidden"); document.body.classList.remove("has-dir"); return; }
    Cards.renderDir(idx);
    el.classList.remove("hidden");
    document.body.classList.add("has-dir");
  },
  renderDir(idx) {
    const el = document.getElementById("dir");
    const items = Cards.dir(idx);
    const seenN = items.filter((it) => it.kind !== "action" && Cards.seen.has(Cards.idOf(it.kind, it.obj))).length;
    const total = items.filter((it) => it.kind !== "action").length;
    const meta = CONTENT.floors[idx];
    el.className = Cards.dirOpen ? "" : "closed";
    el.innerHTML = `
      <button class="dir-h" onclick="Cards.toggleDir()">
        <span class="dir-f">F${idx}</span><span class="dir-n">${Cards.esc(meta.what || meta.name)}</span>
        ${total ? `<span class="dir-c">${seenN}/${total}</span>` : ""}<i>${Cards.dirOpen ? "▾" : "▸"}</i>
      </button>
      <div class="dir-list">${items.map((it, i) => {
        const s = it.kind !== "action" && Cards.seen.has(Cards.idOf(it.kind, it.obj));
        const head = it.kind !== (items[i - 1] || {}).kind && Cards.groupName[it.kind] && items.length > 8 ? `<div class="dir-g">${Cards.groupName[it.kind]}</div>` : "";
        return `${head}<button class="dir-i ${s ? "seen" : ""} ${it.kind === "action" ? "act" : ""} ${items.length > 8 ? "tight" : ""}" onclick="Cards.fromDir(${i})" title="${Cards.esc(it.sub || "")}"><span class="d"></span><span class="t">${Cards.esc(it.title)}</span>${items.length > 8 ? "" : `<span class="s">${Cards.esc(it.sub || "")}</span>`}</button>`;
      }).join("")}</div>
      <div class="dir-foot"><kbd>Tab</kbd> hide · <kbd>R</kbd> résumé</div>`;
  },
  toggleDir() {
    Cards.dirOpen = !Cards.dirOpen;
    try { localStorage.setItem("shq_dir", Cards.dirOpen ? "1" : "0"); } catch (e) {}
    if (typeof Game.floorIndex === "number") Cards.renderDir(Game.floorIndex);
  },
  fromDir(i) {
    const items = Cards.dir(Game.floorIndex), it = items[i];
    if (!it) return;
    if (it.kind === "action") { AudioSys.sfx("blip"); it.obj.run(); return; }
    const list = items.filter((x) => x.kind !== "action");
    Cards.open(it.kind, it.obj, { source: "directory", list, i: list.indexOf(it) });
  },

  markSeen(kind, obj) {
    const id = Cards.idOf(kind, obj);
    if (!Cards.seen.has(id)) {
      Cards.seen.add(id);
      try { localStorage.setItem("shq_seen", JSON.stringify([...Cards.seen])); } catch (e) {}
      Analytics.explored(Cards.seenCount(), Cards.totalExhibits());
    }
    if (typeof Game.floorIndex === "number") Cards.renderDir(Game.floorIndex);
  },
  /* everything a visitor can "collect": directory exhibits + every repo + every book */
  universe() {
    if (Cards._u) return Cards._u;
    const u = new Set();
    for (let f = 1; f < CONTENT.floors.length; f++) for (const it of Cards.dir(f)) if (it.kind !== "action") u.add(Cards.idOf(it.kind, it.obj));
    for (const r of CONTENT.repos) u.add(Cards.idOf("repo", r));
    for (const b of CONTENT.books) u.add(Cards.idOf("book", b));
    return (Cards._u = u);
  },
  totalExhibits() { return Cards.universe().size; },
  seenCount() { const u = Cards.universe(); let n = 0; for (const id of Cards.seen) if (u.has(id)) n++; return n; },

  /* ---------------- open a card ---------------- */
  openObj(obj, source) {
    const kind = Cards.kindOf(obj);
    if (kind === "book") return UI.openBook(obj);
    let list = null, i = -1;
    if (typeof Game.floorIndex === "number") {
      const items = Cards.dir(Game.floorIndex).filter((x) => x.kind !== "action");
      i = items.findIndex((x) => x.obj === obj);
      if (i >= 0) list = items;
    }
    Cards.open(kind, obj, { source: source || "world", list, i });
  },

  open(kind, obj, ctx = {}) {
    Cards.ctx = Object.assign({}, ctx, { kind, obj });
    const el = UI.els.panel;
    const html = Cards.render(kind, obj);
    const acc = Cards.hex(obj.accent);
    const nav = ctx.list && ctx.list.length > 1 ? `
      <div class="c-nav">
        <button class="btn sm ghost" onclick="Cards.step(-1)">← prev</button>
        <span>${ctx.i + 1} / ${ctx.list.length}</span>
        <button class="btn sm ghost" onclick="Cards.step(1)">next →</button>
      </div>` : "";
    const walk = ctx.source !== "world" && Cards.findHot(obj) ? `<button class="btn sm" onclick="Cards.walk()">⇢ Walk me there</button>` : "";
    const elsewhere = (ctx.source === "resume_page" && Cards.floorOf(kind) !== undefined && Cards.floorOf(kind) !== Game.floorIndex) ? `<button class="btn sm" onclick="Cards.visit(${Cards.floorOf(kind)})">🛗 Visit floor ${Cards.floorOf(kind)}</button>` : "";
    el.className = "card k-" + kind;
    el.style.setProperty("--acc", acc);
    el.innerHTML = `<button class="x" onclick="Cards.close()" aria-label="Close">✕</button>${html}
      ${(walk || elsewhere) ? `<div class="c-act">${walk}${elsewhere}</div>` : ""}${nav}`;
    el.scrollTop = 0;
    el.classList.remove("hidden");
    if (kind !== "legacy") Cards.markSeen(kind, obj);
    Analytics.event("content_open", { content_type: kind, item_id: obj.id || obj.name || obj.title || kind, item_name: obj.name || obj.title || obj.big || kind, source: ctx.source || "world", floor_id: String(Game.floorIndex) });
  },
  step(d) {
    const c = Cards.ctx; if (!c || !c.list) return;
    const i = (c.i + d + c.list.length) % c.list.length, it = c.list[i];
    AudioSys.sfx("blip");
    Cards.open(it.kind, it.obj, Object.assign({}, c, { i }));
  },
  close() {
    UI.els.panel.classList.add("hidden");
    AudioSys.sfx("close");
    Game.release();
  },
  findHot(obj) { return Game.F && Game.F.interact.find((it) => it.ref === obj); },
  walk() {
    const it = Cards.findHot(Cards.ctx.obj);
    if (!it) return;
    UI.els.panel.classList.add("hidden");
    const p = Game.player, ang = Math.atan2(p.x - it.x, p.z - it.z), k = Math.min(1.1, it.r * 0.6);
    Game.walkTo(it.x + Math.sin(ang) * k, it.z + Math.cos(ang) * k, it);
  },
  visit(f) {
    Cards.closeDossier(); UI.els.panel.classList.add("hidden");
    if (document.getElementById("splash") || Game.state !== "play") return;
    Game.changeFloor(f);
  },

  /* ---------------- the templates ---------------- */
  render(kind, o) {
    const C = CONTENT, E = Cards.esc, md = Cards.md;
    const head = (kick, title, sub) => `<div class="c-kick">${kick}</div><h2>${title}</h2>${sub ? `<p class="c-tag">${sub}</p>` : ""}`;
    switch (kind) {
      case "lab": case "project":
        return head(E([o.code, o.org, o.when].filter(Boolean).join(" · ")), E(o.name), md(o.tagline))
          + Cards.metrics(o.metrics)
          + Cards.sec("The problem", o.problem ? `<p>${md(o.problem)}</p>` : "")
          + Cards.sec("What I built", Cards.list(o.built))
          + Cards.sec("How it flows", Cards.flow(o.flow || o.diagram))
          + Cards.sec("Stack", Cards.chips(o.stack))
          + (o.note ? `<p class="c-note">🔒 ${E(o.note)}</p>` : "")
          + Cards.links(o.links);
      case "core":
        return head(E(o.code), E(o.name), md(o.tagline))
          + Cards.metrics(o.stats)
          + Cards.sec("What it runs on", Cards.list(o.points))
          + Cards.sec("The three rings", Cards.chips(o.rings))
          + Cards.links([{ label: "Everything on GitHub", url: C.links.github }]);
      case "repo":
        return head(E(`${o.lang} · ${o.year}`), E(o.name), md(o.desc))
          + Cards.sec("Highlights", Cards.list(o.what))
          + (o.lesson ? `<blockquote class="c-quote">“${E(o.lesson)}”</blockquote>` : "")
          + Cards.links([{ label: /youtube/.test(o.url) ? "Watch the demo" : "Open on GitHub", url: o.url }]);
      case "repoIndex":
        return head("THE ARCHIVE · FLOOR 2", "Every repo, on one shelf", `${C.repos.length} public projects from <a target="_blank" rel="noopener" href="${C.links.github}">github.com/benasus25</a> — click any to open it.`)
          + `<div class="c-rows">${C.repos.map((r, i) => `<button class="c-row" onclick="Cards.open('repo', CONTENT.repos[${i}], { source: 'directory' })"><b>${E(r.name)}</b><span class="c-lang">${E(r.lang)} · ${E(r.year)}</span><span class="c-desc">${E(r.desc)}</span></button>`).join("")}</div>`;
      case "oss":
        return head(E(o.code), E(o.name), md(o.tagline))
          + `<div class="c-rows">${o.items.map((it) => `<div class="c-row static"><b>${E(it.name)}</b><span class="c-desc">${md(it.what)}</span>${it.url ? `<a target="_blank" rel="noopener" href="${E(it.url)}">${E(it.urlLabel || "Open")} ↗</a>` : ""}</div>`).join("")}</div>`;
      case "case": {
        return `<div class="c-kick">${E(o.no)}</div><h2>${E(o.title.replace(/\b\w+/g, (w) => w[0] + w.slice(1).toLowerCase()))}</h2>
          <p class="c-tag"><b>${E(o.role)}</b> · ${E(o.dates)}</p>
          <div class="c-stamp">${E(o.status)}</div>
          ${o.summary ? `<p>${md(o.summary)}</p>` : ""}
          ${Cards.sec("Evidence", Cards.list(o.bullets))}
          ${Cards.sec("Stack", Cards.chips(o.stack))}
          ${o.floor ? `<div class="c-act"><button class="btn sm" onclick="Cards.visit(${o.floor})">🛗 See the systems on Floor ${o.floor}</button></div>` : ""}`;
      }
      case "skill": {
        const used = (o.usedIn || []).map((id) => C.labs.find((l) => l.id === id) || C.projects.find((p) => p.id === id)).filter(Boolean);
        return head(E(o.level), E(o.name), md(o.tagline))
          + Cards.sec("How I use it", Cards.list(o.points))
          + (used.length ? Cards.sec("Where it shipped", `<div class="c-chips link">${used.map((u) => `<button onclick="Cards.open('${C.labs.includes(u) ? "lab" : "project"}', CONTENT.${C.labs.includes(u) ? "labs" : "projects"}[${(C.labs.includes(u) ? C.labs : C.projects).indexOf(u)}], { source: 'directory' })">${E(u.name)} →</button>`).join("")}</div>`) : "")
          + `<div class="c-act"><button class="btn sm ghost" onclick="Cards.open('matrix', { kind: 'matrix', id: 'matrix' }, { source: 'directory' })">See the full stack matrix →</button></div>`;
      }
      case "matrix":
        return head("SKILLS & STACK · FLOOR 4", "The full stack matrix", "Everything I work with, grouped. Production use first.")
          + `<div class="c-matrix">${C.stack.map(([g, items]) => `<div><h5>${E(g)}</h5>${Cards.chips(items)}</div>`).join("")}</div>`;
      case "trophy": {
        let extra = "";
        if (o.id === "leetcode") {
          const L = C.education.leetcode, tot = L.easy + L.medium + L.hard;
          extra = `<div class="c-bar"><span class="e" style="flex:${L.easy}">${L.easy} easy</span><span class="m" style="flex:${L.medium}">${L.medium} medium</span><span class="h" style="flex:${L.hard}">${L.hard} hard</span></div>
            ${Cards.sec("Most-solved topics", Cards.chips(L.tags.map(([t, n]) => `${t} · ${n}`)))}
            ${Cards.sec("Favourite hard ones", `<div class="c-rows">${L.notable.map(([p, how]) => `<div class="c-row static"><b>${E(p)}</b><span class="c-desc">${E(how)}</span></div>`).join("")}</div>`)}
            ${Cards.links([{ label: "All solutions on GitHub", url: C.links.leetcode }])}`;
          void tot;
        }
        return `<div class="c-kick">${E(o.when || "")}</div><div class="c-big">${E(o.big)}</div><h2 class="c-h2s">${E(o.small)}</h2><p>${md(o.story)}</p>${extra}`;
      }
      case "edu": {
        const d = o;
        return head("EDUCATION · FLOOR 3", E(d.title), E(d.sub))
          + `<p>${md(d.body)}</p>`
          + Cards.sec("Core coursework", Cards.chips(d.coursework))
          + Cards.sec("Leadership", `<div class="c-rows">${d.roles.map((r) => `<div class="c-row static"><b>${E(r.name)}</b><span class="c-lang">${E(r.when)}</span><span class="c-desc">${E(r.what)}</span></div>`).join("")}</div>`)
          + Cards.sec("Before DTU", `<p>${E(d.school)}</p>`)
          + `<div class="c-act"><button class="btn sm ghost" onclick="Cards.open('trophy', CONTENT.education.trophies.find((t) => t.id === 'leetcode'), { source: 'directory' })">448 LeetCode problems →</button></div>`;
      }
      case "year":
        return head(E(o.label.toUpperCase()), E(o.year), "")
          + Cards.sec("That year", Cards.list(o.points))
          + `<div class="c-act"><button class="btn sm ghost" onclick="Cards.open('timeline', { kind: 'timeline', id: 'growth' }, { source: 'directory' })">The whole journey →</button></div>`;
      case "role":
        return head(E(o.when), E(o.name), "") + `<p>${md(o.what)}</p>`;
      case "school":
        return head("WHERE IT STARTED", E(o.name), E(o.sub)) + `<div class="c-big">${E(o.score)}</div>`
          + `<p>Then: Delhi Technological University — B.Tech, Computer Engineering, 8.83 CGPA.</p>`
          + `<div class="c-act"><button class="btn sm ghost" onclick="Cards.open('edu', CONTENT.education.dtu, { source: 'directory' })">DTU →</button></div>`;
      case "timeline":
        return head("HALL OF GROWTH · FLOOR 3", "2018 → now", "The short version of a long climb.")
          + `<div class="c-time">${C.education.growth.map((g) => `<div><b>${E(g.year)}</b><span>${E(g.label)}</span><i>${E(g.note)}</i></div>`).join("")}</div>`;
      case "reading": {
        const books = o.cat ? C.books.filter((b) => b.cat === o.cat) : C.books;
        return head("THE KNOWLEDGE VAULT · FLOOR 5", o.cat ? E(o.cat) : "The reading list", "Each with one line on why. Click any for the full note.")
          + `<div class="c-rows">${books.map((b) => `<button class="c-row" onclick="UI.openBook(CONTENT.books[${C.books.indexOf(b)}])"><b>${E(b.title)}</b><span class="c-lang">${E(b.author)}</span><span class="c-desc">${E((b.why.match(/^[^.!?]*[.!?]/) || [b.why])[0])}</span></button>`).join("")}</div>`;
      }
      case "exec":
        return head("EXECUTIVE SUITE · FLOOR 7", "What's next", "Where my head is at, and how to reach me.")
          + `<div class="c-rows">${o.now.map(([k, v]) => `<div class="c-row static"><b>${E(k)}</b><span class="c-desc">${E(v)}</span></div>`).join("")}</div>`
          + Cards.sec("The goals board", Cards.chips(o.goals))
          + `<div class="c-links"><button class="btn primary" onclick="Cards.close();UI.openGuestbook(false)">✉ Leave a note</button><a class="btn" href="${C.links.email}">Email</a><a class="btn" target="_blank" rel="noopener" href="${C.links.linkedin}">LinkedIn ↗</a>${C.links.resume ? `<a class="btn" href="${C.links.resume}" download>Résumé PDF</a>` : ""}</div>`;
      default:
        return `<div class="c-kick">${E((o.lines || [])[0] || "")}</div><h2>${E(o.name || "")}</h2>${(o.lines || []).slice(1).map((l) => `<p class="c-tag">${E(l)}</p>`).join("")}${o.body ? `<p>${E(o.body)}</p>` : ""}`;
    }
  },

  /* ---------------- the walk-up caption (no click needed) ---------------- */
  caption(o) {
    const k = Cards.kindOf(o), E = Cards.esc, C = CONTENT;
    let kick = "", title = "", line = "", ms = [];
    const cap = (t) => t.replace(/\b\w+/g, (w) => w[0] + w.slice(1).toLowerCase());
    if (k === "lab" || k === "project") { kick = [o.code, o.org, o.when].filter(Boolean).join(" · "); title = o.name; line = o.tagline; ms = (o.metrics || []).slice(0, 3); }
    else if (k === "case") { kick = `${o.dates}`; title = `${cap(o.title)} · ${o.role}`; line = o.summary; ms = (o.metrics || []).slice(0, 4); }
    else if (k === "skill") { kick = o.level; title = o.name; line = o.tagline; }
    else if (k === "trophy") { kick = o.when; title = `${o.big} — ${o.small}`; line = Cards.first(o.story); }
    else if (k === "repo") { kick = `${o.lang} · ${o.year}`; title = o.name; line = o.desc; }
    else if (k === "book") { kick = o.author; title = o.title; line = Cards.first(o.why); }
    else if (k === "edu") { kick = "Education"; title = o.title; line = o.sub; ms = [{ v: "8.83", l: "CGPA" }, { v: "2019–23", l: "B.Tech CoE" }]; }
    else if (k === "year") { kick = o.label; title = o.year; line = o.points.join(" · "); }
    else if (k === "role") { kick = o.when; title = o.name; line = o.what; }
    else if (k === "school") { kick = "Where it started"; title = o.name; line = `${o.sub} — ${o.score}`; }
    else if (k === "oss") { kick = o.code; title = o.name; line = o.tagline; }
    else if (k === "core") { kick = o.code; title = o.name; line = o.tagline; ms = o.stats.slice(0, 4); }
    else if (k === "exec") { kick = "Executive suite"; title = "What's next"; line = o.now.map(([a, b]) => `${a}: ${b}`)[0]; }
    else if (k === "repoIndex") { kick = "The archive"; title = "Every repo, on one shelf"; line = `${C.repos.length} real repositories from github.com/benasus25`; }
    else { title = o.name || o.title || ""; line = (o.lines || [])[0] || ""; }
    return `<div class="cap-k">${E(kick)}</div><div class="cap-t">${E(title)}</div><div class="cap-l">${Cards.md(line || "")}</div>`
      + (ms.length ? `<div class="cap-m">${ms.map((m) => `<span><b>${E(m.v)}</b>${E(m.l)}</span>`).join("")}</div>` : "")
      + `<div class="cap-h"><kbd>E</kbd> or click it — the full story</div>`;
  },

  /* ---------------- the one-page résumé ---------------- */
  years() {
    const [y, m] = (CONTENT.profile.careerStart || "2023-07").split("-").map(Number);
    const now = new Date(), months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
    return Math.max(1, Math.floor(months / 12));
  },
  dossier(source) {
    const C = CONTENT, P = C.profile, E = Cards.esc, md = Cards.md;
    const el = document.getElementById("dossier");
    const visit = (f) => `<button class="d-visit" onclick="Cards.visit(${f})">Visit floor ${f} →</button>`;
    const open = (kind, coll, i) => `Cards.open('${kind}', CONTENT.${coll}[${i}], { source: 'resume_page' });Cards.closeDossier(true)`;
    el.innerHTML = `
      <div class="d-wrap">
        <header class="d-head">
          <div>
            <div class="d-kick">SPARSH HQ · THE ONE-PAGE VERSION</div>
            <h1>${E(P.name)}</h1>
            <div class="d-role">${E(P.role)} · ${E(P.company)} · ${Cards.years()}+ years building backends</div>
            <p class="d-sum">${E(P.summary)}</p>
            <div class="d-cta">
              ${C.links.resume ? `<a class="btn primary" href="${C.links.resume}" download>⬇ Résumé PDF</a>` : ""}
              <a class="btn" href="${C.links.email}">✉ ${E(P.email)}</a>
              <a class="btn" target="_blank" rel="noopener" href="${C.links.linkedin}">LinkedIn ↗</a>
              <a class="btn" target="_blank" rel="noopener" href="${C.links.github}">GitHub ↗</a>
              <button class="btn" onclick="Cards.closeDossier();UI.openGuestbook(false)">Leave a note</button>
            </div>
          </div>
          <button class="x d-x" onclick="Cards.closeDossier()" aria-label="Close">✕</button>
        </header>
        <div class="d-stats">${P.stats.map((s) => `<div><b>${E(s.v)}</b><span>${E(s.l)}</span></div>`).join("")}</div>

        <section class="d-sec"><div class="d-sh"><h3>Experience</h3>${visit(1)}</div>
          ${C.cases.map((c) => `<div class="d-job"><div class="d-jh"><span><b>${E(c.role)}</b> · ${E(c.title.replace(/\b\w+/g, (w) => w[0] + w.slice(1).toLowerCase()))}</span><span class="d-date">${E(c.dates)}</span></div>${Cards.list(c.bullets.filter((b) => !/ask me about it/i.test(b)))}</div>`).join("")}
        </section>

        <section class="d-sec two">
          <div><div class="d-sh"><h3>Education</h3>${visit(2)}</div>
            <div class="d-job"><div class="d-jh"><span><b>${E(C.education.dtu.title)}</b></span><span class="d-date">2019 – 2023</span></div><p>${E(C.education.dtu.sub.split(" · ").filter((x) => !/^20/.test(x)).join(" · "))}</p><p class="d-dim">${E(C.education.dtu.school)}</p></div>
            ${C.education.dtu.roles.map((r) => `<div class="d-job"><div class="d-jh"><span><b>${E(r.name)}</b></span><span class="d-date">${E(r.when)}</span></div><p class="d-dim">${E(r.what)}</p></div>`).join("")}
          </div>
          <div><div class="d-sh"><h3>Achievements</h3></div>
            <ul class="d-ach">${C.education.trophies.filter((t) => t.id !== "cgpa" && t.id !== "sahitya").map((t) => `<li><b>${E(t.big)}</b> ${E(t.small)} <span>${E(t.when)}</span></li>`).join("")}</ul>
          </div>
        </section>

        <section class="d-sec"><div class="d-sh"><h3>Systems I built</h3>${visit(1)}</div>
          <div class="d-grid">${C.labs.map((l, i) => `<button class="d-card" style="--acc:${Cards.hex(l.accent)}" onclick="${open("lab", "labs", i)}"><span class="d-ck">${E(l.code)}</span><b>${E(l.name)}</b><span class="d-ct">${E(l.tagline)}</span><span class="d-cm">${(l.metrics || []).slice(0, 2).map((m) => `<i>${E(m.v)}</i> ${E(m.l)}`).join(" · ")}</span></button>`).join("")}</div>
        </section>

        <section class="d-sec"><div class="d-sh"><h3>Projects</h3>${visit(3)}</div>
          <div class="d-grid">${C.projects.map((p, i) => `<button class="d-card" style="--acc:${Cards.hex(p.accent)}" onclick="${open("project", "projects", i)}"><span class="d-ck">${E(p.org)} · ${E(p.when)}</span><b>${E(p.name)}</b><span class="d-ct">${E(p.tagline)}</span><span class="d-cm">${E((p.stack || []).slice(0, 4).join(" · "))}</span></button>`).join("")}</div>
          <div class="d-repos">${C.repos.map((r, i) => `<button onclick="${open("repo", "repos", i)}"><b>${E(r.name)}</b> <span>${E(r.lang)}</span></button>`).join("")}</div>
        </section>

        <section class="d-sec"><div class="d-sh"><h3>Skills</h3>${visit(1)}</div>
          <div class="d-matrix">${C.stack.map(([g, items]) => `<div><h5>${E(g)}</h5><p>${items.map(E).join(" · ")}</p></div>`).join("")}</div>
        </section>


        <footer class="d-foot">
          <span>Want the cinematic version? Close this and walk the building — every line above has a room.</span>
          <span class="d-prog">Explored: ${Cards.seenCount()} / ${Cards.totalExhibits()} exhibits</span>
        </footer>
      </div>`;
    el.classList.remove("hidden");
    el.scrollTop = 0;
    if (el.classList.contains("over-splash")) el.querySelectorAll(".d-card, .d-repos button, .d-visit").forEach((b) => { b.disabled = true; });
    if (Game.state === "play") Game.state = "dossier";
    AudioSys.sfx("open");
    Analytics.event("dossier_open", { source: source || "button" });
  },
  closeDossier(keepState) {
    const el = document.getElementById("dossier");
    if (el.classList.contains("hidden") || Game.state === "fallback") return;   // without WebGL it's all there is
    el.classList.add("hidden");
    if (Game.state === "dossier") Game.state = "play";
    if (!keepState) AudioSys.sfx("close");
  },
};

/* ---------------- hook into the existing UI ---------------- */
(function wire() {
  const _init = UI.init;
  UI.init = function () { _init.apply(UI, arguments); Cards.init(); };
  UI.panel = (obj) => Cards.openObj(obj, "world");
  UI.caseFile = (cs) => Cards.openObj(cs, "world");
  UI.dossier = (source) => Cards.dossier(source);
  const _book = UI.openBook;
  UI.openBook = function (book) {
    if (book.isRepo && book.repo) return Cards.open("repo", book.repo, { source: "world" });
    Cards.markSeen("book", book);
    Analytics.event("content_open", { content_type: "book", item_id: book.title, item_name: book.title, source: "world", floor_id: String(Game.floorIndex) });
    return _book.apply(UI, arguments);
  };
  const _close = UI.closeAll;
  UI.closeAll = function () { Cards.closeDossier(true); return _close.apply(UI, arguments); };
  const _sign = UI.signGuestbook;
  UI.signGuestbook = function (exitMode, intent) {
    const val = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ""; };
    if (val("g-name") || val("g-email") || val("g-msg")) Analytics.event("guestbook_submit", { intent: intent || "note", at_exit: exitMode ? "yes" : "no", has_message: val("g-msg") ? "yes" : "no" });
    return _sign.apply(UI, arguments);
  };
  const _died = UI.youDied;
  UI.youDied = function () {
    if (UI.els.died && UI.els.died.classList.contains("hidden")) Analytics.event("easter_egg", { name: "production_database" });
    return _died.apply(UI, arguments);
  };
  const _lf = Game.loadFloor;
  Game.loadFloor = function (idx, opts) {
    const r = _lf.apply(Game, arguments);
    if (typeof Guide !== "undefined") { Guide.cur = null; Guide.show(null); }
    Cards.onFloor(idx);
    Analytics.enterFloor(idx, (opts && opts.via) || (Game.state === "transition" ? "elevator" : "walk"));
    return r;
  };
  const _cf = Game.changeFloor;
  Game.changeFloor = function (idx) {
    if (Game.state === "transition" || idx === Game.floorIndex) return _cf.apply(Game, arguments);
    Cards.closeDossier(true);                 // the ride ends in "play" - never leave the resume page open over it
    Analytics.event("elevator_ride", { from: String(Game.floorIndex), to: String(idx) });
    return _cf.apply(Game, arguments);
  };
  if (typeof Tutorial !== "undefined") {
    const _fin = Tutorial.finish;
    Tutorial.finish = function () { Analytics.event("tutorial_complete", {}); return _fin.apply(Tutorial, arguments); };
  }
})();
