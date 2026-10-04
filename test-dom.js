// Sekme Gücü — sahte DOM ile yükleme/bağlantı testi (T5)
var fails = 0;
function report(name, ok, detail) {
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + (detail ? ' — ' + detail : ''));
  if (!ok) fails++;
}

var drawCallCount = 0;
var gradients = 0;
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
    save: function () {}, restore: function () {}, translate: function () {},
    setTransform: function () {}, scale: function () {}, closePath: function () {}, rect: function () {},
    strokeText: function () {},
    // Gerçek tarayıcıdaki gibi gradyan desteği: render.js'in neon yolu (düz renk yedeği değil) sınansın
    createLinearGradient: function () { gradients++; return { addColorStop: function () {} }; },
    createRadialGradient: function () { gradients++; return { addColorStop: function () {} }; }
  };
  return new Proxy(base, handler);
}

var listeners = { keydown: [], keyup: [], pointerdown: [], pointerup: [] };
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
report('T5b canvas gerçekten çiziliyor', drawCallCount > 0 && gradients > 0, 'çağrı sayısı=' + drawCallCount + ' gradyan=' + gradients);

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

function firePointer(type) {
  var evt = { pointerType: 'touch', cancelable: true, preventDefault: function () {} };
  var arr = listeners[type] || [];
  for (var i = 0; i < arr.length; i++) arr[i](evt);
}

// T5e — başlangıç ekranı: dokunmadan oyun ilerlemiyor (mobilde ilk anda ölmesin)
(function t5e() {
  var savedRaf = rafQueue.slice();
  rafQueue.length = 0;
  listeners.keydown.length = 0; listeners.keyup.length = 0;
  listeners.pointerdown.length = 0; listeners.pointerup.length = 0;
  require('./main.js').bootstrap();
  pumpFrames(2);
  var y0 = lastState.y;
  pumpFrames(120);
  var waited = lastState.y === y0 && lastState.t === 0;
  firePointer('pointerdown');
  pumpFrames(30);
  firePointer('pointerup');
  var started = lastState.t > 0;
  report('T5e başlangıç ekranı dokunuşu bekliyor', waited && started, 'bekledi=' + waited + ' dokununca-başladı=' + started);
  void savedRaf;
})();

// T5f — ölümden hemen sonraki dokunuş yeniden başlatmıyor, kısa kilitten sonra başlatıyor
(function t5f() {
  firePointer('pointerdown'); // basılı tut → tavana çarp
  var over = false;
  for (var i = 0; i < 300 && !over; i++) { pumpFrames(1); if (lastState.status === 'over') over = true; }
  firePointer('pointerup');
  firePointer('pointerdown');
  pumpFrames(2);
  var stillOver = lastState.status === 'over';
  firePointer('pointerup');
  pumpFrames(35); // ~560 ms
  firePointer('pointerdown');
  pumpFrames(2);
  firePointer('pointerup');
  var restarted = lastState.status === 'playing';
  report('T5f yeniden başlatma kilidi', over && stillOver && restarted,
    'öldü=' + over + ' hemen-dokunuş-sonrası=' + (stillOver ? 'over' : 'playing') + ' kilitten-sonra=' + lastState.status);
})();

// T5g — mağaza bağlıyken: oyun sonunda ödül cüzdana bir kez yazılır, kuşanılan görünüm çizime gider
(function t5g() {
  rafQueue.length = 0;
  listeners.keydown.length = 0; listeners.keyup.length = 0;
  listeners.pointerdown.length = 0; listeners.pointerup.length = 0;
  require('./shop.js');
  var P = global.window.GameShop.createProfile();
  P.coins = 400; global.window.GameShop.buy(P, 'map', 'neon');
  global.window.GameShop.save(global.localStorage, P);
  // Ödül hesabı T15'te ayrıca sınanıyor; burada main.js'in onu tam bir kez uyguladığını ölçmek için sabitle
  var realReward = global.window.GameShop.reward;
  var calls = 0;
  global.window.GameShop.reward = function () { calls++; return 7; };
  var lastView = null;
  var prevDraw = global.window.GameRender.draw;
  global.window.GameRender.draw = function (ctx, st, view) { lastView = view; return prevDraw(ctx, st, view); };
  require('./main.js').bootstrap();
  pumpFrames(3);
  var themed = lastView && lastView.theme && lastView.theme.id === 'neon';
  var coins0 = JSON.parse(global.localStorage.getItem('sekmeguc-profil')).coins;
  fireKey('keydown', 'ArrowUp');
  var over = false;
  for (var i = 0; i < 300 && !over; i++) { pumpFrames(1); if (lastState.status === 'over') over = true; }
  fireKey('keyup', 'ArrowUp');
  pumpFrames(10);
  // cüzdanda ★ 30 var: 5 sn "★ ile devam" teklifi açık, ödül bu sürede yazılmamalı
  var coinsDuring = JSON.parse(global.localStorage.getItem('sekmeguc-profil')).coins;
  pumpFrames(320); // ~5,1 sn: teklif kapanır, ödül yazılır
  var coins1 = JSON.parse(global.localStorage.getItem('sekmeguc-profil')).coins;
  var expected = 7;
  pumpFrames(30); // tekrar tekrar eklenmemeli
  var coins2 = JSON.parse(global.localStorage.getItem('sekmeguc-profil')).coins;
  global.window.GameRender.draw = prevDraw;
  global.window.GameShop.reward = realReward;
  report('T5g ödül cüzdana bir kez yazılır, tema uygulanır', themed && over && coinsDuring === coins0 && coins1 === coins0 + expected && coins2 === coins1 && calls === 1,
    'tema=' + (lastView && lastView.theme && lastView.theme.id) + ' cüzdan ' + coins0 + '→(teklif sırasında ' + coinsDuring + ')→' + coins1 + '→' + coins2 + ' (ödül ' + expected + ', hesaplama ' + calls + ' kez)');
})();

// T5j — ölünce ★ ile devam: düğme görünür, ödeme alınır, oyun sürer; ikinci ölümde teklif süresi dolunca ödül bir kez yazılır
(function t5j() {
  rafQueue.length = 0;
  listeners.keydown.length = 0; listeners.keyup.length = 0;
  listeners.pointerdown.length = 0; listeners.pointerup.length = 0;
  var Sh = global.window.GameShop;
  var P = Sh.createProfile(); P.coins = 40; Sh.save(global.localStorage, P);
  var btn = { hidden: true, textContent: '', handlers: [], addEventListener: function (t, f) { if (t === 'click') this.handlers.push(f); } };
  var oldGet = global.document.getElementById;
  global.document.getElementById = function (id) { return id === 'devamBtn' ? btn : oldGet(id); };
  var lastView = null, prevDraw = global.window.GameRender.draw;
  global.window.GameRender.draw = function (ctx, st, view) { lastView = view; return prevDraw(ctx, st, view); };
  require('./main.js').bootstrap();
  pumpFrames(2);
  function dieByCeiling() {
    fireKey('keydown', 'ArrowUp');
    var over = false;
    for (var i = 0; i < 400 && !over; i++) { pumpFrames(1); if (lastState.status === 'over') over = true; }
    fireKey('keyup', 'ArrowUp');
    pumpFrames(3);
    return over;
  }
  var died1 = dieByCeiling();
  var offered = !btn.hidden && /15/.test(btn.textContent) && lastView.revive && lastView.revive.cost === 15;
  btn.handlers.forEach(function (f) { f(); });
  pumpFrames(2);
  var coinsAfterPay = JSON.parse(global.localStorage.getItem('sekmeguc-profil')).coins;
  var resumed = lastState.status === 'playing' && lastState.revives === 1 && btn.hidden;
  var died2 = dieByCeiling();
  // ★ 25 kaldı, ikinci devam ★ 30: yetmez → teklif yok, ödül hemen yazılır
  var offered2 = !btn.hidden;
  pumpFrames(3);
  var finalCoins = JSON.parse(global.localStorage.getItem('sekmeguc-profil')).coins;
  var expect = 25 + Sh.reward(lastState);
  pumpFrames(60);
  var stable = JSON.parse(global.localStorage.getItem('sekmeguc-profil')).coins === finalCoins;
  global.document.getElementById = oldGet;
  global.window.GameRender.draw = prevDraw;
  report('T5j ölünce yıldızla devam', died1 && offered && coinsAfterPay === 25 && resumed && died2 && !offered2 && finalCoins === expect && stable,
    'teklif=' + offered + ' ödeme sonrası=' + coinsAfterPay + ' sürdü=' + resumed + ' ikinci teklif=' + offered2 + ' son cüzdan=' + finalCoins + ' (beklenen ' + expect + ')');
})();

// T5h — günlük ödül ilk açılışta bir kez verilir; oyun sonunda görev ilerlemesi kaydedilir
(function t5h() {
  rafQueue.length = 0;
  listeners.keydown.length = 0; listeners.keyup.length = 0;
  listeners.pointerdown.length = 0; listeners.pointerup.length = 0;
  require('./quests.js');
  global.localStorage.setItem('sekmeguc-gunluk', '');
  global.localStorage.setItem('sekmeguc-profil', JSON.stringify({ coins: 0 }));
  require('./main.js').bootstrap();
  pumpFrames(2);
  var c1 = JSON.parse(global.localStorage.getItem('sekmeguc-profil')).coins;
  var dly = JSON.parse(global.localStorage.getItem('sekmeguc-gunluk'));
  rafQueue.length = 0;
  require('./main.js').bootstrap(); // aynı gün ikinci açılış
  pumpFrames(2);
  var c2 = JSON.parse(global.localStorage.getItem('sekmeguc-profil')).coins;
  var runsBefore = JSON.parse(global.localStorage.getItem('sekmeguc-gunluk')).quests.map(function (q) { return q.progress; }).join(',');
  fireKey('keydown', 'ArrowUp');
  var over = false;
  for (var i = 0; i < 300 && !over; i++) { pumpFrames(1); if (lastState.status === 'over') over = true; }
  fireKey('keyup', 'ArrowUp');
  pumpFrames(5);
  var after = JSON.parse(global.localStorage.getItem('sekmeguc-gunluk'));
  var hasRunQuest = after.quests.some(function (q) { return q.kind === 'day_runs'; });
  var runQ = after.quests.filter(function (q) { return q.kind === 'day_runs' || q.kind === 'reach_level'; });
  var progressed = runQ.length === 0 || runQ.some(function (q) { return q.progress >= 1; });
  report('T5h günlük ödül bir kez, görev ilerlemesi kaydedilir', c1 === 3 && c2 === 3 && dly.quests.length === 3 && dly.streak === 1 && over && progressed,
    'ilk açılış=' + c1 + ' ikinci açılış=' + c2 + ' seri=' + dly.streak + ' ilerleme ' + runsBefore + ' → ' + after.quests.map(function (q) { return q.kind + ':' + q.progress; }).join(',') + (hasRunQuest ? '' : ' (bugün day_runs yok)'));
})();

// T5i — müzik oyun sürerken nota kurar, M ile her ses kapanır ve tercih kaydedilir
(function t5i() {
  rafQueue.length = 0;
  listeners.keydown.length = 0; listeners.keyup.length = 0;
  listeners.pointerdown.length = 0; listeners.pointerup.length = 0;
  require('./audio.js');
  global.localStorage.setItem('sekmeguc-ses', '');
  var oscs = [];
  var acFake = {
    currentTime: 0, state: 'running',
    createOscillator: function () {
      var o = { type: 'sine', at: null, frequency: { value: 0, setValueAtTime: function (v, t) { o.f = v; }, exponentialRampToValueAtTime: function () {} },
        connect: function () {}, start: function (t) { o.at = t; }, stop: function () {} };
      oscs.push(o);
      return o;
    },
    createGain: function () {
      return { gain: { value: 0, setValueAtTime: function () {}, exponentialRampToValueAtTime: function () {} }, connect: function () {} };
    },
    destination: {}
  };
  var oldAC = global.window.AudioContext;
  global.window.AudioContext = function () { return acFake; };
  require('./main.js').bootstrap();
  pumpFrames(2);
  var readyCount = oscs.length;
  fireKey('keydown', 'Space'); fireKey('keyup', 'Space');
  // kısa bas-bırak ile 2 sn oyna; ses saati kareyle ilerlesin
  for (var i = 0; i < 120; i++) { acFake.currentTime += 1 / 60; if (i % 20 === 0) { fireKey('keydown', 'Space'); } if (i % 20 === 6) fireKey('keyup', 'Space'); pumpFrames(1); }
  var playing = lastState.status === 'playing';
  var musicNotes = oscs.length - readyCount;
  fireKey('keydown', 'KeyM');
  var saved = JSON.parse(global.localStorage.getItem('sekmeguc-ses') || '{}');
  var afterMute = oscs.length;
  for (var j = 0; j < 60; j++) { acFake.currentTime += 1 / 60; if (j % 20 === 0) fireKey('keydown', 'Space'); if (j % 20 === 6) fireKey('keyup', 'Space'); pumpFrames(1); }
  // M'den önce kurulmuş en çok ~150 ms'lik notalar zaten kuyrukta; M'den sonra yenisi kurulmamalı
  var silent = oscs.length === afterMute;
  global.window.AudioContext = oldAC;
  report('T5i müzik çalar, M her sesi kapatır ve kaydeder', playing && musicNotes >= 10 && saved.music === false && saved.sfx === false && silent,
    'oyunda=' + playing + ' 2 sn nota=' + musicNotes + ' kayıt=' + JSON.stringify(saved) + ' sessizde yeni nota=' + (oscs.length - afterMute));
})();

console.log('--- özet: ' + (fails === 0 ? 'tüm testler PASS' : fails + ' test FAIL'));
process.exit(fails === 0 ? 0 : 1);
