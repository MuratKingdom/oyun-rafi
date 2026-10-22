(function () {
  var DT = 1 / 60;
  var current = null;

  function bootstrap() {
    var canvas = document.getElementById('game');
    var ctx = canvas.getContext('2d');
    var input = { action: false, restart: false };
    var held = false, pending = false;
    var best = 0, muted = false, audio = null, shake = 0;
    try { best = +(localStorage.getItem('yigindenge_best') || 0) || 0; } catch (e) { best = 0; }

    function newSeed() { return (Date.now() & 0x7fffffff) || 1; }
    var state = GameLogic.createState(newSeed());
    current = state;

    function initAudio() {
      if (audio) return;
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) audio = new AC();
      } catch (e) { audio = null; }
    }
    function tone(f, d, type, v) {
      if (!audio || muted) return;
      try {
        var o = audio.createOscillator(), g = audio.createGain();
        o.type = type || 'square';
        o.frequency.value = f;
        g.gain.value = v || 0.06;
        o.connect(g);
        g.connect(audio.destination);
        o.start();
        g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + d);
        o.stop(audio.currentTime + d);
      } catch (e) { }
    }
    function sound(ev) {
      if (ev === 'drop') tone(320, 0.06, 'square');
      else if (ev === 'land') { tone(160, 0.1, 'triangle', 0.1); shake = 0.08; }
      else if (ev === 'perfect') { tone(660, 0.12, 'sine', 0.1); tone(880, 0.16, 'sine', 0.08); }
      else if (ev === 'over') { tone(90, 0.35, 'sawtooth', 0.1); shake = 0.2; }
    }

    function restart() {
      state = GameLogic.createState(newSeed());
      current = state;
      held = false;
      pending = false;
    }
    function press() {
      initAudio();
      if (state.status === 'over') {
        if (state.overT > 0.3) restart();
        return;
      }
      pending = true;
    }

    window.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === ' ' || k === 'ArrowUp' || k === 'Enter') {
        e.preventDefault();
        if (!held) press();
        held = true;
      } else if (k === 'r' || k === 'R') {
        initAudio();
        restart();
      } else if (k === 'm' || k === 'M') {
        muted = !muted;
      }
    });
    window.addEventListener('keyup', function (e) {
      var k = e.key;
      if (k === ' ' || k === 'ArrowUp' || k === 'Enter') held = false;
    });
    canvas.addEventListener('pointerdown', function (e) {
      if (e && e.preventDefault) e.preventDefault();
      press();
    });

    var last = null, acc = 0;
    function frame(ts) {
      if (last === null) last = ts;
      acc += Math.min(0.25, (ts - last) / 1000);
      last = ts;
      var n = 0;
      while (acc >= DT && n < 5) {
        input.action = held || pending;
        pending = false;
        GameLogic.step(state, input, DT);
        for (var i = 0; i < state.events.length; i++) sound(state.events[i]);
        if (state.status === 'over' && state.score > best) {
          best = state.score;
          try { localStorage.setItem('yigindenge_best', String(best)); } catch (e) { }
        }
        acc -= DT;
        n++;
      }
      if (n === 5) acc = 0;
      if (shake > 0) shake = Math.max(0, shake - (n || 1) * DT);
      GameRender.draw(ctx, state, { best: best, muted: muted, shake: shake });
      window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }

  function getState() { return current; }
  function setState(s) { current = s; }

  if (typeof module !== 'undefined') module.exports = { bootstrap: bootstrap, getState: getState };
  if (typeof window !== 'undefined') {
    window.GameMain = { bootstrap: bootstrap, getState: getState };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
    else bootstrap();
  }
})();
