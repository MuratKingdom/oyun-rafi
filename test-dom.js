'use strict';
var fails = 0;
function check(name, ok) { console.log((ok ? 'PASS ' : 'FAIL ') + name); if (!ok) fails++; }
var calls = 0, rafQ = [], winL = {}, canL = {};
var ctx = new Proxy({}, { get: function (t, p) { if (p in t) return t[p]; return function () { calls++; }; }, set: function (t, p, v) { t[p] = v; return true; } });
var canvas = { width: 640, height: 480, getContext: function () { return ctx; }, addEventListener: function (n, f) { canL[n] = f; }, getBoundingClientRect: function () { return { left: 0, top: 0, width: 640, height: 480 }; } };
global.window = { addEventListener: function (n, f) { winL[n] = f; }, requestAnimationFrame: function (f) { rafQ.push(f); } };
global.document = { readyState: 'complete', getElementById: function () { return canvas; }, addEventListener: function () {} };
var store = {};
global.localStorage = { getItem: function (k) { return store[k] || null; }, setItem: function (k, v) { store[k] = v; } };
global.requestAnimationFrame = global.window.requestAnimationFrame;
function FakeAudio() { this.currentTime = 0; this.destination = {}; this.createOscillator = function () { return { frequency: {}, connect: function () {}, start: function () {}, stop: function () {} }; }; this.createGain = function () { return { gain: {}, connect: function () {} }; }; }
global.window.AudioContext = FakeAudio; global.AudioContext = FakeAudio;
var t = 0;
function frames(n) { for (var i = 0; i < n; i++) { var q = rafQ; rafQ = []; t += 16.7; q.forEach(function (f) { f(t); }); } }
var api;
try {
  require('./logic.js'); require('./render.js');
  api = require('./main.js').bootstrap();
  check('T5a yükleme/bootstrap istisnasız', true);
} catch (e) { console.log(e); check('T5a yükleme/bootstrap istisnasız', false); process.exit(1); }
frames(120);
check('T5b çizim çağrıları > 0', calls > 0);
var c0 = api.getState().cursor;
winL.keydown({ key: 'ArrowRight', code: 'ArrowRight', preventDefault: function () {} });
frames(30);
check('T5c girdi bağlı (imleç hareket etti)', api.getState().cursor !== c0);
api.getState().status = 'over';
winL.keydown({ key: 'r', code: 'KeyR', preventDefault: function () {} });
frames(2);
check('T5d R ile yeniden başlatma', api.getState().status === 'playing');
if (fails) process.exit(1);
