'use strict';
// Çark Vardiyası: döngü, girdi, ses.
function bootstrap() {
  var L = (typeof window !== 'undefined' && window.GameLogic) || require('./logic.js');
  var R = (typeof window !== 'undefined' && window.GameRender) || require('./render.js');
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var DT = 1 / 60;
  var best = 0;
  try { best = parseInt(localStorage.getItem('carkvardiya-best') || '0', 10) || 0; } catch (e) { best = 0; }
  var seed = 7;
  var state = L.createState(seed);
  var pending = { dx: 0, dy: 0, repair: false, pick: null };
  var acc = 0, last = null, overFrames = 0, shake = 0, muted = false, actx = null;

  function beep(f, d) {
    if (muted) return;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      var o = actx.createOscillator(), g = actx.createGain();
      o.frequency.value = f; g.gain.value = 0.05;
      o.connect(g); g.connect(actx.destination);
      o.start(); o.stop(actx.currentTime + d);
    } catch (e) { actx = null; }
  }

  function restart() {
    seed = (seed * 31 + 17) % 100000;
    state = L.createState(seed);
    overFrames = 0;
  }

  function onEvents(ev) {
    for (var i = 0; i < ev.length; i++) {
      if (ev[i] === 'repair') beep(660, 0.08);
      else if (ev[i] === 'break') { beep(120, 0.2); shake = 0.2; }
      else if (ev[i] === 'poor') beep(200, 0.1);
      else if (ev[i] === 'move') beep(440, 0.02);
      else if (ev[i] === 'over') { beep(90, 0.4); shake = 0.2; }
      else if (ev[i] === 'won') beep(880, 0.4);
    }
  }

  function finish() {
    if (state.score > best) {
      best = state.score;
      try { localStorage.setItem('carkvardiya-best', String(best)); } catch (e) { /* kayıt yok */ }
    }
  }

  function onKey(e) {
    var k = e.key, c = e.code;
    var used = true;
    if (k === 'r' || k === 'R' || c === 'KeyR') { restart(); }
    else if (k === 'm' || k === 'M' || c === 'KeyM') { muted = !muted; }
    else if (k === 'ArrowLeft' || k === 'a' || k === 'A') pending.dx = -1;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') pending.dx = 1;
    else if (k === 'ArrowUp' || k === 'w' || k === 'W') pending.dy = -1;
    else if (k === 'ArrowDown' || k === 's' || k === 'S') pending.dy = 1;
    else if (k === ' ' || k === 'Enter' || k === 'e' || k === 'E') {
      if (state.status !== 'playing') { if (overFrames > 24) restart(); }
      else pending.repair = true;
    } else used = false;
    if (used && e.preventDefault) e.preventDefault();
  }

  function onPointer(e) {
    if (state.status !== 'playing') { if (overFrames > 24) restart(); return; }
    var rect = canvas.getBoundingClientRect();
    var sx = canvas.width / (rect.width || canvas.width);
    var sy = canvas.height / (rect.height || canvas.height);
    var i = R.cellAt((e.clientX - rect.left) * sx, (e.clientY - rect.top) * sy);
    if (i >= 0) pending.pick = i;
  }

  window.addEventListener('keydown', onKey);
  canvas.addEventListener('pointerdown', onPointer);

  function frame(ts) {
    if (last === null) last = ts;
    acc += Math.min((ts - last) / 1000, 0.25);
    last = ts;
    var n = 0;
    while (acc >= DT && n < 5) {
      var input = pending;
      pending = { dx: 0, dy: 0, repair: false, pick: null };
      var was = state.status;
      L.step(state, input, DT);
      onEvents(state.events);
      if (was === 'playing' && state.status !== 'playing') finish();
      if (state.status !== 'playing') overFrames++;
      acc -= DT; n++;
    }
    if (n === 5) acc = 0;
    shake = Math.max(0, shake - 1 / 60);
    R.draw(ctx, state, { best: best, shake: shake });
    window.requestAnimationFrame(frame);
  }
  window.requestAnimationFrame(frame);
  return { getState: function () { return state; }, setState: function (s) { state = s; } };
}

if (typeof window !== 'undefined') {
  window.GameMain = { bootstrap: bootstrap };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap); else bootstrap();
}
if (typeof module !== 'undefined') module.exports = { bootstrap: bootstrap };
