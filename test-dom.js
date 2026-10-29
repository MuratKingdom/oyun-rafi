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
    return function () { calls++; return { width: 10, addColorStop: function () {} }; };
  },
  set: function (t, p, v) { t[p] = v; return true; }
});
var listeners = {}, rafQueue = [], store = {};
var canvas = { width: 900, height: 400, getContext: function () { return ctx; }, addEventListener: function () {}, getBoundingClientRect: function () { return { left: 0, top: 0, width: 900, height: 400 }; } };
global.document = { readyState: 'loading', getElementById: function () { return canvas; }, addEventListener: function () {} };
global.localStorage = { getItem: function (k) { return store[k] === undefined ? null : store[k]; }, setItem: function (k, v) { store[k] = String(v); } };
global.AudioContext = function () {
  this.currentTime = 0; this.destination = {};
  this.createOscillator = function () { return { frequency: {}, connect: function () {}, start: function () {}, stop: function () {} }; };
  this.createGain = function () { return { gain: {}, connect: function () {} }; };
};
global.window = {
  addEventListener: function (n, f) { (listeners[n] = listeners[n] || []).push(f); },
  requestAnimationFrame: function (f) { rafQueue.push(f); },
  AudioContext: global.AudioContext
};
global.requestAnimationFrame = global.window.requestAnimationFrame;

var game, t = 0;
function frames(n) {
  for (var i = 0; i < n; i++) {
    var q = rafQueue; rafQueue = [];
    t += 16.67;
    q.forEach(function (f) { f(t); });
  }
}
function key(type, k) { (listeners[type] || []).forEach(function (f) { f({ key: k, code: k, preventDefault: function () {} }); }); }

try {
  require('./logic.js'); require('./render.js'); require('./main.js');
  game = window.GameMain.bootstrap();
  check('T5a yükleme ve bootstrap istisnasız', !!game);
} catch (e) {
  check('T5a yükleme ve bootstrap istisnasız', false, e.stack);
  process.exit(1);
}
frames(120);
check('T5b çizim çağrıları', calls > 0, calls + ' çağrı');
var a0 = game.getState().angle;
key('keydown', 'ArrowUp');
frames(30);
key('keyup', 'ArrowUp');
check('T5c girdi bağlı', game.getState().angle !== a0, a0 + '->' + game.getState().angle.toFixed(1));
var st = game.getState();
st.status = 'over'; st.overReason = 'test'; st.overTime = 0;
key('keydown', 'r');
frames(2);
check('T5d R ile yeniden başlar', game.getState().status === 'playing' && game.getState() !== st);

console.log(fails ? 'ÖZET: ' + fails + ' FAIL' : 'ÖZET: hepsi PASS');
if (fails) process.exit(1);
