'use strict';
// Ambar Hesabı — saf oyun mantığı. DOM yok, canvas yok.
// Tek kaynak (tahıl), sınırlı ambar kapasitesi. Hasat mevsiminde gelen fazlalık
// ancak yer varsa saklanır; kışın gelir yoktur. Her ambar kapasite verir ama bakım ister.

var C = {
  W: 480, H: 480,
  SEASON_T: 12,                 // saniye / mevsim
  SEASONS: ['İlkbahar', 'Yaz', 'Sonbahar', 'Kış'],
  INCOME: [4, 9, 2.5, 0],       // tahıl/sn, yıl çarpanıyla ölçeklenir
  EAT0: 3.0, EAT_STEP: 0.15,    // köy tüketimi/sn: EAT0 + EAT_STEP * (yıl-1)
  SILO_CAP: 30,                 // ambar başına kapasite
  SILO_COST: 14,                // yeni ambar maliyeti (tahıl)
  SILO_REFUND: 4,               // yıkınca geri gelen
  UPKEEP: 0.1,                 // ambar başına bakım/çürüme (tahıl/sn)
  MAX_SILO: 10, START_SILO: 1, START_GRAIN: 20,
  YEARS: 6,                     // 6 yıl dayanırsan kazanırsın
  FACTOR_MIN: 0.8, FACTOR_MAX: 1.2
};

function rng(s) { // mulberry32, durum state içinde
  s.rng = (s.rng + 0x6D2B79F5) >>> 0;
  var t = s.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function rollFactor(s) {
  var f = C.FACTOR_MIN + (C.FACTOR_MAX - C.FACTOR_MIN) * rng(s);
  return Math.round(f * 20) / 20; // 0.05 adım
}

function createState(seed) {
  var s = {
    seed: seed >>> 0, rng: seed >>> 0,
    status: 'playing', overReason: '',
    time: 0, year: 1, season: 0, seasonT: 0,
    grain: C.START_GRAIN, silos: C.START_SILO,
    factor: 1, nextFactor: 1,
    wasted: 0, score: 0, events: []
  };
  s.factor = 1; // ilk yıl adil başlangıç
  s.nextFactor = rollFactor(s);
  return s;
}

function capacity(s) { return s.silos * C.SILO_CAP; }
function eatRate(s) { return C.EAT0 + C.EAT_STEP * (s.year - 1); }
function incomeRate(s) { return C.INCOME[s.season] * s.factor; }
function netRate(s) { return incomeRate(s) - eatRate(s) - s.silos * C.UPKEEP; }

function build(s) {
  if (s.silos >= C.MAX_SILO) { s.events.push({ type: 'deny', why: 'Ambar yeri dolu' }); return false; }
  if (s.grain < C.SILO_COST) { s.events.push({ type: 'deny', why: 'Yetersiz tahıl' }); return false; }
  s.grain -= C.SILO_COST; s.silos++;
  s.events.push({ type: 'build', slot: s.silos - 1 });
  return true;
}

function demolish(s) {
  if (s.silos <= 1) { s.events.push({ type: 'deny', why: 'Son ambar yıkılamaz' }); return false; }
  s.silos--;
  s.grain += C.SILO_REFUND;
  var cap = capacity(s);
  if (s.grain > cap) { s.wasted += s.grain - cap; s.grain = cap; }
  s.events.push({ type: 'demolish', slot: s.silos });
  return true;
}

function step(prev, input, dt) {
  var s = prev;
  s.events = [];
  input = input || {};
  if (input.restart) {
    var n = createState((s.seed * 1664525 + 1013904223) >>> 0);
    n.events.push({ type: 'restart' });
    return n;
  }
  if (s.status !== 'playing') return s;

  if (input.action) build(s);
  if (input.demolish) demolish(s);

  s.time += dt; s.seasonT += dt;
  var inc = incomeRate(s) * dt;
  var out = (eatRate(s) + s.silos * C.UPKEEP) * dt;
  s.grain += inc - out;
  var cap = capacity(s);
  if (s.grain > cap) {
    var over = s.grain - cap;
    s.wasted += over; s.grain = cap;
    s.events.push({ type: 'spill', amount: over });
  }
  s.score = Math.floor(s.time);

  if (s.grain < 0) {
    s.grain = 0;
    s.status = 'over';
    s.overReason = 'Ambar boşaldı: köy ' + C.SEASONS[s.season].toLowerCase() + ' mevsiminde aç kaldı (yıl ' + s.year + ')';
    s.events.push({ type: 'lose' });
    return s;
  }

  if (s.seasonT >= C.SEASON_T) {
    s.seasonT -= C.SEASON_T;
    s.season++;
    if (s.season >= 4) {
      s.season = 0;
      if (s.year >= C.YEARS) {
        s.status = 'won';
        s.score = Math.floor(s.time) + Math.floor(s.grain);
        s.events.push({ type: 'win' });
        return s;
      }
      s.year++;
      s.factor = s.nextFactor;
      s.nextFactor = rollFactor(s);
      s.events.push({ type: 'year', year: s.year });
    } else {
      s.events.push({ type: 'season', season: s.season });
    }
  }
  return s;
}

var GameLogicExports = { C: C, createState: createState, step: step,
  capacity: capacity, eatRate: eatRate, incomeRate: incomeRate, netRate: netRate };
if (typeof module !== 'undefined') module.exports = GameLogicExports;
if (typeof window !== 'undefined') window.GameLogic = GameLogicExports;
