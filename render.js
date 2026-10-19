// Komşu Bahçe — yalnızca çizim.
(function () {
  'use strict';
  var GX = 40, GY = 160, CS = 80, N = 5;
  var COL = ['#58b368', '#4a90d9', '#e8b93c'];
  var NAMES = ['Tarla', 'Kuyu', 'Kovan'];

  function cellAt(x, y) {
    var cx = Math.floor((x - GX) / CS), cy = Math.floor((y - GY) / CS);
    if (cx < 0 || cy < 0 || cx >= N || cy >= N) return -1;
    return cy * N + cx;
  }

  function tile(ctx, type, cx, cy, r) {
    ctx.fillStyle = COL[type];
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 2;
    if (type === 0) {
      ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      ctx.beginPath();
      for (var i = -1; i <= 1; i++) { ctx.moveTo(cx - r, cy + i * r * 0.5); ctx.lineTo(cx + r, cy + i * r * 0.5); }
      ctx.stroke();
    } else if (type === 1) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.beginPath();
      for (var k = 0; k < 6; k++) {
        var a = Math.PI / 6 + k * Math.PI / 3;
        var px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }

  function draw(ctx, s, view) {
    view = view || {};
    ctx.fillStyle = '#1b2430';
    ctx.fillRect(0, 0, 480, 640);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e8eef5';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('Komşu Bahçe', 40, 30);
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Puan: ' + s.score, 40, 58);
    var nextQ = 5 * (Math.floor(s.placed / 5) + 1);
    var q = s.placed >= 25 ? 60 : (view.quota ? view.quota[nextQ] : nextQ);
    ctx.fillText('Yerleşim: ' + s.placed + '/25   Kota (' + nextQ + '.): ' + q, 40, 82);
    ctx.fillText('Rekor: ' + (view.best || 0), 40, 106);

    // sıradaki parçalar
    ctx.textAlign = 'right';
    ctx.fillText('Sıradaki:', 330, 62);
    for (var i = 0; i < 3; i++) {
      var qt = s.queue[i];
      if (qt === undefined) continue;
      tile(ctx, qt, 360 + i * 44, 56, i === 0 ? 17 : 12);
    }
    ctx.textAlign = 'left';
    if (s.queue[0] !== undefined) ctx.fillText(NAMES[s.queue[0]], 345, 92);

    // süre çubuğu
    var frac = Math.max(0, Math.min(1, s.tileTimer / (view.tileTime || 12)));
    ctx.fillStyle = '#33404f';
    ctx.fillRect(40, 124, 400, 10);
    ctx.fillStyle = frac < 0.3 ? '#e0584f' : '#8fd0a0';
    ctx.fillRect(40, 124, 400 * frac, 10);

    // ızgara
    for (var c = 0; c < 25; c++) {
      var x = GX + (c % N) * CS, y = GY + Math.floor(c / N) * CS;
      ctx.fillStyle = (c % 2) ? '#26323f' : '#2b3846';
      ctx.fillRect(x, y, CS, CS);
      if (s.board[c] >= 0) tile(ctx, s.board[c], x + CS / 2, y + CS / 2, 28);
    }
    // imleç + gölge önizleme
    var cx = GX + (s.cursor % N) * CS, cy = GY + Math.floor(s.cursor / N) * CS;
    if (s.status === 'playing' && s.board[s.cursor] < 0 && s.queue[0] !== undefined) {
      ctx.globalAlpha = 0.45;
      tile(ctx, s.queue[0], cx + CS / 2, cy + CS / 2, 28);
      ctx.globalAlpha = 1;
      if (view.preview !== undefined) {
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.font = 'bold 14px system-ui, sans-serif';
        ctx.fillText((view.preview >= 0 ? '+' : '') + view.preview, cx + CS / 2, cy + CS - 6);
      }
    }
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.strokeRect(cx + 2, cy + 2, CS - 4, CS - 4);

    // yerleştirme geri bildirimi
    if (s.flash > 0 && s.lastIdx >= 0) {
      var fx = GX + (s.lastIdx % N) * CS, fy = GY + Math.floor(s.lastIdx / N) * CS;
      ctx.globalAlpha = Math.min(1, s.flash * 3);
      ctx.fillStyle = s.lastGain > 0 ? '#9be3a8' : '#e0584f';
      ctx.fillRect(fx, fy, CS, CS);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText(s.msg || ((s.lastGain >= 0 ? '+' : '') + s.lastGain), fx + CS / 2, fy + CS / 2 - 20 * (0.35 - s.flash) / 0.35);
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#aab6c4';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('Komşu başına: Tarla+Kuyu +4 · Tarla+Kovan +3 · Kuyu+Kovan -2 · aynı tür -1', 240, 580);
    ctx.fillText('Her yerleşim +1 taban puan' + (view.muted ? '   (ses kapalı)' : ''), 240, 600);

    if (s.status !== 'playing') {
      ctx.fillStyle = 'rgba(10,14,20,0.82)';
      ctx.fillRect(40, 250, 400, 170);
      ctx.fillStyle = s.status === 'won' ? '#9be3a8' : '#ff8a80';
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.fillText(s.status === 'won' ? 'Bahçe tamam!' : 'Bitti', 240, 292);
      ctx.fillStyle = '#e8eef5';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText(s.status === 'won' ? ('Tüm kareler doldu. Puan: ' + s.score) : s.overReason, 240, 326);
      ctx.fillText('Puan: ' + s.score + '   Rekor: ' + (view.best || 0), 240, 356);
      ctx.fillText('Yeniden başlamak için R / boşluk / tıkla', 240, 394);
    }
  }

  var api = { draw: draw, cellAt: cellAt };
  if (typeof module !== 'undefined') module.exports = api;
  if (typeof window !== 'undefined') window.GameRender = api;
})();
