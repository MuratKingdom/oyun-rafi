const { createState, step } = require('./logic.js');
let fails = 0;
function check(n, ok, info) { console.log((ok ? 'PASS ' : 'FAIL ') + n + (info ? ' — ' + info : '')); if (!ok) fails++; }
const DT = 1 / 60;
function bot(s, i) { // her adımda sırayla bir tarlaya dokun
  return { plot: i % 6, restart: false };
}
// T1: 600 adım, ilk 3 saniyede tüm tarlalara ek
{
  const s = createState(7); const g0 = s.grain; const snap0 = JSON.stringify(s.plots);
  for (let i = 0; i < 600; i++) step(s, { plot: i < 6 ? i : -1 }, DT);
  check('T1 oyun ilerliyor', s.grain !== g0 && s.dayT > 0 && s.status === 'playing', 'grain ' + g0 + '->' + s.grain + ', day ' + s.day);
}
// T2: hiçbir şey yapmazsan kıtlıkla kaybedersin
{
  const s = createState(7);
  for (let i = 0; i < 60 * 60 && s.status === 'playing'; i++) step(s, { plot: -1 }, DT);
  check('T2 kaybetmek mümkün', s.status === 'over' && s.overReason.length > 0, s.overReason);
}
// T3: düzgün oynayan bot gün skorunu artırır
{
  const s = createState(7);
  for (let i = 0; i < 60 * 60 * 4 && s.status === 'playing'; i++) {
    let pick = -1;
    for (let k = 0; k < 6; k++) if (s.plots[k].s === 2) { pick = k; break; }
    if (pick < 0 && s.grain >= 1) for (let k = 0; k < 6; k++) if (s.plots[k].s === 0) { pick = k; break; }
    step(s, { plot: pick }, DT);
  }
  check('T3 ilerleme/kazanç mümkün', s.score >= 5, 'score ' + s.score + ' status ' + s.status);
}
// T4: yeniden başlatma temiz
{
  const a = JSON.stringify(createState(42)), b = JSON.stringify(createState(42));
  check('T4 aynı seed aynı durum', a === b && createState(42).status === 'playing');
}
console.log(fails ? 'FAIL: ' + fails : 'Hepsi PASS');
process.exit(fails ? 1 : 0);
