// Yercekimi Tuneli - sadece cizim, state degistirmez

(function () {
  var VIEW_W = 480;
  var VIEW_H = 270;
  var WALL_T = 10;
  var BALL_R = 8;
  var BALL_X = 90;
  var OBSTACLE_W = 22;

  function draw(ctx, state, view) {
    var scale = view && view.scale ? view.scale : 1;
    ctx.save();
    ctx.scale(scale, scale);

    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    ctx.fillStyle = state.gravityDir > 0 ? '#1a2b4a' : '#3a1a2b';
    ctx.fillRect(0, 0, VIEW_W, WALL_T);
    ctx.fillRect(0, VIEW_H - WALL_T, VIEW_W, WALL_T);

    ctx.fillStyle = '#f0a500';
    for (var i = 0; i < state.obstacles.length; i++) {
      var o = state.obstacles[i];
      var sx = o.x - state.worldX + BALL_X;
      if (sx < -OBSTACLE_W || sx > VIEW_W + OBSTACLE_W) continue;
      var top = o.gapY - o.gapH / 2;
      var bottom = o.gapY + o.gapH / 2;
      ctx.fillRect(sx - OBSTACLE_W / 2, WALL_T, OBSTACLE_W, top - WALL_T);
      ctx.fillRect(sx - OBSTACLE_W / 2, bottom, OBSTACLE_W, VIEW_H - WALL_T - bottom);
    }

    ctx.beginPath();
    ctx.fillStyle = state.gravityDir > 0 ? '#4fc3f7' : '#f76d8e';
    ctx.arc(BALL_X, state.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e8ecf1';
    ctx.font = '14px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Mesafe: ' + state.score, 10, 24);
    ctx.textAlign = 'right';
    ctx.fillText('Rekor: ' + state.best, VIEW_W - 10, 24);

    if (state.status === 'playing' && state.score < 3) {
      ctx.textAlign = 'center';
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillStyle = '#9fb0c9';
      ctx.fillText('Tuşa bas / dokun: yerçekimini ters çevir', VIEW_W / 2, VIEW_H - 20);
    }

    if (state.status === 'over') {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.fillText('Kaybettin', VIEW_W / 2, VIEW_H / 2 - 26);
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText(state.overReason, VIEW_W / 2, VIEW_H / 2 - 4);
      ctx.fillText('Mesafe: ' + state.score + '  Rekor: ' + state.best, VIEW_W / 2, VIEW_H / 2 + 18);
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillStyle = '#9fb0c9';
      ctx.fillText('Yeniden başlamak için R veya tıkla', VIEW_W / 2, VIEW_H / 2 + 42);
    }

    ctx.restore();
  }

  if (typeof module !== 'undefined') {
    module.exports = { draw: draw };
  }
  if (typeof window !== 'undefined') {
    window.GameRender = { draw: draw };
  }
})();
