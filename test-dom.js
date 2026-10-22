var fails = 0;
function check(name, ok, info) {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? ' — ' + info : ''));
  if (!ok) fails++;
}
var calls = 0, handlers = {}, rafQueue = [], store = {};
var ctx = new Proxy({}, {
  get: function (t, p) {
    if (p in t) return t[p];
    return function () { calls++; return { addColorStop: function () {}, width: 10 }; };
  },
  set: function (t, p, v) { t[p] = v; return true; }
});
var canvas = { getContext: function () { return ctx; }, addEventListener: function () {}, width: 480, height: 640 };
global.document = {
  readyState: 'complete',
  getElementById: function () { return canvas; },
  addEventListener: function () {}
};
global.window = {
  requestAnimationFrame: function (f) { rafQueue.push(f); },
  addEventListener: function (n, f) { handlers[n] = f; },
  AudioContext: function () {
    this.currentTime = 0; this.destination = {};
    this.createOscillator = function () { return { frequency: {}, connect: function () {}, start: function () {}, stop: function () {} }; };
    this.createGain = function () { return { gain: { exponentialRampToValueAtTime: function () {} }, connect: function () {} }; };
  }
};
global.localStorage = { getItem: function (k) { return store[k] || null; }, setItem: function (k, v) { store[k] = v; } };
var t = 0;
function frames(n) { for (var i = 0; i < n; i++) { t += 1000 / 60; var f = rafQueue.shift(); if (f) f(t); } }

var main;
try {
  require('./logic.js'); window.GameLogic = require('./logic.js');
  window.GameRender = require('./render.js');
  global.GameLogic = window.GameLogic; global.GameRender = window.GameRender;
  main = require('./main.js');
  check('T5a yükleme/bootstrap istisnasız', true);
} catch (e) { check('T5a yükleme/bootstrap istisnasız', false, e.stack); process.exit(1); }

frames(120);
check('T5b çizim yapılıyor', calls > 0, calls + ' çağrı');

var st = main.getState();
handlers.keydown({ key: ' ', preventDefault: function () {} });
frames(2);
check('T5c girdi bağlı', main.getState().phase === 'fall' || main.getState().stack.length > 1, 'phase ' + main.getState().phase);
handlers.keyup({ key: ' ' });
frames(60);

main.getState().status = 'over';
main.getState().overT = 0;
handlers.keydown({ key: 'r', preventDefault: function () {} });
frames(2);
check('T5d R ile yeniden başlatma', main.getState().status === 'playing');

console.log(fails ? 'FAIL: ' + fails : 'Tüm testler PASS');
process.exit(fails ? 1 : 0);
