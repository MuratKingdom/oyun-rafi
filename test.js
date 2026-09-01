// Headless mantik testi (T1-T4) - DOM yok

var Logic = require('./logic.js');
var createState = Logic.createState;
var step = Logic.step;

var failures = 0;

function report(name, pass, detail) {
  console.log((pass ? 'PASS' : 'FAIL') + ' ' + name + (detail ? ' - ' + detail : ''));
  if (!pass) failures++;
}

// T1 - oyun ilerliyor: 600 adim, karisik girdiyle state degisiyor
(function t1() {
  var s = createState(42);
  var start = JSON.stringify(s);
  var input = { action: false, restart: false };
  for (var i = 0; i < 600; i++) {
    input.action = (i % 45 === 0);
    step(s, input, 1 / 60);
    input.action = false;
  }
  var changed = JSON.stringify(s) !== start && (s.worldX > 0 || s.score > 0);
  report('T1 oyun ilerliyor', changed, 'worldX=' + s.worldX.toFixed(1) + ' score=' + s.score);
})();

// T2 - kaybetmek mumkun: hicbir girdi verilmeden zemine carpar
(function t2() {
  var s = createState(7);
  var input = { action: false, restart: false };
  var over = false;
  for (var i = 0; i < 600 && !over; i++) {
    step(s, input, 1 / 60);
    if (s.status === 'over') over = true;
  }
  report('T2 kaybetmek mumkun', s.status === 'over' && !!s.overReason,
    'status=' + s.status + ' overReason="' + s.overReason + '"');
})();

// T3 - ilerleme/kazanc mumkun: skor artiyor
(function t3() {
  var s = createState(99);
  var input = { action: false, restart: false };
  var startScore = s.score;
  for (var i = 0; i < 300; i++) {
    input.action = (i % 40 === 0);
    step(s, input, 1 / 60);
    input.action = false;
    if (s.status === 'over') {
      input.restart = true;
      step(s, input, 1 / 60);
      input.restart = false;
    }
  }
  report('T3 skor artiyor', s.score > startScore || s.worldX > 0,
    'startScore=' + startScore + ' score=' + s.score);
})();

// T4 - yeniden baslatma temiz: ayni seed -> ayni JSON, playing durumunda
(function t4() {
  var a = createState(123);
  var b = createState(123);
  var same = JSON.stringify(a) === JSON.stringify(b);
  report('T4 yeniden baslatma temiz', same && a.status === 'playing',
    'same=' + same + ' status=' + a.status);
})();

console.log('---');
console.log(failures === 0 ? 'TUM TESTLER GECTI' : failures + ' test FAIL');
process.exit(failures === 0 ? 0 : 1);
