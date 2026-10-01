/* ============================================================
   SPARSH HQ — exhibits.js
   Animated holographic exhibits: every project tells its story
   with motion, not paragraphs.
   ============================================================ */

const Exhibits = {

  updateAll(dt) {
    if (!Game.floor) return;
    for (const ex of Game.floor.exhibits) {
      ex.state = ex.state || { t: 0 };
      ex.state.t += dt;
      ex.active = Game.currentRoom === ex.room;
      const fn = Exhibits.types[ex.type];
      if (fn && fn.update) fn.update(ex, dt);
    }
  },

  drawAll(c, t) {
    if (!Game.floor) return;
    for (const ex of Game.floor.exhibits) {
      const fn = Exhibits.types[ex.type];
      if (!fn) continue;
      c.save();
      c.globalAlpha = ex.active ? 1 : 0.6;
      fn.draw(c, ex, ex.state ? ex.state.t : t);
      c.restore();
    }
  },

  base(c, ex, color = "rgba(87,216,255,0.5)") {
    const s = ISO.toScreen(ex.x + ex.w / 2, ex.y + ex.h / 2);
    c.strokeStyle = color; c.lineWidth = 1.5;
    c.beginPath(); c.ellipse(s.x, s.y, ex.w * 24, ex.w * 12, 0, 0, Math.PI * 2); c.stroke();
    c.globalAlpha *= 0.5;
    c.beginPath(); c.ellipse(s.x, s.y, ex.w * 30, ex.w * 15, 0, 0, Math.PI * 2); c.stroke();
    c.globalAlpha *= 2;
    return s;
  },

  label(c, x, y, big, small, color = "#57d8ff") {
    c.font = "800 12px 'Outfit',sans-serif"; c.textAlign = "center";
    c.fillStyle = color; c.fillText(big, x, y);
    if (small) { c.font = "500 8.5px 'Outfit',sans-serif"; c.fillStyle = "rgba(255,255,255,0.75)"; c.fillText(small, x, y + 12); }
  },

  types: {

    /* ---- Questionnaire Engine: growing binary tree ---- */
    tree: {
      draw(c, ex, t) {
        const s = Exhibits.base(c, ex, "rgba(90,167,255,0.45)");
        const cycle = (t % 9) / 9;               // grows over 9s then restarts
        const grown = Math.min(1, cycle * 1.6);
        const drawNode = (x, y, depth, idx) => {
          const reveal = (depth + 1) / 4;
          if (grown < reveal * 0.85) return;
          const a = Math.min(1, (grown - reveal * 0.85) * 6);
          if (depth < 3) {
            const spread = 46 / (depth + 1);
            for (const dir of [-1, 1]) {
              const nx = x + dir * spread, ny = y - 34;
              c.strokeStyle = `rgba(90,167,255,${0.6 * a})`; c.lineWidth = 1.4;
              c.beginPath(); c.moveTo(x, y); c.lineTo(nx, ny); c.stroke();
              drawNode(nx, ny, depth + 1, idx * 2 + (dir > 0 ? 1 : 0));
            }
          }
          const on = Math.sin(t * 3 + idx * 2) > 0.3;
          Renderer.glowDot(c, x, y, 9, `rgba(90,167,255,${0.5 * a})`);
          c.fillStyle = on ? `rgba(190,225,255,${a})` : `rgba(90,140,220,${a})`;
          c.beginPath(); c.arc(x, y, depth === 0 ? 5 : 3.5, 0, Math.PI * 2); c.fill();
        };
        drawNode(s.x, s.y - 26, 0, 1);
        const pct = Math.floor(Math.min(1, cycle * 1.25) * 100);
        Exhibits.label(c, s.x, s.y + 22, `${pct}% PROFILE COMPLETE`, "response time ↓ 80% · TAT ↓ 40%", "#7ab8ff");
        // answer particles rising
        if (Math.random() < 0.12) Game.spawnParticle({ x: ex.x + ex.w / 2 + U.rand(-1, 1), y: ex.y + ex.h / 2 + U.rand(-0.6, 0.6), z: 0, vz: 55, grav: 0, size: 2, life: 1.4, color: "rgba(122,184,255,0.9)", type: "glow", color2: "#bfe0ff" });
      },
    },

    /* ---- Dashboard: floating widget wall ---- */
    widgets: {
      draw(c, ex, t) {
        const s = Exhibits.base(c, ex, "rgba(80,220,190,0.4)");
        const cols = 4, rows = 3;
        for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) {
          const wx = s.x + (i - (cols - 1) / 2) * 42;
          const wy = s.y - 46 - r * 30 + Math.sin(t * 1.3 + i * 1.7 + r) * 3;
          const kind = (i + r * cols) % 3;
          c.fillStyle = "rgba(10,20,26,0.85)";
          c.strokeStyle = "rgba(80,220,190,0.5)"; c.lineWidth = 1;
          Renderer.rr(c, wx - 18, wy - 12, 36, 24, 3); c.fill(); c.stroke();
          if (kind === 0) { // line chart
            c.strokeStyle = "#50dcbe"; c.lineWidth = 1.2; c.beginPath();
            for (let px = 0; px < 8; px++) c.lineTo(wx - 14 + px * 4, wy + 6 - Math.abs(Math.sin(t + px + i * 3)) * 12);
            c.stroke();
          } else if (kind === 1) { // bars
            for (let b = 0; b < 4; b++) {
              const bh = 4 + Math.abs(Math.sin(t * 1.4 + b * 2 + r)) * 11;
              c.fillStyle = "rgba(80,220,190,0.8)";
              c.fillRect(wx - 13 + b * 8, wy + 8 - bh, 5, bh);
            }
          } else { // big number
            c.fillStyle = "#e8fff8"; c.font = "800 9px 'Outfit',sans-serif"; c.textAlign = "center";
            c.fillText(`${(Math.floor(t * 3 + i * 7 + r * 13) % 90) + 10}%`, wx, wy + 3);
          }
        }
        Exhibits.label(c, s.x, s.y + 22, "100+ LIVE WIDGETS", "1M+ monthly visits · engagement +25%", "#50dcbe");
      },
    },

    /* ---- Campaign Mission Control: notification particles ---- */
    mission: {
      update(ex, dt) {
        ex.state.sent = (ex.state.sent || 12873456) + Math.floor(dt * 900 * (ex.active ? 1.6 : 1));
      },
      draw(c, ex, t) {
        const s = Exhibits.base(c, ex, "rgba(255,107,87,0.4)");
        const chans = [
          { name: "SMS · Twilio", col: "#7ae582", ang: -0.9 },
          { name: "EMAIL · SendGrid", col: "#57d8ff", ang: 0 },
          { name: "PUSH · FCM", col: "#ffd166", ang: 0.9 },
        ];
        // core console
        Renderer.glowDot(c, s.x, s.y - 34, 26, "rgba(255,107,87,0.35)");
        c.fillStyle = "#ff6b57";
        c.beginPath(); c.arc(s.x, s.y - 34, 7 + Math.sin(t * 5) * 1.5, 0, Math.PI * 2); c.fill();
        chans.forEach((ch, i) => {
          const ex2 = s.x + Math.sin(ch.ang) * 95, ey = s.y - 34 - Math.cos(ch.ang) * 0 - 52;
          const gx = s.x + (i - 1) * 90, gy = s.y - 100;
          c.strokeStyle = ch.col + "44"; c.lineWidth = 1;
          c.beginPath(); c.moveTo(s.x, s.y - 34); c.lineTo(gx, gy); c.stroke();
          // gate
          c.strokeStyle = ch.col; c.lineWidth = 1.6;
          c.strokeRect(gx - 14, gy - 10, 28, 16);
          c.font = "600 7.5px 'Outfit',sans-serif"; c.textAlign = "center";
          c.fillStyle = ch.col; c.fillText(ch.name, gx, gy + 18);
          // particles along beam
          for (let k = 0; k < 4; k++) {
            const f = ((t * (0.5 + i * 0.11) + k * 0.25) % 1);
            const px = U.lerp(s.x, gx, f), py = U.lerp(s.y - 34, gy, f);
            Renderer.glowDot(c, px, py, 6, ch.col + "aa", 0.9);
            c.fillStyle = "#fff"; c.fillRect(px - 1, py - 1, 2, 2);
          }
        });
        Exhibits.label(c, s.x, s.y + 22, (ex.state.sent || 0).toLocaleString() + " NOTIFICATIONS SENT", "1,000+ campaigns · 12M+ users", "#ff8f7d");
      },
    },

    /* ---- EMR: holographic patient ---- */
    emr: {
      draw(c, ex, t) {
        const s = Exhibits.base(c, ex, "rgba(122,229,130,0.4)");
        const y0 = s.y - 40;
        // rotating patient silhouette
        const sway = Math.sin(t * 0.8);
        c.save();
        c.translate(s.x, y0);
        c.scale(0.85 + Math.abs(sway) * 0.15, 1);
        c.strokeStyle = "rgba(122,229,130,0.85)"; c.lineWidth = 1.6;
        c.beginPath(); c.arc(0, -30, 8, 0, Math.PI * 2); c.stroke();          // head
        c.beginPath(); c.moveTo(0, -22); c.lineTo(0, 4); c.stroke();          // spine
        c.beginPath(); c.moveTo(-12 * sway - 6, -12); c.lineTo(0, -18); c.lineTo(12 * sway + 6, -12); c.stroke(); // arms
        c.beginPath(); c.moveTo(-6, 18); c.lineTo(0, 4); c.lineTo(6, 18); c.stroke(); // legs
        c.restore();
        Renderer.glowDot(c, s.x, y0 - 10, 40, "rgba(122,229,130,0.14)");
        // vitals ring
        c.strokeStyle = "rgba(122,229,130,0.5)";
        c.beginPath(); c.ellipse(s.x, y0 + 22, 34, 10, 0, t % (Math.PI * 2), (t % (Math.PI * 2)) + 4.6); c.stroke();
        // ECG line
        c.strokeStyle = "#7ae582"; c.lineWidth = 1.3; c.beginPath();
        for (let i = 0; i < 40; i++) {
          const px = s.x - 60 + i * 3;
          const ph = ((i * 3 + (t * 60) % 120) % 120) / 120;
          let py = y0 - 62;
          if (ph > 0.42 && ph < 0.5) py -= (ph - 0.42) * 220;
          else if (ph >= 0.5 && ph < 0.58) py -= (0.58 - ph) * 220;
          c.lineTo(px, py);
        }
        c.stroke();
        // floating record cards + AI suggestion
        for (let i = 0; i < 3; i++) {
          const cx = s.x + 62, cy = y0 - 30 + i * 22 + Math.sin(t * 1.5 + i) * 2;
          c.fillStyle = "rgba(10,24,14,0.85)"; c.strokeStyle = "rgba(122,229,130,0.45)"; c.lineWidth = 1;
          Renderer.rr(c, cx - 4, cy - 6, 44, 14, 3); c.fill(); c.stroke();
          c.fillStyle = "rgba(200,255,210,0.8)"; c.font = "500 7px 'Outfit',sans-serif"; c.textAlign = "left";
          c.fillText(["Hx: migraines", "Rx: suggested ✓", "Consult: online"][i], cx, cy + 3);
        }
        Exhibits.label(c, s.x, s.y + 22, "MULTI-TENANT EMR", "entire backend · AI prescribing · MCP", "#7ae582");
      },
    },

    /* ---- Chat app: flying messages ---- */
    chatflow: {
      draw(c, ex, t) {
        const a = ISO.toScreen(ex.x + 0.5, ex.y + ex.h / 2);
        const b = ISO.toScreen(ex.x + ex.w - 0.5, ex.y + ex.h / 2);
        const ay = a.y - 46, by = b.y - 46;
        // socket beam
        c.strokeStyle = "rgba(192,132,252,0.35)"; c.lineWidth = 4;
        c.beginPath(); c.moveTo(a.x, ay); c.lineTo(b.x, by); c.stroke();
        c.strokeStyle = "rgba(192,132,252,0.8)"; c.lineWidth = 1;
        c.beginPath(); c.moveTo(a.x, ay); c.lineTo(b.x, by); c.stroke();
        // endpoint avatars
        for (const [px, py, col] of [[a.x, ay, "#c084fc"], [b.x, by, "#57d8ff"]]) {
          Renderer.glowDot(c, px, py, 16, col + "55");
          c.fillStyle = col; c.beginPath(); c.arc(px, py, 6, 0, Math.PI * 2); c.fill();
          c.fillStyle = "#0f0c16"; c.beginPath(); c.arc(px, py - 1.5, 2.4, 0, Math.PI * 2); c.fill();
        }
        // flying message bubbles
        for (let i = 0; i < 3; i++) {
          const dir = i % 2 === 0;
          const f = (t * (0.35 + i * 0.09) + i * 0.37) % 1;
          const px = U.lerp(dir ? a.x : b.x, dir ? b.x : a.x, f);
          const py = U.lerp(dir ? ay : by, dir ? by : ay, f) - Math.sin(f * Math.PI) * 18;
          c.fillStyle = dir ? "rgba(192,132,252,0.95)" : "rgba(87,216,255,0.95)";
          Renderer.rr(c, px - 9, py - 5, 18, 10, 4); c.fill();
          c.fillStyle = "#0f0c16";
          for (let d = 0; d < 3; d++) c.fillRect(px - 5 + d * 4, py - 1, 2, 2);
        }
        // typing indicator
        const mid = { x: (a.x + b.x) / 2, y: (ay + by) / 2 };
        c.fillStyle = "rgba(255,255,255,0.7)"; c.font = "500 8px 'Outfit',sans-serif"; c.textAlign = "center";
        const dots = ".".repeat(1 + Math.floor(t * 2.5) % 3);
        c.fillText(`someone is typing${dots}`, mid.x, mid.y + 26);
        Exhibits.label(c, mid.x, mid.y + 42, "SOCKET.IO LIVE", "MERN · horizontal scale ready", "#c084fc");
      },
    },

    /* ---- Private server: encrypted packets on fiber ---- */
    packets: {
      draw(c, ex, t) {
        const a = ISO.toScreen(ex.x + 0.4, ex.y + ex.h / 2);
        const b = ISO.toScreen(ex.x + ex.w - 0.4, ex.y + ex.h / 2);
        const ay = a.y - 30, by = b.y - 30;
        const mid = { x: (a.x + b.x) / 2, y: (ay + by) / 2 };
        // fiber
        c.strokeStyle = "rgba(87,216,255,0.25)"; c.lineWidth = 5;
        c.beginPath(); c.moveTo(a.x, ay); c.lineTo(b.x, by); c.stroke();
        c.strokeStyle = "rgba(87,216,255,0.9)"; c.lineWidth = 1;
        c.beginPath(); c.moveTo(a.x, ay); c.lineTo(b.x, by); c.stroke();
        // firewall gate at middle
        const scan = Math.sin(t * 4) * 8;
        c.strokeStyle = "rgba(255,95,69,0.9)"; c.lineWidth = 2;
        c.strokeRect(mid.x - 10, mid.y - 24, 20, 34);
        c.strokeStyle = "rgba(255,95,69,0.5)";
        c.beginPath(); c.moveTo(mid.x - 10, mid.y - 7 + scan); c.lineTo(mid.x + 10, mid.y - 7 + scan); c.stroke();
        c.font = "600 7px 'Outfit',sans-serif"; c.textAlign = "center"; c.fillStyle = "#ff5f45";
        c.fillText("FIREWALL", mid.x, mid.y - 30);
        // packets: scrambled before gate, clean after
        for (let i = 0; i < 4; i++) {
          const f = (t * 0.3 + i * 0.25) % 1;
          const px = U.lerp(a.x, b.x, f), py = U.lerp(ay, by, f);
          const enc = f < 0.5;
          c.fillStyle = enc ? "#ffd166" : "#7ae582";
          c.save(); c.translate(px, py - 8); if (enc) c.rotate(t * 6 + i);
          c.fillRect(-4, -4, 8, 8);
          c.fillStyle = "#0f0c16"; c.font = "700 7px monospace";
          c.fillText(enc ? "#" : "✓", 0, 2.6);
          c.restore();
        }
        Exhibits.label(c, mid.x, mid.y + 34, "AUTHENTICATED CHANNEL", "Dart sockets · Flutter client", "#57d8ff");
      },
    },

    /* ---- Weather engine: globe + satellite + ships ---- */
    weather: {
      draw(c, ex, t) {
        const s = Exhibits.base(c, ex, "rgba(87,216,255,0.4)");
        const y0 = s.y - 52, R = 30;
        Renderer.glowDot(c, s.x, y0, R * 1.8, "rgba(80,160,255,0.16)");
        c.strokeStyle = "rgba(120,200,255,0.8)"; c.lineWidth = 1.3;
        c.beginPath(); c.arc(s.x, y0, R, 0, Math.PI * 2); c.stroke();
        // meridians
        for (let i = -1; i <= 1; i++) {
          c.strokeStyle = "rgba(120,200,255,0.35)";
          c.beginPath(); c.ellipse(s.x, y0, Math.abs(R * 0.5 * i) + 4, R, 0, 0, Math.PI * 2); c.stroke();
        }
        c.beginPath(); c.ellipse(s.x, y0, R, R * 0.35, 0, 0, Math.PI * 2); c.stroke();
        // continents drift
        c.fillStyle = "rgba(122,229,130,0.5)";
        for (let i = 0; i < 4; i++) {
          const lon = (t * 0.3 + i * 1.6) % (Math.PI * 2);
          const vis = Math.sin(lon);
          if (vis > 0) {
            c.globalAlpha = vis * 0.7;
            c.beginPath(); c.ellipse(s.x + Math.cos(lon) * R * 0.7, y0 - 10 + i * 7, 8 * vis, 5, 0, 0, Math.PI * 2); c.fill();
            c.globalAlpha = 1;
          }
        }
        // satellite orbit
        const sa = t * 1.2;
        const sx2 = s.x + Math.cos(sa) * (R + 16), sy2 = y0 + Math.sin(sa) * (R * 0.45 + 8);
        c.fillStyle = "#e8ecf4"; c.fillRect(sx2 - 2, sy2 - 2, 4, 4);
        c.fillStyle = "#57d8ff"; c.fillRect(sx2 - 8, sy2 - 1.4, 5, 2.8); c.fillRect(sx2 + 3, sy2 - 1.4, 5, 2.8);
        if (Math.sin(sa) > 0.6) { c.strokeStyle = "rgba(255,214,130,0.6)"; c.setLineDash([2, 3]); c.beginPath(); c.moveTo(sx2, sy2); c.lineTo(s.x, y0); c.stroke(); c.setLineDash([]); }
        // ships + waves below
        for (let i = 0; i < 3; i++) {
          const wx = s.x - 60 + i * 55 + Math.sin(t * 0.6 + i * 2) * 8;
          const wy = s.y + 8 + Math.sin(t * 1.4 + i) * 2;
          c.fillStyle = "#8a97ad";
          c.beginPath(); c.moveTo(wx - 7, wy); c.lineTo(wx + 7, wy); c.lineTo(wx + 4, wy + 4); c.lineTo(wx - 4, wy + 4); c.closePath(); c.fill();
          c.fillRect(wx - 1.6, wy - 5, 3.2, 5);
          c.strokeStyle = "rgba(120,200,255,0.4)";
          c.beginPath(); c.arc(wx, wy + 6, 9, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
        }
        Exhibits.label(c, s.x, s.y + 26, "94%+ VOYAGE OPTIMIZATION", "GRIB decrypt · DRF · Python & C++", "#57d8ff");
      },
    },

    /* ---- JVM exhibit ---- */
    jvm: {
      update(ex, dt) {
        const st = ex.state;
        st.heap = st.heap === undefined ? 0.2 : st.heap + dt * 0.09;
        if (st.heap > 0.92) { st.gc = 1; st.heap = 0.25; AudioSys.sfx("whoosh"); }
        st.gc = Math.max(0, (st.gc || 0) - dt * 1.2);
      },
      draw(c, ex, t) {
        const s = Exhibits.base(c, ex, "rgba(255,158,77,0.45)");
        const st = ex.state;
        // heap bar
        const bw = 110, bx = s.x - bw / 2, by = s.y - 78;
        c.strokeStyle = "rgba(255,158,77,0.8)"; c.lineWidth = 1.2;
        c.strokeRect(bx, by, bw, 14);
        const hp = st.heap || 0.3;
        c.fillStyle = hp > 0.8 ? "rgba(255,95,69,0.85)" : "rgba(255,158,77,0.7)";
        c.fillRect(bx + 1, by + 1, (bw - 2) * hp, 12);
        c.font = "600 8px 'Outfit',sans-serif"; c.textAlign = "center"; c.fillStyle = "#ffca9e";
        c.fillText(`HEAP ${(hp * 100).toFixed(0)}%  ·  Eden → Survivor → Old`, s.x, by - 6);
        // GC sweep
        if (st.gc > 0) {
          c.fillStyle = `rgba(122,229,130,${st.gc * 0.5})`;
          c.fillRect(bx, by, bw * (1 - st.gc), 14);
          c.fillStyle = `rgba(122,229,130,${st.gc})`;
          c.font = "800 10px 'Outfit',sans-serif";
          c.fillText("GC SWEEP ✓", s.x, by + 44 - st.gc * 20);
        }
        // threads between cores
        for (let core = 0; core < 4; core++) {
          const cx = s.x - 54 + core * 36, cy = s.y - 40;
          c.strokeStyle = "rgba(255,158,77,0.5)";
          c.strokeRect(cx - 9, cy - 9, 18, 18);
          c.fillStyle = "rgba(255,158,77,0.15)"; c.fillRect(cx - 9, cy - 9, 18, 18);
          const busy = Math.sin(t * (2 + core) + core * 9) > -0.2;
          if (busy) { c.fillStyle = "#ffd166"; c.beginPath(); c.arc(cx + Math.sin(t * 8 + core) * 4, cy + Math.cos(t * 7 + core) * 4, 2.2, 0, Math.PI * 2); c.fill(); }
          c.font = "500 6.5px monospace"; c.fillStyle = "rgba(255,255,255,0.55)";
          c.fillText("T" + core, cx, cy + 16);
        }
        Exhibits.label(c, s.x, s.y + 22, "JVM · LIVE", "allocation → GC → survivors, forever", "#ff9e4d");
      },
    },

    /* ---- RabbitMQ queue flow ---- */
    queue: {
      draw(c, ex, t) {
        const a = ISO.toScreen(ex.x + 0.4, ex.y + ex.h / 2);
        const b = ISO.toScreen(ex.x + ex.w - 0.4, ex.y + ex.h / 2);
        const ay = a.y - 44, by = b.y - 44;
        const qx = (a.x + b.x) / 2, qy = (ay + by) / 2;
        // producer / consumer nodes
        for (const [px, py, lab, col] of [[a.x, ay, "PRODUCER", "#ffd166"], [b.x, by, "CONSUMER", "#7ae582"]]) {
          c.strokeStyle = col; c.lineWidth = 1.5;
          c.strokeRect(px - 16, py - 10, 32, 20);
          c.font = "600 6.5px 'Outfit',sans-serif"; c.textAlign = "center"; c.fillStyle = col;
          c.fillText(lab, px, py + 20);
        }
        // queue box with slots
        c.strokeStyle = "#ff9e4d"; c.lineWidth = 1.5;
        c.strokeRect(qx - 30, qy - 10, 60, 20);
        c.fillText("", qx, qy);
        const fill = 3 + Math.floor(Math.abs(Math.sin(t * 0.7)) * 4);
        for (let i = 0; i < 6; i++) {
          c.fillStyle = i < fill ? "rgba(255,158,77,0.9)" : "rgba(255,158,77,0.12)";
          c.fillRect(qx - 26 + i * 9, qy - 5, 6, 10);
        }
        c.font = "600 7px 'Outfit',sans-serif"; c.fillStyle = "#ff9e4d";
        c.fillText("queue.notifications", qx, qy - 16);
        // messages flowing
        for (let i = 0; i < 3; i++) {
          const f = (t * 0.4 + i * 0.33) % 1;
          let px, py;
          if (f < 0.5) { px = U.lerp(a.x + 16, qx - 30, f * 2); py = U.lerp(ay, qy, f * 2); }
          else { px = U.lerp(qx + 30, b.x - 16, (f - 0.5) * 2); py = U.lerp(qy, by, (f - 0.5) * 2); }
          Renderer.glowDot(c, px, py, 6, "rgba(255,209,102,0.7)");
          c.fillStyle = "#ffd166"; c.fillRect(px - 2, py - 2, 4, 4);
        }
        // occasional DLQ drop
        const dlqPhase = (t % 6) / 6;
        if (dlqPhase < 0.25) {
          const f = dlqPhase * 4;
          const px = qx + 10, py = qy + 10 + f * 26;
          c.fillStyle = "rgba(255,95,69,0.95)"; c.fillRect(px - 2, py - 2, 4, 4);
          c.strokeStyle = "rgba(255,95,69,0.4)"; c.setLineDash([2, 2]);
          c.beginPath(); c.moveTo(qx + 10, qy + 10); c.lineTo(px, py); c.stroke(); c.setLineDash([]);
        }
        c.strokeStyle = "rgba(255,95,69,0.8)"; c.lineWidth = 1.2;
        c.strokeRect(qx - 12, qy + 34, 44, 14);
        c.font = "600 6.5px 'Outfit',sans-serif"; c.fillStyle = "#ff5f45";
        c.fillText("DEAD LETTER Q", qx + 10, qy + 43);
        c.fillText("retry ↻ ×3", qx + 48, qy + 20);
        Exhibits.label(c, qx, qy + 66, "MESSAGES IN FLIGHT", "at-least-once · Camunda handoffs", "#ff9e4d");
      },
    },

    /* ---- GitHub commit subway ---- */
    subway: {
      draw(c, ex, t) {
        const s = Exhibits.base(c, ex, "rgba(74,222,128,0.4)");
        const lines = [
          { col: "#4ade80", y: -70, name: "main" },
          { col: "#57d8ff", y: -52, name: "feat/emr" },
          { col: "#ffd166", y: -34, name: "fix/queue" },
        ];
        const x0 = s.x - 95, x1 = s.x + 95;
        lines.forEach((ln, li) => {
          const ly = s.y + ln.y;
          c.strokeStyle = ln.col; c.lineWidth = 2.4; c.globalAlpha = 0.8;
          c.beginPath(); c.moveTo(x0, ly);
          if (li === 1) { c.lineTo(s.x - 30, ly); c.quadraticCurveTo(s.x, ly, s.x + 4, ly + 9); c.quadraticCurveTo(s.x + 22, ly + 18, s.x + 40, ly + 18); c.lineTo(x1, ly + 18); }
          else c.lineTo(x1, ly);
          c.stroke(); c.globalAlpha = 1;
          // stations (commits)
          for (let i = 0; i < 6; i++) {
            const cx = x0 + 20 + i * 32;
            let cy = ly; if (li === 1 && cx > s.x) cy = ly + 18;
            c.fillStyle = "#0d1411"; c.strokeStyle = ln.col; c.lineWidth = 1.5;
            c.beginPath(); c.arc(cx, cy, 3.2, 0, Math.PI * 2); c.fill(); c.stroke();
          }
          // train (moving commit)
          const f = (t * (0.12 + li * 0.05) + li * 0.4) % 1;
          const tx = U.lerp(x0, x1, f);
          let ty = ly; if (li === 1 && tx > s.x) ty = ly + 18;
          Renderer.glowDot(c, tx, ty, 8, ln.col + "99");
          c.fillStyle = "#fff"; c.fillRect(tx - 2, ty - 2, 4, 4);
          c.font = "500 7px monospace"; c.textAlign = "left"; c.fillStyle = ln.col;
          c.fillText(ln.name, x1 + 6, ly + (li === 1 ? 18 : 0) + 2);
        });
        Exhibits.label(c, s.x, s.y + 20, "COMMIT HISTORY", "github.com/benasus25", "#4ade80");
      },
    },

    /* ---- Redis crystal ---- */
    redis: {
      draw(c, ex, t) {
        const s = Exhibits.base(c, ex, "rgba(255,95,69,0.4)");
        const y0 = s.y - 46;
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 + t * 0.6;
          const px = s.x + Math.cos(a) * 30, py = y0 + Math.sin(a) * 12;
          c.fillStyle = "rgba(255,95,69,0.85)";
          c.save(); c.translate(px, py); c.rotate(a);
          c.beginPath(); c.moveTo(0, -8); c.lineTo(5, 0); c.lineTo(0, 8); c.lineTo(-5, 0); c.closePath(); c.fill();
          c.restore();
          c.font = "500 6px monospace"; c.textAlign = "center"; c.fillStyle = "rgba(255,255,255,0.5)";
          c.fillText(["GET", "SET", "TTL", "PUB", "SUB"][i], px, py + 16);
        }
        Renderer.glowDot(c, s.x, y0, 34, "rgba(255,95,69,0.2)");
        c.fillStyle = "#ffb3a5"; c.font = "800 10px 'Outfit',sans-serif"; c.textAlign = "center";
        c.fillText("0.4ms", s.x, y0 + 3);
        Exhibits.label(c, s.x, s.y + 20, "IN-MEMORY SPEED", "cache · sessions · hot paths", "#ff5f45");
      },
    },

    /* ---- confetti trigger zone (achievements) ---- */
    confetti: {
      update(ex, dt) {
        const st = ex.state;
        st.cool = Math.max(0, (st.cool || 0) - dt);
        const p = Game.player;
        if (st.cool <= 0 && p.x >= ex.x && p.x < ex.x + ex.w && p.y >= ex.y && p.y < ex.y + ex.h) {
          st.cool = 8;
          Game.burst(p.x, p.y, 60, (i) => ["#ffd166", "#ff6b57", "#57d8ff", "#7ae582", "#c084fc"][i % 5], 3);
          AudioSys.sfx("confetti");
          UI.toast("👏 The gallery applauds.");
        }
      },
      draw() {},
    },
  },
};

/* ---- B2B portal: census files → S3 ---- */
Exhibits.types.s3 = {
  draw(c, ex, t) {
    const s = Exhibits.base(c, ex, "rgba(255,209,102,0.4)");
    // bucket
    const bx = s.x + 50, by = s.y - 40;
    c.strokeStyle = "#ffd166"; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(bx - 16, by - 14); c.lineTo(bx + 16, by - 14); c.lineTo(bx + 11, by + 14); c.lineTo(bx - 11, by + 14); c.closePath(); c.stroke();
    c.font = "600 7px 'Outfit',sans-serif"; c.textAlign = "center"; c.fillStyle = "#ffd166";
    c.fillText("AWS S3", bx, by + 26);
    // files flying in
    for (let i = 0; i < 3; i++) {
      const f = (t * 0.4 + i * 0.33) % 1;
      const px = U.lerp(s.x - 70, bx, f), py = U.lerp(s.y - 44, by, f) - Math.sin(f * Math.PI) * 24;
      c.fillStyle = "rgba(240,244,255,0.9)";
      c.fillRect(px - 4, py - 5, 8, 10);
      c.strokeStyle = "rgba(0,0,0,0.4)"; c.lineWidth = 0.8;
      c.beginPath(); c.moveTo(px - 2, py - 2); c.lineTo(px + 2, py - 2); c.moveTo(px - 2, py + 1); c.lineTo(px + 2, py + 1); c.stroke();
    }
    c.fillStyle = "rgba(255,255,255,0.75)"; c.font = "500 7px 'Outfit',sans-serif";
    c.fillText("census_2026.csv", s.x - 70, s.y - 56);
    Exhibits.label(c, s.x, s.y + 20, "B2B CENSUS PIPELINE", "100+ companies · 2M+ users", "#ffd166");
  },
};
