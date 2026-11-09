'use strict';
// Bant Hatti — sadece cizim.
(function () {
  var CELL = 64, OY = 56, CW = 576, CH = 56 + 448 + 28;
  var COL = ['#ef4444', '#3b82f6'];
  var DIRV = [[1, 0], [0, 1], [-1, 0], [0, -1]];

  function arrow(ctx, cx, cy, d, color) {
    var v = DIRV[d], px = -v[1], py = v[0];
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx + v[0] * 20, cy + v[1] * 20);
    ctx.lineTo(cx - v[0] * 14 + px * 16, cy - v[1] * 14 + py * 16);
    ctx.lineTo(cx - v[0] * 14 - px * 16, cy - v[1] * 14 - py * 16);
    ctx.closePath();
    ctx.fill();
  }

  function draw(ctx, s, view) {
    view = view || {};
    var W = s.w, H = s.h, x, y, k, i, t = 0;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CW, CH);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Teslim ' + s.score + '/' + s.win, 12, 24);
    ctx.fillText('Kayıp ' + s.misses + '/' + s.missMax, 190, 24);
    ctx.fillText('Parça ' + (s.maxT - s.used), 340, 24);
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Rekor ' + (view.best || 0), 480, 24);
    ctx.fillStyle = s.flash > 0 ? '#fca5a5' : '#cbd5e1';
    ctx.fillText(s.grace > 0 ? 'Hazırlık: ' + Math.ceil(s.grace) + ' sn (Enter: başlat)' : (s.msg || s.lastMiss || 'Kırmızı parça kırmızı kutuya, mavi parça mavi kutuya'), 12, 46);
    for (y = 0; y < H; y++) {
      for (x = 0; x < W; x++) {
        k = s.grid[y * W + x];
        ctx.fillStyle = (x + y) % 2 ? '#1e293b' : '#172033';
        ctx.fillRect(x * CELL, OY + y * CELL, CELL, CELL);
        var cx = x * CELL + CELL / 2, cy = OY + y * CELL + CELL / 2;
        if (k >= 1 && k <= 4) { ctx.fillStyle = '#334155'; ctx.fillRect(x * CELL + 6, OY + y * CELL + 6, CELL - 12, CELL - 12); arrow(ctx, cx, cy, k - 1, '#e2e8f0'); }
        else if (k === 5) {
          ctx.fillStyle = '#334155'; ctx.fillRect(x * CELL + 6, OY + y * CELL + 6, CELL - 12, CELL - 12);
          ctx.fillStyle = COL[0]; ctx.beginPath(); ctx.arc(cx, cy, 20, Math.PI, 2 * Math.PI); ctx.fill();
          ctx.fillStyle = COL[1]; ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI); ctx.fill();
        }
        else if (k === 9) { ctx.fillStyle = '#475569'; ctx.fillRect(x * CELL + 10, OY + y * CELL + 10, CELL - 20, CELL - 20); }
        else if (k === 10) { ctx.fillStyle = '#16a34a'; ctx.fillRect(x * CELL + 4, OY + y * CELL + 4, CELL - 8, CELL - 8); arrow(ctx, cx, cy, 0, '#052e16'); }
        else if (k === 11 || k === 12) { ctx.fillStyle = COL[k - 11]; ctx.fillRect(x * CELL + 4, OY + y * CELL + 4, CELL - 8, CELL - 8); ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 3; ctx.strokeRect(x * CELL + 8, OY + y * CELL + 8, CELL - 16, CELL - 16); }
      }
    }
    var iv = 0.6;
    if (view.interval) iv = view.interval;
    t = s.grace > 0 ? 1 : Math.min(1, s.acc / iv);
    for (i = 0; i < s.items.length; i++) {
      var it = s.items[i];
      var ix = it.px + (it.x - it.px) * t, iy = it.py + (it.y - it.py) * t;
      ctx.fillStyle = COL[it.c];
      ctx.beginPath(); ctx.arc(ix * CELL + CELL / 2, OY + iy * CELL + CELL / 2, 13, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3;
    ctx.strokeRect(s.cx * CELL + 2, OY + s.cy * CELL + 2, CELL - 4, CELL - 4);
    ctx.fillStyle = '#94a3b8'; ctx.font = '13px system-ui, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Ok tuşları: imleç · Boşluk/tık: parça döndür · Enter: başlat · R: yeniden · M: ses', 8, CH - 8);
    if (s.status !== 'playing') {
      ctx.fillStyle = 'rgba(2,6,23,0.8)'; ctx.fillRect(0, OY, CW, H * CELL);
      ctx.textAlign = 'center'; ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 34px system-ui, sans-serif';
      ctx.fillText(s.status === 'won' ? 'Hat tamamlandı' : 'Oyun bitti', CW / 2, OY + 150);
      ctx.font = '18px system-ui, sans-serif';
      ctx.fillText(s.status === 'won' ? s.win + ' parça doğru kutuya ulaştı' : s.overReason, CW / 2, OY + 190);
      ctx.fillText('Teslim: ' + s.score + ' · Rekor: ' + (view.best || 0), CW / 2, OY + 224);
      ctx.fillText('R / Boşluk / tık: yeniden başla', CW / 2, OY + 258);
      ctx.textAlign = 'left';
    }
  }

  if (typeof module !== 'undefined') module.exports = { draw: draw };
  if (typeof window !== 'undefined') window.GameRender = { draw: draw };
})();
