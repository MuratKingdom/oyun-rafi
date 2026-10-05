/*
 * Bopgate — Android yerel köprüsü (window.BopgateNative)
 *
 * hazirla.js bu dosyayı www/index.html içine, oyun betiklerinden ÖNCE satır içi gömer.
 * Oyun tarafı yalnızca aşağıdaki sözleşmeye güvenir:
 *
 *   BopgateNative.platform                 -> 'android'
 *   BopgateNative.iap.products(ids)        -> Promise<[{ id, price }]>
 *   BopgateNative.iap.buy(id)              -> Promise<{ ok, id, reason?: 'iptal'|'hata' }>
 *   BopgateNative.iap.restore()            -> Promise<string[]>
 *   BopgateNative.ads.rewarded(placement)  -> Promise<{ rewarded }>   ('devam' | 'iki_kat')
 *   BopgateNative.games.signIn()           -> Promise<boolean>
 *   BopgateNative.games.submitScore(score) -> Promise<void>
 *   BopgateNative.games.showLeaderboard()  -> Promise<void>
 *   BopgateNative.games.saveGame(json)     -> Promise<boolean>
 *   BopgateNative.games.loadGame()         -> Promise<string|null>
 *
 * KURAL: Hiçbir çağrı oyuna hata fırlatmaz (reject etmez). Her hata yakalanır ve
 * olumsuz bir sonuçla çözülür (ok:false / rewarded:false / false / null / []).
 *
 * Eklentiler (bkz. android-paket/README.md):
 *   - Reklam:        @capacitor-community/admob      -> Capacitor.Plugins.AdMob
 *   - Uygulama içi:  cordova-plugin-purchase (v13)   -> window.CdvPurchase
 *   - Play Games:    @modbender/capacitor-play-games -> Capacitor.Plugins.PlayGames
 *
 * Not: Bu dosya satır içi gömüldüğü için içinde kapanış betik etiketi geçmemeli.
 */
(function () {
  'use strict';

  // ===================================================================================
  // YAPILANDIRMA — Play Console / AdMob kimlikleri YALNIZCA burada değiştirilir.
  // Gizli anahtar, parola veya imza bilgisi bu dosyaya ASLA yazılmaz.
  // ===================================================================================
  var YAPILANDIRMA = {
    admob: {
      // >>> GERÇEK KİMLİKLERİ BURAYA YAZIN <<<
      // Şu an Google'ın resmi TEST ödüllü reklam birimi kullanılıyor.
      // Yayın öncesi: AdMob'daki gerçek ödüllü reklam birimi kimliğini yazın ve
      // testModu'nu false yapın. (Uygulama kimliği ayrıca
      // android/app/src/main/res/values/strings.xml -> admob_app_id içinde değişir.)
      testModu: true,
      odulluReklamBirimi: 'ca-app-pub-3940256099942544/5224354917', // Google TEST birimi
      // Yerleşime göre ayrı birim isterseniz doldurun; null ise odulluReklamBirimi kullanılır.
      yerlesimBirimleri: {
        devam: null,
        iki_kat: null
      },
      // AB/Birleşik Krallık için Google UMP onay formu (GDPR). Açık kalması önerilir.
      onayFormu: true,
      // Kendi test cihazlarınızın reklam kimlikleri (logcat'te yazar). Gizli değildir.
      testCihazlari: []
    },
    iap: {
      // Play Console'da "tek seferlik ürün" (yönetilen, tüketilemeyen) olarak açılmalı.
      urunler: [
        'bopgate.baslangic',
        'bopgate.reklamsiz',
        'bopgate.destekci',
        'bopgate.top.alev',
        'bopgate.top.kristal',
        'bopgate.harita.nebula',
        'bopgate.ozellik.paket'
      ]
    },
    games: {
      // >>> Play Console > Play Games Hizmetleri > Liderlik tabloları kimliği <<<
      liderlikTablosu: 'PLAY_CONSOLE_LEADERBOARD_ID',
      kayitAdi: 'bopgate-ilerleme',
      kayitAciklamasi: 'Bopgate ilerlemesi'
    },
    zamanAsimiMs: {
      cihazHazir: 8000,       // Cordova 'deviceready' beklemesi
      magazaBaslat: 15000,    // Play Billing bağlantısı + ürün sorgusu
      satinAlma: 300000,      // satın alma ekranı açıkken (kullanıcı düşünüyor olabilir)
      onaySonrasi: 30000,     // ödeme sonrası onay/acknowledge bekleme
      reklamYukle: 20000,
      reklamGoster: 600000,
      oyunServisi: 20000
    }
  };

  var GUNLUK = '[BopgateNative]';
  function log() {
    try { console.log.apply(console, [GUNLUK].concat([].slice.call(arguments))); } catch (e) { /* yok say */ }
  }

  // --- Yardımcılar ------------------------------------------------------------------

  // Bir sözü (promise) süre sınırıyla bekler; süre dolarsa ya da hata olursa yedek değerle çözülür.
  function guvenli(is, ms, yedek) {
    return new Promise(function (coz) {
      var bitti = false;
      var zamanlayici = ms ? setTimeout(function () {
        if (!bitti) { bitti = true; log('zaman aşımı', ms + 'ms'); coz(yedek); }
      }, ms) : null;
      Promise.resolve().then(is).then(function (v) {
        if (!bitti) { bitti = true; if (zamanlayici) clearTimeout(zamanlayici); coz(v); }
      }, function (h) {
        if (!bitti) { bitti = true; if (zamanlayici) clearTimeout(zamanlayici); log('hata', h && (h.message || h.code || h)); coz(yedek); }
      });
    });
  }

  function eklenti(ad) {
    var C = window.Capacitor;
    return (C && C.Plugins && C.Plugins[ad]) || null;
  }

  // Cordova eklentileri (CdvPurchase) 'deviceready' sonrası hazır olur.
  // Cordova 'deviceready' olayını yapışkan tutar: geç eklenen dinleyici de çağrılır.
  var cihazHazirSozu = null;
  function cihazHazir() {
    if (cihazHazirSozu) return cihazHazirSozu;
    cihazHazirSozu = new Promise(function (coz) {
      var tamam = false;
      function bitir() { if (!tamam) { tamam = true; coz(); } }
      try { document.addEventListener('deviceready', bitir, false); } catch (e) { bitir(); }
      setTimeout(bitir, YAPILANDIRMA.zamanAsimiMs.cihazHazir);
      if (!window.cordova) {
        // Cordova yoksa (tarayıcı) beklemeye gerek yok.
        setTimeout(bitir, 0);
      }
    });
    return cihazHazirSozu;
  }

  function olayYay(ad, detay) {
    try { window.dispatchEvent(new CustomEvent(ad, { detail: detay })); } catch (e) { /* yok say */ }
  }

  // =================================================================================
  // UYGULAMA İÇİ SATIN ALMA (Google Play Billing, cordova-plugin-purchase v13)
  // =================================================================================
  var iap = {
    baslatSozu: null,
    kayitli: {},
    bekleyen: {} // urunId -> [coz(true|false)]
  };

  function cdv() { return window.CdvPurchase || null; }

  function bekleyeniCoz(id, sonuc) {
    var liste = iap.bekleyen[id];
    if (!liste) return;
    delete iap.bekleyen[id];
    liste.forEach(function (f) { try { f(sonuc); } catch (e) { /* yok say */ } });
  }

  function urunleriKaydet(magaza, C, idler) {
    var yeni = [];
    idler.forEach(function (id) {
      if (typeof id !== 'string' || !id || iap.kayitli[id]) return;
      iap.kayitli[id] = true;
      yeni.push({ id: id, type: C.ProductType.NON_CONSUMABLE, platform: C.Platform.GOOGLE_PLAY });
    });
    if (yeni.length) magaza.register(yeni);
    return yeni.length;
  }

  // Mağazayı bir kez başlatır; sonraki çağrılarda yeni ürün kimliği varsa kaydedip günceller.
  function magazaHazir(ekIdler) {
    if (!iap.baslatSozu) {
      var ham = cihazHazir().then(function () {
        var C = cdv();
        if (!C || !C.store) { log('CdvPurchase yok (tarayıcı ya da eklenti eksik)'); return null; }
        var magaza = C.store;
        urunleriKaydet(magaza, C, YAPILANDIRMA.iap.urunler);
        magaza.when()
          .approved(function (t) { try { t.verify(); } catch (e) { log('verify hata', e); } })
          // Sunucu tarafı makbuz doğrulayıcı tanımlı değil: eklenti makbuzu yerel olarak doğrulanmış sayar.
          .verified(function (r) { try { r.finish(); } catch (e) { log('finish hata', e); } })
          .finished(function (t) {
            (t.products || []).forEach(function (p) {
              log('satın alma tamamlandı', p.id);
              bekleyeniCoz(p.id, true);
              olayYay('bopgate-satinalma', { id: p.id });
            });
          });
        magaza.error(function (h) { log('mağaza hatası', h && h.code, h && h.message); });
        return magaza.initialize([C.Platform.GOOGLE_PLAY]).then(function (hatalar) {
          if (hatalar && hatalar.length) log('initialize uyarıları', JSON.stringify(hatalar));
          return magaza;
        });
      });
      iap.baslatSozu = guvenli(function () { return ham; }, YAPILANDIRMA.zamanAsimiMs.magazaBaslat, null)
        .then(function (m) { if (!m) iap.baslatSozu = null; return m; }); // başarısızsa sonra yeniden dene
    }
    return iap.baslatSozu.then(function (magaza) {
      var C = cdv();
      if (!magaza || !C || !ekIdler || !ekIdler.length) return magaza;
      if (urunleriKaydet(magaza, C, ekIdler)) {
        return guvenli(function () { return magaza.update(); }, YAPILANDIRMA.zamanAsimiMs.magazaBaslat, null)
          .then(function () { return magaza; });
      }
      return magaza;
    });
  }

  function sahipMi(magaza, C, id) {
    try {
      if (magaza.owned({ id: id, platform: C.Platform.GOOGLE_PLAY })) return true;
    } catch (e) { /* yok say */ }
    try {
      return (magaza.localReceipts || []).some(function (r) {
        return (r.transactions || []).some(function (t) {
          var durum = t.state;
          var gecerli = durum === C.TransactionState.APPROVED || durum === C.TransactionState.FINISHED;
          return gecerli && (t.products || []).some(function (p) { return p.id === id; });
        });
      });
    } catch (e) { return false; }
  }

  var iapApi = {
    products: function (ids) {
      return guvenli(function () {
        var istenen = Array.isArray(ids) ? ids.filter(function (x) { return typeof x === 'string' && x; }) : [];
        if (!istenen.length) istenen = YAPILANDIRMA.iap.urunler.slice();
        return magazaHazir(istenen).then(function (magaza) {
          var C = cdv();
          if (!magaza || !C) return [];
          var sonuc = [];
          istenen.forEach(function (id) {
            var u = magaza.get(id, C.Platform.GOOGLE_PLAY);
            var fiyat = u && u.pricing && u.pricing.price;
            if (u && fiyat) sonuc.push({ id: id, price: String(fiyat) });
          });
          return sonuc;
        });
      }, YAPILANDIRMA.zamanAsimiMs.magazaBaslat + 5000, []);
    },

    buy: function (id) {
      var hata = { ok: false, id: id, reason: 'hata' };
      return guvenli(function () {
        if (typeof id !== 'string' || !id) return hata;
        return magazaHazir([id]).then(function (magaza) {
          var C = cdv();
          if (!magaza || !C) return hata;
          if (sahipMi(magaza, C, id)) return { ok: true, id: id };
          var urun = magaza.get(id, C.Platform.GOOGLE_PLAY);
          var teklif = urun && urun.getOffer();
          if (!teklif) { log('ürün/teklif bulunamadı', id); return hata; }

          var tamamlandi = new Promise(function (coz) {
            (iap.bekleyen[id] = iap.bekleyen[id] || []).push(coz);
          });

          return guvenli(function () { return magaza.order(teklif); }, YAPILANDIRMA.zamanAsimiMs.satinAlma, { isError: true, code: -1 })
            .then(function (sonuc) {
              if (sonuc && sonuc.isError) {
                bekleyeniCoz(id, false);
                if (sonuc.code === C.ErrorCode.PAYMENT_CANCELLED) return { ok: false, id: id, reason: 'iptal' };
                // "Zaten sahip" gibi durumlarda makbuzlar sahipliği gösterir.
                return sahipMi(magaza, C, id) ? { ok: true, id: id } : hata;
              }
              return guvenli(function () { return tamamlandi; }, YAPILANDIRMA.zamanAsimiMs.onaySonrasi, false)
                .then(function (ok) {
                  if (ok || sahipMi(magaza, C, id)) return { ok: true, id: id };
                  // Bekleyen (ör. nakit/geciken) ödeme: tamamlanınca 'bopgate-satinalma' olayı
                  // yayılır ve restore() ürünü döndürür.
                  return hata;
                });
            });
        });
      }, 0, hata);
    },

    restore: function () {
      return guvenli(function () {
        return magazaHazir(null).then(function (magaza) {
          var C = cdv();
          if (!magaza || !C) return [];
          return guvenli(function () { return magaza.restorePurchases(); }, YAPILANDIRMA.zamanAsimiMs.magazaBaslat, null)
            .then(function () {
              return Object.keys(iap.kayitli).filter(function (id) { return sahipMi(magaza, C, id); });
            });
        });
      }, YAPILANDIRMA.zamanAsimiMs.magazaBaslat * 2 + 5000, []);
    }
  };

  // =================================================================================
  // ÖDÜLLÜ REKLAM (AdMob, @capacitor-community/admob)
  // =================================================================================
  var reklam = { baslatSozu: null, yukluBirim: null, yukleniyor: null, mesgul: false };

  function reklamBaslat() {
    if (reklam.baslatSozu) return reklam.baslatSozu;
    var A = eklenti('AdMob');
    if (!A) return Promise.resolve(false);
    var ay = YAPILANDIRMA.admob;
    reklam.baslatSozu = guvenli(function () {
      return A.initialize({
        initializeForTesting: !!ay.testModu,
        testingDevices: ay.testCihazlari || []
      }).then(function () {
        if (!ay.onayFormu || !A.requestConsentInfo) return true;
        return guvenli(function () {
          return A.requestConsentInfo().then(function (bilgi) {
            if (bilgi && bilgi.status === 'REQUIRED' && bilgi.isConsentFormAvailable) {
              return A.showConsentForm();
            }
            return bilgi;
          });
        }, 60000, null).then(function () { return true; });
      });
    }, 70000, false).then(function (ok) {
      if (!ok) reklam.baslatSozu = null;
      return ok;
    });
    return reklam.baslatSozu;
  }

  function birimSec(yerlesim) {
    var b = YAPILANDIRMA.admob.yerlesimBirimleri || {};
    return b[yerlesim] || YAPILANDIRMA.admob.odulluReklamBirimi;
  }

  function reklamYukle(birim) {
    var A = eklenti('AdMob');
    if (!A) return Promise.resolve(false);
    if (reklam.yukluBirim === birim) return Promise.resolve(true);
    if (reklam.yukleniyor && reklam.yukleniyor.birim === birim) return reklam.yukleniyor.soz;
    var soz = guvenli(function () {
      return A.prepareRewardVideoAd({ adId: birim, isTesting: !!YAPILANDIRMA.admob.testModu })
        .then(function () { reklam.yukluBirim = birim; return true; });
    }, YAPILANDIRMA.zamanAsimiMs.reklamYukle, false);
    reklam.yukleniyor = { birim: birim, soz: soz };
    return soz.then(function (ok) { reklam.yukleniyor = null; return ok; });
  }

  function dinle(A, olay, fn) {
    try {
      return Promise.resolve(A.addListener(olay, fn)).catch(function () { return null; });
    } catch (e) { return Promise.resolve(null); }
  }
  function birak(tutamaclar) {
    tutamaclar.forEach(function (s) {
      s.then(function (t) { try { if (t && t.remove) t.remove(); } catch (e) { /* yok say */ } });
    });
  }

  var reklamApi = {
    rewarded: function (placement) {
      var yok = { rewarded: false };
      // Aynı anda tek reklam: ikinci çağrı beklemeden olumsuz döner.
      if (reklam.mesgul || !eklenti('AdMob')) return Promise.resolve(yok);
      reklam.mesgul = true;
      return guvenli(function () {
        var A = eklenti('AdMob');
        var birim = birimSec(placement);
        return reklamBaslat().then(function (hazir) {
          if (!hazir) return yok;
          return reklamYukle(birim).then(function (yuklendi) {
            if (!yuklendi) return yok;
            reklam.yukluBirim = null; // gösterilen reklam tek kullanımlıktır
            return new Promise(function (coz) {
              var odul = false, bitti = false, tutamaclar = [];
              function sonlandir(gecikme) {
                setTimeout(function () {
                  if (bitti) return;
                  bitti = true;
                  birak(tutamaclar);
                  coz({ rewarded: odul });
                }, gecikme || 0);
              }
              tutamaclar.push(dinle(A, 'onRewardedVideoAdReward', function () { odul = true; }));
              // Ödül olayı kapanıştan hemen sonra gelebilir: kısa bir pay bırak.
              tutamaclar.push(dinle(A, 'onRewardedVideoAdDismissed', function () { sonlandir(400); }));
              tutamaclar.push(dinle(A, 'onRewardedVideoAdFailedToShow', function () { sonlandir(0); }));
              // showRewardVideoAd yalnızca ödül kazanılınca çözülür; kapatılırsa hiç çözülmeyebilir.
              Promise.resolve().then(function () { return A.showRewardVideoAd(); })
                .then(function () {
                  odul = true;
                  // Kapanış olayı hiç gelmezse diye yedek: ödülden 60 sn sonra sonuçlandır.
                  sonlandir(60000);
                }, function () { sonlandir(0); });
            });
          });
        });
      }, YAPILANDIRMA.zamanAsimiMs.reklamGoster, yok).then(function (s) {
        reklam.mesgul = false;
        // Sonraki gösterim hızlı olsun diye arka planda yeni reklam yükle.
        setTimeout(function () { reklamYukle(birimSec(placement)); }, 1000);
        return s && s.rewarded === true ? { rewarded: true } : yok;
      });
    }
  };

  // =================================================================================
  // PLAY GAMES SERVICES v2 (liderlik tablosu + kayıtlı oyun)
  // =================================================================================
  function oyunServisi() { return eklenti('PlayGames'); }

  function oturumAcik(G) {
    return guvenli(function () {
      return G.isSignedIn().then(function (r) { return !!(r && r.signedIn); });
    }, YAPILANDIRMA.zamanAsimiMs.oyunServisi, false);
  }

  function girisYap(G, etkilesimli) {
    return guvenli(function () {
      return G.signIn({ silent: !etkilesimli }).then(function (r) { return !!(r && r.signedIn); });
    }, etkilesimli ? 120000 : YAPILANDIRMA.zamanAsimiMs.oyunServisi, false);
  }

  // Önce sessiz giriş, olmazsa (istenirse) etkileşimli giriş.
  function girisGerekli(G, etkilesimliOlabilir) {
    return oturumAcik(G).then(function (acik) {
      if (acik) return true;
      return girisYap(G, false).then(function (ok) {
        if (ok || !etkilesimliOlabilir) return ok;
        return girisYap(G, true);
      });
    });
  }

  function liderlikKimligiGecerli() {
    var id = YAPILANDIRMA.games.liderlikTablosu;
    return typeof id === 'string' && id && id !== 'PLAY_CONSOLE_LEADERBOARD_ID';
  }

  var oyunApi = {
    signIn: function () {
      return guvenli(function () {
        var G = oyunServisi();
        if (!G) return false;
        return girisGerekli(G, true);
      }, 0, false);
    },

    submitScore: function (score) {
      return guvenli(function () {
        var G = oyunServisi();
        var puan = Math.floor(Number(score));
        if (!G || !liderlikKimligiGecerli() || !isFinite(puan) || puan < 0) return;
        return girisGerekli(G, false).then(function (ok) {
          if (!ok) return;
          return G.submitScore({ leaderboardId: YAPILANDIRMA.games.liderlikTablosu, score: puan });
        });
      }, YAPILANDIRMA.zamanAsimiMs.oyunServisi * 2, undefined).then(function () { return undefined; });
    },

    showLeaderboard: function () {
      return guvenli(function () {
        var G = oyunServisi();
        if (!G || !liderlikKimligiGecerli()) return;
        return girisGerekli(G, true).then(function (ok) {
          if (!ok) return;
          return G.showLeaderboard({ leaderboardId: YAPILANDIRMA.games.liderlikTablosu });
        });
      }, 0, undefined).then(function () { return undefined; });
    },

    saveGame: function (jsonString) {
      return guvenli(function () {
        var G = oyunServisi();
        if (!G || typeof jsonString !== 'string') return false;
        return girisGerekli(G, false).then(function (ok) {
          if (!ok) return false;
          return G.saveSnapshot({
            name: YAPILANDIRMA.games.kayitAdi,
            data: jsonString,
            description: YAPILANDIRMA.games.kayitAciklamasi
          }).then(function () { return true; });
        });
      }, YAPILANDIRMA.zamanAsimiMs.oyunServisi * 2, false).then(function (v) { return v === true; });
    },

    loadGame: function () {
      return guvenli(function () {
        var G = oyunServisi();
        if (!G) return null;
        return girisGerekli(G, false).then(function (ok) {
          if (!ok) return null;
          return G.loadSnapshot({ name: YAPILANDIRMA.games.kayitAdi }).then(function (r) {
            var s = r && r.snapshot;
            return s && typeof s.data === 'string' ? s.data : null;
          });
        });
      }, YAPILANDIRMA.zamanAsimiMs.oyunServisi * 2, null).then(function (v) { return typeof v === 'string' ? v : null; });
    }
  };

  // =================================================================================
  // Dışa aktarım
  // =================================================================================
  window.BopgateNative = {
    platform: 'android',
    iap: iapApi,
    ads: reklamApi,
    games: oyunApi
  };

  // Açılışta arka planda hazırlık (hatalar yutulur): reklam SDK + onay formu, ilk reklam,
  // mağaza bağlantısı. Oyunun açılışını bekletmez.
  setTimeout(function () {
    if (eklenti('AdMob')) {
      reklamBaslat().then(function (ok) { if (ok) reklamYukle(YAPILANDIRMA.admob.odulluReklamBirimi); });
    }
    if (window.cordova) magazaHazir(null);
  }, 1500);
})();
