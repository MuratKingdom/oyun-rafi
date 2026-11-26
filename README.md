# Kanca Tırmanışı

**Kanat:** arcade/fizik
**Tek cümle:** Aşağıdan yükselen sise yakalanmadan, kancanı yukarıdaki çapalara atıp kendini çekerek ve doğru anda bırakıp fırlayarak 1000 metreye tırmanıyorsun.

## Nasıl oynanır
**Tarayıcıda oyna (kurulumsuz):**
https://htmlpreview.github.io/?https://github.com/MuratKingdom/oyun-rafi/blob/oyun/kancatirmanis/index.html
Bu, üçüncü taraf bir görüntüleyicidir; kurulum gerektirmez ama garanti edilmez ve bu link
tarayıcıda elle denenmemiştir.

**Yerelde oynamak istersen:** `oyun-rafi` deposunda `oyun/kancatirmanis` dalını seç → Code →
Download ZIP (veya dalı klonla), `index.html` dosyasını herhangi bir modern tarayıcıda aç.
Tek dosya isteyen için `oyun-tek-dosya.html` tek başına çalışır. Kurulum, derleme, sunucu,
internet bağlantısı gerekmez.

## Kontroller
- **Boşluk / Yukarı / W** → bas: kancayı menzildeki çapaya at · basılı tut: kendini çapaya çek / asılı kal · bırak: ipi kopar, hızınla fırla
- **← / → (A / D)** → havada yatay kontrol; kanca atarken o yöndeki çapayı tercih eder
- **Fare / dokunuş** → canvas'a basılı tut = Boşluk; ekranın sol/sağ üçte birine basmak o yönü tercih eder
- **R** → yeniden başla (her an) · kayıp/kazanç ekranında **Boşluk** veya **tıklama** da yeniden başlatır
- **M** → sesi aç/kapat

## Ana mekanik, amaç ve kurallar
- Kanca bir **çekme** aracıdır, salınım değil: takıldığı çapaya doğru 1500 px/s² ivmeyle çeker. Çapaya varınca asılı kalırsın.
- Her çapa toplam 1,1 sn yük taşıyınca **kırılır** (renk sarıdan kırmızıya döner) ve düşmeye başlarsın.
- Çekilirken Boşluğu bırakırsan biriken hızla yukarı fırlarsın: çapaya varmadan bırakmak daha yükseğe götürür ama bir sonraki çapayı menzilde yakalaman gerekir.
- Menzil 240 px'tir (yarım halka olarak çizilir); hedeflenecek çapa beyaz halkayla gösterilir. Kanca yalnızca oyuncunun üstündeki çapalara atılır.
- İlk girdiyle birlikte aşağıdan sis yükselmeye başlar; tırmandıkça hızlanır (26 → 150 px/s). Sise değersen ya da ekranın altına düşersen oyun biter: "Sis seni yuttu (n m)".
- Skor = ulaşılan en yüksek nokta (m). 1000 m'ye ulaşırsan kazanırsın. Çapa sıraları yükseldikçe seyrekleşir. En yüksek skor tarayıcıda saklanır.

## NE ÇALIŞIYOR
- Kanca atma, çapaya çekme, asılı kalma, çapanın kırılması, bırakıp fırlama (kanıt: T1, T3b, T5c, tarayıcı)
- Başlattıktan sonra boşta kalan oyuncu ~10 sn'de sise yakalanıyor, sebep ekranda yazıyor (kanıt: T2, W4, tarayıcı)
- İlk girdi gelmeden sis yükselmiyor (kanıt: T2b)
- Basit bot 10 seed'in hepsinde 160 m+ tırmanıyor, 1'inde 1000 m'ye ulaşıp kazanıyor (kanıt: T3)
- R, Boşluk ve tıklama ile tek adımda temiz yeniden başlatma (kanıt: T4, T5d, T5e, tarayıcı)
- Canvas çizim + yükseklik/rekor göstergesi, parçacık ve kısa ekran sarsıntısı (kanıt: T5b, W3, headless Chromium ekran görüntüsü)

## NE EKSİK / İSKELE
- İnsan oynanışına göre denge ayarlanmadı (sis hızı, çapa aralığı ve kırılma süresi bot simülasyonuyla seçildi)
- Dokunuşla kontrol kodda var ve fare tıklamasıyla denendi; gerçek dokunmatik cihazda denenmedi, ayrı mobil buton düzeni yok
- Ekranın altına düşen oyuncu görünmeden ölür (kamera aşağı inmez); sebep yine ekranda yazar
- Tek çapa türü; hareketli çapa, engel veya güçlendirme yok; görsel çeşitlilik minimal

## Doğrulama durumu
- `node --check` altı JS dosyasında çıkış 0
- `node test.js`: T1, T2, T2b, T3, T3b, T4 PASS (çıkış 0)
- `node test-dom.js`: T5a, T5b, T5c, T5d, T5e PASS (çıkış 0)
- Headless Chromium (Playwright) ile `index.html` ve `oyun-tek-dosya.html` `file://` üzerinden açıldı: Boşluk bas-bırak döngüsüyle ~195 m tırmanıldı, girdi kesilince sis kayıp ekranını gösterdi, R yeniden başlattı; konsol hatası 0, dış istek 0. Girdiler otomatikti.

Oynanabilirliği tarayıcıda elle doğrulanmadı; headless mantık ve yükleme testleri geçti.

## Varlıklar ve telif
Tüm görseller Canvas ile, sesler WebAudio ile kod içinde üretilmiştir. Dış varlık, dış font,
CDN bağımlılığı yoktur. Bu oyun hiçbir tescilli oyunun klonu değildir; genel "kancayla kendini
çekerek dikey tırmanma" fikrinden esinlenilmiştir.

## Bilinen sınır
`file://` altında en yüksek skor kaydı bazı tarayıcılarda çalışmayabilir; oyun yine oynanır.

## Geliştirmek isteyen için ilk adım
`logic.js` içindeki `C.BREAK`, `C.FOG0`/`C.FOG_K` ve `rowGap()` değerlerini insan oynanışına göre dengele; ardından `genAnchors()`'a yatayda kayan ikinci bir çapa türü ekle.
