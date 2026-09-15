(function () {
  'use strict';

  var DT = 1 / 60;
  var MAX_STEPS_PER_FRAME = 5;

  function countBuilt(grid) {
    var c = 0;
    for (var i = 0; i < grid.length; i++) if (grid[i].building) c++;
    return c;
  }

  function bootstrap() {
    var canvas = document.getElementById('game');
    var ctx = canvas.getContext('2d');

    var input = { left: false, right: false, up: false, down: false, action: false };
    var muted = false;
    var audioCtx = null;

    function ensureAudio() {
      if (audioCtx || muted) return;
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) audioCtx = new AC();
      } catch (e) {
        audioCtx = null;
      }
    }

    function tone(freq, dur, type) {
      if (!audioCtx || muted) return;
      try {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = type || 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + dur);
      } catch (e) {
        /* ses üretilemedi, sessiz devam */
      }
    }

    function loadBest() {
      try {
        var v = window.localStorage.getItem('sonkuyu-best');
        return v ? (parseFloat(v) || 0) : 0;
      } catch (e) {
        return 0;
      }
    }

    function saveBest(v) {
      try {
        window.localStorage.setItem('sonkuyu-best', String(v));
      } catch (e) {
        /* localStorage yok, yoksay */
      }
    }

    var best = loadBest();
    var seed = Math.floor(Date.now() % 1000000) || 1;
    var state = window.GameLogic.createState(seed);
    state.best = best;
    var wasOver = false;

    function resetGame() {
      seed = Math.floor(Date.now() % 1000000) || 1;
      state = window.GameLogic.createState(seed);
      state.best = best;
      wasOver = false;
    }

    window.addEventListener('keydown', function (e) {
      ensureAudio();
      switch (e.code) {
        case 'ArrowLeft': case 'KeyA': input.left = true; e.preventDefault(); break;
        case 'ArrowRight': case 'KeyD': input.right = true; e.preventDefault(); break;
        case 'ArrowUp': case 'KeyW': input.up = true; e.preventDefault(); break;
        case 'ArrowDown': case 'KeyS': input.down = true; e.preventDefault(); break;
        case 'Space': case 'Enter': input.action = true; e.preventDefault(); break;
        case 'KeyR':
          if (state.status !== 'playing') resetGame();
          e.preventDefault();
          break;
        case 'KeyM':
          muted = !muted;
          e.preventDefault();
          break;
      }
    });

    window.addEventListener('keyup', function (e) {
      switch (e.code) {
        case 'ArrowLeft': case 'KeyA': input.left = false; break;
        case 'ArrowRight': case 'KeyD': input.right = false; break;
        case 'ArrowUp': case 'KeyW': input.up = false; break;
        case 'ArrowDown': case 'KeyS': input.down = false; break;
        case 'Space': case 'Enter': input.action = false; break;
      }
    });

    var touchTarget = null;
    canvas.addEventListener('pointerdown', function (e) {
      ensureAudio();
      if (state.status !== 'playing') { resetGame(); return; }
      var rect = canvas.getBoundingClientRect();
      var scaleX = canvas.width / rect.width;
      var scaleY = canvas.height / rect.height;
      var px = (e.clientX - rect.left) * scaleX;
      var py = (e.clientY - rect.top) * scaleY;
      var topH = 70;
      var GRID_W = window.GameLogic.GRID_W || 5;
      var gridSize = Math.min(canvas.width, canvas.height - topH);
      var cellSize = gridSize / GRID_W;
      var offX = (canvas.width - gridSize) / 2;
      var offY = topH;
      var gx = Math.floor((px - offX) / cellSize);
      var gy = Math.floor((py - offY) / cellSize);
      if (gx >= 0 && gx < GRID_W && gy >= 0 && gy < GRID_W) {
        touchTarget = { x: gx, y: gy };
      }
    });

    var lastTime = null;
    var accumulator = 0;

    function frame(now) {
      if (lastTime === null) lastTime = now;
      var delta = (now - lastTime) / 1000;
      lastTime = now;
      if (delta > 0.25) delta = 0.25;
      accumulator += delta;

      var builtBefore = countBuilt(state.grid);
      var steps = 0;
      while (accumulator >= DT && steps < MAX_STEPS_PER_FRAME) {
        if (touchTarget) {
          state.cx = touchTarget.x;
          state.cy = touchTarget.y;
          var savedAction = input.action;
          input.action = true;
          window.GameLogic.step(state, input, DT);
          input.action = savedAction;
          touchTarget = null;
        } else {
          window.GameLogic.step(state, input, DT);
        }
        accumulator -= DT;
        steps++;
      }

      if (countBuilt(state.grid) > builtBefore) tone(660, 0.12, 'sine');

      if (state.status === 'over' && !wasOver) {
        wasOver = true;
        if (state.score > best) {
          best = state.score;
          saveBest(best);
        }
        tone(140, 0.4, 'sawtooth');
      }
      state.best = best;

      window.GameRender.draw(ctx, state, { width: canvas.width, height: canvas.height });
      window.requestAnimationFrame(frame);
    }

    window.requestAnimationFrame(frame);
  }

  var api = { bootstrap: bootstrap };
  if (typeof module !== 'undefined') module.exports = { bootstrap: bootstrap };
  if (typeof window !== 'undefined') {
    window.GameMain = api;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
      bootstrap();
    }
  }
})();
