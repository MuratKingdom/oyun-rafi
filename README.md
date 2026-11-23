# Ambar Hesabı

**Kanat:** sandbox/inşa
**Tek cümle:** Tek kaynaklı bir köyde, hasat mevsiminde taşan tahılı saklayacak kadar ambar kurup kışın aç kalmadan altı yıl dayanıyorsun.

## Nasıl oynanır
**Tarayıcıda oyna (kurulumsuz):**
https://htmlpreview.github.io/?https://github.com/MuratKingdom/oyun-rafi/blob/oyun/ambarhesabi/index.html
Bu, üçüncü taraf bir görüntüleyicidir; kurulum gerektirmez ama garanti edilmez ve bu link
tarayıcıda elle denenmemiştir.

**Yerelde oynamak istersen:** `oyun-rafi` deposunda `oyun/ambarhesabi` dalını seç → Code →
Download ZIP (veya dalı klonla), `index.html` dosyasını herhangi bir modern tarayıcıda aç.
Tek dosya isteyen için `oyun-tek-dosya.html` tek başına çalışır. Kurulum, derleme, sunucu,
internet bağlantısı gerekmez.

## Kontroller
- **Boşluk / B / Yukarı / W / Enter** → yeni ambar kur (14 tahıl)
- **X / Aşağı / S / Backspace** → son ambarı yık (4 tahıl geri gelir; yeni kapasiteye sığmayan tahıl kaybolur)
- **Fare / dokunuş** → boş yuvaya tıkla: ambar kur · kurulu ambara tıkla: ambar yık
- **R** → yeniden başla (oyun sırasında da) · kayıp/kazanç ekranında **Boşluk** veya **tıklama** da yeniden başlatır
- **M** → sesi aç/kapat

## Ana mekanik, amaç ve kurallar
- Tek kaynak tahıldır. Yıl 4 mevsimdir, her mevsim 12 saniye. Tarla ilkbaharda 4, yazda 9, sonbaharda 2,5 tahıl/sn verir (o yılın hasat yüzdesiyle çarpılır, %80–%120); **kışın gelir yoktur**.
- Köy sürekli tahıl yer: 3/sn, her yıl +0,15/sn.
- Her ambar 30 tahıl yer açar ama 0,1 tahıl/sn bakım ister. Başlangıçta 1 ambar ve 20 tahıl var; en fazla 10 ambar.
- Tahıl kapasiteyi aşarsa fazlası **taşar ve kaybolur** (sayaçta "taşan").
- Tahıl sıfırın altına inerse oyun biter ("Ambar boşaldı: köy kış mevsiminde aç kaldı (yıl n)").
- 6 yıl (288 sn) dayanırsan kazanırsın. Skor = dayanılan saniye; kazanırsan kalan tahıl eklenir.
- İkilem: az ambar = yazın tahıl taşar, kışa yetmez; çok ambar = kurulum maliyeti + bakım stoku eritir. Ekranda bu yılın ve gelecek yılın hasat yüzdesi görünür.

## NE ÇALIŞIYOR
- Mevsim döngüsü, gelir/tüketim, kapasite sınırı ve taşma (kanıt: T1, T6)
- Boşta kalan oyuncu 1. yıl kışında kaybediyor, sebep ekranda yazıyor (kanıt: T2, W4, tarayıcı)
- Erken aşırı ambar kurmak da kaybettiriyor (kanıt: T2b)
- 4 ambara kadar yalnızca ilkbahar/yazda ve ambar doluyken kuran bot 10 seed'in 6'sında kazanıyor; kazanınca skor = süre + kalan tahıl (kanıt: T3, T3b)
- Boşluk ile kurma, X ile yıkma, boş yuvaya tıklama ile kurma bağlı (kanıt: T5c, T5c2, T5c3, tarayıcı)
- Tek tuşla temiz yeniden başlatma (kanıt: T4, T4b, T5d, tarayıcı)
- Canvas çizim + tahıl/kapasite/skor/rekor/taşan göstergesi (kanıt: T5b, W3, headless Chromium ekran görüntüsü)

## NE EKSİK / İSKELE
- İnsan oynanışına göre denge ayarlanmadı (sabitler bot simülasyonuyla seçildi)
- Kışa kadar gereken tahılın tahmini ekranda gösterilmiyor; oyuncu net hızdan kendisi hesaplıyor
- Dokunuşla kur/yık kodda var, gerçek dokunmatik cihazda denenmedi; ayrı mobil buton düzeni yok
- Yıkma her zaman son ambarı kaldırır; tek kaynak, olay/afet yok; görsel çeşitlilik minimal

## Doğrulama durumu
- `node --check` altı JS dosyasında çıkış 0
- `node test.js`: T1, T2, T2b, T3, T3b, T4, T4b, T6 PASS (çıkış 0)
- `node test-dom.js`: T5a, T5b, T5c, T5c2, T5c3, T5d PASS (çıkış 0)
- Headless Chromium (Playwright) ile `index.html` ve `oyun-tek-dosya.html` `file://` üzerinden açıldı: Boşluk ambar kurdu, X yıktı, tıklama kurdu, kış + boş ambar kayıp ekranını gösterdi, R yeniden başlattı; konsol hatası 0, dış istek 0. Girdiler otomatikti.

Oynanabilirliği tarayıcıda elle doğrulanmadı; headless mantık ve yükleme testleri geçti.

## Varlıklar ve telif
Tüm görseller Canvas ile, sesler WebAudio ile kod içinde üretilmiştir. Dış varlık, dış font,
CDN bağımlılığı yoktur. Bu oyun hiçbir tescilli oyunun klonu değildir; genel "mevsimlik stok ve
depo kapasitesi" fikrinden esinlenilmiştir.

## Bilinen sınır
`file://` altında en yüksek skor kaydı bazı tarayıcılarda çalışmayabilir; oyun yine oynanır.

## Geliştirmek için ilk adım
`render.js` içindeki `draw()` fonksiyonuna, `L.eatRate(s)` ve ambar bakımından hesaplanan "kışa kadar gereken tahıl" çizgisini tahıl çubuğunun üzerine ekle; ardından `logic.js` içindeki `C.INCOME` / `C.EAT_STEP` değerlerini insan oynanışına göre dengele.
