// Sahte DOM ile yukleme/baglanti testi (T5a-T5d)

var failures = 0;
function report(name, pass, detail) {
  console.log((pass ? 'PASS' : 'FAIL') + ' ' + name + (detail ? ' - ' + detail : ''));
  if (!pass) failures++;
}

var ctxCalls = 0;
var fakeCtx = {
  save: function () {},
  restore: function () {},
  scale: function () {},
  fillRect: function () { ctxCalls++; },
  beginPath: function () {},
  arc: function () { ctxCalls++; },
  fill: function () { ctxCalls++; },
  fillText: function () { ctxCalls++; },
  fillStyle: '',
  font: '',
  textAlign: ''
};

var keydownHandlers = [];
var keyupHandlers = [];
var pointerdownHandlers = [];

var fakeCanvas = {
  width: 960,
  height: 540,
  getContext: function () { return fakeCtx; },
  addEventListener: function (type, cb) {
    if (type === 'pointerdown') pointerdownHandlers.push(cb);
  }
};

var fakeDocument = {
  readyState: 'complete',
  getElementById: function (id) { return id === 'game' ? fakeCanvas : null; },
  addEventListener: function () {}
};

var storage = {};
var fakeLocalStorage = {
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : null; },
  setItem: function (k, v) { storage[k] = String(v); }
};

function FakeAudioContext() {
  this.currentTime = 0;
  this.destination = {};
}
FakeAudioContext.prototype.createOscillator = function () {
  return { type: '', frequency: { value: 0 }, connect: function () {}, start: function () {}, stop: function () {} };
};
FakeAudioContext.prototype.createGain = function () {
  return {
    gain: { value: 0, setValueAtTime: function () {}, exponentialRampToValueAtTime: function () {} },
    connect: function () {}
  };
};

var fakeWindow = {
  document: fakeDocument,
  localStorage: fakeLocalStorage,
  AudioContext: FakeAudioContext,
  addEventListener: function (type, cb) {
    if (type === 'keydown') keydownHandlers.push(cb);
    if (type === 'keyup') keyupHandlers.push(cb);
  }
};

global.window = fakeWindow;
global.document = fakeDocument;
global.localStorage = fakeLocalStorage;
global.AudioContext = FakeAudioContext;
global.performance = { now: function () { return Date.now(); } };

var rafQueue = [];
global.requestAnimationFrame = function (cb) { rafQueue.push(cb); return rafQueue.length; };
function flushFrame(now) {
  var queue = rafQueue;
  rafQueue = [];
  for (var i = 0; i < queue.length; i++) queue[i](now);
}

var lastState = null;

var loadOk = true;
var loadError = '';
try {
  require('./logic.js');
  require('./render.js');
  var originalDraw = window.GameRender.draw;
  window.GameRender.draw = function (ctx, state, view) {
    lastState = state;
    return originalDraw(ctx, state, view);
  };
  require('./main.js');
} catch (e) {
  loadOk = false;
  loadError = e && e.stack ? e.stack : String(e);
}
report('T5a yukleme ve bootstrap hatasiz', loadOk, loadError);

if (loadOk) {
  var now = 1000;
  flushFrame(now);

  var initialGravityDir = lastState ? lastState.gravityDir : null;

  var keyEvt = { code: 'Space', key: ' ', preventDefault: function () {} };
  for (var i = 0; i < keydownHandlers.length; i++) keydownHandlers[i](keyEvt);

  for (var f = 1; f <= 30; f++) {
    now += 16.67;
    flushFrame(now);
  }

  var flipped = lastState && lastState.gravityDir !== initialGravityDir;
  report('T5c girdi (yercekimi flip) baglanmis', !!flipped,
    'initial=' + initialGravityDir + ' current=' + (lastState && lastState.gravityDir));

  for (var f2 = 0; f2 < 90; f2++) {
    now += 16.67;
    flushFrame(now);
  }
  report('T5b canvas gercekten ciziliyor', ctxCalls > 0, 'ctxCalls=' + ctxCalls);

  var overReached = lastState && lastState.status === 'over';
  var guard = 0;
  while (!overReached && guard < 700) {
    now += 16.67;
    flushFrame(now);
    overReached = lastState && lastState.status === 'over';
    guard++;
  }

  var restartKeyEvt = { code: 'KeyR', key: 'r', preventDefault: function () {} };
  for (var j = 0; j < keydownHandlers.length; j++) keydownHandlers[j](restartKeyEvt);
  for (var f3 = 0; f3 < 10; f3++) {
    now += 16.67;
    flushFrame(now);
  }
  var restarted = lastState && lastState.status === 'playing';
  report('T5d yeniden baslatma baglanmis', overReached && !!restarted,
    'overReached=' + overReached + ' statusAfterRestart=' + (lastState && lastState.status));
}

console.log('---');
console.log(failures === 0 ? 'TUM TESTLER GECTI' : failures + ' test FAIL');
process.exit(failures === 0 ? 0 : 1);
