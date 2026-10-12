'use strict';
// Çark Vardiyası: saf oyun mantığı (DOM yok).
var COLS = 4, ROWS = 3, N = COLS * ROWS;
var WIN_TIME = 120, MIN_WORKING = 3, REPAIR_CD = 0.2, BREAK_FEE = 6;

function rnd(s) {
  s.rng = (s.rng + 0x6D2B79F5) | 0;
  var t = s.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function createState(seed) {
  var s = {
    status: 'playing', overReason: '', score: 0, time: 0, coins: 30, earned: 0,
    cursor: 0, cd: 0, seed: seed | 0, rng: seed | 0, repairs: 0, events: [], machines: []
  };
  for (var i = 0; i < N; i++) s.machines.push({ dur: 100, k: 0.6 + 0.8 * rnd(s) });
  return s;
}

function repairCost(m) {
  return (m.dur <= 0 ? BREAK_FEE : 0) + Math.ceil((100 - m.dur) * 0.05);
}

function working(s) {
  var c = 0;
  for (var i = 0; i < N; i++) if (s.machines[i].dur > 0) c++;
  return c;
}

function tryRepair(s) {
  var m = s.machines[s.cursor];
  if (s.cd > 0) return;
  if (m.dur > 95) { s.events.push('full'); return; }
  var cost = repairCost(m);
  if (s.coins < cost) { s.events.push('poor'); return; }
  s.coins -= cost;
  m.dur = 100;
  s.cd = REPAIR_CD;
  s.repairs++;
  s.events.push('repair');
}

function step(s, input, dt) {
  if (s.status !== 'playing') return s;
  s.events = [];
  s.time += dt;
  s.cd = Math.max(0, s.cd - dt);
  if (input.dx || input.dy) {
    var c = s.cursor % COLS, r = Math.floor(s.cursor / COLS);
    c = (c + (input.dx || 0) + COLS) % COLS;
    r = (r + (input.dy || 0) + ROWS) % ROWS;
    s.cursor = r * COLS + c;
    s.events.push('move');
  }
  if (typeof input.pick === 'number' && input.pick >= 0 && input.pick < N) {
    s.cursor = input.pick;
    tryRepair(s);
  } else if (input.repair) {
    tryRepair(s);
  }
  var wear = 3 + 0.04 * s.time;
  for (var i = 0; i < N; i++) {
    var m = s.machines[i];
    if (m.dur <= 0) continue;
    var gain = m.dur / 100 * dt;
    s.earned += gain;
    s.coins += gain;
    m.dur = Math.max(0, m.dur - wear * m.k * dt);
    if (m.dur === 0) s.events.push('break');
  }
  s.score = Math.floor(s.earned);
  if (working(s) < MIN_WORKING) {
    s.status = 'over';
    s.overReason = 'Çarklar durdu: ' + MIN_WORKING + ' makineden azı çalışıyor';
    s.events.push('over');
  } else if (s.time >= WIN_TIME) {
    s.status = 'won';
    s.events.push('won');
  }
  return s;
}

var GameLogic = { createState: createState, step: step, working: working, repairCost: repairCost, COLS: COLS, ROWS: ROWS, N: N, WIN_TIME: WIN_TIME };
if (typeof module !== 'undefined') module.exports = GameLogic;
if (typeof window !== 'undefined') window.GameLogic = GameLogic;
