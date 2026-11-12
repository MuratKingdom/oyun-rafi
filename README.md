# Kıvılcım Zinciri

**Kanat:** arcade/fizik
**Tek cümle:** Duvarlardan seken kürelerin arasına tek bir kıvılcım atıp, patlamaların birbirine değerek zincirlenmesiyle seviyenin kotasını tutturuyorsun.

## Nasıl oynanır
**Tarayıcıda oyna (kurulumsuz):**
https://htmlpreview.github.io/?https://github.com/MuratKingdom/oyun-rafi/blob/oyun/kivilcimzincir/index.html
Bu, üçüncü taraf bir görüntüleyicidir; kurulum gerektirmez ama garanti edilmez ve bu link
tarayıcıda elle denenmemiştir.

**Yerelde oynamak istersen:** `oyun-rafi` deposunda `oyun/kivilcimzincir` dalını seç → Code →
Download ZIP (veya dalı klonla), `index.html` dosyasını herhangi bir modern tarayıcıda aç.
Tek dosya isteyen için `oyun-tek-dosya.html` tek başına çalışır. Kurulum, derleme, sunucu,
internet bağlantısı gerekmez.

## Kontroller
- Ok tuşları (veya WASD): nişan imlecini taşı
- Boşluk / Enter: kıvılcımı imlecin olduğu yere at (seviye başına bir kez)
- Fare / dokunuş: imleç parmağı/fareyi izler; tıklama/dokunuş o noktaya kıvılcım atar
- R: yeniden başla (bitiş ekranında Boşluk, Enter veya tıklama da başlatır)
- M: ses aç/kapat

## Ana mekanik, amaç ve kurallar
Alanda sabit hızla hareket edip duvarlardan seken küreler var. Seviye başına **tek** kıvılcım hakkın var:
attığın yerde 40 px yarıçaplı bir patlama büyür, ~0,8 sn durur ve söner. Patlamaya değen her küre de
kendi yerinde patlar; böylece zincir yayılır. Zincir sönünce yakalanan küre sayısı seviyenin kotasına
(ekrandaki `Zincir x/y`) ulaştıysa sonraki seviyeye geçersin; ulaşmadıysa oyun biter ("Zincir kısa kaldı").
Atış yapmadan 9 sn geçerse de oyun biter ("Süre doldu"). Her yakalanan küre zincirdeki derinliği kadar puan
verir (ilk halka 1, onun tetiklediği 2, …), geçilen seviye ek 5×seviye puan verir. Küre sayısı (14'ten 40'a)
ve kota oranı (%25'ten yukarı) her seviyede artar; 10. seviyeyi geçen kazanır. Rekor `localStorage`'da tutulur.

## NE ÇALIŞIYOR
- Kürelerin hareketi/duvar sekmesi, nişan, kıvılcım ve patlama zinciri (kanıt: T1, T5c, tarayıcı)
- İki kayıp sebebi ekranda: "Zincir kısa kaldı: x/y küre", "Süre doldu: kıvılcım atılmadı" (kanıt: T2, T2b, W4, tarayıcı)
- Atış yerini ileri simülasyonla seçen bot 3 seed'in 2'sinde 10 seviyeyi bitirip kazanıyor, 3'ünde de 10. seviyeye ulaşıyor (kanıt: T3)
- Tek tuşla temiz yeniden başlatma (kanıt: T4, T4b, T5d, tarayıcı)
- Canvas çizimi + skor/seviye/zincir/süre/rekor göstergesi (kanıt: T5b, W3, headless Chromium ekran görüntüsü)

## NE EKSİK / İSKELE
- İnsan oynanışına göre denge ayarlanmadı; bot ızgarada tarama yapıp en iyi anı bekliyor, insanın 10 seviyeyi geçip geçemeyeceği bilinmiyor
- Dokunmatik: dokunuş/tıklama ile atış kodda var, gerçek dokunmatik cihazda denenmedi; ayrı mobil buton düzeni yok
- Küreler birbirine çarpmıyor, yalnızca duvarlardan sekiyor; patlayan küre yerinde duruyor
- Görsel çeşitlilik minimal (düz renk daireler)

## Doğrulama durumu
Koşulan kontroller: `node --check` (tüm JS, çıkış 0), `node test.js` (T1–T4, T2b, T4b PASS, çıkış 0),
`node test-dom.js` (T5a–T5d PASS, çıkış 0), ağ/`file://` taraması, telif taraması, referans bütünlüğü,
`node build-single.js`. Ayrıca headless Chromium ile `index.html` ve `oyun-tek-dosya.html` `file://` üzerinden
açıldı; otomatik girdiyle imleç taşındı, Boşluk ile kıvılcım atıldı, kayıp sebebi oluştu, R ile yeniden başladı,
konsol hatası 0. Oynanabilirliği tarayıcıda elle doğrulanmadı; headless mantık ve yükleme testleri geçti.

## Varlıklar ve telif
Tüm görseller Canvas ile, sesler WebAudio ile kod içinde üretilmiştir. Dış varlık, dış font,
CDN bağımlılığı yoktur. Bu oyun hiçbir tescilli oyunun klonu değildir; genel "zincirleme patlama"
mekaniğinden esinlenilmiştir.

## Bilinen sınır
`file://` altında en yüksek skor kaydı bazı tarayıcılarda çalışmayabilir; oyun yine oynanır.

## Geliştirmek isteyen için ilk adım
`logic.js` içindeki `quotaFor()` ve `C.BURST_R`/`C.HOLD` değerlerini insan oynanışına göre dengele, ya da `step()`'teki küre döngüsüne küre-küre esnek çarpışması ekle.
