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

console.log('--- özet: ' + (fails === 0 ? 'tüm testler PASS' : fails + ' test FAIL'));
process.exit(fails === 0 ? 0 : 1);
