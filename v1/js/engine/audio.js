/* ============================================================
   SPARSH HQ — audio.js
   Fully procedural WebAudio: generative ambient per floor,
   rain, and synthesized SFX. No audio assets required.
   ============================================================ */

const AudioSys = {
  ctx: null, master: null, musicBus: null, sfxBus: null, rainGain: null,
  muted: false, started: false,
  profile: null, timer: null, barCount: 0,

  // musical profile per floor: root midi, chord degrees, wave, tempo(ms/bar), brightness, rain level
  profiles: {
    P:   { root: 45, chords: [[0,3,7,10],[5,8,12],[3,7,10],[7,10,14]], wave: "sawtooth", bar: 3400, cutoff: 700,  rain: 0.5,  arp: 0.25, name: "night rain" },
    0:   { root: 52, chords: [[0,4,7,11],[5,9,12],[7,11,14],[2,5,9]],  wave: "triangle", bar: 2800, cutoff: 1200, rain: 0.08, arp: 0.5,  name: "warm lobby" },
    1:   { root: 48, chords: [[0,3,7],[8,12,15],[5,8,12],[10,14,17]],  wave: "sawtooth", bar: 2400, cutoff: 1000, rain: 0.05, arp: 0.7,  name: "focus" },
    2:   { root: 50, chords: [[0,4,7,9],[5,9,12],[3,7,10],[7,10,14]],  wave: "square",   bar: 2200, cutoff: 900,  rain: 0.05, arp: 0.8,  name: "lab synth" },
    3:   { root: 55, chords: [[0,4,7],[5,9,12],[2,5,9],[7,11,14]],     wave: "triangle", bar: 3000, cutoff: 1500, rain: 0.06, arp: 0.4,  name: "academia" },
    4:   { root: 50, chords: [[0,4,7,11],[7,11,14],[5,9,12],[0,4,7]],  wave: "sine",     bar: 3600, cutoff: 1800, rain: 0.04, arp: 0.3,  name: "gallery" },
    5:   { root: 47, chords: [[0,3,7,10],[3,7,10],[5,8,12],[7,10,14]], wave: "sawtooth", bar: 2000, cutoff: 800,  rain: 0.05, arp: 0.9,  name: "terminal" },
    6:   { root: 43, chords: [[0,3,7],[1,5,8],[3,7,10],[5,8,12]],      wave: "sawtooth", bar: 2600, cutoff: 600,  rain: 0.04, arp: 0.5,  name: "forge" },
    7:   { root: 50, chords: [[0,4,7,11],[5,9,12,16],[2,5,9],[7,11,14]],wave: "triangle",bar: 3800, cutoff: 1000, rain: 0.45, arp: 0.25, name: "penthouse rain" },
    D:   { root: 40, chords: [[0,3,6],[1,4,7],[0,3,6],[2,5,8]],        wave: "square",   bar: 3200, cutoff: 450,  rain: 0.0,  arp: 0.3,  name: "dungeon" },
  },

  init() {
    if (AudioSys.started) return;
    try {
      AudioSys.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return; }
    const c = AudioSys.ctx;
    AudioSys.master = c.createGain(); AudioSys.master.gain.value = 0.9; AudioSys.master.connect(c.destination);
    AudioSys.musicBus = c.createGain(); AudioSys.musicBus.gain.value = 0.5; AudioSys.musicBus.connect(AudioSys.master);
    AudioSys.sfxBus = c.createGain(); AudioSys.sfxBus.gain.value = 0.6; AudioSys.sfxBus.connect(AudioSys.master);

    // rain: looped filtered noise
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1400; bp.Q.value = 0.4;
    AudioSys.rainGain = c.createGain(); AudioSys.rainGain.gain.value = 0;
    src.connect(bp); bp.connect(AudioSys.rainGain); AudioSys.rainGain.connect(AudioSys.master);
    src.start();

    AudioSys.started = true;
    AudioSys.setFloor(Game.floorIndex);
  },

  midi(n) { return 440 * Math.pow(2, (n - 69) / 12); },

  setFloor(idx) {
    if (!AudioSys.started) return;
    AudioSys.profile = AudioSys.profiles[idx] || AudioSys.profiles[0];
    AudioSys.barCount = 0;
    if (AudioSys.timer) clearInterval(AudioSys.timer);
    const p = AudioSys.profile;
    AudioSys.rainGain.gain.setTargetAtTime(AudioSys.muted ? 0 : p.rain * 0.12, AudioSys.ctx.currentTime, 1.2);
    AudioSys.playBar();
    AudioSys.timer = setInterval(() => AudioSys.playBar(), p.bar);
  },

  playBar() {
    if (!AudioSys.started || AudioSys.muted || document.hidden) return;
    const c = AudioSys.ctx, p = AudioSys.profile, t = c.currentTime;
    const retro = Game.flags.retro;
    const chord = p.chords[AudioSys.barCount % p.chords.length];
    AudioSys.barCount++;
    const barSec = p.bar / 1000;

    // pad
    for (const deg of chord) {
      const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
      o.type = retro ? "square" : p.wave;
      o.frequency.value = AudioSys.midi(p.root + deg);
      o.detune.value = U.rand(-6, 6);
      f.type = "lowpass"; f.frequency.value = retro ? 2500 : p.cutoff;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(retro ? 0.02 : 0.035, t + barSec * 0.35);
      g.gain.linearRampToValueAtTime(0.0001, t + barSec * 1.05);
      o.connect(f); f.connect(g); g.connect(AudioSys.musicBus);
      o.start(t); o.stop(t + barSec * 1.1);
    }
    // sparse arp/pluck
    const steps = retro ? 8 : 4;
    for (let i = 0; i < steps; i++) {
      if (Math.random() > p.arp) continue;
      const st = t + (barSec / steps) * i + U.rand(0, 0.05);
      const o = c.createOscillator(), g = c.createGain();
      o.type = retro ? "square" : "triangle";
      const deg = U.pick(chord);
      o.frequency.value = AudioSys.midi(p.root + 12 + deg + (Math.random() < 0.3 ? 12 : 0));
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(retro ? 0.03 : 0.045, st + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.5);
      o.connect(g); g.connect(AudioSys.musicBus);
      o.start(st); o.stop(st + 0.55);
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
      case "blip":    AudioSys.tone(660, 0.08, "sine", 0.07); break;
      case "hover":   AudioSys.tone(880, 0.04, "sine", 0.03); break;
      case "open":    AudioSys.tone(440, 0.12, "sine", 0.06); AudioSys.tone(660, 0.14, "sine", 0.05, 0.06); break;
      case "close":   AudioSys.tone(520, 0.1, "sine", 0.05); AudioSys.tone(360, 0.12, "sine", 0.05, 0.05); break;
      case "chime":   AudioSys.tone(784, 0.4, "sine", 0.09); AudioSys.tone(1175, 0.5, "sine", 0.07, 0.12); break;
      case "doors":   AudioSys.noise(0.6, 0.05, 500); break;
      case "steps":   AudioSys.noise(0.05, 0.015, 900); break;
      case "type":    AudioSys.noise(0.03, 0.05, 3500); AudioSys.tone(U.rand(2000, 2600), 0.03, "square", 0.015); break;
      case "coffee":  AudioSys.noise(1.2, 0.06, 2500); break;
      case "confetti":AudioSys.tone(523, 0.15, "triangle", 0.08); AudioSys.tone(659, 0.15, "triangle", 0.08, 0.08); AudioSys.tone(784, 0.2, "triangle", 0.08, 0.16); AudioSys.noise(0.3, 0.05, 4000); break;
      case "portal":  AudioSys.tone(200, 0.7, "sawtooth", 0.08, 0, 900); AudioSys.noise(0.7, 0.04, 1200); break;
      case "died":    AudioSys.tone(110, 2.2, "sawtooth", 0.1, 0, -40); AudioSys.tone(55, 2.6, "sine", 0.12, 0.1); break;
      case "secret":  AudioSys.tone(392, 0.12, "square", 0.06); AudioSys.tone(523, 0.12, "square", 0.06, 0.1); AudioSys.tone(659, 0.12, "square", 0.06, 0.2); AudioSys.tone(784, 0.25, "square", 0.07, 0.3); break;
      case "alarm":   AudioSys.tone(880, 0.18, "square", 0.07); AudioSys.tone(740, 0.18, "square", 0.07, 0.2); break;
      case "whoosh":  AudioSys.noise(0.5, 0.06, 800); break;
      case "pop":     AudioSys.tone(300, 0.09, "sine", 0.08, 0, 260); break;
    }
  },

  toggleMute() {
    AudioSys.muted = !AudioSys.muted;
    if (AudioSys.started) {
      AudioSys.master.gain.setTargetAtTime(AudioSys.muted ? 0 : 0.9, AudioSys.ctx.currentTime, 0.1);
    }
    return AudioSys.muted;
  },
};
