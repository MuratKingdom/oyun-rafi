'use strict';
const { createState, step } = require('./logic.js');
const DT = 1 / 60;
let fails = 0;
function check(name, ok, info) {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? ' — ' + info : ''));
  if (!ok) fails++;
}
const clone = (s) => JSON.parse(JSON.stringify(s));

// T1: 600 adim senaryolu girdi, durum anlamli degisir
(function () {
  const s = createState(7);
  const init = JSON.stringify(s);
  for (let i = 0; i < 600; i++) step(s, { action: (i % 120) < 50 }, DT);
  check('T1 oyun ilerliyor', JSON.stringify(s) !== init, 'x=' + s.x.toFixed(1) + ' skor=' + s.score + ' durum=' + s.status);
})();

// T2: kaybetmek mumkun
(function () {
  const a = createState(7);
  for (let i = 0; i < 10; i++) step(a, { action: true }, DT);
  for (let i = 0; i < 400 && a.status === 'playing'; i++) step(a, { action: false }, DT);
  const b = createState(7);
  for (let i = 0; i < 120; i++) step(b, { action: true }, DT);
  for (let i = 0; i < 600 && b.status === 'playing'; i++) step(b, { action: false }, DT);
  check('T2 kayip mumkun', a.status === 'over' && a.overReason.length > 0 && b.status === 'over' && b.overReason.length > 0,
    '"' + a.overReason + '" / "' + b.overReason + '"');
})();

// T3: bot (guc suresini deneyerek) tum hedefleri tutar
(function () {
  function solve(s) {
    for (let h = 1; h <= 100; h++) {
      const c = clone(s);
      for (let i = 0; i < h; i++) step(c, { action: true }, DT);
      for (let i = 0; i < 3000 && c.status === 'playing' && c.level === s.level; i++) step(c, { action: false }, DT);
      if (c.level > s.level) {
        const lvl0 = s.level;
        for (let i = 0; i < h; i++) step(s, { action: true }, DT);
        for (let i = 0; i < 3000 && s.status === 'playing' && s.level === lvl0; i++) step(s, { action: false }, DT);
        for (let i = 0; i < 100 && s.status === 'playing' && s.phase !== 'aim'; i++) step(s, { action: false }, DT);
        return true;
      }
    }
    return false;
  }
  let allOk = true, seedsOk = 0;
  for (const seed of [1, 7, 42]) {
    const s = createState(seed);
    let guard = 0;
    while (s.status === 'playing' && guard++ < 20) { if (!solve(s)) { allOk = false; break; } }
    if (s.status === 'won' && s.score > 0) seedsOk++; else allOk = false;
  }
  check('T3 ilerleme/kazanc mumkun', allOk, seedsOk + '/3 seed kazandi');
})();

// T4: yeniden baslatma temiz
(function () {
  const a = JSON.stringify(createState(99));
  const dirty = createState(5); for (let i = 0; i < 100; i++) step(dirty, { action: true }, DT);
  const b = JSON.stringify(createState(99));
  check('T4 restart temiz', a === b && createState(99).status === 'playing');
})();

console.log(fails ? 'OZET: ' + fails + ' FAIL' : 'OZET: hepsi PASS');
if (fails) process.exit(1);
