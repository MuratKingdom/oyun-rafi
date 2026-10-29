'use strict';
var L = require('./logic.js');
var fails = 0;
function check(name, ok, info) {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? ' — ' + info : ''));
  if (!ok) fails++;
}
var DT = 1 / 60;
var NOIN = { up: false, down: false, left: false, right: false, action: false, restart: false };
function inp(o) { var r = {}; for (var k in NOIN) r[k] = NOIN[k]; for (var j in o) r[j] = o[j]; return r; }
function clone(s) { return JSON.parse(JSON.stringify(s)); }
function settle(s) { var n = 0; while (s.status === 'playing' && s.phase === 'flight' && n < 3000) { L.step(s, NOIN, DT); n++; } }

// T1: oyun ilerliyor
var s1 = L.createState(7);
var a0 = s1.angle, sc0 = s1.score;
for (var i = 0; i < 600; i++) {
  var o = {};
  if (i < 30) o.up = true;
  if (i === 40) o.action = true;
  L.step(s1, inp(o), DT);
}
check('T1 oyun ilerliyor', s1.angle !== a0 && (s1.score !== sc0 || s1.level > 1 || s1.phase !== 'aim' || s1.status !== 'playing'), 'angle ' + a0 + '->' + s1.angle.toFixed(1) + ', skor ' + s1.score + ', seviye ' + s1.level + ', status ' + s1.status + ', phase ' + s1.phase);

// T2: kayıp mümkün ve sebep var
var s2 = L.createState(1);
s2.angle = 45; s2.power = 250;
L.step(s2, inp({ action: true }), DT);
settle(s2);
check('T2 kısa atış kaybettirir', s2.status === 'over' && s2.overReason.length > 0, s2.overReason);
var s2b = L.createState(1);
s2b.wall = { x: 300, w: 16, h: 100 }; s2b.angle = 20; s2b.power = 500;
L.step(s2b, inp({ action: true }), DT); settle(s2b);
check('T2b duvar kaybettirir', s2b.status === 'over' && s2b.overReason === 'Duvara çarptın', s2b.overReason);
var s2c = L.createState(1);
s2c.angle = 45; s2c.power = 650;
L.step(s2c, inp({ action: true }), DT); settle(s2c);
check('T2c uzun atış kaybettirir', s2c.status === 'over' && s2c.overReason.length > 0, s2c.overReason);

// T3: bot ileri simülasyonla bulur, 10 hedefi de vurur
function solve(s) {
  for (var ang = 20; ang <= 75; ang += 1) {
    for (var pw = 250; pw <= 650; pw += 5) {
      var c = clone(s);
      c.angle = ang; c.power = pw;
      L.step(c, inp({ action: true }), DT);
      settle(c);
      if (c.status === 'won' || (c.status === 'playing' && c.cleared > s.cleared)) return [ang, pw];
    }
  }
  return null;
}
var allOk = true, info = [];
[3, 11, 42].forEach(function (seed) {
  var s = L.createState(seed), guard = 0;
  while (s.status === 'playing' && guard++ < 40) {
    var sol = solve(s);
    if (!sol) { allOk = false; info.push('seed ' + seed + ' seviye ' + s.level + ' çözümsüz'); break; }
    s.angle = sol[0]; s.power = sol[1];
    L.step(s, inp({ action: true }), DT); settle(s);
    var g = 0; while (s.status === 'playing' && s.phase === 'result' && g++ < 200) L.step(s, NOIN, DT);
  }
  if (s.status !== 'won') { allOk = false; info.push('seed ' + seed + ' status ' + s.status + ' ' + s.overReason); }
  else info.push('seed ' + seed + ' skor ' + s.score);
});
check('T3 doğru oynanışla 10 hedef vurulur', allOk, info.join('; '));

// T4: yeniden başlatma temiz
var x = L.createState(5), y = L.createState(5);
check('T4 createState deterministik ve playing', JSON.stringify(x) === JSON.stringify(y) && x.status === 'playing');

console.log(fails ? 'ÖZET: ' + fails + ' FAIL' : 'ÖZET: hepsi PASS');
if (fails) process.exit(1);
