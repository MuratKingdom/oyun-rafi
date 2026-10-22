(function () {
  var W = 480, BH = 22, GAP = 150, G = 2600, BASE_W = 220;

  function rnd(s) {
    s.rng = (s.rng + 0x6D2B79F5) | 0;
    var t = s.rng;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function speed(s) { return Math.min(130 + 9 * s.score, 380); }

  function nextBlock(s) {
    var wmax = Math.max(70, 120 - 1.5 * s.score);
    var wmin = Math.max(46, 60 - 0.5 * s.score);
    var w = Math.round(wmin + rnd(s) * (wmax - wmin));
    var dir = rnd(s) < 0.5 ? 1 : -1;
    s.cur = {
      x: dir > 0 ? w / 2 : W - w / 2,
      y: s.stack.length * BH + GAP,
      w: w, dir: dir, vy: 0
    };
    s.phase = 'swing';
  }

  function createState(seed) {
    var s = {
      seed: seed, rng: seed | 0, status: 'playing', overReason: '',
      score: 0, perfect: 0, time: 0, phase: 'swing',
      stack: [{ x: W / 2, w: BASE_W }], cur: null, prevAction: false,
      overT: 0, failIdx: -1, topple: 0, missFall: false, margin: 1, events: []
    };
    nextBlock(s);
    return s;
  }

  function fail(s, reason) {
    s.status = 'over';
    s.overReason = reason;
    s.events.push('over');
  }

  function land(s) {
    var top = s.stack[s.stack.length - 1], c = s.cur;
    var lo = Math.max(c.x - c.w / 2, top.x - top.w / 2);
    var hi = Math.min(c.x + c.w / 2, top.x + top.w / 2);
    if (hi - lo <= 2) {
      s.missFall = true;
      fail(s, 'Blok kuleyi ıskaladı');
      return;
    }
    var isPerfect = Math.abs(c.x - top.x) <= 5;
    if (isPerfect) c.x = top.x;
    s.stack.push({ x: c.x, w: c.w });

    var sumM = 0, sumMX = 0, minMargin = 999;
    for (var i = s.stack.length - 1; i >= 1; i--) {
      var b = s.stack[i], p = s.stack[i - 1];
      sumM += b.w;
      sumMX += b.w * b.x;
      var com = sumMX / sumM;
      var a = Math.max(b.x - b.w / 2, p.x - p.w / 2);
      var e = Math.min(b.x + b.w / 2, p.x + p.w / 2);
      if (com < a || com > e) {
        s.failIdx = i;
        s.topple = com < a ? -1 : 1;
        fail(s, 'Kule devrildi: ağırlık merkezi dayanağın dışında');
        return;
      }
      minMargin = Math.min(minMargin, com - a, e - com);
    }
    s.margin = minMargin;
    if (isPerfect) {
      s.score += 2;
      s.perfect += 1;
      s.events.push('perfect');
    } else {
      s.score += 1;
      s.perfect = 0;
      s.events.push('land');
    }
    nextBlock(s);
  }

  function step(s, input, dt) {
    s.events = [];
    var press = !!input.action && !s.prevAction;
    s.prevAction = !!input.action;
    if (s.status !== 'playing') {
      s.overT += dt;
      if (s.missFall) { s.cur.vy += G * dt; s.cur.y -= s.cur.vy * dt; }
      return;
    }
    s.time += dt;
    var c = s.cur;
    if (s.phase === 'swing') {
      c.x += c.dir * speed(s) * dt;
      if (c.x < c.w / 2) { c.x = c.w / 2; c.dir = 1; }
      else if (c.x > W - c.w / 2) { c.x = W - c.w / 2; c.dir = -1; }
      if (press) { s.phase = 'fall'; c.vy = 0; s.events.push('drop'); }
    } else {
      c.vy += G * dt;
      c.y -= c.vy * dt;
      var topY = s.stack.length * BH;
      if (c.y <= topY) { c.y = topY; land(s); }
    }
  }

  var api = { createState: createState, step: step, W: W, BH: BH };
  if (typeof module !== 'undefined') module.exports = { createState: createState, step: step, W: W, BH: BH };
  if (typeof window !== 'undefined') window.GameLogic = api;
})();
