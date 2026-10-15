'use strict';
var fails = 0;
function check(n, ok, info) { console.log((ok ? 'PASS ' : 'FAIL ') + n + (info ? ' — ' + info : '')); if (!ok) fails++; }
var calls = 0, rafQ = [], listeners = {}, canvasL = {};
var ctx = new Proxy({}, { get: function (t, k) { if (k in t) return t[k]; return function () { calls++; }; }, set: function (t, k, v) { t[k] = v; return true; } });
var canvas = { width: 800, height: 500, getContext: function () { return ctx; }, addEventListener: function (n, f) { canvasL[n] = f; } };
global.document = { readyState: 'complete', getElementById: function () { return canvas; }, addEventListener: function () {} };
global.window = {
  requestAnimationFrame: function (f) { rafQ.push(f); return rafQ.length; },
  addEventListener: function (n, f) { (listeners[n] = listeners[n] || []).push(f); }
};
global.localStorage = { _d: {}, getItem: function (k) { return this._d[k] || null; }, setItem: function (k, v) { this._d[k] = String(v); } };
function FakeAC() { this.currentTime = 0; this.destination = {}; this.createOscillator = function () { return { frequency: {}, connect: function () {}, start: function () {}, stop: function () {} }; }; this.createGain = function () { return { gain: { exponentialRampToValueAtTime: function () {} }, connect: function () {} }; }; }
global.window.AudioContext = FakeAC; global.AudioContext = FakeAC;
global.requestAnimationFrame = global.window.requestAnimationFrame;
global.performance = global.performance || { now: Date.now };
var t = 0;
function frames(n) { for (var i = 0; i < n; i++) { t += 1000 / 60; var q = rafQ; rafQ = []; q.forEach(function (f) { f(t); }); } }
var ok = true, err = '';
try {
  require('./logic.js'); require('./render.js'); require('./main.js');
  global.window.GameLogic = global.window.GameLogic || require('./logic.js');
  global.window.GameRender = global.window.GameRender || require('./render.js');
  require('./main.js').bootstrap();
} catch (e) { ok = false; err = String(e && e.stack || e); }
check('T5a yükleme/bootstrap istisnasız', ok, err);
try { frames(120); } catch (e) { ok = false; err = String(e); }
check('T5b çizim yapılıyor', calls > 0, 'çağrı=' + calls);
var st = global.window.__sarkacState;
var before = JSON.stringify(st && st());
(listeners.keydown || []).forEach(function (f) { f({ key: ' ', preventDefault: function () {} }); });
frames(30);
check('T5c girdi bağlı', before !== JSON.stringify(st && st()), st && st().mode);
var s = st(); s.status = 'over'; s.overReason = 'test';
(listeners.keydown || []).forEach(function (f) { f({ key: 'R', preventDefault: function () {} }); });
frames(2);
check('T5d R ile yeniden başlatma', st().status === 'playing');
console.log(fails ? 'ÖZET: ' + fails + ' FAIL' : 'ÖZET: hepsi PASS');
if (fails) process.exit(1);
