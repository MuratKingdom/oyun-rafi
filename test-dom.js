'use strict';
let fails = 0;
function check(name, ok, info) { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? ' — ' + info : '')); if (!ok) fails++; }

let calls = 0;
const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : (...a) => { calls++; }), set: (t, k, v) => { t[k] = v; return true; } });
const canvasHandlers = {};
const canvas = { width: 900, height: 360, getContext: () => ctx, addEventListener: (n, f) => { canvasHandlers[n] = f; } };
const winHandlers = {};
const docHandlers = {};
const rafQueue = [];
global.document = { readyState: 'loading', getElementById: () => canvas, addEventListener: (n, f) => { docHandlers[n] = f; } };
global.window = {
  addEventListener: (n, f) => { winHandlers[n] = f; },
  requestAnimationFrame: (f) => { rafQueue.push(f); },
  localStorage: { _d: {}, getItem(k) { return this._d[k] || null; }, setItem(k, v) { this._d[k] = v; } },
  AudioContext: function () { this.currentTime = 0; this.destination = {}; this.createOscillator = () => ({ connect() {}, start() {}, stop() {}, frequency: {} }); this.createGain = () => ({ connect() {}, gain: {} }); }
};
global.localStorage = global.window.localStorage;
global.requestAnimationFrame = global.window.requestAnimationFrame;
global.AudioContext = global.window.AudioContext;

let inst = null, t = 0;
function frames(n) { for (let i = 0; i < n; i++) { t += 16.667; const f = rafQueue.shift(); if (f) f(t); } }

try {
  require('./logic.js'); require('./render.js');
  const m = require('./main.js');
  inst = m.bootstrap();
  check('T5a yukleme/bootstrap istisnasiz', !!inst && typeof winHandlers.keydown === 'function');
} catch (e) { check('T5a yukleme/bootstrap istisnasiz', false, String(e && e.stack)); }

if (inst) {
  frames(120);
  check('T5b cizim cagrilari > 0', calls > 0, 'cagri=' + calls);
  const before = JSON.stringify(inst.getState());
  winHandlers.keydown({ key: ' ', repeat: false, preventDefault() {} });
  frames(30);
  check('T5c tus state degistirir', JSON.stringify(inst.getState()) !== before);
  winHandlers.keyup({ key: ' ' });
  inst.getState().status = 'over';
  winHandlers.keydown({ key: 'R', repeat: false, preventDefault() {} });
  frames(2);
  check('T5d R ile restart', inst.getState().status === 'playing');
} else { ['T5b', 'T5c', 'T5d'].forEach((n) => check(n + ' (bootstrap yok)', false)); }
console.log(fails ? 'OZET: ' + fails + ' FAIL' : 'OZET: hepsi PASS');
if (fails) process.exit(1);
