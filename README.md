# Set Adası

**Kanat:** sandbox/inşa
**Tek cümle:** Her 10 saniyede bir yükselen denize karşı, adadaki kuru karelerin ürettiği kumla kareleri yükseltip köyün çevresine set çekiyorsun.

## Nasıl oynanır
**Tarayıcıda oyna (kurulumsuz):**
https://htmlpreview.github.io/?https://github.com/MuratKingdom/oyun-rafi/blob/oyun/setadasi/index.html
Bu, üçüncü taraf bir görüntüleyicidir; kurulum gerektirmez ama garanti edilmez ve bu link
tarayıcıda elle denenmemiştir.

**Yerelde oynamak istersen:** `oyun-rafi` deposunda `oyun/setadasi` dalını seç → Code →
Download ZIP (veya dalı klonla), `index.html` dosyasını herhangi bir modern tarayıcıda aç.
Tek dosya isteyen için `oyun-tek-dosya.html` tek başına çalışır. Kurulum, derleme, sunucu,
internet bağlantısı gerekmez.

## Kontroller
- Ok tuşları (veya WASD): seçili kareyi (sarı çerçeve) taşı
- Boşluk / Enter: seçili kareyi 1 kum harcayarak 1 birim yükselt
- Fare / dokunuş: tıklanan kareyi seç ve 1 birim yükselt
- R: yeniden başla (bitiş ekranında Boşluk, Enter veya tıklama da başlatır)
- M: ses aç/kapat

## Ana mekanik, amaç ve kurallar
11x11'lik ada ızgarasında her karenin bir yüksekliği var (sayı). Her 10 saniyede bir gelgit gelir
ve deniz seviyesi 1 artar. Yüksekliği deniz seviyesine eşit veya altında olan kare, denize **dört
yönden bağlıysa** kalıcı olarak su altında kalır. Yani alçak bir kare, çevresi denizden yüksek bir
setle kapalıysa kuru kalır. Kırmızı çerçeveli kareler sıradaki gelgitte batacak olanlardır.

Her kuru kare saniyede 0,045 kum üretir; ada küçüldükçe gelir azalır. Kare yükseltmek 1 kum,
yükseklik tavanı 15. Ortadaki köy karesi (ev çizimi, yükseklik 2) yükseltilemez: korumanın tek yolu
çevresine set çekmektir. Köy su altında kalırsa oyun biter ("Köy sular altında kaldı"). 12 gelgiti
atlatırsan kazanırsın. Her atlatılan gelgit 10 + o anki kuru kare sayısı kadar puan verir; yani
geniş bir alanı çevirmek daha çok puan ama daha pahalı set demektir. Rekor `localStorage`'da tutulur.

## NE ÇALIŞIYOR
- Gelgit, denize bağlı kareleri bulan su yayılımı, setle çevrili alanın kuru kalması (kanıt: T1, T3)
- Kayıp ve sebebi ekranda: "Köy sular altında kaldı (gelgit n)"; boşta bekleyen oyuncu 3. gelgitte kaybediyor (kanıt: T2, W4, tarayıcı)
- Köy ve su altındaki kare yükseltilemiyor (kanıt: T2b)
- Köyün çevresine Chebyshev yarıçapı 3 olan halkayı yükselten bot 3 seed'de 12 gelgiti bitirip kazanıyor (kanıt: T3)
- Tek tuşla temiz yeniden başlatma (kanıt: T4, T5d, tarayıcı)
- Canvas çizimi, kum/deniz/gelgit/skor/rekor göstergesi, gelgit sayacı çubuğu, sıradaki gelgitte batacak karelerin kırmızı işareti (kanıt: T5b, W3, headless Chromium ekran görüntüsü)
- Ok tuşu + Boşluk ve fare tıklamasıyla kare yükseltme (kanıt: T5c, headless Chromium otomatik girdi)

## NE EKSİK / İSKELE
- İnsan oynanışına göre denge ayarlanmadı; gelir (0,045) ve gelgit aralığı (10 sn) yalnızca bot simülasyonuyla seçildi. Yalnızca köyün hemen çevresini (8 kare) yükselten temkinli strateji de 12 gelgiti bitirebiliyor, düşük puanla.
- Dokunuşla yükseltme kodda var (`pointerdown`), gerçek dokunmatik cihazda denenmedi; ayrı mobil buton düzeni yok.
- Yükseltme geri alınamaz, kare alçaltma/yıkma yok.
- Tek kaynak (kum) ve tek bina (set); olay/hava değişkeni yok.
- Görsel çeşitlilik minimal (düz renk kareler, sayı ile yükseklik).

## Doğrulama durumu
Koşulan kontroller: `node --check` (tüm JS, çıkış 0), `node test.js` (T1–T4 + T2b PASS, çıkış 0),
`node test-dom.js` (T5a–T5d PASS, çıkış 0), ağ/`file://` taraması, telif taraması, referans bütünlüğü,
`node build-single.js`. Ayrıca headless Chromium (Playwright) ile `index.html` ve `oyun-tek-dosya.html`
`file://` üzerinden açıldı; otomatik girdiyle ok tuşu imleci taşıdı, fare tıklaması kareyi yükseltti,
36 sn boşta kalınca kayıp ekranı çıktı, R ile yeniden başladı; konsol hatası 0, dış istek 0.
Oynanabilirliği tarayıcıda elle doğrulanmadı; headless mantık ve yükleme testleri geçti.

## Varlıklar ve telif
Tüm görseller Canvas ile, sesler WebAudio ile kod içinde üretilmiştir. Dış varlık, dış font,
CDN bağımlılığı yoktur. Bu oyun hiçbir tescilli oyunun klonu değildir; genel "yükselen suya karşı
set çekme / alan kapatma" mekaniğinden esinlenilmiştir.

## Bilinen sınır
`file://` altında en yüksek skor kaydı bazı tarayıcılarda çalışmayabilir; oyun yine oynanır.

## Geliştirmek isteyen için ilk adım
`logic.js` içindeki `C.INCOME` ve `C.TIDE_T` değerlerini insan oynanışına göre dengele, ya da `raise()`
maliyetini yüksekliğe göre artır (ör. `Math.ceil(h / 4)` kum) ki küçük halka stratejisi pahalılaşsın.
