// Kanca Tırmanışı — yalnızca çizim
'use strict';

function draw(ctx, s, view) {
  const W = 360, H = 640;
  const L = (typeof window !== 'undefined' && window.GameLogic) || view.logic;
  const cam = s.camY;
  const shake = view.shake || 0;
  ctx.save();
  if (shake > 0) ctx.translate((view.jx || 0) * shake, (view.jy || 0) * shake);

  // arka plan: yükseldikçe koyulaşan gök
  const t = Math.min(1, s.maxH / 10000);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgb(' + Math.round(40 - 30 * t) + ',' + Math.round(60 - 40 * t) + ',' + Math.round(110 - 50 * t) + ')');
  g.addColorStop(1, 'rgb(' + Math.round(90 - 50 * t) + ',' + Math.round(120 - 70 * t) + ',' + Math.round(160 - 60 * t) + ')');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // yükseklik çizgileri (her 50 m)
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = '10px system-ui, sans-serif';
  const step = 500;
  for (let y = Math.floor(cam / step) * step; y < cam + H; y += step) {
    if (y > 0) continue;
    const sy = y - cam;
    ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy); ctx.stroke();
    ctx.fillText((-y / 10) + ' m', 4, sy - 3);
  }

  // başlangıç zemini
  if (-cam < H + 20) {
    ctx.fillStyle = '#3d4a3a';
    ctx.fillRect(0, -cam, W, H);
  }

  // menzil halkası (yalnızca kanca boşken)
  if (s.status === 'playing' && s.hook < 0) {
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath(); ctx.arc(s.px, s.py - cam, 240, Math.PI, 2 * Math.PI); ctx.stroke();
  }

  // hedef önizlemesi
  let target = -1;
  if (s.status === 'playing' && s.hook < 0 && L && L.pickTarget) target = L.pickTarget(s, view.input || {});

  // çapalar
  for (let i = 0; i < s.anchors.length; i++) {
    const a = s.anchors[i];
    if (a.broken) continue;
    const sy = a.y - cam;
    if (sy < -20 || sy > H + 20) continue;
    const wear = Math.min(1, a.wear / 1.1);
    ctx.fillStyle = 'rgb(' + Math.round(220 + 35 * wear) + ',' + Math.round(200 - 150 * wear) + ',' + Math.round(120 - 80 * wear) + ')';
    ctx.beginPath(); ctx.arc(a.x, sy, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(a.x, sy, 7, 0, Math.PI * 2); ctx.stroke();
    if (i === target) {
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(a.x, sy, 12, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.lineWidth = 1;
  }

  // ip
  if (s.hook >= 0) {
    const a = s.anchors[s.hook];
    ctx.strokeStyle = '#f2e6c9'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(s.px, s.py - cam); ctx.lineTo(a.x, a.y - cam); ctx.stroke();
    ctx.lineWidth = 1;
  }

  // oyuncu
  ctx.fillStyle = s.status === 'over' ? '#888' : '#ff7a3c';
  ctx.beginPath(); ctx.arc(s.px, s.py - cam, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(s.px + 3, s.py - cam - 2, 2.5, 0, Math.PI * 2); ctx.fill();

  // parçacıklar
  const parts = view.particles || [];
  for (const p of parts) {
    ctx.fillStyle = 'rgba(255,220,150,' + Math.max(0, p.life / p.max).toFixed(2) + ')';
    ctx.fillRect(p.x - 2, p.y - cam - 2, 4, 4);
  }

  // sis
  const fy = s.fogY - cam;
  if (fy < H) {
    const fg = ctx.createLinearGradient(0, fy - 40, 0, fy + 40);
    fg.addColorStop(0, 'rgba(200,190,230,0)');
    fg.addColorStop(1, 'rgba(200,190,230,0.95)');
    ctx.fillStyle = fg;
    ctx.fillRect(0, fy - 40, W, 80);
    ctx.fillStyle = 'rgba(200,190,230,0.95)';
    ctx.fillRect(0, fy + 40, W, H);
  }
  ctx.restore();

  // HUD: skor/ilerleme
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, W, 28);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Yükseklik: ' + s.score + ' / 1000 m', 8, 19);
  ctx.textAlign = 'right';
  ctx.fillText('Rekor: ' + (view.best || 0) + ' m' + (view.muted ? '  (ses kapalı)' : ''), W - 8, 19);
  ctx.textAlign = 'center';
  ctx.font = '13px system-ui, sans-serif';
  if (!s.started && s.status === 'playing') {
    ctx.fillStyle = '#fff';
    ctx.fillText('Boşluk: kancayı at, basılı tut: çek, bırak: fırla', W / 2, H / 2 + 40);
  }

  if (s.status === 'over' || s.status === 'won') {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, H / 2 - 70, W, 140);
    ctx.fillStyle = s.status === 'won' ? '#9f9' : '#fbb';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(s.status === 'won' ? 'Zirveye ulaştın!' : s.overReason, W / 2, H / 2 - 25);
    ctx.fillStyle = '#fff';
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText('Yükseklik: ' + s.score + ' m   Rekor: ' + (view.best || 0) + ' m', W / 2, H / 2 + 8);
    ctx.fillText('R / Boşluk / tıklama: yeniden başla', W / 2, H / 2 + 38);
  }
  ctx.textAlign = 'left';
}

if (typeof module !== 'undefined') module.exports = { draw };
if (typeof window !== 'undefined') window.GameRender = { draw };
