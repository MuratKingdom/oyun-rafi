(function () {
  var GROW = 5, SPOIL = 4, DAY_LEN = 12, WIN_DAY = 15, PLOTS = 6, START_GRAIN = 4;

  function rand(s) { // mulberry32, durum s.rs içinde
    s.rs = (s.rs + 0x6D2B79F5) | 0;
    var t = Math.imul(s.rs ^ (s.rs >>> 15), 1 | s.rs);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function needFor(day) { return 2 + day; }

  function createState(seed) {
    var plots = [];
    for (var i = 0; i < PLOTS; i++) plots.push({ s: 0, t: 0, y: 0 });
    return {
      status: 'playing', overReason: '', seed: seed, rs: seed | 0,
      day: 1, dayT: 0, dayLen: DAY_LEN, grain: START_GRAIN, need: needFor(1),
      plots: plots, score: 0, winDay: WIN_DAY, grow: GROW, spoil: SPOIL, events: []
    };
  }

  function act(s, i) {
    var p = s.plots[i];
    if (!p) return;
    if (p.s === 0) {
      if (s.grain < 1) { s.events.push({ k: 'deny', i: i }); return; }
      s.grain -= 1; p.s = 1; p.t = 0; p.y = 2 + Math.floor(rand(s) * 3); // 2..4
      s.events.push({ k: 'plant', i: i });
    } else if (p.s === 2) {
      s.grain += p.y; s.events.push({ k: 'harvest', i: i, n: p.y });
      p.s = 0; p.t = 0; p.y = 0;
    }
  }

  function step(s, input, dt) {
    if (s.status !== 'playing') return s;
    s.events = [];
    if (input && typeof input.plot === 'number' && input.plot >= 0) act(s, input.plot);
    for (var i = 0; i < s.plots.length; i++) {
      var p = s.plots[i];
      if (p.s === 1) { p.t += dt; if (p.t >= s.grow) { p.s = 2; p.t = 0; s.events.push({ k: 'ripe', i: i }); } }
      else if (p.s === 2) { p.t += dt; if (p.t >= s.spoil) { p.s = 0; p.t = 0; p.y = 0; s.events.push({ k: 'spoil', i: i }); } }
    }
    s.dayT += dt;
    if (s.dayT >= s.dayLen) {
      s.dayT -= s.dayLen;
      if (s.grain < s.need) {
        s.status = 'over';
        s.overReason = 'Kıtlık: gün ' + s.day + ' sonunda ' + s.need + ' tahıl gerekti, ' + s.grain + ' vardı';
        s.events.push({ k: 'over' });
        return s;
      }
      s.grain -= s.need; s.score = s.day; s.day += 1; s.need = needFor(s.day);
      s.events.push({ k: 'eat' });
      if (s.day > s.winDay) { s.status = 'won'; s.events.push({ k: 'won' }); }
    }
    return s;
  }

  if (typeof module !== 'undefined') module.exports = { createState: createState, step: step };
  if (typeof window !== 'undefined') window.GameLogic = { createState: createState, step: step };
})();
