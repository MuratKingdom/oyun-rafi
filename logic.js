'use strict';
// Saf oyun mantigi: DOM yok, canvas yok. Rastgelelik state icindeki seed'den gelir.
const GameLogicApi = (function () {
  const C = { TRACK: 900, START: 30, A: 200, VMAX: 800, CHARGE: 0.6, WIN_LEVEL: 12, RESULT_T: 0.6, MIN_POWER: 0.05 };

  function rnd(s) {
    s.rng = (s.rng + 0x6D2B79F5) | 0;
    let t = s.rng;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function genLevel(s) {
    const L = s.level;
    s.tw = Math.max(60, 120 - L * 6);
    s.tx = Math.round(260 + rnd(s) * (770 - 260 - s.tw));
    s.patches = [];
    const n = L < 2 ? 0 : (L < 6 ? 1 : 2);
    for (let i = 0; i < n; i++) {
      const len = Math.round(100 + rnd(s) * 80);
      const x0 = Math.round(90 + rnd(s) * (820 - len - 90));
      const k = rnd(s) < 0.5 ? 0.6 : 1.8;
      s.patches.push({ x0: x0, x1: x0 + len, k: k });
    }
    s.x = C.START; s.v = 0; s.power = 0; s.holding = false; s.phase = 'aim'; s.timer = 0;
  }

  function createState(seed) {
    const s = {
      seed: seed, rng: seed | 0, status: 'playing', overReason: '', score: 0, level: 0,
      phase: 'aim', power: 0, holding: false, x: C.START, v: 0, tx: 0, tw: 0, patches: [],
      timer: 0, t: 0, flash: 0, event: ''
    };
    genLevel(s);
    return s;
  }

  function kAt(s, x) {
    for (let i = 0; i < s.patches.length; i++) {
      if (x >= s.patches[i].x0 && x <= s.patches[i].x1) return s.patches[i].k;
    }
    return 1;
  }

  function lose(s, reason, ev) {
    s.status = 'over'; s.overReason = reason; s.event = ev; s.flash = 0.2;
  }

  function resolveStop(s) {
    if (s.x >= s.tx && s.x <= s.tx + s.tw) {
      const mid = s.tx + s.tw / 2;
      const bonus = Math.round(50 * (1 - Math.abs(s.x - mid) / (s.tw / 2)));
      s.score += 100 + bonus;
      s.level += 1;
      s.event = 'hit';
      s.flash = 0.15;
      if (s.level >= C.WIN_LEVEL) { s.status = 'won'; return; }
      s.phase = 'result'; s.timer = C.RESULT_T;
    } else if (s.x < s.tx) {
      lose(s, 'Hedefe ulaşmadın', 'miss');
    } else {
      lose(s, 'Hedefi geçtin', 'miss');
    }
  }

  function step(s, input, dt) {
    s.event = '';
    if (s.status !== 'playing') return s;
    s.t += dt;
    if (s.flash > 0) s.flash -= dt;
    if (s.phase === 'aim') {
      if (input.action) {
        s.holding = true;
        s.power = Math.min(1, s.power + C.CHARGE * dt);
      } else if (s.holding) {
        s.holding = false;
        if (s.power < C.MIN_POWER) { s.power = 0; }
        else { s.v = s.power * C.VMAX; s.phase = 'slide'; s.event = 'launch'; }
      }
    } else if (s.phase === 'slide') {
      s.v -= C.A * kAt(s, s.x) * dt;
      if (s.v <= 0) { s.v = 0; resolveStop(s); }
      else {
        s.x += s.v * dt;
        if (s.x > C.TRACK) { s.x = C.TRACK; lose(s, 'Pistten düştün', 'fall'); }
      }
    } else if (s.phase === 'result') {
      s.timer -= dt;
      if (s.timer <= 0) genLevel(s);
    }
    return s;
  }

  return { createState: createState, step: step, C: C };
})();
const createState = GameLogicApi.createState, step = GameLogicApi.step;
if (typeof module !== 'undefined') module.exports = { createState, step, C: GameLogicApi.C };
if (typeof window !== 'undefined') window.GameLogic = { createState, step, C: GameLogicApi.C };
