'use strict';
// Halka Dışı — döngü, girdi, ses. logic + render'ı bağlar.
var ctrl = null;

function bootstrap() {
  if (ctrl) return ctrl;
  var L = window.GameLogic, R = window.GameRender, C = L.C;
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var DT = 1 / 60;
  var state = L.createState(newSeed());
  var input = { left: false, right: false, up: false, down: false, action: false, restart: false, target: null };
  var pressed = { action: false, restart: false }; // aynı karede bas-bırak kaybolmasın
  var acc = 0, last = null, muted = false, audio = null;
  var shakeT = 0, particles = [], best = loadBest();

  function newSeed() { return (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0; }
  function loadBest() { try { return parseInt(localStorage.getItem('halkadisi.best') || '0', 10) || 0; } catch (e) { return 0; } }
  function saveBest(v) { try { localStorage.setItem('halkadisi.best', String(v)); } catch (e) { /* yok say */ } }

  function ensureAudio() {
    if (audio || muted) return;
    try { var AC = window.AudioContext || window.webkitAudioContext; if (AC) audio = new AC(); } catch (e) { audio = null; }
  }
  function tone(freq, dur, type, vol) {
    if (!audio || muted) return;
    try {
      var o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime;
      o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol || 0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + dur);
    } catch (e) { /* sessiz devam */ }
  }
  function burst(x, y, color, n) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 140;
      particles.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.4, max: 0.4, color: color });
    }
  }
  function handleEvents(s) {
    for (var i = 0; i < s.events.length; i++) {
      var e = s.events[i];
      if (e.type === 'hit') { tone(180 + Math.min(400, e.power), 0.06, 'square', 0.08); burst(e.x, e.y, '#ffffff', 4); if (e.power > 150) shakeT = 0.12; }
      else if (e.type === 'out') { tone(660, 0.12, 'triangle', 0.15); burst(e.x, e.y, '#f2c14e', 14); shakeT = 0.15; }
      else if (e.type === 'dash') tone(320, 0.05, 'sawtooth', 0.06);
      else if (e.type === 'clear') { tone(523, 0.1, 'triangle'); tone(784, 0.18, 'triangle'); }
      else if (e.type === 'lose') { tone(140, 0.35, 'sawtooth', 0.18); shakeT = 0.2; burst(s.player.x, s.player.y, '#4fb3ff', 18); }
      else if (e.type === 'win') tone(988, 0.3, 'triangle');
    }
    if (s.status !== 'playing' && s.score > best) { best = s.score; saveBest(best); }
  }

  var KEYS = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', Space: 'action' };
  function codeOf(ev) {
    if (ev.code) return ev.code;
    var k = ev.key;
    if (k === ' ') return 'Space';
    if (k === 'r' || k === 'R') return 'KeyR';
    if (k === 'm' || k === 'M') return 'KeyM';
    return k;
  }
  window.addEventListener('keydown', function (ev) {
    var code = codeOf(ev);
    ensureAudio();
    if (code === 'KeyR' || ((code === 'Space' || code === 'Enter') && state.status !== 'playing')) {
      pressed.restart = true; if (ev.preventDefault) ev.preventDefault(); return;
    }
    if (code === 'KeyM') { muted = !muted; return; }
    var k = KEYS[code];
    if (k) { input[k] = true; if (k === 'action') pressed.action = true; if (ev.preventDefault) ev.preventDefault(); }
  });
  window.addEventListener('keyup', function (ev) {
    var k = KEYS[codeOf(ev)];
    if (k) { input[k] = false; if (ev.preventDefault) ev.preventDefault(); }
  });

  function toCanvas(ev) {
    var r = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: C.W, height: C.H };
    return { x: (ev.clientX - r.left) * C.W / (r.width || C.W), y: (ev.clientY - r.top) * C.H / (r.height || C.H) };
  }
  var pointerDown = false;
  canvas.addEventListener('pointerdown', function (ev) {
    ensureAudio();
    if (state.status !== 'playing') { pressed.restart = true; return; }
    pointerDown = true; input.target = toCanvas(ev);
    if (ev.preventDefault) ev.preventDefault();
  });
  canvas.addEventListener('pointermove', function (ev) { if (pointerDown) input.target = toCanvas(ev); });
  function up() { pointerDown = false; input.target = null; }
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);

  function frame(ts) {
    if (last === null) last = ts;
    acc += Math.min(0.25, (ts - last) / 1000); last = ts;
    var n = 0;
    while (acc >= DT && n < 5) {
      var inp = { left: input.left, right: input.right, up: input.up, down: input.down,
        action: input.action || pressed.action, restart: pressed.restart, target: input.target };
      pressed.action = false; pressed.restart = false;
      state = L.step(state, inp, DT);
      handleEvents(state);
      acc -= DT; n++;
    }
    if (n === 5) acc = 0;
    shakeT = Math.max(0, shakeT - n * DT);
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i]; p.life -= n * DT; p.x += p.vx * n * DT; p.y += p.vy * n * DT;
      if (p.life <= 0) particles.splice(i, 1);
    }
    var sh = shakeT > 0 ? { x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 8 } : { x: 0, y: 0 };
    R.draw(ctx, state, { C: C, best: best, muted: muted, shake: sh, particles: particles });
    window.requestAnimationFrame(frame);
  }
  window.requestAnimationFrame(frame);

  ctrl = { getState: function () { return state; } };
  return ctrl;
}

if (typeof window !== 'undefined') {
  window.GameMain = { bootstrap: bootstrap };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap); else bootstrap();
}
if (typeof module !== 'undefined') module.exports = { bootstrap };
