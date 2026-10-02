// Sekme Gücü — ses ve müzik: ayarlar, efekt tablosu, prosedürel müzik (saf mantık; WebAudio yok)
//
// Müzik dosya değildir: her harita kendi tonu ve dizisiyle 4 ölçülük bir döngü çalar
// (bas + arpej + ezgi). Ezgi harita adından belirlenimli üretilir; tempo bölümle hızlanır.
// Çalma işini main.js yapar; burada yalnız "hangi nota, ne zaman" hesaplanır ki test edilebilsin.
// Tarayıcıda bütün betikler aynı genel kapsamı paylaşır; aynı adlı değişken ve
// fonksiyonlar birbirini ezmesin diye dosya kendi kapsamında çalışır. Dışarıya yalnız
// window.Game* ve module.exports çıkar.
(function () {

var SETTINGS_KEY = 'sekmeguc-ses';
var STEPS_PER_BAR = 16;
var BARS = 4;
var BPM0 = 100;
var BPM_STEP = 4;
var BPM_MAX = 136;

// --- Ayarlar ---------------------------------------------------------------
function defaults() { return { music: true, sfx: true }; }
function sanitize(raw) {
  var s = defaults();
  if (raw && typeof raw === 'object') {
    if (raw.music === false) s.music = false;
    if (raw.sfx === false) s.sfx = false;
  }
  return s;
}
function load(storage) {
  try {
    var t = storage && storage.getItem(SETTINGS_KEY);
    return sanitize(t ? JSON.parse(t) : null);
  } catch (e) { return defaults(); }
}
function save(storage, s) {
  try { if (storage) storage.setItem(SETTINGS_KEY, JSON.stringify(sanitize(s))); } catch (e) {}
}

// --- Nota yardımcıları -----------------------------------------------------
function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

var MINOR = [0, 2, 3, 5, 7, 8, 10];
var MAJOR = [0, 2, 4, 5, 7, 9, 11];
var DORIAN = [0, 2, 3, 5, 7, 9, 10];
var PENTA = [0, 2, 4, 7, 9, 12, 14];

// Harita → ton (MIDI kök), dizi, akor dizisi (dizi derecesi), dalga biçimi
var TUNES = {
  gece: { root: 57, scale: MINOR, prog: [0, 5, 2, 6], lead: 'triangle' },      // La minör
  gunbatimi: { root: 60, scale: MAJOR, prog: [0, 4, 5, 3], lead: 'sine' },     // Do majör
  orman: { root: 62, scale: DORIAN, prog: [0, 3, 0, 4], lead: 'triangle' },    // Re dorian
  neon: { root: 55, scale: MINOR, prog: [0, 6, 5, 4], lead: 'square' },        // Sol minör
  buz: { root: 64, scale: PENTA, prog: [0, 3, 4, 2], lead: 'sine' }            // Mi pentatonik
};

function tune(mapId) { return TUNES[mapId] || TUNES.gece; }

function hash(str) {
  var h = 2166136261;
  for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// Dizi derecesinden MIDI (oktav taşmalarını sarar)
function degree(t, d, octave) {
  var n = t.scale.length;
  var o = Math.floor(d / n);
  var i = ((d % n) + n) % n;
  return t.root + t.scale[i] + 12 * (o + (octave || 0));
}

function bpm(level) {
  return Math.min(BPM_MAX, BPM0 + BPM_STEP * Math.max(0, (level || 1) - 1));
}
function stepDur(level) { return 60 / bpm(level) / 4; } // 16'lık nota süresi (sn)

// Bir ölçünün notaları: [{ step, ch: 'bass'|'arp'|'lead', freq, len (adım), type }]
// level ilerledikçe katmanlar eklenir: 1–2 bas+arpej, 3+ ezgi, 6+ bas sekizliğe çıkar.
function bar(mapId, barIndex, level) {
  var t = tune(mapId);
  var chord = t.prog[((barIndex % BARS) + BARS) % BARS];
  var notes = [];
  var bassEvery = level >= 6 ? 2 : 4;
  for (var s = 0; s < STEPS_PER_BAR; s += bassEvery) {
    var bd = chord + ((s / bassEvery) % 2 === 1 && bassEvery === 4 ? 4 : 0);
    notes.push({ step: s, ch: 'bass', freq: midiToFreq(degree(t, bd, -2)), len: bassEvery === 2 ? 1.5 : 3, type: 'triangle' });
  }
  var arp = [0, 2, 4, 2];
  for (var a = 0; a < STEPS_PER_BAR; a += 2) {
    notes.push({ step: a, ch: 'arp', freq: midiToFreq(degree(t, chord + arp[(a / 2) % 4], 0)), len: 1, type: 'square' });
  }
  if (level >= 3) {
    // Ezgi: harita + ölçüden belirlenimli; akor tonlarına yakın, ara sıra sus
    var h = hash(mapId + ':' + (((barIndex % BARS) + BARS) % BARS));
    for (var m = 0; m < STEPS_PER_BAR; m += 4) {
      h = (Math.imul(h, 1103515245) + 12345) >>> 0;
      if ((h >>> 8) % 5 === 0) continue;
      var off = [0, 2, 4, 5, 7][(h >>> 12) % 5];
      notes.push({ step: m + ((h >>> 20) % 2) * 2, ch: 'lead', freq: midiToFreq(degree(t, chord + off, 1)), len: 2, type: t.lead });
    }
  }
  notes.sort(function (x, y) { return x.step - y.step; });
  return notes;
}

// İleriye bakan sıralayıcı: her çağrıda [now, now + horizon) aralığına düşen adımları
// play(note, time) ile bir kez verir. Tempo değişirse sonraki adımdan itibaren uygulanır.
function createSequencer(startTime) {
  return { next: startTime || 0, step: 0, bar: 0 };
}
function pump(seq, now, horizon, mapId, level, play) {
  if (seq.next < now - 0.25) seq.next = now; // sekme arkaplandaydı: geri kalanı atla
  var count = 0;
  while (seq.next < now + horizon && count < 64) {
    var notes = bar(mapId, seq.bar, level);
    var sd = stepDur(level);
    for (var i = 0; i < notes.length; i++) {
      if (notes[i].step === seq.step) play(notes[i], seq.next, notes[i].len * sd);
    }
    seq.next += sd;
    seq.step++;
    if (seq.step >= STEPS_PER_BAR) { seq.step = 0; seq.bar = (seq.bar + 1) % BARS; }
    count++;
  }
  return count;
}

// --- Efektler -------------------------------------------------------------
// Her efekt notalar dizisi: { f: Hz, d: sn, at: başlangıç gecikmesi, type, to?: Hz (kayma) }
var SFX = {
  bounce: [{ f: 180, to: 120, d: 0.07, at: 0, type: 'square' }],
  gate: [{ f: 660, d: 0.08, at: 0, type: 'sine' }],
  star: [{ f: 990, d: 0.07, at: 0, type: 'triangle' }, { f: 1320, d: 0.09, at: 0.06, type: 'triangle' }],
  slow: [{ f: 880, to: 330, d: 0.28, at: 0, type: 'sine' }],
  small: [{ f: 600, to: 1500, d: 0.2, at: 0, type: 'sine' }],
  shield: [{ f: 300, to: 180, d: 0.14, at: 0, type: 'square' }],
  level: [{ f: 523, d: 0.08, at: 0, type: 'sine' }, { f: 784, d: 0.12, at: 0.08, type: 'sine' }],
  win: [{ f: 523, d: 0.1, at: 0, type: 'sine' }, { f: 659, d: 0.1, at: 0.1, type: 'sine' }, { f: 784, d: 0.1, at: 0.2, type: 'sine' }, { f: 1046, d: 0.3, at: 0.3, type: 'triangle' }],
  over: [{ f: 220, to: 70, d: 0.4, at: 0, type: 'sawtooth' }],
  buy: [{ f: 880, d: 0.06, at: 0, type: 'triangle' }, { f: 1175, d: 0.08, at: 0.05, type: 'triangle' }],
  quest: [{ f: 784, d: 0.1, at: 0, type: 'triangle' }, { f: 1046, d: 0.14, at: 0.09, type: 'triangle' }]
};

// Kapı sesi skorla hafifçe yükselir (tavanlı)
function gateFreq(score) { return 660 + Math.min(score, 30) * 12; }

var AudioAPI = {
  SETTINGS_KEY: SETTINGS_KEY, STEPS_PER_BAR: STEPS_PER_BAR, BARS: BARS, BPM_MAX: BPM_MAX,
  defaults: defaults, sanitize: sanitize, load: load, save: save,
  midiToFreq: midiToFreq, tune: tune, TUNES: TUNES, bpm: bpm, stepDur: stepDur, bar: bar,
  createSequencer: createSequencer, pump: pump, SFX: SFX, gateFreq: gateFreq
};
if (typeof module !== 'undefined') module.exports = AudioAPI;
if (typeof window !== 'undefined') window.GameAudio = AudioAPI;
})();
