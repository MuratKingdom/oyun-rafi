// Sekme Gücü — döngü, girdi, ses, efektler; logic + render'ı bağlar
//
// Akış (phase): ready → playing ⇄ paused → over → (dokun/R) → playing
// Mobil: ekranın her yeri dokunma alanıdır; parmak canvas dışına kayınca da bırakma
// algılanır; sekme arka plana geçince oyun kendiliğinden duraklar.

var RESTART_LOCK_MS = 450; // ölümden hemen sonraki dokunuş yanlışlıkla yeniden başlatmasın
var SHAKE_MS = 180;
var SQUASH_MS = 120;
var TRAIL_LEN = 6;

function bootstrap() {
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var DT = 1 / 60;
  var C = window.GameLogic.CONST;

  // Keskin çizim: canvas'ın piksel boyutu ekran yoğunluğuna göre, görünen boyutu CSS'ten.
  var dpr = Math.min(3, Math.max(1, (window.devicePixelRatio || 1)));
  canvas.width = Math.round(C.CANVAS_W * dpr);
  canvas.height = Math.round(C.CANVAS_H * dpr);

  var touch = false;
  var input = { action: false };
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
      if (ac.state === 'suspended' && ac.resume) ac.resume();
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
  function buzz(ms) {
    if (muted) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
    } catch (e) {}
  }

  // Efekt durumu — oyun mantığından ayrı; testler mantığı bundan bağımsız doğrular.
  var fx = { particles: [], shake: 0, squash: 0, trail: [] };
  var shakeLeft = 0;
  var squashLeft = 0;
  function burst(x, y, n, color, speed) {
    for (var i = 0; i < n; i++) {
      var ang = Math.random() * Math.PI * 2;
      var sp = speed * (0.4 + Math.random() * 0.6);
      fx.particles.push({ x: x, y: y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0.5, max: 0.5, color: color });
    }
    if (fx.particles.length > 160) fx.particles.splice(0, fx.particles.length - 160);
  }
  function updateFx(dt) {
    var kept = [];
    for (var i = 0; i < fx.particles.length; i++) {
      var p = fx.particles[i];
      p.life -= dt;
      if (p.life <= 0) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 600 * dt;
      kept.push(p);
    }
    fx.particles = kept;
    shakeLeft = Math.max(0, shakeLeft - dt * 1000);
    squashLeft = Math.max(0, squashLeft - dt * 1000);
    fx.shake = shakeLeft / SHAKE_MS;
    fx.squash = squashLeft / SQUASH_MS;
  }

  function newGame() {
    var seed = Date.now() % 2147483647;
    return window.GameLogic.createState(seed);
  }

  var state = newGame();
  var phase = 'ready';
  var overAt = 0;
  var newBest = false;
  var prevBounces = state.bounces;
  var prevScore = state.score;

  function nowMs() { return Date.now(); }

  function startPlaying() {
    phase = 'playing';
    ensureAudio();
  }
  function restart() {
    state = newGame();
    prevBounces = state.bounces;
    prevScore = state.score;
    newBest = false;
    fx.particles = [];
    fx.trail = [];
    shakeLeft = 0;
    squashLeft = 0;
    startPlaying();
  }
  function canRestart() {
    return nowMs() - overAt >= RESTART_LOCK_MS;
  }

  // Ortak "bas" ve "bırak" — klavye ve dokunuş aynı yoldan geçer.
  function press() {
    if (phase === 'ready' || phase === 'paused') { startPlaying(); input.action = true; return; }
    if (phase === 'over') { if (canRestart()) { restart(); input.action = true; } return; }
    input.action = true;
  }
  function release() {
    input.action = false;
  }

  function onKeyDown(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      if (e.repeat) return;
      press();
    } else if (e.code === 'KeyR') {
      e.preventDefault();
      restart(); // R bilinçli bir tuş: kilit uygulanmaz
    } else if (e.code === 'KeyM') {
      e.preventDefault();
      muted = !muted;
    } else if (e.code === 'KeyP' || e.code === 'Escape') {
      e.preventDefault();
      if (phase === 'playing') pause();
      else if (phase === 'paused') startPlaying();
    }
  }
  function onKeyUp(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      release();
    }
  }
  function onPointerDown(e) {
    if (e.pointerType === 'touch' || e.pointerType === 'pen') touch = true;
    if (e.cancelable) e.preventDefault();
    press();
  }
  function onPointerUp(e) {
    if (e && e.cancelable) e.preventDefault();
    release();
  }
  function pause() {
    if (phase !== 'playing') return;
    phase = 'paused';
    release();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  // Bütün ekran dokunma alanı; bırakma pencere düzeyinde dinlenir ki parmak kayınca kaçmasın.
  window.addEventListener('pointerdown', onPointerDown, { passive: false });
  window.addEventListener('pointerup', onPointerUp, { passive: false });
  window.addEventListener('pointercancel', onPointerUp);
  window.addEventListener('blur', function () { release(); pause(); });
  window.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  if (document.addEventListener) {
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pause();
    });
  }

  var acc = 0;
  var last = null;

  function frame(ts) {
    if (last === null) last = ts;
    var frameDt = (ts - last) / 1000;
    last = ts;
    if (frameDt > 0.25) frameDt = 0.25;

    if (phase === 'playing') {
      acc += frameDt;
      var steps = 0;
      while (acc >= DT && steps < 5) {
        state = window.GameLogic.step(state, input, DT);
        acc -= DT;
        steps++;

        if (state.bounces !== prevBounces) {
          beep(220, 0.06, 'square');
          squashLeft = SQUASH_MS;
          burst(C.BALL_X, C.FLOOR_Y, 4, '#2f4a73', 120);
          prevBounces = state.bounces;
        }
        if (state.score !== prevScore) {
          beep(660 + Math.min(state.score, 30) * 12, 0.08, 'sine');
          buzz(8);
          burst(C.BALL_X, state.y, 10, '#5ac8fa', 220);
          prevScore = state.score;
        }
        if (state.status === 'over') {
          beep(110, 0.25, 'sawtooth');
          buzz(60);
          shakeLeft = SHAKE_MS;
          burst(C.BALL_X, state.y, 24, '#e05656', 320);
          if (state.score > best) {
            best = state.score;
            newBest = true;
            try { window.localStorage.setItem('sekmeguc-best', String(best)); } catch (e) {}
          }
          phase = 'over';
          overAt = nowMs();
          input.action = false;
          acc = 0;
          break;
        }
      }
      fx.trail.push({ x: C.BALL_X, y: state.y });
      if (fx.trail.length > TRAIL_LEN) fx.trail.shift();
    } else {
      acc = 0;
    }
    updateFx(frameDt);

    window.GameRender.draw(ctx, state, {
      best: best, muted: muted, phase: phase, fx: fx, touch: touch,
      newBest: newBest, canRestart: phase === 'over' && canRestart()
    });
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
