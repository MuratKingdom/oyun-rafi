'use strict';
// Sadece çizim: state'i değiştirmez.
function draw(ctx, s, view) {
  var W = 900, H = 400, GY = 340;
  var best = (view && view.best) || 0;
  var muted = view && view.muted;
  var shake = 0;
  if (s.status === 'over' && s.overTime < 0.2) shake = (0.2 - s.overTime) * 30;
  ctx.save();
  if (shake) ctx.translate((Math.sin(s.overTime * 200)) * shake, 0);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-20, 0, W + 40, H);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-20, GY, W + 40, H - GY);

  // hedef
  var t = s.target;
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(t.x, GY - 6, t.w, 10);
  ctx.fillStyle = '#bbf7d0';
  ctx.fillRect(t.x + t.w / 2 - 1, GY - 10, 2, 14);

  // duvar
  if (s.wall) {
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(s.wall.x, GY - s.wall.h, s.wall.w, s.wall.h);
  }

  // top izi
  ctx.fillStyle = 'rgba(250,204,21,0.45)';
  for (var i = 0; i < s.trail.length; i += 6) {
    ctx.fillRect(s.trail[i][0] - 1, GY - s.trail[i][1] - 1, 3, 3);
  }

  // top ve top
  if (s.ball) {
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(s.ball.x, GY - s.ball.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // top (namlu)
  var a = s.angle * Math.PI / 180;
  ctx.save();
  ctx.translate(60, GY - 8);
  ctx.rotate(-a);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, -5, 36, 10);
  ctx.restore();
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.arc(60, GY - 8, 13, 0, Math.PI * 2);
  ctx.fill();

  // kısa yörünge önizlemesi (ilk 0.2 sn, rüzgârsız)
  if (s.phase === 'aim' && s.status === 'playing') {
    ctx.fillStyle = 'rgba(226,232,240,0.6)';
    for (var k = 1; k <= 4; k++) {
      var tt = k * 0.05;
      var px = 60 + s.power * Math.cos(a) * tt;
      var py = 8 + s.power * Math.sin(a) * tt - 200 * tt * tt;
      ctx.fillRect(px - 1.5, GY - py - 1.5, 3, 3);
    }
  }

  // yazılar
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Skor ' + s.score, 14, 26);
  ctx.fillText('Seviye ' + Math.min(s.level, 10) + '/10', 14, 50);
  ctx.textAlign = 'right';
  ctx.fillText('Rekor ' + best, W - 14, 26);
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(muted ? 'ses kapalı (M)' : 'ses açık (M)', W - 14, 46);
  ctx.textAlign = 'left';
  ctx.fillText('Açı ' + Math.round(s.angle) + '°   Güç ' + Math.round(s.power), 14, GY + 30);
  var wd = s.wind === 0 ? 'rüzgâr yok' : 'rüzgâr ' + (s.wind > 0 ? '→ ' : '← ') + Math.abs(s.wind);
  ctx.fillText(wd, 14, GY + 52);
  ctx.textAlign = 'center';
  if (s.phase === 'result' && s.status === 'playing') {
    ctx.fillStyle = '#86efac';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText('İsabet! +' + s.lastPoints, W / 2, 120);
  }
  if (s.phase === 'aim' && s.status === 'playing' && s.cleared === 0 && s.time < 8) {
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Tek atış hakkın var: açıyı ve gücü ayarla, Boşluk ile ateşle', W / 2, 120);
  }
  if (s.status === 'over') {
    ctx.fillStyle = 'rgba(2,6,23,0.7)';
    ctx.fillRect(0, 130, W, 110);
    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.fillText(s.overReason, W / 2, 172);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Skor ' + s.score + ' — R, Boşluk veya dokunuş: yeniden', W / 2, 205);
  } else if (s.status === 'won') {
    ctx.fillStyle = 'rgba(2,6,23,0.7)';
    ctx.fillRect(0, 130, W, 110);
    ctx.fillStyle = '#86efac';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.fillText('On hedefi de vurdun', W / 2, 172);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Skor ' + s.score + ' — R, Boşluk veya dokunuş: yeniden', W / 2, 205);
  }
  ctx.restore();
}

if (typeof module !== 'undefined') module.exports = { draw: draw };
if (typeof window !== 'undefined') window.GameRender = { draw: draw };
