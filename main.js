// Sekme Gücü — döngü, girdi, ses, efektler; logic + render'ı bağlar
//
// Akış (phase): ready → playing ⇄ paused → over → (dokun/R) → playing  (oyun sonsuz; kazanma yok)
// Mobil: ekranın her yeri dokunma alanıdır; parmak canvas dışına kayınca da bırakma
// algılanır; sekme arka plana geçince oyun kendiliğinden duraklar.
// Tarayıcıda bütün betikler aynı genel kapsamı paylaşır; aynı adlı değişken ve
// fonksiyonlar birbirini ezmesin diye dosya kendi kapsamında çalışır. Dışarıya yalnız
// window.Game* ve module.exports çıkar.
(function () {

var RESTART_LOCK_MS = 450; // ölümden hemen sonraki dokunuş yanlışlıkla yeniden başlatmasın
var SHAKE_MS = 180;
var SQUASH_MS = 120;
var TRAIL_LEN = 10;
var RING_S = 0.35; // kapı geçiş halkasının ömrü (sn)
var POP_S = 0.25;  // skor sıçramasının süresi (sn)
var REVIVE_MS = 5000; // ölünce "★ ile devam" teklifinin süresi

// Dil: i18n.js yüklüyse çevirir, değilse Türkçe metni parametreleriyle doldurur
function L(s, p) {
  var I = typeof window !== 'undefined' && window.GameI18n;
  if (I) return I.L(s, p);
  return String(s).replace(/\{(\w+)\}/g, function (m, k) { return p && p[k] != null ? String(p[k]) : m; });
}

function bootstrap() {
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var DT = 1 / 60;
  var C = window.GameLogic.CONST;

  // Keskin çizim: canvas'ın piksel boyutu ekran yoğunluğuna göre, görünen boyutu CSS'ten.
  var dpr = Math.min(3, Math.max(1, (window.devicePixelRatio || 1)));
  canvas.width = Math.round(C.CANVAS_W * dpr);
  canvas.height = Math.round(C.CANVAS_H * dpr);

  // Dikey ekran: görünür alanın oranına göre mantıksal yükseklik (540–1000). Yalnız yeni
  // oyunda değişir; oyun sürerken ekran dönerse alan sabit kalır, CSS yalnız ölçekler.
  var HUD_PX = 76; // alttaki ipucu + mağaza düğmesi için ayrılan yer
  function desiredHeight() {
    var w = window.innerWidth, h = window.innerHeight;
    if (!w || !h) return C.CANVAS_H;
    var availW = Math.min(w * 0.98, 760);
    var availH = Math.max(200, h - HUD_PX);
    return Math.round(C.CANVAS_W * availH / availW);
  }
  function applyCanvasHeight(H) {
    canvas.height = Math.round(H * dpr);
    if (canvas.style && canvas.style.setProperty) canvas.style.setProperty('--h', String(H));
  }

  var touch = false;
  var input = { action: false };
  // Ses ayarları (müzik / efekt ayrı; M ikisini birden açar-kapatır)
  var Snd = window.GameAudio || null;
  var sound = Snd ? Snd.load(window.localStorage) : { music: true, sfx: true };
  var muted = !sound.sfx && !sound.music;
  var best = 0;
  // Mağaza profili (cüzdan + sahip olunan/kuşanılan görünümler)
  var Shop = window.GameShop || null;
  var profile = Shop ? Shop.load(window.localStorage) : null;
  var earned = 0;
  var settled = false;
  var shopOpen = false;
  // Günlük görevler ve giriş serisi
  var Quests = window.GameQuests || null;
  var daily = Quests && profile ? Quests.load(window.localStorage) : null;
  var questDone = [];
  var notice = '';
  // Gerçek para ve ödüllü reklam (monetize.js). Android'de window.BopgateNative, tarayıcıda kapalı;
  // ?demo-odeme ile sahte sağlayıcı (gerçek para yok). Testler window.BopgateTestProvider verebilir.
  var Mon = window.GameMonetize || null;
  var prov = null;
  var prices = {};
  if (Mon && profile) {
    var demo = false;
    try { demo = /[?&]demo-odeme/.test(window.location.search || ''); } catch (e) {}
    prov = window.BopgateTestProvider || (window.BopgateNative ? Mon.provider(window.BopgateNative)
      : demo ? Mon.mockProvider() : Mon.provider(null));
    if (prov.canBuy) {
      prov.products(Mon.ids()).then(function (list) {
        (list || []).forEach(function (it) { if (it && it.id) prices[it.id] = it.price; });
        if (shopOpen) renderShop();
      });
      // Yeniden kurulumda / başka cihazda alınmış ürünler: eksik hakları uygula
      prov.restore().then(function (list) {
        var changed = false;
        (list || []).forEach(function (id) { if (Mon.grant(Shop, profile, id)) changed = true; });
        if (changed) { Shop.save(window.localStorage, profile); if (shopOpen) renderShop(); }
      });
    }
  }
  function todayKey() { return Quests ? Quests.dayKey(new Date()) : ''; }
  function checkDay() {
    if (!daily) return;
    var lr = Quests.ensureDay(daily, Quests.dayKey(new Date()));
    if (lr.coins > 0) {
      profile.coins += lr.coins;
      notice = L('Günlük ödül: +{n} ★', { n: lr.coins }) + (lr.streak > 1 ? L('  ({n}. gün üst üste)', { n: lr.streak }) : '');
      Shop.save(window.localStorage, profile);
    }
    Quests.save(window.localStorage, daily);
  }
  checkDay();
  try {
    var saved = window.localStorage.getItem('sekmeguc-best');
    if (saved) best = parseInt(saved, 10) || 0;
  } catch (e) {}

  var audioCtx = null;
  function ensureAudio() {
    if (audioCtx) return audioCtx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
    } catch (e) {
      audioCtx = null;
    }
    return audioCtx;
  }
  // Tek nota: when (AudioContext zamanı) anında başlar, dur saniyede söner; to verilirse frekans kayar
  function tone(freq, dur, type, when, vol, to) {
    var ac = ensureAudio();
    if (!ac) return;
    try {
      if (ac.state === 'suspended' && ac.resume) ac.resume();
      var t0 = Math.max(ac.currentTime, when || 0);
      var osc = ac.createOscillator();
      var gain = ac.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
      gain.gain.setValueAtTime(vol || 0.08, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch (e) {}
  }
  function beep(freq, dur, type) {
    if (!sound.sfx) return;
    tone(freq, dur, type, 0, 0.08);
  }
  // audio.js efekt tablosundan bir efekt çal
  function sfx(name) {
    if (!sound.sfx || !Snd || !Snd.SFX[name]) return;
    var ac = ensureAudio();
    if (!ac) return;
    var list = Snd.SFX[name];
    for (var i = 0; i < list.length; i++) {
      var n = list[i];
      tone(n.f, n.d, n.type, ac.currentTime + n.at, 0.08, n.to);
    }
  }
  // Müzik: oyun sürerken ileriye bakan sıralayıcı ~150 ms önden nota kurar
  var MUSIC_VOL = { bass: 0.05, arp: 0.018, lead: 0.035 };
  var seq = null;
  function musicTick() {
    var ac = audioCtx;
    if (!Snd || !ac || !sound.music || phase !== 'playing' || ac.state !== 'running') { seq = null; return; }
    if (!seq) seq = Snd.createSequencer(ac.currentTime + 0.05);
    var mapId = profile ? profile.equipped.map : 'gece';
    Snd.pump(seq, ac.currentTime, 0.15, mapId, state.level, function (n, t, d) {
      tone(n.freq, Math.max(0.05, d * 0.9), n.type, t, MUSIC_VOL[n.ch] || 0.03);
    });
  }
  function setSound(next) {
    sound = next;
    muted = !sound.sfx && !sound.music;
    if (Snd) Snd.save(window.localStorage, sound);
    if (!sound.music) seq = null;
    updateSoundBtns();
  }
  var sesBtn = document.getElementById('sesBtn');
  var muzikBtn = document.getElementById('muzikBtn');
  function updateSoundBtns() {
    if (sesBtn) { sesBtn.textContent = sound.sfx ? '🔊' : '🔇'; sesBtn.setAttribute('aria-pressed', String(sound.sfx)); sesBtn.title = L('Efekt sesleri: {d}', { d: L(sound.sfx ? 'açık' : 'kapalı') }); }
    if (muzikBtn) { muzikBtn.textContent = '🎵'; muzikBtn.className = sound.music ? '' : 'kapali'; muzikBtn.setAttribute('aria-pressed', String(sound.music)); muzikBtn.title = L('Müzik: {d}', { d: L(sound.music ? 'açık' : 'kapalı') }); }
  }
  if (sesBtn) sesBtn.addEventListener('click', function () { ensureAudio(); setSound({ music: sound.music, sfx: !sound.sfx }); sfx('buy'); });
  if (muzikBtn) muzikBtn.addEventListener('click', function () { ensureAudio(); setSound({ music: !sound.music, sfx: sound.sfx }); });
  updateSoundBtns();
  // Dil: sayfadaki sabit metinler (data-i18n) ve dil düğmesi; canvas her karede yeniden çizildiği için kendiliğinden güncellenir
  var I18n = window.GameI18n || null;
  var dilBtn = document.getElementById('dilBtn');
  function applyLang() {
    if (!I18n) return;
    if (document.documentElement) document.documentElement.lang = I18n.getLang();
    var els = document.querySelectorAll ? document.querySelectorAll('[data-i18n]') : [];
    for (var di = 0; di < els.length; di++) els[di].textContent = L(els[di].getAttribute('data-i18n'));
    var aria = document.querySelectorAll ? document.querySelectorAll('[data-i18n-aria]') : [];
    for (var da = 0; da < aria.length; da++) aria[da].setAttribute('aria-label', L(aria[da].getAttribute('data-i18n-aria')));
    if (dilBtn) dilBtn.textContent = I18n.getLang().toUpperCase();
    updateSoundBtns();
  }
  if (dilBtn) dilBtn.addEventListener('click', function () {
    if (!I18n) return;
    I18n.setLang(I18n.getLang() === 'tr' ? 'en' : 'tr', window.localStorage);
    applyLang();
    if (shopOpen) renderShop();
  });
  applyLang();
  function buzz(ms) {
    if (muted) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
    } catch (e) {}
  }

  // Efekt durumu — oyun mantığından ayrı; testler mantığı bundan bağımsız doğrular.
  var fx = { particles: [], shake: 0, squash: 0, trail: [], rings: [], scorePop: 0 };
  var popLeft = 0;
  var shakeLeft = 0;
  var squashLeft = 0;
  function burst(x, y, n, color, speed) {
    for (var i = 0; i < n; i++) {
      var ang = Math.random() * Math.PI * 2;
      var sp = speed * (0.4 + Math.random() * 0.6);
      fx.particles.push({ x: x, y: y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0.5, max: 0.5, color: color });
    }
    if (fx.particles.length > 160) fx.particles.splice(0, fx.particles.length - 160);
  }
  function updateFx(dt) {
    var kept = [];
    for (var i = 0; i < fx.particles.length; i++) {
      var p = fx.particles[i];
      p.life -= dt;
      if (p.life <= 0) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 600 * dt;
      kept.push(p);
    }
    fx.particles = kept;
    var ringsKept = [];
    for (var r = 0; r < fx.rings.length; r++) {
      fx.rings[r].life -= dt;
      if (fx.rings[r].life > 0) ringsKept.push(fx.rings[r]);
    }
    fx.rings = ringsKept;
    popLeft = Math.max(0, popLeft - dt);
    fx.scorePop = popLeft / POP_S;
    shakeLeft = Math.max(0, shakeLeft - dt * 1000);
    squashLeft = Math.max(0, squashLeft - dt * 1000);
    fx.shake = shakeLeft / SHAKE_MS;
    fx.squash = squashLeft / SQUASH_MS;
  }

  function skinColor() { return profile ? Shop.equippedBall(profile).color : '#5ac8fa'; }
  function themeEdge() { return profile ? Shop.equippedMap(profile).c.edge : '#5ac8fa'; }

  function newGame() {
    var seed = Date.now() % 2147483647;
    var st = window.GameLogic.createState(seed, { height: desiredHeight(), mods: profile ? Shop.mods(profile) : null });
    applyCanvasHeight(st.geo.H);
    return st;
  }

  var state = newGame();
  var phase = 'ready';
  var overAt = 0;
  var newBest = false;
  var prevBounces = state.bounces;
  var prevScore = state.score;
  var prevLevel = state.level;
  var prevStars = state.stars;
  var prevShieldUsed = state.shieldUsed;
  var prevPowers = state.powers;
  var prevMilestones = state.milestones;
  var banner = { title: L('Bölüm {n}', { n: 1 }), sub: '', a: 0 };

  function nowMs() { return Date.now(); }

  function startPlaying() {
    if (phase === 'ready') banner = { title: L('Bölüm {n}', { n: 1 }), sub: '', a: 1.4 };
    phase = 'playing';
    ensureAudio();
  }
  function restart() {
    settle(true); // devam teklifi açıkken yeniden başlanırsa ödül yine de yazılsın
    earned = 0;
    settled = false;
    runReward = 0;
    doubled = false;
    adRevived = false;
    adBusy = false;
    questDone = [];
    notice = '';
    checkDay();
    state = newGame();
    prevBounces = state.bounces;
    prevScore = state.score;
    prevLevel = state.level;
    prevStars = state.stars;
    prevShieldUsed = state.shieldUsed;
    prevPowers = state.powers;
    prevMilestones = state.milestones;
    banner = { title: L('Bölüm {n}', { n: 1 }), sub: '', a: 1.4 };
    newBest = false;
    fx.particles = [];
    fx.trail = [];
    fx.rings = [];
    popLeft = 0;
    shakeLeft = 0;
    squashLeft = 0;
    startPlaying();
  }
  function canRestart() {
    return nowMs() - overAt >= RESTART_LOCK_MS;
  }

  // Ortak "bas" ve "bırak" — klavye ve dokunuş aynı yoldan geçer.
  function press() {
    if (shopOpen) return;
    if (phase === 'ready' || phase === 'paused') { startPlaying(); input.action = true; return; }
    if (phase === 'over' || phase === 'won') { if (canRestart()) { restart(); input.action = true; } return; }
    input.action = true;
  }
  function release() {
    input.action = false;
  }

  function onKeyDown(e) {
    if (shopOpen) {
      if (e.code === 'Escape') { e.preventDefault(); closeShop(); }
      return;
    }
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      if (e.repeat) return;
      press();
    } else if (e.code === 'KeyR') {
      e.preventDefault();
      restart(); // R bilinçli bir tuş: kilit uygulanmaz
    } else if (e.code === 'KeyC' || e.code === 'Enter') {
      e.preventDefault();
      doRevive();
    } else if (e.code === 'KeyM') {
      e.preventDefault();
      setSound(muted ? { music: true, sfx: true } : { music: false, sfx: false });
    } else if (e.code === 'KeyP' || e.code === 'Escape') {
      e.preventDefault();
      if (phase === 'playing') pause();
      else if (phase === 'paused') startPlaying();
    }
  }
  function onKeyUp(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      release();
    }
  }
  function onPointerDown(e) {
    // Mağaza düğmesi ve paneli oyun girdisi değildir
    if (e.target && e.target.closest && e.target.closest('[data-ui]')) return;
    if (e.pointerType === 'touch' || e.pointerType === 'pen') touch = true;
    if (e.cancelable) e.preventDefault();
    press();
  }
  function onPointerUp(e) {
    if (e && e.cancelable) e.preventDefault();
    release();
  }
  // --- Mağaza arayüzü (index.html'de #magaza ve #magazaBtn varsa) ----------------
  var shopEl = document.getElementById('magaza');
  var shopBtn = document.getElementById('magazaBtn');
  var shopTab = 'ball';
  // Ölünce devam hakkı: yıldız yetiyorsa REVIVE_MS boyunca ❤ Devam düğmesi görünür.
  // Teklif açıkken ödül yazılmaz (koşu sürebilir); süre dolunca ya da yeniden başlayınca yazılır.
  var devamBtn = document.getElementById('devamBtn');
  var reklamDevamBtn = document.getElementById('reklamDevamBtn');
  var ikiKatBtn = document.getElementById('ikiKatBtn');
  var runReward = 0;     // koşunun kendi ödülü (görevler hariç): ★ x2 bunu bir kez daha verir
  var doubled = false;
  var adRevived = false; // reklamla bedava devam: koşu başına 1
  var adBusy = false;    // reklam gösterilirken teklif kapanmasın, ödül yazılmasın
  function adsUsable() { return !!(Mon && prov && (Mon.hasNoAds(profile) || prov.canAds)); }
  function starReviveOk() { return Shop.canRevive(profile, state.revives); }
  function adReviveOk() { return adsUsable() && !adRevived && (state.revives || 0) < Shop.REVIVE_MAX; }
  function reviveOpen() {
    if (!profile || settled || state.status !== 'over') return false;
    if (adBusy) return true;
    return (starReviveOk() || adReviveOk()) && nowMs() - overAt < REVIVE_MS;
  }
  function doRevive(free) {
    if (!reviveOpen()) return false;
    if (free !== true && !Shop.payRevive(profile, state.revives)) return false;
    Shop.save(window.localStorage, profile);
    window.GameLogic.revive(state);
    var left = Shop.REVIVE_MAX - state.revives;
    banner = { title: L('Devam!'), sub: left > 0 ? L('Bu koşuda {n} devam hakkın kaldı', { n: left }) : L('Bu koşudaki son devam hakkı'), a: 1.8 };
    sfx('level');
    burst(C.BALL_X, state.y, 24, '#ff7a90', 260);
    input.action = false;
    acc = 0;
    phase = 'playing';
    return true;
  }
  if (devamBtn) devamBtn.addEventListener('click', function () { doRevive(false); });
  function adRevive() {
    if (adBusy || !reviveOpen() || !adReviveOk()) return;
    adBusy = true;
    Mon.rewardedOrSkip(prov, profile, 'devam').then(function (r) {
      adBusy = false;
      // Reklam uzun sürebilir (teklif süresinden uzun): izlendiyse teklif süresi tazelenir.
      // Hak ancak devam gerçekten olunca harcanır.
      if (r && r.rewarded) { overAt = nowMs(); if (doRevive(true)) adRevived = true; }
      else overAt = Math.max(overAt, nowMs() - REVIVE_MS + 2000); // izlenmediyse 2 sn daha süre
    });
  }
  if (reklamDevamBtn) reklamDevamBtn.addEventListener('click', adRevive);
  function canDouble() {
    return settled && !doubled && !adBusy && runReward > 0 && adsUsable() && Mon.x2Left(profile, todayKey()) > 0 &&
      (state.status === 'over' || state.status === 'won');
  }
  function doubleStars() {
    if (!canDouble()) return;
    adBusy = true;
    Mon.rewardedOrSkip(prov, profile, 'iki_kat').then(function (r) {
      adBusy = false;
      if (!r || !r.rewarded || doubled || !Mon.useX2(profile, todayKey())) return;
      doubled = true;
      profile.coins += runReward;
      earned += runReward;
      Shop.save(window.localStorage, profile);
      sfx('quest');
      burst(C.BALL_X, state.y, 30, '#ffd166', 300);
    });
  }
  if (ikiKatBtn) ikiKatBtn.addEventListener('click', doubleStars);
  function settle(force) {
    if (!profile || settled || (state.status !== 'over' && state.status !== 'won')) return;
    if (!force && reviveOpen()) return;
    settled = true;
    earned = Shop.reward(state);
    runReward = earned;
    if (daily) {
      questDone = Quests.applyRun(daily, state);
      for (var qi = 0; qi < questDone.length; qi++) earned += questDone[qi].reward;
      Quests.save(window.localStorage, daily);
      if (questDone.length) sfx('quest');
    }
    profile.coins += earned;
    Shop.save(window.localStorage, profile);
  }
  function preview(item, kind) {
    var cv = document.createElement('canvas');
    var pr = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
    cv.width = 76 * pr; cv.height = 55 * pr;
    cv.className = 'onizleme';
    var c2 = cv.getContext('2d');
    c2.scale(pr, pr);
    var theme = kind === 'map' ? item : Shop.equippedMap(profile);
    c2.fillStyle = theme.c.bg; c2.fillRect(0, 0, 76, 55);
    c2.save(); c2.scale(76 / 520, 55 / 540); window.GameRender.drawDeco(c2, theme, 0, window.GameRender.DEFAULT_GEO);
    if (kind === 'map') {
      c2.fillStyle = theme.c.wall; c2.fillRect(300, 30, 40, 150); c2.fillRect(300, 330, 40, 150);
      c2.shadowColor = theme.c.edge; c2.shadowBlur = 8;
      c2.fillStyle = theme.c.edge; c2.fillRect(292, 170, 56, 12); c2.fillRect(292, 330, 56, 12);
      c2.fillRect(0, 478, 520, 6);
      c2.shadowBlur = 0;
    }
    c2.restore();
    var skin = kind === 'ball' ? item : Shop.equippedBall(profile);
    c2.save(); c2.translate(kind === 'ball' ? 38 : 22, 27); window.GameRender.drawBall(c2, skin.shape, kind === 'ball' ? 13 : 7, skin.color, { shine: true, glow: 10 }); c2.restore();
    return cv;
  }
  function renderQuests(list) {
    var head = document.createElement('p');
    head.className = 'seri';
    head.textContent = daily.streak > 0
      ? L('Giriş serisi: {n} gün · yarın gelirsen +{r} ★', { n: daily.streak, r: Quests.loginRewardFor(daily.streak + 1) })
      : L('Her gün ilk açılışta yıldız kazanırsın.');
    list.appendChild(head);
    daily.quests.forEach(function (q) {
      var row = document.createElement('div');
      row.className = 'gorev' + (q.done ? ' bitti' : '');
      var name = document.createElement('span');
      name.className = 'ad';
      name.textContent = (q.done ? '✓ ' : '') + Quests.describe(q);
      var bar = document.createElement('div');
      bar.className = 'cubuk';
      var fill = document.createElement('i');
      fill.style.width = Math.round(100 * q.progress / q.target) + '%';
      bar.appendChild(fill);
      var meta = document.createElement('span');
      meta.className = 'odul';
      meta.textContent = q.progress + '/' + q.target + ' · ★ ' + q.reward;
      row.appendChild(name); row.appendChild(meta); row.appendChild(bar);
      list.appendChild(row);
    });
    var foot = document.createElement('p');
    foot.className = 'not';
    foot.textContent = L('Görevler her gece yarısı yenilenir. Ödül görev bitince kendiliğinden eklenir.');
    list.appendChild(foot);
  }
  function renderUpgrades(list) {
    Shop.UPGRADES.forEach(function (u) {
      var lv = profile.upg[u.id] || 0;
      var max = u.prices.length;
      var row = document.createElement('div');
      row.className = 'urun guc';
      var pips = document.createElement('span');
      pips.className = 'basamak';
      var dots = '';
      for (var i = 0; i < max; i++) dots += i < lv ? '●' : '○';
      pips.textContent = dots;
      var info = document.createElement('div');
      var name = document.createElement('span');
      name.className = 'ad';
      name.textContent = L(u.name);
      var now = document.createElement('span');
      now.className = 'etki';
      now.textContent = lv < max ? L('Sıradaki: {d}', { d: u.desc(u.values[lv + 1]) }) : L('{d} (tam)', { d: u.desc(u.values[lv]) });
      info.appendChild(name); info.appendChild(now);
      var b = document.createElement('button');
      if (lv >= max) { b.textContent = L('Tam'); b.disabled = true; b.className = 'kusanildi'; }
      else { b.textContent = '★ ' + u.prices[lv]; b.disabled = profile.coins < u.prices[lv]; b.className = 'al'; }
      b.addEventListener('click', function () {
        if (!Shop.buyUpgrade(profile, u.id).ok) return;
        Shop.save(window.localStorage, profile);
        sfx('buy');
        renderShop();
      });
      row.appendChild(pips); row.appendChild(info); row.appendChild(b);
      list.appendChild(row);
    });
    var foot = document.createElement('p');
    foot.className = 'not';
    foot.textContent = L('Güçlendirmeler kalıcıdır ve bir sonraki koşudan itibaren geçerlidir. Ölünce ★ {c} ile devam edebilirsin (koşu başına en çok {m}, fiyat her seferinde ikiye katlanır).',
      { c: Shop.reviveCost(0), m: Shop.REVIVE_MAX });
    list.appendChild(foot);
  }
  function renderShop() {
    if (!shopEl || !profile) return;
    shopEl.querySelector('.cuzdan').textContent = '★ ' + profile.coins;
    var tabs = shopEl.querySelectorAll('[data-sekme]');
    for (var t = 0; t < tabs.length; t++) tabs[t].setAttribute('aria-selected', String(tabs[t].getAttribute('data-sekme') === shopTab));
    var list = shopEl.querySelector('.liste');
    list.innerHTML = '';
    if (shopTab === 'quests') { if (daily) renderQuests(list); return; }
    if (shopTab === 'upg') { renderUpgrades(list); return; }
    if (shopTab === 'premium') { renderPremium(list); return; }
    Shop.CATALOG[shopTab].forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'urun';
      row.appendChild(preview(item, shopTab));
      var name = document.createElement('span');
      name.className = 'ad';
      name.textContent = L(item.name);
      row.appendChild(name);
      var b = document.createElement('button');
      var owned = Shop.owns(profile, shopTab, item.id);
      var on = profile.equipped[shopTab] === item.id;
      var prem = Shop.isPremium(item);
      if (prem) row.className += ' premium';
      if (on) { b.textContent = L('Kuşanıldı'); b.disabled = true; b.className = 'kusanildi'; }
      else if (owned) { b.textContent = L('Kuşan'); }
      else if (prem) { b.textContent = '💎 ' + priceText(item.premiumBy[0]); b.disabled = !prov || !prov.canBuy; b.className = 'para'; }
      else { b.textContent = '★ ' + item.price; b.disabled = profile.coins < item.price; b.className = 'al'; }
      b.addEventListener('click', function () {
        if (prem && !Shop.owns(profile, shopTab, item.id)) { buyProduct(item.premiumBy[0], [shopTab, item.id]); return; }
        if (Shop.owns(profile, shopTab, item.id)) Shop.equip(profile, shopTab, item.id);
        else if (!Shop.buy(profile, shopTab, item.id).ok) return;
        Shop.save(window.localStorage, profile);
        sfx('buy');
        renderShop();
      });
      row.appendChild(b);
      list.appendChild(row);
    });
  }
  function priceText(id) {
    if (!prov || !prov.canBuy) return L('Uygulamada');
    return prices[id] || (Mon.product(id) ? Mon.product(id).suggest : '?');
  }
  // equipAfter: [tür, kimlik] — tek ürün alınınca hemen kuşanılsın
  var buying = false;
  function buyProduct(id, equipAfter) {
    if (!prov || !prov.canBuy || buying || Mon.owned(profile, id)) return;
    buying = true;
    prov.buy(id).then(function (r) {
      buying = false;
      if (!r || !r.ok) return;
      Mon.grant(Shop, profile, id);
      if (equipAfter) Shop.equip(profile, equipAfter[0], equipAfter[1]);
      Shop.save(window.localStorage, profile);
      sfx('buy');
      renderShop();
    });
  }
  function renderPremium(list) {
    Mon.PRODUCTS.forEach(function (pr) {
      var row = document.createElement('div');
      row.className = 'urun paket' + (pr.best ? ' en-iyi' : '');
      var icon = document.createElement('span');
      icon.className = 'paket-ikon';
      icon.textContent = pr.grants.noads ? (pr.grants.items ? '👑' : '🚫') : pr.grants.maxUpgrades ? '⚡' : '💎';
      var info = document.createElement('div');
      var name = document.createElement('span');
      name.className = 'ad';
      name.textContent = L(pr.name) + (pr.best ? L('  · en iyi') : '');
      var d = document.createElement('span');
      d.className = 'etki';
      d.textContent = L(pr.desc);
      info.appendChild(name); info.appendChild(d);
      var b = document.createElement('button');
      if (Mon.owned(profile, pr.id)) { b.textContent = L('Sahipsin'); b.disabled = true; b.className = 'kusanildi'; }
      else { b.textContent = priceText(pr.id); b.disabled = !prov || !prov.canBuy; b.className = 'para'; }
      b.addEventListener('click', function () { buyProduct(pr.id, null); });
      row.appendChild(icon); row.appendChild(info); row.appendChild(b);
      list.appendChild(row);
    });
    var foot = document.createElement('p');
    foot.className = 'not';
    foot.textContent = prov && prov.canBuy
      ? L('Tek seferlik satın alımlar; telefon değiştirince geri yüklenir. Yıldız ve görevler gerçek paradan bağımsızdır.')
      : L('Satın alma yalnız Android uygulamasında (Google Play). Tarayıcı sürümünde gerçek para yok.');
    list.appendChild(foot);
    if (prov && prov.canBuy) {
      var rb = document.createElement('button');
      rb.className = 'geri-yukle';
      rb.textContent = L('Satın alımları geri yükle');
      rb.addEventListener('click', function () {
        prov.restore().then(function (ids) {
          var changed = false;
          (ids || []).forEach(function (id) { if (Mon.grant(Shop, profile, id)) changed = true; });
          if (changed) Shop.save(window.localStorage, profile);
          renderShop();
        });
      });
      list.appendChild(rb);
    }
  }
  function openShop(tab) {
    if (!shopEl || phase === 'playing') return;
    if (typeof tab === 'string') shopTab = tab;
    shopOpen = true;
    release();
    shopEl.hidden = false;
    renderShop();
  }
  function closeShop() {
    if (!shopEl) return;
    shopOpen = false;
    shopEl.hidden = true;
  }
  if (shopEl && shopBtn && profile) {
    shopBtn.addEventListener('click', function () { openShop(shopTab === 'quests' ? 'ball' : shopTab); });
    var questBtn = document.getElementById('gorevBtn');
    if (questBtn) questBtn.addEventListener('click', function () { openShop('quests'); });
    shopEl.querySelector('.kapat').addEventListener('click', closeShop);
    var tabEls = shopEl.querySelectorAll('[data-sekme]');
    for (var ti = 0; ti < tabEls.length; ti++) {
      tabEls[ti].addEventListener('click', function (ev) { shopTab = ev.currentTarget.getAttribute('data-sekme'); renderShop(); });
    }
  }

  function pause() {
    if (phase !== 'playing') return;
    phase = 'paused';
    release();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  // Bütün ekran dokunma alanı; bırakma pencere düzeyinde dinlenir ki parmak kayınca kaçmasın.
  window.addEventListener('pointerdown', onPointerDown, { passive: false });
  window.addEventListener('pointerup', onPointerUp, { passive: false });
  window.addEventListener('pointercancel', onPointerUp);
  window.addEventListener('blur', function () { release(); pause(); });
  window.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  window.addEventListener('resize', function () {
    if (phase === 'ready') { state = newGame(); }
  });
  if (document.addEventListener) {
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pause();
    });
  }

  var acc = 0;
  var last = null;

  function frame(ts) {
    if (last === null) last = ts;
    var frameDt = (ts - last) / 1000;
    last = ts;
    if (frameDt > 0.25) frameDt = 0.25;

    if (phase === 'playing') {
      acc += frameDt;
      var steps = 0;
      while (acc >= DT && steps < 5) {
        state = window.GameLogic.step(state, input, DT);
        acc -= DT;
        steps++;

        if (state.bounces !== prevBounces) {
          sfx('bounce');
          squashLeft = SQUASH_MS;
          burst(C.BALL_X, C.FLOOR_Y, 5, skinColor(), 130);
          prevBounces = state.bounces;
        }
        if (state.score !== prevScore) {
          beep(Snd ? Snd.gateFreq(state.score) : 660, 0.08, 'sine');
          buzz(8);
          var edgeCol = themeEdge();
          burst(C.BALL_X, state.y, 10, edgeCol, 220);
          fx.rings.push({ x: C.BALL_X, y: state.y, life: RING_S, max: RING_S, color: edgeCol });
          popLeft = POP_S;
          prevScore = state.score;
        }
        if (state.stars !== prevStars) {
          sfx('star');
          burst(C.BALL_X, state.y, 12, '#ffd166', 200);
          prevStars = state.stars;
        }
        if (state.powers !== prevPowers) {
          var slowNow = state.slowT === C.POWER_SLOW_T; // bu adımda alındıysa süre tam dolu
          sfx(slowNow ? 'slow' : 'small');
          buzz(12);
          burst(C.BALL_X, state.y, 14, slowNow ? '#6fe0ff' : '#ff9df0', 220);
          prevPowers = state.powers;
        }
        if (state.shieldUsed !== prevShieldUsed) {
          sfx('shield');
          buzz(30);
          shakeLeft = SHAKE_MS * 0.6;
          burst(C.BALL_X + 14, state.y, 16, '#ffd166', 260);
          prevShieldUsed = state.shieldUsed;
        }
        if (state.level !== prevLevel) {
          var sub = L(state.level === C.STAR_FROM ? 'Yıldız topla: bir çarpmayı affeder'
            : state.level === C.MOVE_FROM ? 'Mor kapılar hareket eder'
            : state.level === C.PULSE_FROM ? 'Yeşil kapılar daralıp genişler'
            : state.level === C.POWER_FROM ? 'Güçler: ⏱ dünyayı yavaşlatır, pembe top küçültür'
            : state.level === C.DOUBLE_FROM ? 'Çift duvarlar geliyor'
            : state.level === C.SPIKE_FROM ? 'Kırmızı dikenlere sekme: basılı tut, havada kal' : '');
          var milestone = state.milestones !== prevMilestones;
          if (milestone) {
            // Her 10 bölümde bir eşik: büyük kutlama, ödülde +MILESTONE_BONUS
            sub = L('Eşik {n} geçildi! +{b} ★', { n: state.milestones, b: Shop ? Shop.MILESTONE_BONUS : 5 }) + (state.milestones === 1 ? L(' · artık sonsuz: zorluk yavaşça artar') : '');
            prevMilestones = state.milestones;
            sfx('win');
            buzz(40);
            burst(C.BALL_X, state.y, 40, '#ffd166', 360);
          } else {
            sfx('level');
          }
          banner = { title: L('Bölüm {n}', { n: state.level }), sub: sub, a: milestone ? 3 : sub ? 2.2 : 1.4 };
          prevLevel = state.level;
        }
        if (state.status === 'over') {
          sfx('over');
          buzz(60);
          shakeLeft = SHAKE_MS;
          burst(C.BALL_X, state.y, 24, '#e05656', 320);
          if (state.score > best) {
            best = state.score;
            newBest = true;
            try { window.localStorage.setItem('sekmeguc-best', String(best)); } catch (e) {}
          }
          phase = 'over';
          overAt = nowMs();
          input.action = false;
          acc = 0;
          break;
        }
      }
      fx.trail.push({ x: C.BALL_X, y: state.y });
      if (fx.trail.length > TRAIL_LEN) fx.trail.shift();
    } else {
      acc = 0;
    }
    updateFx(frameDt);
    if (banner.a > 0 && phase === 'playing') banner.a = Math.max(0, banner.a - frameDt);

    musicTick();
    settle();
    var rOpen = reviveOpen();
    var secs = Math.max(0, Math.ceil((REVIVE_MS - (nowMs() - overAt)) / 1000));
    if (devamBtn) {
      devamBtn.hidden = !rOpen || adBusy || !starReviveOk();
      if (!devamBtn.hidden) devamBtn.textContent = L('❤ ★ {n} · {s}', { n: Shop.reviveCost(state.revives), s: secs });
    }
    if (reklamDevamBtn) {
      reklamDevamBtn.hidden = !rOpen || adBusy || !adReviveOk();
      if (!reklamDevamBtn.hidden) reklamDevamBtn.textContent = L(Mon.hasNoAds(profile) ? '❤ Bedava · {s}' : '📺 Devam · {s}', { s: secs });
    }
    var dbl = !rOpen && canDouble() && !shopOpen;
    if (ikiKatBtn) {
      ikiKatBtn.hidden = !dbl;
      if (dbl) ikiKatBtn.textContent = L(Mon.hasNoAds(profile) ? '★ x2  +{n}' : '📺 ★ x2  +{n}', { n: runReward });
    }
    var showBtns = !rOpen && !shopOpen && !!profile && (phase === 'ready' || phase === 'over' || phase === 'won') && canRestart();
    if (shopBtn) shopBtn.hidden = !showBtns;
    var qb = document.getElementById('gorevBtn');
    if (qb) {
      qb.hidden = !showBtns || !daily;
      if (daily) {
        var left = 0;
        for (var qn = 0; qn < daily.quests.length; qn++) if (!daily.quests[qn].done) left++;
        qb.textContent = L('📋 Görevler') + (left ? ' (' + left + ')' : ' ✓');
      }
    }
    window.GameRender.draw(ctx, state, {
      best: best, muted: muted, phase: phase, fx: fx, touch: touch, time: ts / 1000,
      newBest: newBest, canRestart: (phase === 'over' || phase === 'won') && canRestart(),
      banner: banner, levelCount: C.LEVEL_COUNT, gatesPerLevel: C.GATES_PER_LEVEL,
      theme: profile ? Shop.equippedMap(profile) : null, skin: profile ? Shop.equippedBall(profile) : null,
      coins: profile && phase !== 'playing' && phase !== 'paused' ? profile.coins : undefined,
      earned: phase === 'over' || phase === 'won' ? earned : 0,
      questDone: phase === 'over' || phase === 'won' ? questDone : [],
      notice: phase === 'ready' ? notice : '',
      revive: rOpen ? { cost: starReviveOk() ? Shop.reviveCost(state.revives) : 0, ad: adReviveOk(), noads: !!(Mon && Mon.hasNoAds(profile)), touch: touch } : null
    });
    window.requestAnimationFrame(frame);
  }

  window.requestAnimationFrame(frame);
}

if (typeof window !== 'undefined') {
  window.GameMain = { bootstrap: bootstrap };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
}
if (typeof module !== 'undefined') module.exports = { bootstrap: bootstrap };
})();
