'use strict';
function bootstrap() {
  var Logic = window.GameLogic, Render = window.GameRender;
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var DT = 1 / 60;
  var state = Logic.createState(newSeed());
  var input = { choice: null, action: false };
  var best = 0, muted = false, audio = null, overAt = 0;
  try { best = parseInt(localStorage.getItem('nobetocagi-best'), 10) || 0; } catch (e) { best = 0; }

  function newSeed() { return (Math.floor(Math.random() * 1e9)) | 0; }

  function tone(freq, dur, type, vol) {
    if (muted) return;
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      var o = audio.createOscillator(), g = audio.createGain();
      o.type = type || 'square'; o.frequency.value = freq;
      g.gain.value = vol || 0.05;
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
      o.connect(g); g.connect(audio.destination);
      o.start(); o.stop(audio.currentTime + dur);
    } catch (e) { audio = null; }
  }

  function restart() { state = Logic.createState(newSeed()); overAt = 0; }

  function onKey(e) {
    var k = e.key;
    if (k === ' ' || k === 'ArrowLeft' || k === 'ArrowRight' || k === 'Enter') e.preventDefault();
    if (k === 'm' || k === 'M') { muted = !muted; return; }
    if (state.status !== 'playing') {
      if (k === 'r' || k === 'R' || ((k === ' ' || k === 'Enter') && Date.now() - overAt > 300)) restart();
      return;
    }
    if (k === 'r' || k === 'R') { restart(); return; }
    tone(300, 0.04);
    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === '1') input.choice = 'wood';
    else if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === '2') input.choice = 'food';
    else if (k === ' ' || k === 'Enter') input.action = true;
  }
  window.addEventListener('keydown', onKey);

  canvas.addEventListener('pointerdown', function (e) {
    if (state.status !== 'playing') { if (Date.now() - overAt > 300) restart(); return; }
    var r = canvas.getBoundingClientRect();
    var x = e.clientX - r.left;
    input.choice = x < r.width / 2 ? 'wood' : 'food';
    tone(300, 0.04);
  });

  function sound(ev) {
    if (ev === 'gather') tone(520, 0.05, 'triangle');
    else if (ev === 'switch') tone(260, 0.08);
    else if (ev === 'dusk') tone(180, 0.4, 'sine', 0.08);
    else if (ev === 'dawn') tone(660, 0.3, 'sine', 0.08);
    else if (ev === 'won') tone(880, 0.6, 'sine', 0.08);
    else if (ev === 'over') tone(90, 0.5, 'sawtooth', 0.08);
  }

  var acc = 0, last = null;
  function frame(ts) {
    if (last === null) last = ts;
    acc += Math.min(0.25, (ts - last) / 1000);
    last = ts;
    var n = 0;
    while (acc >= DT && n < 5) {
      var wasPlaying = state.status === 'playing';
      Logic.step(state, input, DT);
      input.choice = null; input.action = false;
      acc -= DT; n++;
      if (wasPlaying && state.status !== 'playing') {
        overAt = Date.now();
        if (state.score > best) {
          best = state.score;
          try { localStorage.setItem('nobetocagi-best', String(best)); } catch (e) { /* kayıt yok */ }
        }
      }
    }
    if (n === 5) acc = 0;
    var ev = state.events.splice(0);
    for (var i = 0; i < ev.length; i++) sound(ev[i]);
    Render.draw(ctx, state, { logic: Logic, best: best, muted: muted });
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
