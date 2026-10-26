# Nöbet Ocağı

**Kanat:** sandbox/inşa
**Tek cümle:** Gündüz odun ve yiyecek toplayıp, geceleri tükenen stokla ateşi ve köyü sekiz gece boyunca ayakta tutuyorsun.

## Nasıl oynanır
**Tarayıcıda oyna (kurulumsuz):**
https://htmlpreview.github.io/?https://github.com/MuratKingdom/oyun-rafi/blob/oyun/nobetocagi/index.html
Bu, üçüncü taraf bir görüntüleyicidir; kurulum gerektirmez ama garanti edilmez ve bu link
tarayıcada elle denenmemiştir.

**Yerelde oynamak istersen:** `oyun-rafi` deposunda `oyun/nobetocagi` dalını seç → Code →
Download ZIP (veya dalı klonla), `index.html` dosyasını herhangi bir modern tarayıcıda aç.
Tek dosya isteyen için `oyun-tek-dosya.html` tek başına çalışır. Kurulum, derleme, sunucu,
internet bağlantısı gerekmez.

## Kontroller
- Sol ok / A / 1 → toplayıcı ormana gider (odun)
- Sağ ok / D / 2 → toplayıcı tarlaya gider (yiyecek)
- Boşluk / Enter → hedefi değiştir (bitiş ekranında 0,3 sn sonra yeniden başlat)
- Canvas'ın sol yarısına dokun → odun, sağ yarısına → yiyecek (bitiş ekranında yeniden başlat)
- R → yeniden başla · M → sesi aç/kapat

## Ana mekanik, amaç ve kurallar
Gündüz 20 sn sürer; tek toplayıcın aynı anda yalnızca bir yerde çalışır, yer değiştirmek 1 sn yürüme
kaybettirir. Stok en fazla 30'dur. Gece 12 sn sürer: ateş sürekli odun yakır (üstteki çizgi gecenin
gereksinimi; gece soğuğuna göre x1.00 / 1.15 / 1.30 gündüzden belliidir), odun biterse ateş söner.
Sabah yiyecek payı düşülür; yetmezse köy aç kalır. Gece sonunda ihtiyaç her gece artar.
Sekiz geceyi atlatırsan kazanırsın. Skor = tamamlanan gece × 10; rekor tarayıcıda saklanır.

## NE ÇALIŞIYOR
- Toplama, hedef değiştirme/yürüme gecikmesi, stok sınırı (kanıt: T1, T5c)
- Odun/yiyecek bitince iki ayrı kayıp sebebi ekranda: "Ateş söndü: odun bitti", "Yiyecek yetmedi: sabah aç kalındı" (kanıt: T2, T2b)
- Gereksinimi bilen bot 3 seed'de sekiz geceyi bitiriyor, yani kazanç erişilebilir (kanıt: T3)
- Tek tuşla temiz yeniden başlatma (kanıt: T4, T5d)
- Canvas çizimi, skor/rekor, stok çubukları, `M` ile ses kapatma (kanıt: T5b, grep W3, Chromium'da `file://` açılışı, konsol hatası 0)

## NE EKSİK / İSKELE
- İnsan oynanışına göre zorluk dengesi ayarlanmadı; bot payı 1 yiyecek farkla kazanıyor
- Ayrı mobil buton düzeni yok; sol/sağ yarı dokunuşu denenmedi
- Tek toplayıcı, tek bina; yükseltme veya yeni kaynak yok
- Görsel çeşitlilik minimal

## Doğrulama durumu
`node --check` tüm JS dosyalarında çıkış 0. `node test.js`: T1–T4 + T2b PASS (çıkış 0). `node test-dom.js`: T5a–T5d PASS (çıkış 0).
Ağ/`file://` ve telif taramaları: 0 eşleşme. Headless Chromium ile `file://` açıldı, ok tuşuyla hedef değişti, konsol hatası 0.
Oynanabilirliği tarayıcada elle doğrulanmadı; headless mantık ve yükleme testleri geçti.

## Varlıklar ve telif
Tüm görseller Canvas ile, sesler WebAudio ile kod içinde üretilmiştir. Dış varlık, dış font,
CDN bağımlılığı yoktur. Bu oyun hiçbir tescilli oyunun klonu değildir; gece-gündüz döngüsünde
stok tüketen üs fikrinden genel düzeyde esinlenilmiştir.

## Bilinen sınır
`file://` altında en yüksek skor kaydı bazı tarayıcılarda çalışmayabilir; oyun yine oynanır.

## Geliştirmek isteyen için ilk adım
`logic.js` içindeki `nightWood()` / `nightFood()` formüllerini ve `C` sabitlerini insan oynanışına göre dengele veya `step()`'e ikinci bir toplayıcı ekle.
