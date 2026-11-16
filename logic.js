// Set Adası — saf oyun mantığı (DOM yok)
'use strict';

var C = {
  N: 11,            // ızgara kenarı
  TIDE_T: 10,       // gelgit aralığı (sn)
  TIDES_TO_WIN: 12, // kazanmak için atlatılacak gelgit
  INCOME: 0.045,    // kuru kare başına sn'de kum
  START_SAND: 6,
  MAX_H: 15,
  VILLAGE_H: 2
};

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rnd(s) {
  // PRNG durumu state içinde: her çağrıda rngState ilerler
  var f = mulberry32(s.rngState);
  var v = f();
  s.rngState = (s.rngState + 0x6D2B79F5) | 0;
  return v;
}

function idx(x, y) { return y * C.N + x; }

function createState(seed) {
  var s = {
    seed: seed >>> 0,
    rngState: (seed >>> 0) || 1,
    status: 'playing',
    overReason: '',
    level: 0,            // deniz seviyesi
    tide: 0,             // atlatılan gelgit
    tideTimer: C.TIDE_T,
    sand: C.START_SAND,
    score: 0,
    time: 0,
    cx: Math.floor(C.N / 2),
    cy: Math.floor(C.N / 2) + 1,
    h: [],
    flooded: [],
    village: { x: Math.floor(C.N / 2), y: Math.floor(C.N / 2) },
    events: [],          // render/ses için tek karelik olaylar
    prevAction: false
  };
  var mid = (C.N - 1) / 2;
  for (var y = 0; y < C.N; y++) {
    for (var x = 0; x < C.N; x++) {
      var d = Math.max(Math.abs(x - mid), Math.abs(y - mid)) / mid; // 0..1
      var e = Math.sqrt((x - mid) * (x - mid) + (y - mid) * (y - mid)) / mid;
      var base = 5.2 - 5.5 * (0.5 * d + 0.5 * e);
      var v = Math.round(base + (rnd(s) * 2 - 1) * 1.2);
      if (x === 0 || y === 0 || x === C.N - 1 || y === C.N - 1) v = Math.min(v, 0);
      if (v < 0) v = 0;
      if (v > 6) v = 6;
      s.h.push(v);
      s.flooded.push(v <= s.level && (x === 0 || y === 0 || x === C.N - 1 || y === C.N - 1));
    }
  }
  s.h[idx(s.village.x, s.village.y)] = C.VILLAGE_H;
  // başlangıç seviyesinde (0) bağlantılı suyu yay
  var f0 = floodSet(s, s.level);
  for (var i = 0; i < f0.length; i++) if (f0[i]) s.flooded[i] = true;
  return s;
}

// Verilen seviyede denize bağlı olarak su altında kalacak kareler
function floodSet(s, level) {
  var n = C.N, out = new Array(n * n), q = [];
  for (var i = 0; i < n * n; i++) out[i] = false;
  for (var y = 0; y < n; y++) {
    for (var x = 0; x < n; x++) {
      var k = idx(x, y);
      var edge = x === 0 || y === 0 || x === n - 1 || y === n - 1;
      if ((edge && s.h[k] <= level) || s.flooded[k]) {
        if (!out[k]) { out[k] = true; q.push(k); }
      }
    }
  }
  while (q.length) {
    var c = q.pop(), cx = c % n, cy = (c - cx) / n;
    var nb = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
    for (var j = 0; j < 4; j++) {
      var nx = nb[j][0], ny = nb[j][1];
      if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
      var nk = idx(nx, ny);
      if (!out[nk] && s.h[nk] <= level) { out[nk] = true; q.push(nk); }
    }
  }
  return out;
}

function dryCount(s) {
  var c = 0;
  for (var i = 0; i < s.flooded.length; i++) if (!s.flooded[i]) c++;
  return c;
}

function isVillage(s, x, y) { return x === s.village.x && y === s.village.y; }

// İmleçteki kareyi 1 yükselt; başarılıysa true
function raise(s, x, y) {
  var k = idx(x, y);
  if (s.flooded[k]) { s.events.push({ t: 'deny', x: x, y: y, why: 'su' }); return false; }
  if (isVillage(s, x, y)) { s.events.push({ t: 'deny', x: x, y: y, why: 'köy' }); return false; }
  if (s.h[k] >= C.MAX_H) { s.events.push({ t: 'deny', x: x, y: y, why: 'tavan' }); return false; }
  if (s.sand < 1) { s.events.push({ t: 'deny', x: x, y: y, why: 'kum' }); return false; }
  s.sand -= 1;
  s.h[k] += 1;
  s.events.push({ t: 'raise', x: x, y: y });
  return true;
}

function doTide(s) {
  s.level += 1;
  var f = floodSet(s, s.level), lost = 0;
  for (var i = 0; i < f.length; i++) {
    if (f[i] && !s.flooded[i]) { s.flooded[i] = true; lost++; }
  }
  s.events.push({ t: 'tide', lost: lost });
  if (s.flooded[idx(s.village.x, s.village.y)]) {
    s.status = 'over';
    s.overReason = 'Köy sular altında kaldı (gelgit ' + s.level + ')';
    s.events.push({ t: 'over' });
    return;
  }
  s.tide += 1;
  s.score += 10 + dryCount(s);
  if (s.tide >= C.TIDES_TO_WIN) {
    s.status = 'won';
    s.events.push({ t: 'won' });
  }
}

function step(s, input, dt) {
  s.events = [];
  input = input || {};
  if (s.status !== 'playing') return s;
  s.time += dt;
  // imleç hareketi (input.move: tek seferlik yön)
  if (input.moveX) s.cx = Math.max(0, Math.min(C.N - 1, s.cx + input.moveX));
  if (input.moveY) s.cy = Math.max(0, Math.min(C.N - 1, s.cy + input.moveY));
  if (typeof input.tapX === 'number' && typeof input.tapY === 'number') {
    s.cx = input.tapX; s.cy = input.tapY;
    raise(s, s.cx, s.cy);
  }
  if (input.action && !s.prevAction) raise(s, s.cx, s.cy);
  s.prevAction = !!input.action;
  // gelir
  s.sand += dryCount(s) * C.INCOME * dt;
  // gelgit
  s.tideTimer -= dt;
  if (s.tideTimer <= 0) {
    s.tideTimer += C.TIDE_T;
    doTide(s);
  }
  return s;
}

var GameLogicAPI = { createState: createState, step: step, floodSet: floodSet, dryCount: dryCount, raise: raise, C: C, idx: idx };
if (typeof module !== 'undefined') module.exports = GameLogicAPI;
if (typeof window !== 'undefined') window.GameLogic = GameLogicAPI;
