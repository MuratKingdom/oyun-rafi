'use strict';
// Sarkaç Atlayışı — döngü, girdi, ses.
function bootstrap() {
  var Logic = window.GameLogic, Render = window.GameRender;
  var canvas = document.getElementById('c');
  var ctx = canvas.getContext('2d');
  var DT = 1 / 60;
  var input = { action: false, restart: false };
  var seed = (Date.now() & 0xffff) + 1;
  var state = Logic.createState(seed);
  var best = 0, muted = false, started = false, overAt = 0;
  var particles = [], shake = 0, audio = null, acc = 0, last = 0;
  try { best = parseInt(localStorage.getItem('sarkac-best'), 10) || 0; } catch (e) { best = 0; }

  function ensureAudio() {
    if (audio) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audio = new AC();
    } catch (e) { audio = null; }
  }
  function beep(freq, dur, type) {
    if (muted || !audio) return;
    try {
      var o = audio.createOscillator(), g = audio.createGain();
      o.type = type || 'square';
      o.frequency.value = freq;
      g.gain.value = 0.06;
      o.connect(g); g.connect(audio.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
      o.stop(audio.currentTime + dur);
    } catch (e) { /* sessiz devam */ }
  }
  function burst(x, y, color, n) {
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2;
      particles.push({ x: x, y: y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, life: 0.5, color: color });
    }
  }
  function restart() {
    seed += 1;
    state = Logic.createState(seed);
    input.action = false;
    input.restart = false;
  }
  function onKeyDown(e) {
    var k = e.key;
    ensureAudio();
    started = true;
    if (k === 'm' || k === 'M') { muted = !muted; return; }
    if (k === 'r' || k === 'R') {
      if (state.status === 'over') restart();
      if (e.preventDefault) e.preventDefault();
      return;
    }
    if (k === ' ' || k === 'ArrowUp' || k === 'Enter') {
      if (e.preventDefault) e.preventDefault();
      if (state.status === 'over') { if (performance.now() - overAt > 400) restart(); return; }
      input.action = true;
    }
  }
  function onKeyUp(e) {
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'Enter') input.action = false;
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', function () {
    ensureAudio();
    started = true;
    if (state.status === 'over') { if (performance.now() - overAt > 400) restart(); return; }
    input.action = true;
  });
  canvas.addEventListener('pointerup', function () { input.action = false; });

  function handleEvents() {
    var ev = state.events;
    for (var i = 0; i < ev.length; i++) {
      if (ev[i] === 'release') beep(440, 0.08, 'triangle');
      else if (ev[i] === 'land') { beep(660, 0.12); burst(state.plat.x, state.plat.y, '#8af0b0', 10); }
      else if (ev[i] === 'perfect') { beep(880, 0.18); beep(1100, 0.12); burst(state.plat.x, state.plat.y, '#f5b942', 16); }
      else if (ev[i] === 'lose') {
        beep(120, 0.3, 'sawtooth'); shake = 8; overAt = performance.now();
        burst(state.ball.x, state.ball.y, '#e5484d', 14);
        if (state.score > best) {
          best = state.score;
          try { localStorage.setItem('sarkac-best', String(best)); } catch (e) { /* kayıt yok */ }
        }
      }
    }
    state.events.length = 0;
  }
  function tick() {
    Logic.step(state, input, DT);
    handleEvents();
    // tek basışlık girdi: basılı kalsa da yalnızca kenar sayılır (logic.prevAction)
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx * DT; p.y += p.vy * DT; p.life -= DT;
      if (p.life <= 0) particles.splice(i, 1);
    }
    if (shake > 0) shake = Math.max(0, shake - 40 * DT);
  }
  function frame(t) {
    var dt = last ? (t - last) / 1000 : DT;
    last = t;
    acc += Math.min(dt, 0.25);
    var n = 0;
    while (acc >= DT && n < 5) { tick(); acc -= DT; n++; }
    if (n === 5) acc = 0;
    Render.draw(ctx, state, { best: best, muted: muted, started: started, particles: particles, shake: shake });
    window.requestAnimationFrame(frame);
  }
  window.__sarkacState = function () { return state; };
  window.__sarkacSetState = function (s) { state = s; };
  window.requestAnimationFrame(frame);
}
if (typeof window !== 'undefined') {
  window.GameMain = { bootstrap: bootstrap };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap); else bootstrap();
}
if (typeof module !== 'undefined') module.exports = { bootstrap: bootstrap };
