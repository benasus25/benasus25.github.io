/* ============================================================
   SPARSH HQ v3 — look.js
   The art department. Procedural surfaces (wood, marble,
   terrazzo, stone, brick, rugs, wallpaper, fabric, foliage)
   painted on canvas once, cached, and shared.
   ============================================================ */

const Look = {
  _tex: {}, _mat: {},

  rng(seed) {
    let s = (seed * 2654435761) >>> 0;
    return () => { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  },

  hex(c) { return "#" + new THREE.Color(c).getHexString(); },
  shade(c, k) { const col = new THREE.Color(c); col.multiplyScalar(k); return "#" + col.getHexString(); },

  /* paint a canvas once; returns the canvas */
  paint(key, w, h, draw) {
    if (Look._tex[key]) return Look._tex[key];
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    draw(cv.getContext("2d"), w, h);
    Look._tex[key] = cv;
    return cv;
  },

  texFrom(cv, rx = 1, ry = 1, srgb = true) {
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  },

  /* ---------------- surfaces ---------------- */
  canvases: {
    wood(o) {
      return Look.paint("wood" + o.c + (o.planks || 5), 512, 512, (c, w, h) => {
        const R = Look.rng(7 + (o.planks || 5));
        const n = o.planks || 5, ph = h / n;
        for (let p = 0; p < n; p++) {
          const k = 0.86 + R() * 0.26;
          c.fillStyle = Look.shade(o.c, k);
          c.fillRect(0, p * ph, w, ph);
          // grain
          for (let g = 0; g < 14; g++) {
            const gy = p * ph + R() * ph, amp = 1 + R() * 3, f = 0.004 + R() * 0.01, ph0 = R() * 9;
            c.strokeStyle = `rgba(${R() > 0.5 ? "0,0,0" : "255,235,200"},${0.025 + R() * 0.045})`;
            c.lineWidth = 1.6 + R() * 2.4;
            c.beginPath();
            for (let x = 0; x <= w; x += 8) c.lineTo(x, gy + Math.sin(x * f + ph0) * amp);
            c.stroke();
          }
          // occasional knot
          if (R() < 0.35) {
            const kx = R() * w, ky = p * ph + ph * (0.3 + R() * 0.4);
            for (let r = 1; r < 5; r++) {
              c.strokeStyle = `rgba(40,20,5,${0.18 - r * 0.03})`; c.lineWidth = 1.2;
              c.beginPath(); c.ellipse(kx, ky, 4 + r * 5, 2 + r * 2, 0, 0, Math.PI * 2); c.stroke();
            }
          }
          // seams
          c.fillStyle = "rgba(0,0,0,0.55)"; c.fillRect(0, p * ph, w, 2);
          c.fillStyle = "rgba(255,255,255,0.05)"; c.fillRect(0, p * ph + 2, w, 1);
          const sx = R() * w; c.fillStyle = "rgba(0,0,0,0.5)"; c.fillRect(sx, p * ph, 2, ph);
        }
      });
    },

    herring(o) {
      return Look.paint("herring" + o.c, 512, 512, (c, w, h) => {
        const R = Look.rng(31);
        c.fillStyle = Look.shade(o.c, 0.7); c.fillRect(0, 0, w, h);
        // herringbone: alternating rotated plank strips
        for (let i = -8; i < 16; i++) for (let j = -8; j < 16; j++) {
          const k = 0.82 + R() * 0.3;
          c.save();
          const cx = i * 64 + (j % 2) * 32, cy = j * 32;
          c.translate(cx, cy);
          c.rotate((j % 2 ? 1 : -1) * Math.PI / 4);
          c.fillStyle = Look.shade(o.c, k);
          c.fillRect(-45, -11, 90, 22);
          for (let g = 0; g < 5; g++) {
            c.strokeStyle = `rgba(0,0,0,${0.05 + R() * 0.06})`; c.lineWidth = 1;
            const gy = -9 + R() * 18;
            c.beginPath(); c.moveTo(-45, gy); c.lineTo(45, gy + (R() - 0.5) * 2); c.stroke();
          }
          c.strokeStyle = "rgba(0,0,0,0.5)"; c.lineWidth = 1.5; c.strokeRect(-45, -11, 90, 22);
          c.restore();
        }
      });
    },

    marble(o) {
      return Look.paint("marble" + o.c + o.v, 1024, 1024, (c, w, h) => {
        const R = Look.rng(19);
        c.fillStyle = Look.hex(o.c); c.fillRect(0, 0, w, h);
        for (let i = 0; i < 40; i++) {
          const x = R() * w, y = R() * h, r = 80 + R() * 260;
          const g = c.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, `rgba(${R() > 0.5 ? "255,255,255" : "0,0,0"},${0.05 + R() * 0.06})`);
          g.addColorStop(1, "rgba(0,0,0,0)");
          c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
        }
        const vein = (x, y, ang, len, wdt, alpha, col) => {
          c.strokeStyle = col.replace("A", alpha);
          c.lineWidth = wdt; c.lineCap = "round";
          c.beginPath(); c.moveTo(x, y);
          for (let s = 0; s < len; s++) {
            ang += (R() - 0.5) * 0.5;
            x += Math.cos(ang) * 14; y += Math.sin(ang) * 14;
            c.lineTo(x, y);
            if (R() < 0.04 && wdt > 1) { c.stroke(); vein(x, y, ang + (R() - 0.5) * 1.6, len * 0.4, wdt * 0.6, alpha * 0.8, col); c.beginPath(); c.moveTo(x, y); }
          }
          c.stroke();
        };
        const vc = o.v || "rgba(255,255,255,A)";
        for (let i = 0; i < 7; i++) vein(R() * w, R() * h, R() * 6.28, 70, 1.2 + R() * 2.4, 0.18 + R() * 0.25, vc);
        for (let i = 0; i < 14; i++) vein(R() * w, R() * h, R() * 6.28, 30, 0.6, 0.12, vc);
      });
    },

    terrazzo(o) {
      return Look.paint("terrazzo" + o.c, 512, 512, (c, w, h) => {
        const R = Look.rng(55);
        c.fillStyle = Look.hex(o.c); c.fillRect(0, 0, w, h);
        const chips = o.chips || ["#e8e4dc", "#9aa4b4", "#5a6474", "#d8b48a", "#3a4050"];
        for (let i = 0; i < 2600; i++) {
          c.fillStyle = chips[Math.floor(R() * chips.length)];
          c.globalAlpha = 0.5 + R() * 0.5;
          const x = R() * w, y = R() * h, s = 1 + R() * (R() < 0.08 ? 9 : 3.5);
          c.beginPath();
          for (let k = 0; k < 5; k++) { const a = k * 1.256 + R(); c.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s); }
          c.fill();
        }
        c.globalAlpha = 1;
      });
    },

    checker(o) {
      return Look.paint("checker" + o.c + o.c2, 512, 512, (c, w, h) => {
        const R = Look.rng(9), n = 4, s = w / n;
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
          c.fillStyle = Look.shade((x + y) % 2 ? o.c : o.c2, 0.94 + R() * 0.1);
          c.fillRect(x * s, y * s, s, s);
        }
        for (let i = 0; i < 90; i++) { // scuffs
          c.strokeStyle = `rgba(0,0,0,${0.04 + R() * 0.06})`; c.lineWidth = 1 + R() * 2;
          const x = R() * w, y = R() * h;
          c.beginPath(); c.moveTo(x, y); c.lineTo(x + (R() - 0.5) * 60, y + (R() - 0.5) * 20); c.stroke();
        }
        c.strokeStyle = "rgba(0,0,0,0.35)"; c.lineWidth = 2;
        for (let i = 0; i <= n; i++) { c.beginPath(); c.moveTo(i * s, 0); c.lineTo(i * s, h); c.stroke(); c.beginPath(); c.moveTo(0, i * s); c.lineTo(w, i * s); c.stroke(); }
      });
    },

    tiles(o) {
      return Look.paint("tiles" + o.c + (o.n || 4), 512, 512, (c, w, h) => {
        const R = Look.rng(12), n = o.n || 4, s = w / n;
        c.fillStyle = Look.shade(o.c, 0.55); c.fillRect(0, 0, w, h);
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
          const g = c.createLinearGradient(x * s, y * s, x * s + s, y * s + s);
          const k = 0.92 + R() * 0.14;
          g.addColorStop(0, Look.shade(o.c, k * 1.06)); g.addColorStop(1, Look.shade(o.c, k * 0.94));
          c.fillStyle = g; c.fillRect(x * s + 3, y * s + 3, s - 6, s - 6);
        }
      });
    },

    flagstone(o) {
      return Look.paint("flag" + o.c, 512, 512, (c, w, h) => {
        const R = Look.rng(77);
        c.fillStyle = Look.shade(o.c, 0.45); c.fillRect(0, 0, w, h);
        const rows = 4;
        for (let r = 0; r < rows; r++) {
          let x = -R() * 80;
          const y = r * (h / rows);
          while (x < w) {
            const sw = 90 + R() * 110, k = 0.8 + R() * 0.35;
            c.fillStyle = Look.shade(o.c, k);
            c.beginPath();
            c.moveTo(x + 4 + R() * 4, y + 4 + R() * 3); c.lineTo(x + sw - 4 - R() * 4, y + 3 + R() * 4);
            c.lineTo(x + sw - 3 - R() * 5, y + h / rows - 4 - R() * 4); c.lineTo(x + 3 + R() * 5, y + h / rows - 3 - R() * 3);
            c.closePath(); c.fill();
            for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(${R() > 0.5 ? "255,255,255" : "0,0,0"},${R() * 0.06})`; c.fillRect(x + R() * sw, y + R() * h / rows, 3, 3); }
            x += sw;
          }
        }
      });
    },

    stonewall(o) {
      return Look.paint("stonewall" + o.c, 512, 512, (c, w, h) => {
        const R = Look.rng(41);
        c.fillStyle = Look.shade(o.c, 0.4); c.fillRect(0, 0, w, h);
        const rows = 7, rh = h / rows;
        for (let r = 0; r < rows; r++) {
          let x = (r % 2) * -40 - R() * 30;
          while (x < w) {
            const bw = 70 + R() * 70, k = 0.78 + R() * 0.4;
            const g = c.createLinearGradient(0, r * rh, 0, r * rh + rh);
            g.addColorStop(0, Look.shade(o.c, k * 1.1)); g.addColorStop(1, Look.shade(o.c, k * 0.85));
            c.fillStyle = g;
            c.beginPath();
            const pad = 3;
            c.moveTo(x + pad + R() * 3, r * rh + pad); c.lineTo(x + bw - pad, r * rh + pad + R() * 2);
            c.lineTo(x + bw - pad - R() * 2, r * rh + rh - pad); c.lineTo(x + pad, r * rh + rh - pad - R() * 2);
            c.closePath(); c.fill();
            x += bw;
          }
        }
      });
    },

    brick(o) {
      return Look.paint("brick" + o.c, 512, 512, (c, w, h) => {
        const R = Look.rng(23);
        c.fillStyle = o.m || "#8a8478"; c.fillRect(0, 0, w, h);
        const rows = 12, rh = h / rows, bw = w / 4;
        for (let r = 0; r < rows; r++) for (let i = -1; i < 5; i++) {
          const x = i * bw + (r % 2) * bw / 2;
          const k = 0.8 + R() * 0.35;
          c.fillStyle = Look.shade(o.c, k);
          c.fillRect(x + 3, r * rh + 3, bw - 6, rh - 6);
          c.fillStyle = `rgba(255,255,255,${R() * 0.06})`; c.fillRect(x + 3, r * rh + 3, bw - 6, 3);
        }
      });
    },

    concrete(o) {
      return Look.paint("concrete" + o.c, 512, 512, (c, w, h) => {
        const R = Look.rng(3);
        c.fillStyle = Look.hex(o.c); c.fillRect(0, 0, w, h);
        for (let i = 0; i < 50; i++) {
          const x = R() * w, y = R() * h, r = 30 + R() * 120;
          const g = c.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, `rgba(${R() > 0.5 ? "255,255,255" : "0,0,0"},${0.04 + R() * 0.05})`); g.addColorStop(1, "rgba(0,0,0,0)");
          c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
        }
        for (let i = 0; i < 4000; i++) { c.fillStyle = `rgba(${R() > 0.5 ? "255,255,255" : "0,0,0"},${R() * 0.07})`; c.fillRect(R() * w, R() * h, 1.5, 1.5); }
        c.strokeStyle = "rgba(0,0,0,0.3)"; c.lineWidth = 2;
        c.beginPath(); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.moveTo(w / 2, 0); c.lineTo(w / 2, h); c.stroke();
      });
    },

    carpet(o) {
      return Look.paint("carpet" + o.c + (o.stripe || ""), 256, 256, (c, w, h) => {
        const R = Look.rng(88);
        c.fillStyle = Look.hex(o.c); c.fillRect(0, 0, w, h);
        for (let i = 0; i < 7000; i++) { c.fillStyle = `rgba(${R() > 0.5 ? "255,255,255" : "0,0,0"},${R() * 0.09})`; c.fillRect(R() * w, R() * h, 1.4, 1.4); }
        if (o.stripe) { c.fillStyle = o.stripe; for (let x = 0; x < w; x += 64) c.fillRect(x, 0, 8, h); }
      });
    },

    damask(o) {
      return Look.paint("damask" + o.c + o.c2, 256, 256, (c, w, h) => {
        c.fillStyle = Look.hex(o.c); c.fillRect(0, 0, w, h);
        c.fillStyle = o.c2;
        const motif = (x, y, s) => {
          c.save(); c.translate(x, y); c.scale(s, s);
          c.beginPath();
          c.moveTo(0, -40);
          c.bezierCurveTo(22, -30, 26, -6, 8, 6); c.bezierCurveTo(24, 10, 20, 34, 0, 44);
          c.bezierCurveTo(-20, 34, -24, 10, -8, 6); c.bezierCurveTo(-26, -6, -22, -30, 0, -40);
          c.fill();
          c.beginPath(); c.arc(0, -2, 5, 0, Math.PI * 2); c.fillStyle = "rgba(0,0,0,0.2)"; c.fill();
          c.restore();
          c.fillStyle = o.c2;
        };
        motif(w / 2, h / 2, 1.1); motif(0, 0, 0.8); motif(w, 0, 0.8); motif(0, h, 0.8); motif(w, h, 0.8);
      });
    },

    panel(o) { // wood wainscot / wall paneling
      return Look.paint("panel" + o.c, 512, 512, (c, w, h) => {
        const base = Look.canvases.wood({ c: o.c, planks: 3 });
        c.drawImage(base, 0, 0, w, h);
        c.fillStyle = "rgba(0,0,0,0.25)";
        for (let i = 0; i < 2; i++) {
          const x = i * w / 2;
          c.strokeStyle = "rgba(0,0,0,0.45)"; c.lineWidth = 6; c.strokeRect(x + 22, 22, w / 2 - 44, h - 44);
          c.strokeStyle = "rgba(255,230,190,0.12)"; c.lineWidth = 2; c.strokeRect(x + 28, 28, w / 2 - 56, h - 56);
        }
      });
    },

    plaster(o) {
      return Look.paint("plaster" + o.c, 256, 256, (c, w, h) => {
        const R = Look.rng(5);
        c.fillStyle = Look.hex(o.c); c.fillRect(0, 0, w, h);
        for (let i = 0; i < 2500; i++) { c.fillStyle = `rgba(${R() > 0.5 ? "255,255,255" : "0,0,0"},${R() * 0.035})`; c.fillRect(R() * w, R() * h, 2, 2); }
      });
    },

    fabric(o) {
      return Look.paint("fabric" + o.c, 128, 128, (c, w, h) => {
        c.fillStyle = Look.hex(o.c); c.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y += 3) { c.fillStyle = "rgba(0,0,0,0.07)"; c.fillRect(0, y, w, 1); }
        for (let x = 0; x < w; x += 3) { c.fillStyle = "rgba(255,255,255,0.05)"; c.fillRect(x, 0, 1, h); }
      });
    },

    leather(o) {
      return Look.paint("leather" + o.c, 256, 256, (c, w, h) => {
        const R = Look.rng(66);
        c.fillStyle = Look.hex(o.c); c.fillRect(0, 0, w, h);
        for (let i = 0; i < 900; i++) {
          c.strokeStyle = `rgba(0,0,0,${R() * 0.12})`; c.lineWidth = 1;
          const x = R() * w, y = R() * h;
          c.beginPath(); c.moveTo(x, y); c.lineTo(x + (R() - 0.5) * 10, y + (R() - 0.5) * 10); c.stroke();
        }
      });
    },

    metal(o) {
      return Look.paint("metal" + o.c, 256, 256, (c, w, h) => {
        const R = Look.rng(14);
        c.fillStyle = Look.hex(o.c); c.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y++) { c.fillStyle = `rgba(${R() > 0.5 ? "255,255,255" : "0,0,0"},${R() * 0.07})`; c.fillRect(0, y, w, 1); }
      });
    },

    acoustic(o) {
      return Look.paint("acoustic" + o.c, 256, 256, (c, w, h) => {
        const R = Look.rng(101);
        c.fillStyle = Look.hex(o.c); c.fillRect(0, 0, w, h);
        for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
          c.fillStyle = Look.shade(o.c, 0.9 + R() * 0.2);
          c.fillRect(i * 64 + 2, j * 64 + 2, 60, 60);
        }
      });
    },
  },

  /* shared, cached textured material. Geometry supplies world-scaled UVs
     (see Kit.worldUV), so one material serves every wall/floor. */
  mat(kind, color, o = {}) {
    const key = "M" + kind + color + JSON.stringify(o);
    if (Look._mat[key]) return Look._mat[key];
    const cv = Look.canvases[kind](Object.assign({ c: color }, o));
    const m = new THREE.MeshStandardMaterial({
      map: Look.texFrom(cv, 1, 1),
      roughness: o.rough !== undefined ? o.rough : 0.75,
      metalness: o.metal !== undefined ? o.metal : 0.02,
      envMapIntensity: o.env !== undefined ? o.env : 0.8,
    });
    if (o.bump) { m.bumpMap = Look.texFrom(cv, 1, 1, false); m.bumpScale = o.bump; }
    m.userData.tile = o.tile || 2;
    Look._mat[key] = m;
    return m;
  },

  /* textured standard material; tile = metres per texture repeat */
  surf(kind, color, w, h, o = {}) {
    const cv = Look.canvases[kind](Object.assign({ c: color }, o));
    const tile = o.tile || 2;
    const map = Look.texFrom(cv, w / tile, h / tile);
    if (o.rot) map.rotation = o.rot;
    const m = new THREE.MeshStandardMaterial({
      map,
      roughness: o.rough !== undefined ? o.rough : 0.75,
      metalness: o.metal !== undefined ? o.metal : 0.02,
      envMapIntensity: o.env !== undefined ? o.env : 0.8,
    });
    if (o.bump) {
      const b = Look.texFrom(cv, w / tile, h / tile, false);
      m.bumpMap = b; m.bumpScale = o.bump;
    }
    return m;
  },

  /* a single, non-repeating rug texture */
  rug(kind, colors) {
    const key = "rug" + kind + colors.join();
    const [bg, fg, accent] = colors.map(Look.hex);
    const cv = Look.paint(key, 1024, 640, (c, w, h) => {
      const R = Look.rng(kind.length * 13);
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      if (kind === "persian") {
        const band = (inset, wd, col) => { c.strokeStyle = col; c.lineWidth = wd; c.strokeRect(inset, inset, w - inset * 2, h - inset * 2); };
        band(18, 14, fg); band(48, 5, accent); band(70, 22, fg); band(98, 4, accent);
        // border motif
        c.fillStyle = accent;
        for (let x = 80; x < w - 70; x += 36) { c.beginPath(); c.arc(x, 81, 5, 0, Math.PI * 2); c.arc(x, h - 81, 5, 0, Math.PI * 2); c.fill(); }
        for (let y = 80; y < h - 70; y += 36) { c.beginPath(); c.arc(81, y, 5, 0, Math.PI * 2); c.arc(w - 81, y, 5, 0, Math.PI * 2); c.fill(); }
        // medallion
        c.save(); c.translate(w / 2, h / 2);
        for (let r = 5; r > 0; r--) {
          c.fillStyle = r % 2 ? fg : accent;
          c.beginPath();
          for (let a = 0; a < 16; a++) {
            const ang = a / 16 * Math.PI * 2, rad = (a % 2 ? 0.72 : 1) * r * 34;
            c.lineTo(Math.cos(ang) * rad * 1.5, Math.sin(ang) * rad);
          }
          c.closePath(); c.fill();
        }
        c.restore();
        // field pattern
        c.globalAlpha = 0.25; c.fillStyle = fg;
        for (let i = 0; i < 60; i++) {
          const x = 130 + R() * (w - 260), y = 130 + R() * (h - 260);
          if (Math.hypot((x - w / 2) / 1.5, y - h / 2) < 190) continue;
          c.beginPath(); c.moveTo(x, y - 9); c.lineTo(x + 7, y); c.lineTo(x, y + 9); c.lineTo(x - 7, y); c.fill();
        }
        c.globalAlpha = 1;
      } else if (kind === "stripe") {
        for (let i = 0; i < 9; i++) { c.fillStyle = i % 2 ? fg : accent; c.fillRect(0, h * (0.1 + i * 0.09), w, h * 0.035); }
      } else if (kind === "border") {
        c.strokeStyle = fg; c.lineWidth = 26; c.strokeRect(30, 30, w - 60, h - 60);
        c.strokeStyle = accent; c.lineWidth = 6; c.strokeRect(70, 70, w - 140, h - 140);
      } else if (kind === "geo") {
        const s = 64;
        for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) {
          c.fillStyle = (x / s + y / s) % 2 ? fg : accent;
          c.beginPath(); c.moveTo(x + s / 2, y + 6); c.lineTo(x + s - 6, y + s / 2); c.lineTo(x + s / 2, y + s - 6); c.lineTo(x + 6, y + s / 2); c.fill();
        }
        c.strokeStyle = fg; c.lineWidth = 20; c.strokeRect(10, 10, w - 20, h - 20);
      }
      // pile noise
      for (let i = 0; i < 26000; i++) { c.fillStyle = `rgba(${R() > 0.5 ? "255,255,255" : "0,0,0"},${R() * 0.08})`; c.fillRect(R() * w, R() * h, 1.6, 1.6); }
    });
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  },

  /* ---------------- foliage (alpha cards) ---------------- */
  leaf(kind) {
    const cv = Look.paint("leaf" + kind, 256, 256, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      const base = { monstera: "#2f7d4a", fern: "#3f8f45", blade: "#3b7d3f", round: "#4a9a4c", palm: "#3c8a48", ivy: "#356f3a" }[kind] || "#3f8a48";
      const g = c.createLinearGradient(0, h, 0, 0);
      g.addColorStop(0, Look.shade(base, 0.7)); g.addColorStop(1, Look.shade(base, 1.25));
      c.fillStyle = g;
      if (kind === "monstera") {
        c.beginPath();
        c.moveTo(w / 2, h * 0.98);
        c.bezierCurveTo(w * 0.02, h * 0.8, w * 0.02, h * 0.2, w / 2, h * 0.04);
        c.bezierCurveTo(w * 0.98, h * 0.2, w * 0.98, h * 0.8, w / 2, h * 0.98);
        c.fill();
        c.globalCompositeOperation = "destination-out";
        for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
          c.lineWidth = 9; c.beginPath();
          c.moveTo(w / 2 + s * w * 0.46, h * (0.25 + i * 0.16));
          c.lineTo(w / 2 + s * w * 0.2, h * (0.32 + i * 0.16)); c.stroke();
        }
        c.globalCompositeOperation = "source-over";
      } else if (kind === "fern") {
        c.strokeStyle = Look.shade(base, 0.8); c.lineWidth = 4;
        c.beginPath(); c.moveTo(w / 2, h); c.quadraticCurveTo(w * 0.55, h * 0.5, w / 2, 4); c.stroke();
        for (let i = 0; i < 16; i++) {
          const y = h * (0.94 - i * 0.056), len = w * 0.4 * (1 - i / 18);
          for (const s of [-1, 1]) {
            c.beginPath(); c.ellipse(w / 2 + s * len / 2, y, len / 2, 6, s * -0.3, 0, Math.PI * 2); c.fill();
          }
        }
      } else if (kind === "blade") {
        c.beginPath(); c.moveTo(w * 0.4, h); c.quadraticCurveTo(w * 0.3, h * 0.4, w / 2, 0); c.quadraticCurveTo(w * 0.7, h * 0.4, w * 0.6, h); c.fill();
        c.strokeStyle = "rgba(220,210,90,0.8)"; c.lineWidth = 5;
        c.beginPath(); c.moveTo(w * 0.41, h); c.quadraticCurveTo(w * 0.31, h * 0.4, w / 2, 2); c.stroke();
        c.beginPath(); c.moveTo(w * 0.59, h); c.quadraticCurveTo(w * 0.69, h * 0.4, w / 2, 2); c.stroke();
        c.fillStyle = "rgba(20,50,20,0.35)";
        for (let i = 0; i < 8; i++) c.fillRect(w * 0.42, h * (0.15 + i * 0.1), w * 0.16, 4);
      } else if (kind === "palm") {
        c.strokeStyle = Look.shade(base, 0.8); c.lineWidth = 3;
        c.beginPath(); c.moveTo(w / 2, h); c.lineTo(w / 2, 6); c.stroke();
        for (let i = 0; i < 22; i++) {
          const y = h * (0.95 - i * 0.042);
          for (const s of [-1, 1]) {
            c.beginPath(); c.moveTo(w / 2, y); c.quadraticCurveTo(w / 2 + s * w * 0.25, y - 8, w / 2 + s * w * 0.46 * (1 - i / 30), y + 18); c.lineTo(w / 2, y + 5); c.fill();
          }
        }
      } else { // round / ivy
        c.beginPath(); c.moveTo(w / 2, h * 0.95);
        c.bezierCurveTo(w * 0.05, h * 0.7, w * 0.15, h * 0.08, w / 2, h * 0.1);
        c.bezierCurveTo(w * 0.85, h * 0.08, w * 0.95, h * 0.7, w / 2, h * 0.95); c.fill();
      }
      // midrib
      if (kind !== "fern" && kind !== "palm" && kind !== "blade") {
        c.strokeStyle = "rgba(200,240,180,0.35)"; c.lineWidth = 3;
        c.beginPath(); c.moveTo(w / 2, h * 0.95); c.lineTo(w / 2, h * 0.12); c.stroke();
      }
    });
    if (Look._mat["leaf" + kind]) return Look._mat["leaf" + kind];
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.65, metalness: 0 });
    Look._mat["leaf" + kind] = m;
    return m;
  },

  /* ---------------- special materials ---------------- */
  holo(color = 0x57d8ff, strength = 1) {
    const key = "holo" + color + strength;
    if (Look._mat[key]) return Look._mat[key];
    // standard material (so skinning/animation just work) + injected fresnel & scanlines
    const m = new THREE.MeshStandardMaterial({
      color: 0x06141c, emissive: color, emissiveIntensity: 1.1 * strength, roughness: 0.3, metalness: 0,
      transparent: true, opacity: 0.62, depthWrite: false,
    });
    const u = { uTime: { value: 0 } };
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = u.uTime;
      sh.fragmentShader = "uniform float uTime;" + String.fromCharCode(10) + sh.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
         float fres = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.0);
         float scan = 0.72 + 0.28 * sin(gl_FragCoord.y * 1.4 - uTime * 9.0);
         float flick = 0.92 + 0.08 * sin(uTime * 37.0) * sin(uTime * 13.0);
         totalEmissiveRadiance *= (0.35 + fres * 2.2) * scan * flick;`);
    };
    m.userData.u = u;
    Look._mat[key] = m;
    Look.holoMats = Look.holoMats || [];
    Look.holoMats.push(m);
    return m;
  },

  tick(t) { if (Look.holoMats) for (const m of Look.holoMats) m.userData.u.uTime.value = t; },

  /* raindrops streaking down glass — animated via map.offset */
  rainGlass() {
    if (Look._mat.rainGlass) return Look._mat.rainGlass;
    const cv = Look.paint("rainglass", 256, 512, (c, w, h) => {
      const R = Look.rng(404);
      c.clearRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) {
        const x = R() * w, y = R() * h, len = 20 + R() * 90;
        const g = c.createLinearGradient(x, y, x, y + len);
        g.addColorStop(0, "rgba(220,235,255,0)"); g.addColorStop(1, "rgba(220,235,255,0.55)");
        c.strokeStyle = g; c.lineWidth = 1 + R() * 1.4;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + (R() - 0.5) * 4, y + len); c.stroke();
        c.fillStyle = "rgba(230,240,255,0.6)";
        c.beginPath(); c.arc(x, y + len, 1.4 + R() * 1.6, 0, Math.PI * 2); c.fill();
      }
      for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(220,235,255,${0.2 + R() * 0.35})`; c.beginPath(); c.arc(R() * w, R() * h, 0.6 + R() * 1.3, 0, Math.PI * 2); c.fill(); }
    });
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3, 1.2);
    const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide, fog: false });
    Look._mat.rainGlass = m;
    return m;
  },
};
