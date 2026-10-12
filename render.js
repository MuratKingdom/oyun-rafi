'use strict';
// Çark Vardiyası: yalnızca çizim.
var LAYOUT = { x0: 60, y0: 120, cw: 120, ch: 100, gap: 10, cols: 4 };

function cellRect(i) {
  var c = i % LAYOUT.cols, r = Math.floor(i / LAYOUT.cols);
  return { x: LAYOUT.x0 + c * (LAYOUT.cw + LAYOUT.gap), y: LAYOUT.y0 + r * (LAYOUT.ch + LAYOUT.gap), w: LAYOUT.cw, h: LAYOUT.ch };
}

function cellAt(x, y) {
  for (var i = 0; i < 12; i++) {
    var q = cellRect(i);
    if (x >= q.x && x < q.x + q.w && y >= q.y && y < q.y + q.h) return i;
  }
  return -1;
}

function draw(ctx, state, view) {
  var W = 640, H = 480;
  var shake = view && view.shake ? view.shake : 0;
  ctx.fillStyle = '#161a22';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 8, (Math.random() - 0.5) * shake * 8);
  for (var i = 0; i < state.machines.length; i++) {
    var m = state.machines[i], q = cellRect(i);
    var d = m.dur / 100;
    ctx.fillStyle = m.dur <= 0 ? '#3a1f22' : '#232a36';
    ctx.fillRect(q.x, q.y, q.w, q.h);
    var cx = q.x + q.w / 2, cy = q.y + 40;
    ctx.strokeStyle = m.dur <= 0 ? '#7a3b40' : (d < 0.35 ? '#e0a040' : '#6fc3a0');
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.stroke();
    var a0 = state.time * 3 * d;
    for (var t = 0; t < 8; t++) {
      var a = a0 + t * Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 20, cy + Math.sin(a) * 20);
      ctx.lineTo(cx + Math.cos(a) * 27, cy + Math.sin(a) * 27);
      ctx.stroke();
    }
    ctx.fillStyle = '#0d0f14';
    ctx.fillRect(q.x + 10, q.y + 80, q.w - 20, 8);
    ctx.fillStyle = d < 0.35 ? '#e0a040' : '#6fc3a0';
    ctx.fillRect(q.x + 10, q.y + 80, (q.w - 20) * d, 8);
    if (i === state.cursor) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(q.x - 2, q.y - 2, q.w + 4, q.h + 4);
    }
  }
  ctx.restore();
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillStyle = '#e8ecf1';
  ctx.textAlign = 'left';
  ctx.fillText('Skor: ' + state.score, 60, 40);
  ctx.fillText('Kasa: ' + Math.floor(state.coins), 200, 40);
  ctx.fillText('Kalan: ' + Math.max(0, Math.ceil(120 - state.time)) + ' sn', 330, 40);
  ctx.fillText('Rekor: ' + (view && view.best ? view.best : 0), 480, 40);
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = '#8ea0b8';
  ctx.fillText('Çarkları sağlam tut: 3\'ten az çark kalırsa vardiya biter. Onarım parayla.', 60, 80);
  if (state.status !== 'playing') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = '28px system-ui, sans-serif';
    ctx.fillText(state.status === 'won' ? 'Vardiya bitti, kazandın' : 'Vardiya bitti', W / 2, 210);
    ctx.font = '18px system-ui, sans-serif';
    if (state.status === 'over') ctx.fillText(state.overReason, W / 2, 250);
    ctx.fillText('Skor: ' + state.score + '  ·  R veya boşluk: yeniden başla', W / 2, 290);
  }
}

var GameRender = { draw: draw, cellAt: cellAt };
if (typeof module !== 'undefined') module.exports = GameRender;
if (typeof window !== 'undefined') window.GameRender = GameRender;
