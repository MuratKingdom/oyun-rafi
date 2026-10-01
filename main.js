function bootstrap() {
  var L = window.GameLogic, R = window.GameRender;
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var DT = 1 / 60;
  var best = 0, muted = false, audio = null;
  try { best = parseInt(localStorage.getItem('tohumpayi-best'), 10) || 0; } catch (e) {}
  var seed = (Date.now() & 0x7fffffff) || 1;
  var state = L.createState(seed);
  var pending = [];
  var view = { best: best, flash: {}, shake: 0 };
  var acc = 0, last = null;

  function tone(f, d, type, vol) {
    if (muted) return;
    try {
      if (!audio) { var AC = window.AudioContext || window.webkitAudioContext; if (AC) audio = new AC(); }
      if (!audio) return;
      var o = audio.createOscillator(), g = audio.createGain();
      o.type = type || 'square'; o.frequency.value = f; g.gain.value = vol || 0.05;
      o.connect(g); g.connect(audio.destination);
      o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + d); o.stop(audio.currentTime + d);
    } catch (e) {}
  }
  function restart() {
    seed = (seed * 1664525 + 1013904223) & 0x7fffffff || 1;
    state = L.createState(seed); pending = []; view.flash = {};
  }
  function handle(ev) {
    if (ev.k === 'plant') { view.flash[ev.i] = 0.15; tone(300, 0.08); }
    else if (ev.k === 'harvest') { view.flash[ev.i] = 0.25; tone(520 + ev.n * 80, 0.14, 'triangle'); }
    else if (ev.k === 'ripe') { tone(700, 0.06, 'sine', 0.03); }
    else if (ev.k === 'spoil') { view.shake = 0.15; tone(140, 0.2, 'sawtooth'); }
    else if (ev.k === 'deny') { tone(120, 0.08, 'square'); }
    else if (ev.k === 'eat') { tone(260, 0.2, 'triangle'); }
    else if (ev.k === 'over') { view.shake = 0.2; tone(90, 0.4, 'sawtooth', 0.08); }
    else if (ev.k === 'won') { tone(880, 0.4, 'triangle'); }
  }
  function finishCheck() {
    if (state.status !== 'playing' && state.score > best) {
      best = state.score; view.best = best;
      try { localStorage.setItem('tohumpayi-best', String(best)); } catch (e) {}
    }
  }
  function onKey(e) {
    var k = e.key, code = e.code;
    if (k === 'r' || k === 'R' || code === 'KeyR') { restart(); if (e.preventDefault) e.preventDefault(); return; }
    if (k === 'm' || k === 'M') { muted = !muted; return; }
    if (k === ' ' || k === 'Spacebar') {
      if (e.preventDefault) e.preventDefault();
      if (state.status !== 'playing') restart();
      return;
    }
    if (k >= '1' && k <= '6') { pending.push(parseInt(k, 10) - 1); if (e.preventDefault) e.preventDefault(); }
  }
  function onPointer(e) {
    if (state.status !== 'playing') { restart(); return; }
    var rc = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: canvas.width, height: canvas.height };
    var x = (e.clientX - rc.left) * canvas.width / (rc.width || canvas.width);
    var y = (e.clientY - rc.top) * canvas.height / (rc.height || canvas.height);
    var i = R.plotAt(x, y);
    if (i >= 0) pending.push(i);
  }
  window.addEventListener('keydown', onKey);
  canvas.addEventListener('pointerdown', onPointer);

  function frame(ts) {
    if (last === null) last = ts;
    acc += Math.min(0.25, (ts - last) / 1000); last = ts;
    var n = 0;
    while (acc >= DT && n < 5) {
      var input = { plot: pending.length ? pending.shift() : -1, restart: false };
      L.step(state, input, DT);
      for (var i = 0; i < state.events.length; i++) handle(state.events[i]);
      finishCheck();
      acc -= DT; n++;
    }
    if (n === 5) acc = 0;
    for (var k in view.flash) { view.flash[k] -= 1 / 60; }
    if (view.shake > 0) view.shake -= 1 / 60;
    R.draw(ctx, state, view);
    window.requestAnimationFrame(frame);
  }
  window.requestAnimationFrame(frame);
  var api = { getState: function () { return state; }, setState: function (s) { state = s; } };
  if (typeof window !== 'undefined') window.GameMain.api = api;
  return api;
}
if (typeof window !== 'undefined') {
  window.GameMain = { bootstrap: bootstrap };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap); else bootstrap();
}
if (typeof module !== 'undefined') module.exports = { bootstrap: bootstrap };
