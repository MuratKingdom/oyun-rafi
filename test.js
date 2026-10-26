'use strict';
var L = require('./logic.js');
var fails = 0;
function check(name, ok, info) {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? ' — ' + info : ''));
  if (!ok) fails++;
}
var DT = 1 / 60;

// akıllı bot: gecenin ihtiyacına göre hedef seçer
function bot(s) {
  var need = L.nightWood(s.night, s.severity) + 1;
  var f = L.nightFood(s.night) + 1;
  var wantW = need - s.wood, wantF = f - s.food;
  var choice = wantW > 0 ? 'wood' : (wantF > 0 ? 'food' : 'wood');
  return { choice: choice === s.target ? null : choice };
}
function run(seed, policy, maxSteps) {
  var s = L.createState(seed), n = 0;
  while (s.status === 'playing' && n < maxSteps) { L.step(s, policy(s), DT); n++; }
  return { s: s, n: n };
}

// T1
var a = L.createState(1), a0 = JSON.stringify(a);
for (var i = 0; i < 600; i++) L.step(a, i === 60 ? { choice: 'food' } : {}, DT);
check('T1 oyun ilerliyor', JSON.stringify(a) !== a0 && (a.wood !== 12 || a.food !== 8 || a.phase === 'night'),
  'wood=' + a.wood.toFixed(1) + ' food=' + a.food.toFixed(1) + ' phase=' + a.phase);

// T2
var r2 = run(2, function () { return {}; }, 60 * 400);
check('T2 kaybetmek mümkün', r2.s.status === 'over' && typeof r2.s.overReason === 'string' && r2.s.overReason.length > 0,
  r2.s.status + ' / ' + r2.s.overReason);
var r2b = run(3, function (s) { return s.target === 'wood' ? {} : { choice: 'wood' }; }, 60 * 400);
check('T2b yiyeceksiz kayıp sebebi', r2b.s.status === 'over' && /Yiyecek|Ateş/.test(r2b.s.overReason), r2b.s.overReason);

// T3
var wins = 0, minScore = 1e9;
[11, 22, 33].forEach(function (seed) {
  var r = run(seed, bot, 60 * 600);
  if (r.s.status === 'won') wins++;
  minScore = Math.min(minScore, r.s.score);
});
check('T3 doğru oynanışta ilerleme/kazanç', wins === 3 && minScore > 0, 'kazanan seed=' + wins + '/3, en düşük skor=' + minScore);

// T4
var x = JSON.stringify(L.createState(7)), y = JSON.stringify(L.createState(7));
check('T4 yeniden başlatma temiz', x === y && L.createState(7).status === 'playing');

console.log(fails ? 'ÖZET: ' + fails + ' FAIL' : 'ÖZET: hepsi PASS');
if (fails) process.exit(1);
