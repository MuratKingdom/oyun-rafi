'use strict';

var results = [];
var failed = false;

function check(name, cond, info) {
  results.push((cond ? 'PASS' : 'FAIL') + ' - ' + name + (info ? ' (' + info + ')' : ''));
  if (!cond) failed = true;
}

var ctxCallCount = 0;

function makeCtx() {
  var base = {
    canvas: null,
    fillRect: function () {},
    strokeRect: function () {},
    fillText: function () {},
    beginPath: function () {},
    arc: function () {},
    fill: function () {},
    stroke: function () {},
    save: function () {},
    restore: function () {},
    translate: function () {},
    measureText: function () { return { width: 0 }; }
  };
  var handler = {
    get: function (target, prop) {
      if (typeof target[prop] === 'function') {
        return function () {
          ctxCallCount++;
          return target[prop].apply(target, arguments);
        };
      }
      return target[prop];
    },
    set: function (target, prop, value) {
      target[prop] = value;
      return true;
    }
  };
  return new Proxy(base, handler);
}

var keydownHandlers = [];
var keyupHandlers = [];
var rafQueue = [];
var now = 0;

var fakeCanvas = {
  width: 500,
  height: 560,
  _ctx: null,
  getContext: function () {
    if (!this._ctx) {
      this._ctx = makeCtx();
      this._ctx.canvas = this;
    }
    return this._ctx;
  },
  addEventListener: function (type, fn) {
    if (type === 'pointerdown') fakeCanvas._pointerdown = fn;
  },
  getBoundingClientRect: function () {
    return { left: 0, top: 0, width: this.width, height: this.height };
  }
};

var fakeStorageData = {};
var fakeStorage = {
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(fakeStorageData, k) ? fakeStorageData[k] : null; },
  setItem: function (k, v) { fakeStorageData[k] = String(v); }
};

var fakeDocument = {
  readyState: 'complete',
  getElementById: function (id) { return id === 'game' ? fakeCanvas : null; },
  addEventListener: function () {}
};

function FakeAudioContext() {
  this.currentTime = 0;
  this.destination = {};
}
FakeAudioContext.prototype.createOscillator = function () {
  return {
    type: 'sine',
    frequency: { value: 0 },
    connect: function () {},
    start: function () {},
    stop: function () {}
  };
};
FakeAudioContext.prototype.createGain = function () {
  return {
    gain: { setValueAtTime: function () {}, exponentialRampToValueAtTime: function () {} },
    connect: function () {}
  };
};

var fakeWindow = {
  addEventListener: function (type, fn) {
    if (type === 'keydown') keydownHandlers.push(fn);
    if (type === 'keyup') keyupHandlers.push(fn);
  },
  requestAnimationFrame: function (fn) {
    rafQueue.push(fn);
    return rafQueue.length;
  },
  localStorage: fakeStorage,
  AudioContext: FakeAudioContext
};

global.window = fakeWindow;
global.document = fakeDocument;
global.localStorage = fakeStorage;

var Logic, Render, Main;

try {
  Logic = require('./logic.js');
  global.window.GameLogic = Logic;
  Render = require('./render.js');
  global.window.GameRender = Render;
  Main = require('./main.js'); // readyState === 'complete' olduğundan bootstrap() burada senkron çalışır
  check('T5a yükleme/bootstrap hatasız', true);
} catch (e) {
  check('T5a yükleme/bootstrap hatasız', false, 'hata: ' + e.message);
}

function pumpFrame() {
  now += 16.6667;
  var queued = rafQueue.slice();
  rafQueue.length = 0;
  queued.forEach(function (fn) { fn(now); });
}

function dispatchKey(type, code) {
  var handlers = type === 'keydown' ? keydownHandlers : keyupHandlers;
  var evt = { code: code, key: code, preventDefault: function () {} };
  handlers.forEach(function (fn) { fn(evt); });
}

if (Main) {
  var lastState = null;
  var originalDraw = Render.draw;
  Render.draw = function (ctx, state, view) {
    lastState = state;
    return originalDraw(ctx, state, view);
  };

  for (var i = 0; i < 120; i++) pumpFrame();
  check('T5b canvas çizimi çalışıyor', ctxCallCount > 0, 'ctxCallCount=' + ctxCallCount);

  var beforeCx = lastState ? lastState.cx : null;
  dispatchKey('keydown', 'ArrowRight');
  for (var j = 0; j < 30; j++) pumpFrame();
  var afterCx = lastState ? lastState.cx : null;
  check('T5c girdi bağlı', beforeCx !== null && afterCx !== null && afterCx !== beforeCx,
    'before=' + beforeCx + ' after=' + afterCx);
  dispatchKey('keyup', 'ArrowRight');

  if (lastState) {
    lastState.status = 'over';
    lastState.overReason = 'test';
    dispatchKey('keydown', 'KeyR');
    pumpFrame();
    check('T5d yeniden başlatma bağlı', lastState.status === 'playing', 'status=' + lastState.status);
  } else {
    check('T5d yeniden başlatma bağlı', false, 'lastState yakalanamadı');
  }
} else {
  check('T5b canvas çizimi çalışıyor', false, 'Main modülü yüklenemedi');
  check('T5c girdi bağlı', false, 'Main modülü yüklenemedi');
  check('T5d yeniden başlatma bağlı', false, 'Main modülü yüklenemedi');
}

results.forEach(function (r) { console.log(r); });
console.log('Özet: ' + (failed ? 'FAIL var' : 'hepsi PASS'));
process.exit(failed ? 1 : 0);
