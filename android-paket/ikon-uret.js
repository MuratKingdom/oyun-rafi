#!/usr/bin/env node
// Bopgate — simge, açılış ekranı ve Play Store tanıtım görselini YORDAMSAL üretir.
// Harici görsel yok: her şey bu dosyadaki SVG'den Chromium ile PNG'ye çizilir.
//
// Kullanım:  node ikon-uret.js
// Gerekenler: playwright-core + Chromium. Yollar ortam değişkeniyle değiştirilebilir:
//   PLAYWRIGHT_CORE=/opt/node-tools/node_modules/playwright-core
//   CHROMIUM_YOLU=/opt/pw-browsers/chromium
//
// Çıktılar:
//   kaynak/ikon-1024.png              tam simge (kare, kenara kadar)
//   kaynak/ikon-512.png               Play Store simgesi (512x512)
//   kaynak/ikon-on-plan-1024.png      uyarlanabilir simge ön planı (saydam)
//   kaynak/ikon-arka-plan-1024.png    uyarlanabilir simge arka planı
//   kaynak/acilis-2732.png            açılış ekranı kaynağı (kare)
//   kaynak/tanitim-1024x500.png       Play Store tanıtım görseli (feature graphic)
//   android/app/src/main/res/...      mipmap-* simgeleri ve drawable-* açılış görselleri
'use strict';

var fs = require('fs');
var path = require('path');

var PW = process.env.PLAYWRIGHT_CORE || '/opt/node-tools/node_modules/playwright-core';
var CHROMIUM = process.env.CHROMIUM_YOLU || '/opt/pw-browsers/chromium';

var BURASI = __dirname;
var KAYNAK = path.join(BURASI, 'kaynak');
var RES = path.join(BURASI, 'android', 'app', 'src', 'main', 'res');

var RENK = {
  zemin: '#0b1220',
  zeminAcik: '#16244a',
  cyan: '#5ac8fa',
  mor: '#b39dfa',
  duvar: '#15223d',
  metin: '#e8ecf1'
};

// ---------------------------------------------------------------------------------
// SVG parçaları. Amblem 1000x1000'lik bir birim kutuda çizilir (merkez 500,500).
// ---------------------------------------------------------------------------------
function tanimlar(on) {
  // on: kimlik çakışmasın diye önek
  return '' +
    '<defs>' +
    '<linearGradient id="' + on + 'neon" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="' + RENK.cyan + '"/><stop offset="1" stop-color="' + RENK.mor + '"/></linearGradient>' +
    '<linearGradient id="' + on + 'neonD" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="' + RENK.cyan + '"/><stop offset="1" stop-color="' + RENK.mor + '"/></linearGradient>' +
    '<linearGradient id="' + on + 'duvar" x1="0" y1="0" x2="1" y2="0">' +
    '<stop offset="0" stop-color="#1b2b4d"/><stop offset="1" stop-color="#111b33"/></linearGradient>' +
    '<radialGradient id="' + on + 'top" cx="0.36" cy="0.32" r="0.8">' +
    '<stop offset="0" stop-color="#ffffff"/><stop offset="0.28" stop-color="#bdeaff"/>' +
    '<stop offset="0.7" stop-color="' + RENK.cyan + '"/><stop offset="1" stop-color="#2f7fb8"/></radialGradient>' +
    '<radialGradient id="' + on + 'hale" cx="0.5" cy="0.5" r="0.5">' +
    '<stop offset="0" stop-color="' + RENK.cyan + '" stop-opacity="0.55"/>' +
    '<stop offset="0.55" stop-color="' + RENK.mor + '" stop-opacity="0.18"/>' +
    '<stop offset="1" stop-color="' + RENK.mor + '" stop-opacity="0"/></radialGradient>' +
    '<filter id="' + on + 'isilti" x="-50%" y="-50%" width="200%" height="200%">' +
    '<feGaussianBlur stdDeviation="14" result="b1"/><feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b2"/>' +
    '<feMerge><feMergeNode in="b1"/><feMergeNode in="b2"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
    '<filter id="' + on + 'yumusak" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>' +
    '</defs>';
}

function arkaPlan(on, w, h, izgara) {
  var s = '<rect width="' + w + '" height="' + h + '" fill="' + RENK.zemin + '"/>' +
    '<radialGradient id="' + on + 'zeminIsik" cx="0.5" cy="0.38" r="0.75">' +
    '<stop offset="0" stop-color="' + RENK.zeminAcik + '" stop-opacity="0.95"/>' +
    '<stop offset="1" stop-color="' + RENK.zemin + '" stop-opacity="0"/></radialGradient>' +
    '<rect width="' + w + '" height="' + h + '" fill="url(#' + on + 'zeminIsik)"/>';
  if (izgara) {
    // Oyunun "dots" süslemesini anımsatan seyrek nokta ızgarası
    var adim = Math.round(Math.min(w, h) / 16);
    var noktalar = '';
    for (var y = adim / 2; y < h; y += adim) {
      for (var x = adim / 2; x < w; x += adim) {
        noktalar += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (adim * 0.045).toFixed(2) + '"/>';
      }
    }
    s += '<g fill="#c8dcff" opacity="0.10">' + noktalar + '</g>';
  }
  return s;
}

// Kapı (üst ve alt duvar, aradaki boşluktan geçen top) + kuyruklu zıplama izi.
function amblem(on, kapali) {
  var X = 556, G = 168;            // duvar sol kenarı ve genişliği
  var ustAlt = 356, altUst = 644;  // boşluk: 356..644
  var r = 30;
  function duvar(y1, y2, ustte) {
    var h = y2 - y1;
    var grad = ustte ? on + 'duvarUst' : on + 'duvarAlt';
    var govde = '<rect x="' + X + '" y="' + y1 + '" width="' + G + '" height="' + h + '" rx="' + r + '" fill="url(#' + on + 'duvar)"/>';
    var kenar = '<rect x="' + X + '" y="' + y1 + '" width="' + G + '" height="' + h + '" rx="' + r +
      '" fill="none" stroke="url(#' + grad + ')" stroke-width="18" filter="url(#' + on + 'isilti)"/>';
    // Boşluğa bakan uçta parlak şerit
    var uy = ustte ? y2 - 36 : y1 + 18;
    var serit = '<rect x="' + (X + 26) + '" y="' + uy + '" width="' + (G - 52) + '" height="18" rx="9" fill="#eafaff" filter="url(#' + on + 'isilti)"/>';
    return govde + kenar + serit;
  }
  var gradlar =
    '<linearGradient id="' + on + 'duvarUst" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="' + RENK.mor + '"/><stop offset="1" stop-color="' + RENK.cyan + '"/></linearGradient>' +
    '<linearGradient id="' + on + 'duvarAlt" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="' + RENK.cyan + '"/><stop offset="1" stop-color="' + RENK.mor + '"/></linearGradient>';

  var topX = X + G / 2, topY = 500, topR = 112;

  // Kuyruk: ikinci derece Bezier P0 -> P1 -> topun arkası; kalınlık ve opaklık artarak (kuyruklu yıldız)
  var P0 = [70, 900], P1 = [250, 170], P2 = [topX - 40, topY + 6];
  function nokta(t) {
    return [
      (1 - t) * (1 - t) * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0],
      (1 - t) * (1 - t) * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1]
    ];
  }
  function turev(t) {
    return [
      2 * (1 - t) * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]),
      2 * (1 - t) * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1])
    ];
  }
  // Tek parça, uca doğru incelen dolu çokgen (bantlanma olmasın diye segment yerine)
  var N = 80, sol = [], sag = [];
  for (var i = 0; i <= N; i++) {
    var t = i / N;
    var p = nokta(t), d = turev(t);
    var L = Math.sqrt(d[0] * d[0] + d[1] * d[1]) || 1;
    var nx = -d[1] / L, ny = d[0] / L;
    var yari = 2 + 70 * Math.pow(t, 1.6);
    sol.push((p[0] + nx * yari).toFixed(1) + ',' + (p[1] + ny * yari).toFixed(1));
    sag.unshift((p[0] - nx * yari).toFixed(1) + ',' + (p[1] - ny * yari).toFixed(1));
  }
  gradlar += '<linearGradient id="' + on + 'iz" gradientUnits="userSpaceOnUse" x1="' + P0[0] + '" y1="' + P0[1] + '" x2="' + P2[0] + '" y2="' + P2[1] + '">' +
    '<stop offset="0" stop-color="' + RENK.mor + '" stop-opacity="0"/>' +
    '<stop offset="0.45" stop-color="' + RENK.mor + '" stop-opacity="0.35"/>' +
    '<stop offset="1" stop-color="' + RENK.cyan + '" stop-opacity="0.85"/></linearGradient>';
  var iz = '<polygon points="' + sol.concat(sag).join(' ') + '" fill="url(#' + on + 'iz)"/>';

  var top =
    '<circle cx="' + topX + '" cy="' + topY + '" r="' + (topR * 2.2) + '" fill="url(#' + on + 'hale)"/>' +
    '<circle cx="' + topX + '" cy="' + topY + '" r="' + topR + '" fill="url(#' + on + 'top)" filter="url(#' + on + 'isilti)"/>' +
    '<circle cx="' + (topX - 38) + '" cy="' + (topY - 42) + '" r="24" fill="#ffffff" opacity="0.9"/>';

  return '<defs>' + gradlar + '</defs><g>' +
    '<g filter="url(#' + on + 'isilti)">' + iz + '</g>' +
    (kapali ? duvar(40, ustAlt, true) + duvar(altUst, 960, false)
            : duvar(-60, ustAlt, true) + duvar(altUst, 1060, false)) +
    top +
    '</g>';
}

function karistir(c1, c2, k) {
  function h(c) { return [1, 3, 5].map(function (i) { return parseInt(c.substr(i, 2), 16); }); }
  var a = h(c1), b = h(c2);
  return '#' + a.map(function (v, i) {
    var x = Math.round(v + (b[i] - v) * k).toString(16);
    return x.length < 2 ? '0' + x : x;
  }).join('');
}

// Amblemi (1000 birim) hedef tuvalde (cx,cy) merkezli, 'boy' piksel genişliğe ölçekler.
// kapali: duvarlar kenara taşmaz, iki ucu yuvarlatılmış kapalı sütun olur (açılış ekranı için).
function amblemYerlestir(on, cx, cy, boy, kapali) {
  var k = boy / 1000;
  var tx = cx - 500 * k, ty = cy - 500 * k;
  return '<g transform="translate(' + tx.toFixed(2) + ' ' + ty.toFixed(2) + ') scale(' + k.toFixed(5) + ')">' +
    amblem(on, !!kapali) + '</g>';
}

function svgSar(w, h, govde) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' + govde + '</svg>';
}

// ---- Sahneler -------------------------------------------------------------------
function tamIkon(S) {
  // Kenara kadar: duvarlar üstten ve alttan taşar (kare içinde kırpılır)
  return svgSar(S, S, tanimlar('a') + arkaPlan('a', S, S, true) + amblemYerlestir('a', S * 0.5, S * 0.5, S * 0.98, false));
}
function yuvarlakIkon(S) {
  return svgSar(S, S, tanimlar('r') +
    '<clipPath id="daire"><circle cx="' + S / 2 + '" cy="' + S / 2 + '" r="' + S / 2 + '"/></clipPath>' +
    '<g clip-path="url(#daire)">' + arkaPlan('r', S, S, true) + amblemYerlestir('r', S * 0.5, S * 0.5, S * 0.98, false) + '</g>');
}
function onPlan(S) {
  // Uyarlanabilir simge: 108dp tuvalin ortadaki 66dp'lik güvenli alanı (~%61) — amblem buna sığar,
  // duvarlar maske kenarına doğru uzar (kırpılsa da anlam kaybolmaz).
  return svgSar(S, S, tanimlar('f') + amblemYerlestir('f', S * 0.5, S * 0.5, S * 0.64, false));
}
function arkaPlanIkon(S) {
  return svgSar(S, S, tanimlar('b') + arkaPlan('b', S, S, true));
}
function yaziIsareti(on, x, y, boyut, hiza) {
  return '<text x="' + x + '" y="' + y + '" text-anchor="' + (hiza || 'middle') + '" ' +
    'font-family="ui-rounded, \'SF Pro Rounded\', \'Nunito\', \'Segoe UI\', system-ui, sans-serif" font-weight="900" ' +
    'font-size="' + boyut + '" letter-spacing="' + (boyut * 0.06).toFixed(1) + '" fill="url(#' + on + 'neon)" ' +
    'filter="url(#' + on + 'isilti)">BOPGATE</text>';
}
function acilis(w, h) {
  var m = Math.min(w, h);
  var boy = m * 0.34;
  var cy = h * 0.45;
  return svgSar(w, h, tanimlar('s') + arkaPlan('s', w, h, false) +
    amblemYerlestir('s', w / 2, cy, boy, true) +
    yaziIsareti('s', w / 2, cy + boy * 0.5 + m * 0.11, Math.round(m * 0.075)));
}
function tanitim(w, h) {
  return svgSar(w, h, tanimlar('t') + arkaPlan('t', w, h, true) +
    // Sağda büyük amblem
    amblemYerlestir('t', w * 0.79, h * 0.5, h * 1.0, false) +
    yaziIsareti('t', w * 0.07, h * 0.53, Math.round(h * 0.17), 'start') +
    '<text x="' + (w * 0.075) + '" y="' + (h * 0.67) + '" font-family="ui-rounded, \'Segoe UI\', system-ui, sans-serif" ' +
    'font-weight="700" font-size="' + Math.round(h * 0.062) + '" fill="#9fb3d1" letter-spacing="2">Bas · sek · kapıdan geç</text>');
}

// ---- Çizim ----------------------------------------------------------------------
async function main() {
  var chromium = require(PW).chromium;
  var tarayici = await chromium.launch({ executablePath: CHROMIUM });
  var sayfa = await tarayici.newPage({ deviceScaleFactor: 1 });

  async function ciz(svg, w, h, dosya, saydam) {
    await sayfa.setViewportSize({ width: w, height: h });
    await sayfa.setContent('<!doctype html><html><head><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}svg{display:block}</style></head><body>' + svg + '</body></html>');
    fs.mkdirSync(path.dirname(dosya), { recursive: true });
    await sayfa.screenshot({ path: dosya, clip: { x: 0, y: 0, width: w, height: h }, omitBackground: !!saydam });
    console.log('  ' + path.relative(BURASI, dosya) + ' (' + w + 'x' + h + ')');
  }

  console.log('Kaynak görseller:');
  await ciz(tamIkon(1024), 1024, 1024, path.join(KAYNAK, 'ikon-1024.png'));
  await ciz(tamIkon(512), 512, 512, path.join(KAYNAK, 'ikon-512.png'));
  await ciz(onPlan(1024), 1024, 1024, path.join(KAYNAK, 'ikon-on-plan-1024.png'), true);
  await ciz(arkaPlanIkon(1024), 1024, 1024, path.join(KAYNAK, 'ikon-arka-plan-1024.png'));
  await ciz(acilis(2732, 2732), 2732, 2732, path.join(KAYNAK, 'acilis-2732.png'));
  await ciz(tanitim(1024, 500), 1024, 500, path.join(KAYNAK, 'tanitim-1024x500.png'));

  if (fs.existsSync(RES)) {
    console.log('Android kaynakları:');
    var yogunluk = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
    for (var ad in yogunluk) {
      var k = yogunluk[ad];
      var d = path.join(RES, 'mipmap-' + ad);
      await ciz(tamIkon(48 * k), 48 * k, 48 * k, path.join(d, 'ic_launcher.png'));
      await ciz(yuvarlakIkon(48 * k), 48 * k, 48 * k, path.join(d, 'ic_launcher_round.png'), true);
      await ciz(onPlan(108 * k), 108 * k, 108 * k, path.join(d, 'ic_launcher_foreground.png'), true);
      await ciz(arkaPlanIkon(108 * k), 108 * k, 108 * k, path.join(d, 'ic_launcher_background.png'));
    }
    // Açılış (Android 11 ve öncesi; 12+ sistem açılışı simgeyi kullanır)
    var acilisBoy = {
      'drawable': [480, 320],
      'drawable-port-mdpi': [320, 480], 'drawable-port-hdpi': [480, 800], 'drawable-port-xhdpi': [720, 1280],
      'drawable-port-xxhdpi': [960, 1600], 'drawable-port-xxxhdpi': [1280, 1920],
      'drawable-land-mdpi': [480, 320], 'drawable-land-hdpi': [800, 480], 'drawable-land-xhdpi': [1280, 720],
      'drawable-land-xxhdpi': [1600, 960], 'drawable-land-xxxhdpi': [1920, 1280]
    };
    for (var klasor in acilisBoy) {
      var b = acilisBoy[klasor];
      await ciz(acilis(b[0], b[1]), b[0], b[1], path.join(RES, klasor, 'splash.png'));
    }
  } else {
    console.log('(android/ yok — yalnızca kaynak/ üretildi)');
  }

  await tarayici.close();
}

main().catch(function (e) {
  console.error('ikon-uret HATA:', e && e.message ? e.message : e);
  process.exit(1);
});
