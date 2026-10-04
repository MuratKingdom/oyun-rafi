# Oyun Rafı — devam notu (handoff)

Hazırlanma: 3 Ekim 2026 · son güncelleme: 4 Ekim 2026. Bu dosya rafla ilgili işi yeni bir sohbet/oturumda kaldığı yerden sürdürmek
içindir. Önce bunu, sonra `README.md`'yi oku.

## Depo nasıl çalışıyor (kısa)

- `main` = raf: `index.html` (vitrin kartları), `oyunlar/<ad>/index.html` (oynanabilir kopyalar),
  `tools/raf-tazelik.sh`, `.github/workflows/raf-tazelik.yml`.
- `oyun/<ad>` = her oyunun kaynağı, testleri, README'si ve `oyun-tek-dosya.html` derlemesi.
  Oyun dallarında CI yok; testler yerelde koşturulur.
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
| **Sekme Gücü** (global ad: **Bopgate**) | `oyun/sekmeguc` | 2–4 Ekim'de elle geliştirildi (aşağıda) |
| Tohum Payı | `oyun/tohumpayi` | Rutin üretimi, dokunulmadı |

## Sekme Gücü — mevcut durum

Kaynak dosyalar (hepsi tarayıcıda ortak kapsamda çalıştığı için **her biri IIFE içinde**,
dışarıya yalnız `window.Game*` ve `module.exports` çıkar; yeni dosya da böyle yazılmalı ve
`test.js` T22'deki listeye eklenmeli):

| Dosya | Ne |
|---|---|
| `logic.js` | Saf, belirlenimli fizik ve dünya (tohumlu RNG). Bölümler, güçler, engeller, sonsuz mod, devam |
| `shop.js` | Mağaza kataloğu (7 top, 5 harita), cüzdan, kalıcı güçlendirmeler, devam bedeli |
| `quests.js` | Günlük 3 görev ve giriş serisi |
| `audio.js` | Ses ayarları, efekt tablosu, prosedürel müzik ve sıralayıcı |
| `render.js` | Yalnız çizim |
| `main.js` | Döngü, girdi, ses çalma, mağaza/görev arayüzü, devam düğmesi |
| `build-single.js` | Betikleri `index.html`'e gömüp `oyun-tek-dosya.html` üretir (dosya listesi içinde) |
| `test.js` | T1–T36 (mantık, mağaza, görev, ses, sonsuzluk, güçlendirme, ekonomi hızı) |
| `test-dom.js` | T5a–T5j (sahte DOM ile bağlantı testleri) |
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
- `localStorage` anahtarları: `sekmeguc-best`, `sekmeguc-profil`, `sekmeguc-gunluk`, `sekmeguc-ses`
  (hepsi bozuk/kurcalanmış veride güvenli varsayılana döner).

Doğrulama sınırı: **gerçek telefonda elle oynanmadı.** Denge bot ve headless tarayıcıyla ölçüldü.

## Bekleyen kararlar (Murat'ta)

- **Play Store adı — karar verildi (4 Ekim):** **Bopgate**, paket `com.cozulur.bopgate` (#22).
  Murat'ın elle yapacağı 4 kontrol bekliyor: Play Console'da paket adı, Play/App Store içi arama,
  USPTO/EUIPO/TÜRKPATENT "BOPGATE" (sınıf 9 ve 41), `bopgate.com` WHOIS. İkon henüz yok.
- **Para kazanma — karar verildi (4 Ekim):** uygulama içi satın alma ile **ücretli toplar, haritalar,
  özellikler** ve **reklamı kapatan paket**; reklam türü yalnız **ödüllü reklam** (ara reklam ve banner
  yok). Uygulanmadı: sıradaki iş oyun içi altyapı (sahte sağlayıcıyla, testli), sonra Capacitor +
  Play Billing + AdMob paketi.

## Gamer rutini

- Rutin adı "Gamer" (claude.ai Routines). Takvim: haftada 2, pazartesi ve perşembe 09:07 UTC.
- Prompt metni 3 Ekim'de takvimle uyumlu hâle getirildi ("Her pazartesi ve perşembe … Haftada iki
  oyun"); değişen yalnız o cümle, geri okunarak doğrulandı.
- Rutin yalnız `oyun/<ad>` dallarına ve issue #1 / #2'ye yazar; rafı (`main`) güncellemek elle ya da
  bu tür bir oturumla yapılır.

## Olası sonraki işler

- Sekme Gücü / Bopgate: para kazanma altyapısı (ücretli ürünler, reklamı kapatan paket, ödüllü reklam);
  Capacitor paketi (`com.cozulur.bopgate`); ikon; gerçek cihazda elle deneme (denge + neon kare hızı).
- Diğer üç oyuna benzer cila (mobil dokunma, ses) — istenirse.

## Kurallar

- Hiçbir şifre, token veya anahtar dosyaya, commit'e ya da sohbete yazılmaz.
- `main`'e doğrudan push yok; her değişiklik PR ile.
- Raf PR'ı yalnız `./tools/raf-tazelik.sh` "Raf taze." derken açılır.
