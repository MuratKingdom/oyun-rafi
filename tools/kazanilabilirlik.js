// Sekme Gücü — kazanılabilirlik botu (denge aracı, oyunun parçası değil)
//
// Rastgele aday planları (5 karelik basılı/bırak blokları) ileriye doğru simüle
// eder, hayatta kalan ve bir sonraki kapı ağzına en yakın olanı seçer.
// Amaç: "her dizilim fiziksel olarak geçilebilir mi" sorusunu ölçmek. İnsanın
// tepki süresini temsil etmez; insan dengesini elle oynayarak ayarla.
//
// Kullanım:
//   node tools/kazanilabilirlik.js                 # 8 tohum, kalkan açık
//   node tools/kazanilabilirlik.js --kalkansiz 1,2  # kalkan kapalı (daha sert ölçüt)
//   node tools/kazanilabilirlik.js --guclu 4        # daha derin arama (yavaş)
var path = require('path');

function load(noShield) {
  var file = path.join(__dirname, '..', 'logic.js');
  if (!noShield) return require(file);
  // Kalkansız sürüm: MAX_SHIELD = 0 ile ayrı bir modül örneği
  var src = require('fs').readFileSync(file, 'utf8').replace('var MAX_SHIELD = 1;', 'var MAX_SHIELD = 0;');
  var m = { exports: {} };
  new Function('module', 'window', src)(m, undefined);
  return m.exports;
}

function play(seed, opts) {
  opts = opts || {};
  var L = load(opts.shield === false);
  var DT = 1 / 60, BLOCK = 5;
  var DEPTH = opts.depth || 24, N = opts.n || 80;
  var a = 12345;
  function rng() { a = (a * 1103515245 + 12345) & 0x7fffffff; return a / 0x7fffffff; }
  function clone(s) {
    var c = Object.assign({}, s);
    c.obstacles = s.obstacles.map(function (o) {
      var w = Object.assign({}, o);
      if (o.star) w.star = { taken: o.star.taken };
      return w;
    });
    return c;
  }
  function evalPlan(s, plan) {
    var c = clone(s), f = 0;
    for (var b = 0; b < plan.length; b++) {
      for (var i = 0; i < BLOCK; i++, f++) {
        L.step(c, { action: plan[b] }, DT);
        if (c.status === 'over') return f - 1e5 + c.score * 1000;
        if (c.status === 'won') return 1e9;
      }
    }
    var tgt = null;
    for (var k = 0; k < c.obstacles.length; k++) {
      if (c.obstacles[k].x + 28 > 148) { tgt = c.obstacles[k]; break; }
    }
    var mid = tgt ? tgt.gapY + tgt.gapH / 2 : 300;
    return c.score * 1000 + c.shield * 300 - Math.abs(c.y - mid) * 0.5;
  }
  var s = L.createState(seed), best = [];
  for (var i = 0; i < DEPTH; i++) best.push(false);
  while (s.status === 'playing' && s.t < 600) {
    var cands = [best.slice(1).concat([false]), best.slice(1).concat([true])];
    for (var n = 0; n < N; n++) {
      var p = [], on = rng() < 0.5;
      for (var d = 0; d < DEPTH; d++) { if (rng() < 0.3) on = !on; p.push(on); }
      cands.push(p);
      var q = best.slice(1).concat([rng() < 0.5]);
      for (var m = 0; m < DEPTH; m++) if (rng() < 0.12) q[m] = !q[m];
      cands.push(q);
    }
    var bs = -Infinity, bp = null;
    for (var c = 0; c < cands.length; c++) {
      var v = evalPlan(s, cands[c]);
      if (v > bs) { bs = v; bp = cands[c]; }
    }
    best = bp;
    for (var j = 0; j < BLOCK && s.status === 'playing'; j++) L.step(s, { action: best[0] }, DT);
  }
  return s;
}

if (require.main === module) {
  var args = process.argv.slice(2);
  var opts = { shield: args.indexOf('--kalkansiz') < 0 };
  if (args.indexOf('--guclu') >= 0) { opts.depth = 36; opts.n = 300; }
  var list = args.filter(function (x) { return /^[\d,]+$/.test(x); })[0] || '1,2,3,4,5,42,99,1234';
  var seeds = list.split(',').map(Number), wins = 0;
  seeds.forEach(function (sd) {
    var s = play(sd, opts);
    if (s.status === 'won') wins++;
    console.log('tohum ' + sd + ': ' + s.status + ' · kapı ' + s.score + ' · bölüm ' + s.level +
      ' · yıldız ' + s.stars + ' · kalkan kullanımı ' + s.shieldUsed + ' · ' + s.t.toFixed(0) + ' sn' +
      (s.status === 'over' ? ' · ' + s.overReason : ''));
  });
  console.log('kazanılan: ' + wins + '/' + seeds.length + (opts.shield ? '' : ' (kalkansız)'));
}

module.exports = { play: play };
