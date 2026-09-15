# Son Kuyu

**Kanat:** sandbox/inşa
**Tek cümle:** 5x5'lik kısıtlı bir karede odun/taş toplayan kolektörler kurup kuyu inşa ederek sürekli tükenen suyu dengelemeye çalışıyorsun.

## Nasıl oynanır
**Tarayıcıda oyna (kurulumsuz):**
https://htmlpreview.github.io/?https://github.com/MuratKingdom/oyun-rafi/blob/oyun/sonkuyu/index.html
Bu, üçüncü taraf bir görüntüleyicidir; kurulum gerektirmez ama garanti edilmez ve bu link
tarayıcıda elle denenmemiştir.

**Yerelde oynamak istersen:** `oyun-rafi` deposunda `oyun/sonkuyu` dalını seç → Code →
Download ZIP (veya dalı klonla), `index.html` dosyasını herhangi bir modern tarayıcıda aç.
Tek dosya isteyen için `oyun-tek-dosya.html` tek başına çalışır. Kurulum, derleme, sunucu,
internet bağlantısı gerekmez.

## Kontroller
- **Ok tuşları (veya WASD):** karedeki imleci hareket ettirir
- **Boşluk / Enter:** imlecin üzerindeki kareye göre topla veya kuyu inşa et
- **R:** kaybettikten sonra yeniden başla
- **M:** sesi aç/kapat
- **Dokunuş / tıklama (canvas üzerinde):** dokunduğun kareye imleci taşır ve aynı anda o karede eylemi uygular (kayıp ekranındaysa yeniden başlatır)

## Ana mekanik, amaç ve kurallar
Kare 5x5 hücreden oluşur; bazı hücrelerde odun kaynağı, bazılarında taş kaynağı vardır
(oyun her açılışta rastgele ama kurallı dağılır). İmleci bir kaynak hücresine götürüp eylem
tuşuna basarsan orada kalıcı bir **kolektör** kurulur ve o kaynağı saniyede sabit bir hızla
üretmeye başlar — bu ücretsizdir. Boş bir hücrede eylem tuşuna basarsan, yeterli odun ve taşın
varsa (3 odun + 3 taş) bir **kuyu** inşa edilir; kuyular saniyede su üretir.

Su, oyunun başından beri sürekli ve otomatik olarak azalır; zaman geçtikçe bu tüketim hızı
kademeli artar (zorluk eğrisi). Su sıfıra inerse oyun biter ("Su tükendi"). Skor
(**Üretim**) o ana kadar üretilen toplam kaynak miktarıdır ve hiç azalmaz; en yüksek üretim
(**Rekor**) tarayıcıda saklanır. Amaç: kolektörlerle biriktirdiğin odun/taşı zamanında kuyuya
çevirip suyu dengede tutarak üretimi olabildiğince artırmak.

## NE ÇALIŞIYOR
- Kolektör/kuyu inşası, kaynak üretimi ve su tüketimi (kanıt: T1, T3, T5c, tarayıcı ekran görüntüsü)
- Kayıp koşulu ve sebebinin gösterimi — su tükenince "Su tükendi" (kanıt: T2, W4, render.js)
- Tek tuşla anında yeniden başlama, aynı seed'den birebir aynı ilk durum (kanıt: T4, T5d)
- Canvas çizimi: grid, imleç, kaynak/skor/rekor göstergesi, kayıp ekranı (kanıt: T5b, W3, tarayıcı ekran görüntüsü)
- WebAudio ile inşa/kayıp sesi, `M` ile sessize alma, `localStorage` rekor kaydı (kanıt: kod okuma; tarayıcıda konsol hatası 0)

## NE EKSİK / İSKELE
- Kazanma koşulu yok; oyun yalnızca "ne kadar dayanabilirsin" mantığıyla ilerliyor, sabit bir hedefte bitmiyor.
- Görsel çeşitlilik minimaldir (düz renk kareler, ikon/animasyon yok).
- Kolektör/kuyu inşası geri alınamaz veya taşınamaz; yanlış yerleştirme kalıcıdır.
- Zorluk eğrisi doğrusal bir basamak fonksiyonu; ince ayarlanmış bir denge eğrisi değil.

## Doğrulama durumu
`node --check` tüm dosyalarda temiz (çıkış kodu 0). `test.js` (T1-T4) ve `test-dom.js`
(T5a-T5d) hepsi PASS, çıkış kodu 0. Ağ/`file://` taraması ve telif taraması sıfır eşleşme.
Ortamda bulunan headless Chromium ile sayfa gerçekten açıldı (3 saniyelik sanal zaman),
konsol hatası/istisna görülmedi, ekran görüntüsü alındı ve grid'in doğru çizildiği (kaynak
kareleri, imleç) doğrulandı. **Bu otomatik bir yükleme kontrolüydü — klavye/dokunuş ile
gerçek bir insan eliyle uzun süreli oynanmadı; oynanabilirliği tarayıcıda elle doğrulanmadı.**

## Varlıklar ve telif
Tüm görseller Canvas ile, sesler WebAudio ile kod içinde üretilmiştir. Dış varlık, dış font,
CDN bağımlılığı yoktur. Bu oyun hiçbir tescilli oyunun klonu değildir; sınırlı bir alanda
kaynak toplayıp bir zincirle (odun+taş → kuyu → su) hayatta kalma fikrinden, genel bir
sandbox/inşa mekaniği düzeyinde esinlenilmiştir.

## Bilinen sınır
`file://` altında en yüksek skor kaydı bazı tarayıcılarda çalışmayabilir; oyun yine oynanır.

## Geliştirmek isteyen için ilk adım
`logic.js` içindeki `WELL_RATE`, `BASE_DRAIN` ve `DRAIN_RAMP` sabitlerini değiştirerek
zorluk dengesini ayarlayabilir veya `step()` fonksiyonuna yeni bir bina tipi (örn. depo,
kapasite sınırı) ekleyebilirsin.
