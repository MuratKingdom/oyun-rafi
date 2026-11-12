// Headless mantık testi: node test.js
var L = require('./logic.js');
var DT = 1 / 60, fails = 0;
function check(name, ok, info) { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? ' — ' + info : '')); if (!ok) fails++; }
function clone(s) { return JSON.parse(JSON.stringify(s)); }

// T1: 600 adım senaryolu girdi ile durum değişir
(function () {
  var s = L.createState(42), start = JSON.stringify({ c: s.cursor, o: s.orbs[0] });
  for (var i = 0; i < 600; i++) L.step(s, { right: i < 60, down: i >= 60 && i < 90, action: i === 100 }, DT);
  var end = JSON.stringify({ c: s.cursor, o: s.orbs[0] });
  check('T1 oyun ilerliyor', start !== end && s.fired === true, 'imleç ' + Math.round(s.cursor.x) + ',' + Math.round(s.cursor.y) + ' fired=' + s.fired + ' status=' + s.status);
})();

// T2: kayıp mümkün — köşeye boş atış zinciri kısa bırakır; atış yapmamak süre dolumu verir
(function () {
  var s = L.createState(7);
  L.step(s, { px: 0, py: 0, action: true }, DT);
  for (var i = 0; i < 600 && s.status === 'playing'; i++) L.step(s, {}, DT);
  check('T2 kayıp (kısa zincir)', s.status === 'over' && !!s.overReason, 'status=' + s.status + ' sebep="' + s.overReason + '"');
  var t = L.createState(7);
  for (i = 0; i < 1200 && t.status === 'playing'; i++) L.step(t, { left: i < 5 }, DT);
  check('T2b kayıp (süre doldu)', t.status === 'over' && /Süre doldu/.test(t.overReason), 'sebep="' + t.overReason + '"');
})();

// T3: doğru oynayan bot skor kazanır ve en az 3 seviye geçer; bir seed'de kazanır
function evalShot(s, x, y) {
  var t = clone(s); L.step(t, { px: x, py: y, action: true }, DT);
  var n = 0; while (t.status === 'playing' && t.levelPause === 0 && n < 400) { L.step(t, {}, DT); n++; }
  return t.status !== 'over';
}
function botPlay(seed) {
  var s = L.createState(seed), g = 0;
  while (s.status === 'playing' && g < 30000) {
    g++;
    if (!s.fired && s.levelPause === 0) {
      var best = null;
      for (var w = 0; w < 20 && !best; w++) {
        for (var gx = 20; gx < 480 && !best; gx += 20) for (var gy = 20; gy < 360; gy += 20) if (evalShot(s, gx, gy)) { best = [gx, gy]; break; }
        if (!best) for (var k = 0; k < 20; k++) L.step(s, { left: true }, DT);
      }
      if (!best) best = [240, 180];
      L.step(s, { px: best[0], py: best[1], action: true }, DT); L.step(s, {}, DT);
    } else L.step(s, {}, DT);
  }
  return s;
}
(function () {
  var res = [2, 3, 4].map(botPlay);
  var ok = res.every(function (s) { return s.score > 0 && s.level >= 4; }) && res.some(function (s) { return s.status === 'won'; });
  check('T3 ilerleme/kazanç mümkün', ok, res.map(function (s) { return s.status + ' L' + s.level + ' skor ' + s.score; }).join(' | '));
})();

// T4: aynı seed iki kez -> birebir aynı, playing
(function () {
  var a = L.createState(123), b = L.createState(123);
  check('T4 temiz yeniden başlatma', JSON.stringify(a) === JSON.stringify(b) && a.status === 'playing');
  var s = L.createState(5); s.status = 'over'; s.overReason = 'x';
  L.step(s, { restart: true }, DT);
  check('T4b restart girdisi', s.status === 'playing' && s.score === 0 && s.level === 1 && s.overReason === '');
})();

console.log(fails === 0 ? 'ÖZET: tüm testler geçti' : 'ÖZET: ' + fails + ' FAIL');
if (fails) process.exit(1);
