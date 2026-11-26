// Headless mantık testi: node test.js
'use strict';
const L = require('./logic.js');
const DT = 1 / 60;
let fails = 0;
function check(name, ok, info) {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? ' — ' + info : ''));
  if (!ok) fails++;
}
// Basit bot: kancayı at, asılınca kısa bekle, bırak, tekrar at
function botInput(s, mem) {
  const inp = { left: false, right: false, action: false };
  if (s.hook < 0) { mem.act = !mem.act; inp.action = mem.act; }
  else { const a = s.anchors[s.hook]; inp.action = !(s.hanging && a.wear > 0.15); mem.act = inp.action; }
  return inp;
}
function runBot(seed, frames) {
  const s = L.createState(seed), mem = { act: false };
  for (let i = 0; i < frames && s.status === 'playing'; i++) L.step(s, botInput(s, mem), DT);
  return s;
}

// T1 — 600 adımda durum anlamlı değişiyor
{
  const s = L.createState(42); const y0 = s.py, sc0 = s.score;
  const s2 = runBot(42, 600);
  check('T1 oyun ilerliyor', s2.py !== y0 && s2.score !== sc0 && s2.time > 0, 'skor ' + sc0 + ' -> ' + s2.score + ', y ' + y0 + ' -> ' + s2.py.toFixed(0));
}
// T2 — kaybetmek mümkün: başlatıp hiçbir şey yapmamak
{
  const s = L.createState(7);
  L.step(s, { action: true }, DT); // başlat (kanca atılır)
  let i = 0;
  for (; i < 60 * 60 && s.status === 'playing'; i++) L.step(s, { action: false }, DT);
  check('T2 kaybetmek mümkün', s.status === 'over' && typeof s.overReason === 'string' && s.overReason.length > 0,
    'status=' + s.status + ', sebep="' + s.overReason + '", ' + (i / 60).toFixed(1) + ' sn');
}
// T2b — başlamadan sis yükselmiyor (boşta bekleyen anında ölmüyor)
{
  const s = L.createState(7); const f0 = s.fogY;
  for (let i = 0; i < 600; i++) L.step(s, {}, DT);
  check('T2b başlamadan sis sabit', s.status === 'playing' && s.fogY === f0, 'fogY ' + f0 + ' -> ' + s.fogY);
}
// T3 — ilerleme ve kazanç mümkün
{
  const res = [];
  let won = 0, allScore = true;
  for (let sd = 1; sd <= 10; sd++) {
    const s = runBot(sd, 60 * 120);
    res.push(sd + ':' + s.status + '/' + s.score);
    if (s.status === 'won') won++;
    if (!(s.score > 50)) allScore = false;
  }
  check('T3 skor artıyor ve kazanç erişilebilir', allScore && won >= 1, res.join(' '));
}
// T3b — kanca çapaya çekiyor ve kırılma oluyor
{
  const s = L.createState(3);
  L.step(s, { action: true }, DT);
  const h0 = s.hook; let broke = false, snapped = false;
  for (let i = 0; i < 180; i++) { L.step(s, { action: true }, DT); for (const e of s.events) { if (e.type === 'break') broke = true; if (e.type === 'snap') snapped = true; } s.events.length = 0; }
  check('T3b kanca çeker, çapa kırılır', h0 >= 0 && snapped && broke, 'hook=' + h0 + ' snap=' + snapped + ' break=' + broke);
}
// T4 — yeniden başlatma temiz
{
  const a = L.createState(123); runBot(123, 300);
  const b = L.createState(123), c = L.createState(123);
  check('T4 aynı seed aynı ilk durum', JSON.stringify(b) === JSON.stringify(c) && JSON.stringify(a) === JSON.stringify(b) && b.status === 'playing');
}

console.log(fails === 0 ? 'ÖZET: hepsi PASS' : 'ÖZET: ' + fails + ' FAIL');
if (fails) process.exit(1);
