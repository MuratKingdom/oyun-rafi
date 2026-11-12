// Kıvılcım Zinciri — çizim (state'i değiştirmez)
var DEPTH_COLORS = ['#ffd166', '#ff9f43', '#ff6b6b', '#e056fd', '#7d5fff', '#48dbfb'];

function draw(ctx, state, view) {
  view = view || {};
  var L = (typeof window !== 'undefined' && window.GameLogic) ? window.GameLogic : require('./logic.js');
  var C = L.C;
  var shake = view.shake || 0;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#0d1020';
  ctx.fillRect(0, 0, C.W, C.H + 40);
  if (shake > 0) ctx.translate((view.jx || 0) * shake, (view.jy || 0) * shake);

  // alan
  ctx.strokeStyle = '#2a2f55';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, C.W - 2, C.H - 2);

  // küreler
  var i;
  for (i = 0; i < state.orbs.length; i++) {
    var o = state.orbs[i];
    ctx.fillStyle = '#9fb4ff';
    ctx.beginPath();
    ctx.arc(o.x, o.y, C.ORB_R, 0, Math.PI * 2);
    ctx.fill();
  }

  // patlamalar
  for (i = 0; i < state.bursts.length; i++) {
    var b = state.bursts[i];
    var r = L.burstRadius(b);
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = DEPTH_COLORS[b.depth % DEPTH_COLORS.length];
    ctx.beginPath();
    ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = DEPTH_COLORS[b.depth % DEPTH_COLORS.length];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // imleç (atış yapılmadıysa)
  if (!state.fired && state.status === 'playing') {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(state.cursor.x, state.cursor.y, C.BURST_R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(state.cursor.x - 6, state.cursor.y); ctx.lineTo(state.cursor.x + 6, state.cursor.y);
    ctx.moveTo(state.cursor.x, state.cursor.y - 6); ctx.lineTo(state.cursor.x, state.cursor.y + 6);
    ctx.stroke();
  }
  ctx.restore();

  // gösterge çubuğu: skor / seviye / zincir / süre / rekor
  ctx.fillStyle = '#151a33';
  ctx.fillRect(0, C.H, C.W, 40);
  ctx.font = '14px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Skor ' + state.score + '   Seviye ' + state.level + '/' + C.LEVELS, 10, C.H + 25);
  ctx.fillStyle = state.caught >= state.quota ? '#7bed9f' : '#ffd166';
  ctx.fillText('Zincir ' + state.caught + '/' + state.quota, 200, C.H + 25);
  if (!state.fired && state.status === 'playing') {
    ctx.fillStyle = state.aimLeft < 3 ? '#ff6b6b' : '#c8d0ff';
    ctx.fillText('Süre ' + Math.max(0, state.aimLeft).toFixed(1), 300, C.H + 25);
  }
  ctx.textAlign = 'right';
  ctx.fillStyle = '#c8d0ff';
  ctx.fillText('Rekor ' + (view.best || 0) + (view.muted ? '  [ses kapalı]' : ''), C.W - 10, C.H + 25);

  // ipucu / bitiş ekranı
  ctx.textAlign = 'center';
  if (state.status === 'playing' && !state.started) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText('Oklar/fare ile nişan al, Boşluk/tık ile kıvılcımı at', C.W / 2, 24);
  }
  if (state.levelPause > 0) {
    ctx.fillStyle = '#7bed9f';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('Seviye ' + state.level, C.W / 2, C.H / 2);
  }
  if (state.status === 'over' || state.status === 'won') {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, C.H / 2 - 60, C.W, 120);
    ctx.font = 'bold 24px system-ui, sans-serif';
    if (state.status === 'over') {
      ctx.fillStyle = '#ff6b6b';
      ctx.fillText(state.overReason, C.W / 2, C.H / 2 - 18);
    } else {
      ctx.fillStyle = '#7bed9f';
      ctx.fillText('Kazandın: 10 seviye tamam', C.W / 2, C.H / 2 - 18);
    }
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Skor ' + state.score + ' — R, Boşluk veya tık: yeniden', C.W / 2, C.H / 2 + 20);
  }
}

if (typeof module !== 'undefined') module.exports = { draw };
if (typeof window !== 'undefined') window.GameRender = { draw };
