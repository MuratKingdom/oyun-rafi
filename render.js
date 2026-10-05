'use strict';
// Sadece cizim: state'i degistirmez.
const GameRenderApi = (function () {
  function draw(ctx, s, view) {
    const w = view.w, h = view.h;
    const TR = 900, PAD = 30, sx = (w - PAD * 2) / TR;
    const X = function (u) { return PAD + u * sx; };
    const ty = h * 0.62, th = 46;
    ctx.fillStyle = s.flash > 0 ? '#3a3350' : '#1b1f2a';
    ctx.fillRect(0, 0, w, h);
    // pist
    ctx.fillStyle = '#4a5063';
    ctx.fillRect(X(0), ty, TR * sx, th);
    for (let i = 0; i < s.patches.length; i++) {
      const p = s.patches[i];
      ctx.fillStyle = p.k < 1 ? '#8fd3f0' : '#c9a66b';
      ctx.fillRect(X(p.x0), ty, (p.x1 - p.x0) * sx, th);
    }
    // hedef bolge
    ctx.fillStyle = 'rgba(80,220,120,0.55)';
    ctx.fillRect(X(s.tx), ty - 10, s.tw * sx, th + 20);
    ctx.fillStyle = '#e8ffee';
    ctx.fillRect(X(s.tx + s.tw / 2) - 1, ty - 14, 2, th + 28);
    // baslangic cizgisi
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(X(30) - 1, ty - 4, 2, th + 8);
    // tas
    ctx.fillStyle = s.status === 'over' ? '#d44' : '#ffd24a';
    ctx.beginPath();
    ctx.arc(X(s.x), ty - 11, 11, 0, Math.PI * 2);
    ctx.fill();
    // guc cubugu
    ctx.fillStyle = '#2c3242';
    ctx.fillRect(PAD, 24, 220, 16);
    ctx.fillStyle = '#ff7a45';
    ctx.fillRect(PAD, 24, 220 * s.power, 16);
    // metinler
    ctx.fillStyle = '#e8e8f0';
    ctx.font = '16px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Skor ' + s.score + '   Seviye ' + (Math.min(s.level + 1, 12)) + '/12   Rekor ' + view.best, PAD, 64);
    ctx.textAlign = 'right';
    ctx.fillText(view.muted ? 'Ses kapalı (M)' : 'Ses açık (M)', w - PAD, 38);
    ctx.textAlign = 'center';
    if (s.status === 'over') {
      ctx.font = '28px system-ui, sans-serif';
      ctx.fillStyle = '#ff8a8a';
      ctx.fillText(s.overReason, w / 2, h * 0.3);
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillStyle = '#e8e8f0';
      ctx.fillText('Yeniden başlamak için R / boşluk / tıkla', w / 2, h * 0.3 + 28);
    } else if (s.status === 'won') {
      ctx.font = '28px system-ui, sans-serif';
      ctx.fillStyle = '#9dffb0';
      ctx.fillText('12 hedefi tuttun', w / 2, h * 0.3);
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillStyle = '#e8e8f0';
      ctx.fillText('Yeniden başlamak için R / boşluk / tıkla', w / 2, h * 0.3 + 28);
    }
  }
  return { draw: draw };
})();
if (typeof module !== 'undefined') module.exports = { draw: GameRenderApi.draw };
if (typeof window !== 'undefined') window.GameRender = { draw: GameRenderApi.draw };
