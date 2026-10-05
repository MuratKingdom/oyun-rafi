// Sekme Gücü (Bopgate) — gerçek parayla satın alma ve ödüllü reklam (saf mantık + sağlayıcı sarmalayıcı)
//
// Ürünler tek seferliktir (Play'de "yönetilen, tüketilmeyen" ürün). Fiyatı Play Console belirler;
// burada yalnız önerilen fiyat (suggest) ve ürünün verdiği haklar durur.
// Haklar profilde tutulur: p.ent = { noads: bool, products: [ürün kimlikleri] }. Bir ürünün
// hakkı bir kez uygulanır (yıldız hediyesi tekrar verilmez); geri yüklemede eksikler uygulanır.
//
// Sağlayıcı: Android paketinde window.BopgateNative (android-paket/bridge.js) gerçek Play Billing
// ve AdMob'a bağlanır. Tarayıcıda yerel köprü yoktur: satın alma ve reklam kapalıdır (dürüstçe
// "uygulamada" yazar). Testler ve elle deneme için sahte sağlayıcı (mockProvider) vardır;
// tarayıcıda adres çubuğuna ?demo-odeme eklenirse o kullanılır (gerçek para yok).
//
// Ödüllü reklam yerleri: 'devam' (koşu başına 1 bedava devam) ve 'iki_kat' (koşunun yıldızını
// ikiye katlar, günde en çok AD_X2_PER_DAY kez). Reklamsız hakkı olan oyuncu reklam izlemeden
// aynı ödülü alır. Ara reklam ve banner yoktur.
// Tarayıcıda bütün betikler aynı genel kapsamı paylaşır; dosya kendi kapsamında çalışır.
(function () {

var AD_X2_PER_DAY = 5;
var PRODUCT_RE = /^bopgate\.[a-z.]{3,40}$/;

var PRODUCTS = [
  // İlk alım: düşük fiyatlı, içeriği belli paket (rekoru 10'u geçen oyuncuya açılışta bir kez hatırlatılır)
  { id: 'bopgate.baslangic', name: 'Başlangıç paketi', suggest: '₺19,99', starter: true,
    desc: '★ 400 + Kor ve Nane topları', grants: { items: [['ball', 'kor'], ['ball', 'nane']], coins: 400 } },
  { id: 'bopgate.reklamsiz', name: 'Reklamsız', suggest: '₺49,99',
    desc: 'Reklam izlemeden ödül: bedava devam ve ★ x2 anında', grants: { noads: true } },
  { id: 'bopgate.destekci', name: 'Destekçi paketi', suggest: '₺149,99', best: true,
    desc: 'Reklamsız + Alev topu + Nebula haritası + ★ 1000', grants: { noads: true, items: [['ball', 'alev'], ['map', 'nebula']], coins: 1000 } },
  { id: 'bopgate.ozellik.paket', name: 'Güç paketi', suggest: '₺99,99',
    desc: 'Bütün güçlendirmeler son basamakta', grants: { maxUpgrades: true } },
  { id: 'bopgate.top.alev', name: 'Alev topu', suggest: '₺29,99',
    desc: 'Yalnız satın alınabilen top', grants: { items: [['ball', 'alev']] } },
  { id: 'bopgate.top.kristal', name: 'Kristal topu', suggest: '₺29,99',
    desc: 'Yalnız satın alınabilen top', grants: { items: [['ball', 'kristal']] } },
  { id: 'bopgate.harita.nebula', name: 'Nebula haritası', suggest: '₺39,99',
    desc: 'Yalnız satın alınabilen harita, kendi müziğiyle', grants: { items: [['map', 'nebula']] } }
];

function product(id) {
  for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i];
  return null;
}
function ids() { return PRODUCTS.map(function (p) { return p.id; }); }

function ent(p) {
  if (!p.ent || typeof p.ent !== 'object') p.ent = { noads: false, products: [] };
  if (!Array.isArray(p.ent.products)) p.ent.products = [];
  return p.ent;
}
function owned(p, id) { return ent(p).products.indexOf(id) >= 0; }
function hasNoAds(p) { return !!ent(p).noads; }

// Bir ürünün haklarını profile uygular. Yeni uygulandıysa true; zaten varsa false (hediye tekrar yok).
function grant(Shop, p, id) {
  var pr = product(id);
  if (!pr || owned(p, id)) return false;
  var e = ent(p);
  e.products.push(id);
  var g = pr.grants;
  if (g.noads) e.noads = true;
  (g.items || []).forEach(function (it) {
    if (p.owned[it[0]].indexOf(it[1]) < 0) p.owned[it[0]].push(it[1]);
  });
  if (g.coins) p.coins = Math.min(999999, p.coins + g.coins);
  if (g.maxUpgrades) Shop.UPGRADES.forEach(function (u) { p.upg[u.id] = u.prices.length; });
  return true;
}

// --- Ödüllü reklam günlük sayacı (profilde: p.ads = { day, x2 }) ---------------
function adState(p, day) {
  if (!p.ads || typeof p.ads !== 'object' || p.ads.day !== day) p.ads = { day: day, x2: 0 };
  return p.ads;
}
function x2Left(p, day) { return Math.max(0, AD_X2_PER_DAY - adState(p, day).x2); }
function useX2(p, day) {
  var s = adState(p, day);
  if (s.x2 >= AD_X2_PER_DAY) return false;
  s.x2++;
  return true;
}

// --- Sağlayıcılar --------------------------------------------------------------
// call: köprüyü çağıran fonksiyon. Köprü anında fırlatsa da, reddetse de oyun yedek sonucu alır.
function softly(call, fallback) {
  try {
    return Promise.resolve(call()).then(function (v) { return v == null ? fallback : v; }, function () { return fallback; });
  } catch (e) {
    return Promise.resolve(fallback);
  }
}

// native: window.BopgateNative ya da null. Dönen nesne hiçbir zaman fırlatmaz.
function provider(native) {
  if (!native || !native.iap || !native.ads) {
    return {
      platform: 'web', canBuy: false, canAds: false,
      products: function () { return Promise.resolve([]); },
      buy: function (id) { return Promise.resolve({ ok: false, id: id, reason: 'yok' }); },
      restore: function () { return Promise.resolve([]); },
      rewarded: function () { return Promise.resolve({ rewarded: false }); }
    };
  }
  return {
    platform: native.platform || 'android', canBuy: true, canAds: true,
    products: function (list) { return softly(function () { return native.iap.products(list || ids()); }, []); },
    buy: function (id) { return softly(function () { return native.iap.buy(id); }, { ok: false, id: id, reason: 'hata' }); },
    restore: function () { return softly(function () { return native.iap.restore(); }, []); },
    rewarded: function (placement) { return softly(function () { return native.ads.rewarded(placement); }, { rewarded: false }); }
  };
}

// Testler ve ?demo-odeme için: gerçek para ve reklam yok, her şey anında olur.
// opts: { adResult: true|false, buyResult: true|false, owned: [ids] }
function mockProvider(opts) {
  opts = opts || {};
  var calls = { buy: 0, ads: 0, restore: 0 };
  var bought = (opts.owned || []).slice();
  return {
    platform: 'demo', canBuy: true, canAds: true, calls: calls,
    products: function (list) {
      return Promise.resolve((list || ids()).map(function (id) { var p = product(id); return { id: id, price: p ? p.suggest : '?' }; }));
    },
    buy: function (id) {
      calls.buy++;
      var ok = opts.buyResult !== false && !!product(id);
      if (ok && bought.indexOf(id) < 0) bought.push(id);
      return Promise.resolve(ok ? { ok: true, id: id } : { ok: false, id: id, reason: 'iptal' });
    },
    restore: function () { calls.restore++; return Promise.resolve(bought.slice()); },
    rewarded: function () { calls.ads++; return Promise.resolve({ rewarded: opts.adResult !== false }); }
  };
}

// Reklamsız hakkı varsa reklam gösterilmeden ödül verilir.
function rewardedOrSkip(prov, p, placement) {
  if (hasNoAds(p)) return Promise.resolve({ rewarded: true, skipped: true });
  if (!prov.canAds) return Promise.resolve({ rewarded: false });
  return prov.rewarded(placement);
}

var Monetize = {
  PRODUCTS: PRODUCTS, PRODUCT_RE: PRODUCT_RE, AD_X2_PER_DAY: AD_X2_PER_DAY,
  product: product, ids: ids, ent: ent, owned: owned, hasNoAds: hasNoAds, grant: grant,
  x2Left: x2Left, useX2: useX2, provider: provider, mockProvider: mockProvider, rewardedOrSkip: rewardedOrSkip
};
if (typeof module !== 'undefined') module.exports = Monetize;
if (typeof window !== 'undefined') window.GameMonetize = Monetize;
})();
