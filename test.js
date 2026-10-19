// Headless mantık testi (T1-T4).
const L = require('./logic.js');
const { play, tap } = require('./bot.js');
let fail = 0;
function check(name, ok, info) { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? ' — ' + info : '')); if (!ok) fail++; }

// T1: 600 adımda durum değişiyor
{
  const s = L.createState(7), a = JSON.stringify(s);
  for (let i = 0; i < 600; i++) L.step(s, { right: i % 20 === 2, action: i % 20 === 10, cell: -1 }, 1 / 60);
  check('T1 oyun ilerliyor', JSON.stringify(s) !== a && s.placed > 0 && s.time > 0, 'placed=' + s.placed + ' score=' + s.score);
}
// T2: kaybetmek mümkün (en kötü kareyi seçen bot + hiç oynamayan oyuncu)
{
  const x = play(3, 'worst');
  check('T2 kayıp (kota)', x.status === 'over' && x.overReason.length > 0, x.overReason);
  const s = L.createState(3);
  for (let i = 0; i < 60 * 13; i++) L.step(s, { cell: -1 }, 1 / 60);
  check('T2b kayıp (süre)', s.status === 'over' && /Süre doldu/.test(s.overReason), s.overReason);
}
// T3: doğru oynanışta kazanç erişilebilir (3 seed)
{
  const seeds = [1, 2, 3];
  const res = seeds.map(function (sd) { return play(sd, 'best'); });
  check('T3 kazanç erişilebilir', res.every(function (r) { return r.status === 'won' && r.score >= L.QUOTA[25]; }), res.map(function (r) { return r.status + ':' + r.score; }).join(' '));
}
// T4: yeniden başlatma temiz
{
  const a = JSON.stringify(L.createState(42)), b = JSON.stringify(L.createState(42));
  check('T4 aynı seed aynı durum', a === b && L.createState(42).status === 'playing');
  const s = play(3, 'worst');
  tap(s, 'restart');
  check('T4b restart sonrası temiz', s.status === 'playing' && s.placed === 0 && s.score === 0);
}
console.log(fail ? 'ÖZET: ' + fail + ' FAIL' : 'ÖZET: hepsi PASS');
if (fail) process.exit(1);
