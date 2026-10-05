// Bopgate — Play Store ekran görüntüleri (1080×1920, TR ve EN)
//
// Kullanım (depo kökünde, önce `node build-single.js`):
//   PLAYWRIGHT=/opt/node-tools/node_modules/playwright-core CHROMIUM=/opt/pw-browsers/chromium node magaza/ekran-goruntusu-uret.js
// Çıktı: magaza/ekran/<dil>-<n>-<ad>.png
// Görüntüler gerçek oyun kodundan üretilir: 1 ve 5 gerçek sayfanın kendisi (açılış, mağaza);
// 2–4 oyunun çizim kodu (render.js) ile kurulmuş sahneler + üstte tanıtım başlığı.
var path = require('path');
var fs = require('fs');
var pw = require(process.env.PLAYWRIGHT || 'playwright-core');

var ROOT = path.join(__dirname, '..');
var GAME = 'file://' + path.join(ROOT, 'oyun-tek-dosya.html');
var OUT = path.join(__dirname, 'ekran');

var CAPTIONS = {
  tr: ['Basılı tut · yüksel · kapıdan geç', 'Güçler, kalkanlar, hareketli kapılar', 'Rekorunu kır, liderlikte yüksel'],
  en: ['Hold to rise. Slip through the gate.', 'Power-ups, shields, moving gates', 'Beat your best. Climb the leaderboard.']
};

// Sahne: oyunun kendi mantığıyla ilerletilmiş, kapı ve yıldız dolu bir an
function sceneScript(kind, lang, caption) {
  return function (args) {
    var kind = args.kind, lang = args.lang, caption = args.caption;
    var L = window.GameLogic, R = window.GameRender, S = window.GameShop, I = window.GameI18n;
    I.setLang(lang, null);
    document.body.innerHTML = '';
    document.body.style.cssText = 'margin:0;background:#05070c;width:360px;height:640px;overflow:hidden;font-family:ui-rounded,system-ui,sans-serif';
    var cap = document.createElement('div');
    cap.textContent = caption;
    cap.style.cssText = 'height:118px;display:flex;align-items:center;justify-content:center;text-align:center;padding:0 22px;box-sizing:border-box;' +
      'font-weight:900;font-size:26px;line-height:1.15;color:#fff;letter-spacing:.01em;' +
      'background:radial-gradient(120% 140% at 50% 0%,#1d2b55 0%,#05070c 75%);text-shadow:0 0 18px rgba(90,200,250,.7)';
    document.body.appendChild(cap);
    var H = Math.round(522 * 520 / 360);
    var cv = document.createElement('canvas');
    cv.width = 520 * 3; cv.height = H * 3;
    cv.style.cssText = 'display:block;width:360px;height:522px';
    document.body.appendChild(cv);
    var theme = S.find('map', kind === 'guc' ? 'nebula' : kind === 'son' ? 'neon' : 'gece');
    var skin = S.find('ball', kind === 'guc' ? 'kristal' : kind === 'son' ? 'alev' : 'klasik');
    var st = L.createState(kind === 'guc' ? 11 : kind === 'son' ? 5 : 3, { height: H, mods: { maxShield: 2, startShield: 1, powerMul: 1, magnet: 1 } });
    st.level = kind === 'guc' ? 6 : 4;
    // Mantığı ilerlet; ölürse sahne için yeniden "oynuyor" say (yalnız görüntü üretimi)
    for (var i = 0; i < (kind === 'guc' ? 420 : 300); i++) {
      L.step(st, { action: (i % 34) < 12 }, 1 / 60);
      if (st.status !== 'playing') { st.status = 'playing'; st.overReason = ''; }
    }
    st.score = kind === 'son' ? 87 : kind === 'guc' ? 46 : 27;
    // Topu önündeki kapının ağzına hizala: tanıtım karesi oyunun anını göstersin
    var next = null;
    for (var j = 0; j < st.obstacles.length; j++) {
      var o = st.obstacles[j];
      if (o.x + 28 > 160 && (!next || o.x < next.x)) next = o;
    }
    if (next) st.y = next.gapY + next.gapH * 0.55;
    st.shield = kind === 'guc' ? 2 : 1;
    if (kind === 'guc') st.slowT = 2.4;
    var trail = [];
    for (var k = 0; k < 10; k++) trail.push({ x: 160, y: st.y + (10 - k) * (10 - k) * 0.9 });
    var view = {
      phase: 'playing', best: kind === 'son' ? 87 : 64, theme: theme, skin: skin, time: 1.4,
      fx: { trail: trail, particles: [], rings: [{ x: 160, y: st.y, life: 0.18, max: 0.35, color: theme.c.edge }], scorePop: 0.4 },
      banner: kind === 'guc' ? { title: I.L('Bölüm {n}', { n: 6 }), sub: I.L('Çift duvarlar geliyor'), a: 1 } : null
    };
    if (kind === 'son') {
      st.status = 'over'; st.overReason = 'Duvara çarptın'; st.milestones = 0;
      view.phase = 'over'; view.newBest = true; view.canRestart = true; view.coins = 1240; view.earned = 34; view.touch = true;
      view.questDone = [{ text: I.L('Bir koşuda {n} kapı geç', { n: 30 }), reward: 8 }];
      view.fx.rings = []; view.fx.trail = [];
    }
    R.draw(cv.getContext('2d'), st, view);
  };
}

(async function () {
  fs.mkdirSync(OUT, { recursive: true });
  var browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
  var made = [];
  for (var lang of ['tr', 'en']) {
    var ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
      locale: lang === 'tr' ? 'tr-TR' : 'en-US' });
    await ctx.addInitScript(function (l) {
      localStorage.setItem('bopgate-dil', l);
      localStorage.setItem('sekmeguc-best', '64');
      localStorage.setItem('sekmeguc-profil', JSON.stringify({ coins: 1240, owned: { ball: ['klasik', 'kor', 'nane', 'kup'], map: ['gece', 'gunbatimi'] },
        equipped: { ball: 'klasik', map: 'gece' }, upg: { kalkan: 1, sure: 1 } }));
    }, lang);
    var errs = [];
    var shot = async function (n, name, fn) {
      var p = await ctx.newPage();
      p.on('pageerror', function (e) { errs.push(String(e)); });
      await p.goto(GAME + '?demo-odeme');
      await p.waitForTimeout(500);
      await fn(p);
      var file = path.join(OUT, lang + '-' + n + '-' + name + '.png');
      await p.screenshot({ path: file });
      made.push(path.relative(ROOT, file));
      await p.close();
    };
    await shot(1, 'acilis', async function () {});
    await shot(2, 'oyun', async function (p) { await p.evaluate(sceneScript(), { kind: 'oyun', lang: lang, caption: CAPTIONS[lang][0] }); });
    await shot(3, 'gucler', async function (p) { await p.evaluate(sceneScript(), { kind: 'guc', lang: lang, caption: CAPTIONS[lang][1] }); });
    await shot(4, 'rekor', async function (p) { await p.evaluate(sceneScript(), { kind: 'son', lang: lang, caption: CAPTIONS[lang][2] }); });
    await shot(5, 'magaza', async function (p) {
      await p.evaluate(function () { document.getElementById('magazaBtn').click(); });
      await p.waitForTimeout(250);
    });
    if (errs.length) throw new Error('sayfa hatası: ' + errs.join(' | '));
    await ctx.close();
  }
  await browser.close();
  console.log(made.join('\n'));
})().catch(function (e) { console.error(e); process.exit(1); });
