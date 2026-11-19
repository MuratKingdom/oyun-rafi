'use strict';
// Halka Dışı — saf oyun mantığı. DOM yok, canvas yok.
var C = {
  W: 480, H: 480, CX: 240, CY: 252, R: 200,
  P_R: 14, P_ACC: 560, DRAG: 1.8, DASH_V: 330, DASH_CD: 1.0,
  REST: 0.95, STUN_V: 110, STUN_T: 0.6, SPAWN_T: 1.2, WAVE_GAP: 1.0, WIN_WAVE: 8, DIE_T: 0.4, FALL_T: 0.4
};
var KINDS = {
  light:  { r: 11, m: 0.7, acc: 270 },
  normal: { r: 15, m: 1.2, acc: 240 },
  heavy:  { r: 21, m: 2.6, acc: 190 }
};

function rnd(s) { // mulberry32, durum state içinde
  s.rng = (s.rng + 0x6D2B79F5) | 0;
  var t = s.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function ev(s, type, data) { var e = data || {}; e.type = type; s.events.push(e); }

function createState(seed) {
  seed = (seed >>> 0) || 1;
  var s = {
    seed: seed, rng: seed | 0, status: 'playing', overReason: '', score: 0,
    wave: 0, time: 0, clearT: -1, dieT: 0, knocked: 0, nextId: 1,
    player: { x: C.CX, y: C.CY, vx: 0, vy: 0, r: C.P_R, m: 1, dashCd: 0, dashT: 0 },
    enemies: [], falling: [], events: []
  };
  startWave(s);
  return s;
}

function pickKind(s) {
  var w = s.wave, x = rnd(s);
  var pHeavy = Math.min(0.45, 0.06 * (w - 1));
  var pLight = Math.max(0.2, 0.5 - 0.04 * w);
  if (x < pHeavy) return 'heavy';
  if (x < pHeavy + pLight) return 'light';
  return 'normal';
}

function startWave(s) {
  s.wave += 1;
  s.clearT = -1;
  var n = Math.min(1 + s.wave, 7);
  for (var i = 0; i < n; i++) {
    var kind = pickKind(s), k = KINDS[kind], x = C.CX, y = C.CY;
    for (var tries = 0; tries < 30; tries++) {
      var a = rnd(s) * Math.PI * 2, rr = C.R * (0.5 + rnd(s) * 0.3);
      x = C.CX + Math.cos(a) * rr; y = C.CY + Math.sin(a) * rr;
      var ok = Math.hypot(x - s.player.x, y - s.player.y) > 90;
      for (var j = 0; ok && j < s.enemies.length; j++) {
        var o = s.enemies[j];
        if (Math.hypot(x - o.x, y - o.y) < k.r + o.r + 8) ok = false;
      }
      if (ok) break;
    }
    s.enemies.push({ id: s.nextId++, kind: kind, x: x, y: y, vx: 0, vy: 0,
      r: k.r, m: k.m, acc: k.acc, spawn: C.SPAWN_T, stun: 0 });
  }
  ev(s, 'wave', { wave: s.wave });
}

function damp(b, dt) { var f = Math.max(0, 1 - C.DRAG * dt); b.vx *= f; b.vy *= f; }

function collide(s, a, b) {
  var dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = a.r + b.r;
  if (d >= min || d === 0) return;
  var nx = dx / d, ny = dy / d, ov = min - d, ia = 1 / a.m, ib = 1 / b.m, tot = ia + ib;
  a.x -= nx * ov * ia / tot; a.y -= ny * ov * ia / tot;
  b.x += nx * ov * ib / tot; b.y += ny * ov * ib / tot;
  var rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (rv >= 0) return;
  var j = -(1 + C.REST) * rv / tot;
  a.vx -= j * ia * nx; a.vy -= j * ia * ny;
  b.vx += j * ib * nx; b.vy += j * ib * ny;
  if (-rv > C.STUN_V) { // sert darbe rakibi kısa süre sersemletir
    if (a.stun !== undefined) a.stun = C.STUN_T;
    if (b.stun !== undefined) b.stun = C.STUN_T;
  }
  if (-rv > 40) ev(s, 'hit', { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, power: -rv });
}

function distC(b) { return Math.hypot(b.x - C.CX, b.y - C.CY); }

function step(s, input, dt) {
  input = input || {};
  s.events = [];
  if (input.restart) return createState((Math.imul(s.seed, 1664525) + 1013904223) >>> 0);
  for (var f = s.falling.length - 1; f >= 0; f--) {
    var fb = s.falling[f]; fb.t += dt; fb.x += fb.vx * dt; fb.y += fb.vy * dt;
    if (fb.t >= C.FALL_T) s.falling.splice(f, 1);
  }
  if (s.status !== 'playing') { s.dieT = Math.min(C.DIE_T, s.dieT + dt); return s; }
  s.time += dt;
  var p = s.player;

  // oyuncu girdisi
  var ax = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  var ay = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  if (input.target) {
    var tx = input.target.x - p.x, ty = input.target.y - p.y, td = Math.hypot(tx, ty);
    if (td > 6) { ax = tx / td; ay = ty / td; }
  }
  var al = Math.hypot(ax, ay);
  if (al > 0) { ax /= al; ay /= al; }
  p.vx += ax * C.P_ACC * dt; p.vy += ay * C.P_ACC * dt;
  p.dashCd = Math.max(0, p.dashCd - dt); p.dashT = Math.max(0, p.dashT - dt);
  if (input.action && p.dashCd === 0) {
    var dx = ax, dy = ay;
    if (!al) {
      var sp = Math.hypot(p.vx, p.vy);
      if (sp > 1) { dx = p.vx / sp; dy = p.vy / sp; } else { dx = 0; dy = -1; }
    }
    p.vx += dx * C.DASH_V; p.vy += dy * C.DASH_V;
    p.dashCd = C.DASH_CD; p.dashT = 0.15;
    ev(s, 'dash');
  }
  damp(p, dt); p.x += p.vx * dt; p.y += p.vy * dt;

  // rakipler: oyuncuya doğru hızlanır, kenara yaklaşınca merkeze döner
  var active = [p], i, e;
  for (i = 0; i < s.enemies.length; i++) {
    e = s.enemies[i];
    if (e.spawn > 0) { e.spawn = Math.max(0, e.spawn - dt); continue; }
    if (e.stun > 0) { e.stun = Math.max(0, e.stun - dt); damp(e, dt); e.x += e.vx * dt; e.y += e.vy * dt; active.push(e); continue; }
    var ex = p.x - e.x, ey = p.y - e.y, ed = Math.hypot(ex, ey) || 1;
    ex /= ed; ey /= ed;
    var dc = distC(e);
    if (dc > C.R * 0.8) {
      var wgt = (dc - C.R * 0.8) / (C.R * 0.2) * 1.5;
      ex += (C.CX - e.x) / dc * wgt; ey += (C.CY - e.y) / dc * wgt;
      var el = Math.hypot(ex, ey) || 1; ex /= el; ey /= el;
    }
    e.vx += ex * e.acc * dt; e.vy += ey * e.acc * dt;
    damp(e, dt); e.x += e.vx * dt; e.y += e.vy * dt;
    active.push(e);
  }
  for (i = 0; i < active.length; i++)
    for (var k = i + 1; k < active.length; k++) collide(s, active[i], active[k]);

  // halka dışı kontrolü
  for (i = s.enemies.length - 1; i >= 0; i--) {
    e = s.enemies[i];
    if (distC(e) > C.R) {
      s.enemies.splice(i, 1);
      s.falling.push({ x: e.x, y: e.y, vx: e.vx, vy: e.vy, r: e.r, kind: e.kind, t: 0 });
      var pts = 10 * s.wave;
      s.score += pts; s.knocked += 1;
      ev(s, 'out', { x: e.x, y: e.y, pts: pts });
    }
  }
  if (distC(p) > C.R) {
    s.status = 'over';
    s.overReason = 'Halkanın dışına düştün (dalga ' + s.wave + ')';
    s.falling.push({ x: p.x, y: p.y, vx: p.vx, vy: p.vy, r: p.r, kind: 'player', t: 0 });
    ev(s, 'lose');
    return s;
  }

  // dalga temizlendi mi
  if (s.enemies.length === 0) {
    if (s.clearT < 0) {
      s.clearT = 0;
      s.score += 25 * s.wave;
      ev(s, 'clear', { wave: s.wave });
      if (s.wave >= C.WIN_WAVE) { s.status = 'won'; ev(s, 'win'); return s; }
    }
    s.clearT += dt;
    if (s.clearT >= C.WAVE_GAP) startWave(s);
  }
  return s;
}

var GameConst = C;
if (typeof module !== 'undefined') module.exports = { createState, step, C: GameConst };
if (typeof window !== 'undefined') window.GameLogic = { createState, step, C: GameConst };
