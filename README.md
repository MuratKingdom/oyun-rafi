# Sarkaç Atlayışı

**Kanat:** arcade/fizik
**Tek cümle:** Sarkaçtan doğru anda bırakılan topu yeşil platforma indiriyorsun.

## Nasıl oynanır
**Tarayıcıda oyna (kurulumsuz):**
https://htmlpreview.github.io/?https://github.com/MuratKingdom/oyun-rafi/blob/oyun/sarkac/index.html
Bu, üçüncü taraf bir görüntüleyicidir; kurulum gerektirmez ama garanti edilmez ve bu link
tarayıcıda elle denenmemiştir.

**Yerelde oynamak istersen:** `oyun-rafi` deposunda `oyun/sarkac` dalını seç → Code →
Download ZIP (veya dalı klonla), `index.html` dosyasını herhangi bir modern tarayıcıda aç.
Tek dosya isteyen için `oyun-tek-dosya.html` tek başına çalışır. Kurulum, derleme, sunucu,
internet bağlantısı gerekmez.

## Kontroller
- Boşluk / Yukarı ok / Enter / ekrana tık-dokunuş → topu bırak (yeniden başlatma ekranında yeniden başlat)
- R → kayıptan sonra yeniden başla
- M → sesi aç/kapat

## Ana mekanik, amaç ve kurallar
Top bir ipte sallanır. Bıraktığın anda ipin teğet hızıyla fırlar ve yerçekimiyle uçar. Platformun üstüne inersen +1 puan (platformun orta %30'una inersen +2), top ipe geri takılır ve yeni platform çıkar. Platformlar zamanla daralır ve uzaklaşır. Kayıp sebepleri ekranda yazar: "Süre doldu" (seviye başına 8 sn), "Boşluğa düştün", "Platforma yandan çarptın", "Alanın dışına çıktın". En yüksek skor tarayıcıda saklanır.

## NE ÇALIŞIYOR
- sarkaç fiziği, bırakma, uçuş, iniş ve puan (kanıt: T1, T3, T5c)
- dört kayıp sebebi ekranda (kanıt: T2, T2b, W4)
- bot (ileri simülasyonla bırakma anını bulan) 3 seed'de 30+ puan alıyor, yani platformlar erişilebilir (kanıt: T3)
- tek tuşla temiz yeniden başlatma (kanıt: T4, T5d)
- canvas çizimi, skor/rekor/süre göstergesi (kanıt: T5b, W3, headless Chromium'da açılış ve ekran görüntüsü)

## NE EKSİK / İSKELE
- İnsan oynanışına göre denge ayarlanmadı; bot kusursuz bırakıyor, insan için zorluk bilinmiyor
- Ayrı mobil buton düzeni yok; yalnızca canvas'a dokunma = bırak (mobilde denenmedi)
- Kazanma koşulu yok, yalnızca skor
- Görsel çeşitlilik minimal (düz renkler)

## Doğrulama durumu
`node --check` tüm JS dosyaları: geçti. `node test.js`: T1–T4 PASS (çıkış 0). `node test-dom.js`: T5a–T5d PASS (çıkış 0). Ağ/telif taramaları: 0 eşleşme. Headless Chromium ile `file://` üzerinden açıldı, ilk ekranın çizildiği ekran görüntüsünde görüldü.
Oynanabilirliği tarayıcıda elle doğrulanmadı; headless mantık ve yükleme testleri geçti.
`test.js`, `bot.js` dosyasını kullanır.

## Varlıklar ve telif
Tüm görseller Canvas ile, sesler WebAudio ile kod içinde üretilmiştir. Dış varlık, dış font,
CDN bağımlılığı yoktur. Bu oyun hiçbir tescilli oyunun klonu değildir; klasik sarkaç fiziğinden
esinlenilmiştir.

## Bilinen sınır
`file://` altında en yüksek skor kaydı bazı tarayıcılarda çalışmayabilir; oyun yine oynanır.

## Geliştirmek isteyen için ilk adım
`logic.js` içindeki `genPlatform()` ve `LEVEL_TIME`/`START_ANGLE` sabitlerini insan oynanışına göre dengele veya `step()`'e hareketli platform ekle.
