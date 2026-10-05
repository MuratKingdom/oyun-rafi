# Kayar Taş

**Kanat:** arcade/fizik
**Tek cümle:** Boşluk tuşunu basılı tutarak güç doldurup taşı bırakıyorsun; sürtünmeyle kayıp yeşil hedef bölgede durması gerekiyor.

## Nasıl oynanır
**Tarayıcıda oyna (kurulumsuz):**
https://htmlpreview.github.io/?https://github.com/MuratKingdom/oyun-rafi/blob/oyun/kayartas/index.html
Bu, üçüncü taraf bir görüntüleyicidir; kurulum gerektirmez ama garanti edilmez ve bu link
tarayıcıda elle denenmemiştir.

**Yerelde oynamak istersen:** `oyun-rafi` deposunda `oyun/kayartas` dalını seç → Code →
Download ZIP (veya dalı klonla), `index.html` dosyasını herhangi bir modern tarayıcıda aç.
Tek dosya isteyen için `oyun-tek-dosya.html` tek başına çalışır. Kurulum, derleme, sunucu,
internet bağlantısı gerekmez.

## Kontroller
- Boşluk / Yukarı ok / Enter / canvas'a basılı tutma: güç doldur; bırakınca taş kayar
- R: yeniden başlat (kayıp ekranında boşluk veya tıklama da başlatır)
- M: sesi aç/kapat

## Ana mekanik, amaç ve kurallar
Güç çubuğu basılı tutma süresiyle dolar (tam doluluk ~1,7 sn). Bırakınca taş o güçle fırlar ve sabit
sürtünmeyle yavaşlar. Mavi (buz) bölgede sürtünme azalır, kum bölgesinde artar. Taşın durduğu nokta
yeşil hedefin içindeyse seviye geçilir: 100 puan + ortaya yakınlığa göre en çok 50 bonus. Hedef her
seviyede daralır (120 → 60) ve 2. seviyeden sonra buz/kum yamaları çıkar. Hedefe ulaşmazsan, geçersen
veya pistten düşersen oyun biter; sebep ekranda yazar. 12 hedefi tutarsan kazanırsın. En yüksek skor
`localStorage`'da tutulur.

## NE ÇALIŞIYOR
- Güç doldurma, fırlatma, sürtünmeyle durma, hedefte durma kontrolü (kanıt: T1, T3, T5c)
- Üç kayıp sebebi ekrana yazılıyor: "Hedefe ulaşmadın", "Hedefi geçtin", "Pistten düştün" (kanıt: T2)
- 12 hedefin tamamı bir bot tarafından tutulabiliyor, kazanma erişilebilir (kanıt: T3, 3 seed)
- Tek tuşla temiz yeniden başlatma (kanıt: T4, T5d)
- Canvas çizimi ve skor/seviye/rekor göstergesi (kanıt: T5b, W3, headless Chromium ile tek sayfa açılışı ve ekran görüntüsü)

## NE EKSİK / İSKELE
- Dokunmatik için ayrı kontrol düzeni yok; canvas'a basılı tutma aynı işi yapıyor, mobilde denenmedi
- İnsan oynanışına göre zorluk dengesi ayarlanmadı (özellikle ilerleyen seviyelerde hedef dar)
- Görsel çeşitlilik minimal (düz renkli şekiller)
- Başarısız denemede can yok: ilk hata oyunu bitirir

## Doğrulama durumu
node --check tüm JS dosyalarında çıkış 0; `node test.js` T1–T4 PASS (çıkış 0); `node test-dom.js`
T5a–T5d PASS (çıkış 0); ağ/`file://` ve telif taramaları 0 eşleşme. Headless Chromium ile `file://`
üzerinden sayfa açıldı ve ilk ekranın çizildiği ekran görüntüsünde görüldü; oyun akışı tarayıcıda
denenmedi. Oynanabilirliği tarayıcıda elle doğrulanmadı; headless mantık ve yükleme testleri geçti.

## Varlıklar ve telif
Tüm görseller Canvas ile, sesler WebAudio ile kod içinde üretilmiştir. Dış varlık, dış font,
CDN bağımlılığı yoktur. Bu oyun hiçbir tescilli oyunun klonu değildir; sürtünmeyle duruş
noktası tutturma mekaniğinden esinlenilmiştir.

## Bilinen sınır
`file://` altında en yüksek skor kaydı bazı tarayıcılarda çalışmayabilir; oyun yine oynanır.

## Geliştirmek isteyen için ilk adım
`logic.js` içindeki `C.A`, `C.CHARGE` ve `genLevel()` içindeki yama `k` değerlerini değiştir veya
`step()`'e can sayacı ekle.
