// Kıvılcım Zinciri — saf oyun mantığı (DOM yok)
var C = {
  W: 480, H: 360,
  ORB_R: 7,
  CURSOR_SPEED: 320,
  GROW: 0.22, HOLD: 0.8, SHRINK: 0.22,
  BURST_R: 40,
  AIM_TIME: 9,
  LEVELS: 10,
  SPEED_MIN: 45, SPEED_MAX: 95
};

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// PRNG durumu state.rng içinde sayı olarak tutulur (JSON ile kopyalanabilir)
function rnd(s) {
  var r = mulberry32(s.rng)();
  s.rng = (s.rng + 0x6D2B79F5) | 0;
  return r;
}

function orbCount(level) { return Math.min(40, 14 + 3 * (level - 1)); }
function quotaFor(level, n) { return Math.ceil(n * Math.min(0.75, 0.25 + 0.04 * (level - 1))); }

function spawnLevel(s) {
  var n = orbCount(s.level);
  s.orbs = [];
  for (var i = 0; i < n; i++) {
    var a = rnd(s) * Math.PI * 2;
    var sp = C.SPEED_MIN + rnd(s) * (C.SPEED_MAX - C.SPEED_MIN);
    s.orbs.push({
      x: C.ORB_R + rnd(s) * (C.W - 2 * C.ORB_R),
      y: C.ORB_R + rnd(s) * (C.H - 2 * C.ORB_R),
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp
    });
  }
  s.bursts = [];
  s.fired = false;
  s.caught = 0;
  s.quota = quotaFor(s.level, n);
  s.aimLeft = C.AIM_TIME;
  s.chainMax = 0;
}

function createState(seed) {
  seed = (seed >>> 0) || 1;
  var s = {
    seed: seed, rng: seed,
    status: 'playing', overReason: '',
    level: 1, score: 0, progress: 0,
    cursor: { x: C.W / 2, y: C.H / 2 },
    orbs: [], bursts: [], fired: false, caught: 0, quota: 0,
    aimLeft: C.AIM_TIME, chainMax: 0, started: false,
    time: 0, levelPause: 0, events: [], prevAction: false
  };
  spawnLevel(s);
  return s;
}

function burstRadius(b) {
  if (b.t < C.GROW) return C.BURST_R * (b.t / C.GROW);
  if (b.t < C.GROW + C.HOLD) return C.BURST_R;
  var k = (b.t - C.GROW - C.HOLD) / C.SHRINK;
  return C.BURST_R * Math.max(0, 1 - k);
}

function burstAlive(b) { return b.t < C.GROW + C.HOLD + C.SHRINK; }

function fire(s, x, y) {
  s.fired = true;
  s.bursts.push({ x: x, y: y, t: 0, depth: 0 });
  s.events.push({ type: 'fire', x: x, y: y });
}

function step(s, input, dt) {
  input = input || {};
  s.events = [];
  var actionEdge = !!input.action && !s.prevAction;
  s.prevAction = !!input.action;

  if (input.restart) {
    var ns = createState(((s.seed * 1664525 + 1013904223) >>> 0) || 7);
    for (var k in ns) s[k] = ns[k];
    s.started = true;
    s.events = [{ type: 'restart' }];
    s.prevAction = !!input.action;
    return s;
  }
  if (s.status !== 'playing') return s;
  s.time += dt;

  if (input.left || input.right || input.up || input.down || input.action || input.px != null) s.started = true;

  // imleç
  if (typeof input.px === 'number' && typeof input.py === 'number') {
    s.cursor.x = input.px; s.cursor.y = input.py;
  }
  var dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  var dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  s.cursor.x = Math.max(0, Math.min(C.W, s.cursor.x + dx * C.CURSOR_SPEED * dt));
  s.cursor.y = Math.max(0, Math.min(C.H, s.cursor.y + dy * C.CURSOR_SPEED * dt));

  // seviye arası kısa bekleme
  if (s.levelPause > 0) {
    s.levelPause -= dt;
    if (s.levelPause <= 0) { s.levelPause = 0; spawnLevel(s); }
    return s;
  }

  // küreler hareket eder, duvarlardan seker
  var r = C.ORB_R, i, o;
  for (i = 0; i < s.orbs.length; i++) {
    o = s.orbs[i];
    o.x += o.vx * dt; o.y += o.vy * dt;
    if (o.x < r) { o.x = r; o.vx = Math.abs(o.vx); }
    if (o.x > C.W - r) { o.x = C.W - r; o.vx = -Math.abs(o.vx); }
    if (o.y < r) { o.y = r; o.vy = Math.abs(o.vy); }
    if (o.y > C.H - r) { o.y = C.H - r; o.vy = -Math.abs(o.vy); }
  }

  if (!s.fired) {
    if (s.started) s.aimLeft -= dt;
    if (actionEdge) fire(s, s.cursor.x, s.cursor.y);
    else if (s.aimLeft <= 0) {
      s.status = 'over';
      s.overReason = 'Süre doldu: kıvılcım atılmadı';
      s.events.push({ type: 'over' });
      return s;
    }
  }

  // patlamalar büyür; değdiği küre zincire katılır
  var nb = [];
  for (var b = 0; b < s.bursts.length; b++) {
    var B = s.bursts[b];
    B.t += dt;
    var br = burstRadius(B);
    for (i = s.orbs.length - 1; i >= 0; i--) {
      o = s.orbs[i];
      var ddx = o.x - B.x, ddy = o.y - B.y, rr = br + r;
      if (ddx * ddx + ddy * ddy <= rr * rr) {
        s.orbs.splice(i, 1);
        var depth = B.depth + 1;
        nb.push({ x: o.x, y: o.y, t: 0, depth: depth });
        s.caught++;
        s.score += depth;
        if (depth > s.chainMax) s.chainMax = depth;
        s.events.push({ type: 'catch', x: o.x, y: o.y, depth: depth, n: s.caught });
      }
    }
  }
  s.bursts = s.bursts.filter(burstAlive).concat(nb);
  s.progress = s.score;

  // zincir bitti mi?
  if (s.fired && s.bursts.length === 0) {
    if (s.caught >= s.quota) {
      s.score += 5 * s.level;
      s.progress = s.score;
      s.events.push({ type: 'level', level: s.level });
      if (s.level >= C.LEVELS) {
        s.status = 'won';
        s.overReason = '';
        s.events.push({ type: 'won' });
      } else {
        s.level++;
        s.levelPause = 0.6;
        s.fired = true;
      }
    } else {
      s.status = 'over';
      s.overReason = 'Zincir kısa kaldı: ' + s.caught + '/' + s.quota + ' küre';
      s.events.push({ type: 'over' });
    }
  }
  return s;
}

if (typeof module !== 'undefined') module.exports = { createState, step, C, burstRadius };
if (typeof window !== 'undefined') window.GameLogic = { createState, step, C, burstRadius };
