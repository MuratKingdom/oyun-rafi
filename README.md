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

**Bölümler ve sonsuz mod (2 Ekim 2026):** Her bölüm 8 kapı. Oyun **sonsuzdur**; bitiş yok,
yalnız ölünce biter. Her 10 bölümde bir **eşik** geçilir (kutlama + ödülde ★ 5). İlk eşikten
(10. bölüm) sonra zorluk 20 bölüm boyunca yavaşça bir tavana çıkar: hız 340 → 380, en dar kapı
120 → 105, duvar aralığı en az 1,3 → 1,15 sn; 30. bölümden sonra sabit kalır. Asıl hedef rekor.
Yeni öğeler bölümle açılır:
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

## Yıldızın anlamı: güçlendirmeler ve devam (2 Ekim 2026)
Yıldız yalnız görünüm almaz. Mağazanın **Güç** sekmesinde kalıcı güçlendirmeler var (bir sonraki
koşudan itibaren geçerli, geri satılmaz):

| Güçlendirme | Basamaklar | Fiyat |
|---|---|---|
| Kalkan kapasitesi | 1 → 2 → 3 kalkan | ★ 200, ★ 600 |
| Başlangıç kalkanı | her koşuya 1 kalkanla başla | ★ 450 |
| Uzun güçler | güç süresi ×1,25 → ×1,5 | ★ 150, ★ 400 |
| Yıldız mıknatısı | yıldız/güç alma alanı ×1,6 → ×2,2 | ★ 250, ★ 650 |

**Ölünce devam:** yıldız yetiyorsa 5 sn boyunca **❤ Devam** düğmesi çıkar (klavyede C / Enter).
Bedeli koşu başına ★ 15 → 30 → 60, en çok 3 kez. Top ortaya alınır, önündeki engeller temizlenir,
yeni duvar 1,2 sn gecikir. Teklif açıkken koşunun ödülü yazılmaz; süre dolunca ya da yeniden
başlayınca yazılır. Güçlendirmelerin toplamı ★ 2700, görünümlerinki ★ 2635 (ekonomi hızı aşağıda).
Yıldız gerçek parayla satılmaz; güçlendirmeler bu yüzden adil kalır.

## Ses ve müzik (2 Ekim 2026)
Müzik ses dosyası değildir; `audio.js` her harita için kendi tonunda (Gece la minör, Gün Batımı
do majör, Orman re dorian, Neon sol minör, Buz mi pentatonik) 4 ölçülük bir döngü üretir:
bas + arpej, 3. bölümden itibaren ezgi, 6. bölümden itibaren sıklaşan bas. Tempo bölümle
100'den 136 BPM'e çıkar. Müzik yalnız oyun sürerken çalar; ileriye bakan sıralayıcı notaları
~150 ms önden kurar, sekme arka plandan dönünce birikmiş notaları bir anda çalmaz.
Efektler (sekme, kapı, yıldız, iki güç, kalkan, bölüm, kazanma, kayıp, satın alma, görev)
tek tabloda. Alttaki **🎵** müziği, **🔊** efektleri ayrı açıp kapatır; **M** ikisini birden.
Tercih `localStorage`'da (`sekmeguc-ses`).

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
oyunda topladığın yıldızlar + her 10 bölümlük eşik için 5 + günlük görev ve giriş ödülleri. Gerçek para yok.

| Top | Fiyat | | Harita | Fiyat |
|---|---|---|---|---|
| Klasik | ücretsiz | | Gece | ücretsiz |
| Kor | ★ 25 | | Gün Batımı | ★ 150 |
| Nane | ★ 60 | | Orman | ★ 200 |
| Küp | ★ 150 | | Neon | ★ 350 |
| Elmas | ★ 250 | | Buz | ★ 450 |
| Yıldız | ★ 400 | | | |
| Gezegen (halkalı) | ★ 600 | | | |

Satın alınan ürün hemen kuşanılır; sahip olunanlar arasında istediğin an geçiş yapılır.
Cüzdan ve görünümler tarayıcıda (`localStorage`, `sekmeguc-profil`) saklanır; bozuk ya da
elle değiştirilmiş kayıt güvenli varsayılana döner. Katalog `shop.js`'te.

## Günlük görev ve giriş ödülü (2 Ekim 2026)
**📋 Görevler** düğmesi (ya da mağazadaki *Görevler* sekmesi) o günün 3 görevini gösterir.
Görevler her gece yarısı (cihaz saati) yenilenir; gün tarihinden belirlenimli seçilir, 8 türden
3 farklısı: bir koşuda yıldız / kapı, bölüme ulaş, gün içinde toplam kapı / oyun / kalkan
kullanımı / hareketli kapı, ilk eşiği (10. bölüm) geç. Biten görevin ödülü (★ 3–15) oyun sonunda kendiliğinden
cüzdana eklenir ve oyun sonu ekranında gösterilir. **Giriş ödülü:** günün ilk açılışında
★ (2 + seri), en çok ★ 7; bir gün atlanırsa seri 1'e döner. Kayıt `localStorage`
(`sekmeguc-gunluk`); kurcalanmış kayıtta görevler ve ödüller tarihten yeniden üretilir,
ilerleme sınırlanır. Mantık `quests.js`'te.

## Ekonomi hızı (3 Ekim 2026)
İlk sürümde mağaza birkaç günde bitiyordu (orta oyuncu her şeye 6, usta oyuncu 2 günde
ulaşıyordu); hedefsiz kalan oyuncu bırakır. Yeni denge: bölüm başına ayrı ödül kalktı (kazanç
= ekranda toplanan yıldız + eşik başına ★ 5), görev ödülleri yaklaşık yarıya indi, fiyatlar
~5 katına çıktı. Ucuz ilk ürün (Kor, ★ 25) ilk gün alınabilsin diye bırakıldı. Giriş serisi
ve devam bedeli (★ 15/30/60) değişmedi.

`node tools/ekonomi.js` gerçek `shop.js`/`quests.js` değerleriyle tabloyu üretir. Oyuncu
modeli bir **varsayımdır** (bölüm başına ölüm olasılığı %30 / %15 / %7, günde 5 / 8 / 10 koşu,
çıkan yıldızın %50 / %65 / %80'ini alma), gerçek oyuncu verisi değildir; devam harcaması sayılmaz.

| Oyuncu | ★/gün | İlk alım | Güçlendirmelerin hepsi | Her şey |
|---|---|---|---|---|
| Gündelik | ~35 | 1. gün | ~79. gün | 120 günden uzun |
| Orta | ~114 | 1. gün | ~25. gün | ~49. gün |
| Usta | ~360 | 1. gün | ~8. gün | ~15. gün |

T36 bu aralıkları korur: herkes ilk gün bir şey alabilir, orta oyuncu güçlendirmelerin
hepsine 20 günden, her şeye 35 günden önce ulaşamaz. Play sürümünden gerçek veri gelince
(oturum başına koşu, ortalama bölüm) model değerleri `tools/ekonomi.js`'teki `PLAYERS`
tablosunda güncellenmeli.

## Görsel tasarım: neon arcade (4 Ekim 2026)
Global ad **Bopgate** (bkz. `docs/isim-arastirmasi.md`); açılış logosu ve sayfa başlığı bu ad.
Oyun içi metinler şimdilik Türkçe. Çizim `render.js`'te, tümü kodla (dış görsel/font yok):
- **Sahne:** temanın rengine göre dikey gradyan gök, ufuk ışığı, zeminde akan perspektif ızgara,
  neon tavan/zemin çizgisi; varsayılan haritada iki katman (paralaks) yıldız.
- **Duvarlar:** yandan ışık alan gövde, ağızda parlayan yuvarlak kapaklar ve aradaki ışık perdesi
  (mavi normal, mor hareketli, yeşil nefes alan); geçilen duvar söner.
- **Top ve efektler:** hacimli, parlayan top; topa bağlanan ışık kuyruğu; kapı geçişinde genişleyen
  halka ve skor sıçraması; dönen kalkan halkası; ışıklı parçacıklar; nabız atan yıldız/güçler.
- **HUD:** ortada büyük skor, solda bölüm + 8 parçalı ilerleme, sağda rekor.
- **Açılış:** BOPGATE logosu, nabız atan ▶ OYNA düğmesi, rekor ve cüzdan rozetleri.
- **Oyun sonu:** kart: sebep, büyük skor, yeni rekor rozeti, bölüm/eşik, kazanılan yıldız, görevler,
  devam ve tekrar.
- **Mağaza/görevler (DOM):** cam görünümlü panel, kayan sekmeler, kart ürünler, gradyanlı fiyat
  düğmeleri, parlayan önizlemeler, gradyanlı görev çubukları.
Açık renkli haritada (Buz) ışıma kapalıdır. Gradyan/gölge desteklemeyen bağlamda çizim düz renge
düşer (T22'deki sahte bağlam bu yolu, T5b gradyanlı yolu sınar).
Bilinen risk: ışıma (`shadowBlur`) eski/zayıf telefonlarda kare hızını düşürebilir; gerçek cihazda
ölçülmedi.

## Para kazanma: satın alma ve ödüllü reklam (4 Ekim 2026)
`monetize.js` ürün kataloğunu, hakları ve sağlayıcıyı tutar. Tüm ürünler **tek seferlik**
(Play'de "yönetilen, tüketilmeyen"); fiyatı Play Console belirler, aşağıdakiler öneridir:

| Ürün kimliği (Play Console) | Ad | Verdiği | Önerilen |
|---|---|---|---|
| `bopgate.reklamsiz` | Reklamsız | Reklam izlemeden ödül (bedava devam, ★ x2 anında) | ₺49,99 |
| `bopgate.destekci` | Destekçi paketi | Reklamsız + Alev topu + Nebula haritası + ★ 1000 | ₺149,99 |
| `bopgate.ozellik.paket` | Güç paketi | Bütün güçlendirmeler son basamakta | ₺99,99 |
| `bopgate.top.alev` | Alev topu | Yalnız parayla alınan top (alev şekli) | ₺29,99 |
| `bopgate.top.kristal` | Kristal topu | Yalnız parayla alınan top (altıgen kristal) | ₺29,99 |
| `bopgate.harita.nebula` | Nebula haritası | Yalnız parayla alınan harita, kendi müziğiyle | ₺39,99 |

- **Ödüllü reklam** (ara reklam ve banner yok): ölünce **📺 Devam** (koşu başına 1, yıldız harcamaz)
  ve oyun sonunda **📺 ★ x2** (koşunun yıldızını bir kez daha verir; görev ödülleri hariç; günde en
  çok 5). Reklamsız hakkı olan oyuncu aynı ödülü reklamsız alır ("❤ Bedava", "★ x2").
- Reklam uzun sürse de (teklif süresi 5 sn) izlenince devam hakkı geçerli kalır (T5k).
- Premium top/harita yıldızla alınamaz; mağazanın **💎** sekmesinde ve kendi sekmelerinde fiyatla
  görünür. "Satın alımları geri yükle" düğmesi ve açılışta otomatik geri yükleme var.
- **Sağlayıcı:** Android paketinde `window.BopgateNative` (Play Billing + AdMob, `android-paket/`).
  **Tarayıcıda gerçek para ve reklam yok**: düğmeler "Uygulamada" yazar ve kapalıdır. Elle denemek
  için adrese `?demo-odeme` eklenir (sahte sağlayıcı, her şey anında, para yok).
- Kayıt güvenliği: haklar profilde (`ent`); kurcalanmış kayıt premium ürünü ya da reklamsızı
  sahiplenemez (T37). Köprü hata verse ya da anında fırlatsa da oyun bozulmaz (T38).
- Bilinen sınır: gerçek doğrulama (sunucu tarafı satın alma doğrulaması) yok; hak cihazda tutulur ve
  Play'den geri yüklenir.

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

- Denge bir botla ölçüldü (aşağıda), insan oynanışıyla ayarlanmadı; ilk 10 bölüm botun hızıyla ~105 sn sürüyor.

## Doğrulama durumu
**Mağaza:** `test.js` T13 (satın alma/kuşanma kuralları), T14 (bozuk/kurcalanmış kayıt),
T15 (ödül hesabı: toplanan yıldız + eşik başına 5), T36 (ekonomi hızı, yukarıda); `test-dom.js` T5g (oyun sonunda ödül cüzdana tam bir kez yazılır, kuşanılan
tema çizime gider) — hepsi PASS. Headless Chromium'da Pixel 7 boyutunda mağaza açıldı, bir top
ve bir harita satın alındı, profil kaydı ve oyun içi görünüm doğrulandı; konsol hatası 0.
**Ses ve müzik:** `test.js` T28 (notalar belirlenimli ve duyulur aralıkta, ezgi 3. bölümde
açılır, tempo tavanlı, 5 haritanın ezgisi farklı), T29 (sıralayıcı her adımı bir kez ve sırayla
verir, arka plandan dönüşte nota yığmaz), T30 (ayar doğrulama/kayıt, efekt tablosu); `test-dom.js`
T5i (oyunda müzik notası kurulur, M her sesi kapatır ve kaydeder) — hepsi PASS. Headless
Chromium'da gerçek AudioContext ile müzik notaları sayıldı, 🎵 kapanınca yeni müzik notası
kurulmadı; düğme satırı 320/360/412/800 px genişlikte taşmadan sığıyor, konsol hatası 0.
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
**Güçlendirme ve devam:** `test.js` T33 (basamaklı satın alma, kurcalanmış/eski kayıt), T34
(kapasite 3, başlangıç kalkanı, güç süresi ×1,5, mıknatıs alanı), T35 (devam yalnız ölüyken, engel
temizliği, fiyat 15/30/60, en çok 3); `test-dom.js` T5g (teklif süresince ödül bekler, sonra bir
kez yazılır), T5j (düğme görünür, ödeme alınır, oyun sürer; yıldız yetmezse teklif çıkmaz) — PASS.
Pixel 7'de Güç sekmesi, satın alma, ölüm → ❤ Devam → oyunun sürmesi denendi; konsol hatası 0.
**Sonsuz mod:** `test.js` T8 (10. ve 20. bölüm sonunda oyun bitmez, eşik sayılır), T31 (sonsuz
zorluk eğrisi ilk eşikte başlar, 30. bölümde tavana oturur; en dar kapı top çapının 4 katından
geniş, sıçrama sınırı aynı), T32 (bot tavana ulaşıp 32. bölümü bitiriyor) — PASS. Bot ölçümü
(`--hedef 40`, tohum 1–4): 29, 34, 34. bölümde öldü, biri 41. bölüme ulaştı; yani tavan zor ama
geçilebilir, oyun gerçekten sonsuz ve bir noktada ustalık ister.
**Bölümler (2. adım):** `test.js` T7 (bölüm atlama), T8 (sonsuzluk; eskiden kazanma), T9 (yıldız → kalkan →
çarpma yutulur, aynı duvar ikinci kez öldürmez, kalkansız ölüm), T10 (hareketli kapı alan
içinde), T11 (sıçrama ≤ 150 px, öğeler doğru bölümde açılıyor), T12 (bot tohum 1'de ilk 10
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
