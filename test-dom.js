// Sahte DOM ile yükleme/bağlantı testi: node test-dom.js
'use strict';
var fails = 0;
function check(name, ok, info) { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? ' — ' + info : '')); }

var ctxCalls = 0;
var ctx = new Proxy({}, {
  get: function (t, p) { if (p in t) return t[p]; return function () { ctxCalls++; }; },
  set: function (t, p, v) { t[p] = v; return true; }
});
var canvasListeners = {};
var canvas = {
  width: 528, height: 600,
  getContext: function () { return ctx; },
  addEventListener: function (n, f) { canvasListeners[n] = f; },
  getBoundingClientRect: function () { return { left: 0, top: 0, width: 528, height: 600 }; }
};
var winListeners = {}, rafQ = [];
global.document = { readyState: 'complete', getElementById: function () { return canvas; }, addEventListener: function () {} };
global.window = {
  addEventListener: function (n, f) { (winListeners[n] = winListeners[n] || []).push(f); },
  requestAnimationFrame: function (f) { rafQ.push(f); }
};
var store = {};
global.localStorage = { getItem: function (k) { return k in store ? store[k] : null; }, setItem: function (k, v) { store[k] = String(v); } };
function FakeAudio() {
  this.currentTime = 0; this.destination = {};
  this.createOscillator = function () { return { frequency: {}, connect: function () {}, start: function () {}, stop: function () {} }; };
  this.createGain = function () { return { gain: { exponentialRampToValueAtTime: function () {} }, connect: function () {} }; };
}
global.AudioContext = FakeAudio; window.AudioContext = FakeAudio;
global.requestAnimationFrame = window.requestAnimationFrame;

var t = 0;
function frames(n) { for (var i = 0; i < n; i++) { var q = rafQ; rafQ = []; t += 1000 / 60; q.forEach(function (f) { f(t); }); } }
function key(k, code) { (winListeners.keydown || []).forEach(function (f) { f({ key: k, code: code || '', preventDefault: function () {} }); }); }

var threw = null;
try {
  window.GameLogic = require('./logic.js');
  window.GameRender = require('./render.js');
  window.GameMain = {};
  var M = require('./main.js');
  window.GameMain.bootstrap = M.bootstrap;
  M.bootstrap();
} catch (e) { threw = e; }
check('T5a yükleme + bootstrap istisnasız', !threw, threw ? String(threw.stack) : '');

try { frames(120); } catch (e) { threw = e; }
check('T5b 120 karede çizim çağrısı > 0', !threw && ctxCalls > 0, 'çağrı=' + ctxCalls);

var st = window.GameMain.getState && window.GameMain.getState();
var before = st ? JSON.stringify({ cx: st.cx, cy: st.cy, h: st.h }) : '';
key('ArrowLeft', 'ArrowLeft'); frames(2); key(' ', 'Space'); frames(28);
st = window.GameMain.getState();
var after = JSON.stringify({ cx: st.cx, cy: st.cy, h: st.h });
check('T5c tuş girdisi 30 karede state değiştiriyor', before !== after);

st.status = 'over'; st.overReason = 'test';
key('r', 'KeyR'); frames(2);
check('T5d R ile yeniden başlatma', window.GameMain.getState().status === 'playing');

if (fails) process.exit(1);
