/* ============================================================
   SPARSH HQ v3 — analytics.js
   Google Analytics 4 (+ optional Microsoft Clarity), wired to the
   things that matter in a walkable portfolio: which floors people
   reach, what they open, how long they stay, who gets in touch.

   Off until CONTENT.analytics.ga4 holds a real "G-…" id.
   Add #analytics_debug (or ?analytics_debug) to the URL to log
   every event to the console even when GA is off.
   No personal data is ever sent — guest-book contents, chat text
   and emails stay out of analytics; only intents and ids go in.
   If Clarity is enabled, the chat and guest book are masked from
   its session replays (see Cards.init). Visitors in the EEA, UK
   and Switzerland get cookieless measurement by default.
   ============================================================ */

const Analytics = {
  on: false, debug: false, floor: null, floorT: 0, milestones: new Set(),

  init() {
    const cfg = (typeof CONTENT !== "undefined" && CONTENT.analytics) || {};
    const local = location.protocol === "file:" || /^(localhost|127\.|\[::1\]|0\.0\.0\.0)/.test(location.hostname) || /\.(localhost|test)$/.test(location.hostname);
    Analytics.debug = /analytics_debug/.test(location.search + location.hash);
    const allowed = !(local && cfg.skipLocalhost !== false);

    if (cfg.ga4 && /^G-[A-Z0-9]{4,}$/.test(cfg.ga4) && allowed) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      // analytics only — no advertising signals, no ad personalisation
      gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "granted" });
      // Europe (GDPR/ePrivacy): cookieless by default - GA consent mode still counts these visits as modelled data
      gtag("consent", "default", { analytics_storage: "denied", region: ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO", "GB", "CH"] });
      gtag("js", new Date());
      gtag("config", cfg.ga4, { send_page_view: true });
      const s = document.createElement("script");
      s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(cfg.ga4);
      document.head.appendChild(s);
      Analytics.on = true;
    }
    if (cfg.clarity && /^[a-z0-9]{6,}$/i.test(cfg.clarity) && allowed) {
      Analytics.replay = true;
      (function (c, l, a, r, i, t, y) {
        c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
        t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
        y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
      })(window, document, "clarity", "script", cfg.clarity);
    }

    // links: résumé downloads, contact and outbound clicks (delegated, so every panel is covered)
    document.addEventListener("click", (e) => {
      const a = e.target.closest && e.target.closest("a[href]");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      if (/Resume\.pdf$/i.test(href)) Analytics.event("resume_download", { source: Analytics.where(a) });
      else if (href.startsWith("mailto:")) Analytics.event("contact_click", { method: "email", source: Analytics.where(a) });
      else if (/linkedin\.com/.test(href)) Analytics.event("contact_click", { method: "linkedin", source: Analytics.where(a) });
      else if (/^https?:/.test(href)) {
        let host = ""; try { host = new URL(href).hostname; } catch (err) {}
        Analytics.event("link_open", { link_domain: host, link_url: href.slice(0, 100), source: Analytics.where(a) });
      } else if (/^v1\/?$/.test(href)) Analytics.event("classic_tour_open", {});
    }, true);

    // time on the current floor when the tab is hidden / closed
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") Analytics.leaveFloor();
      else Analytics.floorT = performance.now();
    });

    // a rough frame-rate sample after 25 s — tells us whether the building runs well for real visitors
    if (!Analytics.on && !Analytics.debug) return;
    let frames = 0, t0 = 0, last = 0;
    const tick = (t) => {
      if (document.hidden || (last && t - last > 250)) { frames = 0; t0 = t; }      // a hidden tab or a hitch restarts the window
      last = t;
      if (!t0) t0 = t;
      frames++;
      if (t - t0 < 20000) { requestAnimationFrame(tick); return; }
      Analytics.event("perf_sample", { fps: Math.round(frames / ((t - t0) / 1000)), dpr: Math.round((window.devicePixelRatio || 1) * 10) / 10, mobile: matchMedia("(pointer: coarse)").matches ? "yes" : "no" });
    };
    setTimeout(() => requestAnimationFrame(tick), 8000);
  },

  where(el) {
    if (el.closest("#dossier")) return "resume_page";
    if (el.closest("#panel")) return "card";
    if (el.closest("#modal")) return "modal";
    if (el.closest("#splash")) return "splash";
    if (el.closest("#chat")) return "chat";
    return "hud";
  },

  event(name, params = {}) {
    if (Analytics.debug) console.log("%c[analytics]", "color:#d8a54a", name, params);
    if (Analytics.on && window.gtag) window.gtag("event", name, params);
  },

  /* each floor is a virtual page, so GA's "Pages and screens" report reads like a floor plan */
  enterFloor(idx, via) {
    Analytics.leaveFloor();
    const meta = idx === "P" ? { name: "The Plaza" } : CONTENT.floors[idx];
    const slug = idx === "P" ? "plaza" : `floor-${idx}-${meta.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "")}`;
    Analytics.floor = idx; Analytics.floorT = performance.now();
    const title = `Sparsh HQ — ${idx === "P" ? "Plaza" : "F" + idx + " " + meta.name}`;
    if (Analytics.debug) console.log("%c[analytics]", "color:#d8a54a", "page_view", "/" + slug);
    const loc = location.origin + location.pathname + "#/" + slug;
    if (Analytics.on && window.gtag) {
      window.gtag("set", { page_title: title, page_location: loc });     // later events on this floor carry its page
      window.gtag("event", "page_view", { page_title: title, page_location: loc });
    }
    Analytics.event("floor_enter", { floor_id: String(idx), floor_name: meta.name, via: via || "walk" });
  },
  leaveFloor() {
    if (Analytics.floor === null) return;
    const sec = Math.round((performance.now() - Analytics.floorT) / 1000);
    if (sec >= 2) Analytics.event("floor_time", { floor_id: String(Analytics.floor), seconds: sec });
    Analytics.floorT = performance.now();
  },

  explored(n, total) {
    for (const m of [3, 10, 20, total]) if (n >= m && !Analytics.milestones.has(m)) {
      Analytics.milestones.add(m);
      Analytics.event("explore_milestone", { seen: n, total, complete: n >= total ? "yes" : "no" });
    }
  },
};

Analytics.init();
