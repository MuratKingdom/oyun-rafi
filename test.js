'use strict';
var L = require('./logic.js');
var fails = 0;
function check(name, ok, info) { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? ' — ' + info : '')); if (!ok) fails++; }
var DT = 1 / 60, NONE = { dx: 0, dy: 0, repair: false, pick: null };

function bot(s) {
  var best = -1, low = 61;
  for (var i = 0; i < s.machines.length; i++) if (s.machines[i].dur < low) { low = s.machines[i].dur; best = i; }
  return best >= 0 && s.cd === 0 ? { pick: best } : NONE;
}

// T1: oyun ilerliyor
var s = L.createState(3);
var before = JSON.stringify([s.earned, s.time, s.machines[0].dur]);
for (var i = 0; i < 600; i++) L.step(s, i % 100 === 0 ? { dx: 1 } : NONE, DT);
check('T1 oyun ilerliyor', JSON.stringify([s.earned, s.time, s.machines[0].dur]) !== before && s.score > 0, 'score=' + s.score);

// T2: kaybetmek mümkün (boşta bekle)
s = L.createState(3);
for (i = 0; i < 6000 && s.status === 'playing'; i++) L.step(s, NONE, DT);
check('T2 kayıp mümkün', s.status === 'over' && s.overReason.length > 0, s.overReason + ' t=' + s.time.toFixed(1));

// T3: bot kazanabiliyor
var okAll = true, msg = [];
[1, 5, 42].forEach(function (seed) {
  var g = L.createState(seed);
  for (var k = 0; k < 9000 && g.status === 'playing'; k++) L.step(g, bot(g), DT);
  msg.push(seed + ':' + g.status + '/' + g.score);
  if (g.status !== 'won' || g.score <= 0) okAll = false;
});
check('T3 kazanç erişilebilir', okAll, msg.join(' '));

// T4: temiz yeniden başlatma
var a = JSON.stringify(L.createState(9)), b = JSON.stringify(L.createState(9));
check('T4 temiz başlangıç', a === b && L.createState(9).status === 'playing');

console.log(fails ? fails + ' FAIL' : 'hepsi PASS');
if (fails) process.exit(1);
