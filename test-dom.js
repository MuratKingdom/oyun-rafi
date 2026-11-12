// Sahte DOM ile yükleme/bağlantı testi: node test-dom.js
var fails = 0;
function check(name, ok, info) { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? ' — ' + info : '')); if (!ok) fails++; }
var calls = 0, listeners = {}, canvasListeners = {}, rafQ = [], store = {};
var ctx = new Proxy({}, {
  get: function (t, p) { if (p in t) return t[p]; return function () { calls++; return { width: 10 }; }; },
  set: function (t, p, v) { t[p] = v; return true; }
});
var canvas = { width: 480, height: 400, getContext: function () { return ctx; },
  addEventListener: function (n, f) { canvasListeners[n] = f; },
  getBoundingClientRect: function () { return { left: 0, top: 0, width: 480, height: 400 }; } };
global.document = { readyState: 'complete', getElementById: function () { return canvas; }, addEventListener: function () {} };
global.window = global;
global.addEventListener = function (n, f) { listeners[n] = f; };
global.requestAnimationFrame = function (f) { rafQ.push(f); return rafQ.length; };
global.localStorage = { getItem: function (k) { return store[k] || null; }, setItem: function (k, v) { store[k] = String(v); } };
global.AudioContext = function () {
  this.currentTime = 0; this.destination = {};
  this.createOscillator = function () { return { frequency: {}, connect: function () {}, start: function () {}, stop: function () {} }; };
  this.createGain = function () { return { gain: { exponentialRampToValueAtTime: function () {} }, connect: function () {} }; };
};
var t = 0;
function frames(n) { for (var i = 0; i < n; i++) { var q = rafQ; rafQ = []; t += 1000 / 60; q.forEach(function (f) { f(t); }); } }
function key(type, code, keyName) { listeners[type]({ code: code, key: keyName || '', preventDefault: function () {} }); }

var err = null;
try {
  require('./logic.js'); require('./render.js'); require('./main.js');
} catch (e) { err = e; }
check('T5a yükleme + bootstrap istisnasız', !err && !!window.__game, err ? String(err.stack) : '');
if (!err) {
  frames(120);
  check('T5b çizim yapılıyor', calls > 0, '2D çağrı sayısı ' + calls);
  var g = window.__game, before = JSON.stringify(g.getState().cursor);
  key('keydown', 'ArrowRight'); frames(30); key('keyup', 'ArrowRight');
  check('T5c girdi bağlı', JSON.stringify(g.getState().cursor) !== before, before + ' -> ' + JSON.stringify(g.getState().cursor));
  g.getState().status = 'over'; g.getState().overReason = 'test';
  key('keydown', 'KeyR', 'r'); frames(2); key('keyup', 'KeyR', 'r');
  check('T5d R ile yeniden başlatma', g.getState().status === 'playing', 'status=' + g.getState().status);
}
console.log(fails === 0 ? 'ÖZET: tüm testler geçti' : 'ÖZET: ' + fails + ' FAIL');
if (fails) process.exit(1);
