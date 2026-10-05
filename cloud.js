// Sekme Gücü (Bopgate) — bulut kayıt birleştirme (saf mantık; DOM yok)
//
// Android'de Play Games kayıtlı oyunu (window.BopgateNative.games.saveGame / loadGame) profili
// cihazlar arasında taşır. İki kayıt (bu cihaz + bulut) çakışırsa hiçbir kazanım kaybolmasın diye
// birleştirilir: sahip olunan görünümler ve satın alma hakları birleşimi, güçlendirme basamakları ve
// rekor en büyüğü, cüzdan en büyüğü (iki cihazda ayrı ayrı biriken yıldız toplanmaz — çift sayım
// olmasın), kuşanılan görünüm bu cihazınki. Bulut verisi her zaman Shop.sanitize'dan geçer.
// Tarayıcıda bütün betikler aynı genel kapsamı paylaşır; dosya kendi kapsamında çalışır.
(function () {

var VERSION = 1;

function pack(profile, best) {
  return JSON.stringify({ v: VERSION, profile: profile, best: best || 0 });
}

// Bozuk / tanınmayan veri → null
function unpack(Shop, text) {
  try {
    var d = JSON.parse(text);
    if (!d || d.v !== VERSION || typeof d.profile !== 'object') return null;
    var best = Math.floor(Number(d.best));
    return { profile: Shop.sanitize(d.profile), best: isFinite(best) && best > 0 ? Math.min(best, 1e6) : 0 };
  } catch (e) {
    return null;
  }
}

function merge(Shop, local, localBest, remote) {
  if (!remote) return { profile: local, best: localBest || 0, changed: false };
  var before = pack(local, localBest);
  var p = Shop.sanitize(JSON.parse(JSON.stringify(local)));
  var r = remote.profile;
  p.coins = Math.max(p.coins, r.coins);
  ['ball', 'map'].forEach(function (k) {
    r.owned[k].forEach(function (id) { if (p.owned[k].indexOf(id) < 0) p.owned[k].push(id); });
  });
  Shop.UPGRADES.forEach(function (u) { p.upg[u.id] = Math.max(p.upg[u.id] || 0, r.upg[u.id] || 0); });
  r.ent.products.forEach(function (id) { if (p.ent.products.indexOf(id) < 0) p.ent.products.push(id); });
  p.ent.noads = p.ent.noads || r.ent.noads;
  // sahip olunan her şey yerleşti; premium kuralları için son bir doğrulama
  p = Shop.sanitize(p);
  var best = Math.max(localBest || 0, remote.best || 0);
  return { profile: p, best: best, changed: pack(p, best) !== before };
}

var Cloud = { VERSION: VERSION, pack: pack, unpack: unpack, merge: merge };
if (typeof module !== 'undefined') module.exports = Cloud;
if (typeof window !== 'undefined') window.GameCloud = Cloud;
})();
