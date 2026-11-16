// Set Adası — yalnızca çizim
'use strict';
var HUD = 72, CELL = 48;

function landColor(h) {
  if (h >= 7) { var g = Math.min(200, 120 + (h - 7) * 10); return 'rgb(' + g + ',' + g + ',' + (g + 8) + ')'; }
  var pal = ['#d9c58f', '#c9c078', '#9fbf63', '#7fae4e', '#6a9a3f', '#8a7f52', '#9a8a66'];
  return pal[Math.max(0, Math.min(6, h))];
}

function draw(ctx, s, view) {
  view = view || {};
  var L = view.logic, N = L.C.N, W = N * CELL, H = HUD + N * CELL;
  var t = view.now || 0;
  ctx.save();
  if (view.shake > 0) ctx.translate((Math.sin(t * 90) * 4) * view.shake, (Math.cos(t * 70) * 3) * view.shake);
  ctx.fillStyle = '#123049';
  ctx.fillRect(-10, -10, W + 20, H + 20);

  var next = L.floodSet(s, s.level + 1);
  for (var y = 0; y < N; y++) {
    for (var x = 0; x < N; x++) {
      var k = L.idx(x, y), px = x * CELL, py = HUD + y * CELL;
      if (s.flooded[k]) {
        var w = 0.5 + 0.5 * Math.sin(t * 2 + x * 0.7 + y * 0.5);
        ctx.fillStyle = 'rgb(' + Math.round(30 + 20 * w) + ',' + Math.round(90 + 30 * w) + ',' + Math.round(150 + 30 * w) + ')';
        ctx.fillRect(px, py, CELL, CELL);
        continue;
      }
      ctx.fillStyle = landColor(s.h[k]);
      ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
      if (next[k]) { // bir sonraki gelgitte batacak
        ctx.fillStyle = 'rgba(220,40,40,' + (0.45 + 0.15 * Math.sin(t * 6)) + ')';
        ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
        ctx.strokeStyle = '#ff3b3b'; ctx.lineWidth = 2;
        ctx.strokeRect(px + 3, py + 3, CELL - 6, CELL - 6);
      }
      if (x === s.village.x && y === s.village.y) {
        ctx.fillStyle = '#b5523b';
        ctx.beginPath(); ctx.moveTo(px + 10, py + 24); ctx.lineTo(px + 24, py + 10); ctx.lineTo(px + 38, py + 24); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#efe2c4'; ctx.fillRect(px + 14, py + 24, 20, 16);
        ctx.fillStyle = '#5a3a2a'; ctx.fillRect(px + 21, py + 30, 6, 10);
      } else {
        ctx.fillStyle = s.h[k] >= 7 ? '#2b2b33' : 'rgba(30,30,20,0.75)';
        ctx.font = 'bold 16px system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(s.h[k]), px + CELL / 2, py + CELL / 2);
      }
    }
  }
  // geri bildirim parıltıları
  var fx = view.fx || [];
  for (var i = 0; i < fx.length; i++) {
    var f = fx[i], a = Math.max(0, f.life / 0.2);
    ctx.strokeStyle = f.t === 'deny' ? 'rgba(255,80,80,' + a + ')' : 'rgba(255,255,255,' + a + ')';
    ctx.lineWidth = 3;
    var g = (1 - a) * 8;
    ctx.strokeRect(f.x * CELL - g + 2, HUD + f.y * CELL - g + 2, CELL - 4 + 2 * g, CELL - 4 + 2 * g);
  }
  // imleç
  ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 3;
  ctx.strokeRect(s.cx * CELL + 2, HUD + s.cy * CELL + 2, CELL - 4, CELL - 4);

  // HUD
  ctx.fillStyle = '#0b1e2e'; ctx.fillRect(0, 0, W, HUD);
  ctx.fillStyle = '#e8f0f6'; ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText('Kum: ' + Math.floor(s.sand), 12, 26);
  ctx.fillText('Deniz: ' + s.level, 120, 26);
  ctx.fillText('Gelgit: ' + s.tide + '/' + L.C.TIDES_TO_WIN, 230, 26);
  ctx.fillText('Skor: ' + s.score, 370, 26);
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = '#9fb7c9';
  ctx.fillText('Kuru kare: ' + L.dryCount(s) + '   Rekor: ' + (view.best || 0) + (view.muted ? '   [ses kapalı]' : ''), 12, 48);
  var frac = Math.max(0, Math.min(1, s.tideTimer / L.C.TIDE_T));
  ctx.fillStyle = '#24425a'; ctx.fillRect(12, 56, W - 24, 8);
  ctx.fillStyle = frac < 0.3 ? '#e0554a' : '#4aa3e0'; ctx.fillRect(12, 56, (W - 24) * (1 - frac), 8);

  if (s.status === 'over' || s.status === 'won') {
    ctx.fillStyle = 'rgba(5,15,25,0.78)'; ctx.fillRect(0, HUD + 150, W, 170);
    ctx.textAlign = 'center';
    ctx.fillStyle = s.status === 'won' ? '#9be37a' : '#ff8a7a';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText(s.status === 'won' ? 'Ada ayakta: 12 gelgit atlatıldı' : s.overReason, W / 2, HUD + 200);
    ctx.fillStyle = '#e8f0f6'; ctx.font = '18px system-ui, sans-serif';
    ctx.fillText('Skor: ' + s.score + '   Rekor: ' + (view.best || 0), W / 2, HUD + 240);
    ctx.fillText('R / Boşluk / tıklama: yeniden başla', W / 2, HUD + 280);
  }
  ctx.restore();
}

if (typeof module !== 'undefined') module.exports = { draw: draw, HUD: HUD, CELL: CELL };
if (typeof window !== 'undefined') window.GameRender = { draw: draw, HUD: HUD, CELL: CELL };
