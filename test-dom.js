'use strict';
// Sahte DOM ile yükleme/bağlantı testi (Ambar Hesabı): node test-dom.js
var fails = 0;
function check(name, ok, info) { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? ' — ' + info : '')); if (!ok) fails++; }

var calls = 0;
var gradient = { addColorStop: function () {} };
var ctx2d = new Proxy({}, {
  get: function (t, k) {
    if (k in t) return t[k];
    if (k === 'measureText') return function () { calls++; return { width: 10 }; };
    return function () { calls++; return gradient; };
  },
  set: function (t, k, v) { t[k] = v; return true; }
});
var canvasListeners = {};
var canvas = { width: 480, height: 480, getContext: function () { return ctx2d; },
  addEventListener: function (t, f) { canvasListeners[t] = f; },
  getBoundingClientRect: function () { return { left: 0, top: 0, width: 480, height: 480 }; } };
var winListeners = {}, rafQ = [], store = {};
global.document = { readyState: 'complete', getElementById: function () { return canvas; }, addEventListener: function () {} };
global.window = { addEventListener: function (t, f) { winListeners[t] = f; },
  requestAnimationFrame: function (f) { rafQ.push(f); } };
global.requestAnimationFrame = global.window.requestAnimationFrame;
global.localStorage = { getItem: function (k) { return store[k] || null; }, setItem: function (k, v) { store[k] = String(v); } };
function FakeAudio() {
  this.currentTime = 0; this.destination = {};
  var node = function () { return { connect: function () {}, start: function () {}, stop: function () {},
    frequency: { setValueAtTime: function () {} }, gain: { setValueAtTime: function () {}, exponentialRampToValueAtTime: function () {} }, type: '' }; };
  this.createOscillator = node; this.createGain = node;
}
global.AudioContext = FakeAudio; global.window.AudioContext = FakeAudio;

var ts = 0;
function frames(n) { for (var i = 0; i < n; i++) { var q = rafQ; rafQ = []; ts += 1000 / 60; q.forEach(function (f) { f(ts); }); } }
function key(type, code, key) { if (winListeners[type]) winListeners[type]({ code: code, key: key, preventDefault: function () {} }); }

var ctrl = null, err = null;
try {
  require('./logic.js'); require('./render.js');
  var M = require('./main.js');
  ctrl = M.bootstrap();
} catch (e) { err = e; }
check('T5a yükleme + bootstrap istisnasız', !err && !!ctrl, err ? String(err && err.stack) : '');
if (!ctrl) { console.log('SONUÇ: ' + fails + ' FAIL'); process.exit(1); }

frames(120);
check('T5b çizim yapılıyor', calls > 0, 'ctx çağrısı: ' + calls);

var st0 = ctrl.getState(), silos0 = st0.silos;
st0.grain = Math.max(st0.grain, 20); // kurma maliyeti karşılansın
key('keydown', 'Space', ' ');
key('keyup', 'Space', ' ');
frames(30);
var st1 = ctrl.getState();
check('T5c tuş girdisi state değiştiriyor (Boşluk = ambar kur)', st1.silos === silos0 + 1, 'ambar ' + silos0 + ' → ' + st1.silos);

key('keydown', 'KeyX', 'x');
frames(5);
check('T5c2 X ile ambar yıkılıyor', ctrl.getState().silos === silos0, 'ambar → ' + ctrl.getState().silos);

var R = window.GameRender; var sl = R.slotRect(ctrl.getState().silos);
ctrl.getState().grain = 25;
canvasListeners.pointerdown({ clientX: sl.x + 10, clientY: sl.y + 10, preventDefault: function () {} });
frames(3);
check('T5c3 boş yuvaya tıklama ambar kuruyor', ctrl.getState().silos === silos0 + 1, 'ambar → ' + ctrl.getState().silos);

ctrl.getState().status = 'over';
ctrl.getState().overReason = 'test';
key('keydown', 'KeyR', 'r');
frames(2);
var st = ctrl.getState();
check('T5d R ile yeniden başlıyor', st.status === 'playing' && st.overReason === '' && st.score === 0, 'status=' + st.status);

console.log(fails ? 'SONUÇ: ' + fails + ' FAIL' : 'SONUÇ: hepsi PASS');
process.exit(fails ? 1 : 0);
