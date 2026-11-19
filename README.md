# Halka Dışı

**Kanat:** arcade/fizik
**Tek cümle:** Dairesel bir platformda diskini sürüp kütleleri farklı rakip diskleri çarparak halkanın dışına itiyorsun; sen düşersen oyun biter.

## Nasıl oynanır
**Tarayıcıda oyna (kurulumsuz):**
https://htmlpreview.github.io/?https://github.com/MuratKingdom/oyun-rafi/blob/oyun/halkadisi/index.html
Bu, üçüncü taraf bir görüntüleyicidir; kurulum gerektirmez ama garanti edilmez ve bu link
tarayıcıda elle denenmemiştir.

**Yerelde oynamak istersen:** `oyun-rafi` deposunda `oyun/halkadisi` dalını seç → Code →
Download ZIP (veya dalı klonla), `index.html` dosyasını herhangi bir modern tarayıcıda aç.
Tek dosya isteyen için `oyun-tek-dosya.html` tek başına çalışır. Kurulum, derleme, sunucu,
internet bağlantısı gerekmez.

## Kontroller
- Ok tuşları / WASD: diski o yöne hızlandır (kayar, hemen durmaz)
- Boşluk: hamle — o anki yönde ani hız patlaması (1 sn bekleme; diskin çevresindeki halka dolunca hazır)
- Fare / dokunuş: basılı tuttuğun noktaya doğru hızlan
- R: yeniden başla (bitiş ekranında Boşluk, Enter veya tıklama da başlatır)
- M: ses aç/kapat

## Ana mekanik, amaç ve kurallar
Mavi disk sensin. Rakip diskler sana doğru hızlanır ve seni itmeye çalışır. Çarpışmalar kütleye
göre esnek hesaplanır: sarı (hafif) kolay savrulur, turuncu (orta), mor (ağır) zor kıpırdar ve seni
geri iter. Sert darbe alan rakip 0,6 sn sersemler (çevresinde beyaz yay) ve o sürede itilmeye açıktır.
Merkezi halkanın dışına çıkan rakip düşer: dalga numarası × 10 puan. Dalgadaki herkes düşünce
dalga × 25 bonus ve sıradaki dalga gelir (2'den 7'ye kadar rakip, ağır rakip oranı artar).
Senin merkezin kırmızı kenarı geçerse oyun biter ("Halkanın dışına düştün (dalga n)").
8 dalgayı temizlersen kazanırsın. Rekor `localStorage`'da tutulur.

## NE ÇALIŞIYOR
- Ataletli hareket, hamle, kütleye göre esnek çarpışma, rakip takibi ve kenardan kaçınması (kanıt: T1, T5c, tarayıcı)
- Kayıp ve sebebi ekranda; sağa basılı tutan veya boşta bekleyen oyuncu dalga 1'de düşüyor (kanıt: T2, T2b, W4, tarayıcı)
- Rakibi merkezin karşı tarafından iten bot 12 seed'in hepsinde puan topluyor, 2'sinde 8 dalgayı bitirip kazanıyor (kanıt: T3, T3b)
- Tek tuşla temiz yeniden başlatma (kanıt: T4, T4b, T5d, tarayıcı)
- Canvas çizimi, skor/dalga/rekor göstergesi, hamle bekleme halkası, sersemleme yayı, parçacık ve ekran sarsıntısı (kanıt: T5b, W3, headless Chromium ekran görüntüsü)

## NE EKSİK / İSKELE
- İnsan oynanışına göre denge ayarlanmadı; rakip ivmeleri ve sersemleme süresi yalnızca bot simülasyonuyla seçildi (bot 30 seed'de ortalama 7. dalgaya ulaşıyor, 6'sında kazanıyor).
- Dokunmatik kontrolde hamle (dash) yok; dokunuş yalnızca hareket ettirir. Gerçek dokunmatik cihazda denenmedi.
- Platform küçülmüyor, engel/güçlendirme yok; tek arena.
- Görsel çeşitlilik minimal (düz renkli diskler).

## Doğrulama durumu
Koşulan kontroller: `node --check` (tüm JS, çıkış 0), `node test.js` (T1–T4 + T2b, T3b, T4b PASS, çıkış 0),
`node test-dom.js` (T5a–T5d PASS, çıkış 0), ağ/`file://` taraması, telif taraması, referans bütünlüğü,
`node build-single.js`. Ayrıca headless Chromium (Playwright) ile `index.html` ve `oyun-tek-dosya.html`
`file://` üzerinden açıldı; otomatik girdiyle ok tuşu + Boşluk hareket/hamle yaptı, sağa basılı tutunca
kayıp ekranı çıktı, R ile yeniden başladı, fare basılı tutunca disk imlece hareket etti; konsol hatası 0, dış istek 0.
Oynanabilirliği tarayıcıda elle doğrulanmadı; headless mantık ve yükleme testleri geçti.

## Varlıklar ve telif
Tüm görseller Canvas ile, sesler WebAudio ile kod içinde üretilmiştir. Dış varlık, dış font,
CDN bağımlılığı yoktur. Bu oyun hiçbir tescilli oyunun klonu değildir; genel "halkadan dışarı itme"
güreş fikrinden ve kütleli esnek çarpışma fiziğinden esinlenilmiştir.

## Bilinen sınır
`file://` altında en yüksek skor kaydı bazı tarayıcılarda çalışmayabilir; oyun yine oynanır.

## Geliştirmek isteyen için ilk adım
`logic.js` içindeki `KINDS` ivmelerini ve `C.STUN_T`/`C.DASH_CD` değerlerini insan oynanışına göre dengele,
ya da `startWave()`'e her dalgada `C.R`'yi birkaç piksel küçülten bir halka daraltması ekle.
