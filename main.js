'use strict';
// Döngü, girdi ve ses; logic + render'ı bağlar.
function bootstrap() {
  var DT = 1 / 60;
  var L = window.GameLogic, R = window.GameRender;
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var input = { left: false, right: false, up: false, down: false, action: false, restart: false, angle: null, power: null };
  var muted = false, actx = null, best = 0, last = null, acc = 0, dragging = false;
  try { best = Number(localStorage.getItem('tekatis-best')) || 0; } catch (e) { best = 0; }

  function newSeed() { return (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0; }
  var state = L.createState(newSeed());

  function audio() {
    if (actx || muted) return actx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) actx = new AC();
    } catch (e) { actx = null; }
    return actx;
  }
  function beep(freq, dur, type) {
    if (muted) return;
    try {
      var a = audio();
      if (!a) return;
      var o = a.createOscillator(), g = a.createGain();
      o.type = type || 'square';
      o.frequency.value = freq;
      g.gain.value = 0.06;
      o.connect(g); g.connect(a.destination);
      o.start();
      o.stop(a.currentTime + dur);
    } catch (e) { /* sessiz devam */ }
  }
  function saveBest() {
    if (state.score > best) {
      best = state.score;
      try { localStorage.setItem('tekatis-best', String(best)); } catch (e) { /* kayıt yok */ }
    }
  }
  function reset() { state = L.createState(newSeed()); beep(500, 0.06); }

  function keyMap(e) {
    var k = e.key;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') return 'up';
    if (k === 'ArrowDown' || k === 's' || k === 'S') return 'down';
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') return 'left';
    if (k === 'ArrowRight' || k === 'd' || k === 'D') return 'right';
    if (k === ' ' || k === 'Enter' || e.code === 'Space') return 'action';
    if (k === 'r' || k === 'R' || e.code === 'KeyR') return 'restart';
    if (k === 'm' || k === 'M') return 'mute';
    return null;
  }
  window.addEventListener('keydown', function (e) {
    var m = keyMap(e);
    if (!m) return;
    if (e.preventDefault) e.preventDefault();
    audio();
    if (m === 'mute') { muted = !muted; return; }
    if (m === 'action' || m === 'restart') { if (!e.repeat) input[m] = true; return; }
    input[m] = true;
  });
  window.addEventListener('keyup', function (e) {
    var m = keyMap(e);
    if (m && m !== 'action' && m !== 'restart' && m !== 'mute') input[m] = false;
  });

  function aimFromPointer(e) {
    var r = canvas.getBoundingClientRect();
    var sx = 900 / (r.width || 900), sy = 400 / (r.height || 400);
    var dx = (e.clientX - r.left) * sx - 60, dy = 332 - (e.clientY - r.top) * sy;
    var ang = Math.atan2(dy, Math.max(dx, 1)) * 180 / Math.PI;
    var pw = 250 + Math.min(1, Math.sqrt(dx * dx + dy * dy) / 400) * 400;
    input.angle = Math.max(10, Math.min(80, ang));
    input.power = pw;
  }
  canvas.addEventListener('pointerdown', function (e) { audio(); dragging = true; aimFromPointer(e); });
  canvas.addEventListener('pointermove', function (e) { if (dragging) aimFromPointer(e); });
  canvas.addEventListener('pointerup', function () {
    if (!dragging) return;
    dragging = false;
    input.action = true;
  });

  function frame(t) {
    if (last === null) last = t;
    acc += Math.min(0.25, (t - last) / 1000);
    last = t;
    if (input.restart || (input.action && state.status !== 'playing' && state.overTime > 0.4)) {
      reset();
      input.restart = false; input.action = false; input.angle = null; input.power = null;
    }
    var n = 0;
    while (acc >= DT && n < 5) {
      var ph = state.phase, st = state.status, cl = state.cleared;
      L.step(state, input, DT);
      if (input.action) { input.action = false; }
      if (!dragging) { input.angle = null; input.power = null; }
      if (ph === 'aim' && state.phase === 'flight') beep(180, 0.12, 'sawtooth');
      if (state.cleared > cl) beep(760, 0.15, 'square');
      if (st === 'playing' && state.status === 'over') { beep(110, 0.3, 'sawtooth'); saveBest(); }
      if (st === 'playing' && state.status === 'won') { beep(980, 0.4, 'square'); saveBest(); }
      acc -= DT; n++;
    }
    if (n === 5) acc = 0;
    R.draw(ctx, state, { best: best, muted: muted });
    window.requestAnimationFrame(frame);
  }
  window.requestAnimationFrame(frame);
  return { getState: function () { return state; } };
}

if (typeof window !== 'undefined') {
  window.GameMain = { bootstrap: bootstrap };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
  else bootstrap();
}
if (typeof module !== 'undefined') module.exports = { bootstrap: bootstrap };
