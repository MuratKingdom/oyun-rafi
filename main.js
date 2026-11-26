// Kanca Tırmanışı — döngü, girdi, ses
'use strict';

function bootstrap() {
  const L = window.GameLogic, R = window.GameRender;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const DT = 1 / 60;
  const input = { left: false, right: false, action: false };
  const view = { best: 0, muted: false, particles: [], shake: 0, jx: 0, jy: 0, input: input, logic: L };
  let seed = 1 + Math.floor(Math.random() * 1e9);
  let state = L.createState(seed);
  let acc = 0, last = null, overAt = 0;
  let audio = null;

  try { view.best = parseInt(localStorage.getItem('kancatirmanis.best') || '0', 10) || 0; } catch (e) { view.best = 0; }

  function ensureAudio() {
    if (audio || view.muted) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audio = new AC();
    } catch (e) { audio = null; }
  }
  function tone(freq, dur, type, vol) {
    if (!audio || view.muted) return;
    try {
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = type || 'square'; o.frequency.value = freq;
      g.gain.value = vol || 0.06;
      o.connect(g); g.connect(audio.destination);
      const t = audio.currentTime;
      g.gain.setValueAtTime(vol || 0.06, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.start(t); o.stop(t + dur);
    } catch (e) { /* sessiz devam */ }
  }
  function burst(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 40 + Math.random() * 120;
      view.particles.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5, max: 0.5 });
    }
  }

  function restart() {
    seed = (seed + 7919) >>> 0;
    state = L.createState(seed);
    view.particles.length = 0; view.shake = 0;
    acc = 0;
  }

  function handleEvents() {
    for (const e of state.events) {
      if (e.type === 'hook') tone(660, 0.07, 'square');
      else if (e.type === 'snap') { tone(880, 0.05, 'triangle'); burst(state.px, state.py, 5); }
      else if (e.type === 'release') tone(440, 0.05, 'sine');
      else if (e.type === 'miss') tone(160, 0.08, 'sawtooth', 0.04);
      else if (e.type === 'break') { tone(220, 0.15, 'sawtooth'); burst(e.x, e.y, 10); view.shake = 0.15; }
      else if (e.type === 'over' || e.type === 'won') {
        tone(e.type === 'won' ? 990 : 110, 0.35, e.type === 'won' ? 'triangle' : 'sawtooth', 0.08);
        view.shake = 0.2; overAt = state.time;
        if (state.score > view.best) {
          view.best = state.score;
          try { localStorage.setItem('kancatirmanis.best', String(view.best)); } catch (err) { /* kayıt yok */ }
        }
      }
    }
    state.events.length = 0;
  }

  function isOver() { return state.status !== 'playing'; }

  const KEYS = { ' ': 'action', 'Spacebar': 'action', 'ArrowUp': 'action', 'w': 'action', 'W': 'action',
    'ArrowLeft': 'left', 'a': 'left', 'A': 'left', 'ArrowRight': 'right', 'd': 'right', 'D': 'right' };

  window.addEventListener('keydown', function (e) {
    ensureAudio();
    const k = e.key;
    if (k === 'r' || k === 'R' || e.code === 'KeyR') { e.preventDefault && e.preventDefault(); restart(); return; }
    if (k === 'm' || k === 'M') { view.muted = !view.muted; return; }
    const m = KEYS[k];
    if (!m) return;
    if (e.preventDefault) e.preventDefault();
    if (isOver()) { if (m === 'action' && !e.repeat) restart(); return; }
    input[m] = true;
  });
  window.addEventListener('keyup', function (e) {
    const m = KEYS[e.key];
    if (m) { input[m] = false; if (e.preventDefault) e.preventDefault(); }
  });

  // dokunma/fare: basılı tut = kanca; ekranın sol/sağ üçte biri yön tercihi
  function pdown(e) {
    ensureAudio();
    if (e.preventDefault) e.preventDefault();
    if (isOver()) { restart(); return; }
    let x = 180;
    if (e.offsetX !== undefined && canvas.clientWidth) x = e.offsetX * 360 / canvas.clientWidth;
    input.left = x < 120; input.right = x > 240; input.action = true;
  }
  function pup(e) { input.action = false; input.left = false; input.right = false; }
  if (canvas.addEventListener) {
    canvas.addEventListener('pointerdown', pdown);
    canvas.addEventListener('pointerup', pup);
    canvas.addEventListener('pointercancel', pup);
  }

  function frame(ts) {
    if (last === null) last = ts;
    acc += Math.min(0.25, (ts - last) / 1000);
    last = ts;
    let n = 0;
    while (acc >= DT && n < 5) {
      L.step(state, input, DT);
      handleEvents();
      for (const p of view.particles) { p.x += p.vx * DT; p.y += p.vy * DT; p.life -= DT; }
      view.particles = view.particles.filter(p => p.life > 0);
      if (view.shake > 0) view.shake = Math.max(0, view.shake - DT);
      acc -= DT; n++;
    }
    if (n === 5) acc = 0;
    view.jx = (Math.random() * 2 - 1) * 30; view.jy = (Math.random() * 2 - 1) * 30;
    R.draw(ctx, state, view);
    window.requestAnimationFrame(frame);
  }
  window.requestAnimationFrame(frame);

  window.__game = { get state() { return state; }, set state(v) { state = v; }, input: input, view: view };
}

if (typeof window !== 'undefined') {
  window.GameMain = { bootstrap };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
  else bootstrap();
}
if (typeof module !== 'undefined') module.exports = { bootstrap };
