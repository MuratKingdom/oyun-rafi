'use strict';
// Halka Dışı — yalnızca çizim. State değiştirmez.
var COLORS = {
  bg: '#141821', ring: '#2a3346', ringEdge: '#e0564f', floor: '#1d2433',
  player: '#4fb3ff', light: '#f2c14e', normal: '#f08a4b', heavy: '#c4527a', text: '#e8ecf3', dim: '#8a94a8'
};

function disc(ctx, x, y, r, color, alpha) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
}

function draw(ctx, s, view) {
  view = view || {};
  var C = view.C, W = C.W, H = C.H;
  var sh = view.shake || { x: 0, y: 0 };
  ctx.save();
  ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, W, H);
  ctx.translate(sh.x, sh.y);

  // halka
  ctx.fillStyle = COLORS.floor;
  ctx.beginPath(); ctx.arc(C.CX, C.CY, C.R, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = COLORS.ring; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(C.CX, C.CY, C.R * 0.5, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = COLORS.ringEdge; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(C.CX, C.CY, C.R, 0, Math.PI * 2); ctx.stroke();

  // düşenler (küçülerek kaybolur)
  for (var f = 0; f < s.falling.length; f++) {
    var fb = s.falling[f], k = 1 - fb.t / C.FALL_T;
    disc(ctx, fb.x, fb.y, Math.max(1, fb.r * k), fb.kind === 'player' ? COLORS.player : COLORS[fb.kind], Math.max(0, k));
  }

  // rakipler
  for (var i = 0; i < s.enemies.length; i++) {
    var e = s.enemies[i];
    var a = e.spawn > 0 ? 0.3 + 0.3 * Math.abs(Math.sin(e.spawn * 12)) : 1;
    disc(ctx, e.x, e.y, e.r, COLORS[e.kind], a);
    if (e.stun > 0) {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 4, 0, Math.PI * 2 * (e.stun / 0.6)); ctx.stroke();
    }
  }

  // oyuncu
  var p = s.player;
  if (s.status === 'playing' || s.status === 'won') {
    disc(ctx, p.x, p.y, p.r, p.dashT > 0 ? '#bfe6ff' : COLORS.player, 1);
    ctx.strokeStyle = p.dashCd === 0 ? '#bfe6ff' : 'rgba(191,230,255,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - p.dashCd / C.DASH_CD)); ctx.stroke();
  }

  // parçacıklar (main'den)
  var parts = view.particles || [];
  for (var q = 0; q < parts.length; q++) {
    var pt = parts[q];
    ctx.globalAlpha = Math.max(0, pt.life / pt.max);
    ctx.fillStyle = pt.color; ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // gösterge: skor, dalga, rekor
  ctx.fillStyle = COLORS.text; ctx.font = 'bold 18px system-ui, sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Skor: ' + s.score, 12, 26);
  ctx.textAlign = 'center';
  ctx.fillText('Dalga ' + s.wave + '/' + C.WIN_WAVE, W / 2, 26);
  ctx.textAlign = 'right'; ctx.fillStyle = COLORS.dim;
  ctx.fillText('Rekor: ' + (view.best || 0) + (view.muted ? ' (ses kapalı)' : ''), W - 12, 26);

  if (s.status === 'playing' && s.clearT >= 0) {
    ctx.textAlign = 'center'; ctx.fillStyle = COLORS.text; ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('Dalga temizlendi!', W / 2, C.CY);
  }
  if (s.status === 'over' || s.status === 'won') {
    ctx.fillStyle = 'rgba(10,12,18,' + (0.7 * Math.min(1, s.dieT / C.DIE_T + 0.3)) + ')';
    ctx.fillRect(0, H / 2 - 60, W, 120);
    ctx.textAlign = 'center';
    ctx.fillStyle = s.status === 'won' ? '#7ee08a' : COLORS.ringEdge;
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText(s.status === 'won' ? 'Kazandın! 8 dalga temizlendi' : s.overReason, W / 2, H / 2 - 18);
    ctx.fillStyle = COLORS.text; ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Skor ' + s.score + ' · Yeniden: R / Boşluk / tıkla', W / 2, H / 2 + 22);
  }
}

if (typeof module !== 'undefined') module.exports = { draw };
if (typeof window !== 'undefined') window.GameRender = { draw };
