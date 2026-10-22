# Yığın Dengesi

**Kanat:** arcade/fizik
**Tek cümle:** Yatayda salınan bloğu doğru anda bırakıp kuleyi, ağırlık merkezi dayanaktan çıkmayacak şekilde yükseltiyorsun.

## Nasıl oynanır
**Tarayıcıda oyna (kurulumsuz):**
https://htmlpreview.github.io/?https://github.com/MuratKingdom/oyun-rafi/blob/oyun/yigindenge/index.html
Bu, üçüncü taraf bir görüntüleyicidir; kurulum gerektirmez ama garanti edilmez ve bu link
tarayıcıda elle denenmemiştir.

**Yerelde oynamak istersen:** `oyun-rafi` deposunda `oyun/yigindenge` dalını seç → Code →
Download ZIP (veya dalı klonla), `index.html` dosyasını herhangi bir modern tarayıcıda aç.
Tek dosya isteyen için `oyun-tek-dosya.html` tek başına çalışır. Kurulum, derleme, sunucu,
internet bağlantısı gerekmez.

## Kontroller
- Boşluk / Yukarı ok / Enter → bloğu bırak (bitiş ekranında 0,3 sn sonra yeniden başlat)
- Canvas'a tık/dokunuş → bloğu bırak (bitiş ekranında yeniden başlat)
- R → yeniden başla
- M → sesi aç/kapat

## Ana mekanik, amaç ve kurallar
Üstte bir blok sağa sola gider; bıraktığın an düşer ve kulenin üstüne oturur. Blok kesilmez.
Her blok için, o blok ve üstündeki tüm blokların ağırlık merkezi (genişlik = kütle) alttaki
bloğa değdiği aralığın içinde kalmalıdır; dışına çıkarsa kule devrilir. Bloğu kuleye hiç
değdirmezsen "ıskaladı" ile biter. Her blok +1 puan; üst bloğun merkezine 5 px içinde bırakırsan
+2 (blok hizalanır). Hız ve blok genişliği zorlaştıkça değişir. Skor = puan; rekor tarayıcıda saklanır.
Üstteki "Denge payı" çubuğu ağırlık merkezinin kenara uzaklığını gösterir.

## NE ÇALIŞIYOR
- Salınım, bırakma, düşüş, oturma ve puan (kanıt: T1, T3, T5c)
- İki kayıp sebebi ekranda: "Blok kuleyi ıskaladı", "Kule devrildi…" (kanıt: T2, T2b, W4)
- Hizalı oynayan bot 3 seed'de 70+ puan alıyor, yani ilerleme erişilebilir (kanıt: T3)
- Tek tuşla temiz yeniden başlatma (kanıt: T4, T5d)
- Canvas çizimi, skor/rekor/denge payı, `M` ile ses kapatma (kanıt: T5b, W3, Chromium'da `file://` açılışı, konsol hatası 0)

## NE EKSİK / İSKELE
- Denge bir ağırlık merkezi kuralıdır, gerçek fizik motoru yok; devrilme animasyonu tek eğimli dönüştür
- İnsan oynanışına göre zorluk dengesi ayarlanmadı
- Ayrı mobil buton düzeni yok; tık/dokunuş bırakmaya bağlı ama mobilde denenmedi
- Kazanma koşulu yok, yalnızca skor; görsel çeşitlilik minimal

## Doğrulama durumu
`node --check` tüm JS dosyalarında çıkış 0. `node test.js`: T1–T4 + T2b PASS (çıkış 0). `node test-dom.js`: T5a–T5d PASS (çıkış 0).
Ağ/`file://` ve telif taramaları: 0 eşleşme. Headless Chromium ile `file://` açıldı, Boşluk ile blok bırakıldı, konsol hatası 0.
Oynanabilirliği tarayıcıda elle doğrulanmadı; headless mantık ve yükleme testleri geçti.

## Varlıklar ve telif
Tüm görseller Canvas ile, sesler WebAudio ile kod içinde üretilmiştir. Dış varlık, dış font,
CDN bağımlılığı yoktur. Bu oyun hiçbir tescilli oyunun klonu değildir; yığma/denge
mekaniğinden genel düzeyde esinlenilmiştir.

## Bilinen sınır
`file://` altında en yüksek skor kaydı bazı tarayıcılarda çalışmayabilir; oyun yine oynanır.

## Geliştirmek isteyen için ilk adım
`logic.js` içindeki `nextBlock()` genişlik aralığını ve `speed()` eğrisini insan oynanışına göre dengele veya `land()`'e rüzgâr kuvveti ekle.
