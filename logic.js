'use strict';
// Sarkaç Atlayışı — saf oyun mantığı (DOM yok, canvas yok).
var W = 800, H = 500;
var G = 900;            // yerçekimi (px/s^2)
var L = 130;            // ip uzunluğu
var PIVOT = { x: 200, y: 90 };
var R = 10;             // top yarıçapı
var START_ANGLE = -1.1; // başlangıç sapması (rad)
var LEVEL_TIME = 8;     // her seviyede süre (sn)
var PLAT_H = 14;

function mulberry32(a) {
  a = (a + 0x6D2B79F5) | 0;
  var t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return { v: ((t ^ (t >>> 14)) >>> 0) / 4294967296, next: a };
}

function rand(s) {
  var r = mulberry32(s.rs);
  s.rs = r.next;
  return r.v;
}

function genPlatform(s) {
  var lvl = s.score;
  var w = Math.max(44, 120 - lvl * 5);
  var x = 270 + rand(s) * (110 + Math.min(lvl, 12) * 8);
  var y = 270 + rand(s) * 130;
  s.plat = { x: x, y: y, w: w, h: PLAT_H };
}

function attach(s) {
  s.mode = 'swing';
  s.theta = START_ANGLE;
  s.omega = 0;
  s.timeLeft = LEVEL_TIME;
  s.ball.x = PIVOT.x + L * Math.sin(s.theta);
  s.ball.y = PIVOT.y + L * Math.cos(s.theta);
  s.ball.vx = 0;
  s.ball.vy = 0;
}

function createState(seed) {
  var s = {
    seed: seed,
    rs: seed | 0,
    status: 'playing',
    overReason: '',
    score: 0,
    time: 0,
    mode: 'swing',
    theta: START_ANGLE,
    omega: 0,
    timeLeft: LEVEL_TIME,
    prevAction: false,
    ball: { x: 0, y: 0, vx: 0, vy: 0 },
    plat: null,
    events: []
  };
  genPlatform(s);
  attach(s);
  return s;
}

function lose(s, reason) {
  s.status = 'over';
  s.overReason = reason;
  s.events.push('lose');
}

function land(s) {
  var p = s.plat;
  var center = p.x + p.w / 2;
  var off = Math.abs(s.ball.x - center) / (p.w / 2);
  var gain = off < 0.3 ? 2 : 1;
  s.score += gain;
  s.events.push(gain === 2 ? 'perfect' : 'land');
  genPlatform(s);
  attach(s);
}

function step(s, input, dt) {
  if (s.status !== 'playing') return s;
  s.time += dt;
  var press = !!input.action && !s.prevAction;
  s.prevAction = !!input.action;
  var b = s.ball;
  if (s.mode === 'swing') {
    s.timeLeft -= dt;
    var sub = 2, h = dt / sub;
    for (var i = 0; i < sub; i++) {
      s.omega += (-(G / L) * Math.sin(s.theta)) * h;
      s.theta += s.omega * h;
    }
    b.x = PIVOT.x + L * Math.sin(s.theta);
    b.y = PIVOT.y + L * Math.cos(s.theta);
    if (press) {
      b.vx = L * s.omega * Math.cos(s.theta);
      b.vy = -L * s.omega * Math.sin(s.theta);
      s.mode = 'fly';
      s.events.push('release');
    } else if (s.timeLeft <= 0) {
      lose(s, 'Süre doldu');
    }
    return s;
  }
  // uçuş
  var py = b.y;
  b.vy += G * dt;
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  var p = s.plat;
  var left = p.x - R * 0.5, right = p.x + p.w + R * 0.5;
  if (b.vy > 0 && py + R <= p.y && b.y + R >= p.y && b.x >= left && b.x <= right) {
    b.y = p.y - R;
    land(s);
    return s;
  }
  if (b.y + R > p.y && b.y - R < p.y + p.h && b.x + R > p.x && b.x - R < p.x + p.w) {
    lose(s, 'Platforma yandan çarptın');
    return s;
  }
  if (b.y - R > H + 20) lose(s, 'Boşluğa düştün');
  else if (b.x > W + 40 || b.x < -40) lose(s, 'Alanın dışına çıktın');
  return s;
}

if (typeof module !== 'undefined') module.exports = { createState: createState, step: step };
if (typeof window !== 'undefined') window.GameLogic = { createState: createState, step: step };
