# Oyun Rafı — devam notu (handoff)

Hazırlanma: 3 Ekim 2026 · son güncelleme: 5 Ekim 2026. Bu dosya rafla ilgili işi yeni bir sohbet/oturumda kaldığı yerden sürdürmek
içindir. Önce bunu, sonra `README.md`'yi oku.

## Depo nasıl çalışıyor (kısa)

- `main` = raf: `index.html` (vitrin kartları), `oyunlar/<ad>/index.html` (oynanabilir kopyalar),
  `tools/raf-tazelik.sh`, `.github/workflows/raf-tazelik.yml`.
- `oyun/<ad>` = her oyunun kaynağı, testleri, README'si ve `oyun-tek-dosya.html` derlemesi.
  Oyun dallarında genel CI yok; testler yerelde koşturulur. İstisna: `oyun/sekmeguc`'ta
  `.github/workflows/bopgate-android.yml` (testler + Android APK derlemesi, aşağıda).
- Raftaki kopya ile dalın `oyun-tek-dosya.html`'i **bayt bayt aynı** olmalı. CI
  ("raf dallarla tutarlı mı") her `main` push'unda ve salı/cuma günleri kontrol eder; eskime CI'ı kırar.
- Oyun dalları `main`'in fetch refspec'ine girmez. Önce:
  `git fetch origin '+refs/heads/oyun/*:refs/remotes/origin/oyun/*'`

## Çalışma düzeni (bugüne kadar böyle yapıldı)

1. Özellik dalı `oyun/<ad>`'dan açılır (ör. `claude/sekmeguc-<konu>`), PR tabanı **`oyun/<ad>`**.
2. Yerelde: `node test.js`, `node test-dom.js`, gerekirse `node tools/kazanilabilirlik.js`
   → hepsi PASS. `node build-single.js` ile `oyun-tek-dosya.html` yeniden üretilir ve commit'lenir.
3. Headless Chromium ile açılış + ekran görüntüsü kontrolü (konsol hatası 0). Bu ortamda
   Playwright kurulu bir proje üzerinden `executablePath: '/opt/pw-browsers/chromium'` ile.
4. PR birleşince **ayrı bir PR** ile raf güncellenir (taban `main`):
   `git show origin/oyun/<ad>:oyun-tek-dosya.html > oyunlar/<ad>/index.html`,
   gerekiyorsa `index.html`'deki kart metni → `./tools/raf-tazelik.sh` "Raf taze." → PR → CI yeşil → birleştir.
5. Her iş için ayrı PR; commit'ler ve konuşma Türkçe.

## Raftaki oyunlar

| Oyun | Dal | Durum |
|---|---|---|
| Yerçekimi Tüneli | `oyun/gravtunel` | Rutin üretimi, dokunulmadı |
| Son Kuyu | `oyun/sonkuyu` | Rutin üretimi, dokunulmadı |
| **Sekme Gücü** (global ad: **Bopgate**) | `oyun/sekmeguc` | 2–5 Ekim'de elle geliştirildi (aşağıda) |
| Tohum Payı | `oyun/tohumpayi` | Rutin üretimi, dokunulmadı |
| Kayar Taş | `oyun/kayartas` | Rutin üretimi (5 Ekim), dokunulmadı; rafa 5 Ekim'de eklendi |

## Sekme Gücü — mevcut durum

Kaynak dosyalar (hepsi tarayıcıda ortak kapsamda çalıştığı için **her biri IIFE içinde**,
dışarıya yalnız `window.Game*` ve `module.exports` çıkar; yeni dosya da böyle yazılmalı ve
`test.js` T22'deki listeye eklenmeli):

| Dosya | Ne |
|---|---|
| `logic.js` | Saf, belirlenimli fizik ve dünya (tohumlu RNG). Bölümler, güçler, engeller, sonsuz mod, devam |
| `i18n.js` | Türkçe kaynak → İngilizce sözlük, `L(s, p)`, dil seçimi (`bopgate-dil`) |
| `shop.js` | Mağaza kataloğu (9 top, 6 harita; 2 top + 1 harita yalnız satın almayla), cüzdan, kalıcı güçlendirmeler, devam bedeli; her topun canlı efekti (`fx`) |
| `monetize.js` | 6 uygulama içi ürün, hak verme, ödüllü reklam kuralları (günde 5 ★ x2), sahte sağlayıcı |
| `cloud.js` | Play Games bulut kaydı için paketle/aç/birleştir (kazanım kaybolmaz, yıldız çift sayılmaz) |
| `quests.js` | Günlük 3 görev ve giriş serisi |
| `audio.js` | Ses ayarları, efekt tablosu, prosedürel müzik ve sıralayıcı |
| `render.js` | Yalnız çizim |
| `main.js` | Döngü, girdi, ses çalma, mağaza/görev arayüzü, devam ve reklam düğmeleri, ⚙ ayarlar, güvenli alan (çentik/çubuk) ölçümü |
| `build-single.js` | Betikleri `index.html`'e gömüp `oyun-tek-dosya.html` üretir (dosya listesi içinde) |
| `test.js` | T1–T40 (mantık, mağaza, görev, ses, sonsuzluk, güçlendirme, ekonomi hızı, para kazanma, dil, bulut) |
| `test-dom.js` | T5a–T5l (sahte DOM ile bağlantı testleri) |
| `android-paket/` | Capacitor 8 projesi (`com.cozulur.bopgate`), `bridge.js` (AdMob/Billing/Play Games köprüsü, yalnız test kimlikleri), `hazirla.js`, simgeler, README |
| `magaza/` | Play Store metinleri (TR/EN), gizlilik politikası, Play Console form cevapları, ekran görüntüleri |
| `.github/workflows/bopgate-android.yml` | Testler → debug APK (eser `bopgate-debug-apk`); imza sırları varsa imzalı AAB. Debug anahtarı Actions önbelleğinde sabit (SHA-256 `baacb2ae…`) |
| `tools/kazanilabilirlik.js` | İleriye bakan bot: `--kalkansiz`, `--guclu`, `--yukseklik N`, `--hedef N` |
| `tools/ekonomi.js` | Yıldız ekonomisi simülasyonu: oyuncu tipi başına ilk alım / güçlendirmeler / her şey günü |
| `docs/isim-arastirmasi.md` | Global isim araştırması ve karar |

Oyun özeti (2 Ekim itibarıyla, oyun-rafi #5–#19):
- Dikey telefon ekranına uyan uzun alan (540–1000 mantıksal yükseklik, fizik ölçekli).
- **Sonsuz**: her bölüm 8 kapı, her 10 bölüm bir eşik (+10 ★). 10. bölümden sonra zorluk 20 bölümde
  tavana çıkar (hız 340→380, en dar kapı 120→105, aralık 1,3→1,15 sn), 30. bölümden sonra sabit.
  Bot 29–41. bölümde ölüyor (tavan zor ama geçilebilir).
- Öğeler: 2+ yıldız/kalkan, 3+ hareketli kapı, 4+ nefes alan kapı, 5+ güçler (⏱ yavaşlatma, küçülme),
  6+ çift duvar, 7+ zemin dikeni.
- Mağaza (★): toplar (★ 25–600), haritalar (★ 150–450), **Güç** sekmesi (kalkan kapasitesi, başlangıç
  kalkanı, uzun güçler, yıldız mıknatısı; toplam ★ 2700). Ölünce 5 sn **❤ Devam** (★ 15/30/60, en çok 3).
- **Ekonomi (#21, 3 Ekim):** koşu ödülü = toplanan yıldız + eşik başına ★ 5; görev ödülleri ★ 3–15.
  Modelde orta oyuncu güçlendirmelere ~25, her şeye ~49 günde ulaşıyor (eskiden 6 gün). T36 korur.
- **Görsel (#23, 4 Ekim):** neon arcade: gradyan gök, perspektif zemin ızgarası, parlayan kapı ağızları,
  ışık kuyruğu, kapı halkası; BOPGATE logolu açılış, sonuç kartı, cam görünümlü mağaza. Işıma
  gerçek telefonda ölçülmedi (eski cihazda kare hızı riski).
- Günlük görevler + giriş serisi; harita başına prosedürel müzik; 🎵/🔊 düğmeleri, M tuşu.
- `localStorage` anahtarları: `sekmeguc-best`, `sekmeguc-profil`, `sekmeguc-gunluk`, `sekmeguc-ses`,
  `bopgate-dil` (hepsi bozuk/kurcalanmış veride güvenli varsayılana döner).
- **4 Ekim (#25–#29):** satın alma + ödüllü reklam altyapısı, TR/EN, liderlik + bulut kayıt (sunucusuz,
  Play Games), Play Store hazırlığı (`magaza/`), Android paketi ve CI'da APK derlemesi (#26).
- **5 Ekim (#30–#34):** APK Murat'ın telefonunda kuruldu ve ekran görüntüleriyle bakıldı:
  - #30 oyun alanı telefonun durum/gezinme çubuklarının altına taşıyordu → güvenli alan payı düşülüyor
    (telefonda doğrulandı).
  - #31 açılış ekranı (zıplayan top, ortalı düzen, "Dokun ve başla"), müzik/ses/dil tek ⚙ altında,
    yıldızı yetmeyen fiyatlar okunur.
  - #33 geçilen kapı parlar, kapının ortasından geçiş "MÜKEMMEL xN" serisi (yalnız görsel).
  - #34 her topa canlı efekt (kıvılcım, dönme, uydu, pırıltı…), haritalara iki katmanlı paralaks
    (ay, dağlar, çam sırası + ateş böcekleri, şehir silueti, kar, bulutsu).
  - #32 debug APK her derlemede aynı anahtarla imzalanıyor → telefona `adb install -r` ile
    üstüne kurulur, ilerleme silinmez.
- **5 Ekim öğleden sonra — panel değerlendirmesi ve iyileştirme (#36–#45):** 8 rol (tasarımcı, gamer, CFO,
  CTO, CEO, çocuk, orta yaş, yaşlı) 10 üzerinden puanladı (ortalama 5,4); açıklar kapatıldı:
  - #36 dikey telefonda büyük görünüm (topun arkasındaki şerit kırpılır, her şey ~%24 büyük; topun önündeki
    görüş aynı). Bot: kalkanlı 8/8 her yükseklikte; kalkansız 800'de 5/8 (540 ve 1000'de 6/8).
  - #37 ilk oyun rehberi (ilk 3 kapı geniş, "BASILI TUT ↑ / BIRAK ↓") ve kolay mod (⚙ → 🐢: %18 yavaş,
    %25 geniş kapı, ayrı rekor, liderliğe gitmez, ödül %60). T41.
  - #38 zayıf telefonda otomatik hafif çizim (kare 3 sn > 24 ms → ışıma/parçacık azalır, dpr ≤ 2). T5m.
  - #39 günlük meydan okuma (📅, günün tohumu herkes için aynı) ve en iyi koşunun hayaleti. T42.
  - #40 CI eylemleri (checkout/setup-node/setup-java) v5.
  - #41 mağaza metinleri ve 6'şar ekran görüntüsü yenilendi (günlük meydan okuma görüntüsü eklendi).
  - #42 ekranda ⏸ duraklat ve büyük yazı (⚙ → Aa). #45 titreşim ayrı kapatılır (⚙ → 📳).
  - #43 12 başarım (toplam ★143), Görevler sekmesinde. T43.
  - #44 Başlangıç paketi `bopgate.baslangic` (önerilen ₺19,99: ★400 + Kor + Nane); köprü listesine
    eklendi, T44 köprü/oyun ürün listesi eşitliğini korur. **Play Console'da artık 7 ürün.**
  - `localStorage` yeni anahtarlar: `bopgate-kolay`, `bopgate-kolay-best`, `bopgate-rehber`, `bopgate-hafif`,
    `bopgate-gunluk-meydan`, `bopgate-basarim`, `bopgate-buyuk-yazi`, `bopgate-titresim`, `bopgate-teklif`.

Doğrulama sınırı: debug APK telefonda açıldı, ekrana sığdığı görüldü; uzun süreli elle oynanış ve
denge insanla ayarlanmadı. Reklam/satın alma yalnız test kimlikleriyle, gerçek cihazda denenmedi.

Telefona kurma (Windows, PowerShell; `gh` ve `platform-tools` kurulu):
`gh run download <run_id> -R MuratKingdom/oyun-rafi -n bopgate-debug-apk; & "$env:USERPROFILE\platform-tools\adb.exe" install -r .\app-debug.apk`

## Bekleyen kararlar (Murat'ta)

- **Play Store adı — karar verildi (4 Ekim):** **Bopgate**, paket `com.cozulur.bopgate` (#22).
  Murat'ın elle yapacağı 4 kontrol bekliyor: Play Console'da paket adı, Play/App Store içi arama,
  USPTO/EUIPO/TÜRKPATENT "BOPGATE" (sınıf 9 ve 41), `bopgate.com` WHOIS. İkon henüz yok.
- **Para kazanma — karar verildi ve uygulandı (4 Ekim):** ücretli toplar/harita/özellikler, reklamı kapatan
  paket, yalnız ödüllü reklam. Kod hazır; gerçek kimlikler bekleniyor (aşağıda).
- **Murat'tan beklenenler (yayın için):**
  - ✅ (6 Ekim) İletişim e-postası `bopgate.destek@gmail.com` gizlilik sayfalarına yazıldı;
    GitHub Pages açıldı (`main` / kök) → `https://muratkingdom.github.io/oyun-rafi/gizlilik/bopgate.html`.
    Play Console → Mağaza ayarları → İletişim bilgileri'ne aynı adres girilecek.
  - GitHub Secrets'a 4 imza sırrı (`BOPGATE_KEYSTORE_BASE64`, `_KEYSTORE_PASSWORD`, `_KEY_ALIAS`,
    `_KEY_PASSWORD`) → CI imzalı AAB üretir.
  - ✅ (6 Ekim) AdMob hesabı onaylandı; uygulama `bopgate` ve ödüllü birim `odullu-devam` açıldı,
    kimlikler koda yazıldı (oyun dalı PR #48, `testModu: true`). Kalan: AdMob → Gizlilik ve
    mesajlaşma → GDPR mesajı (gizlilik adresiyle) ve Play yayınından sonra `app-ads.txt`.
  - Play Games proje ve liderlik kimlikleri;
    Play Console'da 7 ürünün girilmesi (`magaza/play-formlari.md` §7). Kimlikler `android-paket/bridge.js`
    YAPILANDIRMA bölümüne girilir (kimlik sır değildir, ama şifre/anahtar asla).

## Gamer rutini

- Rutin adı "Gamer" (claude.ai Routines). Takvim: haftada 2, pazartesi ve perşembe 09:07 UTC.
- Prompt metni 3 Ekim'de takvimle uyumlu hâle getirildi ("Her pazartesi ve perşembe … Haftada iki
  oyun"); değişen yalnız o cümle, geri okunarak doğrulandı.
- Rutin yalnız `oyun/<ad>` dallarına ve issue #1 / #2'ye yazar; rafı (`main`) güncellemek elle ya da
  bu tür bir oturumla yapılır.

## Olası sonraki işler

- Bopgate: kimlikler gelince dahili test kanalı (AAB) → satın alma/reklam/liderlik telefonda denemesi.
- Bopgate: ölçüm kararı (Murat): Play Console'un kendi raporları (kurulum, tutma, gelir; SDK gerekmez)
  yeterli mi, yoksa Firebase Analytics mi? İkincisi veri güvenliği formunu ve gizlilik metnini değiştirir.
- Bopgate: günlük meydan okuma için Play Games'te ayrı (günlük sıfırlanan) liderlik tablosu — kimliği gelince
  `bridge.js`'e eklenir.
- Bopgate: İngilizce öne çıkan görsel; AdMob maksimum reklam içerik derecesi G (`bridge.js`, tek satır);
  CI eylemlerinin Node 24 sürümlerine yükseltilmesi (uyarı veriyor, derlemeyi bozmuyor).
- Kayar Taş: dokunmatik düzen ve can sayacı (README'deki ilk adım).
- Diğer üç oyuna benzer cila (mobil dokunma, ses) — istenirse.

## Kurallar

- Hiçbir şifre, token veya anahtar dosyaya, commit'e ya da sohbete yazılmaz.
- `main`'e doğrudan push yok; her değişiklik PR ile.
- Raf PR'ı yalnız `./tools/raf-tazelik.sh` "Raf taze." derken açılır.
