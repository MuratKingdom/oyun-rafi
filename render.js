// Sekme Gücü — yalnızca çizim, state değiştirmez
// view: { best, muted, phase: 'ready'|'playing'|'paused'|'over', fx, touch, newBest, canRestart }
//   fx: { particles: [{x,y,life,max,color}], shake: 0..1, squash: 0..1, trail: [{x,y}] }

var W0 = 520;
var H0 = 540;
var FLOOR_Y = 480;
var CEIL_Y = 30;
var BALL_X = 160;
var BALL_R = 12;
var WALL_W = 28;

function overlay(ctx, lines) {
  ctx.fillStyle = 'rgba(5,7,12,0.72)';
  ctx.fillRect(0, 0, W0, H0);
  ctx.textAlign = 'center';
  var y = H0 / 2 - (lines.length - 1) * 16;
  for (var i = 0; i < lines.length; i++) {
    var l = lines[i];
    ctx.fillStyle = l.color || '#e8ecf1';
    ctx.font = l.font || '18px system-ui, sans-serif';
    ctx.fillText(l.text, W0 / 2, y);
    y += l.gap || 32;
  }
  ctx.textAlign = 'left';
}

function starShape(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (var i = 0; i < 10; i++) {
    var ang = -Math.PI / 2 + i * Math.PI / 5;
    var rr = i % 2 === 0 ? r : r * 0.45;
    var px = cx + Math.cos(ang) * rr, py = cy + Math.sin(ang) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function draw(ctx, state, view) {
  view = view || {};
  var fx = view.fx || {};
  var best = view.best || 0;
  var phase = view.phase || state.status;
  // Canvas piksel boyutu main.js'de DPR'ye göre ayarlanır; burada mantıksal 520x540 ile çizilir.
  var scale = ctx.canvas.width / W0;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, W0, H0);

  // Ekran sarsıntısı (≤ 200 ms, zamanlamayı main.js yapar)
  var shake = fx.shake || 0;
  if (shake > 0) {
    var amp = 7 * shake;
    ctx.translate((Math.random() * 2 - 1) * amp, (Math.random() * 2 - 1) * amp);
  }

  ctx.strokeStyle = '#223352';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, CEIL_Y);
  ctx.lineTo(W0, CEIL_Y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, FLOOR_Y);
  ctx.lineTo(W0, FLOOR_Y);
  ctx.stroke();

  for (var i = 0; i < state.obstacles.length; i++) {
    var o = state.obstacles[i];
    // Hareketli kapı mor tonlu, delinen (kalkanla) duvar soluk
    ctx.fillStyle = o.hit ? '#141c2c' : (o.passed ? '#16233b' : (o.move ? '#2b2650' : '#1f3150'));
    ctx.fillRect(o.x, CEIL_Y, WALL_W, o.gapY - CEIL_Y);
    ctx.fillRect(o.x, o.gapY + o.gapH, WALL_W, FLOOR_Y - (o.gapY + o.gapH));
    // Kapı ağzını belirginleştiren ince kenar
    ctx.fillStyle = o.passed ? '#2a3c5c' : (o.move ? '#b39dfa' : '#5ac8fa');
    ctx.fillRect(o.x, o.gapY - 3, WALL_W, 3);
    ctx.fillRect(o.x, o.gapY + o.gapH, WALL_W, 3);
  }

  // Yıldızlar (kapı ortasında; toplanınca kalkan)
  for (var si = 0; si < state.obstacles.length; si++) {
    var so = state.obstacles[si];
    if (!so.star || so.star.taken) continue;
    starShape(ctx, so.x + WALL_W / 2, so.gapY + so.gapH / 2, 9, '#ffd166');
  }

  // İz
  var trail = fx.trail || [];
  for (var t = 0; t < trail.length; t++) {
    var a = (t + 1) / (trail.length + 1);
    ctx.fillStyle = 'rgba(90,200,250,' + (0.25 * a).toFixed(3) + ')';
    ctx.beginPath();
    ctx.arc(trail[t].x, trail[t].y, BALL_R * (0.4 + 0.5 * a), 0, Math.PI * 2);
    ctx.fill();
  }

  // Top — zemine çarpınca kısa basılma
  var sq = fx.squash || 0;
  var sx = 1 + 0.35 * sq;
  var sy = 1 - 0.3 * sq;
  ctx.fillStyle = state.status === 'over' ? '#e05656' : '#5ac8fa';
  ctx.save();
  ctx.translate(BALL_X, state.y + BALL_R * (1 - sy));
  ctx.scale(sx, sy);
  ctx.beginPath();
  ctx.arc(0, 0, BALL_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Kalkan halkası
  if (state.shield > 0 && state.status === 'playing') {
    ctx.strokeStyle = 'rgba(255,209,102,0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(BALL_X, state.y, BALL_R + 6, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Parçacıklar
  var ps = fx.particles || [];
  for (var p = 0; p < ps.length; p++) {
    var q = ps[p];
    ctx.globalAlpha = Math.max(0, q.life / q.max);
    ctx.fillStyle = q.color;
    ctx.fillRect(q.x - 2, q.y - 2, 4, 4);
  }
  ctx.globalAlpha = 1;

  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  ctx.fillStyle = '#e8ecf1';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Kapı: ' + state.score, 14, 24);
  ctx.textAlign = 'center';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = '#9fb3d1';
  var lvCount = view.levelCount || 10;
  var per = view.gatesPerLevel || 8;
  ctx.fillText('Bölüm ' + state.level + '/' + lvCount + '  ·  ' + (state.score % per) + '/' + per, W0 / 2, 23);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#e8ecf1';
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText('Rekor: ' + best, W0 - 14, 24);
  ctx.textAlign = 'left';
  if (state.shield > 0) starShape(ctx, W0 - 24, FLOOR_Y + 24, 8, '#ffd166');

  // Bölüm geçişi yazısı (main.js süreyi tutar)
  if (view.banner && view.banner.a > 0) {
    ctx.globalAlpha = Math.min(1, view.banner.a);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8ecf1';
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.fillText(view.banner.title, W0 / 2, 150);
    if (view.banner.sub) {
      ctx.font = '17px system-ui, sans-serif';
      ctx.fillStyle = '#ffd166';
      ctx.fillText(view.banner.sub, W0 / 2, 182);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  if (view.muted) {
    ctx.fillStyle = '#7c8aa5';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('sessiz', 14, FLOOR_Y + 28);
  }

  var tapWord = view.touch ? 'Dokun' : 'Boşluk / dokun';
  if (phase === 'ready') {
    overlay(ctx, [
      { text: 'Sekme Gücü', font: 'bold 30px system-ui, sans-serif', gap: 40 },
      { text: 'Basılı tut: top yükselir · bırak: düşer' },
      { text: 'Kapıları ıskalama, tavana değme', gap: 44 },
      { text: tapWord + ' ve başla', font: 'bold 20px system-ui, sans-serif', color: '#5ac8fa' }
    ]);
  } else if (phase === 'paused') {
    overlay(ctx, [
      { text: 'Duraklatıldı', font: 'bold 26px system-ui, sans-serif', gap: 40 },
      { text: tapWord + ' ve devam et', color: '#5ac8fa' }
    ]);
  } else if (phase === 'won') {
    overlay(ctx, [
      { text: 'Kazandın!', font: 'bold 32px system-ui, sans-serif', color: '#ffd166', gap: 40 },
      { text: state.overReason },
      { text: 'Kapı: ' + state.score + '   Yıldız: ' + state.stars, gap: 44 },
      view.canRestart
        ? { text: (view.touch ? 'Dokun' : 'Dokun ya da R') + ': yeniden oyna', font: '16px system-ui, sans-serif', color: '#5ac8fa' }
        : { text: ' ', font: '16px system-ui, sans-serif' }
    ]);
  } else if (phase === 'over') {
    var lines = [
      { text: 'Oyun bitti', font: 'bold 28px system-ui, sans-serif', gap: 36 },
      { text: state.overReason },
      { text: 'Bölüm ' + state.level + '’e kadar geldin', font: '16px system-ui, sans-serif', color: '#9fb3d1' }
    ];
    if (view.newBest) lines.push({ text: 'Yeni rekor!', font: 'bold 20px system-ui, sans-serif', color: '#ffd166' });
    lines.push({ text: 'Kapı: ' + state.score + '   Rekor: ' + best, gap: 44 });
    lines.push(view.canRestart
      ? { text: (view.touch ? 'Dokun' : 'Dokun ya da R') + ': yeniden başla', font: '16px system-ui, sans-serif', color: '#5ac8fa' }
      : { text: ' ', font: '16px system-ui, sans-serif' });
    overlay(ctx, lines);
  }
}

if (typeof module !== 'undefined') module.exports = { draw: draw };
if (typeof window !== 'undefined') window.GameRender = { draw: draw };
