'use strict';
var fails = 0;
function check(name, ok, info) {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? ' — ' + info : ''));
  if (!ok) fails++;
}
var calls = 0;
var ctx = new Proxy({}, {
  get: function (t, p) {
    if (p in t) return t[p];
    return function () {
      calls++;
      if (p === 'createLinearGradient') return { addColorStop: function () {} };
      if (p === 'measureText') return { width: 10 };
    };
  },
  set: function (t, p, v) { t[p] = v; return true; }
});
var canvasL = {};
var canvas = {
  width: 640, height: 400,
  getContext: function () { return ctx; },
  addEventListener: function (n, f) { canvasL[n] = f; },
  getBoundingClientRect: function () { return { left: 0, top: 0, width: 640, height: 400 }; }
};
var winL = {}, queue = [];
global.document = {
  readyState: 'loading',
  getElementById: function () { return canvas; },
  addEventListener: function () {}
};
global.window = {
  addEventListener: function (n, f) { winL[n] = f; },
  requestAnimationFrame: function (f) { queue.push(f); },
  AudioContext: function () {
    this.currentTime = 0; this.destination = {};
    this.createOscillator = function () { return { frequency: {}, connect: function () {}, start: function () {}, stop: function () {} }; };
    this.createGain = function () { return { gain: { exponentialRampToValueAtTime: function () {} }, connect: function () {} }; };
  }
};
var store = {};
global.localStorage = { getItem: function (k) { return k in store ? store[k] : null; }, setItem: function (k, v) { store[k] = v; } };
global.requestAnimationFrame = global.window.requestAnimationFrame;
global.AudioContext = global.window.AudioContext;

var game, ts = 0;
function frames(n) {
  for (var i = 0; i < n; i++) { var f = queue.shift(); ts += 1000 / 60; if (f) f(ts); }
}
try {
  require('./logic.js'); require('./render.js');
  var M = require('./main.js');
  game = M.bootstrap();
  check('T5a yükleme/bootstrap istisnasız', !!game);
} catch (e) { check('T5a yükleme/bootstrap istisnasız', false, e.stack); process.exit(1); }

frames(120);
check('T5b çizim çağrıları', calls > 0, calls + ' çağrı');

var before = game.getState().target;
winL.keydown({ key: 'ArrowRight', preventDefault: function () {} });
frames(30);
check('T5c girdi bağlı', game.getState().target !== before, before + ' -> ' + game.getState().target);

game.getState().status = 'over';
game.getState().overReason = 'test';
winL.keydown({ key: 'r', preventDefault: function () {} });
frames(2);
check('T5d R ile yeniden başlatma', game.getState().status === 'playing');

console.log(fails ? 'ÖZET: ' + fails + ' FAIL' : 'ÖZET: hepsi PASS');
if (fails) process.exit(1);
