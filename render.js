(function () {
  var H = 640, GROUND = 600;

  function color(i) { return 'hsl(' + ((i * 37 + 190) % 360) + ',55%,52%)'; }

  function block(ctx, b, y, i, camY) {
    var sy = GROUND - (y - camY) - 22;
    ctx.fillStyle = color(i);
    ctx.fillRect(b.x - b.w / 2, sy, b.w, 22);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(b.x - b.w / 2, sy, b.w, 4);
  }

  function draw(ctx, state, view) {
    view = view || {};
    var n = state.stack.length;
    var camY = Math.max(0, n * 22 - 260);
    var sh = view.shake > 0 ? Math.sin(view.shake * 90) * 6 * Math.min(1, view.shake / 0.2) : 0;
    ctx.save();
    ctx.translate(sh, 0);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-10, 0, 500, H);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-10, GROUND, 500, H - GROUND);

    var tilt = state.status === 'over' && state.failIdx >= 0 ? Math.min(1, state.overT / 0.4) * 0.6 * state.topple : 0;
    for (var i = 0; i < n; i++) {
      var b = state.stack[i];
      if (state.failIdx >= 0 && i >= state.failIdx) {
        var pv = state.stack[state.failIdx - 1];
        var px = state.topple < 0 ? pv.x - pv.w / 2 : pv.x + pv.w / 2;
        var py = GROUND - (state.failIdx * 22 - camY);
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(tilt);
        ctx.translate(-px, -py);
        block(ctx, b, i * 22, i, camY);
        ctx.restore();
      } else {
        block(ctx, b, i * 22, i, camY);
      }
    }
    if (state.cur && !(state.status === 'over' && state.failIdx >= 0)) {
      block(ctx, state.cur, state.cur.y, n, camY);
      if (state.phase === 'swing' && state.status === 'playing') {
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(state.cur.x - 1, 0, 2, GROUND);
      }
    }
    ctx.restore();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Skor ' + state.score, 14, 36);
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('Rekor ' + (view.best || 0) + (view.muted ? '  (ses kapalı)' : ''), 14, 58);
    var m = Math.max(0, Math.min(1, state.margin / 40));
    ctx.textAlign = 'right';
    ctx.fillText('Denge payı', 466, 24);
    ctx.fillStyle = '#334155';
    ctx.fillRect(366, 32, 100, 10);
    ctx.fillStyle = m > 0.4 ? '#4ade80' : (m > 0.15 ? '#facc15' : '#f87171');
    ctx.fillRect(366, 32, 100 * m, 10);

    ctx.textAlign = 'center';
    if (state.status === 'over') {
      ctx.fillStyle = 'rgba(15,23,42,0.72)';
      ctx.fillRect(40, 220, 400, 150);
      ctx.fillStyle = '#fca5a5';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.fillText(state.overReason, 240, 262);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillText('Skor ' + state.score + '  ·  R / boşluk / tıkla: yeniden', 240, 300);
    } else if (state.score === 0 && state.phase === 'swing') {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillText('Boşluk / tık: bloğu bırak — ağırlık merkezini dayanakta tut', 240, 96);
    }
  }

  if (typeof module !== 'undefined') module.exports = { draw: draw };
  if (typeof window !== 'undefined') window.GameRender = { draw: draw };
})();
