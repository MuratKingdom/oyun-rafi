// Sekme Gücü — headless mantık testi (T1-T4)
var Logic = require('./logic.js');
var createState = Logic.createState;
var step = Logic.step;

var DT = 1 / 60;
var fails = 0;

function report(name, ok, detail) {
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + (detail ? ' — ' + detail : ''));
  if (!ok) fails++;
}

// T1 — oyun ilerliyor
(function t1() {
  var s = createState(42);
  var startY = s.y;
  var input = { action: false };
  for (var i = 0; i < 600; i++) {
    input.action = (i % 40) < 15;
    s = step(s, input, DT);
  }
  var changed = s.y !== startY || s.distance > 0 || s.bounces > 0;
  report('T1 oyun ilerliyor', changed, 'y0=' + startY + ' y=' + s.y + ' distance=' + s.distance.toFixed(1) + ' status=' + s.status);
})();

// T2 — kaybetmek mümkün (sürekli yukarı itiş -> tavana çarpma)
(function t2() {
  var s = createState(7);
  var input = { action: true };
  var hitStep = -1;
  for (var i = 0; i < 300; i++) {
    s = step(s, input, DT);
    if (s.status === 'over') { hitStep = i; break; }
  }
  var ok = s.status === 'over' && typeof s.overReason === 'string' && s.overReason.length > 0;
  report('T2 kaybetmek mümkün', ok, 'status=' + s.status + ' reason="' + s.overReason + '" step=' + hitStep);
})();

// T3 — ilerleme/kazanç mümkün (hedef yüksekliği takip eden basit kontrolcü ile kapıdan geçiş)
(function t3() {
  var s = createState(99);
  var input = { action: false };
  for (var i = 0; i < 1800 && s.status === 'playing'; i++) {
    var target = null;
    for (var k = 0; k < s.obstacles.length; k++) {
      var o = s.obstacles[k];
      if (o.x + 28 > 0) { target = o; break; }
    }
    var mid = target ? (target.gapY + target.gapH / 2) : 250;
    input.action = s.y > mid;
    s = step(s, input, DT);
  }
  var ok = s.score > 0;
  report('T3 ilerleme/kazanç mümkün', ok, 'score=' + s.score + ' status=' + s.status + ' overReason="' + s.overReason + '"');
})();

// T4 — yeniden başlatma temiz
(function t4() {
  var a = createState(1234);
  var b = createState(1234);
  var same = JSON.stringify(a) === JSON.stringify(b);
  var ok = same && a.status === 'playing';
  report('T4 yeniden başlatma temiz', ok, 'aynı=' + same + ' status=' + a.status);
})();

// T6 — zorluk eğrisi sınırlı ve tekdüze (hız artar, kapı daralır, tavanı aşmaz)
(function t6() {
  var C = Logic.CONST;
  var d0 = Logic.difficulty(0);
  var ok = d0 === 0;
  var prev = -1;
  for (var t = 0; t <= 1200; t += 5) {
    var d = Logic.difficulty(t);
    if (!(d >= prev && d >= 0 && d < 1)) ok = false;
    prev = d;
  }
  var s = createState(5);
  s.t = 10000;
  s = step(s, { action: false }, DT);
  var bounded = s.speed <= C.SPEED_MAX + 1e-9 && s.gapH >= C.GAP_MIN - 1e-9;
  report('T6 zorluk eğrisi sınırlı ve tekdüze', ok && bounded,
    'd(0)=' + d0 + ' d(60)=' + Logic.difficulty(60).toFixed(3) + ' tavan hız=' + s.speed.toFixed(1) + ' en dar kapı=' + s.gapH.toFixed(1));
})();

// --- Bölümler ve yeni öğeler (2. adım) ---------------------------------------
var C2 = Logic.CONST;
function wallAt(x, gapY, gapH, extra) {
  var w = { x: x, baseY: gapY, gapY: gapY, gapH: gapH, passed: false, hit: false, move: null, star: null };
  for (var k in (extra || {})) w[k] = extra[k];
  return w;
}
function quiet(s) { s.spawnTimer = 999; return s; } // testte rastgele duvar doğmasın

// T7 — bölüm atlama: GATES_PER_LEVEL. kapıda bölüm 1 artar
(function t7() {
  var s = quiet(createState(3));
  s.score = C2.GATES_PER_LEVEL - 1;
  s.y = 250; s.vy = 0;
  s.obstacles = [wallAt(C2.BALL_X - C2.WALL_W - 1, 150, 200)]; // ağzı topu sarıyor, geçmek üzere
  s = step(s, { action: false }, DT);
  report('T7 bölüm atlama', s.level === 2 && s.score === C2.GATES_PER_LEVEL && s.status === 'playing',
    'level=' + s.level + ' score=' + s.score + ' status=' + s.status);
})();

// T8 — kazanma: son bölümün son kapısı geçilince status 'won'
(function t8() {
  var s = quiet(createState(3));
  s.level = C2.LEVEL_COUNT;
  s.score = C2.LEVEL_COUNT * C2.GATES_PER_LEVEL - 1;
  s.y = 250; s.vy = 0;
  s.obstacles = [wallAt(C2.BALL_X - C2.WALL_W - 1, 150, 200)];
  s = step(s, { action: false }, DT);
  report('T8 kazanma koşulu', s.status === 'won' && s.overReason.length > 0, 'status=' + s.status + ' reason="' + s.overReason + '"');
})();

// T9 — yıldız kalkan verir; kalkan bir duvar çarpmasını yutar, ikincisinde ölünür
(function t9() {
  var s = quiet(createState(3));
  s.y = 250; s.vy = 0;
  s.obstacles = [wallAt(C2.BALL_X - C2.WALL_W / 2, 250 - 60, 120, { star: { taken: false } })];
  s = step(s, { action: false }, DT);
  var gotStar = s.stars === 1 && s.shield === 1;
  // topu duvarın içine, ağzın dışına koy: kalkan yutmalı
  s.obstacles = [wallAt(C2.BALL_X - 5, 60, 80)];
  s.y = 300; s.vy = 0;
  s = step(s, { action: false }, DT);
  var absorbed = s.status === 'playing' && s.shield === 0 && s.shieldUsed === 1;
  s = step(s, { action: false }, DT); // aynı duvar ikinci kez öldürmez
  var sameWallSafe = s.status === 'playing';
  s.obstacles = [wallAt(C2.BALL_X - 5, 60, 80)];
  s = step(s, { action: false }, DT);
  var diesWithout = s.status === 'over';
  report('T9 yıldız → kalkan → çarpma yutulur', gotStar && absorbed && sameWallSafe && diesWithout,
    'yıldız=' + gotStar + ' yuttu=' + absorbed + ' aynıDuvarGüvenli=' + sameWallSafe + ' kalkansızÖlüm=' + diesWithout);
})();

// T10 — hareketli kapı salınır ama oyun alanından taşmaz
(function t10() {
  var s = quiet(createState(3));
  s.y = 420; s.vy = 0;
  var w = wallAt(500, 200, 130, { move: { amp: 300, freq: 2, phase: 0 } });
  s.obstacles = [w];
  var lo = Infinity, hi = -Infinity;
  for (var i = 0; i < 240; i++) { // 4 sn: freq=2 ile tam bir turdan fazla
    s.obstacles[0].x = 500; // duvarı topa ulaştırmadan yalnız salınımı izle
    s.y = 420; s.vy = 0;
    s = step(s, { action: false }, DT);
    lo = Math.min(lo, s.obstacles[0].gapY); hi = Math.max(hi, s.obstacles[0].gapY);
  }
  var inside = lo >= C2.CEIL_Y && hi + s.obstacles[0].gapH <= C2.FLOOR_Y;
  report('T10 hareketli kapı sınır içinde salınır', hi - lo > 50 && inside, 'gapY ' + lo.toFixed(0) + '..' + hi.toFixed(0));
})();

// T11 — art arda iki kapının yükseklik farkı MAX_JUMP'ı aşmaz; öğeler bölümle açılır
(function t11() {
  var s = createState(77);
  var prev = null, maxJump = 0, seen = { move: 0, star: 0, double: 0 }, early = 0;
  for (var lv = 1; lv <= C2.LEVEL_COUNT; lv++) {
    s.level = lv;
    for (var n = 0; n < 40; n++) {
      s.obstacles = [];
      s.spawnTimer = 0;
      s.y = 420; s.vy = 0; s.status = 'playing';
      s = step(s, { action: false }, DT);
      var ws = s.obstacles;
      for (var k = 0; k < ws.length; k++) {
        if (prev !== null) maxJump = Math.max(maxJump, Math.abs(ws[k].baseY - prev));
        prev = ws[k].baseY;
        if (ws[k].move) { seen.move++; if (lv < C2.MOVE_FROM) early++; }
        if (ws[k].star) { seen.star++; if (lv < C2.STAR_FROM) early++; }
      }
      if (ws.length > 1) { seen.double++; if (lv < C2.DOUBLE_FROM) early++; }
    }
  }
  var ok = maxJump <= C2.MAX_JUMP + 1e-9 && early === 0 && seen.move > 0 && seen.star > 0 && seen.double > 0;
  report('T11 adil dizilim ve bölümle açılan öğeler', ok,
    'en büyük sıçrama=' + maxJump.toFixed(1) + '/' + C2.MAX_JUMP + ' hareketli=' + seen.move + ' yıldız=' + seen.star + ' çift=' + seen.double + ' erken=' + early);
})();

// T12 — kazanılabilirlik: ileriyi simüle eden bir bot 10 bölümü bitirebiliyor
// (insan oynanışının kanıtı değil; dizilimlerin fiziksel olarak geçilebilir olduğunun kanıtı)
(function t12() {
  var Bot = require('./tools/kazanilabilirlik.js');
  var r = Bot.play(1, { shield: true });
  report('T12 oyun kazanılabilir (bot, tohum 1)', r.status === 'won',
    'status=' + r.status + ' skor=' + r.score + ' bölüm=' + r.level + ' süre=' + r.t.toFixed(0) + 's');
})();

// --- Mağaza (3. tur: görünümler) ---------------------------------------------
var Shop = require('./shop.js');

// T13 — satın alma ve kuşanma kuralları
(function t13() {
  var p = Shop.createProfile();
  var r1 = Shop.buy(p, 'ball', 'kup');                // para yok
  p.coins = 50;
  var r2 = Shop.buy(p, 'ball', 'kup');                // 30 öder, kuşanır
  var r3 = Shop.buy(p, 'ball', 'kup');                // ikinci kez alınmaz
  var r4 = Shop.buy(p, 'map', 'yok-boyle-bir-sey');
  var eqBad = Shop.equip(p, 'map', 'neon');            // sahip değil
  var eqOk = Shop.equip(p, 'ball', 'klasik');
  var ok = !r1.ok && r1.reason === 'yetersiz' && r2.ok && p.coins === 20 &&
    !r3.ok && r3.reason === 'zaten-var' && !r4.ok && r4.reason === 'yok' &&
    !eqBad && eqOk && p.equipped.ball === 'klasik' && Shop.owns(p, 'ball', 'kup');
  report('T13 mağaza satın alma/kuşanma', ok,
    'r1=' + r1.reason + ' r2=' + r2.ok + ' kalan=' + p.coins + ' r3=' + r3.reason + ' r4=' + r4.reason + ' sahipsizKuşan=' + eqBad);
})();

// T14 — bozuk ya da kurcalanmış kayıt güvenli varsayılana döner
(function t14() {
  function mem(v) { var d = { 'sekmeguc-profil': v }; return { getItem: function (k) { return d[k] === undefined ? null : d[k]; }, setItem: function (k, x) { d[k] = x; } }; }
  var a = Shop.load(mem('{bozuk json'));
  var b = Shop.load(mem(JSON.stringify({ coins: -5, owned: { ball: ['gezegen', 'hile'], map: 'x' }, equipped: { ball: 'hile', map: 'neon' } })));
  var c = Shop.load(mem(JSON.stringify({ coins: 12.9, owned: { ball: ['kor'] }, equipped: { ball: 'kor' } })));
  var st = mem(null); Shop.save(st, c); var d = Shop.load(st);
  var ok = a.coins === 0 && a.equipped.ball === 'klasik' &&
    b.coins === 0 && b.owned.ball.indexOf('hile') < 0 && b.owned.ball.indexOf('gezegen') >= 0 && b.equipped.ball === 'klasik' && b.equipped.map === 'gece' &&
    c.coins === 12 && c.equipped.ball === 'kor' && d.coins === 12 && d.equipped.ball === 'kor';
  report('T14 kayıt doğrulama', ok, 'bozuk→' + a.coins + ' kurcalanmış→coins=' + b.coins + ',kuşanılan=' + b.equipped.ball + ' gidiş-dönüş=' + d.coins + '/' + d.equipped.ball);
})();

// T15 — ödül: yıldız + geçilen bölüm başına 1 + kazanınca 10; katalog fiyatları erişilebilir
(function t15() {
  var r1 = Shop.reward({ stars: 3, level: 4, status: 'over' });
  var r2 = Shop.reward({ stars: 20, level: 10, status: 'won' });
  var r3 = Shop.reward({ stars: 0, level: 1, status: 'over' });
  var maxPrice = 0;
  ['ball', 'map'].forEach(function (k) { Shop.CATALOG[k].forEach(function (it) { maxPrice = Math.max(maxPrice, it.price); }); });
  var freeDefaults = Shop.find('ball', 'klasik').price === 0 && Shop.find('map', 'gece').price === 0;
  // bir kazanma koşusu (~20 yıldız) en pahalı ürünün en az dörtte birini getirmeli
  var ok = r1 === 6 && r2 === 39 && r3 === 0 && freeDefaults && r2 * 4 >= maxPrice;
  report('T15 ödül ve fiyat dengesi', ok, 'ödüller=' + r1 + '/' + r2 + '/' + r3 + ' en pahalı=' + maxPrice);
})();

// --- Dikey ekran (uzun alan) ---------------------------------------------------
// T16 — ölçek eşdeğerliği: uzun alanda top, kare alandakiyle normalize edildiğinde birebir aynı hareket eder
(function t16() {
  var a = createState(9), b = createState(9, { height: 900 });
  a.spawnTimer = b.spawnTimer = 999;
  var maxErr = 0, ga = a.geo, gb = b.geo;
  for (var i = 0; i < 600; i++) {
    var inp = { action: (i % 50) < 18 };
    a = step(a, inp, DT); b = step(b, inp, DT);
    var na = (a.y - ga.ceilY) / ga.k, nb = (b.y - gb.ceilY) / gb.k;
    // top yarıçapı ölçeklenmez; zemin çarpışma noktası BALL_R*(1-1/k) kadar kayar
    maxErr = Math.max(maxErr, Math.abs(na - nb));
    if (a.status !== b.status) break;
  }
  var tolerance = C2.BALL_R; // yarıçapın ölçeklenmemesinden gelen fark
  var bad = b.geo.H !== 900 || b.geo.k <= 1 || createState(1, { height: 5000 }).geo.H !== C2.MAX_H || createState(1, { height: 10 }).geo.H !== C2.MIN_H;
  report('T16 uzun alan ölçek eşdeğerliği', !bad && a.status === b.status && maxErr <= tolerance,
    'H=' + b.geo.H + ' k=' + b.geo.k.toFixed(3) + ' en büyük normalize fark=' + maxErr.toFixed(2) + 'px (sınır ' + tolerance + ')');
})();

// T17 — uzun alanda da oyun kazanılabilir (bot, tohum 1, H=900)
(function t17() {
  var Bot = require('./tools/kazanilabilirlik.js');
  var r = Bot.play(1, { shield: true, height: 900 });
  report('T17 uzun alanda kazanılabilir (bot, tohum 1, H=900)', r.status === 'won',
    'status=' + r.status + ' skor=' + r.score + ' bölüm=' + r.level);
})();

console.log('--- özet: ' + (fails === 0 ? 'tüm testler PASS' : fails + ' test FAIL'));
process.exit(fails === 0 ? 0 : 1);
