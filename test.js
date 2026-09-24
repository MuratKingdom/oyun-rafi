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

console.log('--- özet: ' + (fails === 0 ? 'tüm testler PASS' : fails + ' test FAIL'));
process.exit(fails === 0 ? 0 : 1);
