# Bopgate — Play Console formları için hazır cevaplar

Bu cevaplar oyunun koduna (4 Ekim 2026) ve Android paketindeki eklentilere (AdMob, Play Billing,
Play Games) göre hazırlandı. **Göndermeden önce bir kez gözden geçir**: Google'ın form sorularının
ifadesi zamanla değişebiliyor ve SDK'ların veri beyanını Google kendi belgelerinde güncelliyor
(AdMob: <https://developers.google.com/admob/android/privacy/play-data-disclosure>).

---

## 1. Uygulama içeriği → Gizlilik politikası
- Adres: `https://muratkingdom.github.io/oyun-rafi/gizlilik/bopgate.html`
  (raf PR'ıyla `main`'e konacak; depo için GitHub Pages açık olmalı — açık değilse
  Ayarlar → Pages → Branch: `main` / kök).
- İletişim adresi: `bopgate.destek@gmail.com` (sayfada ve Play Console → Mağaza ayarları → İletişim bilgileri'nde
  aynı adres; herkese açık görünür).

## 2. Reklamlar
- "Uygulamanız reklam içeriyor mu?" → **Evet** (AdMob ödüllü reklam).

## 3. Uygulama erişimi
- **Tüm işlevler özel erişim gerektirmeden kullanılabilir.** (Giriş yok; Play Games girişi isteğe bağlı.)

## 4. İçerik derecelendirme (IARC anketi)
- Kategori: **Oyun**
- Şiddet: **Yok** (soyut top ve duvarlar; "çarptın" yazısı dışında hasar/kan/karakter yok)
- Korku, cinsellik, küfür, uyuşturucu/alkol/tütün: **Yok**
- Kumar / simüle kumar: **Yok** — şans kutusu ya da rastgele ödül satışı **yok**; tüm ürünler içeriği belli tek seferlik alımlar
- Kullanıcılar arası etkileşim / sohbet / kullanıcı içeriği: **Yok**
  (liderlik tablosu yalnız Play Games skorlarını gösterir)
- Konum paylaşımı: **Yok**
- Dijital ürün satın alma: **Evet** (uygulama içi satın alma)
- Beklenen sonuç: **PEGI 3 / ESRB Everyone** (IARC kesin sonucu anket verir)

## 5. Hedef kitle ve içerik
- Hedef yaş grubu: **13–15, 16–17, 18+** (13 altı seçilmemeli: AdMob + uygulama içi satın almayla
  "Aileler" politikasının ek şartları devreye girer; gizlilik politikası da 13 altını hedeflemediğini söylüyor)
- "Uygulama çocukların ilgisini çekebilir mi?" → Görsel sade ve şiddetsiz olduğu için Google **evet** sayabilir;
  bu durumda reklamlar için yaşa uygun ayar istenir. Seçenekler:
  (a) AdMob'da etiketle: `tagForUnderAgeOfConsent` / maksimum reklam içerik derecesi **G** — `android-paket/bridge.js`'te
  tek satır, istersen eklerim; (b) yaş sorgusu ekranı. Önerim (a).

## 6. Veri güvenliği formu
**Toplanan veri var mı?** → **Evet** (üçüncü taraf SDK'lar topluyor; geliştirici sunucusu yok).
**Aktarımda şifreli mi?** → **Evet** (Google SDK'ları HTTPS kullanır).
**Kullanıcı veri silme isteyebilir mi?** → Geliştiricinin sakladığı veri yok; Play Games verisi Play Games
uygulamasından, reklam kimliği Android ayarlarından silinir. Formda "kullanıcılar verilerinin silinmesini
isteyebilir" seçilip yol olarak bu açıklama verilebilir.

| Veri türü | Toplanıyor | Paylaşılıyor | Amaç | Zorunlu mu | Kaynak |
|---|---|---|---|---|---|
| Cihaz veya diğer kimlikler (reklam kimliği) | Evet | Evet (reklam ağı) | Reklam, analiz, dolandırıcılık önleme | İsteğe bağlı (reklam izlenirse) | AdMob |
| Uygulama etkinliği → uygulama etkileşimleri | Evet | Evet | Reklam, analiz | İsteğe bağlı | AdMob |
| Uygulama bilgileri ve performans → kilitlenme / tanılama | Evet | Hayır | Analiz | Zorunlu | AdMob / Google Play hizmetleri |
| Yaklaşık konum | Evet (IP'den) | Evet | Reklam | İsteğe bağlı | AdMob |
| Uygulama etkinliği → oyun içi etkinlik (skor) | Evet | Hayır | Uygulama işlevi | İsteğe bağlı (Play Games girişiyle) | Play Games |
| Kişisel bilgiler → kullanıcı kimlikleri (Play Games profili) | Evet | Hayır | Uygulama işlevi | İsteğe bağlı | Play Games |
| Finansal bilgiler → satın alma geçmişi | Evet | Hayır | Uygulama işlevi | İsteğe bağlı | Play Billing |

Not: Ödeme bilgileri (kart vb.) Google Play'de kalır, uygulamaya gelmez; formda işaretlenmez.

## 7. Uygulama içi ürünler (Para kazanma → Ürünler → Uygulama içi ürünler)
Hepsi **tek seferlik, yönetilen (tüketilmeyen)** ürün. Kimlikler oyun koduyla birebir aynı olmalı:

| Ürün kimliği | Ad (EN / TR) | Önerilen fiyat |
|---|---|---|
| `bopgate.baslangic` | Starter Pack / Başlangıç paketi | ₺19,99 |
| `bopgate.reklamsiz` | No Ads / Reklamsız | ₺49,99 |
| `bopgate.destekci` | Supporter Pack / Destekçi paketi | ₺149,99 |
| `bopgate.ozellik.paket` | Boost Pack / Güç paketi | ₺99,99 |
| `bopgate.top.alev` | Flame ball / Alev topu | ₺29,99 |
| `bopgate.top.kristal` | Crystal ball / Kristal topu | ₺29,99 |
| `bopgate.harita.nebula` | Nebula map / Nebula haritası | ₺39,99 |

Açıklamalar `monetize.js` ve `i18n.js`'teki metinlerle aynı tutulmalı.

## 8. Yayın sırası (öneri)
1. Dahili test kanalı (yalnız sen + birkaç e-posta): AAB yükle, satın alma için lisans test hesabı ekle.
2. Telefonda: oyun, ödüllü reklam (test kimlikleriyle), satın alma (test kartı), liderlik, bulut kayıt.
3. Gerçek AdMob kimliklerini koy → kapalı test (Play'in yeni hesaplar için istediği 12 test kullanıcısı / 14 gün şartı
   hesabına uygulanıyorsa) → üretim.
