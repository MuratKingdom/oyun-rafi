// Set Adası — döngü, girdi, ses
'use strict';
function bootstrap() {
  var L = window.GameLogic, R = window.GameRender;
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var DT = 1 / 60;
  var KEY = 'setadasi_best';
  var best = 0;
  try { best = parseInt(localStorage.getItem(KEY), 10) || 0; } catch (e) { best = 0; }
  var state = L.createState((Date.now() & 0x7fffffff) || 1);
  var pending = { moveX: 0, moveY: 0, action: false, tapX: null, tapY: null };
  var fx = [], shake = 0, muted = false, audio = null, acc = 0, last = null, now = 0;

  function initAudio() {
    if (audio || muted) return;
    try { var AC = window.AudioContext || window.webkitAudioContext; if (AC) audio = new AC(); } catch (e) { audio = null; }
  }
  function tone(freq, dur, type, vol) {
    if (muted || !audio) return;
    try {
      var o = audio.createOscillator(), g = audio.createGain();
      o.type = type || 'square'; o.frequency.value = freq;
      g.gain.value = vol || 0.06;
      o.connect(g); g.connect(audio.destination);
      var t0 = audio.currentTime;
      if (g.gain.exponentialRampToValueAtTime) g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.start(t0); o.stop(t0 + dur);
    } catch (e) { /* sessiz devam */ }
  }
  function saveBest() {
    if (state.score > best) { best = state.score; try { localStorage.setItem(KEY, String(best)); } catch (e) {} }
  }
  function restart() {
    state = L.createState((Date.now() & 0x7fffffff) || 1);
    fx = []; shake = 0; acc = 0;
    tone(520, 0.08, 'triangle');
  }

  window.addEventListener('keydown', function (e) {
    var k = e.key, c = e.code;
    initAudio();
    var game = true;
    if (k === 'r' || k === 'R' || c === 'KeyR') { restart(); }
    else if (k === 'm' || k === 'M' || c === 'KeyM') { muted = !muted; }
    else if (state.status !== 'playing' && (k === ' ' || k === 'Enter')) { restart(); }
    else if (k === 'ArrowLeft' || k === 'a' || k === 'A') pending.moveX = -1;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') pending.moveX = 1;
    else if (k === 'ArrowUp' || k === 'w' || k === 'W') pending.moveY = -1;
    else if (k === 'ArrowDown' || k === 's' || k === 'S') pending.moveY = 1;
    else if (k === ' ' || k === 'Enter') pending.action = true;
    else game = false;
    if (game && e.preventDefault) e.preventDefault();
  });

  canvas.addEventListener('pointerdown', function (e) {
    initAudio();
    if (state.status !== 'playing') { restart(); return; }
    var r = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: canvas.width, height: canvas.height };
    var sx = canvas.width / (r.width || canvas.width), sy = canvas.height / (r.height || canvas.height);
    var x = Math.floor(((e.clientX - r.left) * sx) / R.CELL);
    var y = Math.floor(((e.clientY - r.top) * sy - R.HUD) / R.CELL);
    if (x >= 0 && y >= 0 && x < L.C.N && y < L.C.N) { pending.tapX = x; pending.tapY = y; }
    if (e.preventDefault) e.preventDefault();
  });

  function handleEvents() {
    for (var i = 0; i < state.events.length; i++) {
      var ev = state.events[i];
      if (ev.t === 'raise') { fx.push({ t: 'raise', x: ev.x, y: ev.y, life: 0.2 }); tone(300 + 30 * Math.min(12, state.h[L.idx(ev.x, ev.y)]), 0.06, 'square'); }
      else if (ev.t === 'deny') { fx.push({ t: 'deny', x: ev.x, y: ev.y, life: 0.2 }); tone(120, 0.08, 'sawtooth', 0.04); }
      else if (ev.t === 'tide') { if (ev.lost > 0) shake = 1; tone(160, 0.25, 'sine', 0.1); }
      else if (ev.t === 'over') { tone(90, 0.4, 'sawtooth', 0.08); saveBest(); }
      else if (ev.t === 'won') { tone(660, 0.15, 'triangle'); tone(880, 0.3, 'triangle'); saveBest(); }
    }
  }

  function frame(ts) {
    if (last === null) last = ts;
    var el = Math.min(0.25, (ts - last) / 1000);
    last = ts; acc += el; now += el;
    var steps = 0;
    while (acc >= DT && steps < 5) {
      var input = { moveX: pending.moveX, moveY: pending.moveY, action: pending.action, tapX: pending.tapX, tapY: pending.tapY };
      pending.moveX = 0; pending.moveY = 0; pending.action = false; pending.tapX = null; pending.tapY = null;
      L.step(state, input, DT);
      handleEvents();
      acc -= DT; steps++;
    }
    if (steps === 5) acc = 0;
    for (var i = fx.length - 1; i >= 0; i--) { fx[i].life -= el; if (fx[i].life <= 0) fx.splice(i, 1); }
    shake = Math.max(0, shake - el / 0.2);
    R.draw(ctx, state, { logic: L, now: now, fx: fx, shake: shake, best: best, muted: muted });
    window.requestAnimationFrame(frame);
  }
  window.requestAnimationFrame(frame);
  window.GameMain.getState = function () { return state; };
}

if (typeof window !== 'undefined') {
  window.GameMain = { bootstrap: bootstrap };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
  else bootstrap();
}
if (typeof module !== 'undefined') module.exports = { bootstrap: bootstrap };
