// Sahte DOM ile yükleme/bağlantı testi: node test-dom.js
'use strict';
let fails = 0;
function check(name, ok, info) {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? ' — ' + info : ''));
  if (!ok) fails++;
}
let ctxCalls = 0;
const ctx = new Proxy({}, {
  get(t, k) {
    if (k in t) return t[k];
    if (k === 'createLinearGradient') return function () { ctxCalls++; return { addColorStop() {} }; };
    return function () { ctxCalls++; };
  },
  set(t, k, v) { t[k] = v; return true; },
});
const canvasListeners = {};
const canvas = {
  width: 360, height: 640, clientWidth: 360,
  getContext() { return ctx; },
  addEventListener(t, f) { canvasListeners[t] = f; },
};
const winListeners = {};
let rafQ = [];
const store = {};
global.window = {
  addEventListener(t, f) { winListeners[t] = f; },
  requestAnimationFrame(f) { rafQ.push(f); },
};
global.document = { readyState: 'complete', getElementById() { return canvas; }, addEventListener() {} };
global.localStorage = { getItem(k) { return store[k] || null; }, setItem(k, v) { store[k] = String(v); } };
global.requestAnimationFrame = window.requestAnimationFrame;
global.AudioContext = function () {
  return { currentTime: 0, destination: {},
    createOscillator() { return { connect() {}, start() {}, stop() {}, frequency: {}, type: '' }; },
    createGain() { return { connect() {}, gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} } }; } };
};
window.AudioContext = global.AudioContext;

let t = 0;
function frames(n) { for (let i = 0; i < n; i++) { const q = rafQ; rafQ = []; t += 1000 / 60; q.forEach(f => f(t)); } }
function key(type, k, code) { const f = winListeners[type]; if (f) f({ key: k, code: code || '', preventDefault() {}, repeat: false }); }

let ok5a = true, err = '';
try {
  window.GameLogic = require('./logic.js');
  window.GameRender = require('./render.js');
  // main.js window varken kendini otomatik başlatır (bootstrap çağrılır)
  require('./main.js');
} catch (e) { ok5a = false; err = String(e && e.stack || e); }
check('T5a yükleme + bootstrap istisnasız', ok5a && !!window.__game && typeof window.GameMain.bootstrap === 'function', err);

try { frames(120); } catch (e) { ok5a = false; err = String(e); }
check('T5b çizim yapılıyor', ctxCalls > 0, 'ctx çağrısı: ' + ctxCalls + (err ? ' ' + err : ''));

{
  const g = window.__game;
  const before = JSON.stringify({ h: g.state.hook, y: g.state.py, st: g.state.started });
  key('keydown', ' ');
  frames(30);
  const after = JSON.stringify({ h: g.state.hook, y: g.state.py, st: g.state.started });
  key('keyup', ' ');
  check('T5c tuş girdisi bağlı', before !== after, before + ' -> ' + after);
}
{
  const g = window.__game;
  g.state.status = 'over'; g.state.overReason = 'test';
  frames(2);
  key('keydown', 'r', 'KeyR');
  frames(2);
  check('T5d R ile yeniden başlatma', g.state.status === 'playing' && g.state.overReason === '', 'status=' + g.state.status);
}
{
  const g = window.__game;
  g.state.status = 'over';
  canvasListeners.pointerdown && canvasListeners.pointerdown({ offsetX: 180, preventDefault() {} });
  check('T5e tıklama ile yeniden başlatma', g.state.status === 'playing');
}

console.log(fails === 0 ? 'ÖZET: hepsi PASS' : 'ÖZET: ' + fails + ' FAIL');
if (fails) process.exit(1);
