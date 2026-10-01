# Tohum Payı

**Kanat:** sandbox/inşa
**Tek cümle:** Altı tarlalık bir çiftlikte her ekimde bir tahılı tohum olarak ayırıp, her akşam artan yemek payını karşılamaya çalışıyorsun.

## Nasıl oynanır
**Tarayıcıda oyna (kurulumsuz):**
https://htmlpreview.github.io/?https://github.com/MuratKingdom/oyun-rafi/blob/oyun/tohumpayi/index.html
Bu, üçüncü taraf bir görüntüleyicidir; kurulum gerektirmez ama garanti edilmez ve bu link
tarayıcıda elle denenmemiştir.

**Yerelde oynamak istersen:** `oyun-rafi` deposunda `oyun/tohumpayi` dalını seç → Code →
Download ZIP (veya dalı klonla), `index.html` dosyasını herhangi bir modern tarayıcıda aç.
Tek dosya isteyen için `oyun-tek-dosya.html` tek başına çalışır. Kurulum, derleme, sunucu,
internet bağlantısı gerekmez.

## Kontroller
- **1–6:** o numaralı tarlaya dokun (boşsa ek, olgunsa hasat)
- **Fare/dokunuş (tarla üzerinde):** aynı
- **R:** yeniden başla · **Boşluk / tıklama:** oyun bittiyse yeniden başlat
- **M:** sesi aç/kapat

## Ana mekanik, amaç ve kurallar
Tohum ayrı bir kaynak değil: boş tarlaya ekmek 1 tahıla mal olur. Ekilen tarla 5 saniyede
olgunlaşır ve 2–4 tahıl verir (seed'e bağlı rastgele). Olgun ürünü 4 saniye içinde toplamazsan
çürür. Her gün 12 saniye sürer; gün sonunda yemek payı (2 + gün numarası) stoktan düşer. Stokta
yeterli tahıl yoksa oyun biter ("Kıtlık: …"). 15 günü tamamlarsan kazanırsın. Skor, tamamlanan
gün sayısıdır; rekor tarayıcıda saklanır. Gerilim: yemeklik tahılı yemek mi, ekip yarına
yatırmak mı?

## NE ÇALIŞIYOR
- Ekim, büyüme, hasat, çürüme ve gün sonu yemek payı (kanıt: T1, T3, T5c)
- Kıtlıkla kaybetme ve sebebin ekranda gösterilmesi (kanıt: T2, W4)
- Hamle yapan basit bir bot 15 günü bitirebiliyor, yani kazanç erişilebilir (kanıt: T3)
- Tek tuşla temiz yeniden başlama (kanıt: T4, T5d)
- Canvas çizimi, skor/rekor, `M` ile ses kapatma (kanıt: T5b, W3, tarayıcı konsol hatası 0)

## NE EKSİK / İSKELE
- Zorluk eğrisi yalnızca doğrusal artan yemek payı; hava/kuraklık gibi olay yok.
- İnsan oynanışına göre denge ayarı yapılmadı; bot sınırsız hızlı tepki verir.
- Ayrı mobil buton düzeni yok; tarlalara dokunma çalışacak şekilde yazıldı ama mobilde denenmedi.
- Görsel çeşitlilik minimal (düz renk, tek bitki çizimi).

## Doğrulama durumu
`node --check` tüm JS dosyalarında çıkış 0. `test.js` T1–T4 PASS (çıkış 0), `test-dom.js`
T5a–T5d PASS (çıkış 0). Ağ/`file://` ve telif taraması sıfır eşleşme. Headless Chromium ile
`file://` üzerinden açıldı, 1 ve 2 tuşlarıyla ekim yapıldı, ekran görüntüsünde tarlalar çizildi,
konsol hatası 0. Oynanabilirliği tarayıcıda elle doğrulanmadı; headless mantık ve yükleme
testleri geçti.

## Varlıklar ve telif
Tüm görseller Canvas ile, sesler WebAudio ile kod içinde üretilmiştir. Dış varlık, dış font,
CDN bağımlılığı yoktur. Bu oyun hiçbir tescilli oyunun klonu değildir; tohum/yemek
ekonomisi gibi genel kaynak yönetimi mekaniğinden esinlenilmiştir.

## Bilinen sınır
`file://` altında en yüksek skor kaydı bazı tarayıcılarda çalışmayabilir; oyun yine oynanır.

## Geliştirmek isteyen için ilk adım
`logic.js` içindeki `GROW`, `SPOIL` ve `needFor()` değerlerini değiştirerek dengeyi ayarla
veya `step()`'e hava olayı ekle.
