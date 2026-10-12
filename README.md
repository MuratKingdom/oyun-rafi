# Çark Vardiyası

**Kanat:** sandbox/inşa
**Tek cümle:** Aşınan 12 makineyi kasadaki parayla onararak 120 saniye boyunca çalışır tutuyorsun.

## Nasıl oynanır
**Tarayıcıda oyna (kurulumsuz):**
https://htmlpreview.github.io/?https://github.com/MuratKingdom/oyun-rafi/blob/oyun/carkvardiya/index.html
Bu, üçüncü taraf bir görüntüleyicidir; kurulum gerektirmez ama garanti edilmez ve bu link
tarayıcıda elle denenmemiştir.

**Yerelde oynamak istersen:** `oyun-rafi` deposunda `oyun/carkvardiya` dalını seç → Code →
Download ZIP (veya dalı klonla), `index.html` dosyasını herhangi bir modern tarayıcıda aç.
Tek dosya isteyen için `oyun-tek-dosya.html` tek başına çalışır. Kurulum, derleme, sunucu,
internet bağlantısı gerekmez.

## Kontroller
- Oklar / WASD: makine seç
- Boşluk / Enter / E: seçili makineyi onar
- Fare tıklaması / dokunuş: tıklanan makineyi seçer ve onarır
- R: yeniden başlat (kayıp ekranında boşluk veya tıklama da başlatır)
- M: sesi aç/kapat

## Ana mekanik, amaç ve kurallar
12 makine sürekli aşınır (dayanıklılık 100 → 0); aşınma hızı her makinede farklıdır ve zamanla artar.
Çalışan makine dayanıklılığıyla orantılı gelir üretir; gelir hem skora hem kasaya yazılır. Onarım
makineyi 100'e çıkarır ve eksik dayanıklılığa göre para harcar; tamamen bozulmuş makineyi onarmak ek 6 ücretlidir.
Aynı anda 3'ten az makine çalışırsa vardiya biter (sebep ekranda yazar). 120 saniye dayanırsan kazanırsın.
Skor toplam kazanılan gelirdir. En yüksek skor `localStorage`'da tutulur.

## NE ÇALIŞIYOR
- Aşınma, gelir, onarım maliyeti ve kasa (kanıt: T1, T3, T5c)
- Kayıp koşulu ve sebep gösterimi: boşta bırakılınca ~40 sn'de biter (kanıt: T2, W4)
- Bot 3 seed'de 120 sn'yi bitirip kazanıyor, kazanç erişilebilir (kanıt: T3)
- Temiz yeniden başlatma (kanıt: T4, T5d)
- Canvas çizim + skor/kasa/süre/rekor göstergesi (kanıt: T5b, W3)

## NE EKSİK / İSKELE
- İnsan oynanışına göre denge ayarlanmadı; bot (anında seçim) kazanıyor, insanın kazanıp kazanamayacağı bilinmiyor
- Ayrı mobil buton düzeni yok; tıklama/dokunuş makineyi seçip onarır, mobilde denenmedi
- Makine yükseltme/yeni bina yok, görsel çeşitlilik minimal
- Ses yalnızca basit tonlar

## Doğrulama durumu
node --check tüm JS dosyalarında çıkış 0; `node test.js` T1–T4 PASS; `node test-dom.js` T5a–T5d PASS.
Oynanabilirliği tarayıcıda elle doğrulanmadı; headless mantık ve yükleme testleri geçti.

## Varlıklar ve telif
Tüm görseller Canvas ile, sesler WebAudio ile kod içinde üretilmiştir. Dış varlık, dış font,
CDN bağımlılığı yoktur. Bu oyun hiçbir tescilli oyunun klonu değildir; onarım/aşınma dengesi
mekaniğinden esinlenilmiştir.

## Bilinen sınır
`file://` altında en yüksek skor kaydı bazı tarayıcılarda çalışmayabilir; oyun yine oynanır.

## Geliştirmek isteyen için ilk adım
`logic.js` içindeki `step()` fonksiyonunda `wear` formülünü (`3 + 0.04 * s.time`) ve `repairCost()` değerlerini değiştirip insan oynanışına göre dengele.
