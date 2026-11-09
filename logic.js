'use strict';
// Bant Hatti — saf oyun mantigi (DOM yok, canvas yok).
(function () {
  var W = 9, H = 7, MAXT = 22, WIN = 30, MISS_MAX = 3, GRACE = 12;
  // tile: 0 bos, 1..4 ok (sag, asagi, sol, yukari), 5 ayirici, 9 kaya, 10 kaynak, 11 kirmizi kutu, 12 mavi kutu
  var DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];

  function rnd(s) {
    s.rs = (s.rs + 0x6D2B79F5) >>> 0;
    var t = s.rs;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function createState(seed) {
    var s = {
      seed: seed, rs: (seed >>> 0) || 1, w: W, h: H, maxT: MAXT, win: WIN, missMax: MISS_MAX,
      grid: [], items: [], used: 0, misses: 0, score: 0, tickN: 0, acc: 0, time: 0, grace: GRACE,
      status: 'playing', overReason: '', msg: '', lastMiss: '', cx: 1, cy: 0, evtN: 0, evtType: '', flash: 0
    };
    var i;
    for (i = 0; i < W * H; i++) s.grid.push(0);
    s.sy = 1 + Math.floor(rnd(s) * (H - 2));
    s.ry = Math.floor(rnd(s) * s.sy);
    s.by = s.sy + 1 + Math.floor(rnd(s) * (H - 1 - s.sy));
    s.grid[s.sy * W] = 10;
    s.grid[s.ry * W + W - 1] = 11;
    s.grid[s.by * W + W - 1] = 12;
    var k, x, y;
    for (k = 0; k < 6; k++) {
      x = 2 + Math.floor(rnd(s) * (W - 3));
      y = Math.floor(rnd(s) * H);
      if (y !== s.sy && y !== s.ry && y !== s.by) s.grid[y * W + x] = 9;
    }
    s.cx = 1; s.cy = s.sy;
    return s;
  }

  function evt(s, type) { s.evtN++; s.evtType = type; }

  function interval(s) { return Math.max(0.3, 0.6 - 0.01 * s.score); }

  function cycle(s, x, y) {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    var i = y * W + x, k = s.grid[i];
    if (k >= 9) { s.msg = 'Burası değiştirilemez'; evt(s, 'deny'); return; }
    if (k === 0 && s.used >= MAXT) { s.msg = 'Parça hakkı bitti: bir parçayı boşa çevir'; evt(s, 'deny'); return; }
    var n = k === 5 ? 0 : k + 1;
    if (k === 0) s.used++;
    if (n === 0) s.used--;
    s.grid[i] = n;
    s.msg = '';
    evt(s, 'place');
  }

  function miss(s, reason) {
    s.misses++;
    s.lastMiss = reason;
    s.flash = 0.2;
    evt(s, 'miss');
    if (s.misses >= MISS_MAX) {
      s.status = 'over';
      s.overReason = MISS_MAX + ' parça kayboldu: ' + reason;
      evt(s, 'over');
    }
  }

  function tick(s) {
    var keep = [], j, it, k, d, nx, ny, nk;
    for (j = 0; j < s.items.length; j++) {
      it = s.items[j];
      if (s.status !== 'playing') { keep.push(it); continue; }
      k = s.grid[it.y * W + it.x];
      if (k === 10) d = 0;
      else if (k >= 1 && k <= 4) d = k - 1;
      else if (k === 5) d = it.c === 0 ? (it.d + 3) % 4 : (it.d + 1) % 4;
      else d = it.d;
      it.px = it.x; it.py = it.y; it.d = d;
      nx = it.x + DIRS[d][0]; ny = it.y + DIRS[d][1];
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) { miss(s, 'Parça bantın dışına düştü'); continue; }
      nk = s.grid[ny * W + nx];
      if (nk === 0 || nk === 9) { miss(s, 'Parça boşluğa düştü'); continue; }
      if (nk === 11 || nk === 12) {
        if ((nk === 11 && it.c === 0) || (nk === 12 && it.c === 1)) {
          s.score++;
          evt(s, 'score');
          if (s.score >= WIN) { s.status = 'won'; evt(s, 'won'); }
        } else {
          miss(s, 'Yanlış kutu: ' + (it.c === 0 ? 'kırmızı' : 'mavi') + ' parça ' + (nk === 11 ? 'kırmızı' : 'mavi') + ' kutuya girdi');
        }
        continue;
      }
      it.x = nx; it.y = ny;
      keep.push(it);
    }
    s.items = keep;
    s.tickN++;
    var every = s.score >= 15 ? 2 : 3;
    if (s.status === 'playing' && s.tickN % every === 0) {
      s.items.push({ x: 0, y: s.sy, px: 0, py: s.sy, d: 0, c: rnd(s) < 0.5 ? 0 : 1 });
    }
  }

  function step(s, input, dt) {
    if (s.status !== 'playing') return;
    input = input || {};
    s.flash = Math.max(0, s.flash - dt);
    if (input.left) s.cx = Math.max(0, s.cx - 1);
    if (input.right) s.cx = Math.min(W - 1, s.cx + 1);
    if (input.up) s.cy = Math.max(0, s.cy - 1);
    if (input.down) s.cy = Math.min(H - 1, s.cy + 1);
    if (input.click) { s.cx = input.click.x; s.cy = input.click.y; cycle(s, s.cx, s.cy); }
    if (input.action) cycle(s, s.cx, s.cy);
    if (input.start) s.grace = 0;
    if (s.grace > 0) { s.grace = Math.max(0, s.grace - dt); return; }
    s.time += dt;
    s.acc += dt;
    var iv = interval(s);
    while (s.acc >= iv && s.status === 'playing') {
      s.acc -= iv;
      tick(s);
      iv = interval(s);
    }
  }

  var api = { createState: createState, step: step, interval: interval, W: W, H: H };
  if (typeof module !== 'undefined') module.exports = { createState: createState, step: step, interval: interval, W: W, H: H };
  if (typeof window !== 'undefined') window.GameLogic = api;
})();
