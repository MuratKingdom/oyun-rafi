// Köprü davranış testi (önce: node hazirla.js). Kullanım: node kopru-test.js
// Köprü davranış testi: (1) eklentisiz tarayıcıda yumuşak hata, (2) sahte eklentilerle mutlu yol.
var path = require('path');
var fs = require('fs');
var os = require('os');
var { chromium } = require(process.env.PLAYWRIGHT_CORE || '/opt/node-tools/node_modules/playwright-core');
var KOK = __dirname;
var GECICI = fs.mkdtempSync(path.join(os.tmpdir(), 'bopgate-kopru-'));

var SAHTE = `
(function(){
  var dinleyiciler = {};
  function ekle(o,f){(dinleyiciler[o]=dinleyiciler[o]||[]).push(f);return {remove:function(){}};}
  function yay(o,v){(dinleyiciler[o]||[]).forEach(function(f){f(v);});}
  var signed=false, snap=null;
  window.__odulVer = true;
  window.Capacitor = { Plugins: {
    AdMob: {
      initialize: function(){return Promise.resolve();},
      requestConsentInfo: function(){return Promise.resolve({status:'NOT_REQUIRED',canRequestAds:true});},
      showConsentForm: function(){return Promise.resolve({});},
      prepareRewardVideoAd: function(o){window.__adId=o.adId;return Promise.resolve({adUnitId:o.adId});},
      showRewardVideoAd: function(){
        return new Promise(function(res){
          setTimeout(function(){
            if (window.__odulVer){ yay('onRewardedVideoAdReward',{type:'x',amount:1}); res({type:'x',amount:1}); }
            setTimeout(function(){ yay('onRewardedVideoAdDismissed'); },50);
          },50);
        });
      },
      addListener: ekle
    },
    PlayGames: {
      isSignedIn: function(){return Promise.resolve({signedIn:signed});},
      signIn: function(o){ if(o && o.silent===false) signed=true; return Promise.resolve({signedIn:signed}); },
      submitScore: function(o){window.__skor=o;return Promise.resolve({});},
      showLeaderboard: function(o){window.__lb=o;return Promise.resolve();},
      saveSnapshot: function(o){snap=o.data;return Promise.resolve();},
      loadSnapshot: function(o){return Promise.resolve({snapshot: snap==null?null:{name:o.name,data:snap}});}
    }
  }};
  // Sahte CdvPurchase
  var cb = {};
  var urunler = {};
  var sahip = {};
  window.cordova = {};
  window.CdvPurchase = {
    ProductType:{NON_CONSUMABLE:'non consumable'}, Platform:{GOOGLE_PLAY:'android-playstore'},
    TransactionState:{APPROVED:'approved',FINISHED:'finished'}, ErrorCode:{PAYMENT_CANCELLED:6777006},
    store: {
      localReceipts: [],
      register: function(l){ l.forEach(function(p){ urunler[p.id]={id:p.id,pricing:{price:'₺49,99'},getOffer:function(){return {productId:p.id};}}; }); },
      when: function(){ var w={approved:function(f){cb.approved=f;return w;},verified:function(f){cb.verified=f;return w;},finished:function(f){cb.finished=f;return w;}}; return w; },
      error: function(){},
      initialize: function(){ return Promise.resolve([]); },
      update: function(){ return Promise.resolve(); },
      get: function(id){ return urunler[id]; },
      owned: function(p){ return !!sahip[p.id]; },
      order: function(o){
        if (o.productId==='bopgate.destekci') return Promise.resolve({isError:true, code:6777006});
        setTimeout(function(){
          var t={products:[{id:o.productId}],verify:function(){cb.verified({finish:function(){sahip[o.productId]=true;cb.finished(t);}});}};
          cb.approved(t);
        },30);
        return Promise.resolve(undefined);
      },
      restorePurchases: function(){ return Promise.resolve(); }
    }
  };
  setTimeout(function(){ document.dispatchEvent(new Event('deviceready')); }, 20);
})();
`;

(async function () {
  var b = await chromium.launch({ executablePath: process.env.CHROMIUM_YOLU || '/opt/pw-browsers/chromium' });
  var html = fs.readFileSync(path.join(KOK, 'www/index.html'), 'utf8');
  var hata = 0;
  function bekle(ad, kosul) { if (!kosul) { hata++; console.log('BAŞARISIZ:', ad); } else console.log('tamam:', ad); }

  // 1) Eklentisiz
  var s = await b.newPage();
  var konsolHata = [];
  s.on('pageerror', function (e) { konsolHata.push(e.message); });
  // BopgateNative oyun betiklerinden önce var mı? İlk oyun betiğine bir yoklama ekle.
  var yoklama = html.replace('<script>\n', '<script>window.__onceVarMi = !!window.BopgateNative;</script>\n<script>\n');
  fs.writeFileSync(path.join(GECICI, 't1.html'), yoklama); await s.goto('file://' + path.join(GECICI, 't1.html'));
  bekle('köprü oyun betiklerinden önce tanımlı', await s.evaluate('window.__onceVarMi'));
  var r1 = await s.evaluate(async function () {
    var N = window.BopgateNative;
    return {
      platform: N.platform,
      p: await N.iap.products(['bopgate.reklamsiz']),
      buy: await N.iap.buy('bopgate.reklamsiz'),
      rest: await N.iap.restore(),
      ad: await N.ads.rewarded('devam'),
      si: await N.games.signIn(),
      ss: await N.games.submitScore(10),
      sl: await N.games.showLeaderboard(),
      sv: await N.games.saveGame('{}'),
      lg: await N.games.loadGame(),
      oyun: !!window.GameLogic || Object.keys(window).filter(function(k){return /^Game/.test(k);}).length
    };
  });
  console.log(JSON.stringify(r1));
  bekle('eklentisiz: tüm çağrılar olumsuz çözülür', r1.platform === 'android' && r1.p.length === 0 && r1.buy.ok === false && r1.buy.reason === 'hata' &&
    r1.rest.length === 0 && r1.ad.rewarded === false && r1.si === false && r1.ss === undefined && r1.sl === undefined && r1.sv === false && r1.lg === null);
  bekle('oyun açıldı, sayfa hatası yok', konsolHata.length === 0 && r1.oyun);
  if (konsolHata.length) console.log(konsolHata);

  // 2) Sahte eklentiler
  var s2 = await b.newPage();
  var h2 = [];
  s2.on('pageerror', function (e) { h2.push(e.message); });
  fs.writeFileSync(path.join(GECICI, 't2.html'), html.replace('<script data-bopgate-kopru>', '<script>' + SAHTE + '</script>\n<script data-bopgate-kopru>')); await s2.goto('file://' + path.join(GECICI, 't2.html'));
  var r2 = await s2.evaluate(async function () {
    var N = window.BopgateNative;
    var olay = null;
    window.addEventListener('bopgate-satinalma', function (e) { olay = e.detail.id; });
    var out = {};
    out.p = await N.iap.products(['bopgate.reklamsiz', 'bopgate.top.alev']);
    out.buy = await N.iap.buy('bopgate.reklamsiz');
    out.iptal = await N.iap.buy('bopgate.destekci');
    out.rest = await N.iap.restore();
    out.olay = olay;
    out.ad = await N.ads.rewarded('iki_kat');
    window.__odulVer = false;
    out.adYok = await N.ads.rewarded('devam');
    out.adId = window.__adId;
    out.si = await N.games.signIn();
    await N.games.submitScore(42.7);
    out.skor = window.__skor || null; // liderlik kimliği yer tutucu -> gönderilmez
    out.sv = await N.games.saveGame('{"a":1}');
    out.lg = await N.games.loadGame();
    return out;
  });
  console.log(JSON.stringify(r2));
  bekle('ürün fiyatları', r2.p.length === 2 && r2.p[0].price === '₺49,99');
  bekle('satın alma ok', r2.buy.ok === true && r2.buy.id === 'bopgate.reklamsiz');
  bekle('iptal', r2.iptal.ok === false && r2.iptal.reason === 'iptal');
  bekle('restore', JSON.stringify(r2.rest) === '["bopgate.reklamsiz"]');
  bekle('satın alma olayı', r2.olay === 'bopgate.reklamsiz');
  bekle('ödüllü reklam: ödül', r2.ad.rewarded === true);
  bekle('ödüllü reklam: ödülsüz kapatma', r2.adYok.rewarded === false);
  bekle('test reklam birimi', r2.adId === 'ca-app-pub-3940256099942544/5224354917');
  bekle('giriş', r2.si === true);
  bekle('yer tutucu liderlik kimliğiyle skor gönderilmez', r2.skor === null);
  bekle('kayıt/yükleme', r2.sv === true && r2.lg === '{"a":1}');
  bekle('sayfa hatası yok', h2.length === 0);
  if (h2.length) console.log(h2);
  await b.close();
  console.log(hata ? 'BAŞARISIZ: ' + hata : 'HEPSİ GEÇTİ');
  process.exit(hata ? 1 : 0);
})();
