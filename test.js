'use strict';
var Lg = require('./logic.js'), B = require('./bot.js');
var fails = 0;
function check(n, ok, info) { console.log((ok ? 'PASS ' : 'FAIL ') + n + (info ? ' — ' + info : '')); if (!ok) fails++; }
function run(seed, frames, policy) {
  var s = Lg.createState(seed);
  for (var i = 0; i < frames && s.status === 'playing'; i++) Lg.step(s, { action: policy(s, i) }, 1 / 60);
  return s;
}
// T1: 600 adımda durum değişir
var s0 = Lg.createState(7), j0 = JSON.stringify(s0);
var s1 = run(7, 600, function (s) { return B.botAct(s); });
check('T1 oyun ilerliyor', JSON.stringify(s1) !== j0 && (s1.score > 0 || s1.time > 0), 'skor=' + s1.score + ' süre=' + s1.time.toFixed(1));
// T2: boşta bırakınca süre dolar
var s2 = run(7, 60 * 12, function () { return false; });
check('T2 kaybetmek mümkün', s2.status === 'over' && s2.overReason.length > 0, s2.status + ' / ' + s2.overReason);
// erken bırakma boşluğa düşer
var s2b = run(3, 60 * 12, function (s, i) { return i === 0; });
check('T2b erken bırakınca kayıp sebebi', s2b.status === 'over' && s2b.overReason.length > 0, s2b.overReason);
// T3: bot 3 seed'de skor artırır
var ok3 = true, info3 = [];
[1, 3, 8].forEach(function (seed) {
  var s = run(seed, 60 * 40, function (st) { return B.botAct(st); });
  info3.push('seed' + seed + '=' + s.score);
  if (s.score < 3) ok3 = false;
});
check('T3 skor artıyor', ok3, info3.join(' '));
// T4: temiz başlangıç
var a = JSON.stringify(Lg.createState(42)), b = JSON.stringify(Lg.createState(42));
check('T4 yeniden başlatma temiz', a === b && Lg.createState(42).status === 'playing');
console.log(fails ? 'ÖZET: ' + fails + ' FAIL' : 'ÖZET: hepsi PASS');
if (fails) process.exit(1);
