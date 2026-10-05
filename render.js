// Sekme Gücü (Bopgate) — yalnızca çizim, state değiştirmez. Görsel dil: neon arcade.
// view: { best, muted, phase: 'ready'|'playing'|'paused'|'over'|'won', fx, touch, newBest, canRestart,
//         theme: {deco, c:{...}}, skin: {shape, color}, coins, earned, time }  (theme/skin: shop.js kataloğu)
//   fx: { particles: [{x,y,life,max,color}], shake: 0..1, squash: 0..1, trail: [{x,y}],
//         rings: [{x,y,life,max,color}], scorePop: 0..1 }
//   time: saniye cinsinden saat (yalnız süs animasyonları: nabız, parıltı)
// Gradyan, gölge ve birleşim modu olmayan bağlamlarda (testlerdeki sahte bağlam) düz renge düşer.
// Tarayıcıda bütün betikler aynı genel kapsamı paylaşır; aynı adlı değişken ve
// fonksiyonlar birbirini ezmesin diye dosya kendi kapsamında çalışır. Dışarıya yalnız
// window.Game* ve module.exports çıkar.
(function () {

// Dil: i18n.js yüklüyse çevirir, değilse Türkçe metni parametreleriyle doldurur
function L(s, p) {
  var I = typeof window !== 'undefined' && window.GameI18n;
  if (I) return I.L(s, p);
  return String(s).replace(/\{(\w+)\}/g, function (m, k) { return p && p[k] != null ? String(p[k]) : m; });
}

var TITLE = 'BOPGATE';
var FONT = "ui-rounded, 'SF Pro Rounded', 'Segoe UI', system-ui, sans-serif";
var W0 = 520;
// Dikey ölçüler oyun durumunun geometrisinden gelir (uzun telefonda alan uzar); setGeo ayarlar.
var DEFAULT_GEO = { H: 540, ceilY: 30, floorY: 480 };
var H0 = 540;
var FLOOR_Y = 480;
var CEIL_Y = 30;
function setGeo(g) {
  g = g || DEFAULT_GEO;
  H0 = g.H; FLOOR_Y = g.floorY; CEIL_Y = g.ceilY;
}
var BALL_X = 160;
var BALL_R = 12;
var WALL_W = 28;
var SMALL_F = 0.6; // logic.js POWER_SMALL_F ile aynı
var PULSE_EDGE = '#7dffb0';
var SPIKE_COL = '#ff5d6c';
var GOLD = '#ffd166';
var PINK = '#ff7a90';

function ballR(state) { return state.smallT > 0 ? BALL_R * SMALL_F : BALL_R; }
function font(weight, size) { return weight + ' ' + size + 'px ' + FONT; }

// --- Renk ve çizim yardımcıları ----------------------------------------------
function hexRgb(h) {
  if (typeof h !== 'string' || h.charAt(0) !== '#' || h.length !== 7) return null;
  return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)];
}
function rgba(h, a) {
  var c = hexRgb(h);
  return c ? 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')' : h;
}
function mix(a, b, t) {
  var x = hexRgb(a), y = hexRgb(b);
  if (!x || !y) return a;
  var o = '#';
  for (var i = 0; i < 3; i++) {
    var v = Math.round(x[i] + (y[i] - x[i]) * t);
    o += (v < 16 ? '0' : '') + v.toString(16);
  }
  return o;
}
function lin(ctx, x0, y0, x1, y1, stops, fallback) {
  if (!ctx.createLinearGradient) return fallback;
  var g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (var i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
  return g;
}
function rad(ctx, x, y, r0, r1, stops, fallback) {
  if (!ctx.createRadialGradient) return fallback;
  var g = ctx.createRadialGradient(x, y, r0, x, y, r1);
  for (var i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
  return g;
}
// Işıma: gölge bulanıklığıyla. Açık temada kapalıdır (beyaz zeminde ışıma kirli görünür).
var glowOn = true;
function glow(ctx, color, blur) {
  if (!glowOn) return;
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}
function noGlow(ctx) { ctx.shadowBlur = 0; ctx.shadowColor = 'rgba(0,0,0,0)'; }
function additive(ctx, on) { ctx.globalCompositeOperation = on && glowOn ? 'lighter' : 'source-over'; }
function rrect(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
  ctx.lineTo(x + w, y + h - r);
  ctx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
  ctx.lineTo(x + r, y + h);
  ctx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
  ctx.closePath();
}
function isLight(theme) { return !!(theme && theme.c && theme.c.text); }

// Güç simgesi: yavaşlatma = saat, küçülme = içe bakan oklar
function powerIcon(ctx, kind, cx, cy, r) {
  ctx.save();
  ctx.lineWidth = 2;
  var col = kind === 'slow' ? '#6fe0ff' : '#ff9df0';
  glow(ctx, col, 12);
  ctx.fillStyle = kind === 'slow' ? '#123047' : '#3d1f45';
  ctx.strokeStyle = col;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  noGlow(ctx);
  if (kind === 'slow') {
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - r * 0.65);
    ctx.moveTo(cx, cy); ctx.lineTo(cx + r * 0.5, cy + r * 0.2);
    ctx.stroke();
  } else {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function spikes(ctx, x0, w, y) {
  var n = Math.max(3, Math.round(w / 12));
  var tw = w / n;
  ctx.save();
  glow(ctx, SPIKE_COL, 10);
  ctx.fillStyle = SPIKE_COL;
  ctx.beginPath();
  for (var i = 0; i < n; i++) {
    ctx.moveTo(x0 + i * tw, y);
    ctx.lineTo(x0 + i * tw + tw / 2, y - 12);
    ctx.lineTo(x0 + (i + 1) * tw, y);
  }
  ctx.fill();
  ctx.restore();
}

function starPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (var i = 0; i < 10; i++) {
    var ang = -Math.PI / 2 + i * Math.PI / 5;
    var rr = i % 2 === 0 ? r : r * 0.45;
    var px = cx + Math.cos(ang) * rr, py = cy + Math.sin(ang) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}
function starShape(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  starPath(ctx, cx, cy, r);
  ctx.fill();
}

var DEFAULT_THEME = { deco: 'dots', c: { bg: '#0b1220', line: '#223352', wall: '#1f3150', wallPassed: '#16233b', wallMove: '#2b2650', edge: '#5ac8fa', edgeMove: '#b39dfa', deco: 'rgba(200,220,255,0.35)' } };
var DEFAULT_SKIN = { shape: 'circle', color: '#5ac8fa', fx: 'pulse' };

// Top şekli (0,0 merkezli). Mağaza önizlemesi de bunu kullanır.
// opts.shine: üstte parlama + hacim gradyanı; opts.glow: çevresine ışıma (bulanıklık px)
function rot(ctx, a) { if (ctx.rotate) ctx.rotate(a); }

// opts: { shine, glow, fx, t } — fx topun canlı efekti (shop.js), t saniye (yoksa durağan: mağaza önizlemesi)
function drawBall(ctx, shape, r, color, opts) {
  opts = opts || {};
  var t = opts.t || 0, fx = opts.fx || '';
  ctx.save();
  // Arka efektler (gövdenin arkasında)
  if (fx === 'ember' || fx === 'flicker') {
    var fl = 0.75 + 0.25 * Math.sin(t * 17) * Math.sin(t * 7.3);
    ctx.save();
    ctx.globalAlpha = 0.35 * fl;
    ctx.fillStyle = rad(ctx, 0, 0, r * 0.5, r * 2.1, [[0, rgba(mix(color, '#ffd166', 0.4), 0.9)], [1, rgba(color, 0)]], rgba(color, 0.3));
    ctx.beginPath(); ctx.arc(0, 0, r * 2.1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  if (fx === 'pulse' && t) {
    var pk = (t * 0.8) % 1;
    ctx.save();
    ctx.globalAlpha = 0.5 * (1 - pk);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, r * (1.15 + 0.7 * pk), 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  if (fx === 'moon') {
    // Uydu halkanın arkasından geçerken gövdenin arkasında çizilir
    var ma = t * 1.8;
    if (Math.sin(ma) < 0) moonDot(ctx, r, ma, color);
  }
  // Dönen biçimler kendi ekseninde döner (top yuvarlak olmadığında hareket hissi)
  if (fx === 'spin' && t) rot(ctx, t * (shape === 'square' ? 2.2 : shape === 'hex' ? 1.3 : 1.7));
  if (fx === 'sparkle' && t) rot(ctx, Math.sin(t * 2.4) * 0.22);
  if (fx === 'flicker' && t) { var sy = 1 + 0.07 * Math.sin(t * 19); ctx.scale(1 / sy, sy); }
  if (opts.glow) glow(ctx, color, opts.glow);
  ctx.fillStyle = opts.shine
    ? rad(ctx, -r * 0.35, -r * 0.4, r * 0.1, r * 1.4, [[0, mix(color, '#ffffff', 0.55)], [0.55, color], [1, mix(color, '#000000', 0.35)]], color)
    : color;
  ctx.beginPath();
  if (shape === 'square') {
    rrect(ctx, -r * 0.9, -r * 0.9, r * 1.8, r * 1.8, r * 0.3);
  } else if (shape === 'diamond') {
    ctx.moveTo(0, -r * 1.15); ctx.lineTo(r * 1.0, 0); ctx.lineTo(0, r * 1.15); ctx.lineTo(-r * 1.0, 0);
    ctx.closePath();
  } else if (shape === 'star') {
    starPath(ctx, 0, 0, r * 1.25);
  } else if (shape === 'hex') {
    for (var hi = 0; hi < 6; hi++) {
      var ha = Math.PI / 6 + hi * Math.PI / 3;
      if (hi === 0) ctx.moveTo(Math.cos(ha) * r * 1.1, Math.sin(ha) * r * 1.1); else ctx.lineTo(Math.cos(ha) * r * 1.1, Math.sin(ha) * r * 1.1);
    }
    ctx.closePath();
  } else if (shape === 'flame') {
    // Damla: altta yuvarlak gövde, üstte sivri alev ucu
    ctx.arc(0, r * 0.2, r * 0.9, Math.PI * 0.05, Math.PI * 0.95);
    ctx.lineTo(-r * 0.55, -r * 0.35);
    ctx.lineTo(0, -r * 1.35);
    ctx.lineTo(r * 0.55, -r * 0.35);
    ctx.closePath();
  } else {
    ctx.arc(0, 0, r, 0, Math.PI * 2);
  }
  ctx.fill();
  noGlow(ctx);
  if (shape === 'flame') {
    // İç alev
    ctx.fillStyle = mix(color, '#ffe08a', 0.7);
    ctx.beginPath();
    ctx.arc(0, r * 0.35, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'hex') {
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, -r * 0.95); ctx.lineTo(r * 0.55, r * 0.95);
    ctx.moveTo(r * 0.55, -r * 0.95); ctx.lineTo(-r * 0.55, r * 0.95);
    ctx.stroke();
  }
  if (shape === 'ring') {
    ctx.strokeStyle = mix(color, '#ffffff', 0.25);
    ctx.lineWidth = 2;
    ctx.save();
    ctx.scale(1, 0.35);
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (opts.shine) {
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.4, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // Ön efektler (gövdenin üstünde)
  if (fx === 'swirl') {
    // Nane: içinde dönen ferah bir kıvrım
    ctx.save();
    rot(ctx, t * 3);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = Math.max(1, r * 0.16);
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, Math.PI * 0.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.55, Math.PI, Math.PI * 1.9); ctx.stroke();
    ctx.restore();
  }
  if (fx === 'sparkle' || (fx === 'spin' && shape === 'star')) {
    // Elmas / yıldız: köşede yanıp sönen dört kollu pırıltı
    var sp = Math.max(0, Math.sin(t * 3.1));
    if (!t) sp = 0.8;
    ctx.save();
    ctx.globalAlpha = sp;
    ctx.fillStyle = '#ffffff';
    sparkle(ctx, r * 0.55, -r * 0.6, r * 0.5 * (0.6 + 0.4 * sp));
    ctx.restore();
  }
  if (fx === 'ember') {
    // Kor: çevresinde süzülen kıvılcımlar
    ctx.save();
    ctx.fillStyle = mix(color, '#ffe08a', 0.6);
    for (var e = 0; e < 3; e++) {
      var ea = t * (1.6 + e * 0.5) + e * 2.1;
      var er = r * (1.45 + 0.2 * Math.sin(t * 3 + e));
      ctx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 6 + e * 2);
      ctx.beginPath(); ctx.arc(Math.cos(ea) * er, Math.sin(ea) * er, Math.max(1, r * 0.13), 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  if (fx === 'flicker') {
    // Alev: içte titreyen sıcak çekirdek
    ctx.save();
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 23);
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath(); ctx.arc(0, r * 0.4, r * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  if (fx === 'moon') {
    var mb = t * 1.8;
    if (Math.sin(mb) >= 0) { ctx.save(); moonDot(ctx, r, mb, color); ctx.restore(); }
  }
}

// Gezegenin uydusu: yatık yörüngede döner (yörünge halkayla aynı basıklıkta)
function moonDot(ctx, r, a, color) {
  ctx.fillStyle = mix(color, '#ffffff', 0.6);
  ctx.beginPath();
  ctx.arc(Math.cos(a) * r * 1.9, Math.sin(a) * r * 0.62, Math.max(1.2, r * 0.22), 0, Math.PI * 2);
  ctx.fill();
}

// Dört kollu pırıltı (✦)
function sparkle(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.25, y - s * 0.25); ctx.lineTo(x + s, y);
  ctx.lineTo(x + s * 0.25, y + s * 0.25); ctx.lineTo(x, y + s); ctx.lineTo(x - s * 0.25, y + s * 0.25);
  ctx.lineTo(x - s, y); ctx.lineTo(x - s * 0.25, y - s * 0.25);
  ctx.closePath();
  ctx.fill();
}

// Arka plan süsü: kaymalı (paralaks) ama deterministik; dist = katedilen yol, t = saniye (pırıltı,
// kar, ateş böceği gibi yerinde canlanan ayrıntılar; mağaza önizlemesinde verilmez → durağan).
// Uzak katman yavaş, yakın katman hızlı kayar: derinlik hissi. Süsler soluk tutulur ki kapılarla karışmasın.
function wrapX(base, speed, d, span) { return ((base - d * speed) % span + span) % span; }
function ridge(ctx, d, speed, baseY, amp, step, seed) {
  // Kayan dağ/tepe silueti: sabit tohumlu yükseklikler, dünya ile birlikte akar
  var off = (d * speed) % step;
  var first = Math.floor(d * speed / step);
  ctx.beginPath();
  ctx.moveTo(0, FLOOR_Y);
  for (var k = 0; k <= Math.ceil(W0 / step) + 1; k++) {
    var n = first + k;
    var hv = Math.sin(n * 12.9898 + seed * 78.233) * 43758.5453;
    var hgt = amp * (0.35 + 0.65 * (hv - Math.floor(hv)));
    ctx.lineTo(k * step - off, baseY - hgt);
  }
  ctx.lineTo(W0, FLOOR_Y);
  ctx.closePath();
  ctx.fill();
}
function drawDeco(ctx, theme, dist, geo, t) {
  if (geo) setGeo(geo);
  var col = theme.c.deco;
  var d = dist || 0;
  t = t || 0;
  var span = FLOOR_Y - CEIL_Y;
  ctx.fillStyle = col;
  ctx.strokeStyle = col;
  var i, x, y;
  ctx.save();
  if (theme.deco === 'sun') {
    // Ufukta çizgili neon güneş + iki kat kayan dağ silueti
    var sr = 78;
    ctx.fillStyle = lin(ctx, 0, FLOOR_Y - sr, 0, FLOOR_Y, [[0, 'rgba(255,214,120,0.42)'], [1, 'rgba(255,90,150,0.22)']], col);
    ctx.beginPath();
    ctx.arc(390, FLOOR_Y - 26, sr, Math.PI, Math.PI * 2);
    ctx.fill();
    // Güneşin üstünden geçen boşluk çizgileri (synthwave)
    ctx.fillStyle = theme.c.bg;
    for (i = 0; i < 4; i++) ctx.fillRect(390 - sr, FLOOR_Y - 34 - i * 14, sr * 2, 2 + i * 0.6);
    ctx.fillStyle = 'rgba(120,40,90,0.45)';
    ridge(ctx, d, 0.08, FLOOR_Y, 70, 64, 1);
    ctx.fillStyle = 'rgba(60,18,48,0.75)';
    ridge(ctx, d, 0.2, FLOOR_Y, 38, 46, 2);
  } else if (theme.deco === 'trees') {
    // Uzak (soluk, yavaş) ve yakın (koyu, hızlı) çam sırası + yanıp sönen ateş böcekleri
    var layers = [[0.12, 0.35, 0.6, 61, 11], [0.3, 0.75, 1, 83, 9]];
    for (var L2 = 0; L2 < layers.length; L2++) {
      var ly = layers[L2];
      ctx.globalAlpha = ly[1];
      for (i = 0; i < ly[4]; i++) {
        x = wrapX(i * ly[3], ly[0], d, W0 + 80) - 40;
        var h = (60 + (i * 37) % 70) * ly[2];
        var w = 26 * ly[2];
        ctx.beginPath();
        ctx.moveTo(x - w, FLOOR_Y); ctx.lineTo(x, FLOOR_Y - h); ctx.lineTo(x + w, FLOOR_Y);
        ctx.moveTo(x - w * 0.8, FLOOR_Y - h * 0.35); ctx.lineTo(x, FLOOR_Y - h * 1.12); ctx.lineTo(x + w * 0.8, FLOOR_Y - h * 0.35);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    for (i = 0; i < 14; i++) {
      var blink = Math.sin(t * (1.3 + (i % 4) * 0.4) + i * 1.7);
      if (blink <= 0.2) continue;
      x = wrapX(i * 71 + 30 * Math.sin(t * 0.5 + i), 0.18, d, W0);
      y = FLOOR_Y - 30 - ((i * 53) % Math.max(60, span * 0.55)) + 8 * Math.sin(t * 0.9 + i);
      ctx.globalAlpha = blink;
      ctx.fillStyle = '#e8ff8a';
      glow(ctx, '#d8ff6a', 8);
      ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
    }
    noGlow(ctx);
  } else if (theme.deco === 'grid') {
    // Uzakta ışıklı pencereli şehir silueti, önde akan neon ızgara
    var bw = 34, bspan = W0 + bw * 2;
    for (i = 0; i < 18; i++) {
      x = wrapX(i * 37, 0.07, d, bspan) - bw;
      var bh = 50 + ((i * 67) % 120);
      ctx.fillStyle = 'rgba(20,10,45,0.9)';
      ctx.fillRect(x, FLOOR_Y - bh, bw - 4, bh);
      for (var wy = FLOOR_Y - bh + 8; wy < FLOOR_Y - 6; wy += 11) {
        for (var wx = 0; wx < 3; wx++) {
          var on = ((i * 7 + wx * 3 + Math.floor(wy)) % 5) === 0;
          if (!on) continue;
          ctx.fillStyle = (i + wx) % 3 ? 'rgba(43,240,255,0.45)' : 'rgba(255,43,214,0.45)';
          ctx.fillRect(x + 4 + wx * 9, wy, 4, 4);
        }
      }
    }
    ctx.strokeStyle = col;
    ctx.lineWidth = 1;
    var off = (d * 0.5) % 40;
    for (x = -off; x < W0; x += 40) { ctx.beginPath(); ctx.moveTo(x, CEIL_Y); ctx.lineTo(x, FLOOR_Y); ctx.stroke(); }
    for (y = CEIL_Y; y < FLOOR_Y; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W0, y); ctx.stroke(); }
  } else if (theme.deco === 'nebula') {
    // Yavaş kayan, hafifçe nefes alan bulutsular + pırıldayan yıldız tozu
    var blobs = [['rgba(255,90,210,0.16)', 0, 0.3, 150], ['rgba(90,220,255,0.13)', 260, 0.55, 180], ['rgba(170,110,255,0.15)', 470, 0.2, 130]];
    for (i = 0; i < blobs.length; i++) {
      var bx = wrapX(blobs[i][1], 0.05, d, W0 + 300) - 150;
      var byy = CEIL_Y + span * blobs[i][2];
      var br = blobs[i][3] * (1 + 0.06 * Math.sin(t * 0.7 + i * 2));
      ctx.fillStyle = rad(ctx, bx, byy, 0, br, [[0, blobs[i][0]], [1, 'rgba(0,0,0,0)']], blobs[i][0]);
      ctx.beginPath(); ctx.arc(bx, byy, br, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = col;
    for (i = 0; i < 40; i++) {
      x = wrapX(i * 47, 0.12, d, W0);
      ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(t * 1.5 + i * 0.9));
      var ss = i % 5 === 0 ? 2.5 : 1.5;
      ctx.fillRect(x, CEIL_Y + 6 + ((i * 89) % (span - 12)), ss, ss);
    }
  } else if (theme.deco === 'flakes') {
    // Uzakta buzul tepeleri; önde yavaşça yağan, salınan kar
    ctx.fillStyle = 'rgba(160,200,230,0.35)';
    ridge(ctx, d, 0.08, FLOOR_Y, 90, 70, 3);
    ctx.fillStyle = 'rgba(200,225,245,0.55)';
    ridge(ctx, d, 0.18, FLOOR_Y, 45, 52, 4);
    ctx.fillStyle = col;
    for (i = 0; i < 34; i++) {
      var fall = (t * (14 + (i % 5) * 5) + (i * 97)) % span;
      x = wrapX(i * 61 + 10 * Math.sin(t * 1.1 + i), 0.15, d, W0);
      y = CEIL_Y + fall;
      var fs = i % 3 === 0 ? 4 : 2.6;
      ctx.beginPath(); ctx.arc(x, y, fs / 2, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    // Gece: hilal ay, iki kat yıldız (uzak küçük, yakın büyük) ve pırıltı
    var mx = wrapX(420, 0.02, d, W0 + 120) - 60, my = CEIL_Y + Math.min(90, span * 0.16);
    glow(ctx, '#cfe3ff', 16);
    ctx.fillStyle = 'rgba(225,236,255,0.85)';
    ctx.beginPath(); ctx.arc(mx, my, 20, 0, Math.PI * 2); ctx.fill();
    noGlow(ctx);
    ctx.fillStyle = theme.c.bg;
    ctx.beginPath(); ctx.arc(mx + 9, my - 6, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = col;
    for (i = 0; i < 30; i++) {
      x = wrapX(i * 53, 0.1, d, W0);
      ctx.globalAlpha = 0.55 + 0.45 * Math.sin(t * (1 + (i % 3) * 0.6) + i);
      ctx.fillRect(x, CEIL_Y + 8 + ((i * 71) % (span - 16)), 2, 2);
    }
    ctx.globalAlpha = 0.6;
    for (i = 0; i < 12; i++) {
      x = wrapX(i * 97, 0.3, d, W0);
      ctx.beginPath();
      ctx.arc(x, CEIL_Y + 20 + ((i * 131) % (span - 40)), 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ara sıra parlayan bir yıldız
    var tw = Math.max(0, Math.sin(t * 1.3));
    if (tw > 0.05) {
      ctx.globalAlpha = tw;
      ctx.fillStyle = '#ffffff';
      sparkle(ctx, wrapX(140, 0.1, d, W0), CEIL_Y + span * 0.22, 5 * tw);
    }
  }
  ctx.restore();
}

// Gök, zemin ızgarası, neon tavan/zemin çizgisi
function drawStage(ctx, theme, dist, t) {
  var tc = theme.c, light = isLight(theme);
  ctx.fillStyle = lin(ctx, 0, 0, 0, H0, light
    ? [[0, mix(tc.bg, '#ffffff', 0.5)], [1, tc.bg]]
    : [[0, mix(tc.bg, tc.edge, 0.12)], [0.55, tc.bg], [1, mix(tc.bg, '#000000', 0.45)]], tc.bg);
  ctx.fillRect(0, 0, W0, H0);
  if (!light) {
    // Ufuk ışığı: zeminin hemen üstünde yumuşak bir parlama
    ctx.fillStyle = lin(ctx, 0, FLOOR_Y - 140, 0, FLOOR_Y, [[0, rgba(tc.edge, 0)], [1, rgba(tc.edge, 0.10)]], 'rgba(0,0,0,0)');
    ctx.fillRect(0, FLOOR_Y - 140, W0, 140);
  }
  drawDeco(ctx, theme, dist, null, t);

  // Zemin: perspektif ızgara (ufuk = zemin çizgisi), yolla birlikte akar
  var floorH = H0 - FLOOR_Y;
  ctx.fillStyle = lin(ctx, 0, FLOOR_Y, 0, H0, [[0, mix(tc.bg, tc.edge, light ? 0.18 : 0.10)], [1, light ? tc.bg : mix(tc.bg, '#000000', 0.5)]], tc.bg);
  ctx.fillRect(0, FLOOR_Y, W0, floorH);
  ctx.save();
  ctx.strokeStyle = rgba(tc.edge, light ? 0.35 : 0.22);
  ctx.lineWidth = 1;
  var off = ((dist || 0) * 0.6) % 48;
  for (var i = -12; i <= 12; i++) {
    var xt = W0 / 2 + i * 48 - off;
    ctx.beginPath();
    ctx.moveTo(xt, FLOOR_Y);
    ctx.lineTo(W0 / 2 + (xt - W0 / 2) * 3.2, H0);
    ctx.stroke();
  }
  for (var k = 1; k <= 4; k++) {
    var yy = FLOOR_Y + floorH * (k * k) / 20;
    if (yy >= H0) break;
    ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W0, yy); ctx.stroke();
  }
  ctx.restore();

  // HUD şeridi (tavanın üstü)
  ctx.fillStyle = light ? rgba('#ffffff', 0.55) : 'rgba(3,5,10,0.55)';
  ctx.fillRect(0, 0, W0, CEIL_Y);

  // Neon tavan ve zemin çizgileri
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = tc.edge;
  glow(ctx, tc.edge, 10);
  ctx.beginPath(); ctx.moveTo(0, CEIL_Y); ctx.lineTo(W0, CEIL_Y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, FLOOR_Y); ctx.lineTo(W0, FLOOR_Y); ctx.stroke();
  ctx.restore();
}

function drawWall(ctx, o, tc, light, flash) {
  var neon = o.passed ? tc.line : (o.move ? tc.edgeMove : (o.pulse ? PULSE_EDGE : tc.edge));
  var base = o.passed || o.hit ? tc.wallPassed : (o.move ? tc.wallMove : tc.wall);
  ctx.save();
  ctx.globalAlpha = o.hit ? 0.45 : 1;
  // Gövde: yandan ışık alan silindir hissi
  ctx.fillStyle = lin(ctx, o.x, 0, o.x + WALL_W, 0,
    [[0, mix(base, neon, o.passed ? 0.05 : 0.28)], [0.45, base], [1, mix(base, '#000000', light ? 0.08 : 0.35)]], base);
  var topH = o.gapY - CEIL_Y;
  var botY = o.gapY + o.gapH;
  ctx.fillRect(o.x, CEIL_Y, WALL_W, topH);
  ctx.fillRect(o.x, botY, WALL_W, FLOOR_Y - botY);
  ctx.strokeStyle = rgba(neon, o.passed ? 0.15 : 0.45);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(o.x + 0.75, CEIL_Y, WALL_W - 1.5, topH);
  ctx.strokeRect(o.x + 0.75, botY, WALL_W - 1.5, FLOOR_Y - botY);
  // Kapı ağzı: iki kenar arası yumuşak ışık perdesi
  if (!o.passed && !o.hit) {
    ctx.fillStyle = lin(ctx, 0, o.gapY, 0, botY,
      [[0, rgba(neon, 0.22)], [0.25, rgba(neon, 0.03)], [0.75, rgba(neon, 0.03)], [1, rgba(neon, 0.22)]], 'rgba(0,0,0,0)');
    ctx.fillRect(o.x, o.gapY, WALL_W, o.gapH);
  }
  // Ağız kapakları: parlayan yuvarlak çubuklar
  if (!o.passed) glow(ctx, neon, 14);
  ctx.fillStyle = neon;
  rrect(ctx, o.x - 4, o.gapY - 7, WALL_W + 8, 7, 3.5); ctx.fill();
  rrect(ctx, o.x - 4, botY, WALL_W + 8, 7, 3.5); ctx.fill();
  // Az önce geçildi: ağız kapakları ve perde kısa bir an beyaz parlar
  if (flash > 0) {
    var hot = o.move ? tc.edgeMove : (o.pulse ? PULSE_EDGE : tc.edge);
    ctx.globalAlpha = flash;
    glow(ctx, hot, 26);
    ctx.fillStyle = mix(hot, '#ffffff', 0.6);
    rrect(ctx, o.x - 7, o.gapY - 9, WALL_W + 14, 9, 4.5); ctx.fill();
    rrect(ctx, o.x - 7, botY, WALL_W + 14, 9, 4.5); ctx.fill();
    noGlow(ctx);
    ctx.globalAlpha = flash * 0.35;
    ctx.fillStyle = hot;
    ctx.fillRect(o.x, o.gapY, WALL_W, o.gapH);
  }
  ctx.restore();
}

function questLines(view) {
  var q = view.questDone || [];
  var out = [];
  for (var i = 0; i < q.length && i < 3; i++) {
    out.push({ text: L('✓ {t}  +{r} ★', { t: q[i].text, r: q[i].reward }), font: font(600, 15), color: '#46d39a', h: 24 });
  }
  return out;
}

// Ortalanmış yarı saydam kart; satırlar { text, font, color, h, glow, pill }
function card(ctx, rows, accent, light, w) {
  var pad = 26, total = 0, i;
  for (i = 0; i < rows.length; i++) total += rows[i].h || 30;
  w = w || 420;
  var h = total + pad * 2;
  var x = (W0 - w) / 2, y = Math.max(CEIL_Y + 10, (H0 - h) / 2);
  ctx.save();
  glow(ctx, accent, 24);
  ctx.fillStyle = light ? 'rgba(255,255,255,0.92)' : lin(ctx, 0, y, 0, y + h, [[0, 'rgba(22,30,52,0.94)'], [1, 'rgba(10,14,26,0.94)']], 'rgba(14,20,36,0.94)');
  rrect(ctx, x, y, w, h, 22);
  ctx.fill();
  noGlow(ctx);
  ctx.strokeStyle = rgba(accent, 0.7);
  ctx.lineWidth = 2;
  rrect(ctx, x, y, w, h, 22);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  var cy = y + pad;
  for (i = 0; i < rows.length; i++) {
    var r = rows[i], rh = r.h || 30;
    if (r.text) {
      if (r.pill) {
        ctx.fillStyle = rgba(r.pill, 0.18);
        rrect(ctx, W0 / 2 - r.pillW / 2, cy + 3, r.pillW, rh - 6, (rh - 6) / 2);
        ctx.fill();
      }
      ctx.font = r.font || font(500, 17);
      ctx.fillStyle = r.color || (light ? '#12324a' : '#e8ecf1');
      if (r.glow) glow(ctx, r.glow, 16);
      ctx.fillText(r.text, W0 / 2, cy + rh / 2);
      noGlow(ctx);
    }
    cy += rh;
  }
  ctx.restore();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function drawLogo(ctx, cx, cy, theme, t) {
  var tc = theme.c, light = isLight(theme);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = font(900, 66);
  var a = tc.edge, b = tc.edgeMove;
  // Arkadaki geniş ışık + önde gradyan dolgu
  glow(ctx, a, 28 + 6 * Math.sin(t * 2));
  ctx.fillStyle = lin(ctx, cx - 170, 0, cx + 170, 0, [[0, a], [0.55, mix(a, b, 0.6)], [1, b]], a);
  ctx.fillText(TITLE, cx, cy);
  noGlow(ctx);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = light ? rgba('#ffffff', 0.9) : rgba('#ffffff', 0.35);
  if (ctx.strokeText) ctx.strokeText(TITLE, cx, cy);
  ctx.restore();
}

function pillButton(ctx, cx, cy, w, h, text, t) {
  var s = 1 + 0.035 * Math.sin(t * 4);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  glow(ctx, '#ffb347', 22);
  ctx.fillStyle = lin(ctx, 0, -h / 2, 0, h / 2, [[0, '#ffe08a'], [1, '#ff9f43']], GOLD);
  rrect(ctx, -w / 2, -h / 2, w, h, h / 2);
  ctx.fill();
  noGlow(ctx);
  ctx.fillStyle = '#1a1206';
  ctx.font = font(900, 26);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 2);
  ctx.restore();
}

function chip(ctx, cx, cy, text, color, light) {
  ctx.save();
  ctx.font = font(700, 16);
  var w = ctx.measureText ? Math.max(90, ctx.measureText(text).width + 32) : 140;
  ctx.fillStyle = light ? rgba('#ffffff', 0.8) : 'rgba(10,16,30,0.8)';
  rrect(ctx, cx - w / 2, cy - 17, w, 34, 17);
  ctx.fill();
  ctx.strokeStyle = rgba(color, 0.6);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy + 1);
  ctx.restore();
}

function dim(ctx, light) {
  ctx.fillStyle = light ? 'rgba(232,243,251,0.55)' : 'rgba(3,5,10,0.62)';
  ctx.fillRect(0, 0, W0, H0);
}

function draw(ctx, state, view) {
  view = view || {};
  var fx = view.fx || {};
  var best = view.best || 0;
  var phase = view.phase || state.status;
  var t = view.time || state.t || 0;
  setGeo(state.geo);
  // Canvas piksel boyutu main.js'de DPR'ye göre ayarlanır; burada mantıksal 520 x H ile çizilir.
  var scale = ctx.canvas.width / W0;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  var theme = view.theme || DEFAULT_THEME;
  var tc = theme.c;
  var light = isLight(theme);
  glowOn = !light;
  var skin = view.skin || DEFAULT_SKIN;
  var textCol = tc.text || '#e8ecf1';
  var textDim = tc.textDim || '#9fb3d1';
  drawStage(ctx, theme, state.distance, t);

  // Ekran sarsıntısı (≤ 200 ms, zamanlamayı main.js yapar)
  var shake = fx.shake || 0;
  if (shake > 0) {
    var amp = 7 * shake;
    ctx.translate((Math.random() * 2 - 1) * amp, (Math.random() * 2 - 1) * amp);
  }

  var i;
  for (i = 0; i < state.obstacles.length; i++) {
    var o = state.obstacles[i];
    var fl = 0;
    for (var f = 0; f < (fx.flash || []).length; f++) if (fx.flash[f].o === o) fl = Math.max(fl, fx.flash[f].life / fx.flash[f].max);
    drawWall(ctx, o, tc, light, fl);
    if (o.spike) {
      ctx.globalAlpha = o.spike.hit ? 0.3 : 1;
      spikes(ctx, o.x + WALL_W + o.spike.dx, o.spike.w, FLOOR_Y);
      ctx.globalAlpha = 1;
    }
  }

  // Yıldızlar (kapı ortasında; toplanınca kalkan) — hafif nabız ve ışıma
  var pulse = 1 + 0.12 * Math.sin(t * 6);
  for (i = 0; i < state.obstacles.length; i++) {
    var so = state.obstacles[i];
    if (!so.star || so.star.taken) continue;
    ctx.save();
    glow(ctx, GOLD, 14);
    starShape(ctx, so.x + WALL_W / 2, so.gapY + so.gapH / 2, 10 * pulse, GOLD);
    ctx.restore();
  }
  for (i = 0; i < state.obstacles.length; i++) {
    var po = state.obstacles[i];
    if (!po.power || po.power.taken) continue;
    powerIcon(ctx, po.power.kind, po.x + WALL_W / 2, po.gapY + po.gapH / 2, 10 * pulse);
  }
  var R0 = ballR(state);
  var ballCol = state.status === 'over' ? '#e05656' : skin.color;

  // Kapı geçiş halkaları
  var rings = fx.rings || [];
  ctx.save();
  for (i = 0; i < rings.length; i++) {
    var rg = rings[i], k = 1 - Math.max(0, rg.life / rg.max);
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = rg.color;
    ctx.lineWidth = 3 * (1 - k) + 1;
    glow(ctx, rg.color, 12);
    ctx.beginPath();
    ctx.arc(rg.x, rg.y, R0 + 6 + 46 * k, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // Işık izi: topun arkasında incelen parlak kuyruk
  // Dünya sola aktığı için eski konumlar sola kaydırılır; parçalar kalınlaşarak topa bağlanır.
  var trail = fx.trail || [];
  ctx.save();
  additive(ctx, true);
  ctx.lineCap = 'round';
  ctx.strokeStyle = ballCol;
  var n = trail.length;
  for (var tr = 0; tr < n; tr++) {
    var a = (tr + 1) / n;
    var x0 = trail[tr].x - (n - tr) * 5, y0 = trail[tr].y;
    var x1 = tr + 1 < n ? trail[tr + 1].x - (n - tr - 1) * 5 : BALL_X;
    var y1 = tr + 1 < n ? trail[tr + 1].y : state.y;
    ctx.globalAlpha = 0.45 * a;
    ctx.lineWidth = R0 * 1.6 * a;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  }
  ctx.restore();

  // Top — zemine çarpınca kısa basılma
  var sq = fx.squash || 0;
  var sx = 1 + 0.35 * sq;
  var sy = 1 - 0.3 * sq;
  if (phase !== 'ready') {
    ctx.save();
    ctx.translate(BALL_X, state.y + R0 * (1 - sy));
    ctx.scale(sx, sy);
    drawBall(ctx, skin.shape, R0, ballCol, { shine: true, glow: 18, fx: state.status === 'over' ? '' : skin.fx, t: t });
    ctx.restore();
  }

  // Kalkan: dönen çift halka
  if (state.shield > 0 && state.status === 'playing') {
    ctx.save();
    glow(ctx, GOLD, 12);
    ctx.strokeStyle = rgba(GOLD, 0.9);
    ctx.lineWidth = 2.5;
    var rot = t * 3;
    ctx.beginPath(); ctx.arc(BALL_X, state.y, R0 + 6, rot, rot + Math.PI * 1.4); ctx.stroke();
    ctx.strokeStyle = rgba(GOLD, 0.45);
    ctx.beginPath(); ctx.arc(BALL_X, state.y, R0 + 6, rot + Math.PI * 1.55, rot + Math.PI * 1.9); ctx.stroke();
    ctx.restore();
  }

  // Parçacıklar (ışıklı, toplanır renk)
  var ps = fx.particles || [];
  ctx.save();
  additive(ctx, true);
  for (var p = 0; p < ps.length; p++) {
    var q = ps[p];
    var life = Math.max(0, q.life / q.max);
    ctx.globalAlpha = life;
    ctx.fillStyle = q.color;
    ctx.beginPath();
    ctx.arc(q.x, q.y, 1.5 + 2 * life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  if (fx.callout && phase === 'playing') {
    var co = fx.callout, k = 1 - co.life / co.max;
    ctx.save();
    ctx.globalAlpha = Math.min(1, co.life / co.max * 2.5);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    var cs = (co.big ? 24 : 19) * (k < 0.15 ? 0.7 + 2 * k : 1);
    ctx.font = font(900, Math.round(cs));
    ctx.fillStyle = GOLD;
    glow(ctx, GOLD, co.big ? 18 : 10);
    var cyy = Math.max(CEIL_Y + 22, Math.min(FLOOR_Y - 22, co.y - 34 - 30 * k));
    ctx.fillText(co.text, BALL_X + 22, cyy);
    ctx.restore();
  }

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  if (phase !== 'ready') drawHud(ctx, state, view, tc, textCol, textDim);

  // Bölüm geçişi yazısı (main.js süreyi tutar)
  if (view.banner && view.banner.a > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, view.banner.a);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var by = CEIL_Y + 110;
    ctx.fillStyle = textCol;
    ctx.font = font(900, 40);
    glow(ctx, tc.edge, 20);
    var I = typeof window !== 'undefined' && window.GameI18n;
    ctx.fillText(view.banner.title.toLocaleUpperCase(I && I.getLang() === 'en' ? 'en' : 'tr'), W0 / 2, by);
    noGlow(ctx);
    if (view.banner.sub) {
      ctx.font = font(700, 17);
      ctx.fillStyle = GOLD;
      ctx.fillText(view.banner.sub, W0 / 2, by + 38);
    }
    ctx.restore();
  }

  if (view.muted) {
    ctx.fillStyle = textDim;
    ctx.font = font(600, 14);
    ctx.fillText(L('sessiz'), 14, FLOOR_Y + 28);
  }

  drawScreens(ctx, state, view, phase, theme, best, t, skin);
}

function drawHud(ctx, state, view, tc, textCol, textDim) {
  var fx = view.fx || {};
  var per = view.gatesPerLevel || 8;
  ctx.save();
  // Skor: ortada büyük, geçişte kısa sıçrama
  var pop = fx.scorePop || 0;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = font(900, Math.round(28 + 8 * pop));
  ctx.fillStyle = textCol;
  glow(ctx, tc.edge, 10 + 10 * pop);
  ctx.fillText(String(state.score), W0 / 2, CEIL_Y / 2 + 1);
  noGlow(ctx);
  // Sol: bölüm + 8 parçalı ilerleme
  ctx.textAlign = 'left';
  ctx.font = font(800, 12);
  ctx.fillStyle = textDim;
  ctx.fillText(L('BÖLÜM {n}', { n: state.level }), 14, 10);
  var done = state.score % per;
  for (var s = 0; s < per; s++) {
    ctx.fillStyle = s < done ? tc.edge : rgba(tc.edge, 0.2);
    rrect(ctx, 14 + s * 11, 18, 9, 5, 2.5);
    ctx.fill();
  }
  // Sağ: rekor
  ctx.textAlign = 'right';
  ctx.font = font(800, 12);
  ctx.fillStyle = textDim;
  ctx.fillText(L('REKOR'), W0 - 14, 10);
  ctx.font = font(800, 14);
  ctx.fillStyle = textCol;
  ctx.fillText(String(view.best || 0), W0 - 14, 22);
  ctx.restore();

  // Kalkanlar (kapasite güçlendirmesiyle 3'e kadar): sağ altta birer yıldız
  ctx.save();
  glow(ctx, GOLD, 8);
  for (var sh = 0; sh < (state.shield || 0); sh++) starShape(ctx, W0 - 24 - sh * 20, FLOOR_Y + 24, 8, GOLD);
  ctx.restore();
  // Etkin güçler ve kalan süre (zeminin altında, sağda)
  var hx = W0 - 52 - Math.max(0, (state.shield || 0) - 1) * 20;
  [['slow', state.slowT], ['small', state.smallT]].forEach(function (pw) {
    if (!(pw[1] > 0)) return;
    powerIcon(ctx, pw[0], hx, FLOOR_Y + 24, 9);
    ctx.fillStyle = textDim;
    ctx.font = font(700, 13);
    ctx.textAlign = 'right';
    ctx.fillText(Math.ceil(pw[1]) + 's', hx - 13, FLOOR_Y + 29);
    ctx.textAlign = 'left';
    hx -= 56;
  });
}

function drawScreens(ctx, state, view, phase, theme, best, t, skin) {
  var tc = theme.c, light = isLight(theme);
  var tapWord = L(view.touch ? 'Dokun' : 'Boşluk / dokun');
  var hasCoins = typeof view.coins === 'number';
  if (phase === 'ready') {
    dim(ctx, light);
    // İçerik bloğu (zıplayan top → logo → düğme → rozetler) oyun alanının ortasına oturur
    var mid = (CEIL_Y + FLOOR_Y) / 2;
    var ly = Math.max(CEIL_Y + 150, mid - 120);
    // Kuşanılmış top logonun üstünde zıplar: oyuncu neyi oynayacağını hemen görür
    var hop = Math.abs(Math.sin(t * 2.6));
    var bY = ly - 74 - 46 * hop;
    var land = 1 - hop;
    ctx.save();
    ctx.fillStyle = rgba(tc.edge, 0.18 + 0.2 * land);
    ctx.beginPath();
    if (ctx.ellipse) ctx.ellipse(W0 / 2, ly - 52, 20 - 8 * hop, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(W0 / 2, bY);
    var sqz = land > 0.85 ? (land - 0.85) / 0.15 : 0;
    ctx.scale(1 + 0.18 * sqz, 1 - 0.15 * sqz);
    drawBall(ctx, (skin || DEFAULT_SKIN).shape, 20, (skin || DEFAULT_SKIN).color, { shine: true, glow: 26, fx: (skin || DEFAULT_SKIN).fx, t: t });
    ctx.restore();
    drawLogo(ctx, W0 / 2, ly, theme, t);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = font(600, 17);
    ctx.fillStyle = tc.textDim || '#9fb3d1';
    ctx.fillText(L('Basılı tut · yüksel · kapıdan geç'), W0 / 2, ly + 52);
    ctx.restore();
    var by = Math.min(ly + 150, FLOOR_Y - 170);
    pillButton(ctx, W0 / 2, by, 230, 66, L('▶  OYNA'), t);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = font(600, 15);
    ctx.fillStyle = tc.textDim || '#9fb3d1';
    ctx.fillText(L('{w} ve başla', { w: tapWord }), W0 / 2, by + 58);
    ctx.restore();
    var cy = by + 104;
    chip(ctx, W0 / 2 - 82, cy, '🏆 ' + best, tc.edge, light);
    if (hasCoins) chip(ctx, W0 / 2 + 82, cy, '★ ' + view.coins, GOLD, light);
    if (view.notice) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = font(800, 16);
      ctx.fillStyle = '#46d39a';
      glow(ctx, '#46d39a', 10);
      ctx.fillText(view.notice, W0 / 2, cy + 52);
      ctx.restore();
    }
  } else if (phase === 'paused') {
    dim(ctx, light);
    card(ctx, [
      { text: L('DURAKLATILDI'), font: font(900, 28), glow: tc.edge, h: 46 },
      { text: L('{w} ve devam et', { w: tapWord }), font: font(600, 17), color: tc.edge, h: 30 }
    ], tc.edge, light, 360);
  } else if (phase === 'over' || phase === 'won') {
    // Oyun sonsuz: tek bitiş ekranı. 'won' yalnız eski durumlar için aynı ekrana düşer.
    dim(ctx, light);
    var ms = state.milestones || 0;
    var body = light ? '#12324a' : '#e8ecf1';
    var muted = light ? '#4f7591' : '#9fb3d1';
    var rows = [
      { text: L('OYUN BİTTİ'), font: font(900, 30), color: '#ff5d7a', glow: '#ff5d7a', h: 44 },
      { text: L(state.overReason), font: font(500, 16), color: muted, h: 26 },
      { text: String(state.score), font: font(900, 76), color: body, glow: tc.edge, h: 84 },
      { text: L('KAPI'), font: font(800, 13), color: muted, h: 22 }
    ];
    if (view.newBest) rows.push({ text: L('★ YENİ REKOR ★'), font: font(900, 18), color: GOLD, glow: GOLD, pill: GOLD, pillW: 210, h: 40 });
    else rows.push({ text: L('Rekor: {n}', { n: best }), font: font(700, 16), color: body, h: 32 });
    rows.push({ text: L('Bölüm {n}', { n: state.level }) + (ms ? '  ·  ' + L('{n} eşik', { n: ms }) : ''), font: font(600, 15), color: ms ? GOLD : muted, h: 28 });
    if (hasCoins && view.earned) rows.push({ text: L('+{e} ★   (cüzdan ★ {c})', { e: view.earned, c: view.coins }), font: font(800, 18), color: GOLD, h: 34 });
    else if (hasCoins) rows.push({ text: L('Cüzdan ★ {n}', { n: view.coins }), font: font(700, 15), color: GOLD, h: 30 });
    rows = rows.concat(questLines(view));
    if (view.revive) {
      var rv = view.revive;
      var adWord = L(rv.noads ? 'bedava' : 'reklamla');
      var how = rv.cost && rv.ad ? L('★ {n} ya da {ad}', { n: rv.cost, ad: adWord }) : rv.cost ? '★ ' + rv.cost : adWord;
      rows.push({ text: L('❤ Devam: {how} · aşağıda', { how: how }) + (view.touch || !rv.cost ? '' : ' · C'), font: font(800, 16), color: PINK, h: 34 });
    }
    rows.push(view.canRestart
      ? { text: L('{w}: tekrar oyna', { w: L(view.touch ? 'Dokun' : 'Dokun ya da R') }), font: font(800, 17), color: tc.edge, glow: tc.edge, h: 38 }
      : { text: ' ', h: 38 });
    card(ctx, rows, view.newBest ? GOLD : '#ff5d7a', light, 420);
  }
}

var RenderAPI = { draw: draw, drawBall: drawBall, drawDeco: drawDeco, DEFAULT_GEO: DEFAULT_GEO, TITLE: TITLE };
if (typeof module !== 'undefined') module.exports = RenderAPI;
if (typeof window !== 'undefined') window.GameRender = RenderAPI;
})();
