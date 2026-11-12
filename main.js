// Kıvılcım Zinciri — döngü, girdi, ses
var KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  Space: 'action', Enter: 'action'
};

function bootstrap() {
  var L = window.GameLogic, R = window.GameRender;
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var DT = 1 / 60;
  var input = { left: false, right: false, up: false, down: false, action: false, restart: false, px: null, py: null, tap: false };
  var view = { shake: 0, jx: 0, jy: 0, best: 0, muted: false };
  var audio = null;
  var state = L.createState((Math.floor(Math.random() * 1e9) >>> 0) || 1);

  try { view.best = parseInt(localStorage.getItem('kivilcim-zinciri-rekor') || '0', 10) || 0; } catch (e) { view.best = 0; }

  function ensureAudio() {
    if (audio || view.muted) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audio = new AC();
    } catch (e) { audio = null; }
  }

  function tone(freq, dur, type, vol) {
    if (!audio || view.muted) return;
    try {
      var o = audio.createOscillator(), g = audio.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      g.gain.value = vol || 0.08;
      o.connect(g); g.connect(audio.destination);
      var t = audio.currentTime || 0;
      if (g.gain.exponentialRampToValueAtTime) g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.start(t); o.stop(t + dur);
    } catch (e) { /* ses yoksa sessiz devam */ }
  }

  function saveBest() {
    if (state.score > view.best) {
      view.best = state.score;
      try { localStorage.setItem('kivilcim-zinciri-rekor', String(view.best)); } catch (e) { /* kayıt yok */ }
    }
  }

  function handleEvents() {
    for (var i = 0; i < state.events.length; i++) {
      var ev = state.events[i];
      if (ev.type === 'fire') { view.shake = 4; tone(220, 0.12, 'triangle', 0.1); }
      else if (ev.type === 'catch') { tone(330 + Math.min(ev.depth, 12) * 60, 0.09, 'sine', 0.06); }
      else if (ev.type === 'level') { tone(660, 0.15, 'square', 0.05); }
      else if (ev.type === 'over') { view.shake = 6; tone(110, 0.3, 'sawtooth', 0.08); saveBest(); }
      else if (ev.type === 'won') { tone(880, 0.3, 'square', 0.06); saveBest(); }
    }
  }

  function isOver() { return state.status === 'over' || state.status === 'won'; }

  window.addEventListener('keydown', function (e) {
    ensureAudio();
    if (e.code === 'KeyM') { view.muted = !view.muted; return; }
    if (e.code === 'KeyR' || e.key === 'r' || e.key === 'R') { input.restart = true; e.preventDefault && e.preventDefault(); return; }
    var k = KEYMAP[e.code];
    if (k) {
      if (e.preventDefault) e.preventDefault();
      if (isOver() && k === 'action') { input.restart = true; return; }
      input[k] = true;
      if (k === 'action') input.tap = true;
    }
  });
  window.addEventListener('keyup', function (e) {
    var k = KEYMAP[e.code];
    if (k) input[k] = false;
  });

  function toGame(e) {
    var rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: canvas.width, height: canvas.height };
    var sx = canvas.width / (rect.width || canvas.width), sy = canvas.height / (rect.height || canvas.height);
    return { x: (e.clientX - rect.left) * sx, y: Math.min(L.C.H, (e.clientY - rect.top) * sy) };
  }
  canvas.addEventListener('pointermove', function (e) {
    var p = toGame(e); input.px = p.x; input.py = p.y;
  });
  canvas.addEventListener('pointerdown', function (e) {
    ensureAudio();
    if (e.preventDefault) e.preventDefault();
    if (isOver()) { input.restart = true; return; }
    var p = toGame(e); input.px = p.x; input.py = p.y; input.action = true; input.tap = true;
  });
  canvas.addEventListener('pointerup', function () { input.action = false; });

  var acc = 0, last = null;
  function frame(ts) {
    if (last === null) last = ts;
    acc += Math.min(0.25, Math.max(0, (ts - last) / 1000));
    last = ts;
    var steps = 0;
    while (acc >= DT && steps < 5) {
      // kısa basışlar aynı kare içinde bırakılsa da kaybolmasın: tap mandalı en az bir adım 'action' verir
      var tapNow = input.tap;
      var si = { left: input.left, right: input.right, up: input.up, down: input.down,
        action: input.action || tapNow, restart: input.restart, px: input.px, py: input.py };
      L.step(state, si, DT);
      handleEvents();
      if (tapNow) { input.tap = false; state.prevAction = input.action; }
      input.restart = false;
      input.px = null; input.py = null;
      acc -= DT; steps++;
    }
    if (steps === 5) acc = 0;
    if (view.shake > 0) { view.shake = Math.max(0, view.shake - 0.5); view.jx = Math.random() * 2 - 1; view.jy = Math.random() * 2 - 1; }
    R.draw(ctx, state, view);
    window.requestAnimationFrame(frame);
  }
  R.draw(ctx, state, view);
  window.requestAnimationFrame(frame);

  window.__game = { getState: function () { return state; }, setState: function (s) { state = s; }, input: input };
}

if (typeof window !== 'undefined') {
  window.GameMain = { bootstrap };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
  else bootstrap();
}
if (typeof module !== 'undefined') module.exports = { bootstrap };
