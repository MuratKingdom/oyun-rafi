'use strict';
// Saf oyun mantığı: DOM yok, canvas yok. Rastgelelik seed'li PRNG'den gelir.
var C = {
  W: 900, H: 400, CX: 60, MUZZLE_Y: 8, G: 400, R: 6,
  ANG_MIN: 10, ANG_MAX: 80, ANG_RATE: 35,
  PW_MIN: 250, PW_MAX: 650, PW_RATE: 160,
  LEVELS: 10, NEXT_DELAY: 0.8, WALL_W: 16
};

function rand(s) {
  s.rng = (s.rng + 0x6D2B79F5) | 0;
  var t = s.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

function genLevel(s) {
  var lv = s.level;
  var w = Math.max(50, Math.round(112 - 6 * lv));
  s.target = { x: Math.round(380 + rand(s) * (820 - w - 380)), w: w };
  s.wind = lv >= 2 ? Math.round((rand(s) * 2 - 1) * Math.min(80, 15 * lv)) : 0;
  if (lv >= 3) {
    var wx = Math.round(C.CX + (s.target.x - C.CX) * 0.5);
    s.wall = { x: wx, w: C.WALL_W, h: Math.round(60 + rand(s) * 80) };
  } else {
    s.wall = null;
  }
}

function createState(seed) {
  var s = {
    status: 'playing', overReason: '', score: 0, level: 1, cleared: 0,
    phase: 'aim', angle: 45, power: 450, ball: null, trail: [],
    target: null, wall: null, wind: 0, timer: 0, time: 0, overTime: 0,
    lastPoints: 0, landX: 0, rng: seed | 0
  };
  genLevel(s);
  return s;
}

function lose(s, reason) {
  s.status = 'over';
  s.overReason = reason;
  s.overTime = 0;
}

function fire(s) {
  var a = s.angle * Math.PI / 180;
  s.ball = { x: C.CX, y: C.MUZZLE_Y, vx: s.power * Math.cos(a), vy: s.power * Math.sin(a) };
  s.trail = [];
  s.phase = 'flight';
}

function flight(s, dt) {
  var b = s.ball;
  var px = b.x, py = b.y;
  b.vx += s.wind * dt;
  b.vy -= C.G * dt;
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  if (s.trail.length < 400) s.trail.push([b.x, b.y]);
  var w = s.wall;
  if (w && b.x + C.R > w.x && b.x - C.R < w.x + w.w && b.y - C.R < w.h) {
    return lose(s, 'Duvara çarptın');
  }
  if (b.x > C.W + 20 || b.x < -20) return lose(s, 'Alanın dışına çıktın');
  if (b.y <= 0) {
    var k = py / (py - b.y);
    var xl = px + (b.x - px) * k;
    b.x = xl; b.y = 0;
    s.landX = xl;
    var t = s.target;
    if (xl >= t.x && xl <= t.x + t.w) {
      var off = Math.abs(xl - (t.x + t.w / 2)) / (t.w / 2);
      s.lastPoints = 100 + Math.round(50 * (1 - off));
      s.score += s.lastPoints;
      s.cleared++;
      if (s.cleared >= C.LEVELS) { s.status = 'won'; s.overTime = 0; return; }
      s.phase = 'result';
      s.timer = C.NEXT_DELAY;
    } else {
      lose(s, xl < t.x ? 'Hedefin önüne düştü' : 'Hedefi geçtin');
    }
  }
}

function step(s, input, dt) {
  if (s.status !== 'playing') { s.overTime += dt; return; }
  s.time += dt;
  if (s.phase === 'aim') {
    if (input.up) s.angle += C.ANG_RATE * dt;
    if (input.down) s.angle -= C.ANG_RATE * dt;
    if (input.right) s.power += C.PW_RATE * dt;
    if (input.left) s.power -= C.PW_RATE * dt;
    if (typeof input.angle === 'number') s.angle = input.angle;
    if (typeof input.power === 'number') s.power = input.power;
    s.angle = clamp(s.angle, C.ANG_MIN, C.ANG_MAX);
    s.power = clamp(s.power, C.PW_MIN, C.PW_MAX);
    if (input.action) fire(s);
  } else if (s.phase === 'flight') {
    flight(s, dt);
  } else if (s.phase === 'result') {
    s.timer -= dt;
    if (s.timer <= 0) {
      s.level++;
      genLevel(s);
      s.ball = null;
      s.trail = [];
      s.phase = 'aim';
    }
  }
}

if (typeof module !== 'undefined') module.exports = { createState: createState, step: step, C: C };
if (typeof window !== 'undefined') window.GameLogic = { createState: createState, step: step, C: C };
