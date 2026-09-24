// Sekme Gücü — sahte DOM ile yükleme/bağlantı testi (T5)
var fails = 0;
function report(name, ok, detail) {
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + (detail ? ' — ' + detail : ''));
  if (!ok) fails++;
}

var drawCallCount = 0;
function makeCtx() {
  var handler = {
    get: function (target, prop) {
      if (prop === 'canvas') return target.canvas;
      drawCallCount++;
      if (typeof target[prop] === 'function') return target[prop].bind(target);
      return target[prop];
    },
    set: function (target, prop, value) {
      drawCallCount++;
      target[prop] = value;
      return true;
    }
  };
  var base = {
    canvas: { width: 520, height: 540 },
    fillRect: function () {}, strokeRect: function () {}, beginPath: function () {},
    moveTo: function () {}, lineTo: function () {}, stroke: function () {}, fill: function () {},
    arc: function () {}, fillText: function () {}, measureText: function () { return { width: 10 }; },
    save: function () {}, restore: function () {}, translate: function () {}
  };
  return new Proxy(base, handler);
}

var listeners = { keydown: [], keyup: [] };
var canvasListeners = { pointerdown: [], pointerup: [], pointercancel: [] };

var fakeCanvas = {
  getContext: function () { return makeCtx(); },
  addEventListener: function (type, fn) {
    if (canvasListeners[type]) canvasListeners[type].push(fn);
  },
  width: 520,
  height: 540
};

var fakeStorage = {};
global.localStorage = {
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(fakeStorage, k) ? fakeStorage[k] : null; },
  setItem: function (k, v) { fakeStorage[k] = String(v); }
};

global.document = {
  getElementById: function (id) { return id === 'game' ? fakeCanvas : null; },
  readyState: 'complete',
  addEventListener: function () {}
};

var rafQueue = [];
global.window = {
  localStorage: global.localStorage,
  addEventListener: function (type, fn) {
    if (listeners[type]) listeners[type].push(fn);
  },
  requestAnimationFrame: function (fn) { rafQueue.push(fn); return rafQueue.length; },
  AudioContext: function () {
    return {
      currentTime: 0,
      createOscillator: function () {
        return { type: 'sine', frequency: { value: 0 }, connect: function () {}, start: function () {}, stop: function () {} };
      },
      createGain: function () {
        return { gain: { value: 0, exponentialRampToValueAtTime: function () {} }, connect: function () {} };
      }
    };
  },
  document: global.document
};
global.document.defaultView = global.window;

var t = 0;
Date.now = function () { return 1700000000000 + t; };

require('./logic.js');
require('./render.js');

var lastState = null;
var realDraw = global.window.GameRender.draw;
global.window.GameRender.draw = function (ctx, state, view) {
  lastState = state;
  return realDraw(ctx, state, view);
};

var caughtError = null;
try {
  var Main = require('./main.js');
  Main.bootstrap();
} catch (e) {
  caughtError = e;
}
report('T5a yükleme ve bootstrap hatasız', !caughtError, caughtError ? (caughtError.stack || String(caughtError)) : '');

function pumpFrames(n) {
  for (var i = 0; i < n; i++) {
    t += 16;
    var queue = rafQueue.slice();
    rafQueue.length = 0;
    for (var j = 0; j < queue.length; j++) queue[j](t);
  }
}

pumpFrames(5);
drawCallCount = 0;
pumpFrames(120);
report('T5b canvas gerçekten çiziliyor', drawCallCount > 0, 'çağrı sayısı=' + drawCallCount);

function fireKey(type, code) {
  var evt = { code: code, preventDefault: function () {} };
  var arr = listeners[type] || [];
  for (var i = 0; i < arr.length; i++) arr[i](evt);
}

(function t5c() {
  var yBefore = lastState.y;
  var bouncesBefore = lastState.bounces;
  fireKey('keydown', 'Space');
  pumpFrames(40);
  fireKey('keyup', 'Space');
  var changed = lastState.y !== yBefore || lastState.bounces !== bouncesBefore;
  report('T5c girdi bağlı (keydown sonrası state değişiyor)', changed, 'y=' + yBefore + '->' + lastState.y + ' bounces=' + bouncesBefore + '->' + lastState.bounces);
})();

(function t5d() {
  fireKey('keydown', 'ArrowUp');
  var reachedOver = false;
  for (var i = 0; i < 200 && !reachedOver; i++) {
    pumpFrames(1);
    if (lastState.status === 'over') reachedOver = true;
  }
  fireKey('keyup', 'ArrowUp');
  var statusOver = lastState.status;
  fireKey('keydown', 'KeyR');
  pumpFrames(3);
  var ok = reachedOver && statusOver === 'over' && lastState.status === 'playing';
  report('T5d restart bağlı (R sonrası status playing)', ok, 'over-ulaşıldı=' + reachedOver + ' R-öncesi=' + statusOver + ' R-sonrası=' + lastState.status);
})();

console.log('--- özet: ' + (fails === 0 ? 'tüm testler PASS' : fails + ' test FAIL'));
process.exit(fails === 0 ? 0 : 1);
