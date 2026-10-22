var L = require('./logic.js');
var fails = 0;
function check(name, ok, info) {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? ' — ' + info : ''));
  if (!ok) fails++;
}
var DT = 1 / 60;

// bot: bırakma anı = cur.x ile üst blok arasındaki fark hedef ofsete eşit
function run(seed, steps, off) {
  var s = L.createState(seed), prev = false;
  for (var i = 0; i < steps && s.status === 'playing'; i++) {
    var top = s.stack[s.stack.length - 1];
    var want = s.phase === 'swing' && !prev && Math.abs(s.cur.x - (top.x + off)) < 3;
    prev = want;
    L.step(s, { action: want }, DT);
    if (!want) prev = false;
  }
  return s;
}

// T1: 600 adım sonunda durum değişmiş
var s1 = run(7, 600, 0);
check('T1 oyun ilerliyor', s1.score > 0 && s1.stack.length > 1, 'skor ' + s1.score + ', blok ' + s1.stack.length);

// T2: kayıp mümkün (ilk adımda bırak -> kenarda, tabanı ıskalar)
var s2 = L.createState(3);
L.step(s2, { action: true }, DT);
for (var i = 0; i < 120; i++) L.step(s2, { action: false }, DT);
check('T2 kaybetmek mümkün', s2.status === 'over' && s2.overReason.length > 0, s2.overReason);

// T2b: devrilme ile kayıp (hep sağa kaydırarak)
var s2b = run(5, 6000, 45);
check('T2b devrilme ile kayıp', s2b.status === 'over' && /devrildi/.test(s2b.overReason), s2b.overReason + ' skor ' + s2b.score);

// T3: hizalı oynanışta skor artıyor (3 seed)
var ok3 = true, info3 = [];
[11, 12, 13].forEach(function (sd) {
  var s = run(sd, 3600, 0);
  info3.push(s.score);
  if (s.score < 30) ok3 = false;
});
check('T3 ilerleme mümkün', ok3, 'skorlar ' + info3.join(','));

// T4: temiz yeniden başlatma
var a = JSON.stringify(L.createState(99)), b = JSON.stringify(L.createState(99));
check('T4 yeniden başlatma temiz', a === b && L.createState(99).status === 'playing');

console.log(fails ? 'FAIL: ' + fails : 'Tüm testler PASS');
process.exit(fails ? 1 : 0);
