'use strict';
(function () {
  var C = {
    DAY: 20, NIGHT: 12, TRAVEL: 1.0, WOOD_RATE: 2.2, FOOD_RATE: 1.6,
    CAP: 30, WIN: 8, START_WOOD: 12, START_FOOD: 8
  };

  function rnd(s) {
    s.rng = (s.rng + 0x6D2B79F5) | 0;
    var t = s.rng;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function nightWood(night, sev) { return (5 + 1.5 * night) * sev; }
  function nightFood(night) { return Math.ceil(3 + night); }

  function emit(s, name) {
    s.events.push(name);
    if (s.events.length > 50) s.events.shift();
  }

  function rollSeverity(s) {
    return 1 + Math.floor(rnd(s) * 3) * 0.15;
  }

  function createState(seed) {
    var s = {
      seed: seed, rng: seed | 0, status: 'playing', overReason: '',
      score: 0, night: 1, phase: 'day', t: 0,
      wood: C.START_WOOD, food: C.START_FOOD,
      target: 'wood', at: 'wood', travel: 0, pulse: 0,
      severity: 1, events: []
    };
    s.severity = rollSeverity(s);
    return s;
  }

  function lose(s, reason) {
    s.status = 'over';
    s.overReason = reason;
    emit(s, 'over');
  }

  function step(s, input, dt) {
    if (s.status !== 'playing') return s;
    var want = s.target;
    if (input.choice === 'wood' || input.choice === 'food') want = input.choice;
    if (input.action) want = s.target === 'wood' ? 'food' : 'wood';
    if (want !== s.target) { s.target = want; emit(s, 'switch'); }

    if (s.phase === 'day') {
      if (s.at === s.target) s.travel = 0;
      else if (s.travel <= 0) s.travel = C.TRAVEL;
      if (s.travel > 0) {
        s.travel -= dt;
        if (s.travel <= 0) { s.travel = 0; s.at = s.target; }
      } else {
        var rate = s.at === 'wood' ? C.WOOD_RATE : C.FOOD_RATE;
        var key = s.at;
        s[key] = Math.min(C.CAP, s[key] + rate * dt);
        s.pulse += rate * dt;
        if (s.pulse >= 1) { s.pulse -= 1; emit(s, 'gather'); }
      }
      s.t += dt;
      if (s.t >= C.DAY) { s.phase = 'night'; s.t = 0; s.travel = 0; emit(s, 'dusk'); }
    } else {
      s.wood -= nightWood(s.night, s.severity) / C.NIGHT * dt;
      if (s.wood < -1e-9) { s.wood = 0; lose(s, 'Ateş söndü: odun bitti'); return s; }
      s.t += dt;
      if (s.t >= C.NIGHT) {
        var need = nightFood(s.night);
        if (s.food + 1e-9 < need) { s.food = 0; lose(s, 'Yiyecek yetmedi: sabah aç kalındı'); return s; }
        s.food -= need;
        s.score = s.night * 10;
        if (s.night >= C.WIN) { s.status = 'won'; emit(s, 'won'); return s; }
        s.night += 1; s.phase = 'day'; s.t = 0;
        s.severity = rollSeverity(s);
        emit(s, 'dawn');
      }
    }
    return s;
  }

  var api = { createState: createState, step: step, C: C, nightWood: nightWood, nightFood: nightFood };
  if (typeof module !== 'undefined') module.exports = api;
  if (typeof window !== 'undefined') window.GameLogic = api;
})();
