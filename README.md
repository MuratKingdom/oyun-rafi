# 🕹️ Oyun Rafı

Gamer rutininin ürettiği küçük ama **bitmiş** tarayıcı oyunlarının rafı.
Ayda iki oyun; her biri kurulumsuz, sunucusuz, derlemesiz — tek dosya HTML.

**→ [Rafı aç: `index.html`](index.html)**

GitHub Pages açıksa raf doğrudan `https://muratkingdom.github.io/oyun-rafi/`
adresinde oynanır. Açık değilse: depoyu klonla, `index.html`'i tarayıcıda aç.

## Oyunlar

| Oyun | Kanat | Ne | Oyna | Kaynak |
|---|---|---|---|---|
| Yerçekimi Tüneli | arcade/fizik | Tek tuşla yerçekimini ters çevirip dar bir tünelde engellerden kaçıyorsun. | [`oyunlar/gravtunel/`](oyunlar/gravtunel/index.html) | [`oyun/gravtunel`](../../tree/oyun/gravtunel) |
| Son Kuyu | sandbox/inşa | 5×5 karede kolektör kurup kuyu inşa ederek tükenen suyu dengeliyorsun. | [`oyunlar/sonkuyu/`](oyunlar/sonkuyu/index.html) | [`oyun/sonkuyu`](../../tree/oyun/sonkuyu) |

Her oyunun ayrıntılı kaydı — ana mekanik, ne çalışıyor / ne eksik,
geliştirmek için ilk adım, doğrulama durumu — katalog issue'sundadır.

## Bu depo nasıl düzenlenmiş

- **`main`** — rafın kendisi. `index.html` (vitrin), `oyunlar/<ad>/index.html`
  (oynanabilir kopyalar), `tools/`, `.github/`.
- **`oyun/<ad>`** — her oyunun kendi dalı: kaynak dosyalar, testler, kendi
  README'si, LICENSE ve `oyun-tek-dosya.html` (tek dosya derlemesi).
- **[issue #2 — 🕹️ Katalog](../../issues/2)** — rutinin okuduğu kalıcı katalog.
  Aynı fikri iki kez kurmamak ve üst üste aynı türden oyun yapmamak için var.
- **[issue #1 — 🎮 Koşu raporları](../../issues/1)** — her koşunun arşivi.

`main`'deki oynanabilir kopyalar, oyun dallarındaki `oyun-tek-dosya.html`
dosyalarının birebir kopyalarıdır. Rutin yalnız dallara ve issue'lara yazar,
`main`'i hiç bilmez — bu yüzden kopyaların eskimesi gerçek bir risk.
`tools/raf-tazelik.sh` bunu denetler ve `.github/workflows/raf-tazelik.yml`
her `main` push'unda, ayrıca rutin koşularının ertesi günü (ayın 2'si ve 16'sı)
otomatik çalıştırır. Eskime sessiz kalmaz, CI'ı kırar.

Yeni bir oyun dalı eklendiğinde rafı güncellemek için:

```bash
git fetch origin '+refs/heads/oyun/*:refs/remotes/origin/oyun/*'
git show origin/oyun/<ad>:oyun-tek-dosya.html > oyunlar/<ad>/index.html
# sonra index.html'e oyunun kartını ekle
./tools/raf-tazelik.sh   # yeşil olmalı
```

## Dürüstlük notu

Oyunların hiçbiri bir insan tarafından uzun süre elle oynanarak test
edilmedi. Doğrulama, her oyunun kendi dalındaki mantık ve DOM testleriyle
(hepsi PASS, çıkış kodu 0) ve headless tarayıcıda açılış + girdi + ekran
görüntüsü kontrolleriyle yapıldı. Her oyunun README'si ve katalog satırı
"NE ÇALIŞIYOR" ile "NE EKSİK" bölümlerini ayrı ayrı listeler.

Tüm görseller Canvas ile, sesler WebAudio ile kod içinde üretilir. Dış varlık,
dış font, dış kütüphane yoktur.
