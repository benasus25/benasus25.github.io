/* ============================================================
   SPARSH HQ v2 — audio.js
   Procedural WebAudio: generative ambient per floor, rain,
   thunder, and synthesized SFX. Zero audio files.
   ============================================================ */

const AudioSys = {
  ctx: null, master: null, musicBus: null, sfxBus: null, rainGain: null,
  muted: false, started: false, retro: false,
  profile: null, timer: null, barCount: 0,

  profiles: {
    P: { root: 45, chords: [[0, 3, 7, 10], [5, 8, 12], [3, 7, 10], [7, 10, 14]], wave: "sawtooth", bar: 3400, cutoff: 650, arp: 0.2 },
    0: { root: 50, chords: [[0, 4, 7, 11], [5, 9, 12], [2, 5, 9], [7, 11, 14]], wave: "triangle", bar: 3200, cutoff: 900, arp: 0.35 },   // continental: warm jazz-ish
    1: { root: 48, chords: [[0, 3, 7], [8, 12, 15], [5, 8, 12], [10, 14, 17]], wave: "sawtooth", bar: 2300, cutoff: 1000, arp: 0.7 },  // engineering: focus pulse
    2: { root: 50, chords: [[0, 4, 7, 9], [5, 9, 12], [3, 7, 10], [7, 10, 14]], wave: "square", bar: 2100, cutoff: 850, arp: 0.8 },    // labs: synth
    3: { root: 55, chords: [[0, 4, 7], [5, 9, 12], [2, 5, 9], [7, 11, 14]], wave: "triangle", bar: 3100, cutoff: 1500, arp: 0.45 },    // hogwarts: bells
    4: { root: 43, chords: [[0, 3, 7], [1, 5, 8], [3, 7, 10], [5, 8, 12]], wave: "sawtooth", bar: 2600, cutoff: 550, arp: 0.5 },       // forge
    5: { root: 52, chords: [[0, 4, 7, 11], [5, 9, 12, 16], [2, 5, 9], [0, 4, 7]], wave: "sine", bar: 3800, cutoff: 1400, arp: 0.25 },  // library: sparse
    6: { root: 47, chords: [[0, 4, 7, 10], [5, 9, 12], [7, 10, 14], [2, 5, 9]], wave: "triangle", bar: 2000, cutoff: 1100, arp: 0.75 },// precinct: upbeat
    7: { root: 50, chords: [[0, 4, 7, 11], [5, 9, 12, 16], [2, 5, 9], [7, 11, 14]], wave: "triangle", bar: 4000, cutoff: 900, arp: 0.2 },// penthouse: slow, Zimmer-ish
  },

  init() {
    if (AudioSys.started) return;
    try { AudioSys.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const c = AudioSys.ctx;
    AudioSys.master = c.createGain(); AudioSys.master.gain.value = 0.9; AudioSys.master.connect(c.destination);
    AudioSys.musicBus = c.createGain(); AudioSys.musicBus.gain.value = 0.42; AudioSys.musicBus.connect(AudioSys.master);
    AudioSys.sfxBus = c.createGain(); AudioSys.sfxBus.gain.value = 0.6; AudioSys.sfxBus.connect(AudioSys.master);
    // rain loop
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1300; bp.Q.value = 0.35;
    AudioSys.rainGain = c.createGain(); AudioSys.rainGain.gain.value = 0;
    src.connect(bp); bp.connect(AudioSys.rainGain); AudioSys.rainGain.connect(AudioSys.master);
    src.start();
    AudioSys.started = true;
  },

  midi(n) { return 440 * Math.pow(2, (n - 69) / 12); },

  setFloor(idx) {
    if (!AudioSys.started) return;
    AudioSys.profile = AudioSys.profiles[idx] || AudioSys.profiles[0];
    AudioSys.barCount = 0;
    if (AudioSys.timer) clearInterval(AudioSys.timer);
    AudioSys.playBar();
    AudioSys.timer = setInterval(() => AudioSys.playBar(), AudioSys.profile.bar);
  },

  setRain(level) { // 0..1 — outdoor loudness handled by caller
    if (!AudioSys.started || AudioSys.muted) return;
    AudioSys.rainGain.gain.setTargetAtTime(level * 0.11, AudioSys.ctx.currentTime, 1.5);
  },

  thunder() {
    if (!AudioSys.started || AudioSys.muted) return;
    const c = AudioSys.ctx, t = c.currentTime;
    const len = c.sampleRate * 2.2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.6);
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.setValueAtTime(320, t); f.frequency.exponentialRampToValueAtTime(60, t + 2);
    const g = c.createGain(); g.gain.setValueAtTime(0.22, t);
    s.connect(f); f.connect(g); g.connect(AudioSys.master);
    s.start(t);
  },

  playBar() {
    if (!AudioSys.started || AudioSys.muted || document.hidden || !AudioSys.profile) return;
    const c = AudioSys.ctx, p = AudioSys.profile, t = c.currentTime;
    const retro = AudioSys.retro;
    const chord = p.chords[AudioSys.barCount % p.chords.length];
    AudioSys.barCount++;
    const barSec = p.bar / 1000;
    for (const deg of chord) {
      const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
      o.type = retro ? "square" : p.wave;
      o.frequency.value = AudioSys.midi(p.root + deg);
      o.detune.value = (Math.random() - 0.5) * 12;
      f.type = "lowpass"; f.frequency.value = retro ? 2500 : p.cutoff;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(retro ? 0.02 : 0.032, t + barSec * 0.35);
      g.gain.linearRampToValueAtTime(0.0001, t + barSec * 1.05);
      o.connect(f); f.connect(g); g.connect(AudioSys.musicBus);
      o.start(t); o.stop(t + barSec * 1.1);
    }
    const steps = retro ? 8 : 4;
    for (let i = 0; i < steps; i++) {
      if (Math.random() > p.arp) continue;
      const st = t + (barSec / steps) * i + Math.random() * 0.05;
      const o = c.createOscillator(), g = c.createGain();
      o.type = retro ? "square" : "triangle";
      o.frequency.value = AudioSys.midi(p.root + 12 + U.pick(chord) + (Math.random() < 0.3 ? 12 : 0));
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(retro ? 0.028 : 0.04, st + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.55);
      o.connect(g); g.connect(AudioSys.musicBus);
      o.start(st); o.stop(st + 0.6);
    }
  },

  tone(freq, dur, type = "sine", vol = 0.12, when = 0, slide = 0) {
    if (!AudioSys.started || AudioSys.muted) return;
    const c = AudioSys.ctx, t = c.currentTime + when;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(AudioSys.sfxBus);
    o.start(t); o.stop(t + dur + 0.05);
  },

  noise(dur, vol = 0.1, freq = 2000, when = 0) {
    if (!AudioSys.started || AudioSys.muted) return;
    const c = AudioSys.ctx, t = c.currentTime + when;
    const len = c.sampleRate * dur, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq;
    const g = c.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(AudioSys.sfxBus);
    s.start(t);
  },

  sfx(name) {
    switch (name) {
      case "blip": AudioSys.tone(660, 0.08, "sine", 0.06); break;
      case "open": AudioSys.tone(440, 0.12, "sine", 0.05); AudioSys.tone(660, 0.14, "sine", 0.045, 0.06); break;
      case "close": AudioSys.tone(520, 0.1, "sine", 0.04); AudioSys.tone(360, 0.12, "sine", 0.04, 0.05); break;
      case "chime": AudioSys.tone(784, 0.5, "sine", 0.09); AudioSys.tone(1175, 0.6, "sine", 0.06, 0.1); break;
      case "doors": AudioSys.noise(0.7, 0.045, 450); break;
      case "step": AudioSys.noise(0.045, 0.012, 800 + Math.random() * 300); break;
      case "type": AudioSys.noise(0.03, 0.04, 3500); break;
      case "coffee": AudioSys.noise(1.1, 0.05, 2500); AudioSys.tone(160, 0.8, "sine", 0.02, 0.1); break;
      case "confetti": AudioSys.tone(523, 0.15, "triangle", 0.07); AudioSys.tone(659, 0.15, "triangle", 0.07, 0.08); AudioSys.tone(784, 0.2, "triangle", 0.07, 0.16); AudioSys.noise(0.3, 0.04, 4000); break;
      case "died": AudioSys.tone(110, 2.2, "sawtooth", 0.1, 0, -40); AudioSys.tone(55, 2.6, "sine", 0.11, 0.1); break;
      case "secret": AudioSys.tone(392, 0.12, "square", 0.05); AudioSys.tone(523, 0.12, "square", 0.05, 0.1); AudioSys.tone(659, 0.12, "square", 0.05, 0.2); AudioSys.tone(784, 0.25, "square", 0.06, 0.3); break;
      case "whoosh": AudioSys.noise(0.5, 0.05, 700); break;
      case "pop": AudioSys.tone(300, 0.09, "sine", 0.07, 0, 260); break;
      case "page": AudioSys.noise(0.18, 0.035, 1800); break;
    }
  },

  toggleMute() {
    AudioSys.muted = !AudioSys.muted;
    if (AudioSys.started) AudioSys.master.gain.setTargetAtTime(AudioSys.muted ? 0 : 0.9, AudioSys.ctx.currentTime, 0.1);
    return AudioSys.muted;
  },
};
