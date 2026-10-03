// Sekme Gücü — yıldız ekonomisi simülasyonu (denge aracı, oyunun parçası değil)
//
// Soru: "Bir oyuncu mağazadaki şeylere kaç günde ulaşır?" Gelir kaynakları gerçek
// modüllerden okunur (Shop.reward, Quests.generate/applyRun, Quests.loginRewardFor),
// fiyatlar Shop kataloğundan gelir; yani fiyat ya da ödül değişince bu tablo da değişir.
//
// Oyuncu modeli (varsayım, ölçüm değil): her bölümde sabit bir ölüm olasılığı,
// bölüm başına 8 kapı, kapı başına yıldız çıkma olasılığı logic.js'teki gibi
// (2+ bölümde 0,4; 5+ bölümde güç çıkmazsa 0,4), oyuncunun çıkan yıldızı alma oranı,
// günde sabit sayıda koşu, her gün giriş. Devam (❤) harcaması sayılmaz: gerçek
// ilerleme bu tablodan daha yavaştır.
//
// Kullanım:
//   node tools/ekonomi.js            # tablo
//   node tools/ekonomi.js --gun 120  # daha uzun ufuk
var path = require('path');
var Shop = require(path.join(__dirname, '..', 'shop.js'));
var Quests = require(path.join(__dirname, '..', 'quests.js'));

var PLAYERS = [
  { id: 'gundelik', name: 'Gündelik', death: 0.30, runs: 5, pickup: 0.5 },
  { id: 'orta', name: 'Orta', death: 0.15, runs: 8, pickup: 0.65 },
  { id: 'usta', name: 'Usta', death: 0.07, runs: 10, pickup: 0.8 }
];

function rng(seed) {
  var a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Tek koşunun özeti: logic.js'in koşu sonunda verdiği alanlarla aynı adlar
function simRun(pl, r) {
  var level = 1, gates = 0, stars = 0, moving = 0, shieldUsed = 0;
  for (;;) {
    var dies = r() < pl.death;
    var deathGate = dies ? Math.floor(r() * 8) : 8;
    for (var g = 0; g < deathGate; g++) {
      gates++;
      var starP = level >= 5 ? 0.84 * 0.4 : level >= 2 ? 0.4 : 0;
      if (r() < starP && r() < pl.pickup) stars++;
      if (level >= 3 && r() < Math.min(0.7, 0.18 * (level - 2))) moving++;
    }
    if (dies) break;
    level++;
  }
  if (stars > 0 && r() < 0.4) shieldUsed = 1;
  return { stars: stars, score: gates, level: level, milestones: Math.floor((level - 1) / 10),
    movingPassed: moving, shieldUsed: shieldUsed, status: 'over' };
}

function prices() {
  var cos = [], upg = [];
  ['ball', 'map'].forEach(function (k) {
    Shop.CATALOG[k].forEach(function (it) { if (it.price > 0) cos.push(it.price); });
  });
  Shop.UPGRADES.forEach(function (u) { u.prices.forEach(function (p) { upg.push(p); }); });
  var sum = function (a) { return a.reduce(function (x, y) { return x + y; }, 0); };
  return { cheapest: Math.min.apply(null, cos.concat(upg)), cosmetics: sum(cos), upgrades: sum(upg), all: sum(cos) + sum(upg) };
}

// Bir oyuncu tipi için günlük birikimli gelir; seeds tohum üzerinden ortalama
function simulate(pl, days, seeds) {
  var cum = [];
  for (var d = 0; d < days; d++) cum.push(0);
  for (var s = 0; s < seeds; s++) {
    var r = rng(1000 + s * 7919 + pl.death * 1e4);
    var daily = Quests.fresh(), total = 0;
    for (var day = 0; day < days; day++) {
      var dt = new Date(Date.UTC(2026, 0, 1 + day + s * 37));
      var key = dt.getUTCFullYear() + '-' + String(dt.getUTCMonth() + 1).padStart(2, '0') + '-' + String(dt.getUTCDate()).padStart(2, '0');
      total += Quests.ensureDay(daily, key).coins;
      for (var k = 0; k < pl.runs; k++) {
        var run = simRun(pl, r);
        total += Shop.reward(run);
        Quests.applyRun(daily, run).forEach(function (q) { total += q.reward; });
      }
      cum[day] += total / seeds;
    }
  }
  return cum;
}

function dayReaching(cum, amount) {
  for (var i = 0; i < cum.length; i++) if (cum[i] >= amount) return i + 1;
  return null;
}

function analyze(days, seeds) {
  var p = prices();
  return {
    prices: p,
    players: PLAYERS.map(function (pl) {
      var cum = simulate(pl, days, seeds || 20);
      return {
        id: pl.id, name: pl.name, perDay: cum[cum.length - 1] / cum.length,
        firstBuy: dayReaching(cum, p.cheapest), upgrades: dayReaching(cum, p.upgrades),
        cosmetics: dayReaching(cum, p.cosmetics), all: dayReaching(cum, p.all)
      };
    })
  };
}

if (require.main === module) {
  var i = process.argv.indexOf('--gun');
  var days = i > 0 ? Math.max(10, parseInt(process.argv[i + 1], 10) || 90) : 90;
  var res = analyze(days, 20);
  var p = res.prices;
  console.log('Fiyatlar: en ucuz ★' + p.cheapest + ' · görünümler ★' + p.cosmetics + ' · güçlendirmeler ★' + p.upgrades + ' · hepsi ★' + p.all);
  console.log('(gün = o miktara ulaşılan gün; devam harcaması sayılmaz; "—" = ' + days + ' günde ulaşılmadı)');
  console.log('oyuncu     ★/gün  ilk alım  güçler  görünüm  hepsi');
  res.players.forEach(function (r) {
    var f = function (v) { return v === null ? '—' : String(v); };
    console.log((r.name + '          ').slice(0, 10) + ' ' + ('     ' + r.perDay.toFixed(0)).slice(-5) +
      '  ' + ('        ' + f(r.firstBuy)).slice(-8) + '  ' + ('      ' + f(r.upgrades)).slice(-6) +
      '  ' + ('       ' + f(r.cosmetics)).slice(-7) + '  ' + ('     ' + f(r.all)).slice(-5));
  });
}

module.exports = { analyze: analyze, PLAYERS: PLAYERS, simRun: simRun };
