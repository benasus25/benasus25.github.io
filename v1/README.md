# SPARSH HQ

> *Welcome to the building where every room ships software.*

An interactive, isometric portfolio for **Sparsh Sinha** — not a resume, an entire career you can walk through. A living 8-floor glass headquarters rendered in real time: rain on the windows, a city skyline with flying cars, wandering NPCs arguing about tabs vs spaces, procedural ambient music that changes per floor, and an AI receptionist named NOVA who will happily escort you to any department.

**Zero dependencies. No build step. Pure HTML + Canvas + WebAudio.**

## Run it

Any of these works:

- **Double-click `index.html`** (everything works offline; the Google Font falls back gracefully), or
- Serve it: `python -m http.server 8447` → open `http://localhost:8447`, or
- Deploy the folder as-is to GitHub Pages / Netlify / Vercel — it's a static site.

## Controls

| Input | Action |
|---|---|
| `WASD` / arrows | walk |
| click / tap | stroll anywhere (pathfinding) or use nearby objects |
| `E` | interact with glowing rings |
| `C` | talk to NOVA, the AI receptionist |
| `F` | elevator / building directory |
| `M` | sound on/off |

## The building

- **Plaza** — rain, neon marquee, drone delivery, automatic doors
- **F0 Reception** — NOVA, the big board, aquarium, guest book, photo wall, coffee bar, an emergency button you should absolutely not press ten times
- **F1 Engineering** — Questionnaire Engine (a binary tree that grows), Dashboard Command Center (100+ live widgets), Campaign Mission Control (12M+ users' notifications as particles), EMR Platform (holographic patient), B2B S3 pipeline
- **F2 Projects Lab** — Chat App (messages literally fly), Private Server (firewall + encrypted packets), Weather Engine (globe, satellite, ships)
- **F3 Education Wing** — DTU lecture hall, a library with one structurally suspicious shelf, computer lab, the late-night desk
- **F4 Achievements Gallery** — CodeKaze AIR 315/200k+, Hack with CW top 30/800, IC² 5th national, confetti on entry
- **F5 Open Source Lab** — commit subway lines, floating repo pods
- **F6 Tech Arsenal** — live JVM (heap + GC), RabbitMQ pipes with a DLQ, Redis crystals, container yard, the Postgres vault, and the Death Star Core
- **F7 Executive Office** — rain, mechanical keyboard, "Ship. Learn. Repeat."
- **???** — a sub-basement that does not appear on any map

There are 9+ easter eggs. One of them is thirty years old and involves arrows.

## Editing content

All copy, metrics, links, chat intents, NPC quotes and easter-egg text live in **`js/data/content.js`** — edit that one file to update the portfolio. The resume PDF served by the "Download Resume" button is `assets/Sparsh_Sinha_Resume.pdf`.

## Architecture

```
index.html            entry point (script load order matters)
css/style.css         glassmorphism UI, overlays, modals
js/data/content.js    ALL content: copy, metrics, intents, quotes
js/engine/core.js     game loop, input, camera, iso math
js/engine/audio.js    procedural WebAudio: per-floor generative ambient + SFX
js/engine/render.js   isometric renderer: tiles, glass, ~35 procedural props,
                      people, skyline, rain, particles, retro post-process
js/world/exhibits.js  animated holographic project exhibits
js/world/floors.js    floor layouts (tile DSL): plaza, F0–F7, dungeon
js/world/actors.js    player, NPCs, guide hologram, BFS pathfinding
js/ui/ui.js           HUD, panels, elevator, guest book, endings
js/ui/chat.js         NOVA — scripted intent-matching receptionist
js/easter.js          the secrets
js/main.js            bootstrap + splash
```

Guest book entries persist in `localStorage`; signing also opens a pre-filled email to Sparsh.

---

*Every room tells a story. Thanks for exploring mine.*
