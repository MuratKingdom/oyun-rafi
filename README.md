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
- **Dokunuş / tıklama (ekranın herhangi bir yerinde, basılı tut):** aynı — kayıp ekranında kısa bir kilitten (0,45 sn) sonra dokunuş yeniden başlatır
- **P / Esc:** duraklat; sekme arka plana geçince oyun kendiliğinden duraklar
- **R:** kaybettikten sonra yeniden başla
- **M:** sesi aç/kapat

## Ana mekanik, amaç ve kurallar
Top zeminde sürekli ve otomatik olarak zıplar (dokunmana gerek yok). Soldan sağa doğru art
arda duvarlar yaklaşır; her duvarda geçilecek bir boşluk (kapı) vardır ve bu boşluk her
duvarda farklı bir yükseklikte durur. Zıplarken tuşu **basılı tuttuğun sürece** yerçekimi
zayıflar ve top daha yükseğe çıkar; bıraktığında normal yerçekimiyle geri düşer. Amaç, her
duvarın kapısını topun mevcut yüksekliğine denk getirip çarpmadan geçmek. Kapıyı ıskalayıp
duvara çarparsan ya da tuşu çok uzun süre basılı tutup tavana çarparsan oyun biter. Skor
(**Kapı**) geçtiğin kapı sayısıdır; en yüksek skor (**Rekor**) tarayıcıda saklanır.

**Bölümler (2 Ekim 2026):** Oyun 10 bölümdür, her bölüm 8 kapı. 10. bölümün son kapısı
geçilince **kazanırsın**. Yeni öğeler bölümle açılır:
- **Bölüm 2+ · Yıldız:** kapının ortasında durur; toplayınca topun çevresinde bir **kalkan**
  belirir (en fazla 1). Kalkan bir duvar çarpmasını affeder; tavanı affetmez.
- **Bölüm 3+ · Hareketli kapı (mor):** boşluk yukarı-aşağı salınır; genlik bölümle büyür.
- **Bölüm 6+ · Çift duvar:** art arda iki duvar, boşlukları birbirine kaydırılmış.

Adalet kuralları: art arda iki kapının yükseklik farkı en fazla 150 px'tir (top yalnız
zeminden sekerek yükselir); çift duvardan sonraki duvar normal aralıkla gelir. Zaman
geçtikçe duvarlar hızlanır ve kapılar daralır. Her oyun farklı bir tohumla (seed) başlar,
bu yüzden kapı dizilimi her seferinde değişir.

## Dikey ekran (2 Ekim 2026)
Oyun alanının mantıksal yüksekliği ekranın oranına göre 540–1000 arasında seçilir (genişlik 520
sabit); uzun telefonda alan ekranı dikey doldurur. Top yalnız zeminden sekerek yükseldiği için
alan büyürken dikey fizik de aynı oranda (`k`) ölçeklenir: yerçekimi, itiş, sekme hızı, kapı
boyu, salınım genliği, sıçrama sınırı. Oyun geometrik olarak aynı kalır; botla ölçülen denge her
ekranda geçerlidir (T16 eşdeğerlik, T17 H=900'de kazanılabilirlik). Yükseklik yalnız yeni oyunda
değişir; oyun sürerken ekran dönerse alan sabit kalır.

## Yeni güçler ve engeller (2 Ekim 2026)
| Bölüm | Öğe | Ne yapar |
|---|---|---|
| 4+ | **Nefes alan kapı** (yeşil ağız) | Ağız ortası sabit kalır, boyu %72'ye kadar daralıp genişler; hareketli kapıyla birleşmez |
| 5+ | **⏱ Yavaşlatma** (mavi saat) | 4 sn boyunca duvarlar %65 hızla akar; topun düşüşü değişmez |
| 5+ | **Küçülme** (pembe halka) | 6 sn boyunca top %60 boyuta iner, dar ağızlardan geçer |
| 7+ | **Zemin dikeni** (kırmızı) | Duvarın ardında zeminde şerit; üstüne sekmek öldürür, basılı tutup havada kalarak geçilir |

Güçler kapının ortasında yıldızın yerine çıkar; tekrar alınca süre baştan başlar. Kalkan bir
diken çarpmasını da yutar. Etkin güçler ve kalan süreleri zeminin altında, sağda görünür.
Çift duvarın ikinci parçasında nefes/diken olmaz.

## Mağaza (2 Ekim 2026)
Başlangıç ve oyun sonu ekranındaki **🛒 Mağaza** düğmesiyle açılır. Para birimi **yıldız**dır:
oyunda topladığın yıldızlar + geçtiğin her bölüm için 1 + kazanırsan 10. Gerçek para yok.

| Top | Fiyat | | Harita | Fiyat |
|---|---|---|---|---|
| Klasik | ücretsiz | | Gece | ücretsiz |
| Kor, Nane | ★ 15 | | Gün Batımı, Orman | ★ 40 |
| Küp | ★ 30 | | Neon, Buz | ★ 70 |
| Elmas | ★ 45 | | | |
| Yıldız | ★ 60 | | | |
| Gezegen (halkalı) | ★ 90 | | | |

Satın alınan ürün hemen kuşanılır; sahip olunanlar arasında istediğin an geçiş yapılır.
Cüzdan ve görünümler tarayıcıda (`localStorage`, `sekmeguc-profil`) saklanır; bozuk ya da
elle değiştirilmiş kayıt güvenli varsayılana döner. Katalog `shop.js`'te.

## Günlük görev ve giriş ödülü (2 Ekim 2026)
**📋 Görevler** düğmesi (ya da mağazadaki *Görevler* sekmesi) o günün 3 görevini gösterir.
Görevler her gece yarısı (cihaz saati) yenilenir; gün tarihinden belirlenimli seçilir, 8 türden
3 farklısı: bir koşuda yıldız / kapı, bölüme ulaş, gün içinde toplam kapı / oyun / kalkan
kullanımı / hareketli kapı, oyunu kazan. Biten görevin ödülü (★ 5–25) oyun sonunda kendiliğinden
cüzdana eklenir ve oyun sonu ekranında gösterilir. **Giriş ödülü:** günün ilk açılışında
★ (2 + seri), en çok ★ 7; bir gün atlanırsa seri 1'e döner. Kayıt `localStorage`
(`sekmeguc-gunluk`); kurcalanmış kayıtta görevler ve ödüller tarihten yeniden üretilir,
ilerleme sınırlanır. Mantık `quests.js`'te.

## NE ÇALIŞIYOR
- Zıplama fiziği, basılı-tutma ile yükseklik kontrolü, kapı/duvar çarpışması ve kayıp sebebi gösterimi (kanıt: T1, T2, T3, T5c, tarayıcı)
- Artan zorluk (hız + daralan kapı) ve kapı geçme skoru (kanıt: T1, T3, W3)
- Tek tuşla anında yeniden başlama, aynı seed'den birebir aynı ilk durum (kanıt: T4, T5d)
- Canvas çizimi: zemin/tavan, duvarlar, top, skor/rekor, kayıp ekranı (kanıt: T5b, W3, W4, tarayıcı ekran görüntüsü)
- WebAudio ile zıplama/kapı geçme/kayıp sesleri, `M` ile sessize alma, `localStorage` rekor kaydı (kanıt: kod okuma; tarayıcıda konsol hatası 0)
- **Mobil cila (2 Ekim 2026):** başlangıç ekranı dokunuşu bekler (T5e), ölüm sonrası yanlış yeniden başlamayı önleyen kilit (T5f), tüm ekran dokunma alanı, kaydırma/yakınlaştırma kapalı, ekrana oranlı sığan keskin (DPR) canvas, parçacık + ekran sarsıntısı + top basılması + iz, titreşim (destekleyen cihazda), doygunluğa giden zorluk eğrisi (T6). Kanıt: test.js/test-dom.js PASS; Pixel 7 ve masaüstü boyutunda headless Chromium ekran görüntüleri, konsol hatası 0

## NE EKSİK / İSKELE
- Görsel tema tek renk; arka plan/tema çeşitliliği yok.
- Zorluk eğrisi sabitleri (`SPEED_MAX`, `GAP_MIN`, `DIFF_TAU`) insan oynanışına göre ayarlanmadı.
- Gerçek bir telefonda elle denenmedi (titreşim ve dokunma hissi dahil).

- Denge bir botla ölçüldü (aşağıda), insan oynanışıyla ayarlanmadı; 10 bölüm botun hızıyla ~105 sn sürüyor.

## Doğrulama durumu
**Mağaza:** `test.js` T13 (satın alma/kuşanma kuralları), T14 (bozuk/kurcalanmış kayıt),
T15 (ödül hesabı ve fiyat dengesi: bir kazanma koşusu en pahalı ürünün dörtte birinden
fazlasını getirir); `test-dom.js` T5g (oyun sonunda ödül cüzdana tam bir kez yazılır, kuşanılan
tema çizime gider) — hepsi PASS. Headless Chromium'da Pixel 7 boyutunda mağaza açıldı, bir top
ve bir harita satın alındı, profil kaydı ve oyun içi görünüm doğrulandı; konsol hatası 0.
**Güçler ve engeller:** `test.js` T23 (nefes kapısı ortası sabit, boy sınır içinde), T24
(yavaşlatma oranı 0,65 ve süre bitince normal), T25 (küçük top normalin sığmadığı ağızdan geçer),
T26 (diken öldürür, kalkan yutar, havada geçiş sayılır), T27 (öğeler doğru bölümde, adil birleşim)
— hepsi PASS. Kazanılabilirlik botu: kalkan açık 8/8, **kalkansız 8/8** (6'sı normal, 2'si
`--guclu` aramayla), H=900 alanda 2/2. Çizim headless Chromium'da Pixel 7 boyunda kontrol edildi,
konsol hatası 0.
**Günlük görevler:** `test.js` T18 (belirlenimli seçim, 30 günde 30 farklı set), T19 (giriş
serisi, ay/yıl geçişi, gün atlama), T20 (ilerleme ve ödülün tek seferliği), T21 (bozuk/kurcalanmış
kayıt), T22 (betikler ortak tarayıcı kapsamında birbirini ezmiyor); `test-dom.js` T5h (giriş ödülü
günde bir kez, ilerleme kaydedilir) — hepsi PASS. Pixel 7 boyutunda Görevler sekmesi açıldı,
konsol hatası 0.
**Bölümler (2. adım):** `test.js` T7 (bölüm atlama), T8 (kazanma), T9 (yıldız → kalkan →
çarpma yutulur, aynı duvar ikinci kez öldürmez, kalkansız ölüm), T10 (hareketli kapı alan
içinde), T11 (sıçrama ≤ 150 px, öğeler doğru bölümde açılıyor), T12 (bot tohum 1'de 10
bölümü bitiriyor) — hepsi PASS. `tools/kazanilabilirlik.js` ileriyi simüle eden bir botla
8 tohumun 8'ini **kalkan kapalıyken bile** bitirdi (5'i normal aramayla, 3'ü `--guclu` ile);
yani her dizilim fiziksel olarak geçilebilir. Bot insan tepki süresini temsil etmez.

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
Denge sabitleri `logic.js` başında: `LEVEL_COUNT`, `GATES_PER_LEVEL`, `STAR_FROM` /
`MOVE_FROM` / `DOUBLE_FROM`, `MAX_JUMP`. Değiştirdikten sonra
`node tools/kazanilabilirlik.js --kalkansiz` ile oyunun hâlâ geçilebilir olduğunu ölç.

`logic.js` içindeki `THRUST`, `BOUNCE_V` ve `GAP_H0`/`GAP_SHRINK` sabitlerini değiştirerek
zıplama hissini ve zorluk dengesini ayarlayabilir veya `step()` içindeki kapı yerleştirme
mantığına yeni bir duvar tipi (örn. hareketli kapı) ekleyebilirsin.
