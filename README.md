# Yerçekimi Tüneli

**Kanat:** arcade/fizik
**Tek cümle:** Tek tuşla yerçekimini ters çevirip dar bir tünelde engellerden kaçarak mesafe biriktiriyorsun.

## Nasıl oynanır
**Tarayıcıda oyna (kurulumsuz):**
https://htmlpreview.github.io/?https://github.com/MuratKingdom/oyun-rafi/blob/oyun/gravtunel/index.html
Bu, üçüncü taraf bir görüntüleyicidir; kurulum gerektirmez ama garanti edilmez.

**Yerelde oynamak istersen:** `oyun-rafi` deposunda `oyun/gravtunel` dalını seç → Code →
Download ZIP (veya dalı klonla), `index.html` dosyasını herhangi bir modern tarayıcıda aç.
Tek dosya isteyen için `oyun-tek-dosya.html` tek başına çalışır. Kurulum, derleme, sunucu,
internet bağlantısı gerekmez.

## Kontroller
- **Boşluk / Yukarı ok:** yerçekimini ters çevir (yukarı/aşağı düşme yönünü değiştirir)
- **Dokunuş / tıklama (canvas üzerinde):** aynı, yerçekimini ters çevir — kaybettiysen yeniden başlatır
- **R:** kaybettikten sonra yeniden başla
- **M:** sesi aç/kapat

## Ana mekanik, amaç ve kurallar
Küre otomatik olarak sağa doğru ilerler (ekranda sabit x, dünya kayar) ve sabit bir yerçekimi
onu sürekli yukarı ya da aşağı iter. Tuşa her bastığında yerçekimi yönü tersine döner. Tünelin
üstünden ve altından uzanan engellerin arasındaki boşluktan geçmen gerekir; boşluğu kaçırırsan
veya tünelin tavan/tabanına çarparsan oyun biter. Skor kat edilen mesafedir (`Mesafe: N`);
mesafe arttıkça hız artar ve boşluklar daralır. En yüksek mesafe (`Rekor`) tarayıcıda saklanır.

## NE ÇALIŞIYOR
- Yerçekimi flip mekaniği, çarpışma (tavan/taban/engel) ve kayıp sebebi gösterimi (kanıt: T1-T4, T5c, tarayıcı)
- Artan zorluk (hız + daralan boşluk) ve mesafe skoru (kanıt: T1, T3)
- Tek tuşla anında yeniden başlama, aynı seed'den temiz state (kanıt: T4, T5d)
- Canvas çizimi, skor/rekor göstergesi, kayıp ekranı (kanıt: T5b, tarayıcı ekran görüntüsü)
- WebAudio ile flip/çarpma sesleri, `M` ile sessize alma, `localStorage` rekor kaydı (kanıt: kod okuma + tarayıcıda konsol hatası yok)

## NE EKSİK / İSKELE
- Ayrı bir dokunmatik kontrol şeması yok; canvas'a dokunma/tıklama flip görevi görür ama mobilde
  buton boyutu/konum optimizasyonu yapılmadı.
- Zorluk eğrisi bir üst sınırda (hız ve minimum boşluk) sabitleniyor; sonsuz artış yok.
- Görsel/ses çeşitliliği minimaldir (tek renk paleti, iki ton).

## Doğrulama durumu
`node --check` tüm dosyalarda temiz. `test.js` (T1-T4) ve `test-dom.js` (T5a-T5d) hepsi PASS,
çıkış kodu 0. Ağ/`file://` taraması ve telif taraması sıfır eşleşme. Ayrıca ortamda bulunan
headless Chromium (Playwright) ile sayfa gerçekten açıldı, konsol hatası 0, boşluk tuşuyla flip
denendi ve çarpışma sonrası kayıp ekranı ekran görüntüsüyle doğrulandı — ama bu otomatik bir
kontroldü; bir insanın elle, uzun süre oynayarak yaptığı bir doğrulama değildir.

## Varlıklar ve telif
Tüm görseller Canvas ile, sesler WebAudio ile kod içinde üretilmiştir. Dış varlık, dış font,
CDN bağımlılığı yoktur. Bu oyun hiçbir tescilli oyunun klonu değildir; yerçekimi yönünü
değiştirerek dar bir koridordan geçme mekaniğinden esinlenilmiştir.

## Bilinen sınır
`file://` altında en yüksek skor kaydı bazı tarayıcılarda çalışmayabilir; oyun yine oynanır.

## Geliştirmek isteyen için ilk adım
`logic.js` içindeki `currentGapH` ve `currentSpeed` fonksiyonlarındaki sabitleri değiştirerek
zorluk eğrisini ayarlayabilir veya yeni bir engel tipi (örn. hareketli engel) `spawnObstacle`
fonksiyonuna eklenebilir.
