// Sekme Gücü — mağaza: katalog, cüzdan, satın alma, kuşanma (saf mantık; DOM yok)
//
// Para birimi yıldızdır. Oyun sonunda kazanılan: o koşuda toplanan yıldızlar
// + geçilen her bölüm için 1 + kazanınca 10. Gerçek para yok.
// Profil tarayıcıda localStorage'da tutulur; bozuk/eksik veri sessizce varsayılana döner.

var STORAGE_KEY = 'sekmeguc-profil';

// Top görünümleri. shape: circle | square | diamond | star | ring
var BALLS = [
  { id: 'klasik', name: 'Klasik', price: 0, shape: 'circle', color: '#5ac8fa' },
  { id: 'kor', name: 'Kor', price: 15, shape: 'circle', color: '#ff8a3d' },
  { id: 'nane', name: 'Nane', price: 15, shape: 'circle', color: '#46d39a' },
  { id: 'kup', name: 'Küp', price: 30, shape: 'square', color: '#f2f2f2' },
  { id: 'elmas', name: 'Elmas', price: 45, shape: 'diamond', color: '#7fe3ff' },
  { id: 'yildiz', name: 'Yıldız', price: 60, shape: 'star', color: '#ff8ee8' },
  { id: 'gezegen', name: 'Gezegen', price: 90, shape: 'ring', color: '#c49bff' }
];

// Harita temaları. deco: arka plan süsü (dots | sun | trees | grid | flakes)
var MAPS = [
  { id: 'gece', name: 'Gece', price: 0, deco: 'dots',
    c: { bg: '#0b1220', line: '#223352', wall: '#1f3150', wallPassed: '#16233b', wallMove: '#2b2650', edge: '#5ac8fa', edgeMove: '#b39dfa', deco: 'rgba(200,220,255,0.35)' } },
  { id: 'gunbatimi', name: 'Gün Batımı', price: 40, deco: 'sun',
    c: { bg: '#2a1530', line: '#5a2f4a', wall: '#4a2340', wallPassed: '#331a2e', wallMove: '#5a2a5e', edge: '#ffb36b', edgeMove: '#ff7fb0', deco: 'rgba(255,170,90,0.16)' } },
  { id: 'orman', name: 'Orman', price: 40, deco: 'trees',
    c: { bg: '#0e1f17', line: '#24443a', wall: '#1d3b2c', wallPassed: '#152a20', wallMove: '#2d3b1d', edge: '#8fe388', edgeMove: '#e3d488', deco: 'rgba(60,120,80,0.55)' } },
  { id: 'neon', name: 'Neon', price: 70, deco: 'grid',
    c: { bg: '#07050f', line: '#ff2bd6', wall: '#1a0f33', wallPassed: '#120a24', wallMove: '#2a0f3a', edge: '#2bf0ff', edgeMove: '#ff2bd6', deco: 'rgba(255,43,214,0.18)' } },
  { id: 'buz', name: 'Buz', price: 70, deco: 'flakes',
    c: { bg: '#e8f3fb', line: '#9ac0da', wall: '#b9d6ea', wallPassed: '#d3e5f2', wallMove: '#c9c2ec', edge: '#2a7fb8', edgeMove: '#6a4fc4', deco: 'rgba(120,170,210,0.6)', text: '#12324a', textDim: '#4f7591' } }
];

var CATALOG = { ball: BALLS, map: MAPS };

function find(kind, id) {
  var list = CATALOG[kind] || [];
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}

function createProfile() {
  return { coins: 0, owned: { ball: ['klasik'], map: ['gece'] }, equipped: { ball: 'klasik', map: 'gece' } };
}

// Dışarıdan gelen (localStorage) veriyi doğrular; tanınmayan her şeyi atar.
function sanitize(raw) {
  var p = createProfile();
  if (!raw || typeof raw !== 'object') return p;
  var coins = Math.floor(Number(raw.coins));
  p.coins = isFinite(coins) && coins > 0 ? Math.min(coins, 999999) : 0;
  ['ball', 'map'].forEach(function (kind) {
    var owned = raw.owned && Array.isArray(raw.owned[kind]) ? raw.owned[kind] : [];
    owned.forEach(function (id) {
      if (find(kind, id) && p.owned[kind].indexOf(id) < 0) p.owned[kind].push(id);
    });
    var eq = raw.equipped && raw.equipped[kind];
    if (eq && p.owned[kind].indexOf(eq) >= 0) p.equipped[kind] = eq;
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

// { ok, reason } — reason: 'yok' | 'zaten-var' | 'yetersiz'
function buy(p, kind, id) {
  var item = find(kind, id);
  if (!item) return { ok: false, reason: 'yok' };
  if (owns(p, kind, id)) return { ok: false, reason: 'zaten-var' };
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

// Bir koşunun ödülü: toplanan yıldız + geçilen bölüm başına 1 + kazanma bonusu 10
function reward(state) {
  var levelsDone = Math.max(0, (state.level || 1) - 1);
  return (state.stars || 0) + levelsDone + (state.status === 'won' ? 10 : 0);
}

function equippedBall(p) { return find('ball', p.equipped.ball) || BALLS[0]; }
function equippedMap(p) { return find('map', p.equipped.map) || MAPS[0]; }

var Shop = {
  STORAGE_KEY: STORAGE_KEY, CATALOG: CATALOG, find: find,
  createProfile: createProfile, sanitize: sanitize, load: load, save: save,
  owns: owns, buy: buy, equip: equip, reward: reward,
  equippedBall: equippedBall, equippedMap: equippedMap
};
if (typeof module !== 'undefined') module.exports = Shop;
if (typeof window !== 'undefined') window.GameShop = Shop;
