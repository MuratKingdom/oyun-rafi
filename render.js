// Sekme Gücü — yalnızca çizim, state değiştirmez
// view: { best, muted, phase: 'ready'|'playing'|'paused'|'over'|'won', fx, touch, newBest, canRestart,
//         theme: {deco, c:{...}}, skin: {shape, color}, coins, earned }  (theme/skin: shop.js kataloğu)
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

var DEFAULT_THEME = { deco: 'dots', c: { bg: '#0b1220', line: '#223352', wall: '#1f3150', wallPassed: '#16233b', wallMove: '#2b2650', edge: '#5ac8fa', edgeMove: '#b39dfa', deco: 'rgba(200,220,255,0.35)' } };
var DEFAULT_SKIN = { shape: 'circle', color: '#5ac8fa' };

// Top şekli (0,0 merkezli). Mağaza önizlemesi de bunu kullanır.
function drawBall(ctx, shape, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  if (shape === 'square') {
    ctx.rect(-r * 0.9, -r * 0.9, r * 1.8, r * 1.8);
  } else if (shape === 'diamond') {
    ctx.moveTo(0, -r * 1.15); ctx.lineTo(r * 1.0, 0); ctx.lineTo(0, r * 1.15); ctx.lineTo(-r * 1.0, 0);
    ctx.closePath();
  } else if (shape === 'star') {
    for (var i = 0; i < 10; i++) {
      var ang = -Math.PI / 2 + i * Math.PI / 5;
      var rr = i % 2 === 0 ? r * 1.25 : r * 0.6;
      if (i === 0) ctx.moveTo(Math.cos(ang) * rr, Math.sin(ang) * rr); else ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
    }
    ctx.closePath();
  } else {
    ctx.arc(0, 0, r, 0, Math.PI * 2);
  }
  ctx.fill();
  if (shape === 'ring') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.save();
    ctx.scale(1, 0.35);
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// Arka plan süsü: kaymalı (paralaks) ama deterministik; dist = katedilen yol.
function drawDeco(ctx, theme, dist) {
  var col = theme.c.deco;
  var d = dist || 0;
  ctx.fillStyle = col;
  ctx.strokeStyle = col;
  var i, x;
  if (theme.deco === 'sun') {
    // Ufukta yarım güneş + soluk çizgiler; oyun alanında engel gibi görünmesin
    ctx.beginPath();
    ctx.arc(400, FLOOR_Y, 60, Math.PI, Math.PI * 2);
    ctx.fill();
    for (i = 0; i < 3; i++) ctx.fillRect(0, FLOOR_Y - 14 - i * 16, W0, 1);
  } else if (theme.deco === 'trees') {
    for (i = 0; i < 9; i++) {
      x = ((i * 83 - d * 0.25) % (W0 + 80) + W0 + 80) % (W0 + 80) - 40;
      var h = 60 + (i * 37) % 70;
      ctx.beginPath();
      ctx.moveTo(x, FLOOR_Y); ctx.lineTo(x + 26, FLOOR_Y - h); ctx.lineTo(x + 52, FLOOR_Y);
      ctx.closePath();
      ctx.fill();
    }
  } else if (theme.deco === 'grid') {
    ctx.lineWidth = 1;
    var off = (d * 0.5) % 40;
    for (x = -off; x < W0; x += 40) { ctx.beginPath(); ctx.moveTo(x, CEIL_Y); ctx.lineTo(x, FLOOR_Y); ctx.stroke(); }
    for (var y = CEIL_Y; y < FLOOR_Y; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W0, y); ctx.stroke(); }
  } else if (theme.deco === 'flakes') {
    for (i = 0; i < 26; i++) {
      x = ((i * 61 - d * 0.15) % W0 + W0) % W0;
      var fy = CEIL_Y + 10 + ((i * 97) % (FLOOR_Y - CEIL_Y - 20));
      ctx.fillRect(x - 1.5, fy - 1.5, 3, 3);
    }
  } else {
    for (i = 0; i < 30; i++) {
      x = ((i * 53 - d * 0.1) % W0 + W0) % W0;
      ctx.fillRect(x, CEIL_Y + 8 + ((i * 71) % (FLOOR_Y - CEIL_Y - 16)), 2, 2);
    }
  }
}

function draw(ctx, state, view) {
  view = view || {};
  var fx = view.fx || {};
  var best = view.best || 0;
  var phase = view.phase || state.status;
  // Canvas piksel boyutu main.js'de DPR'ye göre ayarlanır; burada mantıksal 520x540 ile çizilir.
  var scale = ctx.canvas.width / W0;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  var theme = view.theme || DEFAULT_THEME;
  var tc = theme.c;
  var skin = view.skin || DEFAULT_SKIN;
  var textCol = tc.text || '#e8ecf1';
  var textDim = tc.textDim || '#9fb3d1';
  ctx.fillStyle = tc.bg;
  ctx.fillRect(0, 0, W0, H0);
  drawDeco(ctx, theme, state.distance);

  // Ekran sarsıntısı (≤ 200 ms, zamanlamayı main.js yapar)
  var shake = fx.shake || 0;
  if (shake > 0) {
    var amp = 7 * shake;
    ctx.translate((Math.random() * 2 - 1) * amp, (Math.random() * 2 - 1) * amp);
  }

  ctx.strokeStyle = tc.line;
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
    ctx.fillStyle = o.hit ? tc.wallPassed : (o.passed ? tc.wallPassed : (o.move ? tc.wallMove : tc.wall));
    ctx.globalAlpha = o.hit ? 0.5 : 1;
    ctx.fillRect(o.x, CEIL_Y, WALL_W, o.gapY - CEIL_Y);
    ctx.fillRect(o.x, o.gapY + o.gapH, WALL_W, FLOOR_Y - (o.gapY + o.gapH));
    // Kapı ağzını belirginleştiren ince kenar
    ctx.fillStyle = o.passed ? tc.line : (o.move ? tc.edgeMove : tc.edge);
    ctx.fillRect(o.x, o.gapY - 3, WALL_W, 3);
    ctx.fillRect(o.x, o.gapY + o.gapH, WALL_W, 3);
    ctx.globalAlpha = 1;
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
    ctx.globalAlpha = 0.25 * a;
    ctx.fillStyle = skin.color;
    ctx.beginPath();
    ctx.arc(trail[t].x, trail[t].y, BALL_R * (0.4 + 0.5 * a), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Top — zemine çarpınca kısa basılma
  var sq = fx.squash || 0;
  var sx = 1 + 0.35 * sq;
  var sy = 1 - 0.3 * sq;
  ctx.save();
  ctx.translate(BALL_X, state.y + BALL_R * (1 - sy));
  ctx.scale(sx, sy);
  drawBall(ctx, skin.shape, BALL_R, state.status === 'over' ? '#e05656' : skin.color);
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

  ctx.fillStyle = textCol;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Kapı: ' + state.score, 14, 24);
  ctx.textAlign = 'center';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = textDim;
  var lvCount = view.levelCount || 10;
  var per = view.gatesPerLevel || 8;
  ctx.fillText('Bölüm ' + state.level + '/' + lvCount + '  ·  ' + (state.score % per) + '/' + per, W0 / 2, 23);
  ctx.textAlign = 'right';
  ctx.fillStyle = textCol;
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText('Rekor: ' + best, W0 - 14, 24);
  ctx.textAlign = 'left';
  if (state.shield > 0) starShape(ctx, W0 - 24, FLOOR_Y + 24, 8, '#ffd166');

  // Bölüm geçişi yazısı (main.js süreyi tutar)
  if (view.banner && view.banner.a > 0) {
    ctx.globalAlpha = Math.min(1, view.banner.a);
    ctx.textAlign = 'center';
    ctx.fillStyle = textCol;
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
  var wallet = typeof view.coins === 'number'
    ? { text: '★ ' + view.coins + (view.earned ? '  (+' + view.earned + ')' : '') + '  ·  Mağaza: aşağıdaki düğme', font: '15px system-ui, sans-serif', color: '#ffd166' }
    : null;
  if (phase === 'ready') {
    overlay(ctx, [
      { text: 'Sekme Gücü', font: 'bold 30px system-ui, sans-serif', gap: 40 },
      { text: 'Basılı tut: top yükselir · bırak: düşer' },
      { text: 'Kapıları ıskalama, tavana değme', gap: 44 },
      { text: tapWord + ' ve başla', font: 'bold 20px system-ui, sans-serif', color: '#5ac8fa', gap: 40 }
    ].concat(wallet ? [wallet] : []));
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
    ].concat(wallet ? [wallet] : []));
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
    if (wallet) lines.push(wallet);
    overlay(ctx, lines);
  }
}

var RenderAPI = { draw: draw, drawBall: drawBall, drawDeco: drawDeco };
if (typeof module !== 'undefined') module.exports = RenderAPI;
if (typeof window !== 'undefined') window.GameRender = RenderAPI;
