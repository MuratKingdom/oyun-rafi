let fails = 0;
function check(n, ok, info) { console.log((ok ? 'PASS ' : 'FAIL ') + n + (info ? ' — ' + info : '')); if (!ok) fails++; }
let calls = 0;
const ctx = new Proxy({}, { get: (t, p) => (p in t ? t[p] : (...a) => { calls++; }), set: (t, p, v) => { t[p] = v; return true; } });
const listeners = {}, rafq = [], store = {};
const canvas = { width: 640, height: 400, getContext: () => ctx, addEventListener: (n, f) => { (listeners['c:' + n] = listeners['c:' + n] || []).push(f); },
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 400 }) };
global.document = { readyState: 'complete', getElementById: () => canvas, addEventListener() {} };
global.window = { addEventListener: (n, f) => { (listeners[n] = listeners[n] || []).push(f); }, requestAnimationFrame: f => rafq.push(f),
  AudioContext: function () { return { createOscillator: () => ({ frequency: {}, connect() {}, start() {}, stop() {} }),
    createGain: () => ({ gain: { exponentialRampToValueAtTime() {} }, connect() {} }), destination: {}, currentTime: 0 }; } };
global.localStorage = { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } };
global.requestAnimationFrame = window.requestAnimationFrame;
let api, ok = true;
try {
  require('./logic.js'); require('./render.js');
  const m = require('./main.js'); api = m.bootstrap();
} catch (e) { ok = false; console.log(e.stack); }
check('T5a yükleme ve bootstrap istisnasız', ok);
let t = 0;
function frames(n) { for (let i = 0; i < n; i++) { const f = rafq.shift(); if (!f) break; t += 1000 / 60; f(t); } }
frames(120);
check('T5b çizim yapılıyor', calls > 0, 'çağrı ' + calls);
const g0 = JSON.stringify(api.getState().plots) + api.getState().grain;
listeners.keydown.forEach(f => f({ key: '1', code: 'Digit1', preventDefault() {} }));
frames(30);
check('T5c girdi bağlı', JSON.stringify(api.getState().plots) + api.getState().grain !== g0);
api.getState().status = 'over';
listeners.keydown.forEach(f => f({ key: 'r', code: 'KeyR', preventDefault() {} }));
check('T5d R ile yeniden başlıyor', api.getState().status === 'playing');
process.exit(fails ? 1 : 0);
