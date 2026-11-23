'use strict';
// Ambar Hesabı — yalnızca çizim. state'i değiştirmez.

var SEASON_COL = ['#7fbf6a', '#e2c044', '#c9803a', '#9fb4c8'];

function slotRect(i) {
  var col = i % 5, row = Math.floor(i / 5);
  return { x: 32 + col * 86, y: 170 + row * 128, w: 72, h: 112 };
}

function bar(ctx, x, y, w, h, frac, col, back) {
  ctx.fillStyle = back || '#232a38'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col; ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
}

function draw(ctx, s, view) {
  view = view || {};
  var C = view.C, L = view.L;
  var W = C.W, H = C.H;
  var sh = view.shake || { x: 0, y: 0 };
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#141821'; ctx.fillRect(0, 0, W, H);
  ctx.translate(sh.x, sh.y);

  var cap = L.capacity(s), net = L.netRate(s);
  var sc = SEASON_COL[s.season];

  // Üst bilgi
  ctx.font = 'bold 18px system-ui, sans-serif'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.fillStyle = '#e8ecf3';
  ctx.fillText('Yıl ' + s.year + '/' + C.YEARS + ' · ' + C.SEASONS[s.season], 16, 12);
  ctx.textAlign = 'right';
  ctx.fillText('Skor ' + s.score + '  Rekor ' + (view.best || 0), W - 16, 12);
  ctx.textAlign = 'left';
  bar(ctx, 16, 38, W - 32, 6, s.seasonT / C.SEASON_T, sc);

  // Tahıl / kapasite
  var full = cap > 0 ? s.grain / cap : 0;
  var spillOn = view.spillFlash > 0;
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillStyle = spillOn ? '#ff6b6b' : (s.grain < 12 ? '#ff9f43' : '#f2d16b');
  ctx.fillText('Tahıl ' + Math.floor(s.grain) + ' / ' + cap, 16, 54);
  ctx.font = '16px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = net >= 0 ? '#7fd17f' : '#ff7b7b';
  ctx.fillText((net >= 0 ? '+' : '') + net.toFixed(1) + '/sn', W - 16, 62);
  ctx.textAlign = 'left';
  bar(ctx, 16, 88, W - 32, 14, full, spillOn ? '#ff6b6b' : '#f2d16b');

  ctx.font = '14px system-ui, sans-serif'; ctx.fillStyle = '#9aa4b8';
  ctx.fillText('Hasat bu yıl %' + Math.round(s.factor * 100) + ' · gelecek yıl %' + Math.round(s.nextFactor * 100) +
    ' · tüketim ' + L.eatRate(s).toFixed(2) + '/sn · taşan ' + Math.floor(s.wasted), 16, 112);
  ctx.fillText('Ambar: ' + C.SILO_COST + ' tahıl, +' + C.SILO_CAP + ' yer, bakım ' + C.UPKEEP + '/sn', 16, 130);

  // Ambarlar
  for (var i = 0; i < C.MAX_SILO; i++) {
    var r = slotRect(i);
    if (i < s.silos) {
      ctx.fillStyle = '#3a3226'; ctx.fillRect(r.x, r.y, r.w, r.h);
      var fh = (r.h - 20) * full;
      ctx.fillStyle = spillOn ? '#ff8a6b' : '#e8c35a';
      ctx.fillRect(r.x + 6, r.y + r.h - 6 - fh, r.w - 12, fh);
      ctx.strokeStyle = '#b08a52'; ctx.lineWidth = 3; ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.beginPath(); ctx.moveTo(r.x - 4, r.y); ctx.lineTo(r.x + r.w / 2, r.y - 16); ctx.lineTo(r.x + r.w + 4, r.y); ctx.closePath();
      ctx.fillStyle = '#8c3b2e'; ctx.fill();
    } else {
      ctx.strokeStyle = '#2f3746'; ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]); ctx.strokeRect(r.x, r.y, r.w, r.h); ctx.setLineDash([]);
      if (i === s.silos) {
        ctx.fillStyle = s.grain >= C.SILO_COST ? '#7fd17f' : '#55607a';
        ctx.font = 'bold 28px system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('+', r.x + r.w / 2, r.y + r.h / 2 - 16);
        ctx.textAlign = 'left';
      }
    }
  }

  // Tarla şeridi
  ctx.fillStyle = sc; ctx.globalAlpha = 0.35; ctx.fillRect(0, H - 40, W, 40); ctx.globalAlpha = 1;
  ctx.fillStyle = '#e8ecf3'; ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('Gelir ' + L.incomeRate(s).toFixed(1) + '/sn' + (s.season === 3 ? ' (kışın hasat yok)' : '') + (view.muted ? ' · ses kapalı' : ''), 16, H - 28);

  // Uyarı / ret mesajı
  if (view.msg && view.msgT > 0) {
    ctx.textAlign = 'center'; ctx.font = 'bold 16px system-ui, sans-serif'; ctx.fillStyle = '#ff9f43';
    ctx.fillText(view.msg, W / 2, H - 64); ctx.textAlign = 'left';
  }

  // Parçacıklar
  var ps = view.particles || [];
  for (var p = 0; p < ps.length; p++) {
    ctx.globalAlpha = Math.max(0, ps[p].life / ps[p].max); ctx.fillStyle = ps[p].color;
    ctx.fillRect(ps[p].x - 2, ps[p].y - 2, 4, 4);
  }
  ctx.globalAlpha = 1;

  // Bitiş ekranı
  if (s.status === 'over' || s.status === 'won') {
    ctx.fillStyle = 'rgba(10,12,18,0.82)'; ctx.fillRect(0, 170, W, 170);
    ctx.textAlign = 'center';
    ctx.fillStyle = s.status === 'won' ? '#7fd17f' : '#ff6b6b';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText(s.status === 'won' ? C.YEARS + ' yıl dayandın!' : 'Köy aç kaldı', W / 2, 190);
    ctx.fillStyle = '#e8ecf3'; ctx.font = '15px system-ui, sans-serif';
    ctx.fillText(s.status === 'won' ? 'Kalan tahıl skora eklendi.' : s.overReason, W / 2, 230);
    ctx.fillText('Skor ' + s.score + ' · Rekor ' + (view.best || 0) + ' · taşan ' + Math.floor(s.wasted), W / 2, 260);
    ctx.fillStyle = '#f2d16b'; ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText('R / Boşluk / tıkla: yeniden başla', W / 2, 300);
    ctx.textAlign = 'left';
  }
  ctx.restore();
}

var GameRenderExports = { draw: draw, slotRect: slotRect };
if (typeof module !== 'undefined') module.exports = GameRenderExports;
if (typeof window !== 'undefined') window.GameRender = GameRenderExports;
