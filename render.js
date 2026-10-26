'use strict';
(function () {
  var W = 640, H = 400;
  var ZX = { wood: 110, food: 530 }, HOME = 320, GY = 300;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function bar(ctx, x, y, w, label, val, cap, need, color) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, y, w, 16);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * Math.min(1, val / cap), 16);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x + w * Math.min(1, need / cap) - 1, y - 3, 2, 22);
    ctx.font = '13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label + ' ' + Math.floor(val) + ' / gece ' + Math.ceil(need), x, y - 6);
  }

  function draw(ctx, s, view) {
    var L = view.logic;
    var night = s.phase === 'night';
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, night ? '#0b1026' : '#7dd3fc');
    g.addColorStop(1, night ? '#1e1b4b' : '#e0f2fe');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = night ? '#14532d' : '#4ade80';
    ctx.fillRect(0, GY + 20, W, H - GY - 20);

    // orman
    ctx.fillStyle = s.target === 'wood' ? 'rgba(250,204,21,0.25)' : 'rgba(0,0,0,0)';
    ctx.fillRect(ZX.wood - 90, GY - 90, 180, 130);
    for (var i = 0; i < 3; i++) {
      ctx.fillStyle = '#713f12';
      ctx.fillRect(ZX.wood - 60 + i * 55, GY - 20, 10, 40);
      ctx.fillStyle = night ? '#166534' : '#15803d';
      ctx.beginPath(); ctx.arc(ZX.wood - 55 + i * 55, GY - 35, 26, 0, 6.283); ctx.fill();
    }
    // tarla
    ctx.fillStyle = s.target === 'food' ? 'rgba(250,204,21,0.25)' : 'rgba(0,0,0,0)';
    ctx.fillRect(ZX.food - 90, GY - 90, 180, 130);
    for (var j = 0; j < 5; j++) {
      ctx.fillStyle = night ? '#a16207' : '#facc15';
      ctx.fillRect(ZX.food - 70 + j * 32, GY - 10, 8, 30);
      ctx.fillRect(ZX.food - 74 + j * 32, GY - 16, 16, 8);
    }

    // ateş
    var frac = Math.min(1, s.wood / 30);
    var fh = 14 + 40 * frac * (night ? 1 : 0.5);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(HOME - 22, GY + 12, 44, 8);
    ctx.fillStyle = '#f97316';
    ctx.beginPath(); ctx.moveTo(HOME - 16, GY + 12); ctx.lineTo(HOME, GY + 12 - fh); ctx.lineTo(HOME + 16, GY + 12); ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.beginPath(); ctx.moveTo(HOME - 8, GY + 12); ctx.lineTo(HOME, GY + 12 - fh * 0.6); ctx.lineTo(HOME + 8, GY + 12); ctx.fill();

    // toplayıcı
    var px = HOME - 40;
    if (!night) {
      px = s.travel > 0 ? lerp(ZX[s.at], ZX[s.target], 1 - s.travel / L.C.TRAVEL) : ZX[s.at];
    }
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath(); ctx.arc(px, GY + 4, 11, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px - 5, GY, 3, 3); ctx.fillRect(px + 2, GY, 3, 3);

    // göstergeler
    var need = L.nightWood(s.night, s.severity), nf = L.nightFood(s.night);
    bar(ctx, 20, 30, 260, 'Odun', s.wood, L.C.CAP, need, '#b45309');
    bar(ctx, 360, 30, 260, 'Yiyecek', s.food, L.C.CAP, nf, '#ca8a04');
    ctx.fillStyle = night ? '#e2e8f0' : '#0f172a';
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px system-ui, sans-serif';
    var total = night ? L.C.NIGHT : L.C.DAY;
    ctx.fillText((night ? 'Gece ' : 'Gündüz ') + s.night + '/' + L.C.WIN + ' — ' + Math.ceil(total - s.t) + ' sn', W / 2, 78);
    ctx.font = '13px system-ui, sans-serif';
    var sevTxt = s.severity > 1.2 ? 'çok soğuk' : (s.severity > 1.1 ? 'soğuk' : 'ılık');
    ctx.fillText('Bu gece: ' + sevTxt + ' (odun x' + s.severity.toFixed(2) + ')', W / 2, 98);
    ctx.textAlign = 'left';
    ctx.fillText('Skor ' + s.score + '   Rekor ' + (view.best || 0) + (view.muted ? '   [ses kapalı]' : ''), 20, H - 14);

    if (s.status !== 'playing') {
      ctx.fillStyle = 'rgba(2,6,23,0.8)';
      ctx.fillRect(0, 130, W, 130);
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.fillText(s.status === 'won' ? 'Sekiz geceyi atlattın' : s.overReason, W / 2, 185);
      ctx.font = '15px system-ui, sans-serif';
      ctx.fillText('Skor ' + s.score + ' — yeniden başlamak için R / Boşluk / tıkla', W / 2, 225);
    }
  }

  var api = { draw: draw };
  if (typeof module !== 'undefined') module.exports = api;
  if (typeof window !== 'undefined') window.GameRender = api;
})();
