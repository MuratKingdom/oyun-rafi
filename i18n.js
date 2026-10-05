// Sekme Gücü (Bopgate) — dil desteği (Türkçe / İngilizce)
//
// Kaynak dil Türkçedir: kod metinleri Türkçe yazar ve L('Türkçe metin', { parametre }) ile gösterir.
// İngilizce seçiliyse EN sözlüğünde Türkçe metnin karşılığı aranır; yoksa Türkçe metin kalır
// (eksik çeviri oyunu bozmaz, testler sözlüğün eksiksiz olduğunu ayrıca denetler: T39).
// Parametreler {ad} biçimindedir: L('Bölüm {n}', { n: 3 }) → "Bölüm 3" / "Level 3".
// Dil seçimi: kayıtlı tercih ('bopgate-dil') yoksa cihaz dili; Türkçe değilse İngilizce.
// Tarayıcıda bütün betikler aynı genel kapsamı paylaşır; dosya kendi kapsamında çalışır.
(function () {

var STORAGE_KEY = 'bopgate-dil';
var LANGS = ['tr', 'en'];

var EN = {
  // Açılış, HUD, ekranlar
  'Basılı tut · yüksel · kapıdan geç': 'Hold · rise · slip through the gate',
  '▶  OYNA': '▶  PLAY',
  '{w} ve başla': '{w} to start',
  'Dokun': 'Tap',
  'Boşluk / dokun': 'Space / tap',
  'Dokun ya da R': 'Tap or R',
  'DURAKLATILDI': 'PAUSED',
  'MÜKEMMEL': 'PERFECT',
  'MÜKEMMEL x{n}': 'PERFECT x{n}',
  '{w} ve devam et': '{w} to resume',
  'OYUN BİTTİ': 'GAME OVER',
  'KAPI': 'GATES',
  '★ YENİ REKOR ★': '★ NEW BEST ★',
  'Rekor: {n}': 'Best: {n}',
  'Bölüm {n}': 'Level {n}',
  '{n} eşik': '{n} milestones',
  'Cüzdan ★ {n}': 'Wallet ★ {n}',
  '+{e} ★   (cüzdan ★ {c})': '+{e} ★   (wallet ★ {c})',
  '❤ Devam: {how} · aşağıda': '❤ Continue: {how} · below',
  '★ {n} ya da {ad}': '★ {n} or {ad}',
  'bedava': 'free',
  'reklamla': 'with an ad',
  '{w}: tekrar oyna': '{w}: play again',
  'BÖLÜM {n}': 'LEVEL {n}',
  'REKOR': 'BEST',
  'sessiz': 'muted',
  // Ölüm sebepleri (logic.js)
  'Dikene düştün': 'You landed on spikes',
  'Tavana çarptın': 'You hit the ceiling',
  'Duvara çarptın': 'You hit a wall',
  // Bölüm ipuçları ve kutlamalar
  'Yıldız topla: bir çarpmayı affeder': 'Grab stars: each one forgives a crash',
  'Mor kapılar hareket eder': 'Purple gates move',
  'Yeşil kapılar daralıp genişler': 'Green gates breathe in and out',
  'Güçler: ⏱ dünyayı yavaşlatır, pembe top küçültür': 'Power-ups: ⏱ slows the world, pink shrinks you',
  'Çift duvarlar geliyor': 'Double walls incoming',
  'Kırmızı dikenlere sekme: basılı tut, havada kal': "Don't bounce on red spikes: hold to stay airborne",
  'Eşik {n} geçildi! +{b} ★': 'Milestone {n} cleared! +{b} ★',
  ' · artık sonsuz: zorluk yavaşça artar': ' · endless now: difficulty slowly rises',
  'Devam!': 'Continue!',
  'Bu koşuda {n} devam hakkın kaldı': '{n} continues left this run',
  'Bu koşudaki son devam hakkı': 'Last continue this run',
  'Günlük ödül: +{n} ★': 'Daily reward: +{n} ★',
  '  ({n}. gün üst üste)': '  (day {n} in a row)',
  // Düğmeler
  '❤ ★ {n} · {s}': '❤ ★ {n} · {s}',
  '❤ Bedava · {s}': '❤ Free · {s}',
  '📺 Devam · {s}': '📺 Continue · {s}',
  '★ x2  +{n}': '★ x2  +{n}',
  '📺 ★ x2  +{n}': '📺 ★ x2  +{n}',
  '🛒 Mağaza': '🛒 Shop',
  '📋 Görevler': '📋 Quests',
  'Efekt sesleri: {d}': 'Sound effects: {d}',
  'Müzik: {d}': 'Music: {d}',
  'açık': 'on',
  'kapalı': 'off',
  'Müzik': 'Music',
  'Efekt sesleri': 'Sound effects',
  'Dil': 'Language',
  'Ayarlar': 'Settings',
  'Kolay mod': 'Easy mode',
  'Titreşim': 'Vibration',
  'Titreşim: {d}': 'Vibration: {d}',
  'Başlangıç paketi': 'Starter pack',
  '★ 400 + Kor ve Nane topları': '★ 400 + Ember and Mint balls',
  '🎁 Başlangıç paketi mağazada: ★ 400 + 2 top': '🎁 Starter pack in the shop: ★ 400 + 2 balls',
  '🏅 Başarımlar: {d}/{n}': '🏅 Achievements: {d}/{n}',
  'İlk kapını geç': 'Pass your first gate',
  '30. bölümü geç': 'Clear level 30',
  '{n} kez üst üste MÜKEMMEL geç': 'Hit {n} PERFECT gates in a row',
  'Toplam {n} kapı geç': 'Pass {n} gates in total',
  '{n} farklı gün günlük meydan okuma oyna': 'Play the daily challenge on {n} different days',
  '{n} topa sahip ol': 'Own {n} balls',
  'Büyük yazı': 'Large text',
  'Büyük yazı: {d}': 'Large text: {d}',
  'Duraklat': 'Pause',
  'Devam et': 'Resume',
  'Normal oyuna dön': 'Back to normal play',
  'Günlük meydan okuma: herkes aynı parkur, rekorunun hayaletiyle yarış': 'Daily challenge: same course for everyone, race your best run\'s ghost',
  'GÜNLÜK REKOR': 'DAILY BEST',
  '📅 Günün parkuru · rekorun {n}': '📅 Today\'s course · your best {n}',
  '📅 GÜNÜN REKORU!': '📅 NEW DAILY BEST!',
  'Günlük rekor: {n}': 'Daily best: {n}',
  'Kolay mod: {d}': 'Easy mode: {d}',
  'yavaş, geniş kapılar; ayrı rekor, ★ %60': 'slower, wider gates; separate best, ★ 60%',
  'Kolay mod açık': 'Easy mode on',
  'Basılı tut: yüksel · bırak: alçal': 'Hold: rise · release: drop',
  'Kolay mod kapalı': 'Easy mode off',
  '🐢 Kolay mod': '🐢 Easy mode',
  'KOLAY REKOR': 'EASY BEST',
  'BASILI TUT ↑': 'HOLD ↑',
  'BIRAK ↓': 'RELEASE ↓',
  'İYİ ✓': 'GOOD ✓',
  'Liderlik tablosu': 'Leaderboard',
  // index.html
  'Ekranın herhangi bir yerine basılı tut: yükseklik kazan': 'Hold anywhere on the screen to gain height',
  ' · Boşluk / ↑ · R: yeniden · M: ses · P: duraklat': ' · Space / ↑ · R: restart · M: sound · P: pause',
  'Mağaza': 'Shop',
  'Kapat': 'Close',
  'Top': 'Balls',
  'Harita': 'Maps',
  'Güç': 'Boosts',
  'Görevler': 'Quests',
  'Yıldız kazanmak için: oyunda yıldız topla, günlük görevleri bitir, her 10 bölümlük eşik +5.':
    'Earn stars by collecting them in game, finishing daily quests and every 10-level milestone (+5).',
  // Mağaza
  'Kuşanıldı': 'Equipped',
  'Kuşan': 'Equip',
  'Uygulamada': 'In app',
  'Sahipsin': 'Owned',
  '  · en iyi': '  · best value',
  'Satın alımları geri yükle': 'Restore purchases',
  'Tek seferlik satın alımlar; telefon değiştirince geri yüklenir. Yıldız ve görevler gerçek paradan bağımsızdır.':
    'One-time purchases; restored when you change phones. Stars and quests are independent of real money.',
  'Satın alma yalnız Android uygulamasında (Google Play). Tarayıcı sürümünde gerçek para yok.':
    'Purchases are only available in the Android app (Google Play). The browser version has no real money.',
  'Sıradaki: {d}': 'Next: {d}',
  '{d} (tam)': '{d} (maxed)',
  'Tam': 'Max',
  'Güçlendirmeler kalıcıdır ve bir sonraki koşudan itibaren geçerlidir. Ölünce ★ {c} ile devam edebilirsin (koşu başına en çok {m}, fiyat her seferinde ikiye katlanır).':
    'Boosts are permanent and apply from your next run. When you crash you can continue for ★ {c} (up to {m} per run, the price doubles each time).',
  // Görevler
  'Giriş serisi: {n} gün · yarın gelirsen +{r} ★': 'Login streak: {n} days · come back tomorrow for +{r} ★',
  'Her gün ilk açılışta yıldız kazanırsın.': 'You earn stars on your first visit every day.',
  'Görevler her gece yarısı yenilenir. Ödül görev bitince kendiliğinden eklenir.':
    'Quests refresh every midnight. Rewards are added automatically when a quest is done.',
  'Bir koşuda {n} yıldız topla': 'Collect {n} stars in one run',
  'Bir koşuda {n} kapı geç': 'Pass {n} gates in one run',
  '{n}. bölüme ulaş': 'Reach level {n}',
  'Bugün toplam {n} kapı geç': 'Pass {n} gates today',
  'Bugün {n} oyun oyna': 'Play {n} games today',
  'Kalkanla {n} çarpmadan kurtul': 'Survive {n} crashes with a shield',
  '{n} hareketli (mor) kapıdan geç': 'Pass {n} moving (purple) gates',
  '10. bölümü geç (ilk eşik)': 'Clear level 10 (first milestone)',
  '✓ {t}  +{r} ★': '✓ {t}  +{r} ★',
  // Ürün adları (shop.js)
  'Klasik': 'Classic', 'Kor': 'Ember', 'Nane': 'Mint', 'Küp': 'Cube', 'Elmas': 'Diamond', 'Yıldız': 'Star',
  'Gezegen': 'Planet', 'Alev': 'Flame', 'Kristal': 'Crystal',
  'Gece': 'Night', 'Gün Batımı': 'Sunset', 'Orman': 'Forest', 'Neon': 'Neon', 'Buz': 'Ice', 'Nebula': 'Nebula',
  'Kalkan kapasitesi': 'Shield capacity', 'Başlangıç kalkanı': 'Starting shield', 'Uzun güçler': 'Longer power-ups',
  'Yıldız mıknatısı': 'Star magnet',
  'Aynı anda en çok {v} kalkan': 'Up to {v} shields at once',
  'Her koşuya 1 kalkanla başla': 'Start every run with 1 shield',
  'Koşuya kalkansız başla': 'Start runs without a shield',
  'Güçler normal süre (4 / 6 sn)': 'Power-ups last the normal time (4 / 6 s)',
  'Güçler %{p} daha uzun': 'Power-ups last {p}% longer',
  'Yıldız ve güç normal alanda alınır': 'Stars and power-ups are picked up at normal range',
  'Yıldız ve güç {v} kat geniş alandan alınır': 'Stars and power-ups are picked up from {v}× range',
  // Gerçek parayla ürünler (monetize.js)
  'Reklamsız': 'No Ads',
  'Reklam izlemeden ödül: bedava devam ve ★ x2 anında': 'Rewards without watching ads: free continue and instant ★ x2',
  'Destekçi paketi': 'Supporter Pack',
  'Reklamsız + Alev topu + Nebula haritası + ★ 1000': 'No Ads + Flame ball + Nebula map + ★ 1000',
  'Güç paketi': 'Boost Pack',
  'Bütün güçlendirmeler son basamakta': 'Every boost at max level',
  'Alev topu': 'Flame ball',
  'Kristal topu': 'Crystal ball',
  'Nebula haritası': 'Nebula map',
  'Yalnız satın alınabilen top': 'Exclusive ball, purchase only',
  'Yalnız satın alınabilen harita, kendi müziğiyle': 'Exclusive map with its own music, purchase only'
};

function detect(storage, nav) {
  try {
    var saved = storage && storage.getItem(STORAGE_KEY);
    if (LANGS.indexOf(saved) >= 0) return saved;
  } catch (e) {}
  var l = (nav && (nav.language || (nav.languages && nav.languages[0]))) || '';
  return /^tr\b/i.test(l) ? 'tr' : 'en';
}

var lang = 'tr';
function setLang(l, storage) {
  if (LANGS.indexOf(l) < 0) return lang;
  lang = l;
  try { if (storage) storage.setItem(STORAGE_KEY, l); } catch (e) {}
  return lang;
}
function getLang() { return lang; }

function fmt(s, p) {
  return String(s).replace(/\{(\w+)\}/g, function (m, k) { return p && p[k] != null ? String(p[k]) : m; });
}
// İngilizcede karşılığı olmayan metinler burada birikir (T39 ve T5l eksik çeviriyi böyle yakalar)
var missing = {};
function L(s, p) {
  if (lang === 'en') {
    if (Object.prototype.hasOwnProperty.call(EN, s)) return fmt(EN[s], p);
    if (s) missing[s] = 1;
  }
  return fmt(s, p);
}

var I18n = { missing: missing, STORAGE_KEY: STORAGE_KEY, LANGS: LANGS, EN: EN, detect: detect, setLang: setLang, getLang: getLang, L: L, fmt: fmt };
if (typeof module !== 'undefined') module.exports = I18n;
if (typeof window !== 'undefined') {
  window.GameI18n = I18n;
  try { lang = detect(window.localStorage, window.navigator); } catch (e) {}
}
})();
