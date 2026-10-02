// Sekme Gücü — döngü, girdi, ses, efektler; logic + render'ı bağlar
//
// Akış (phase): ready → playing ⇄ paused → over | won → (dokun/R) → playing
// Mobil: ekranın her yeri dokunma alanıdır; parmak canvas dışına kayınca da bırakma
// algılanır; sekme arka plana geçince oyun kendiliğinden duraklar.
// Tarayıcıda bütün betikler aynı genel kapsamı paylaşır; aynı adlı değişken ve
// fonksiyonlar birbirini ezmesin diye dosya kendi kapsamında çalışır. Dışarıya yalnız
// window.Game* ve module.exports çıkar.
(function () {

var RESTART_LOCK_MS = 450; // ölümden hemen sonraki dokunuş yanlışlıkla yeniden başlatmasın
var SHAKE_MS = 180;
var SQUASH_MS = 120;
var TRAIL_LEN = 6;

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
  var muted = false;
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
  function checkDay() {
    if (!daily) return;
    var lr = Quests.ensureDay(daily, Quests.dayKey(new Date()));
    if (lr.coins > 0) {
      profile.coins += lr.coins;
      notice = 'Günlük ödül: +' + lr.coins + ' ★' + (lr.streak > 1 ? '  (' + lr.streak + '. gün üst üste)' : '');
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
  function beep(freq, dur, type) {
    if (muted) return;
    var ac = ensureAudio();
    if (!ac) return;
    try {
      if (ac.state === 'suspended' && ac.resume) ac.resume();
      var osc = ac.createOscillator();
      var gain = ac.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      gain.gain.value = 0.08;
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
      osc.stop(ac.currentTime + dur);
    } catch (e) {}
  }
  function buzz(ms) {
    if (muted) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
    } catch (e) {}
  }

  // Efekt durumu — oyun mantığından ayrı; testler mantığı bundan bağımsız doğrular.
  var fx = { particles: [], shake: 0, squash: 0, trail: [] };
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
    shakeLeft = Math.max(0, shakeLeft - dt * 1000);
    squashLeft = Math.max(0, squashLeft - dt * 1000);
    fx.shake = shakeLeft / SHAKE_MS;
    fx.squash = squashLeft / SQUASH_MS;
  }

  function newGame() {
    var seed = Date.now() % 2147483647;
    var st = window.GameLogic.createState(seed, { height: desiredHeight() });
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
  var banner = { title: 'Bölüm 1', sub: '', a: 0 };

  function nowMs() { return Date.now(); }

  function startPlaying() {
    if (phase === 'ready') banner = { title: 'Bölüm 1', sub: '', a: 1.4 };
    phase = 'playing';
    ensureAudio();
  }
  function restart() {
    earned = 0;
    settled = false;
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
    banner = { title: 'Bölüm 1', sub: '', a: 1.4 };
    newBest = false;
    fx.particles = [];
    fx.trail = [];
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
    } else if (e.code === 'KeyM') {
      e.preventDefault();
      muted = !muted;
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
  function settle() {
    if (!profile || settled || (state.status !== 'over' && state.status !== 'won')) return;
    settled = true;
    earned = Shop.reward(state);
    if (daily) {
      questDone = Quests.applyRun(daily, state);
      for (var qi = 0; qi < questDone.length; qi++) earned += questDone[qi].reward;
      Quests.save(window.localStorage, daily);
      if (questDone.length) { beep(784, 0.1, 'triangle'); beep(1046, 0.14, 'triangle'); }
    }
    profile.coins += earned;
    Shop.save(window.localStorage, profile);
  }
  function preview(item, kind) {
    var cv = document.createElement('canvas');
    var pr = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
    cv.width = 72 * pr; cv.height = 52 * pr;
    cv.className = 'onizleme';
    var c2 = cv.getContext('2d');
    c2.scale(pr, pr);
    var theme = kind === 'map' ? item : Shop.equippedMap(profile);
    c2.fillStyle = theme.c.bg; c2.fillRect(0, 0, 72, 52);
    c2.save(); c2.scale(72 / 520, 52 / 540); window.GameRender.drawDeco(c2, theme, 0, window.GameRender.DEFAULT_GEO);
    if (kind === 'map') {
      c2.fillStyle = theme.c.wall; c2.fillRect(300, 30, 40, 150); c2.fillRect(300, 330, 40, 150);
      c2.fillStyle = theme.c.edge; c2.fillRect(300, 177, 40, 6); c2.fillRect(300, 330, 40, 6);
    }
    c2.restore();
    var skin = kind === 'ball' ? item : Shop.equippedBall(profile);
    c2.save(); c2.translate(kind === 'ball' ? 36 : 22, 26); window.GameRender.drawBall(c2, skin.shape, kind === 'ball' ? 13 : 7, skin.color); c2.restore();
    return cv;
  }
  function renderQuests(list) {
    var head = document.createElement('p');
    head.className = 'seri';
    head.textContent = daily.streak > 0
      ? 'Giriş serisi: ' + daily.streak + ' gün · yarın gelirsen +' + Quests.loginRewardFor(daily.streak + 1) + ' ★'
      : 'Her gün ilk açılışta yıldız kazanırsın.';
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
    foot.textContent = 'Görevler her gece yarısı yenilenir. Ödül görev bitince kendiliğinden eklenir.';
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
    Shop.CATALOG[shopTab].forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'urun';
      row.appendChild(preview(item, shopTab));
      var name = document.createElement('span');
      name.className = 'ad';
      name.textContent = item.name;
      row.appendChild(name);
      var b = document.createElement('button');
      var owned = Shop.owns(profile, shopTab, item.id);
      var on = profile.equipped[shopTab] === item.id;
      if (on) { b.textContent = 'Kuşanıldı'; b.disabled = true; b.className = 'kusanildi'; }
      else if (owned) { b.textContent = 'Kuşan'; }
      else { b.textContent = '★ ' + item.price; b.disabled = profile.coins < item.price; b.className = 'al'; }
      b.addEventListener('click', function () {
        if (Shop.owns(profile, shopTab, item.id)) Shop.equip(profile, shopTab, item.id);
        else if (!Shop.buy(profile, shopTab, item.id).ok) return;
        Shop.save(window.localStorage, profile);
        beep(880, 0.06, 'triangle');
        renderShop();
      });
      row.appendChild(b);
      list.appendChild(row);
    });
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
          beep(220, 0.06, 'square');
          squashLeft = SQUASH_MS;
          burst(C.BALL_X, C.FLOOR_Y, 4, '#2f4a73', 120);
          prevBounces = state.bounces;
        }
        if (state.score !== prevScore) {
          beep(660 + Math.min(state.score, 30) * 12, 0.08, 'sine');
          buzz(8);
          burst(C.BALL_X, state.y, 10, '#5ac8fa', 220);
          prevScore = state.score;
        }
        if (state.stars !== prevStars) {
          beep(990, 0.07, 'triangle');
          beep(1320, 0.09, 'triangle');
          burst(C.BALL_X, state.y, 12, '#ffd166', 200);
          prevStars = state.stars;
        }
        if (state.powers !== prevPowers) {
          var slowNow = state.slowT === C.POWER_SLOW_T; // bu adımda alındıysa süre tam dolu
          beep(slowNow ? 440 : 880, 0.1, 'sine'); beep(slowNow ? 330 : 1175, 0.12, 'sine');
          buzz(12);
          burst(C.BALL_X, state.y, 14, slowNow ? '#6fe0ff' : '#ff9df0', 220);
          prevPowers = state.powers;
        }
        if (state.shieldUsed !== prevShieldUsed) {
          beep(300, 0.12, 'square');
          buzz(30);
          shakeLeft = SHAKE_MS * 0.6;
          burst(C.BALL_X + 14, state.y, 16, '#ffd166', 260);
          prevShieldUsed = state.shieldUsed;
        }
        if (state.level !== prevLevel) {
          var sub = state.level === C.STAR_FROM ? 'Yıldız topla: bir çarpmayı affeder'
            : state.level === C.MOVE_FROM ? 'Mor kapılar hareket eder'
            : state.level === C.PULSE_FROM ? 'Yeşil kapılar daralıp genişler'
            : state.level === C.POWER_FROM ? 'Güçler: ⏱ dünyayı yavaşlatır, pembe top küçültür'
            : state.level === C.DOUBLE_FROM ? 'Çift duvarlar geliyor'
            : state.level === C.SPIKE_FROM ? 'Kırmızı dikenlere sekme: basılı tut, havada kal' : '';
          banner = { title: 'Bölüm ' + state.level, sub: sub, a: sub ? 2.2 : 1.4 };
          beep(523, 0.08, 'sine'); beep(784, 0.12, 'sine');
          prevLevel = state.level;
        }
        if (state.status === 'won') {
          beep(523, 0.1, 'sine'); beep(659, 0.1, 'sine'); beep(784, 0.2, 'sine');
          buzz(40);
          burst(C.BALL_X, state.y, 40, '#ffd166', 360);
          if (state.score > best) {
            best = state.score;
            newBest = true;
            try { window.localStorage.setItem('sekmeguc-best', String(best)); } catch (e) {}
          }
          phase = 'won';
          overAt = nowMs();
          input.action = false;
          acc = 0;
          break;
        }
        if (state.status === 'over') {
          beep(110, 0.25, 'sawtooth');
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

    settle();
    var showBtns = !shopOpen && !!profile && (phase === 'ready' || phase === 'over' || phase === 'won') && canRestart();
    if (shopBtn) shopBtn.hidden = !showBtns;
    var qb = document.getElementById('gorevBtn');
    if (qb) {
      qb.hidden = !showBtns || !daily;
      if (daily) {
        var left = 0;
        for (var qn = 0; qn < daily.quests.length; qn++) if (!daily.quests[qn].done) left++;
        qb.textContent = '📋 Görevler' + (left ? ' (' + left + ')' : ' ✓');
      }
    }
    window.GameRender.draw(ctx, state, {
      best: best, muted: muted, phase: phase, fx: fx, touch: touch,
      newBest: newBest, canRestart: (phase === 'over' || phase === 'won') && canRestart(),
      banner: banner, levelCount: C.LEVEL_COUNT, gatesPerLevel: C.GATES_PER_LEVEL,
      theme: profile ? Shop.equippedMap(profile) : null, skin: profile ? Shop.equippedBall(profile) : null,
      coins: profile && phase !== 'playing' && phase !== 'paused' ? profile.coins : undefined,
      earned: phase === 'over' || phase === 'won' ? earned : 0,
      questDone: phase === 'over' || phase === 'won' ? questDone : [],
      notice: phase === 'ready' ? notice : ''
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
