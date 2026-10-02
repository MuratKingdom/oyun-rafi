// Sekme Gücü — saf oyun mantığı (DOM/canvas/window kullanılmaz)
// Tarayıcıda bütün betikler aynı genel kapsamı paylaşır; aynı adlı değişken ve
// fonksiyonlar birbirini ezmesin diye dosya kendi kapsamında çalışır. Dışarıya yalnız
// window.Game* ve module.exports çıkar.
(function () {

var CANVAS_W = 520;
var CANVAS_H = 540;
var BALL_X = 160;
var BALL_R = 12;
var FLOOR_Y = 480;
var CEIL_Y = 30;
var GRAVITY = 900;
var THRUST = -700;
var BOUNCE_V = -480;
var MAX_VY = 900;
var SPEED0 = 200;
var SPEED_MAX = 340;
var GAP_H0 = 170;
var GAP_MIN = 120;
// Zorluk eğrisi: doğrusal değil, doygunluğa giden üstel yaklaşım.
// İlk dakikada hızlı sertleşir, sonra yavaşlar ve bir tavanda durur;
// böylece uzun koşular adil kalır, "sonsuz hızlanma" ile zorla bitmez.
var DIFF_TAU = 75;
var WALL_W = 28;
var SPAWN_GRACE = 2.2;
var SPAWN_INTERVAL_MIN = 1.3;
var SPAWN_INTERVAL_MAX = 1.9;
var SPAWN_RAMP = 0.01;

function nextRand(state) {
  state.rngA = (state.rngA + 0x6D2B79F5) | 0;
  var t = state.rngA;
  t = Math.imul(t ^ (t >>> 15), 1 | t);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// 0 (başlangıç) → 1 (tavan) arasında, t saniyede.
function difficulty(t) {
  return 1 - Math.exp(-t / DIFF_TAU);
}

// Sonsuz bölge ilerlemesi: ilk eşiğe kadar 0, sonra ENDLESS_LEVELS bölümde 1'e çıkar
function endless(level) {
  return Math.max(0, Math.min(1, ((level || 1) - LEVEL_COUNT) / ENDLESS_LEVELS));
}

// --- Bölümler ---------------------------------------------------------------
// Her bölüm GATES_PER_LEVEL kapıdır. Oyun sonsuzdur: bitiş yok, yalnız ölünce biter.
// Her LEVEL_COUNT bölümde bir eşik geçilir (state.milestones; ödülde bonus).
// Eşik sonrası (sonsuz bölge) zorluk ENDLESS_LEVELS bölüm boyunca yavaşça bir tavana çıkar:
// hız +ENDLESS_SPEED, kapı en dar GAP_MIN - ENDLESS_GAP, doğma aralığı ENDLESS_SPAWN_MIN'e iner.
// Tavanda bile her dizilim geçilebilir kalır (MAX_JUMP, bot ölçümü: README).
// Yeni öğeler bölümle açılır:
//   2+  yıldız: kapının ortasında durur; toplanınca bir kalkan verir (en çok 1)
//   3+  hareketli kapı: boşluk yukarı-aşağı salınır, genliği bölümle büyür
//   4+  nefes alan kapı: ağız ortası sabit kalır, boyu daralıp genişler (hareketliyle birleşmez)
//   5+  güç: kapının ortasında yıldız yerine çıkabilir —
//         ⏱ yavaşlatma (dünya POWER_SLOW_F hızında akar) ya da küçülme (top yarıçapı POWER_SMALL_F)
//   6+  çift duvar: art arda iki duvar, boşlukları birbirine kaydırılmış
//   7+  zemin dikeni: duvarın hemen ardında zeminde dikenli şerit; üstüne sekmek öldürür,
//       basılı tutup havada kalarak geçilir
// Kalkan, bir duvar ya da diken çarpmasını yutar (tavanı değil).
var LEVEL_COUNT = 10; // eşik uzunluğu (bölüm)
var ENDLESS_LEVELS = 20;
var ENDLESS_SPEED = 40;
var ENDLESS_GAP = 15;
var ENDLESS_SPAWN_MIN = 1.15;
var GATES_PER_LEVEL = 8;
var STAR_FROM = 2;
var MOVE_FROM = 3;
var DOUBLE_FROM = 6;
var PULSE_FROM = 4;
var POWER_FROM = 5;
var SPIKE_FROM = 7;
var POWER_SLOW_F = 0.65;
var POWER_SLOW_T = 4;
var POWER_SMALL_F = 0.6;
var POWER_SMALL_T = 6;
var PULSE_MIN = 0.72; // nefes alan kapı en dar halinde normal boyun bu oranı
var SPIKE_DX = 30;    // duvarın arka kenarından şeridin başına
var SPIKE_W = 70;
var STAR_R = 9;
var MAX_SHIELD = 1;
var DOUBLE_DX = 96;
var DOUBLE_SHIFT = 46;
var MARGIN = 40;
// Art arda iki kapının ağız üstü arasındaki en büyük fark. Top yalnızca zeminden
// sekerek yükselir (basılı tutmak düşüşü yavaşlatır, havada tutmaz); alçak bir
// kapıdan hemen sonra çok yüksek bir kapı hızlanan oyunda fiziksel olarak
// yetişilemez olabiliyordu. Bu sınır her dizilimi oynanabilir tutar.
var MAX_JUMP = 150;

// --- Geometri --------------------------------------------------------------
// Oyun alanının mantıksal yüksekliği cihaza göre değişebilir (dikey telefonda uzun).
// Genişlik ve zaman sabit kalır; dikey olan her şey (yerçekimi, itiş, sekme hızı,
// kapı boyu, salınım, sıçrama sınırı) alanla aynı oranda (k) ölçeklenir. Böylece
// oyun geometrik olarak aynı kalır: botla ölçülen denge her ekran boyunda geçerli.
var MIN_H = 540;
var MAX_H = 1000;

function makeGeo(height) {
  var H = Math.round(Math.max(MIN_H, Math.min(MAX_H, height || CANVAS_H)));
  var floorY = H - (CANVAS_H - FLOOR_Y);
  return { H: H, ceilY: CEIL_Y, floorY: floorY, k: (floorY - CEIL_Y) / (FLOOR_Y - CEIL_Y) };
}

// opts.height: mantıksal alan yüksekliği (540–1000); verilmezse 540 (klasik kare alan)
// opts.mods: mağazadaki kalıcı güçlendirmeler { maxShield, startShield, powerMul, magnet }
function createState(seed, opts) {
  var g = makeGeo(opts && opts.height);
  var m = (opts && opts.mods) || {};
  var maxShield = typeof m.maxShield === 'number' ? m.maxShield : MAX_SHIELD;
  return {
    maxShield: maxShield,
    powerMul: m.powerMul || 1,
    magnet: m.magnet || 1,
    revives: 0,
    geo: g,
    rngA: (seed || 1) >>> 0,
    y: g.floorY - BALL_R - 60 * g.k,
    vy: 0,
    t: 0,
    speed: SPEED0,
    gapH: GAP_H0 * g.k,
    lastGapY: -1,
    spawnTimer: SPAWN_GRACE,
    obstacles: [],
    bounces: 0,
    score: 0,
    level: 1,
    stars: 0,
    shield: Math.min(maxShield, m.startShield || 0),
    shieldUsed: 0,
    movingPassed: 0,
    milestones: 0,
    slowT: 0,
    smallT: 0,
    powers: 0,
    spikesPassed: 0,
    distance: 0,
    status: 'playing',
    overReason: ''
  };
}

function clampGapY(g, gapY, gapH) {
  var minTop = g.ceilY + MARGIN * g.k;
  var maxTop = g.floorY - MARGIN * g.k - gapH;
  if (maxTop < minTop) maxTop = minTop;
  return Math.max(minTop, Math.min(maxTop, gapY));
}

function makeWall(state, x, baseY, gapH) {
  var lv = state.level;
  var w = { x: x, baseY: baseY, gapY: baseY, gapH: gapH, baseH: gapH, passed: false, hit: false,
    move: null, star: null, pulse: null, power: null, spike: null };
  if (lv >= MOVE_FROM && nextRand(state) < Math.min(0.7, 0.18 * (lv - MOVE_FROM + 1))) {
    w.move = {
      amp: Math.min(48, 22 + 4 * (lv - MOVE_FROM)) * state.geo.k,
      freq: 0.9 + nextRand(state) * 0.8,
      phase: nextRand(state) * Math.PI * 2
    };
  }
  if (!w.move && lv >= PULSE_FROM && nextRand(state) < Math.min(0.45, 0.15 * (lv - PULSE_FROM + 1))) {
    w.pulse = { freq: 1.6 + nextRand(state) * 0.8, phase: nextRand(state) * Math.PI * 2 };
  }
  if (lv >= POWER_FROM && nextRand(state) < 0.16) {
    w.power = { kind: nextRand(state) < 0.5 ? 'slow' : 'small', taken: false };
  } else if (lv >= STAR_FROM && nextRand(state) < 0.4) {
    w.star = { taken: false };
  }
  if (lv >= SPIKE_FROM && nextRand(state) < Math.min(0.4, 0.2 + 0.07 * (lv - SPIKE_FROM))) {
    w.spike = { dx: SPIKE_DX, w: SPIKE_W, hit: false, passed: false };
  }
  return w;
}

function spawn(state) {
  var g = state.geo;
  var gapH = state.gapH;
  var minTop = g.ceilY + MARGIN * g.k;
  var maxTop = g.floorY - MARGIN * g.k - gapH;
  var span = Math.max(10, maxTop - minTop);
  var gapY = minTop + nextRand(state) * span;
  if (state.lastGapY >= 0) {
    var jump = MAX_JUMP * g.k;
    gapY = Math.max(state.lastGapY - jump, Math.min(state.lastGapY + jump, gapY));
  }
  gapY = clampGapY(g, gapY, gapH);
  state.obstacles.push(makeWall(state, CANVAS_W + WALL_W, gapY, gapH));
  state.lastGapY = gapY;
  if (state.level >= DOUBLE_FROM && nextRand(state) < 0.3) {
    var shift = (nextRand(state) < 0.5 ? -1 : 1) * DOUBLE_SHIFT * g.k;
    var second = makeWall(state, CANVAS_W + WALL_W + DOUBLE_DX, clampGapY(g, gapY + shift, gapH), gapH);
    second.move = null; // çift duvarın ikincisi sabit: iki hareketli üst üste adil değil
    second.pulse = null;
    second.spike = null; // iki duvarın arasına diken koyma: yer yok
    if (state.obstacles[state.obstacles.length - 1].spike) state.obstacles[state.obstacles.length - 1].spike = null;
    state.obstacles.push(second);
    state.lastGapY = second.gapY;
    return DOUBLE_DX / state.speed; // sonraki duvar ikinci parçaya normal aralıkla gelsin
  }
  return 0;
}

// Topun anlık yarıçapı (küçülme gücü açıkken daha küçük)
function radius(state) {
  return state.smallT > 0 ? BALL_R * POWER_SMALL_F : BALL_R;
}

// Engelin altındaki diken şeridi topun x'ini örtüyor mu
function spikeUnderBall(o, r) {
  if (!o.spike || o.spike.hit) return false;
  var x0 = o.x + WALL_W + o.spike.dx;
  return x0 < BALL_X + r && x0 + o.spike.w > BALL_X - r;
}

function step(state, input, dt) {
  if (state.status !== 'playing') return state;

  var g = state.geo || (state.geo = makeGeo(CANVAS_H));
  if (state.slowT > 0) state.slowT = Math.max(0, state.slowT - dt);
  if (state.smallT > 0) state.smallT = Math.max(0, state.smallT - dt);
  var r = radius(state);
  // Yavaşlatma yalnız dünyayı (duvarların kayması, doğma sıklığı) etkiler; topun
  // düşüşü aynı kalır ki kontrol hissi değişmesin.
  var wf = state.slowT > 0 ? POWER_SLOW_F : 1;
  var accel = GRAVITY * g.k;
  if (input.action) accel += THRUST * g.k;
  state.vy += accel * dt;
  var maxVy = MAX_VY * g.k;
  if (state.vy > maxVy) state.vy = maxVy;
  if (state.vy < -maxVy) state.vy = -maxVy;
  state.y += state.vy * dt;

  if (state.y + r >= g.floorY) {
    state.y = g.floorY - r;
    state.vy = BOUNCE_V * g.k;
    state.bounces++;
    for (var si = 0; si < state.obstacles.length; si++) {
      var so = state.obstacles[si];
      if (!spikeUnderBall(so, r)) continue;
      if (state.shield > 0) {
        state.shield--;
        state.shieldUsed++;
        so.spike.hit = true;
      } else {
        state.status = 'over';
        state.overReason = 'Dikene düştün';
        return state;
      }
    }
  }

  if (state.y - r <= g.ceilY) {
    state.status = 'over';
    state.overReason = 'Tavana çarptın';
    return state;
  }

  state.t += dt;
  var d = difficulty(state.t);
  var e = endless(state.level);
  state.speed = SPEED0 + (SPEED_MAX + ENDLESS_SPEED * e - SPEED0) * d;
  state.gapH = (GAP_H0 - (GAP_H0 - (GAP_MIN - ENDLESS_GAP * e)) * d) * g.k;

  state.spawnTimer -= dt * wf;
  if (state.spawnTimer <= 0) {
    var extra = spawn(state);
    var interval = SPAWN_INTERVAL_MAX - state.t * SPAWN_RAMP;
    var imin = SPAWN_INTERVAL_MIN - (SPAWN_INTERVAL_MIN - ENDLESS_SPAWN_MIN) * e;
    if (interval < imin) interval = imin;
    state.spawnTimer = interval + extra;
  }

  for (var i = 0; i < state.obstacles.length; i++) {
    var o = state.obstacles[i];
    o.x -= state.speed * wf * dt;
    if (o.move) {
      o.gapY = clampGapY(g, o.baseY + o.move.amp * Math.sin(o.move.phase + state.t * o.move.freq), o.gapH);
    }
    if (o.pulse) {
      // 0..1 arası nefes; ağız ortası sabit
      var b = 0.5 + 0.5 * Math.sin(o.pulse.phase + state.t * o.pulse.freq);
      var bh = o.baseH || o.gapH;
      o.gapH = bh * (PULSE_MIN + (1 - PULSE_MIN) * b);
      o.gapY = o.baseY + (bh - o.gapH) / 2;
    }

    // Yıldız: kapının ortasında
    if (o.star && !o.star.taken) {
      var sx = o.x + WALL_W / 2;
      var sy = o.gapY + o.gapH / 2;
      var pr = r + STAR_R * (state.magnet || 1);
      if (Math.abs(sx - BALL_X) < pr && Math.abs(sy - state.y) < pr) {
        o.star.taken = true;
        state.stars++;
        var cap = typeof state.maxShield === 'number' ? state.maxShield : MAX_SHIELD;
        if (state.shield < cap) state.shield++;
      }
    }
    // Güç: yıldızla aynı yerde; alınınca süresi (yeniden) başlar
    if (o.power && !o.power.taken) {
      var px = o.x + WALL_W / 2;
      var py = o.gapY + o.gapH / 2;
      var pr2 = r + STAR_R * (state.magnet || 1);
      if (Math.abs(px - BALL_X) < pr2 && Math.abs(py - state.y) < pr2) {
        o.power.taken = true;
        state.powers++;
        if (o.power.kind === 'slow') state.slowT = POWER_SLOW_T * (state.powerMul || 1);
        else state.smallT = POWER_SMALL_T * (state.powerMul || 1);
      }
    }
    if (o.spike && !o.spike.passed && o.x + WALL_W + o.spike.dx + o.spike.w < BALL_X - r) {
      o.spike.passed = true;
      if (!o.spike.hit) state.spikesPassed++;
    }

    if (!o.passed && o.x + WALL_W < BALL_X) {
      o.passed = true;
      state.score++;
      if (o.move) state.movingPassed++;
      if (state.score % GATES_PER_LEVEL === 0) {
        if (state.level % LEVEL_COUNT === 0) state.milestones++;
        state.level++;
      }
    }
    if (!o.hit && o.x < BALL_X + r && o.x + WALL_W > BALL_X - r) {
      if (state.y - r < o.gapY || state.y + r > o.gapY + o.gapH) {
        if (state.shield > 0) {
          state.shield--;
          state.shieldUsed++;
          o.hit = true; // kalkan bu duvarı deler; aynı duvar ikinci kez öldürmez
        } else {
          state.status = 'over';
          state.overReason = 'Duvara çarptın';
          return state;
        }
      }
    }
  }
  var kept = [];
  for (var j = 0; j < state.obstacles.length; j++) {
    var oj = state.obstacles[j];
    var tail = oj.spike ? WALL_W + oj.spike.dx + oj.spike.w : WALL_W;
    if (oj.x + tail > -10) kept.push(oj);
  }
  state.obstacles = kept;

  state.distance += state.speed * wf * dt;
  return state;
}

// Ölünce devam (yıldızla ödenir, ödemeyi main.js/shop.js yapar): top ortaya alınır,
// önündeki REVIVE_CLEAR px içindeki ve altındaki engeller kaldırılır, yeni duvar biraz gecikir.
var REVIVE_CLEAR = 300;
var REVIVE_GRACE = 1.2;
function revive(state) {
  if (state.status !== 'over') return false;
  var g = state.geo || makeGeo(CANVAS_H);
  var kept = [];
  for (var i = 0; i < state.obstacles.length; i++) {
    var o = state.obstacles[i];
    var tail = o.x + WALL_W + (o.spike ? o.spike.dx + o.spike.w : 0);
    if (tail < BALL_X - BALL_R - 4 || o.x > BALL_X + REVIVE_CLEAR) kept.push(o);
  }
  state.obstacles = kept;
  state.y = (g.ceilY + g.floorY) / 2;
  state.vy = 0;
  state.spawnTimer = Math.max(state.spawnTimer, REVIVE_GRACE);
  state.status = 'playing';
  state.overReason = '';
  state.revives = (state.revives || 0) + 1;
  return true;
}

var CONST = {
  CANVAS_W: CANVAS_W, CANVAS_H: CANVAS_H, BALL_X: BALL_X, BALL_R: BALL_R,
  FLOOR_Y: FLOOR_Y, CEIL_Y: CEIL_Y, WALL_W: WALL_W,
  SPEED0: SPEED0, SPEED_MAX: SPEED_MAX, GAP_H0: GAP_H0, GAP_MIN: GAP_MIN,
  LEVEL_COUNT: LEVEL_COUNT, GATES_PER_LEVEL: GATES_PER_LEVEL, STAR_R: STAR_R,
  STAR_FROM: STAR_FROM, MOVE_FROM: MOVE_FROM, DOUBLE_FROM: DOUBLE_FROM, MAX_JUMP: MAX_JUMP,
  MIN_H: MIN_H, MAX_H: MAX_H,
  ENDLESS_LEVELS: ENDLESS_LEVELS, ENDLESS_SPEED: ENDLESS_SPEED, ENDLESS_GAP: ENDLESS_GAP, ENDLESS_SPAWN_MIN: ENDLESS_SPAWN_MIN,
  PULSE_FROM: PULSE_FROM, POWER_FROM: POWER_FROM, SPIKE_FROM: SPIKE_FROM, PULSE_MIN: PULSE_MIN,
  POWER_SLOW_F: POWER_SLOW_F, POWER_SLOW_T: POWER_SLOW_T, POWER_SMALL_F: POWER_SMALL_F, POWER_SMALL_T: POWER_SMALL_T,
  SPIKE_DX: SPIKE_DX, SPIKE_W: SPIKE_W, MAX_SHIELD: MAX_SHIELD, REVIVE_CLEAR: REVIVE_CLEAR
};
var API = { createState: createState, step: step, difficulty: difficulty, endless: endless, revive: revive, makeGeo: makeGeo, radius: radius, CONST: CONST };
if (typeof module !== 'undefined') module.exports = API;
if (typeof window !== 'undefined') window.GameLogic = API;
})();
