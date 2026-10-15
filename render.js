'use strict';
// Sarkaç Atlayışı — yalnızca çizim.
function draw(ctx, s, view) {
  view = view || {};
  var sh = view.shake || 0;
  ctx.save();
  ctx.clearRect(0, 0, 800, 500);
  ctx.fillStyle = '#10151f';
  ctx.fillRect(0, 0, 800, 500);
  if (sh > 0) ctx.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);
  // boşluk
  ctx.fillStyle = '#1a0f14';
  ctx.fillRect(0, 470, 800, 30);
  // platform
  var p = s.plat;
  if (p) {
    ctx.fillStyle = '#4ac27a';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#8af0b0';
    ctx.fillRect(p.x + p.w * 0.35, p.y, p.w * 0.3, 3);
  }
  // iplik ve mil
  ctx.strokeStyle = '#8b94a8';
  ctx.lineWidth = 2;
  if (s.mode === 'swing') {
    ctx.beginPath();
    ctx.moveTo(200, 90);
    ctx.lineTo(s.ball.x, s.ball.y);
    ctx.stroke();
  }
  ctx.fillStyle = '#c9d1e3';
  ctx.beginPath();
  ctx.arc(200, 90, 6, 0, Math.PI * 2);
  ctx.fill();
  // parçacıklar
  var ps = view.particles || [];
  for (var i = 0; i < ps.length; i++) {
    ctx.globalAlpha = Math.max(0, ps[i].life * 2);
    ctx.fillStyle = ps[i].color;
    ctx.fillRect(ps[i].x, ps[i].y, 3, 3);
  }
  ctx.globalAlpha = 1;
  // top
  ctx.fillStyle = s.status === 'over' ? '#e5484d' : '#f5b942';
  ctx.beginPath();
  ctx.arc(s.ball.x, s.ball.y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // HUD
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillStyle = '#e6eaf2';
  ctx.textAlign = 'left';
  ctx.fillText('Skor: ' + s.score, 16, 30);
  ctx.fillText('En yüksek: ' + (view.best || 0), 16, 56);
  ctx.textAlign = 'right';
  ctx.fillText(view.muted ? 'Ses kapalı (M)' : 'Ses açık (M)', 784, 30);
  if (s.status === 'playing') {
    var f = Math.max(0, s.timeLeft) / 8;
    ctx.fillStyle = f < 0.3 ? '#e5484d' : '#3b82f6';
    ctx.fillRect(300, 14, 200 * f, 8);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#8b94a8';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(view.started ? 'Boşluk / tık: bırak' : 'Başlamak için bir tuşa bas — sonra boşlukla bırak', 400, 490);
  } else {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 180, 800, 140);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff7b80';
    ctx.font = '32px system-ui, sans-serif';
    ctx.fillText(s.overReason, 400, 240);
    ctx.fillStyle = '#e6eaf2';
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText('Skor ' + s.score + ' — R / boşluk / tık: yeniden başla', 400, 285);
  }
}
if (typeof module !== 'undefined') module.exports = { draw: draw };
if (typeof window !== 'undefined') window.GameRender = { draw: draw };
