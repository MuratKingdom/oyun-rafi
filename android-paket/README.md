# Bopgate — Android paketi (Capacitor)

Sekme Gücü'nün (global adı **Bopgate**) Google Play için Android sarmalayıcısı.
Uygulama kimliği: **`com.cozulur.bopgate`** · Uygulama adı: **Bopgate**

Oyunun kendi dosyalarına (logic.js, main.js, render.js, shop.js …) dokunulmaz. Bu klasör
yalnızca oyunun tek dosyalık sürümünü (`oyun-tek-dosya.html`) alır, içine yerel köprüyü
(`bridge.js`) ekler ve Capacitor ile Android projesine koyar.

## İçerik

| Dosya / klasör | Ne işe yarar |
| --- | --- |
| `package.json` | Capacitor 8 + eklentiler (sürümler aşağıda) |
| `capacitor.config.json` | appId `com.cozulur.bopgate`, appName `Bopgate`, webDir `www` |
| `hazirla.js` | `www/index.html` üretir (aşağıya bakın) |
| `bridge.js` | `window.BopgateNative` — reklam, satın alma, Play Games köprüsü |
| `kopru-test.js` | Köprünün tarayıcıda (sahte eklentilerle) davranış testi |
| `ikon-uret.js` | Simge, açılış ekranı ve Play Store tanıtım görselini yordamsal üretir |
| `kaynak/` | Üretilen kaynak PNG'ler (1024 simge, 512 Play simgesi, uyarlanabilir ön/arka plan, açılış, 1024×500 tanıtım) |
| `android/` | `npx cap add android` ile üretilen yerel proje (derleme çıktıları hariç) |

## Eklentiler ve sürümler

| Amaç | Paket | Sürüm |
| --- | --- | --- |
| Çekirdek | `@capacitor/core`, `@capacitor/android`, `@capacitor/cli` | 8.5.2 |
| Ödüllü reklam | `@capacitor-community/admob` | 8.1.0 (GMA SDK 25.4.x) |
| Google Play Billing | `cordova-plugin-purchase` (CdvPurchase v13) | 13.18.0 (Billing Library 9.0.0) |
| Play Games (liderlik + kayıtlı oyun) | `@modbender/capacitor-play-games` | 0.5.0 (PGS v2 22.0.0) |

Notlar:
- npm'in güncel kararlı sürümü Capacitor **8** olduğu için 6/7 yerine 8 seçildi.
- `@openforge/capacitor-game-connect` yalnızca Capacitor 5'i destekliyor, kayıtlı oyun da yok;
  bu yüzden Capacitor 8 uyumlu ve kayıtlı oyun (snapshot) destekleyen
  `@modbender/capacitor-play-games` seçildi. Paket yeni ve tek bakımcılı (Eylül 2026) —
  riski aşağıdaki "Doğrulanmamış" bölümünde.
- Cordova eklentisi (`cordova-plugin-purchase`) Capacitor'da doğrudan çalışır; `cap sync` onu
  `android/capacitor-cordova-android-plugins` modülüne koyar.

## www/ nasıl hazırlanır

```bash
cd android-paket
npm install
node hazirla.js            # önce depo kökünde build-single.js'i çalıştırır
node hazirla.js --derleme-yok   # mevcut oyun-tek-dosya.html'i olduğu gibi kullan
```

`hazirla.js`:
1. Depo kökünde `node build-single.js` çalıştırır (oyun-tek-dosya.html güncel olsun diye).
2. `../oyun-tek-dosya.html` dosyasını `www/index.html` olarak kopyalar.
3. `bridge.js` içeriğini **satır içi** olarak, ilk oyun `<script>` etiketinden **önce**
   (`<script data-bopgate-kopru>` etiketiyle) ekler. Böylece `main.js` açılırken
   `window.BopgateNative` zaten vardır ve sayfa yine tek dosya kalır (ağ gerekmez).

`www/` git'e girmez; her derlemeden önce yeniden üretilir.

## Derleme

Gerekenler: Android Studio (güncel), Android SDK 36, JDK 21.

```bash
cd android-paket
npm install
node hazirla.js
npx cap sync android         # www/ ve eklentileri android/ içine kopyalar
npx cap open android         # Android Studio'da açar (Run ile cihaza yükle)

# Komut satırından Play için imzalı paket (AAB):
cd android
./gradlew bundleRelease      # çıktı: app/build/outputs/bundle/release/app-release.aab
```

Simgeleri yeniden üretmek için: `node ikon-uret.js` (Playwright + Chromium gerekir; yollar
`PLAYWRIGHT_CORE` ve `CHROMIUM_YOLU` ortam değişkenleriyle değiştirilebilir). Hem `kaynak/`
hem de `android/app/src/main/res/` (mipmap-*, drawable-*/splash.png) güncellenir.

## Gerçek AdMob kimlikleri nereye yazılır

Şu an yalnızca Google'ın resmi **test** kimlikleri var (gerçek reklam gösterilmez, hesap riski yok):

1. **Uygulama kimliği** → `android/app/src/main/res/values/strings.xml` → `admob_app_id`
   (test: `ca-app-pub-3940256099942544~3347511713`). AdMob > Uygulamalar > Uygulama ayarları'ndaki
   `ca-app-pub-…~…` değeriyle değiştirin.
2. **Ödüllü reklam birimi** → `bridge.js` başındaki `YAPILANDIRMA.admob.odulluReklamBirimi`
   (test: `ca-app-pub-3940256099942544/5224354917`). İsterseniz yerleşime göre ayrı birim:
   `yerlesimBirimleri.devam` / `yerlesimBirimleri.iki_kat`.
3. Aynı yerde `testModu: false` yapın.
4. AdMob'da "Gizlilik ve mesajlaşma" bölümünden GDPR (AB) onay mesajını oluşturun; köprü açılışta
   Google UMP onay formunu gerekirse gösterir (`onayFormu: true`).
5. Geliştirme sırasında kendi cihazınızda gerçek birim denerken cihazı test cihazı yapın
   (`testCihazlari`), aksi halde kendi reklamınıza tıklamak hesabı riske atar.

## Play Console: uygulama içi ürünler

Play Console > Bopgate > **Para kazanma > Ürünler > Uygulama içi ürünler**. Aşağıdakilerin
hepsini **tek seferlik (yönetilen, tüketilemeyen) ürün** olarak oluşturun, etkinleştirin ve fiyat verin:

| Ürün kimliği | Önerilen ad |
| --- | --- |
| `bopgate.reklamsiz` | Reklamsız |
| `bopgate.destekci` | Destekçi paketi |
| `bopgate.top.alev` | Alev topu |
| `bopgate.top.kristal` | Kristal topu |
| `bopgate.harita.nebula` | Nebula haritası |
| `bopgate.ozellik.paket` | Özellik paketi |

- Ürünler, uygulamanın en az bir sürümü (dahili test kanalı yeterli) yüklendikten sonra
  oluşturulabilir; yayınlanmamış uygulamada fiyatlar boş dönebilir.
- **Lisans testi**: Play Console > Ayarlar > Lisans testi'ne test hesaplarını ekleyin; bu
  hesaplar gerçek ödeme yapmadan satın alabilir.
- Satın almalar köprüde onaylanır (acknowledge, `finish()`); onaylanmayan satın alma Google
  tarafından 3 gün içinde iade edilir.
- Sunucu tarafı makbuz doğrulaması **yok** (eklenti yerel makbuzu doğrulanmış sayar). Sahiplik
  `restore()` ile Play'den tekrar okunur. Hile riskini azaltmak için ileride bir doğrulama
  sunucusu `CdvPurchase.store.validator` ile eklenebilir.

## Play Games Services

1. Play Console > **Play Games Hizmetleri > Kurulum ve yönetim > Yapılandırma**: yeni oyun
   projesi oluşturun, Android kimlik bilgisi ekleyin (paket `com.cozulur.bopgate` ve
   **uygulama imzalama anahtarının SHA-1'i** — Play App Signing kullanılıyorsa Play Console >
   Uygulama bütünlüğü sayfasındaki SHA-1; yerel test için yükleme/debug anahtarının SHA-1'i de eklenmeli).
2. Yapılandırma sayfasındaki sayısal **Proje kimliğini** →
   `android/app/src/main/res/values/strings.xml` → `game_services_project_id`
   (şu an yer tutucu: `PLAY_GAMES_PROJECT_ID`).
3. **Liderlik tablosu** oluşturun (Skor biçimi: sayısal, Büyük olan iyidir). Kimliğini
   (`CgkI…` biçiminde) → `bridge.js` → `YAPILANDIRMA.games.liderlikTablosu`
   (şu an yer tutucu: `PLAY_CONSOLE_LEADERBOARD_ID`; yer tutucu kaldıkça skor gönderilmez,
   liderlik ekranı açılmaz — çağrılar sessizce boş döner).
4. **Kayıtlı oyunlar** özelliğini Play Games yapılandırmasında açın (Saved Games: Açık).
5. Test kullanıcılarını Play Games > Test ekleyin; yayınlamadan önce Play Games
   yapılandırmasını da "Yayınla" ile yayınlayın.

## İmza anahtarı (keystore)

- Yükleme anahtarını bir kez üretin (depo DIŞINDA saklayın):
  `keytool -genkeypair -v -keystore ~/bopgate-upload.jks -alias bopgate -keyalg RSA -keysize 2048 -validity 10000`
- `android/keystore.properties` dosyası oluşturun (bu dosya **git'e girmez**):

  ```properties
  storeFile=/tam/yol/bopgate-upload.jks
  storePassword=…
  keyAlias=bopgate
  keyPassword=…
  ```

  `app/build.gradle` bu dosya varsa release derlemesini onunla imzalar, yoksa imzasız bırakır.
- **Keystore (.jks/.keystore), keystore.properties ve parolalar ASLA depoya eklenmez.**
  `.gitignore` bunları dışlar; yine de commit öncesi `git status` ile kontrol edin.
  Anahtarı kaybetmemek için yedekleyin (parola yöneticisi / şifreli yedek). Play App Signing
  açık olduğunda kaybolan yükleme anahtarı Play Console'dan sıfırlatılabilir.

## Köprü sözleşmesi (`window.BopgateNative`)

```js
window.BopgateNative = {
  platform: 'android',
  iap: {
    products(ids)    // -> Promise<[{ id, price }]>   price: yerelleştirilmiş metin, ör. "₺49,99"
    buy(id)          // -> Promise<{ ok, id, reason?: 'iptal'|'hata' }>
    restore()        // -> Promise<string[]>  sahip olunan tek seferlik ürünler
  },
  ads: {
    rewarded(placement) // placement: 'devam' | 'iki_kat' -> Promise<{ rewarded }>
  },
  games: {
    signIn()            // -> Promise<boolean>
    submitScore(score)  // -> Promise<void>
    showLeaderboard()   // -> Promise<void>
    saveGame(json)      // -> Promise<boolean>
    loadGame()          // -> Promise<string|null>
  }
};
```

Davranış ayrıntıları:
- **Hiçbir çağrı reddedilmez (reject) ya da hata fırlatmaz**; her hata olumsuz sonuçla çözülür.
  Eklenti yoksa (ör. tarayıcıda) tüm çağrılar olumsuz/boş döner.
- `products(ids)`: Play'de fiyatı gelmeyen ürün listede yer almaz. Boş/geçersiz `ids` verilirse
  bilinen altı ürün sorgulanır.
- `buy(id)`: zaten sahipse `{ ok: true }`. Kullanıcı kapatırsa `reason: 'iptal'`. Bekleyen
  (geciken) ödemeler `reason: 'hata'` döner; ödeme sonradan tamamlanınca köprü
  `window` üzerinde `bopgate-satinalma` olayı yayar (`event.detail.id`) ve `restore()` ürünü döndürür.
  (Bu olay sözleşmeye **ek**tir; kullanmak zorunlu değil.)
- `ads.rewarded()`: aynı anda tek reklam; ikinci eşzamanlı çağrı hemen `{ rewarded: false }` döner.
  Reklam bittiğinde arka planda bir sonraki reklam yüklenir.
- `signIn()`: önce sessiz giriş, olmazsa etkileşimli Play Games girişi açar (kullanıcı dokunuşuyla
  çağrılması önerilir). `submitScore`/`saveGame`/`loadGame` yalnızca sessiz giriş dener,
  ekran açmaz. `showLeaderboard` gerekirse etkileşimli giriş açar.
- `saveGame`/`loadGame`: tek bir kayıtlı oyun (snapshot adı `bopgate-ilerleme`), çakışmada en son
  değiştirilen kazanır.

## Doğrulanmamış (bu ortamda yapılamadı)

- **APK/AAB derlemesi yapılmadı.** Bu ortamda Android SDK yok ve `dl.google.com` (Google Maven,
  SDK indirmeleri) erişilemez durumda; `./gradlew` hiç çalıştırılmadı. Gradle senkronu ve
  derleme Android Studio'da ilk kez denenecek.
- Eklentilerin birlikte derlenmesi: `@modbender/capacitor-play-games` kendi build.gradle'ında
  AGP 9.3 ve Kotlin 2.4.10, AdMob eklentisi Kotlin 2.2.20 istiyor; Capacitor şablonu AGP 8.13
  kullanıyor. Gradle "farklı sürüm" hatası verirse kök `android/build.gradle` içindeki
  `buildscript.dependencies`'e tek bir Kotlin eklentisi sürümü
  (`classpath 'org.jetbrains.kotlin:kotlin-gradle-plugin:<sürüm>'`) ekleyip
  `variables.gradle`'a `kotlin_version` tanımlamak gerekebilir.
- `game_services_project_id` yer tutucuyken Play Games SDK'nın açılışta nasıl davrandığı
  (sessiz başarısızlık mı, hata mı) cihazda denenmedi. İlk cihaz testinden önce gerçek proje
  kimliğini girmeniz önerilir.
- Gerçek cihazda reklam, satın alma ve Play Games akışları denenmedi. Köprü mantığı yalnızca
  tarayıcıda **sahte eklentilerle** test edildi (`node kopru-test.js`: fiyatlar, satın alma,
  iptal, geri yükleme, ödüllü/ödülsüz reklam, giriş, kayıt/yükleme, eklentisiz yumuşak hata).
- Eklenti API'leri npm paketlerindeki tür tanımlarından ve kaynak koddan okundu
  (AdMob `showRewardVideoAd` yalnızca ödülde çözülür, kapatma `onRewardedVideoAdDismissed`
  olayıyla yakalanır; CdvPurchase'ta kullanıcı iptali `order()` sonucunda `PAYMENT_CANCELLED` döner).
- Android 12+ sistem açılış ekranı ve uyarlanabilir simgenin maske içindeki görünümü cihazda
  görülmedi (PNG'ler üretildi ve göz ile kontrol edildi).

## GitHub Actions ile derleme (bilgisayarda Android Studio gerekmez)

`.github/workflows/bopgate-android.yml` her `oyun/sekmeguc` push'unda ve bu dala açılan her PR'da çalışır;
Actions sekmesinden elle de başlatılabilir ("Run workflow").

1. **Debug APK (telefonda deneme):** iş bitince çalışmanın sayfasında *Artifacts → bopgate-debug-apk*
   indirilir, zip açılır, `app-debug.apk` telefona aktarılıp kurulur (ilk seferde "bilinmeyen
   kaynaklardan yüklemeye izin ver" istenir). Reklamlar Google'ın test reklamlarıdır; satın alma
   debug sürümünde Play'den gelmez (Play Billing yalnız Play'den kurulan sürümde çalışır).
   Debug anahtarı Actions önbelleğinde tutulduğu için her APK aynı imzayla çıkar; yeni sürüm
   `adb install -r app-debug.apk` ile eskisinin üstüne kurulur, ilerleme silinmez. İş günlüğündeki
   "Debug imza parmak izi" satırı her derlemede aynı olmalı. Önbellek silinir ya da 7 gün kullanılmazsa
   yeni anahtar üretilir: o zaman bir kez `adb uninstall com.cozulur.bopgate` gerekir.
2. **İmzalı AAB (Play Console):** bir kez *upload key* oluşturulur ve GitHub'a sır olarak eklenir:
   ```
   keytool -genkeypair -v -keystore bopgate-upload.jks -alias bopgate -keyalg RSA -keysize 2048 -validity 10000
   base64 -w0 bopgate-upload.jks > ks.txt        # macOS: base64 -i bopgate-upload.jks -o ks.txt
   ```
   GitHub → depo → Settings → Secrets and variables → Actions → *New repository secret*:
   `BOPGATE_KEYSTORE_BASE64` (ks.txt içeriği), `BOPGATE_KEYSTORE_PASSWORD`, `BOPGATE_KEY_ALIAS` (`bopgate`),
   `BOPGATE_KEY_PASSWORD`. Sonraki çalışmada *bopgate-release-aab* eseri çıkar; Play Console → Test → Dahili test
   → Yeni sürüm → AAB yükle. **`.jks` dosyasını ve şifreleri yedekle; kimseye verme, depoya ve sohbete yazma.**
   Play App Signing açık olduğunda bu yalnız *yükleme* anahtarıdır; kaybolursa Play Console'dan sıfırlanabilir.
3. `versionCode` her çalışmada artar (`github.run_number`), `versionName` = `1.0.<numara>`.
