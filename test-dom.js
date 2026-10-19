// Sahte DOM ile yükleme/bağlantı testi (T5).
let fail = 0, drawCalls = 0;
function check(n, ok, i) { console.log((ok ? 'PASS ' : 'FAIL ') + n + (i ? ' — ' + i : '')); if (!ok) fail++; }
const store = {};
const ctx = new Proxy(store, {
  get(t, p) { if (p in t) return t[p]; return function () { drawCalls++; }; },
  set(t, p, v) { t[p] = v; return true; }
});
const canvas = { width: 480, height: 640, getContext() { return ctx; }, addEventListener() {}, getBoundingClientRect() { return { left: 0, top: 0, width: 480, height: 640 }; } };
const rafQ = [], listeners = {};
global.document = { readyState: 'complete', getElementById() { return canvas; }, addEventListener() {} };
global.window = {
  requestAnimationFrame(f) { rafQ.push(f); }, addEventListener(t, f) { (listeners[t] = listeners[t] || []).push(f); },
  localStorage: { getItem() { return null; }, setItem() {} }, AudioContext: function () {}
};
global.window.AudioContext.prototype.createOscillator = function () { return { connect() {}, start() {}, stop() {}, frequency: {} }; };
global.window.AudioContext.prototype.createGain = function () { return { connect() {}, gain: {} }; };
global.localStorage = global.window.localStorage;
let t = 0;
function frames(n) { for (let i = 0; i < n; i++) { t += 17; const f = rafQ.shift(); if (f) f(t); } }
let api;
try {
  require('./logic.js'); require('./render.js');
  api = require('./main.js').bootstrap();
  check('T5a yükleme/bootstrap istisnasız', !!api);
} catch (e) { check('T5a yükleme/bootstrap istisnasız', false, e.stack); process.exit(1); }
frames(120);
check('T5b çizim çağrısı > 0', drawCalls > 0, drawCalls + ' çağrı');
const st = api.getState(), before = JSON.stringify(st);
listeners.keydown.forEach(function (f) { f({ key: ' ', preventDefault() {} }); });
listeners.keyup.forEach(function (f) { f({ key: ' ' }); });
frames(30);
check('T5c tuş state değiştirir', JSON.stringify(api.getState()) !== before && api.getState().placed === 1);
api.getState().status = 'over';
listeners.keydown.forEach(function (f) { f({ key: 'r', preventDefault() {} }); });
listeners.keyup.forEach(function (f) { f({ key: 'r' }); });
frames(10);
check('T5d R ile yeniden başlar', api.getState().status === 'playing' && api.getState().placed === 0);
console.log(fail ? 'ÖZET: ' + fail + ' FAIL' : 'ÖZET: hepsi PASS');
if (fail) process.exit(1);
