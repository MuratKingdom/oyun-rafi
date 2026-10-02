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

// --- Yeni güçler ve engeller ---------------------------------------------------
// T23 — nefes alan kapı: ağız ortası sabit, boy [PULSE_MIN·boy, boy] aralığında gerçekten değişir
(function t23() {
  var s = quiet(createState(3));
  var w = wallAt(500, 180, 150, { baseH: 150, pulse: { freq: 2, phase: 0 } });
  s.obstacles = [w];
  var lo = Infinity, hi = -Infinity, centerOk = true;
  for (var i = 0; i < 240; i++) {
    s.obstacles[0].x = 500;
    s.y = 420; s.vy = 0;
    s = step(s, { action: false }, DT);
    var o = s.obstacles[0];
    lo = Math.min(lo, o.gapH); hi = Math.max(hi, o.gapH);
    if (Math.abs(o.gapY + o.gapH / 2 - (180 + 75)) > 1e-6) centerOk = false;
  }
  var ok = centerOk && lo >= 150 * C2.PULSE_MIN - 1e-6 && hi <= 150 + 1e-6 && hi - lo > 30;
  report('T23 nefes alan kapı', ok, 'boy ' + lo.toFixed(0) + '..' + hi.toFixed(0) + ' orta sabit=' + centerOk);
})();

// T24 — yavaşlatma: alınca süre başlar, duvarlar POWER_SLOW_F hızında kayar, süre bitince normale döner
(function t24() {
  var s = quiet(createState(3));
  s.y = 250; s.vy = 0;
  s.obstacles = [wallAt(C2.BALL_X - C2.WALL_W / 2, 190, 120, { power: { kind: 'slow', taken: false } })];
  s = step(s, { action: false }, DT);
  var taken = s.powers === 1 && s.slowT === C2.POWER_SLOW_T;
  var far = wallAt(500, 100, 300);
  s.obstacles = [far];
  var x0 = far.x, sp = s.speed;
  s.y = 250; s.vy = 0;
  s = step(s, { action: false }, DT);
  var slowMove = x0 - s.obstacles[0].x;
  var ratioOk = Math.abs(slowMove / (s.speed * DT) - C2.POWER_SLOW_F) < 0.02;
  for (var i = 0; i < 260; i++) { s.obstacles[0].x = 500; s.y = 250; s.vy = 0; s = step(s, { action: false }, DT); }
  var x1 = s.obstacles[0].x;
  s = step(s, { action: false }, DT);
  var normalOk = s.slowT === 0 && Math.abs((x1 - s.obstacles[0].x) - s.speed * DT) < 1e-6;
  report('T24 yavaşlatma gücü', taken && ratioOk && normalOk,
    'alındı=' + taken + ' oran=' + (slowMove / (sp * DT)).toFixed(2) + ' süre bitince normal=' + normalOk);
})();

// T25 — küçülme: top yarıçapı küçülür; normal topun sığmadığı ağızdan küçük top geçer
(function t25() {
  function tryGap(small) {
    var s = quiet(createState(3));
    s.smallT = small ? C2.POWER_SMALL_T : 0;
    s.y = 250; s.vy = 0;
    var gh = 2 * C2.BALL_R * 0.85; // normal topa dar, küçük topa geniş
    s.obstacles = [wallAt(C2.BALL_X + 20, 250 - gh / 2, gh)];
    for (var i = 0; i < 30 && s.status === 'playing'; i++) { s.y = 250; s.vy = 0; s = step(s, { action: false }, DT); }
    return s;
  }
  var a = tryGap(false), b = tryGap(true);
  var rOk = Logic.radius({ smallT: 1 }) === C2.BALL_R * C2.POWER_SMALL_F && Logic.radius({ smallT: 0 }) === C2.BALL_R;
  report('T25 küçülme gücü', a.status === 'over' && b.status === 'playing' && rOk,
    'normal=' + a.status + ' küçük=' + b.status + ' yarıçap=' + rOk);
})();

// T26 — zemin dikeni: üstüne sekmek öldürür, kalkan bir kez yutar, havada geçilirse sayılır
(function t26() {
  function onSpike(shield) {
    var s = quiet(createState(3));
    s.shield = shield;
    var w = wallAt(C2.BALL_X - C2.WALL_W - C2.SPIKE_DX - 20, 100, 300, { spike: { dx: C2.SPIKE_DX, w: C2.SPIKE_W, hit: false, passed: false } });
    w.passed = true;
    s.obstacles = [w];
    s.y = C2.FLOOR_Y - C2.BALL_R - 1; s.vy = 200; // bir sonraki adımda zemine değer
    return step(s, { action: false }, DT);
  }
  var dead = onSpike(0), saved = onSpike(1);
  var killOk = dead.status === 'over' && /Diken/.test(dead.overReason);
  var shieldOk = saved.status === 'playing' && saved.shield === 0 && saved.obstacles[0].spike.hit;
  // Havada geçiş: şeridin üstünde top yüksekte; şerit topun arkasına geçince sayılır
  var s = quiet(createState(3));
  var w = wallAt(C2.BALL_X - C2.WALL_W - C2.SPIKE_DX - C2.SPIKE_W + 2, 100, 300, { spike: { dx: C2.SPIKE_DX, w: C2.SPIKE_W, hit: false, passed: false } });
  w.passed = true;
  s.obstacles = [w];
  for (var i = 0; i < 20; i++) { s.y = 250; s.vy = 0; s = step(s, { action: false }, DT); }
  var passOk = s.status === 'playing' && s.spikesPassed === 1;
  report('T26 zemin dikeni', killOk && shieldOk && passOk,
    'kalkansız=' + dead.status + ' (' + dead.overReason + ') kalkanla=' + saved.status + ' havada geçiş sayıldı=' + passOk);
})();

// T27 — yeni öğeler doğru bölümde açılır; çift duvarın ikincisinde nefes/diken yok, hareketli kapı nefes almaz
(function t27() {
  var s = createState(91);
  var seen = { pulse: 0, power: 0, spike: 0, slow: 0, small: 0 }, early = 0, bad = 0;
  for (var lv = 1; lv <= C2.LEVEL_COUNT; lv++) {
    s.level = lv;
    for (var n = 0; n < 60; n++) {
      s.obstacles = []; s.spawnTimer = 0; s.y = 420; s.vy = 0; s.status = 'playing';
      s = step(s, { action: false }, DT);
      var ws = s.obstacles;
      for (var k = 0; k < ws.length; k++) {
        var w = ws[k];
        if (w.pulse) { seen.pulse++; if (lv < C2.PULSE_FROM) early++; if (w.move) bad++; }
        if (w.power) { seen.power++; seen[w.power.kind]++; if (lv < C2.POWER_FROM) early++; if (w.star) bad++; }
        if (w.spike) { seen.spike++; if (lv < C2.SPIKE_FROM) early++; }
      }
      if (ws.length > 1 && (ws[0].spike || ws[1].spike || ws[1].pulse)) bad++;
    }
  }
  var ok = early === 0 && bad === 0 && seen.pulse > 0 && seen.slow > 0 && seen.small > 0 && seen.spike > 0;
  report('T27 yeni öğeler bölümle açılır, adil birleşir', ok,
    'nefes=' + seen.pulse + ' yavaşlat=' + seen.slow + ' küçül=' + seen.small + ' diken=' + seen.spike + ' erken=' + early + ' kural dışı=' + bad);
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

// T22 — tarayıcıdaki gibi tek ortak kapsam: betikler birbirinin değişkenlerini ezmemeli.
// (Node'da her dosya kendi modül kapsamında çalıştığı için bu hata yalnız tarayıcıda görünürdü:
//  render.js'in FLOOR_Y'si logic.js'inkini, ileride quests.js'in load/save'i shop.js'inkini eziyordu.)
(function t22() {
  var vm = require('vm'), fs = require('fs'), path = require('path');
  var store = {};
  var ctx = { console: console, Math: Math, JSON: JSON, Date: Date,
    localStorage: { getItem: function (k) { return store[k] === undefined ? null : store[k]; }, setItem: function (k, v) { store[k] = String(v); } } };
  ctx.window = ctx;
  vm.createContext(ctx);
  ['logic.js', 'shop.js', 'quests.js', 'render.js'].forEach(function (f) {
    var file = path.join(__dirname, f);
    if (fs.existsSync(file)) vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: f });
  });
  var L = ctx.GameLogic, R = ctx.GameRender, S = ctx.GameShop;
  var noop = function () {};
  var fake = { canvas: { width: 520, height: 900 }, fillRect: noop, strokeRect: noop, beginPath: noop, moveTo: noop, lineTo: noop,
    stroke: noop, fill: noop, arc: noop, fillText: noop, rect: noop, closePath: noop, save: noop, restore: noop,
    translate: noop, setTransform: noop, scale: noop };
  // uzun alanla bir kare çiz (render kendi geometrisini ayarlar), sonra yeni oyunun geometrisine bak
  R.draw(fake, L.createState(1, { height: 900 }), {});
  var g1 = L.createState(2, { height: 900 }).geo;
  R.draw(fake, L.createState(3, { height: 1000 }), {});
  var g2 = L.createState(4, { height: 540 }).geo;
  S.save(ctx.localStorage, S.createProfile());
  var prof = S.load(ctx.localStorage);
  var ok = g1.floorY === 840 && g2.floorY === 480 && g2.k === 1 && prof.equipped && prof.equipped.map === 'gece';
  report('T22 ortak kapsamda betikler birbirini ezmiyor', ok,
    'H900 zemin=' + g1.floorY + ' (840) · H540 zemin=' + g2.floorY + ' (480) · mağaza profili=' + (prof.equipped ? 'sağlam' : 'BOZUK'));
})();

// --- Günlük görevler ----------------------------------------------------------
var Q = require('./quests.js');

// T18 — günün görevleri deterministik, 3 farklı tür, günden güne değişir
(function t18() {
  var a = Q.generate('2026-10-02'), b = Q.generate('2026-10-02'), c = Q.generate('2026-10-03');
  var kinds = a.map(function (q) { return q.kind; });
  var distinct = kinds.filter(function (k, i) { return kinds.indexOf(k) === i; }).length === 3;
  var same = JSON.stringify(a) === JSON.stringify(b);
  // 30 gün içinde en az 5 farklı görev seti
  var sets = {};
  for (var d = 1; d <= 30; d++) sets[JSON.stringify(Q.generate('2026-11-' + (d < 10 ? '0' : '') + d).map(function (q) { return q.kind + q.target; }))] = 1;
  var variety = Object.keys(sets).length;
  report('T18 günlük görev seçimi', a.length === 3 && distinct && same && variety >= 5 && JSON.stringify(a) !== JSON.stringify(c),
    'bugün=' + kinds.join(',') + ' 30 günde ' + variety + ' farklı set');
})();

// T19 — giriş serisi: ardışık gün artar (tavan 7), gün atlanınca 1'e döner, aynı gün ikinci açılış ödül vermez
(function t19() {
  var d = Q.fresh(), got = [];
  ['2026-10-01', '2026-10-02', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-09']
    .forEach(function (k) { got.push(Q.ensureDay(d, k).coins); });
  var ok = JSON.stringify(got) === JSON.stringify([3, 4, 0, 5, 6, 7, 7, 7, 3]) && d.streak === 1;
  var monthEdge = Q.dayDiff('2026-10-31', '2026-11-01') === 1 && Q.dayDiff('2026-12-31', '2027-01-01') === 1;
  report('T19 giriş serisi', ok && monthEdge, 'ödüller=' + got.join(',') + ' seri=' + d.streak + ' ay/yıl geçişi=' + monthEdge);
})();

// T20 — ilerleme: tek koşu görevleri en iyiyi tutar, günlükler birikir, tamamlanınca bir kez ödül verir
(function t20() {
  var d = Q.fresh();
  Q.ensureDay(d, '2026-10-02');
  d.quests = [
    { kind: 'run_stars', target: 5, reward: 12, progress: 0, done: false },
    { kind: 'day_gates', target: 40, reward: 12, progress: 0, done: false },
    { kind: 'win', target: 1, reward: 25, progress: 0, done: false }
  ];
  var r1 = Q.applyRun(d, { stars: 3, score: 25, level: 4, status: 'over' });
  var p1 = d.quests.map(function (q) { return q.progress; }).join(',');
  var r2 = Q.applyRun(d, { stars: 6, score: 20, level: 3, status: 'over' });
  var r3 = Q.applyRun(d, { stars: 9, score: 80, level: 10, status: 'won' });
  var r4 = Q.applyRun(d, { stars: 9, score: 80, level: 10, status: 'won' });
  var ok = r1.length === 0 && p1 === '3,25,0' &&
    r2.length === 2 && r2[0].reward === 12 && r2[1].reward === 12 &&
    r3.length === 1 && r3[0].reward === 25 && r4.length === 0;
  report('T20 görev ilerlemesi ve tek seferlik ödül', ok,
    'koşu1=' + r1.length + ' koşu2=' + r2.map(function (x) { return x.text; }).join(' | ') + ' koşu3=' + r3.length + ' tekrar=' + r4.length);
})();

// T21 — bozuk/kurcalanmış günlük kayıt: görevler kayıttan değil tarihten üretilir, ilerleme hedefe kırpılır
(function t21() {
  function mem(v) { var x = { 'sekmeguc-gunluk': v }; return { getItem: function (k) { return x[k] === undefined ? null : x[k]; }, setItem: function (k, y) { x[k] = y; } }; }
  var a = Q.load(mem('{bozuk'));
  var real = Q.generate('2026-10-02');
  var hacked = { day: '2026-10-02', streak: -4, lastLogin: 'dün', quests: real.map(function (q) { return { kind: q.kind, target: 1, reward: 9999, progress: 99999, done: true }; }) };
  var b = Q.load(mem(JSON.stringify(hacked)));
  var ok = a.day === '' && a.quests.length === 0 && b.streak === 0 && b.lastLogin === '' &&
    b.quests.every(function (q, i) { return q.reward === real[i].reward && q.target === real[i].target && q.progress === q.target; });
  report('T21 günlük kayıt doğrulama', ok, 'bozuk→boş, kurcalanmış ödül=' + b.quests.map(function (q) { return q.reward; }).join('/') + ' (gerçek ' + real.map(function (q) { return q.reward; }).join('/') + ')');
})();

console.log('--- özet: ' + (fails === 0 ? 'tüm testler PASS' : fails + ' test FAIL'));
process.exit(fails === 0 ? 0 : 1);
