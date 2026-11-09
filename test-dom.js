'use strict';
var fails = 0;
function check(name, ok, info) { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? ' — ' + info : '')); if (!ok) fails++; }

var calls = 0, rafQ = [], listeners = {}, store = {};
var ctx2d = new Proxy({}, { get: function (t, p) { if (p in t) return t[p]; return function () { calls++; }; }, set: function (t, p, v) { t[p] = v; return true; } });
var canvas = { width: 576, height: 532, getContext: function () { return ctx2d; }, addEventListener: function (n, f) { listeners['c:' + n] = f; }, getBoundingClientRect: function () { return { left: 0, top: 0, width: 576, height: 532 }; } };
global.window = global;
global.document = { readyState: 'complete', getElementById: function () { return canvas; }, addEventListener: function () {} };
global.localStorage = { getItem: function (k) { return k in store ? store[k] : null; }, setItem: function (k, v) { store[k] = String(v); } };
global.requestAnimationFrame = function (f) { rafQ.push(f); return rafQ.length; };
global.addEventListener = function (n, f) { listeners[n] = f; };
global.AudioContext = function () { this.currentTime = 0; this.destination = {}; this.createOscillator = function () { return { frequency: {}, connect: function () {}, start: function () {}, stop: function () {} }; }; this.createGain = function () { return { gain: { setValueAtTime: function () {}, exponentialRampToValueAtTime: function () {} }, connect: function () {} }; }; };

var M;
try {
  require('./logic.js'); require('./render.js'); M = require('./main.js');
  if (M.bootstrap && !listeners.keydown) M.bootstrap();
  check('T5a yukleme ve bootstrap istisnasiz', true);
} catch (e) { check('T5a yukleme ve bootstrap istisnasiz', false, e && e.stack); process.exit(1); }

var t = 0;
function frames(n) { for (var i = 0; i < n; i++) { t += 16.7; var q = rafQ; rafQ = []; q.forEach(function (f) { f(t); }); } }
frames(120);
check('T5b cizim cagrilari > 0', calls > 0, 'calls=' + calls);

var st = global.GameMain.getState();
var before = JSON.stringify([st.cx, st.cy, st.used]);
listeners.keydown({ code: 'ArrowRight', preventDefault: function () {} });
listeners.keydown({ code: 'Space', preventDefault: function () {} });
frames(30);
var after = JSON.stringify([st.cx, st.cy, st.used]);
check('T5c tus girdisi state degistirir', before !== after, before + ' -> ' + after);

global.GameMain.getState().status = 'over';
listeners.keydown({ code: 'KeyR', preventDefault: function () {} });
frames(2);
check('T5d R ile yeniden baslama', global.GameMain.getState().status === 'playing');

console.log(fails ? 'OZET: ' + fails + ' FAIL' : 'OZET: hepsi PASS');
if (fails) process.exit(1);
