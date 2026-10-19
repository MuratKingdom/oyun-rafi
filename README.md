# Komşu Bahçe

**Kanat:** sandbox/inşa
**Tek cümle:** 5x5'lik bahçeye sırayla gelen Tarla, Kuyu ve Kovan parçalarını yerleştirip komşuluk bonuslarıyla kotaları tutturuyorsun.

## Nasıl oynanır
**Tarayıcıda oyna (kurulumsuz):**
https://htmlpreview.github.io/?https://github.com/MuratKingdom/oyun-rafi/blob/oyun/komsubahce/index.html
Bu, üçüncü taraf bir görüntüleyicidir; kurulum gerektirmez ama garanti edilmez ve bu link
tarayıcıda elle denenmemiştir.

**Yerelde oynamak istersen:** `oyun-rafi` deposunda `oyun/komsubahce` dalını seç → Code →
Download ZIP (veya dalı klonla), `index.html` dosyasını herhangi bir modern tarayıcıda aç.
Tek dosya isteyen için `oyun-tek-dosya.html` tek başına çalışır. Kurulum, derleme, sunucu,
internet bağlantısı gerekmez.

## Kontroller
- Ok tuşları / WASD → imleci taşı
- Boşluk / Enter → sıradaki parçayı imlecin olduğu kareye koy (bitiş ekranında yeniden başlat)
- Canvas'ta kareye tık/dokunuş → imleci oraya taşı ve koy (bitiş ekranında yeniden başlat)
- R → yeniden başla
- M → sesi aç/kapat

## Ana mekanik, amaç ve kurallar
Her yerleşimde sıradaki parçayı boş bir kareye koyarsın. Parça +1 taban puan verir; dört yöndeki
her dolu komşu için eklenir: Tarla+Kuyu +4, Tarla+Kovan +3, Kuyu+Kovan -2, aynı tür -1.
Parça başına 12 sn süren var. Kota kontrolü 5, 10, 15, 20 ve 25. yerleşimde yapılır
(toplam puan en az 4, 14, 28, 44, 60). Kota tutmazsa veya süre dolarsa oyun biter ve sebep
ekrana yazılır; 25 kareyi kotalar tutarak doldurursan kazanırsın. Skor toplam puandır,
en yüksek skor tarayıcıda saklanır. Parça sırası seed'e bağlıdır, her açılışta değişir.

## NE ÇALIŞIYOR
- Yerleştirme, komşuluk puanı, kota ve süre kuralları (kanıt: T1, T3, T5c)
- İki kayıp sebebi ekranda: kota ve süre (kanıt: T2, T2b, W4)
- Kazanma erişilebilir: en iyi kareyi seçen bot 3 seed'de kazanıyor (kanıt: T3)
- Tek tuşla temiz yeniden başlatma (kanıt: T4, T5d)
- Canvas çizimi, skor/kota/rekor göstergesi (kanıt: T5b, W3, headless Chromium'da açılış ve ekran görüntüsü)

## NE EKSİK / İSKELE
- İnsan oynanışına göre denge ayarlanmadı; en iyi kareyi seçen bot 200 seed'in 181'ini kazanıyor, insan için zorluk bilinmiyor
- Ayrı mobil buton düzeni yok; canvas'a dokunma çalışacak şekilde yazıldı ama mobilde denenmedi
- Parça türü 3 ile sınırlı, bina yükseltmesi/yıkma yok
- Görsel çeşitlilik minimal (düz renk şekiller)

## Doğrulama durumu
`node --check` tüm JS dosyaları: çıkış 0. `node test.js`: T1–T4 PASS (çıkış 0). `node test-dom.js`: T5a–T5d PASS (çıkış 0). Ağ/`file://` ve telif taramaları: 0 eşleşme. Headless Chromium ile `file://` üzerinden açıldı, ilk ekranın çizimi ekran görüntüsünde görüldü.
Oynanabilirliği tarayıcıda elle doğrulanmadı; headless mantık ve yükleme testleri geçti.
`test.js`, `bot.js` dosyasını kullanır.

## Varlıklar ve telif
Tüm görseller Canvas ile, sesler WebAudio ile kod içinde üretilmiştir. Dış varlık, dış font,
CDN bağımlılığı yoktur. Bu oyun hiçbir tescilli oyunun klonu değildir; kısıtlı alana
yerleştirme ve komşuluk bonusu mekaniğinden esinlenilmiştir.

## Bilinen sınır
`file://` altında en yüksek skor kaydı bazı tarayıcılarda çalışmayabilir; oyun yine oynanır.

## Geliştirmek isteyen için ilk adım
`logic.js` içindeki `PAIR` matrisini ve `QUOTA` değerlerini insan oynanışına göre dengele veya `step()`'e dördüncü bir parça türü ekle.
