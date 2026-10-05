// Sekme Gücü — mağaza: katalog, cüzdan, satın alma, kuşanma (saf mantık; DOM yok)
//
// Para birimi yıldızdır. Oyun sonunda kazanılan: o koşuda toplanan yıldızlar
// + her 10 bölümlük eşik için 5. Gerçek para yok. Fiyat/ödül dengesi
// tools/ekonomi.js ile ölçülür (hedef: orta oyuncu her şeye ~1,5 ayda ulaşır).
// Profil tarayıcıda localStorage'da tutulur; bozuk/eksik veri sessizce varsayılana döner.
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

// Ondalık ayırıcı dile göre: Türkçede virgül, İngilizcede nokta
function decimal(v) {
  var I = typeof window !== 'undefined' && window.GameI18n;
  return I && I.getLang() === 'en' ? String(v) : String(v).replace('.', ',');
}

var STORAGE_KEY = 'sekmeguc-profil';

// Top görünümleri. shape: circle | square | diamond | star | ring
var BALLS = [
  { id: 'klasik', name: 'Klasik', price: 0, shape: 'circle', color: '#5ac8fa', fx: 'pulse' },
  { id: 'kor', name: 'Kor', price: 25, shape: 'circle', color: '#ff8a3d', fx: 'ember' },
  { id: 'nane', name: 'Nane', price: 60, shape: 'circle', color: '#46d39a', fx: 'swirl' },
  { id: 'kup', name: 'Küp', price: 150, shape: 'square', color: '#f2f2f2', fx: 'spin' },
  { id: 'elmas', name: 'Elmas', price: 250, shape: 'diamond', color: '#7fe3ff', fx: 'sparkle' },
  { id: 'yildiz', name: 'Yıldız', price: 400, shape: 'star', color: '#ff8ee8', fx: 'spin' },
  { id: 'gezegen', name: 'Gezegen', price: 600, shape: 'ring', color: '#c49bff', fx: 'moon' },
  // Yalnız gerçek parayla (monetize.js): yıldızla alınamaz; premiumBy = bu hakkı veren ürünler
  { id: 'alev', name: 'Alev', price: null, shape: 'flame', color: '#ff6b2c', premiumBy: ['bopgate.top.alev', 'bopgate.destekci'], fx: 'flicker' },
  { id: 'kristal', name: 'Kristal', price: null, shape: 'hex', color: '#9ef0ff', premiumBy: ['bopgate.top.kristal'], fx: 'spin' }
];

// Top görünümleri: shape gövde biçimi, fx canlı efekt (render.js drawBall: pulse | ember | swirl | spin | sparkle | moon | flicker)
// Harita temaları. deco: arka plan süsü (dots | sun | trees | grid | flakes)
var MAPS = [
  { id: 'gece', name: 'Gece', price: 0, deco: 'dots',
    c: { bg: '#0b1220', line: '#223352', wall: '#1f3150', wallPassed: '#16233b', wallMove: '#2b2650', edge: '#5ac8fa', edgeMove: '#b39dfa', deco: 'rgba(200,220,255,0.35)' } },
  { id: 'gunbatimi', name: 'Gün Batımı', price: 150, deco: 'sun',
    c: { bg: '#2a1530', line: '#5a2f4a', wall: '#4a2340', wallPassed: '#331a2e', wallMove: '#5a2a5e', edge: '#ffb36b', edgeMove: '#ff7fb0', deco: 'rgba(255,170,90,0.16)' } },
  { id: 'orman', name: 'Orman', price: 200, deco: 'trees',
    c: { bg: '#0e1f17', line: '#24443a', wall: '#1d3b2c', wallPassed: '#152a20', wallMove: '#2d3b1d', edge: '#8fe388', edgeMove: '#e3d488', deco: 'rgba(60,120,80,0.55)' } },
  { id: 'neon', name: 'Neon', price: 350, deco: 'grid',
    c: { bg: '#07050f', line: '#ff2bd6', wall: '#1a0f33', wallPassed: '#120a24', wallMove: '#2a0f3a', edge: '#2bf0ff', edgeMove: '#ff2bd6', deco: 'rgba(255,43,214,0.18)' } },
  { id: 'buz', name: 'Buz', price: 450, deco: 'flakes',
    c: { bg: '#e8f3fb', line: '#9ac0da', wall: '#b9d6ea', wallPassed: '#d3e5f2', wallMove: '#c9c2ec', edge: '#2a7fb8', edgeMove: '#6a4fc4', deco: 'rgba(120,170,210,0.6)', text: '#12324a', textDim: '#4f7591' } },
  { id: 'nebula', name: 'Nebula', price: null, deco: 'nebula', premiumBy: ['bopgate.harita.nebula', 'bopgate.destekci'],
    c: { bg: '#0d0820', line: '#3a2560', wall: '#2a1748', wallPassed: '#1b1030', wallMove: '#3a1650', edge: '#ff7ad9', edgeMove: '#7af0ff', deco: 'rgba(255,170,240,0.4)' } }
];

var CATALOG = { ball: BALLS, map: MAPS };

// Kalıcı güçlendirmeler: yıldızın oyun içi karşılığı. Her basamak bir kez alınır, geri satılmaz.
// values[seviye] o seviyenin etkisidir; prices[i] i → i+1 geçişinin fiyatı.
// Bunlar yalnız oynayarak kazanılan yıldızla alınır; gerçek parayla yıldız satılmaz.
var UPGRADES = [
  { id: 'kalkan', name: 'Kalkan kapasitesi', prices: [200, 600], values: [1, 2, 3],
    desc: function (v) { return tx('Aynı anda en çok {v} kalkan', { v: v }); } },
  { id: 'baslangic', name: 'Başlangıç kalkanı', prices: [450], values: [0, 1],
    desc: function (v) { return tx(v ? 'Her koşuya 1 kalkanla başla' : 'Koşuya kalkansız başla'); } },
  { id: 'sure', name: 'Uzun güçler', prices: [150, 400], values: [1, 1.25, 1.5],
    desc: function (v) { return v === 1 ? tx('Güçler normal süre (4 / 6 sn)') : tx('Güçler %{p} daha uzun', { p: Math.round((v - 1) * 100) }); } },
  { id: 'miknatis', name: 'Yıldız mıknatısı', prices: [250, 650], values: [1, 1.6, 2.2],
    desc: function (v) { return v === 1 ? tx('Yıldız ve güç normal alanda alınır') : tx('Yıldız ve güç {v} kat geniş alandan alınır', { v: decimal(v) }); } }
];

// Ölünce devam: koşu başına en çok REVIVE_MAX kez, fiyat her seferinde ikiye katlanır
var REVIVE_BASE = 15;
var REVIVE_MAX = 3;

function find(kind, id) {
  var list = CATALOG[kind] || [];
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}

function findUpgrade(id) {
  for (var i = 0; i < UPGRADES.length; i++) if (UPGRADES[i].id === id) return UPGRADES[i];
  return null;
}

function createProfile() {
  var upg = {};
  UPGRADES.forEach(function (u) { upg[u.id] = 0; });
  return { coins: 0, owned: { ball: ['klasik'], map: ['gece'] }, equipped: { ball: 'klasik', map: 'gece' }, upg: upg,
    ent: { noads: false, products: [] } };
}

function isPremium(item) { return !!(item && item.premiumBy); }
// Gerçek parayla alınan ürünün hakkı kayıtta var mı (kurcalanmış kayıt premium ürünü sahiplenemesin)
function premiumAllowed(ent, item) {
  if (!isPremium(item)) return true;
  for (var i = 0; i < item.premiumBy.length; i++) if (ent.products.indexOf(item.premiumBy[i]) >= 0) return true;
  return false;
}

// Dışarıdan gelen (localStorage) veriyi doğrular; tanınmayan her şeyi atar.
function sanitize(raw) {
  var p = createProfile();
  if (!raw || typeof raw !== 'object') return p;
  var coins = Math.floor(Number(raw.coins));
  p.coins = isFinite(coins) && coins > 0 ? Math.min(coins, 999999) : 0;
  var re = /^bopgate\.[a-z.]{3,40}$/;
  var rawEnt = raw.ent && typeof raw.ent === 'object' ? raw.ent : {};
  (Array.isArray(rawEnt.products) ? rawEnt.products : []).forEach(function (id) {
    if (typeof id === 'string' && re.test(id) && p.ent.products.indexOf(id) < 0 && p.ent.products.length < 20) p.ent.products.push(id);
  });
  p.ent.noads = rawEnt.noads === true && p.ent.products.length > 0;
  if (raw.ads && typeof raw.ads === 'object' && typeof raw.ads.day === 'string' && raw.ads.day.length <= 10) {
    var x2 = Math.floor(Number(raw.ads.x2));
    p.ads = { day: raw.ads.day, x2: isFinite(x2) && x2 > 0 ? Math.min(x2, 99) : 0 };
  }
  ['ball', 'map'].forEach(function (kind) {
    var owned = raw.owned && Array.isArray(raw.owned[kind]) ? raw.owned[kind] : [];
    owned.forEach(function (id) {
      var it = find(kind, id);
      if (it && premiumAllowed(p.ent, it) && p.owned[kind].indexOf(id) < 0) p.owned[kind].push(id);
    });
    var eq = raw.equipped && raw.equipped[kind];
    if (eq && p.owned[kind].indexOf(eq) >= 0) p.equipped[kind] = eq;
  });
  UPGRADES.forEach(function (u) {
    var lv = Math.floor(Number(raw.upg && raw.upg[u.id]));
    p.upg[u.id] = isFinite(lv) && lv > 0 ? Math.min(lv, u.prices.length) : 0;
  });
  return p;
}

function load(storage) {
  try {
    var txt = storage && storage.getItem(STORAGE_KEY);
    return sanitize(txt ? JSON.parse(txt) : null);
  } catch (e) {
    return createProfile();
  }
}

function save(storage, p) {
  try { if (storage) storage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch (e) {}
}

function owns(p, kind, id) {
  return p.owned[kind].indexOf(id) >= 0;
}

// { ok, reason } — reason: 'yok' | 'zaten-var' | 'premium' (yıldızla alınmaz) | 'yetersiz'
function buy(p, kind, id) {
  var item = find(kind, id);
  if (!item) return { ok: false, reason: 'yok' };
  if (owns(p, kind, id)) return { ok: false, reason: 'zaten-var' };
  if (isPremium(item)) return { ok: false, reason: 'premium' };
  if (p.coins < item.price) return { ok: false, reason: 'yetersiz' };
  p.coins -= item.price;
  p.owned[kind].push(id);
  p.equipped[kind] = id;
  return { ok: true };
}

function equip(p, kind, id) {
  if (!owns(p, kind, id)) return false;
  p.equipped[kind] = id;
  return true;
}

// Bir koşunun ödülü: toplanan yıldız + geçilen her eşik (10 bölüm) için MILESTONE_BONUS.
// Bölüm başına ayrı ödül yok: kazanç, ekranda toplanan yıldızla aynı kalsın.
// Oyun sonsuzdur; eşik sayısı state.milestones'ta, eski kayıtlar için bölümden de hesaplanır.
var MILESTONE_BONUS = 5;
function reward(state) {
  var levelsDone = Math.max(0, (state.level || 1) - 1);
  var ms = typeof state.milestones === 'number' ? state.milestones : Math.floor(levelsDone / 10);
  return (state.stars || 0) + MILESTONE_BONUS * ms;
}

// { ok, reason } — reason: 'yok' | 'tamam' (son basamak) | 'yetersiz'
function buyUpgrade(p, id) {
  var u = findUpgrade(id);
  if (!u) return { ok: false, reason: 'yok' };
  var lv = p.upg[id] || 0;
  if (lv >= u.prices.length) return { ok: false, reason: 'tamam' };
  if (p.coins < u.prices[lv]) return { ok: false, reason: 'yetersiz' };
  p.coins -= u.prices[lv];
  p.upg[id] = lv + 1;
  return { ok: true };
}

function upgradeValue(p, id) {
  var u = findUpgrade(id);
  return u.values[Math.min((p && p.upg && p.upg[id]) || 0, u.values.length - 1)];
}

// logic.createState(..., { mods }) için güçlendirme etkileri
function mods(p) {
  return {
    maxShield: upgradeValue(p, 'kalkan'),
    startShield: upgradeValue(p, 'baslangic'),
    powerMul: upgradeValue(p, 'sure'),
    magnet: upgradeValue(p, 'miknatis')
  };
}

function reviveCost(n) { return REVIVE_BASE * Math.pow(2, n || 0); }
function canRevive(p, n) { return (n || 0) < REVIVE_MAX && p.coins >= reviveCost(n); }
function payRevive(p, n) {
  if (!canRevive(p, n)) return false;
  p.coins -= reviveCost(n);
  return true;
}

function equippedBall(p) { return find('ball', p.equipped.ball) || BALLS[0]; }
function equippedMap(p) { return find('map', p.equipped.map) || MAPS[0]; }

var Shop = {
  STORAGE_KEY: STORAGE_KEY, CATALOG: CATALOG, find: find,
  createProfile: createProfile, sanitize: sanitize, load: load, save: save,
  owns: owns, buy: buy, equip: equip, isPremium: isPremium, reward: reward, MILESTONE_BONUS: MILESTONE_BONUS,
  equippedBall: equippedBall, equippedMap: equippedMap,
  UPGRADES: UPGRADES, findUpgrade: findUpgrade, buyUpgrade: buyUpgrade, upgradeValue: upgradeValue, mods: mods,
  REVIVE_BASE: REVIVE_BASE, REVIVE_MAX: REVIVE_MAX, reviveCost: reviveCost, canRevive: canRevive, payRevive: payRevive
};
if (typeof module !== 'undefined') module.exports = Shop;
if (typeof window !== 'undefined') window.GameShop = Shop;
})();
