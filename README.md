# Bant Hattı

**Kanat:** sandbox/inşa
**Tek cümle:** Soldaki kaynaktan gelen kırmızı ve mavi parçaları, sınırlı sayıda bant ve ayırıcı döşeyerek sağdaki doğru renkli kutulara yönlendiriyorsun.

## Nasıl oynanır
**Tarayıcıda oyna (kurulumsuz):**
https://htmlpreview.github.io/?https://github.com/MuratKingdom/oyun-rafi/blob/oyun/banthatti/index.html
Bu, üçüncü taraf bir görüntüleyicidir; kurulum gerektirmez ama garanti edilmez ve bu link
tarayıcıda elle denenmemiştir.

**Yerelde oynamak istersen:** `oyun-rafi` deposunda `oyun/banthatti` dalını seç → Code →
Download ZIP (veya dalı klonla), `index.html` dosyasını herhangi bir modern tarayıcıda aç.
Tek dosya isteyen için `oyun-tek-dosya.html` tek başına çalışır. Kurulum, derleme, sunucu,
internet bağlantısı gerekmez.

## Kontroller
- Ok tuşları (veya WASD): imleci taşı
- Boşluk: imlecin altındaki hücreyi döndür (boş → ▶ → ▼ → ◀ → ▲ → ayırıcı → boş)
- Fare/dokunuş: hücreye tıkla = o hücreyi döndür
- Enter: 12 saniyelik hazırlık süresini atla ve bandı başlat
- R: yeniden başla (bitiş ekranında Boşluk, Enter veya tıklama da başlatır) · M: ses aç/kapat

## Ana mekanik, amaç ve kurallar
Yeşil kaynak hücreden sürekli kırmızı/mavi parça çıkar; parçalar her adımda bulundukları hücrenin okunun
yönünde bir hücre ilerler. Ayırıcı (üst yarısı kırmızı, alt yarısı mavi) gelen parçayı rengine göre
çevirir: kırmızı sola, mavi sağa döner (ilerleme yönüne göre). Boş hücreye, kayaya ya da ızgaranın dışına
giden parça kaybolur; yanlış renkli kutuya giren parça da kayıptır. 3 kayıpta oyun biter ve sebep ekranda yazar.
Toplam 22 parça hakkın var. 30 parçayı doğru kutuya ulaştırırsan kazanırsın; skor teslim edilen parça
sayısıdır. Teslim arttıkça bant hızlanır (adım 0,60 sn → en çok 0,30 sn) ve parçalar sıklaşır.
Kaynak, kutular ve kayalar her oyunda yeni bir tohumla değişir. Rekor `localStorage`'da tutulur.

## NE ÇALIŞIYOR
- Parça akışı, ok/ayırıcı yönlendirmesi, kutuya teslim ve skor (kanıt: T1, T3, T5c)
- Kayıp sebepleri ekranda: "Parça boşluğa düştü", "Parça bantın dışına düştü", "Yanlış kutu: …" (kanıt: T2, T2b)
- Çözüm bot tarafından 3 seed'de 30 teslimle bitiriliyor, kayalar çözüm yolunu 200 seed'de kesmiyor (kanıt: T3, T7)
- Parça hakkı sınırı ve temiz yeniden başlatma (kanıt: T6, T4, T5d)
- Canvas çizimi, klavye ve tıklama girdisi (kanıt: T5b, T5c, grep W1–W4)

## NE EKSİK / İSKELE
- İnsan oynanışına göre denge ayarlanmadı; 12 sn hazırlığın ve 22 parça hakkının insan için uygun olup olmadığı bilinmiyor
- Dokunmatik: tıklama ile hücre döndürme kodda var, gerçek dokunmatik cihazda denenmedi; ayrı mobil buton düzeni yok
- Tek bir çözüm şablonu test edildi; tek bir ayırıcıdan başka ara bileşen (köprü, bekletici) yok
- Görsel çeşitlilik minimal

## Doğrulama durumu
Bu klasörde koşulan kontroller: `node --check` (tüm JS), `node test.js` (T1–T4, T2b, T6, T7), `node test-dom.js` (T5a–T5d),
ağ/`file://` taraması, telif taraması, referans bütünlüğü ve `node build-single.js`. Çıktıları koşu raporundadır.
Oynanabilirliği tarayıcıda elle doğrulanmadı; headless mantık ve yükleme testleri geçti.

## Varlıklar ve telif
Tüm görseller Canvas ile, sesler WebAudio ile kod içinde üretilmiştir. Dış varlık, dış font,
CDN bağımlılığı yoktur. Bu oyun hiçbir tescilli oyunun klonu değildir; taşıyıcı bant yönlendirme
bulmacası mekaniğinden genel düzeyde esinlenilmiştir.

## Bilinen sınır
`file://` altında en yüksek skor kaydı bazı tarayıcılarda çalışmayabilir; oyun yine oynanır.

## Geliştirmek isteyen için ilk adım
`logic.js` içindeki `tick()` fonksiyonuna üçüncü bir parça rengi ve ona ait üçüncü bir kutu ekle, ya da `createState()`'teki kaya sayısını ve `MAXT`/`GRACE` sabitlerini insan oynanışına göre dengele.
