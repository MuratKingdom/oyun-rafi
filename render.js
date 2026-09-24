// Sekme Gücü — yalnızca çizim, state değiştirmez

function draw(ctx, state, view) {
  var W = ctx.canvas.width;
  var H = ctx.canvas.height;
  var FLOOR_Y = 480;
  var CEIL_Y = 30;
  var BALL_X = 160;
  var BALL_R = 12;
  var WALL_W = 28;

  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = '#223';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, CEIL_Y);
  ctx.lineTo(W, CEIL_Y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, FLOOR_Y);
  ctx.lineTo(W, FLOOR_Y);
  ctx.stroke();

  ctx.fillStyle = '#1b2740';
  for (var i = 0; i < state.obstacles.length; i++) {
    var o = state.obstacles[i];
    ctx.fillRect(o.x, CEIL_Y, WALL_W, o.gapY - CEIL_Y);
    ctx.fillRect(o.x, o.gapY + o.gapH, WALL_W, FLOOR_Y - (o.gapY + o.gapH));
  }

  ctx.fillStyle = state.status === 'over' ? '#e05656' : '#5ac8fa';
  ctx.beginPath();
  ctx.arc(BALL_X, state.y, BALL_R, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#e8ecf1';
  ctx.font = '20px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Kapı: ' + state.score, 14, 28);
  ctx.textAlign = 'right';
  var best = (view && view.best) || 0;
  ctx.fillText('Rekor: ' + best, W - 14, 28);
  ctx.textAlign = 'left';

  if (view && view.muted) {
    ctx.fillStyle = '#7c8aa5';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('sessiz', 14, 50);
  }

  if (state.status === 'over') {
    ctx.fillStyle = 'rgba(5,7,12,0.72)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e8ecf1';
    ctx.textAlign = 'center';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText('Oyun bitti', W / 2, H / 2 - 30);
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText(state.overReason, W / 2, H / 2);
    ctx.fillText('Kapı: ' + state.score + '  Rekor: ' + best, W / 2, H / 2 + 30);
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = '#7c8aa5';
    ctx.fillText('R ile yeniden başla', W / 2, H / 2 + 60);
    ctx.textAlign = 'left';
  }
}

if (typeof module !== 'undefined') module.exports = { draw: draw };
if (typeof window !== 'undefined') window.GameRender = { draw: draw };
