// Komşu Bahçe — saf oyun mantığı (DOM yok).
(function () {
  'use strict';
  var N = 5, CELLS = 25, TILE_TIME = 12;
  // PAIR[a][b]: iki komşu türün birbirine katkısı (0 Tarla, 1 Kuyu, 2 Kovan)
  var PAIR = [[-1, 4, 3], [4, -1, -2], [3, -2, -1]];
  var QUOTA = { 5: 4, 10: 14, 15: 28, 20: 44, 25: 60 };
  var KEYS = ['left', 'right', 'up', 'down', 'action', 'restart'];

  function rnd(s) {
    s.rs = (s.rs + 0x6D2B79F5) | 0;
    var t = Math.imul(s.rs ^ (s.rs >>> 15), 1 | s.rs);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function fillQueue(s) { while (s.queue.length < 4) s.queue.push(Math.floor(rnd(s) * 3)); }
  function emptyPrev() { var p = {}; KEYS.forEach(function (k) { p[k] = false; }); return p; }

  function createState(seed) {
    var s = {
      seed: seed, rs: seed | 0, time: 0, status: 'playing', overReason: '',
      score: 0, placed: 0, cursor: 12, board: [], queue: [], tileTimer: TILE_TIME,
      prev: emptyPrev(), flash: 0, lastGain: 0, lastIdx: -1, msg: '', event: '', eventSeq: 0
    };
    for (var i = 0; i < CELLS; i++) s.board.push(-1);
    fillQueue(s);
    return s;
  }

  function gainAt(board, idx, type) {
    var x = idx % N, y = Math.floor(idx / N), g = 1;
    var nb = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
    for (var i = 0; i < 4; i++) {
      var nx = nb[i][0], ny = nb[i][1];
      if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
      var t = board[ny * N + nx];
      if (t >= 0) g += PAIR[type][t];
    }
    return g;
  }

  function fire(s, name) { s.event = name; s.eventSeq++; }
  function lose(s, reason) { s.status = 'over'; s.overReason = reason; fire(s, 'over'); }

  function step(s, input, dt) {
    var p = s.prev, e = {};
    KEYS.forEach(function (k) { e[k] = !!input[k] && !p[k]; });
    var cur = emptyPrev();
    KEYS.forEach(function (k) { cur[k] = !!input[k]; });
    s.prev = cur;

    if (s.status !== 'playing') {
      if (e.restart || e.action) {
        var np = createState(s.seed + 1);
        np.prev = cur;
        Object.keys(s).forEach(function (k) { delete s[k]; });
        Object.keys(np).forEach(function (k) { s[k] = np[k]; });
      }
      return;
    }

    s.time += dt;
    s.flash = Math.max(0, s.flash - dt);
    s.tileTimer -= dt;
    if (s.tileTimer <= 0) { s.tileTimer = 0; lose(s, 'Süre doldu: kareyi zamanında yerleştirmedin'); return; }

    var x = s.cursor % N, y = Math.floor(s.cursor / N), act = e.action;
    if (e.left) x = Math.max(0, x - 1);
    if (e.right) x = Math.min(N - 1, x + 1);
    if (e.up) y = Math.max(0, y - 1);
    if (e.down) y = Math.min(N - 1, y + 1);
    s.cursor = y * N + x;
    if (typeof input.cell === 'number' && input.cell >= 0 && input.cell < CELLS) { s.cursor = input.cell; act = true; }
    if (!act) return;

    if (s.board[s.cursor] >= 0) { s.msg = 'Kare dolu'; s.flash = 0.2; s.lastIdx = s.cursor; s.lastGain = 0; fire(s, 'bad'); return; }
    var type = s.queue.shift();
    var g = gainAt(s.board, s.cursor, type);
    s.board[s.cursor] = type;
    s.score += g; s.placed++;
    s.tileTimer = TILE_TIME; s.flash = 0.35; s.lastGain = g; s.lastIdx = s.cursor; s.msg = '';
    fillQueue(s);
    fire(s, g > 0 ? 'place' : 'bad');
    var q = QUOTA[s.placed];
    if (q !== undefined && s.score < q) {
      lose(s, 'Kota tutmadı: ' + s.placed + '. yerleşimde en az ' + q + ' puan gerekirdi, sende ' + s.score);
    } else if (s.placed >= CELLS) {
      s.status = 'won'; fire(s, 'won');
    }
  }

  var api = { createState: createState, step: step, gainAt: gainAt, QUOTA: QUOTA, PAIR: PAIR, N: N, TILE_TIME: TILE_TIME };
  if (typeof module !== 'undefined') module.exports = api;
  if (typeof window !== 'undefined') window.GameLogic = api;
})();
