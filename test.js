// Headless mantık testi: node test.js
'use strict';
var L = require('./logic.js');
var DT = 1 / 60, fails = 0, total = 0;
function check(name, ok, info) { total++; if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? ' — ' + info : '')); }

// Halka botu: köyün çevresinde Chebyshev yarıçapı r olan halkayı deniz seviyesinin üstünde tutar
function ringBot(seed, r, maxSteps) {
  var s = L.createState(seed), N = L.C.N, v = s.village, ring = [];
  for (var y = 0; y < N; y++) for (var x = 0; x < N; x++)
    if (Math.max(Math.abs(x - v.x), Math.abs(y - v.y)) === r) ring.push([x, y]);
  var n = 0;
  while (s.status === 'playing' && n < maxSteps) {
    var inp = {};
    if (s.sand >= 1) {
      var best = null;
      for (var i = 0; i < ring.length; i++) {
        var k = L.idx(ring[i][0], ring[i][1]);
        if (s.flooded[k] || s.h[k] > s.level + 1) continue;
        if (!best || s.h[k] < s.h[L.idx(best[0], best[1])]) best = ring[i];
      }
      if (best) inp = { tapX: best[0], tapY: best[1] };
    }
    L.step(s, inp, DT); n++;
  }
  return s;
}

// T1 — oyun ilerliyor: 600 adım senaryolu girdi (imleç gezdir + yükselt)
(function () {
  var s = L.createState(11), start = JSON.stringify({ sand: s.sand, cx: s.cx, cy: s.cy, h: s.h, level: s.level });
  for (var i = 0; i < 600; i++) {
    var inp = {};
    if (i % 30 === 0) inp.moveX = (i / 30) % 2 ? 1 : -1;
    if (i % 30 === 15) inp.action = true;
    L.step(s, inp, DT);
  }
  var now = JSON.stringify({ sand: s.sand, cx: s.cx, cy: s.cy, h: s.h, level: s.level });
  check('T1 oyun ilerliyor (600 adım)', now !== start && s.level >= 1 && s.time > 9.9, 'seviye=' + s.level + ' kum=' + s.sand.toFixed(1));
})();

// T2 — kaybetmek mümkün: hiçbir şey yapmayan oyuncu
(function () {
  var s = L.createState(5), n = 0;
  while (s.status === 'playing' && n < 60 * 200) { L.step(s, {}, DT); n++; }
  check('T2 kayıp mümkün (boşta)', s.status === 'over' && typeof s.overReason === 'string' && s.overReason.length > 0, s.overReason);
})();

// T2b — köy karesi yükseltilemez, su altındaki kare yükseltilemez
(function () {
  var s = L.createState(3); s.sand = 50;
  var ok1 = L.raise(s, s.village.x, s.village.y) === false;
  var ok2 = L.raise(s, 0, 0) === false;
  check('T2b köy ve deniz karesi yükseltilemez', ok1 && ok2);
})();

// T3 — ilerleme/kazanç: halka botu skor alıyor ve 12 gelgiti bitiriyor
(function () {
  var res = [], allWon = true, scored = true;
  [1, 2, 3].forEach(function (seed) {
    var s = ringBot(seed, 3, 60 * 200);
    res.push('seed' + seed + ':' + s.status + '/g' + s.tide + '/skor' + s.score);
    if (s.status !== 'won') allWon = false;
    if (!(s.score > 0)) scored = false;
  });
  check('T3 kazanç erişilebilir (halka botu, 3 seed)', allWon && scored, res.join(' '));
})();

// T4 — yeniden başlatma temiz
(function () {
  var a = L.createState(42);
  for (var i = 0; i < 900; i++) L.step(a, { action: i % 20 === 0 }, DT);
  var b = L.createState(42), c = L.createState(42);
  check('T4 createState deterministik ve temiz', JSON.stringify(b) === JSON.stringify(c) && b.status === 'playing' && b.score === 0 && b.level === 0);
})();

console.log('ÖZET: ' + (total - fails) + '/' + total + ' PASS');
if (fails) process.exit(1);
