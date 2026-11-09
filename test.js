'use strict';
var L = require('./logic.js');
var fails = 0, DT = 1 / 60;
function check(name, ok, info) { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? ' — ' + info : '')); if (!ok) fails++; }

function setCell(s, x, y, target) {
  var guard = 0;
  while (s.grid[y * s.w + x] !== target && guard++ < 8) L.step(s, { click: { x: x, y: y } }, DT);
}
function build(s) {
  var x, y, W = s.w;
  setCell(s, 1, s.sy, 5);
  for (y = s.sy - 1; y > s.ry; y--) setCell(s, 1, y, 4);
  for (x = 1; x <= 7; x++) setCell(s, x, s.ry, 1);
  for (y = s.sy + 1; y < s.by; y++) setCell(s, 1, y, 2);
  for (x = 1; x <= 7; x++) setCell(s, x, s.by, 1);
}
function run(s, n) { for (var i = 0; i < n && s.status === 'playing'; i++) L.step(s, {}, DT); }

// T1: oyun ilerliyor (bot kurup 600 adim oynuyor)
var s1 = L.createState(5); build(s1); L.step(s1, { start: true }, DT); run(s1, 600);
check('T1 oyun ilerliyor', s1.score > 0 || s1.items.length > 0 || s1.tickN > 0, 'score=' + s1.score + ' tick=' + s1.tickN + ' status=' + s1.status);

// T2: kaybetmek mumkun (hic parca konmaz)
var s2 = L.createState(5); L.step(s2, { start: true }, DT); run(s2, 60 * 60);
check('T2 kayip mumkun', s2.status === 'over' && s2.overReason.length > 0, s2.overReason);

// T2b: yanlis kutu kaybi
var s2b = L.createState(5); var i, x, y;
// kirmizi ve mavi kutuyu bilerek ters bagla: ayirici yerine duz ok, tum parcalar ayni kutuya
setCell(s2b, 1, s2b.sy, 1);
for (x = 2; x <= 7; x++) setCell(s2b, x, s2b.sy, 1);
// sy satirinin sonunda kutu yok -> kaybolur; yanlis kutu icin ry satirina cevir
s2b = L.createState(5);
setCell(s2b, 1, s2b.sy, 4);
for (y = s2b.sy - 1; y > s2b.ry; y--) setCell(s2b, 1, y, 4);
for (x = 1; x <= 7; x++) setCell(s2b, x, s2b.ry, 1);
L.step(s2b, { start: true }, DT); run(s2b, 60 * 60);
check('T2b yanlis kutu kaybi sebebi', s2b.status === 'over' && /Yanlış kutu/.test(s2b.lastMiss + s2b.overReason), s2b.overReason);

// T3: kazanc erisilebilir, 3 seed
var allWon = true, info = [];
[1, 7, 42].forEach(function (sd) {
  var s = L.createState(sd); build(s); L.step(s, { start: true }, DT); run(s, 60 * 600);
  info.push(sd + ':' + s.status + '/' + s.score + '/' + s.misses);
  if (s.status !== 'won') allWon = false;
});
check('T3 dogru oynayinca kazanilir', allWon, info.join(' '));

// T4: yeniden baslatma temiz
var a = L.createState(99), b = L.createState(99);
check('T4 ayni seed ayni durum, playing', JSON.stringify(a) === JSON.stringify(b) && a.status === 'playing');

// Ek: parca hakki sinirli
var s6 = L.createState(3), cnt = 0;
for (y = 0; y < s6.h; y++) for (x = 1; x < s6.w - 1; x++) { if (s6.grid[y * s6.w + x] === 0) { L.step(s6, { click: { x: x, y: y } }, DT); } }
check('T6 parca hakki siniri', s6.used <= s6.maxT && s6.used === s6.maxT, 'used=' + s6.used);

// Ek: kayalar cozum satirlarinda degil
var rockOk = true;
for (i = 1; i <= 200; i++) { var q = L.createState(i); for (x = 1; x <= 7; x++) for (y = 0; y < q.h; y++) { if (q.grid[y * q.w + x] === 9 && (y === q.sy || y === q.ry || y === q.by || x < 2)) rockOk = false; } }
check('T7 kaya cozum yolunu kesmez (200 seed)', rockOk);

console.log(fails ? 'OZET: ' + fails + ' FAIL' : 'OZET: hepsi PASS');
if (fails) process.exit(1);
