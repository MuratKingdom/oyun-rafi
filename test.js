'use strict';
// Headless mantık testi: node test.js
var L = require('./logic.js');
var C = L.C, DT = 1 / 60;
var fails = 0;
function check(name, ok, info) {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? ' — ' + info : ''));
  if (!ok) fails++;
}
function run(s, inputFn, steps) {
  for (var i = 0; i < steps && s.status === 'playing'; i++) s = L.step(s, inputFn(s, i), DT);
  return s;
}
// Bot: en yakın rakibin merkeze bakan arkasına geçip onu dışarı doğru iter.
function bot(s) {
  var p = s.player, best = null, bd = 1e9;
  for (var i = 0; i < s.enemies.length; i++) {
    var e = s.enemies[i], d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d < bd) { bd = d; best = e; }
  }
  var pc = Math.hypot(p.x - C.CX, p.y - C.CY);
  if (!best) return { target: { x: C.CX, y: C.CY } };
  var ec = Math.hypot(best.x - C.CX, best.y - C.CY) || 1;
  var ux = (best.x - C.CX) / ec, uy = (best.y - C.CY) / ec;
  var bx = best.x - ux * (best.r + p.r + 22), by = best.y - uy * (best.r + p.r + 22);
  var rx = p.x - best.x, ry = p.y - best.y;
  var along = rx * ux + ry * uy, lat = Math.abs(rx * -uy + ry * ux);
  var behind = along < -best.r * 0.5 && lat < best.r + 4;
  var vout = pc > 1 ? (p.vx * (p.x - C.CX) + p.vy * (p.y - C.CY)) / pc : 0;
  if (pc > C.R * 0.55 && vout > 60 + (C.R - pc) * 0.8) return { target: { x: C.CX, y: C.CY } };
  if (pc > C.R * 0.7 && !behind) return { target: { x: C.CX, y: C.CY } };
  if (behind) return { target: { x: best.x, y: best.y }, action: bd < 60 && best.spawn === 0 && pc < C.R * 0.6 };
  return { target: { x: bx, y: by } };
}

// T1 — oyun ilerliyor
var s0 = L.createState(7), start = JSON.stringify(s0.player);
var s1 = run(L.createState(7), function (s, i) { return { right: i < 40, left: i >= 60 && i < 100, up: i >= 120 && i < 150, action: i === 200 }; }, 600);
check('T1 oyun ilerliyor', JSON.stringify(s1.player) !== start && s1.time > 0,
  'oyuncu ' + Math.round(s1.player.x) + ',' + Math.round(s1.player.y) + ' t=' + s1.time.toFixed(2));

// T2 — kaybetmek mümkün (sağa basılı tut)
var s2 = run(L.createState(3), function () { return { right: true }; }, 600);
check('T2 kayıp mümkün', s2.status === 'over' && !!s2.overReason, s2.status + ' / "' + s2.overReason + '"');

// T2b — boşta bekleyen oyuncu rakiplerce dışarı itilir
var s2b = run(L.createState(5), function () { return {}; }, 60 * 120);
check('T2b boşta kalınca itilip kaybediliyor', s2b.status === 'over' && !!s2b.overReason,
  s2b.status + ' / "' + s2b.overReason + '" t=' + s2b.time.toFixed(1));

// T3 — bot ile puan artıyor / kazanma
var wins = 0, info = [];
var seeds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
var allScore = true;
seeds.forEach(function (sd) {
  var s = run(L.createState(sd), bot, 60 * 300);
  if (s.status === 'won') wins++;
  if (!(s.score > 0 && s.knocked > 0)) allScore = false;
  info.push('seed' + sd + ':' + s.status + ' w' + s.wave + ' skor' + s.score);
});
check('T3 doğru oynanışta skor artıyor', allScore, info.join(' | '));
check('T3b kazanma erişilebilir (en az bir seed)', wins > 0, wins + '/' + seeds.length + ' seed kazandı');

// T4 — temiz yeniden başlatma
var a = L.createState(42), b = L.createState(42);
check('T4 aynı seed aynı başlangıç', JSON.stringify(a) === JSON.stringify(b) && a.status === 'playing');
var r = L.step(s2, { restart: true }, DT);
check('T4b restart girdisi temiz oyun', r.status === 'playing' && r.score === 0 && r.wave === 1 && r.overReason === '');

console.log((fails ? 'SONUÇ: ' + fails + ' FAIL' : 'SONUÇ: hepsi PASS'));
process.exit(fails ? 1 : 0);
