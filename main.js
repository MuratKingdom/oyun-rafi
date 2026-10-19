// Komşu Bahçe — döngü, girdi, ses.
(function () {
  'use strict';
  var DT = 1 / 60;
  var MAP = {
    ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right',
    ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down',
    ' ': 'action', Enter: 'action', r: 'restart', R: 'restart'
  };

  function bootstrap() {
    var L = window.GameLogic, R = window.GameRender;
    var canvas = document.getElementById('game');
    var ctx = canvas.getContext('2d');
    var state = L.createState((Date.now() & 0xffffff) || 1);
    var input = { left: false, right: false, up: false, down: false, action: false, restart: false, cell: -1 };
    var latch = {};
    var best = 0, muted = false, audio = null, lastSeq = 0, acc = 0, last = 0;
    try { best = parseInt(window.localStorage.getItem('komsubahce-best'), 10) || 0; } catch (err) { best = 0; }

    function initAudio() {
      if (audio) return;
      try { var AC = window.AudioContext || window.webkitAudioContext; if (AC) audio = new AC(); } catch (err) { audio = null; }
    }
    function tone(f, d, type) {
      if (!audio || muted) return;
      try {
        var o = audio.createOscillator(), g = audio.createGain();
        o.type = type || 'square'; o.frequency.value = f;
        g.gain.value = 0.06;
        o.connect(g); g.connect(audio.destination);
        o.start(); o.stop(audio.currentTime + d);
      } catch (err) { /* sessiz devam */ }
    }
    function saveBest() {
      if (state.score > best) {
        best = state.score;
        try { window.localStorage.setItem('komsubahce-best', String(best)); } catch (err) { /* kayıt yok */ }
      }
    }
    function sfx() {
      if (state.eventSeq === lastSeq) return;
      lastSeq = state.eventSeq;
      if (state.event === 'place') tone(440 + Math.max(0, state.lastGain) * 60, 0.1);
      else if (state.event === 'bad') tone(140, 0.15, 'sawtooth');
      else if (state.event === 'over') { tone(110, 0.3, 'sawtooth'); saveBest(); }
      else if (state.event === 'won') { tone(660, 0.12); tone(880, 0.25); saveBest(); }
    }

    window.addEventListener('keydown', function (e) {
      initAudio();
      if (e.key === 'm' || e.key === 'M') { muted = !muted; return; }
      var k = MAP[e.key];
      if (!k) return;
      if (e.preventDefault) e.preventDefault();
      input[k] = true; latch[k] = true;
    });
    window.addEventListener('keyup', function (e) {
      var k = MAP[e.key];
      if (k) input[k] = false;
    });
    if (canvas.addEventListener) {
      canvas.addEventListener('pointerdown', function (e) {
        initAudio();
        if (state.status !== 'playing') { latch.restart = true; return; }
        var r = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: 480, height: 640 };
        var x = (e.clientX - r.left) * (480 / (r.width || 480)), y = (e.clientY - r.top) * (640 / (r.height || 640));
        var c = R.cellAt(x, y);
        if (c >= 0) latch.cell = c;
      });
    }

    function frame(now) {
      var ms = now || 0;
      acc += Math.min(0.25, Math.max(0, (ms - last) / 1000));
      last = ms;
      var steps = 0, first = true;
      while (acc >= DT && steps < 5) {
        var inp = {
          left: input.left || !!latch.left, right: input.right || !!latch.right,
          up: input.up || !!latch.up, down: input.down || !!latch.down,
          action: input.action || !!latch.action, restart: input.restart || !!latch.restart,
          cell: first && typeof latch.cell === 'number' ? latch.cell : -1
        };
        if (first) latch = {};
        first = false;
        L.step(state, inp, DT);
        acc -= DT; steps++;
      }
      if (steps === 5) acc = 0;
      if (state.score > best && state.status === 'playing') { /* rekor sadece bitişte kaydedilir */ }
      sfx();
      var view = { best: Math.max(best, state.score), muted: muted, quota: L.QUOTA, tileTime: L.TILE_TIME };
      if (state.board[state.cursor] < 0 && state.queue.length) view.preview = L.gainAt(state.board, state.cursor, state.queue[0]);
      R.draw(ctx, state, view);
      window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
    return { getState: function () { return state; } };
  }

  if (typeof window !== 'undefined') {
    window.GameMain = { bootstrap: bootstrap };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap); else bootstrap();
  }
  if (typeof module !== 'undefined') module.exports = { bootstrap: bootstrap };
})();
