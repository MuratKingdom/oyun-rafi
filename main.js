// Yercekimi Tuneli - dongu, girdi, ses; logic + render'i baglar

(function () {
  var DT = 1 / 60;
  var MAX_STEPS_PER_FRAME = 5;
  var VIEW_W = 480;
  var VIEW_H = 270;
  var STORAGE_KEY = 'gravtunel-best';

  function bootstrap() {
    var canvas = document.getElementById('game');
    var ctx = canvas.getContext('2d');

    var GameLogic = window.GameLogic;
    var GameRender = window.GameRender;

    var seed = Math.floor((typeof performance !== 'undefined' && performance.now ? performance.now() : 0) * 1000) ^ 0x9e3779b9;
    var state = GameLogic.createState(seed >>> 0);

    var storedBest = readBest();
    if (storedBest > state.best) state.best = storedBest;

    var input = { action: false, restart: false };
    var muted = false;
    var audioCtx = null;

    function ensureAudio() {
      if (audioCtx || muted) return;
      try {
        var Ctor = window.AudioContext || window.webkitAudioContext;
        audioCtx = new Ctor();
      } catch (e) {
        audioCtx = null;
      }
    }

    function playTone(freq, dur) {
      if (muted || !audioCtx) return;
      try {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.value = 0.06;
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        var now = audioCtx.currentTime;
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.start(now);
        osc.stop(now + dur);
      } catch (e) {
        // sessiz calismaya devam
      }
    }

    function readBest() {
      try {
        var v = window.localStorage.getItem(STORAGE_KEY);
        return v ? parseInt(v, 10) || 0 : 0;
      } catch (e) {
        return 0;
      }
    }

    function writeBest(v) {
      try {
        window.localStorage.setItem(STORAGE_KEY, String(v));
      } catch (e) {
        // localStorage yoksa sessizce gec
      }
    }

    function triggerFlip() {
      ensureAudio();
      input.action = true;
      playTone(state.gravityDir > 0 ? 520 : 340, 0.08);
    }

    function triggerRestart() {
      input.restart = true;
    }

    window.addEventListener('keydown', function (e) {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        triggerFlip();
      } else if (e.key === 'r' || e.key === 'R' || e.code === 'KeyR') {
        triggerRestart();
      } else if (e.key === 'm' || e.key === 'M') {
        muted = !muted;
      }
    });
    window.addEventListener('keyup', function (e) {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        input.action = false;
      }
    });

    canvas.addEventListener('pointerdown', function () {
      if (state.status === 'over') {
        triggerRestart();
      } else {
        triggerFlip();
      }
    });

    var wasOver = false;

    function frame(now) {
      requestAnimationFrame(frame);
      if (!frame.last) frame.last = now;
      var frameDt = (now - frame.last) / 1000;
      frame.last = now;
      if (frameDt > 0.25) frameDt = 0.25;
      frame.acc = (frame.acc || 0) + frameDt;

      var steps = 0;
      while (frame.acc >= DT && steps < MAX_STEPS_PER_FRAME) {
        GameLogic.step(state, input, DT);
        input.action = false;
        input.restart = false;
        frame.acc -= DT;
        steps++;
      }

      if (state.status === 'over' && !wasOver) {
        wasOver = true;
        if (state.score > readBest()) writeBest(state.score);
        playTone(160, 0.2);
      }
      if (state.status === 'playing' && wasOver) {
        wasOver = false;
      }

      GameRender.draw(ctx, state, { scale: canvas.width / VIEW_W });
    }

    requestAnimationFrame(frame);
  }

  if (typeof window !== 'undefined') {
    window.GameMain = { bootstrap: bootstrap };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
      bootstrap();
    }
  }
  if (typeof module !== 'undefined') {
    module.exports = { bootstrap: bootstrap };
  }
})();
