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

var DAILY_KEY = 'sekmeguc-gunluk';
var QUESTS_PER_DAY = 3;

// kind: run_* tek koşuda, day_* gün boyunca birikir
var TEMPLATES = [
  { kind: 'run_stars', targets: [3, 5, 8], rewards: [5, 6, 8], text: 'Bir koşuda {n} yıldız topla' },
  { kind: 'run_gates', targets: [10, 20, 30], rewards: [4, 6, 8], text: 'Bir koşuda {n} kapı geç' },
  { kind: 'reach_level', targets: [3, 4, 6], rewards: [4, 6, 9], text: '{n}. bölüme ulaş' },
  { kind: 'day_gates', targets: [25, 40, 60], rewards: [4, 6, 8], text: 'Bugün toplam {n} kapı geç' },
  { kind: 'day_runs', targets: [3, 5], rewards: [3, 5], text: 'Bugün {n} oyun oyna' },
  { kind: 'day_shield', targets: [1, 2], rewards: [4, 6], text: 'Kalkanla {n} çarpmadan kurtul' },
  { kind: 'day_moving', targets: [3, 6], rewards: [4, 6], text: '{n} hareketli (mor) kapıdan geç' },
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
  return tpl ? tpl.text.replace('{n}', q.target) : q.kind;
}

// Günün 3 görevi: farklı türlerden, tarihten deterministik
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
  return { day: '', streak: 0, lastLogin: '', quests: [] };
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
  }
  return d;
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

// Bir koşu bitti: ilerlemeyi işle. run: { stars, score, level, shieldUsed, movingPassed, status }
// Dönen: yeni tamamlanan görevler [{ text, reward }]; ödüller toplamı çağıran tarafından cüzdana eklenir
function applyRun(d, run) {
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
      case 'win': v = (run.level || 1) > 10 || run.status === 'won' ? 1 : q.progress; break;
      default: v = q.progress;
    }
    q.progress = Math.min(q.target, v);
    if (q.progress >= q.target) {
      q.done = true;
      done.push({ text: describe(q), reward: q.reward });
    }
  }
  return done;
}

var Quests = {
  DAILY_KEY: DAILY_KEY, TEMPLATES: TEMPLATES, dayKey: dayKey, dayDiff: dayDiff,
  generate: generate, describe: describe, fresh: fresh, sanitize: sanitize,
  load: load, save: save, ensureDay: ensureDay, applyRun: applyRun, loginRewardFor: loginRewardFor
};
if (typeof module !== 'undefined') module.exports = Quests;
if (typeof window !== 'undefined') window.GameQuests = Quests;
})();
