// Sekme Gücü — günlük görevler ve giriş serisi (saf mantık; DOM yok)
//
// Her gün 3 görev: tarih anahtarından (YYYY-AA-GG) deterministik seçilir, yani aynı gün
// aynı cihazda hep aynı görevler gelir. Tamamlanan görevin ödülü kendiliğinden verilir.
// Giriş serisi: ardışık her gün ilk açılışta 3, 4, 5, 6, 7 (tavan) yıldız; gün atlanırsa sıfırlanır.
// Kayıt ayrı anahtardadır ('sekmeguc-gunluk'); bozuk/eski kayıt güvenle yeniden kurulur.
// Tarayıcıda bütün betikler aynı genel kapsamı paylaşır; aynı adlı değişken ve
// fonksiyonlar birbirini ezmesin diye dosya kendi kapsamında çalışır. Dışarıya yalnız
// window.Game* ve module.exports çıkar.
(function () {

// Dil: i18n.js yüklüyse çevirir, değilse Türkçe metni parametreleriyle doldurur
function tx(s, p) {
  var I = typeof window !== 'undefined' && window.GameI18n;
  if (I) return I.L(s, p);
  return String(s).replace(/\{(\w+)\}/g, function (m, k) { return p && p[k] != null ? String(p[k]) : m; });
}

var DAILY_KEY = 'sekmeguc-gunluk';
var QUESTS_PER_DAY = 4;
var ALL_DONE_BONUS = 10; // günün bütün görevleri bitince bir kez

// kind: run_* tek koşuda, day_* gün boyunca birikir
var TEMPLATES = [
  { kind: 'run_stars', targets: [3, 5, 8], rewards: [5, 6, 8], text: 'Bir koşuda {n} yıldız topla' },
  { kind: 'run_gates', targets: [10, 20, 30], rewards: [4, 6, 8], text: 'Bir koşuda {n} kapı geç' },
  { kind: 'reach_level', targets: [3, 4, 6], rewards: [4, 6, 9], text: '{n}. bölüme ulaş' },
  { kind: 'day_gates', targets: [25, 40, 60], rewards: [4, 6, 8], text: 'Bugün toplam {n} kapı geç' },
  { kind: 'day_runs', targets: [3, 5], rewards: [3, 5], text: 'Bugün {n} oyun oyna' },
  { kind: 'day_shield', targets: [1, 2], rewards: [4, 6], text: 'Kalkanla {n} çarpmadan kurtul' },
  { kind: 'day_moving', targets: [3, 6], rewards: [4, 6], text: '{n} hareketli (mor) kapıdan geç' },
  { kind: 'run_powers', targets: [1], rewards: [6], text: 'Bir koşuda {n} güç topla' }, // güçler 5. bölümden
  { kind: 'run_time', targets: [30, 60, 90], rewards: [4, 6, 9], text: 'Bir koşuda {n} saniye dayan' },
  { kind: 'run_combo', targets: [2, 3, 4], rewards: [5, 7, 9], text: 'Bir koşuda {n} kez üst üste MÜKEMMEL geç' },
  { kind: 'day_stars', targets: [10, 20], rewards: [5, 8], text: 'Bugün toplam {n} yıldız topla' },
  { kind: 'day_perfect', targets: [5, 10], rewards: [5, 8], text: 'Bugün {n} kez MÜKEMMEL geç' },
  { kind: 'day_daily', targets: [1], rewards: [5], text: 'Günün meydan okumasını (📅) oyna' },
  // 'win' adı eski kayıtlarla uyum için kaldı: oyun sonsuz, görev ilk eşiği (10. bölüm) geçmek
  { kind: 'win', targets: [1], rewards: [15], text: '10. bölümü geç (ilk eşik)' }
];

function pad(n) { return (n < 10 ? '0' : '') + n; }
function dayKey(date) {
  var d = date || new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}
// İki gün anahtarı arasındaki takvim farkı (gün)
function dayDiff(a, b) {
  function toUtc(k) { var p = k.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  return Math.round((toUtc(b) - toUtc(a)) / 86400000);
}
function validKey(k) { return typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k); }

function hash(str) {
  var h = 2166136261;
  for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function describe(q) {
  var tpl = null;
  for (var i = 0; i < TEMPLATES.length; i++) if (TEMPLATES[i].kind === q.kind) tpl = TEMPLATES[i];
  return tpl ? tx(tpl.text, { n: q.target }) : q.kind;
}

// Günün 4 görevi: farklı türlerden, tarihten deterministik
function generate(key) {
  var h = hash('sekmeguc:' + key);
  var pool = TEMPLATES.slice();
  var out = [];
  while (out.length < QUESTS_PER_DAY && pool.length) {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0;
    var tpl = pool.splice(h % pool.length, 1)[0];
    h = (Math.imul(h, 1103515245) + 12345) >>> 0;
    var ti = h % tpl.targets.length;
    out.push({ kind: tpl.kind, target: tpl.targets[ti], reward: tpl.rewards[ti], progress: 0, done: false });
  }
  return out;
}

function fresh() {
  return { day: '', streak: 0, lastLogin: '', quests: [], bonus: false };
}

function sanitize(raw) {
  var d = fresh();
  if (!raw || typeof raw !== 'object') return d;
  if (validKey(raw.day)) d.day = raw.day;
  if (validKey(raw.lastLogin)) d.lastLogin = raw.lastLogin;
  var st = Math.floor(Number(raw.streak));
  d.streak = isFinite(st) && st > 0 ? Math.min(st, 3650) : 0;
  // Görevler kayıttan değil, günün anahtarından yeniden üretilir; kayıttan yalnız ilerleme alınır
  if (d.day) {
    d.quests = generate(d.day);
    var saved = Array.isArray(raw.quests) ? raw.quests : [];
    for (var i = 0; i < d.quests.length; i++) {
      var s = saved[i];
      if (s && s.kind === d.quests[i].kind) {
        var pr = Math.floor(Number(s.progress));
        d.quests[i].progress = isFinite(pr) && pr > 0 ? Math.min(pr, d.quests[i].target) : 0;
        d.quests[i].done = !!s.done && d.quests[i].progress >= d.quests[i].target;
      }
    }
    // Hepsini bitirme ödülü yalnız görevlerin hepsi gerçekten bittiyse alınmış sayılır
    d.bonus = !!raw.bonus && allDone(d);
  }
  return d;
}

function allDone(d) {
  if (!d.quests.length) return false;
  for (var i = 0; i < d.quests.length; i++) if (!d.quests[i].done) return false;
  return true;
}

function load(storage) {
  try {
    var txt = storage && storage.getItem(DAILY_KEY);
    return sanitize(txt ? JSON.parse(txt) : null);
  } catch (e) {
    return fresh();
  }
}
function save(storage, d) {
  try { if (storage) storage.setItem(DAILY_KEY, JSON.stringify(d)); } catch (e) {}
}

function loginRewardFor(streak) { return Math.min(7, 2 + streak); }

// Günün ilk açılışı: görevleri yenile, seriyi ilerlet. Dönen: { coins, streak } (yeni gün değilse coins 0)
function ensureDay(d, key) {
  var res = { coins: 0, streak: d.streak };
  if (d.day !== key) {
    d.day = key;
    d.quests = generate(key);
    d.bonus = false;
  }
  if (d.lastLogin !== key) {
    var gap = d.lastLogin ? dayDiff(d.lastLogin, key) : 99;
    d.streak = gap === 1 ? d.streak + 1 : 1;
    d.lastLogin = key;
    res.coins = loginRewardFor(d.streak);
    res.streak = d.streak;
  }
  return res;
}

// Bir koşu bitti: ilerlemeyi işle. run: { stars, score, level, shieldUsed, movingPassed, powers, t, status }
// extra: { combo (koşudaki en uzun MÜKEMMEL serisi), perfect (koşudaki MÜKEMMEL sayısı), daily (📅 modu mu) }
// Dönen: yeni tamamlanan görevler [{ text, reward, bonus? }]; ödüller toplamı çağıran tarafından cüzdana eklenir
function applyRun(d, run, extra) {
  extra = extra || {};
  var done = [];
  for (var i = 0; i < d.quests.length; i++) {
    var q = d.quests[i];
    if (q.done) continue;
    var v;
    switch (q.kind) {
      case 'run_stars': v = Math.max(q.progress, run.stars || 0); break;
      case 'run_gates': v = Math.max(q.progress, run.score || 0); break;
      case 'reach_level': v = Math.max(q.progress, run.level || 1); break;
      case 'day_gates': v = q.progress + (run.score || 0); break;
      case 'day_runs': v = q.progress + 1; break;
      case 'day_shield': v = q.progress + (run.shieldUsed || 0); break;
      case 'day_moving': v = q.progress + (run.movingPassed || 0); break;
      case 'run_powers': v = Math.max(q.progress, run.powers || 0); break;
      case 'run_time': v = Math.max(q.progress, Math.floor(run.t || 0)); break;
      case 'run_combo': v = Math.max(q.progress, extra.combo || 0); break;
      case 'day_stars': v = q.progress + (run.stars || 0); break;
      case 'day_perfect': v = q.progress + (extra.perfect || 0); break;
      case 'day_daily': v = extra.daily ? 1 : q.progress; break;
      case 'win': v = (run.level || 1) > 10 || run.status === 'won' ? 1 : q.progress; break;
      default: v = q.progress;
    }
    q.progress = Math.min(q.target, v);
    if (q.progress >= q.target) {
      q.done = true;
      done.push({ text: describe(q), reward: q.reward });
    }
  }
  if (!d.bonus && allDone(d)) {
    d.bonus = true;
    done.push({ text: tx('Günün bütün görevleri'), reward: ALL_DONE_BONUS, bonus: true });
  }
  return done;
}

// --- Günlük meydan okuma ve rekor hayaleti -------------------------------------
// Günün parkuru herkes için aynı: tohum gün anahtarından türetilir. Parkur (duvarlar, kapılar, öğeler)
// yalnız tohuma ve geçen zamana bağlıdır, oyuncunun girdisine değil; bu yüzden en iyi koşunun top
// yüksekliği zamanla kaydedilip sonraki denemelerde "hayalet" olarak aynı yerlerde gösterilebilir.
// Yükseklik 0..1 arasına normalize saklanır (tavan 0, zemin 1): ekran yüksekliği değişse de geçerli.
var CHALLENGE_KEY = 'bopgate-gunluk-meydan';
var GHOST_STEP = 0.1;       // kayıt aralığı (sn)
var GHOST_MAX = 3600;       // en çok 6 dakika
function dailySeed(day) {
  var h = 2166136261;
  var s = 'bopgate:' + day;
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) || 1;
}
function loadChallenge(storage, day) {
  try {
    var d = JSON.parse(storage.getItem(CHALLENGE_KEY));
    if (!d || d.day !== day || !validKey(d.day)) return { day: day, best: 0, path: [] };
    var best = Math.max(0, Math.min(1e6, Math.floor(Number(d.best)) || 0));
    var path = Array.isArray(d.path) ? d.path.slice(0, GHOST_MAX).map(function (v) {
      var n = Number(v); return isFinite(n) ? Math.max(0, Math.min(1, n)) : 0.5;
    }) : [];
    return { day: day, best: best, path: path };
  } catch (e) {
    return { day: day, best: 0, path: [] };
  }
}
function saveChallenge(storage, rec) {
  try {
    storage.setItem(CHALLENGE_KEY, JSON.stringify({ day: rec.day, best: rec.best,
      path: rec.path.slice(0, GHOST_MAX).map(function (v) { return Math.round(v * 1000) / 1000; }) }));
  } catch (e) {}
}
// t saniyedeki hayalet yüksekliği (0..1) ya da kayıt bittiyse null
function ghostAt(path, t) {
  if (!path || !path.length || !(t >= 0)) return null;
  var f = t / GHOST_STEP, i = Math.floor(f);
  if (i >= path.length - 1) return null;
  return path[i] + (path[i + 1] - path[i]) * (f - i);
}

// --- Başarımlar ------------------------------------------------------------------
// Kalıcı, bir kez kazanılan hedefler; küçük yıldız ödülü (toplam ★143, ekonomiyi hızlandırmayacak kadar).
// kind: run_* tek koşuda, total_* birikimli sayaç, milestone eşik, combo en uzun MÜKEMMEL serisi,
// daily_days günlük meydan okumanın oynandığı farklı gün sayısı, balls sahip olunan top sayısı.
var ACH_KEY = 'bopgate-basarim';
var ACHIEVEMENTS = [
  { id: 'ilk_kapi', kind: 'run_gates', target: 1, reward: 2, text: 'İlk kapını geç' },
  { id: 'kapi_25', kind: 'run_gates', target: 25, reward: 5, text: 'Bir koşuda {n} kapı geç' },
  { id: 'kapi_50', kind: 'run_gates', target: 50, reward: 10, text: 'Bir koşuda {n} kapı geç' },
  { id: 'kapi_100', kind: 'run_gates', target: 100, reward: 20, text: 'Bir koşuda {n} kapı geç' },
  { id: 'esik_1', kind: 'milestone', target: 1, reward: 10, text: '10. bölümü geç (ilk eşik)' },
  { id: 'esik_3', kind: 'milestone', target: 3, reward: 25, text: '30. bölümü geç' },
  { id: 'seri_5', kind: 'combo', target: 5, reward: 8, text: '{n} kez üst üste MÜKEMMEL geç' },
  { id: 'toplam_500', kind: 'total_gates', target: 500, reward: 10, text: 'Toplam {n} kapı geç' },
  { id: 'toplam_2000', kind: 'total_gates', target: 2000, reward: 25, text: 'Toplam {n} kapı geç' },
  { id: 'kalkan_10', kind: 'total_shield', target: 10, reward: 8, text: 'Kalkanla {n} çarpmadan kurtul' },
  { id: 'gunluk_7', kind: 'daily_days', target: 7, reward: 10, text: '{n} farklı gün günlük meydan okuma oyna' },
  { id: 'koleksiyon_5', kind: 'balls', target: 5, reward: 10, text: '{n} topa sahip ol' },
  { id: 'esik_5', kind: 'milestone', target: 5, reward: 40, text: '50. bölümü geç' },
  { id: 'seri_10', kind: 'combo', target: 10, reward: 15, text: '{n} kez üst üste MÜKEMMEL geç' },
  { id: 'sure_120', kind: 'run_time', target: 120, reward: 10, text: 'Bir koşuda {n} saniye dayan' },
  { id: 'yildiz_100', kind: 'total_stars', target: 100, reward: 8, text: 'Toplam {n} yıldız topla' },
  { id: 'guc_10', kind: 'total_powers', target: 10, reward: 8, text: 'Toplam {n} güç topla' },
  { id: 'diken_10', kind: 'total_spikes', target: 10, reward: 8, text: '{n} zemin dikeninin üstünden geç' },
  { id: 'gorev_10', kind: 'total_quests', target: 10, reward: 10, text: 'Toplam {n} günlük görev bitir' },
  { id: 'giris_7', kind: 'streak', target: 7, reward: 10, text: '{n} gün üst üste oyna' }
];
function achFresh() {
  return { done: [], gates: 0, shields: 0, dailyDays: 0, lastDaily: '', bestCombo: 0, bestGates: 0, bestMs: 0,
    stars: 0, powers: 0, spikes: 0, quests: 0, bestTime: 0, bestStreak: 0 };
}
function achNum(v, max) { var n = Math.floor(Number(v)); return isFinite(n) && n > 0 ? Math.min(n, max) : 0; }
function loadAch(storage) {
  try {
    var d = JSON.parse(storage.getItem(ACH_KEY));
    if (!d || typeof d !== 'object') return achFresh();
    var ids = ACHIEVEMENTS.map(function (a) { return a.id; });
    return {
      done: Array.isArray(d.done) ? d.done.filter(function (x, i, arr) { return ids.indexOf(x) >= 0 && arr.indexOf(x) === i; }) : [],
      gates: achNum(d.gates, 1e9), shields: achNum(d.shields, 1e6), dailyDays: achNum(d.dailyDays, 1e5),
      lastDaily: validKey(d.lastDaily) ? d.lastDaily : '', bestCombo: achNum(d.bestCombo, 1e5),
      bestGates: achNum(d.bestGates, 1e6), bestMs: achNum(d.bestMs, 1e5),
      stars: achNum(d.stars, 1e9), powers: achNum(d.powers, 1e7), spikes: achNum(d.spikes, 1e7),
      quests: achNum(d.quests, 1e6), bestTime: achNum(d.bestTime, 1e6), bestStreak: achNum(d.bestStreak, 3650)
    };
  } catch (e) {
    return achFresh();
  }
}
function saveAch(storage, a) { try { storage.setItem(ACH_KEY, JSON.stringify(a)); } catch (e) {} }
function achProgress(a, def, extra) {
  switch (def.kind) {
    case 'run_gates': return a.bestGates;
    case 'milestone': return a.bestMs;
    case 'combo': return a.bestCombo;
    case 'total_gates': return a.gates;
    case 'total_shield': return a.shields;
    case 'daily_days': return a.dailyDays;
    case 'balls': return (extra && extra.balls) || 0;
    case 'run_time': return a.bestTime;
    case 'total_stars': return a.stars;
    case 'total_powers': return a.powers;
    case 'total_spikes': return a.spikes;
    case 'total_quests': return a.quests;
    case 'streak': return a.bestStreak;
    default: return 0;
  }
}
function describeAch(def) { return tx(def.text, { n: def.target }); }
// run: bitmiş koşunun durumu; extra: { combo (koşudaki en uzun seri), daily (günlük mod mu), day, balls,
//   quests (bu koşuda biten günlük görev sayısı), streak (giriş serisi) }
// Döner: bu koşuda yeni kazanılanlar [{ id, text, reward }]
function applyAch(a, run, extra) {
  extra = extra || {};
  a.gates += run.score || 0;
  a.shields += run.shieldUsed || 0;
  a.bestGates = Math.max(a.bestGates, run.score || 0);
  a.bestMs = Math.max(a.bestMs, run.milestones || 0);
  a.bestCombo = Math.max(a.bestCombo, extra.combo || 0);
  a.stars += run.stars || 0;
  a.powers += run.powers || 0;
  a.spikes += run.spikesPassed || 0;
  a.quests += extra.quests || 0;
  a.bestTime = Math.max(a.bestTime, Math.floor(run.t || 0));
  a.bestStreak = Math.max(a.bestStreak, extra.streak || 0);
  if (extra.daily && validKey(extra.day) && extra.day !== a.lastDaily) { a.dailyDays++; a.lastDaily = extra.day; }
  var got = [];
  ACHIEVEMENTS.forEach(function (def) {
    if (a.done.indexOf(def.id) >= 0) return;
    if (achProgress(a, def, extra) >= def.target) {
      a.done.push(def.id);
      got.push({ id: def.id, text: describeAch(def), reward: def.reward });
    }
  });
  return got;
}

var Quests = {
  ACH_KEY: ACH_KEY, ACHIEVEMENTS: ACHIEVEMENTS, loadAch: loadAch, saveAch: saveAch, applyAch: applyAch,
  achProgress: achProgress, describeAch: describeAch,
  CHALLENGE_KEY: CHALLENGE_KEY, GHOST_STEP: GHOST_STEP, GHOST_MAX: GHOST_MAX,
  dailySeed: dailySeed, loadChallenge: loadChallenge, saveChallenge: saveChallenge, ghostAt: ghostAt,
  DAILY_KEY: DAILY_KEY, TEMPLATES: TEMPLATES, QUESTS_PER_DAY: QUESTS_PER_DAY, ALL_DONE_BONUS: ALL_DONE_BONUS, allDone: allDone, dayKey: dayKey, dayDiff: dayDiff,
  generate: generate, describe: describe, fresh: fresh, sanitize: sanitize,
  load: load, save: save, ensureDay: ensureDay, applyRun: applyRun, loginRewardFor: loginRewardFor
};
if (typeof module !== 'undefined') module.exports = Quests;
if (typeof window !== 'undefined') window.GameQuests = Quests;
})();
