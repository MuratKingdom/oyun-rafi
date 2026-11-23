'use strict';
// Ambar Hesabı — döngü, girdi, ses. logic + render'ı bağlar.
var ctrl = null;

function bootstrap() {
  if (ctrl) return ctrl;
  var L = window.GameLogic, R = window.GameRender, C = L.C;
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var DT = 1 / 60;
  var state = L.createState(newSeed());
  var pressed = { action: false, demolish: false, restart: false }; // basış mandalları
  var acc = 0, last = null, muted = false, audio = null;
  var shakeT = 0, spillFlash = 0, spillToneT = 0, msg = '', msgT = 0, particles = [], best = loadBest();

  function newSeed() { return (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0; }
  function loadBest() { try { return parseInt(localStorage.getItem('ambarhesabi.best') || '0', 10) || 0; } catch (e) { return 0; } }
  function saveBest(v) { try { localStorage.setItem('ambarhesabi.best', String(v)); } catch (e) { /* yok say */ } }

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
  function slotCenter(i) { var r = R.slotRect(i); return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; }

  function handleEvents(s) {
    for (var i = 0; i < s.events.length; i++) {
      var e = s.events[i], c;
      if (e.type === 'build') { c = slotCenter(e.slot); tone(440, 0.08, 'triangle'); tone(660, 0.1, 'triangle', 0.1); burst(c.x, c.y, '#e8c35a', 14); }
      else if (e.type === 'demolish') { c = slotCenter(e.slot); tone(150, 0.12, 'square', 0.1); burst(c.x, c.y, '#8c3b2e', 12); shakeT = 0.1; }
      else if (e.type === 'deny') { tone(110, 0.08, 'sawtooth', 0.08); msg = e.why; msgT = 1.2; }
      else if (e.type === 'spill') { spillFlash = 0.15; if (spillToneT <= 0) { tone(880, 0.05, 'sine', 0.06); spillToneT = 0.4; } }
      else if (e.type === 'season') tone(523, 0.12, 'sine', 0.08);
      else if (e.type === 'year') { tone(523, 0.1, 'triangle'); tone(784, 0.18, 'triangle'); msg = 'Yeni yıl: tüketim arttı'; msgT = 1.5; }
      else if (e.type === 'lose') { tone(140, 0.35, 'sawtooth', 0.18); shakeT = 0.2; }
      else if (e.type === 'win') { tone(988, 0.3, 'triangle'); burst(240, 240, '#7fd17f', 30); }
    }
    if (s.status !== 'playing' && s.score > best) { best = s.score; saveBest(best); }
  }

  function codeOf(ev) {
    if (ev.code) return ev.code;
    var k = ev.key;
    if (k === ' ') return 'Space';
    if (k === 'r' || k === 'R') return 'KeyR';
    if (k === 'm' || k === 'M') return 'KeyM';
    if (k === 'b' || k === 'B') return 'KeyB';
    if (k === 'x' || k === 'X') return 'KeyX';
    return k;
  }
  var BUILD = { Space: 1, KeyB: 1, ArrowUp: 1, KeyW: 1, Enter: 1 };
  var DEMO = { KeyX: 1, ArrowDown: 1, KeyS: 1, Backspace: 1 };
  window.addEventListener('keydown', function (ev) {
    var code = codeOf(ev);
    ensureAudio();
    if (code === 'KeyR' || ((code === 'Space' || code === 'Enter') && state.status !== 'playing')) {
      pressed.restart = true; if (ev.preventDefault) ev.preventDefault(); return;
    }
    if (code === 'KeyM') { muted = !muted; return; }
    if (BUILD[code]) { if (!ev.repeat) pressed.action = true; if (ev.preventDefault) ev.preventDefault(); }
    else if (DEMO[code]) { if (!ev.repeat) pressed.demolish = true; if (ev.preventDefault) ev.preventDefault(); }
  });

  function toCanvas(ev) {
    var r = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: C.W, height: C.H };
    return { x: (ev.clientX - r.left) * C.W / (r.width || C.W), y: (ev.clientY - r.top) * C.H / (r.height || C.H) };
  }
  canvas.addEventListener('pointerdown', function (ev) {
    ensureAudio();
    if (ev.preventDefault) ev.preventDefault();
    if (state.status !== 'playing') { pressed.restart = true; return; }
    var p = toCanvas(ev);
    for (var i = 0; i < C.MAX_SILO; i++) {
      var r = R.slotRect(i);
      if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y - 16 && p.y <= r.y + r.h) {
        if (i < state.silos) pressed.demolish = true; else pressed.action = true;
        return;
      }
    }
  });

  function frame(ts) {
    if (last === null) last = ts;
    acc += Math.min(0.25, (ts - last) / 1000); last = ts;
    var n = 0;
    while (acc >= DT && n < 5) {
      var inp = { action: pressed.action, demolish: pressed.demolish, restart: pressed.restart };
      pressed.action = false; pressed.demolish = false; pressed.restart = false;
      state = L.step(state, inp, DT);
      handleEvents(state);
      acc -= DT; n++;
    }
    if (n === 5) acc = 0;
    var el = n * DT;
    shakeT = Math.max(0, shakeT - el); spillFlash = Math.max(0, spillFlash - el);
    spillToneT = Math.max(0, spillToneT - el); msgT = Math.max(0, msgT - el);
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i]; p.life -= el; p.x += p.vx * el; p.y += p.vy * el;
      if (p.life <= 0) particles.splice(i, 1);
    }
    var sh = shakeT > 0 ? { x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 8 } : { x: 0, y: 0 };
    R.draw(ctx, state, { C: C, L: L, best: best, muted: muted, shake: sh, particles: particles,
      spillFlash: spillFlash, msg: msg, msgT: msgT });
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
