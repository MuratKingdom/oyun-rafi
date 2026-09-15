'use strict';

var Logic = require('./logic.js');

var results = [];
var failed = false;

function check(name, cond, info) {
  results.push((cond ? 'PASS' : 'FAIL') + ' - ' + name + (info ? ' (' + info + ')' : ''));
  if (!cond) failed = true;
}

var DT = 1 / 60;

function findSourceIndex(grid, type) {
  for (var i = 0; i < grid.length; i++) {
    if (grid[i].type === type) return i;
  }
  return -1;
}

function moveTo(state, tx, ty, guardMax) {
  var guard = 0;
  var max = guardMax || 500;
  while ((state.cx !== tx || state.cy !== ty) && guard < max) {
    Logic.step(state, { right: state.cx < tx, down: state.cy < ty }, DT);
    guard++;
  }
  return guard;
}

// T1 - oyun ilerliyor: 600 adım (10s) senaryolu girdiyle durum anlamlı değişir
(function () {
  var state = Logic.createState(42);
  var GRID_W = Logic.GRID_W || 5;
  var idx = findSourceIndex(state.grid, 'wood-source');
  var tx = idx % GRID_W;
  var ty = Math.floor(idx / GRID_W);
  var initialScore = state.score;
  var initialWater = state.water;

  moveTo(state, tx, ty);
  Logic.step(state, { action: true }, DT);
  for (var i = 0; i < 600; i++) Logic.step(state, {}, DT);

  var changed = state.score !== initialScore || state.water !== initialWater;
  check('T1 oyun ilerliyor', changed, 'score=' + state.score.toFixed(3) + ' water=' + state.water.toFixed(3));
})();

// T2 - kaybetmek mümkün: girdisiz bırakılınca su tükeniyor
(function () {
  var state = Logic.createState(7);
  var guard = 0;
  while (state.status === 'playing' && guard < 4000) {
    Logic.step(state, {}, DT);
    guard++;
  }
  check('T2 kaybetmek mümkün', state.status === 'over' && !!state.overReason,
    'status=' + state.status + ' reason=' + state.overReason + ' steps=' + guard);
})();

// T3 - ilerleme/kazanç mümkün: doğru oynanışta score artıyor
(function () {
  var state = Logic.createState(13);
  var GRID_W = Logic.GRID_W || 5;
  var idx = findSourceIndex(state.grid, 'wood-source');
  var tx = idx % GRID_W;
  var ty = Math.floor(idx / GRID_W);

  moveTo(state, tx, ty);
  Logic.step(state, { action: true }, DT);
  for (var i = 0; i < 300; i++) Logic.step(state, {}, DT);

  check('T3 ilerleme mümkün', state.score > 0, 'score=' + state.score.toFixed(3));
})();

// T4 - yeniden başlatma temiz: aynı seed -> birebir aynı ilk durum
(function () {
  var a = Logic.createState(99);
  var b = Logic.createState(99);
  var same = JSON.stringify(a) === JSON.stringify(b);
  check('T4 yeniden başlatma temiz', same && a.status === 'playing', 'equal=' + same + ' status=' + a.status);
})();

results.forEach(function (r) { console.log(r); });
console.log('Özet: ' + (failed ? 'FAIL var' : 'hepsi PASS'));
process.exit(failed ? 1 : 0);
