// Sekme Gücü — döngü, girdi, ses; logic + render'ı bağlar

function bootstrap() {
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var DT = 1 / 60;

  var input = { action: false, restart: false };
  var muted = false;
  var best = 0;
  try {
    var saved = window.localStorage.getItem('sekmeguc-best');
    if (saved) best = parseInt(saved, 10) || 0;
  } catch (e) {}

  var audioCtx = null;
  function ensureAudio() {
    if (audioCtx) return audioCtx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
    } catch (e) {
      audioCtx = null;
    }
    return audioCtx;
  }
  function beep(freq, dur, type) {
    if (muted) return;
    var ac = ensureAudio();
    if (!ac) return;
    try {
      var osc = ac.createOscillator();
      var gain = ac.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      gain.gain.value = 0.08;
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
      osc.stop(ac.currentTime + dur);
    } catch (e) {}
  }

  function newGame() {
    var seed = Date.now() % 2147483647;
    return window.GameLogic.createState(seed);
  }

  var state = newGame();
  var prevStatus = state.status;
  var prevBounces = state.bounces;
  var prevScore = state.score;

  function restart() {
    state = newGame();
    prevStatus = state.status;
    prevBounces = state.bounces;
    prevScore = state.score;
  }

  function onKeyDown(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      if (state.status === 'over') { restart(); return; }
      input.action = true;
    } else if (e.code === 'KeyR') {
      e.preventDefault();
      restart();
    } else if (e.code === 'KeyM') {
      e.preventDefault();
      muted = !muted;
    }
  }
  function onKeyUp(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      input.action = false;
    }
  }
  function onPointerDown(e) {
    e.preventDefault();
    if (state.status === 'over') { restart(); return; }
    input.action = true;
  }
  function onPointerUp(e) {
    e.preventDefault();
    input.action = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  var acc = 0;
  var last = null;

  function frame(ts) {
    if (last === null) last = ts;
    var frameDt = (ts - last) / 1000;
    last = ts;
    if (frameDt > 0.25) frameDt = 0.25;
    acc += frameDt;

    var steps = 0;
    while (acc >= DT && steps < 5) {
      state = window.GameLogic.step(state, input, DT);
      acc -= DT;
      steps++;

      if (state.bounces !== prevBounces) {
        beep(220, 0.06, 'square');
        prevBounces = state.bounces;
      }
      if (state.score !== prevScore) {
        beep(660, 0.08, 'sine');
        prevScore = state.score;
      }
      if (state.status !== prevStatus && state.status === 'over') {
        beep(110, 0.25, 'sawtooth');
        if (state.score > best) {
          best = state.score;
          try { window.localStorage.setItem('sekmeguc-best', String(best)); } catch (e) {}
        }
        prevStatus = state.status;
      }
    }

    window.GameRender.draw(ctx, state, { best: best, muted: muted });
    window.requestAnimationFrame(frame);
  }

  window.requestAnimationFrame(frame);
}

if (typeof window !== 'undefined') {
  window.GameMain = { bootstrap: bootstrap };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
}
if (typeof module !== 'undefined') module.exports = { bootstrap: bootstrap };
