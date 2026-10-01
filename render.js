(function () {
  var W = 640, H = 400, COLS = 3, PW = 170, PH = 110, GX = 20, X0 = 55, Y0 = 120;
  function rect(i) {
    var c = i % COLS, r = Math.floor(i / COLS);
    return { x: X0 + c * (PW + GX), y: Y0 + r * (PH + GX), w: PW, h: PH };
  }
  function plotAt(x, y) {
    for (var i = 0; i < 6; i++) {
      var r = rect(i);
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
    }
    return -1;
  }
  function txt(ctx, s, x, y, size, col, align) {
    ctx.font = size + 'px system-ui, sans-serif'; ctx.fillStyle = col; ctx.textAlign = align || 'left';
    ctx.fillText(s, x, y);
  }
  function draw(ctx, state, view) {
    view = view || {};
    var flash = view.flash || {};
    ctx.save();
    if (view.shake > 0) ctx.translate((Math.sin(view.shake * 90)) * 4, 0);
    ctx.fillStyle = '#10200f'; ctx.fillRect(0, 0, W, H);
    var night = state.dayT / state.dayLen;
    ctx.fillStyle = 'rgba(10,20,50,' + (0.45 * night * night).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H);
    txt(ctx, 'Gün ' + state.day + ' / ' + state.winDay, 20, 32, 22, '#e8f3d0');
    txt(ctx, 'Tahıl: ' + state.grain, 20, 60, 20, '#ffd45e');
    txt(ctx, 'Akşam yemeği: ' + state.need, 20, 84, 16, state.grain >= state.need ? '#b7d98b' : '#ff8a7a');
    txt(ctx, 'Rekor: ' + (view.best || 0) + ' gün', W - 20, 32, 16, '#9fb88a', 'right');
    txt(ctx, 'Skor: ' + state.score + ' gün', W - 20, 56, 16, '#e8f3d0', 'right');
    ctx.fillStyle = '#243a1f'; ctx.fillRect(20, 98, W - 40, 8);
    ctx.fillStyle = '#e0b84a'; ctx.fillRect(20, 98, (W - 40) * night, 8);
    for (var i = 0; i < state.plots.length; i++) {
      var p = state.plots[i], r = rect(i);
      ctx.fillStyle = p.s === 0 ? '#4a3524' : p.s === 1 ? '#5a4a22' : '#7a6a1c';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      if (flash[i] > 0) { ctx.fillStyle = 'rgba(255,255,255,' + Math.min(0.5, flash[i] * 2) + ')'; ctx.fillRect(r.x, r.y, r.w, r.h); }
      ctx.strokeStyle = p.s === 2 ? '#ffe36b' : '#2a1d12'; ctx.lineWidth = p.s === 2 ? 4 : 2;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      txt(ctx, String(i + 1), r.x + 8, r.y + 20, 16, '#e8d9b0');
      var cx = r.x + r.w / 2, cy = r.y + r.h / 2 + 8;
      if (p.s === 1) {
        var g = p.t / state.grow, h = 6 + g * 36;
        ctx.fillStyle = '#6fbf4a'; ctx.fillRect(cx - 3, cy + 20 - h, 6, h);
        ctx.fillStyle = '#244a1a'; ctx.fillRect(r.x + 10, r.y + r.h - 14, r.w - 20, 6);
        ctx.fillStyle = '#9be36a'; ctx.fillRect(r.x + 10, r.y + r.h - 14, (r.w - 20) * g, 6);
        txt(ctx, 'büyüyor', cx, r.y + r.h - 22, 12, '#cfe6b0', 'center');
      } else if (p.s === 2) {
        ctx.fillStyle = '#f0c93a'; ctx.fillRect(cx - 4, cy - 22, 8, 42);
        ctx.beginPath(); ctx.arc(cx, cy - 26, 11, 0, 6.2832); ctx.fill();
        var left = 1 - p.t / state.spoil;
        ctx.fillStyle = '#5a2a1a'; ctx.fillRect(r.x + 10, r.y + r.h - 14, r.w - 20, 6);
        ctx.fillStyle = '#ff9a4a'; ctx.fillRect(r.x + 10, r.y + r.h - 14, (r.w - 20) * left, 6);
        txt(ctx, 'HASAT: +' + p.y, cx, r.y + r.h - 22, 13, '#fff1b0', 'center');
      } else {
        txt(ctx, 'boş — 1 tahıl ek', cx, cy + 4, 13, '#b89a78', 'center');
      }
    }
    txt(ctx, '1-6 veya tıkla: ek / hasat · R: yeniden · M: ses', W / 2, H - 12, 13, '#8fa87a', 'center');
    if (state.status !== 'playing') {
      ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 130, W, 140);
      var won = state.status === 'won';
      txt(ctx, won ? 'Hasat bereketli: ' + state.winDay + ' gün dayandın' : 'Oyun bitti', W / 2, 180, 28, won ? '#b6f08a' : '#ff8a7a', 'center');
      if (!won) txt(ctx, state.overReason, W / 2, 214, 16, '#f0e6d0', 'center');
      txt(ctx, 'R / boşluk / tıkla: yeniden başla', W / 2, 250, 15, '#cfd8c0', 'center');
    }
    ctx.restore();
  }
  if (typeof module !== 'undefined') module.exports = { draw: draw, plotAt: plotAt };
  if (typeof window !== 'undefined') window.GameRender = { draw: draw, plotAt: plotAt };
})();
