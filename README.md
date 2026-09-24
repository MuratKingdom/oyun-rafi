# Sekme Gücü

**Kanat:** arcade/fizik
**Tek cümle:** Zıplayan bir topu tek tuşla havada tutarak dar kapılardan geçiriyorsun.

## Nasıl oynanır
**Tarayıcıda oyna (kurulumsuz):**
https://htmlpreview.github.io/?https://github.com/MuratKingdom/oyun-rafi/blob/oyun/sekmeguc/index.html
Bu, üçüncü taraf bir görüntüleyicidir; kurulum gerektirmez ama garanti edilmez ve bu link
tarayıcıda elle denenmemiştir.

**Yerelde oynamak istersen:** `oyun-rafi` deposunda `oyun/sekmeguc` dalını seç → Code →
Download ZIP (veya dalı klonla), `index.html` dosyasını herhangi bir modern tarayıcıda aç.
Tek dosya isteyen için `oyun-tek-dosya.html` tek başına çalışır. Kurulum, derleme, sunucu,
internet bağlantısı gerekmez.

## Kontroller
- **Boşluk / Yukarı ok (basılı tut):** havadayken ekstra yükseklik kazandırır; bıraktığında yerçekimi normal hızında geri çeker
- **Dokunuş / tıklama (canvas üzerinde, basılı tut):** aynı — kayıp ekranındaysa dokunuş yeniden başlatır
- **R:** kaybettikten sonra yeniden başla
- **M:** sesi aç/kapat

## Ana mekanik, amaç ve kurallar
Top zeminde sürekli ve otomatik olarak zıplar (dokunmana gerek yok). Soldan sağa doğru art
arda duvarlar yaklaşır; her duvarda geçilecek bir boşluk (kapı) vardır ve bu boşluk her
duvarda farklı bir yükseklikte durur. Zıplarken tuşu **basılı tuttuğun sürece** yerçekimi
zayıflar ve top daha yükseğe çıkar; bıraktığında normal yerçekimiyle geri düşer. Amaç, her
duvarın kapısını topun mevcut yüksekliğine denk getirip çarpmadan geçmek. Kapıyı ıskalayıp
duvara çarparsan ya da tuşu çok uzun süre basılı tutup tavana çarparsan oyun biter. Skor
(**Kapı**) geçtiğin kapı sayısıdır; en yüksek skor (**Rekor**) tarayıcıda saklanır. Zaman
geçtikçe duvarlar hızlanır ve kapılar daralır. Her oyun farklı bir tohumla (seed) başlar,
bu yüzden kapı dizilimi her seferinde değişir.

## NE ÇALIŞIYOR
- Zıplama fiziği, basılı-tutma ile yükseklik kontrolü, kapı/duvar çarpışması ve kayıp sebebi gösterimi (kanıt: T1, T2, T3, T5c, tarayıcı)
- Artan zorluk (hız + daralan kapı) ve kapı geçme skoru (kanıt: T1, T3, W3)
- Tek tuşla anında yeniden başlama, aynı seed'den birebir aynı ilk durum (kanıt: T4, T5d)
- Canvas çizimi: zemin/tavan, duvarlar, top, skor/rekor, kayıp ekranı (kanıt: T5b, W3, W4, tarayıcı ekran görüntüsü)
- WebAudio ile zıplama/kapı geçme/kayıp sesleri, `M` ile sessize alma, `localStorage` rekor kaydı (kanıt: kod okuma; tarayıcıda konsol hatası 0)

## NE EKSİK / İSKELE
- Kazanma koşulu yok; oyun yalnızca "kaç kapı geçebilirsin" mantığıyla ilerliyor, sabit bir hedefte bitmiyor.
- Görsel çeşitlilik minimaldir (düz renk top ve duvarlar, parçacık efekti yok).
- Zorluk eğrisi doğrusal; ince ayarlanmış bir denge eğrisi değil.
- Ayrı bir mobil buton düzeni yok; canvas'a dokunma/tıklama basılı-tutma görevi görüyor ama buton boyutu/konumu mobil için ayrıca optimize edilmedi.

## Doğrulama durumu
`node --check` tüm dosyalarda temiz (çıkış kodu 0). `test.js` (T1-T4) ve `test-dom.js`
(T5a-T5d) hepsi PASS, çıkış kodu 0. Ağ/`file://` taraması ve telif taraması sıfır eşleşme.
Ortamda bulunan headless Chromium (Playwright) ile sayfa gerçekten `file://` üzerinden açıldı,
konsol hatası/istisna görülmedi; kısa basılı-tutma ile normal oynanış, uzun basılı-tutma ile
tavana çarpıp kaybetme ve `R` ile temiz yeniden başlama ekran görüntüleriyle doğrulandı.
**Bu otomatik bir yükleme/girdi kontrolüydü — bir insanın elle, gerçek zamanlı tepki vererek
oynaması değildir; oynanabilirliği tarayıcıda elle doğrulanmadı.**

## Varlıklar ve telif
Tüm görseller Canvas ile, sesler WebAudio ile kod içinde üretilmiştir. Dış varlık, dış font,
CDN bağımlılığı yoktur. Bu oyun hiçbir tescilli oyunun klonu değildir; basılı tutarak
zıplama yüksekliğini kontrol etme ve dar bir boşluktan zamanlamayla geçme fikrinden, genel
bir arcade/fizik mekaniği düzeyinde esinlenilmiştir.

## Bilinen sınır
`file://` altında en yüksek skor kaydı bazı tarayıcılarda çalışmayabilir; oyun yine oynanır.

## Geliştirmek isteyen için ilk adım
`logic.js` içindeki `THRUST`, `BOUNCE_V` ve `GAP_H0`/`GAP_SHRINK` sabitlerini değiştirerek
zıplama hissini ve zorluk dengesini ayarlayabilir veya `step()` içindeki kapı yerleştirme
mantığına yeni bir duvar tipi (örn. hareketli kapı) ekleyebilirsin.
