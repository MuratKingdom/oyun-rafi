'use strict';
// Dongu, girdi, ses. Mantik logic.js'te, cizim render.js'te.
function bootstrap() {
  const L = window.GameLogic, R = window.GameRender;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const DT = 1 / 60;
  const KEY = 'kayartas-best';
  let best = 0;
  try { best = parseInt(window.localStorage.getItem(KEY), 10) || 0; } catch (e) { best = 0; }
  let muted = false, audio = null;
  let state = L.createState((Date.now() % 1000000) + 1);
  const input = { action: false, restart: false };
  let held = false, blockHeld = false, acc = 0, last = null;

  function beep(freq, dur, type) {
    if (muted) return;
    try {
      if (!audio) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) audio = new AC(); }
      if (!audio) return;
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = type || 'square'; o.frequency.value = freq;
      g.gain.value = 0.06;
      o.connect(g); g.connect(audio.destination);
      o.start(); o.stop(audio.currentTime + dur);
    } catch (e) { /* sessiz devam */ }
  }

  function restart() {
    state = L.createState((Date.now() % 1000000) + 1);
    blockHeld = true;
  }

  function press() {
    if (state.status !== 'playing') { restart(); return; }
    held = true;
  }
  function release() { held = false; blockHeld = false; }

  function onKeyDown(e) {
    const k = e.key;
    if (k === ' ' || k === 'ArrowUp' || k === 'Enter') { if (e.preventDefault) e.preventDefault(); if (!e.repeat) press(); }
    else if (k === 'r' || k === 'R') { restart(); }
    else if (k === 'm' || k === 'M') { muted = !muted; }
  }
  function onKeyUp(e) {
    const k = e.key;
    if (k === ' ' || k === 'ArrowUp' || k === 'Enter') release();
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  if (canvas.addEventListener) {
    canvas.addEventListener('pointerdown', function (e) { if (e.preventDefault) e.preventDefault(); press(); });
    canvas.addEventListener('pointerup', release);
  }

  function update() {
    input.action = held && !blockHeld;
    const before = state.status;
    L.step(state, input, DT);
    const ev = state.event;
    if (ev === 'launch') beep(220, 0.08, 'sawtooth');
    else if (ev === 'hit') beep(660, 0.15, 'square');
    else if (ev === 'miss') beep(150, 0.25, 'triangle');
    else if (ev === 'fall') beep(90, 0.3, 'sawtooth');
    if (before === 'playing' && state.score > best) {
      best = state.score;
      try { window.localStorage.setItem(KEY, String(best)); } catch (e) { /* kayit yok */ }
    }
  }

  function frame(ts) {
    if (last === null) last = ts;
    acc += Math.min(0.25, (ts - last) / 1000);
    last = ts;
    let n = 0;
    while (acc >= DT && n < 5) { update(); acc -= DT; n++; }
    if (n === 5) acc = 0;
    R.draw(ctx, state, { w: canvas.width, h: canvas.height, best: best, muted: muted });
    window.requestAnimationFrame(frame);
  }
  window.requestAnimationFrame(frame);
  return { getState: function () { return state; } };
}
let GameMainInstance = null;
if (typeof window !== 'undefined') {
  window.GameMain = { bootstrap: function () { GameMainInstance = bootstrap(); window.GameMain.getState = GameMainInstance.getState; return GameMainInstance; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', window.GameMain.bootstrap);
  else window.GameMain.bootstrap();
}
if (typeof module !== 'undefined') module.exports = { bootstrap: bootstrap };
