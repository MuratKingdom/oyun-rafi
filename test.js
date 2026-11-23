'use strict';
// Headless mantık testi: node test.js
var L = require('./logic.js'), C = L.C;
var fails = 0;
function check(name, ok, info) { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? ' — ' + info : '')); if (!ok) fails++; }
var DT = 1 / 60;
function run(seed, strat, maxSteps) {
  var s = L.createState(seed);
  for (var i = 0; i < maxSteps && s.status === 'playing'; i++) { var inp = {}; strat(s, inp, i); s = L.step(s, inp, DT); }
  return s;
}
// Hedef sayıda ambara kadar, yalnızca ilkbahar/yaz ve ambar doluyken kuran bot
function planner(target) {
  return function (s, inp) { if (s.season < 2 && s.silos < target && s.grain >= Math.max(C.SILO_COST, L.capacity(s) - 1)) inp.action = true; };
}

// T1 — 600 adımda durum anlamlı değişiyor
var s0 = L.createState(7), g0 = s0.grain;
var s1 = run(7, function (s, inp, i) { if (i === 300) inp.action = true; }, 600);
check('T1 oyun ilerliyor', s1.time > 9.9 && s1.grain !== g0 && s1.silos === 2 && s1.score >= 9,
  'zaman ' + s1.time.toFixed(2) + ', tahıl ' + g0 + ' → ' + s1.grain.toFixed(1) + ', ambar ' + s1.silos);

// T2 — boşta kalan oyuncu kaybediyor (tek ambar kışa yetmez)
var s2 = run(3, function () {}, 60 * 400);
check('T2 kaybetmek mümkün', s2.status === 'over' && s2.overReason.length > 0, s2.overReason + ' @' + s2.time.toFixed(1) + 'sn');

// T2b — aşırı erken yatırım da kaybettiriyor (bakım + boş ambar)
var s2b = run(3, function (s, inp) { if (s.grain >= C.SILO_COST) inp.action = true; }, 60 * 400);
check('T2b aşırı ambar kaybettiriyor', s2b.status === 'over', 'yıl ' + s2b.year + ', ambar ' + s2b.silos + ', ' + s2b.overReason);

// T3 — planlı oynanışta skor artıyor ve en az bir seed'de kazanılıyor
var wins = 0, scores = [], ok3 = true;
for (var sd = 1; sd <= 10; sd++) {
  var r = run(sd, planner(4), 60 * 400);
  scores.push(sd + ':' + r.status[0] + r.score);
  if (r.score <= s2.score) ok3 = false;
  if (r.status === 'won') wins++;
}
check('T3 ilerleme/kazanç mümkün', ok3 && wins >= 1, 'galibiyet ' + wins + '/10 · ' + scores.join(' '));

// T3b — kazanma skorunda kalan tahıl ekleniyor
var won = null;
for (var sd2 = 1; sd2 <= 40 && !won; sd2++) { var rr = run(sd2, planner(4), 60 * 400); if (rr.status === 'won') won = rr; }
check('T3b kazanınca skor = süre + kalan tahıl', !!won && won.score === Math.floor(won.time) + Math.floor(won.grain),
  won ? 'skor ' + won.score + ', süre ' + won.time.toFixed(1) + ', tahıl ' + won.grain.toFixed(1) : 'galibiyet yok');

// T4 — aynı seed ile temiz yeniden başlangıç
var a = L.createState(42), b = L.createState(42);
check('T4 yeniden başlatma temiz', JSON.stringify(a) === JSON.stringify(b) && a.status === 'playing' && a.score === 0);

// T4b — kayıptan sonra restart girdisi oyunu baştan başlatıyor
var s4 = L.step(s2, { restart: true }, DT);
check('T4b restart girdisi', s4.status === 'playing' && s4.overReason === '' && s4.score === 0 && s4.silos === C.START_SILO && s4.grain === C.START_GRAIN);

// T6 — kapasite taşması kaybediliyor ve sayılıyor
var s6 = run(5, function () {}, 60 * 20);
check('T6 taşma kapasiteyle sınırlı', s6.grain <= L.capacity(s6) + 1e-9 && s6.wasted > 0, 'tahıl ' + s6.grain.toFixed(1) + '/' + L.capacity(s6) + ', taşan ' + s6.wasted.toFixed(1));

console.log(fails ? 'SONUÇ: ' + fails + ' FAIL' : 'SONUÇ: hepsi PASS');
process.exit(fails ? 1 : 0);
