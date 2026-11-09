'use strict';
// Bant Hatti — dongu, girdi, ses.
(function () {
  var DT = 1 / 60, CELL = 64, OY = 56;
  var state = null, best = 0, muted = false, actx = null, seedN = 0, lastEvt = 0;
  var input = {};
  var canvas, ctx;

  function loadBest() { try { best = parseInt(localStorage.getItem('banthatti-best'), 10) || 0; } catch (e) { best = 0; } }
  function saveBest() { try { localStorage.setItem('banthatti-best', String(best)); } catch (e) {} }

  function newGame() {
    seedN++;
    var seed = ((typeof Date !== 'undefined' ? Date.now() : 1) + seedN * 7919) >>> 0;
    state = window.GameLogic.createState(seed);
    lastEvt = state.evtN;
  }

  function tone(f, d, type, v) {
    if (muted || !actx) return;
    try {
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'square'; o.frequency.value = f;
      g.gain.value = v || 0.05;
      o.connect(g); g.connect(actx.destination);
      var t = actx.currentTime;
      g.gain.setValueAtTime(v || 0.05, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.start(t); o.stop(t + d);
    } catch (e) {}
  }

  function initAudio() {
    if (actx) return;
    try { var C = window.AudioContext || window.webkitAudioContext; if (C) actx = new C(); } catch (e) { actx = null; }
  }

  function playEvents() {
    if (state.evtN === lastEvt) return;
    lastEvt = state.evtN;
    var t = state.evtType;
    if (t === 'place') tone(440, 0.05, 'square');
    else if (t === 'score') tone(660, 0.08, 'triangle', 0.07);
    else if (t === 'miss') tone(140, 0.2, 'sawtooth', 0.07);
    else if (t === 'deny') tone(110, 0.08, 'square');
    else if (t === 'won') tone(880, 0.4, 'triangle', 0.08);
    else if (t === 'over') tone(90, 0.4, 'sawtooth', 0.08);
  }

  function restart() { newGame(); }

  function keyName(e) { return e.code || e.key; }

  function onKeyDown(e) {
    initAudio();
    var k = keyName(e), used = true;
    if (k === 'ArrowLeft' || k === 'KeyA') input.left = true;
    else if (k === 'ArrowRight' || k === 'KeyD') input.right = true;
    else if (k === 'ArrowUp' || k === 'KeyW') input.up = true;
    else if (k === 'ArrowDown' || k === 'KeyS') input.down = true;
    else if (k === 'Space') { if (state.status !== 'playing') restart(); else input.action = true; }
    else if (k === 'Enter') { if (state.status !== 'playing') restart(); else input.start = true; }
    else if (k === 'KeyR' || k === 'r' || k === 'R') restart();
    else if (k === 'KeyM' || k === 'm' || k === 'M') muted = !muted;
    else used = false;
    if (used && e.preventDefault) e.preventDefault();
  }

  function onPointer(e) {
    initAudio();
    if (state.status !== 'playing') { restart(); return; }
    var r = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: canvas.width, height: canvas.height };
    var sx = canvas.width / (r.width || canvas.width), sy = canvas.height / (r.height || canvas.height);
    var x = Math.floor(((e.clientX - r.left) * sx) / CELL), y = Math.floor(((e.clientY - r.top) * sy - OY) / CELL);
    if (x >= 0 && y >= 0 && x < state.w && y < state.h) input.click = { x: x, y: y };
  }

  var accT = 0, lastT = null;
  function frame(ts) {
    if (lastT === null) lastT = ts;
    accT += Math.min(0.25, Math.max(0, (ts - lastT) / 1000));
    lastT = ts;
    var n = 0;
    while (accT >= DT && n < 5) {
      window.GameLogic.step(state, input, DT);
      input = {};
      accT -= DT; n++;
    }
    if (n === 5) accT = 0;
    if (state.status !== 'playing' && state.score > best) { best = state.score; saveBest(); }
    playEvents();
    window.GameRender.draw(ctx, state, { best: best, interval: window.GameLogic.interval(state) });
    window.requestAnimationFrame(frame);
  }

  function bootstrap() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    loadBest();
    newGame();
    window.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('pointerdown', onPointer);
    window.requestAnimationFrame(frame);
  }

  var api = { bootstrap: bootstrap, getState: function () { return state; }, setState: function (s) { state = s; lastEvt = s.evtN; } };
  if (typeof window !== 'undefined') {
    window.GameMain = api;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap); else bootstrap();
  }
  if (typeof module !== 'undefined') module.exports = { bootstrap: bootstrap };
})();
