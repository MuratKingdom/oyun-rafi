# Tek Atış

**Kanat:** arcade/fizik
**Tek cümle:** Topu açı ve güç ayarlayıp tek denemede yere inen bir hedefe atıyorsun; rüzgâr ve duvar araya girer, ıskalarsan oyun biter.

## Nasıl oynanır
**Tarayıcıda oyna (kurulumsuz):**
https://htmlpreview.github.io/?https://github.com/MuratKingdom/oyun-rafi/blob/oyun/tekatis/index.html
Bu, üçüncü taraf bir görüntüleyicidir; kurulum gerektirmez ama garanti edilmez ve bu link
tarayıcıda elle denenmemiştir.

**Yerelde oynamak istersen:** `oyun-rafi` deposunda `oyun/tekatis` dalını seç → Code →
Download ZIP (veya dalı klonla), `index.html` dosyasını herhangi bir modern tarayıcıda aç.
Tek dosya isteyen için `oyun-tek-dosya.html` tek başına çalışır. Kurulum, derleme, sunucu,
internet bağlantısı gerekmez.

## Kontroller
- Yukarı/Aşağı ok (veya W/S): açı
- Sol/Sağ ok (veya A/D): güç
- Boşluk / Enter: ateş
- Canvas'ta sürükle-bırak: topun yerinden sürüklediğin yön açı, mesafe güç olur; bırakınca ateş
- R: yeniden başla (bitiş ekranında boşluk veya dokunuş da başlatır) · M: ses aç/kapat

## Ana mekanik, amaç ve kurallar
Her seviyede tek atış hakkın var. Top sabit yerçekimiyle uçar; 2. seviyeden itibaren yatay rüzgâr
topu iter, 3. seviyeden itibaren hedefle top arasında bir duvar durur. Top hedef şeridine inerse
100 puan + ortaya yakınlığa göre en çok 50 bonus alırsın ve sonraki seviyeye geçersin; hedef her
seviyede daralır. Önüne düşer, ötesine düşer, duvara çarpar ya da alandan çıkarsan oyun biter; sebep
ekranda yazar. 10 hedefi vurursan kazanırsın. Rekor `localStorage`'da tutulur; her oyun yeni seed ile başlar.

## NE ÇALIŞIYOR
- Açı/güç ayarı, atış, rüzgârlı yörünge, iniş ve puan (kanıt: T1, T3, T5c)
- Dört kayıp sebebi ekranda: "Hedefin önüne düştü", "Hedefi geçtin", "Duvara çarptın", "Alanın dışına çıktın" (kanıt: T2, T2b, T2c)
- İleri simülasyonla atış bulan bot 3 seed'de 10 hedefi de vuruyor, kazanç erişilebilir (kanıt: T3)
- Tek tuşla temiz yeniden başlatma (kanıt: T4, T5d)
- Canvas çizim, skor/seviye/rekor, klavye girdisi, sürükle-bırak atış (kanıt: T5b, T5c, grep W1-W4, headless Chromium'da `file://` açılışı, konsol hatası 0)

## NE EKSİK / İSKELE
- İnsan oynanışına göre zorluk dengesi ayarlanmadı; botun çözümü brute-force bulduğu için seviyelerin insanca vurulabilirliği bilinmiyor
- Sürükle-bırak yalnızca otomatik headless girdiyle denendi, gerçek dokunmatik cihazda denenmedi; ayrı mobil buton düzeni yok
- Hedef/duvar/rüzgâr dışında engel türü yok, can yok (ilk ıska oyunu bitirir)
- Görsel çeşitlilik minimal

## Doğrulama durumu
`node --check` tüm JS dosyalarında çıkış 0. `node test.js`: T1–T4 + T2b/T2c PASS (çıkış 0). `node test-dom.js`: T5a–T5d PASS (çıkış 0).
Ağ/`file://` ve telif taramaları: 0 eşleşme. Headless Chromium ile `file://` açıldı, Yukarı+Boşluk ve fare sürükle-bırak ile atış yapıldı, kayıp ekranı çizildi, konsol hatası 0.
Oynanabilirliği tarayıcıda elle doğrulanmadı; headless mantık ve yükleme testleri geçti.

## Varlıklar ve telif
Tüm görseller Canvas ile, sesler WebAudio ile kod içinde üretilmiştir. Dış varlık, dış font,
CDN bağımlılığı yoktur. Bu oyun hiçbir tescilli oyunun klonu değildir; atış açısı + tek deneme
yörünge mekaniğinden genel düzeyde esinlenilmiştir.

## Bilinen sınır
`file://` altında en yüksek skor kaydı bazı tarayıcılarda çalışmayabilir; oyun yine oynanır.

## Geliştirmek isteyen için ilk adım
`logic.js` içindeki `genLevel()` ile `C.G`, `C.PW_MAX` sabitlerini insan oynanışına göre dengele veya `flight()`'a hareketli hedef ekle.
