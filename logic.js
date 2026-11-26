// Kanca Tırmanışı — saf oyun mantığı (DOM yok, canvas yok)
'use strict';

const C = {
  W: 360, H: 640,
  R: 9,              // oyuncu yarıçapı
  G: 900,            // yerçekimi px/s^2
  PULL: 1500,        // kanca çekiş ivmesi
  RANGE: 240,        // kanca menzili
  SNAP: 14,          // bu mesafede kancaya asılı kalır
  BREAK: 1.1,        // çapa bu kadar saniye yük taşırsa kırılır
  AIR: 520,          // havada yatay kontrol ivmesi
  MAXV: 900,         // hız tavanı
  FOG0: 26,          // sis başlangıç hızı px/s
  FOG_K: 0.03,       // yükseklik başına sis hızlanması
  FOG_MAX: 150,
  FOG_LEAD: 60,      // sis ekranın altından en fazla bu kadar aşağıda bekler
  WIN_H: 10000,      // 1000 m = kazanma
};

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// PRNG durumu state içinde sayı olarak tutulur (JSON ile karşılaştırılabilir)
function rnd(s) {
  s.rng = (s.rng + 0x6D2B79F5) | 0;
  let t = s.rng;
  t = Math.imul(t ^ (t >>> 15), 1 | t);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function createState(seed) {
  seed = (seed >>> 0) || 1;
  const s = {
    seed: seed,
    rng: (mulberry32(seed)() * 4294967296) | 0,
    status: 'playing',
    overReason: '',
    started: false,
    time: 0,
    px: C.W / 2, py: -C.R, vx: 0, vy: 0,
    hook: -1,          // takılı çapa indeksi
    hanging: false,
    prevAction: false,
    anchors: [],       // {x, y, wear, broken}
    topY: 0,           // üretilmiş en üst sıra
    lastX: C.W / 2,
    camY: -C.H * 0.7,
    fogY: 300,
    maxH: 0,
    score: 0,
    events: [],
  };
  genAnchors(s);
  return s;
}

function rowGap(h) { return 75 + Math.min(70, h / 60); }

function genAnchors(s) {
  while (s.topY > s.camY - C.H) {
    const h = -s.topY;
    s.topY -= rowGap(h);
    let x = s.lastX + (rnd(s) * 2 - 1) * 150;
    x = Math.max(30, Math.min(C.W - 30, x));
    s.anchors.push({ x: Math.round(x), y: Math.round(s.topY), wear: 0, broken: false });
    s.lastX = x;
    const second = rnd(s) < Math.max(0.15, 0.6 - h / 8000);
    if (second) {
      const x2 = 30 + rnd(s) * (C.W - 60);
      if (Math.abs(x2 - x) > 60) s.anchors.push({ x: Math.round(x2), y: Math.round(s.topY + (rnd(s) * 30 - 15)), wear: 0, broken: false });
    }
  }
  // ekranın çok altında kalan çapaları at (indeksler kaymasın diye yalnızca takılı değilken)
  if (s.hook < 0 && s.anchors.length > 60) {
    s.anchors = s.anchors.filter(a => a.y < s.fogY + 40);
  }
}

// Kancanın hedefi: menzildeki, oyuncunun üstündeki çapalardan en iyisi
function pickTarget(s, input) {
  let best = -1, bestScore = -Infinity;
  for (let i = 0; i < s.anchors.length; i++) {
    const a = s.anchors[i];
    if (a.broken) continue;
    const dx = a.x - s.px, dy = s.py - a.y;
    if (dy < 20) continue;
    if (dx * dx + dy * dy > C.RANGE * C.RANGE) continue;
    let sc = dy - 0.5 * Math.abs(dx);
    if (input.left && dx < 0) sc += 120;
    if (input.right && dx > 0) sc += 120;
    if (sc > bestScore) { bestScore = sc; best = i; }
  }
  return best;
}

function finish(s, reason) {
  s.status = 'over';
  s.overReason = reason;
  s.hook = -1; s.hanging = false;
  s.events.push({ type: 'over' });
}

function step(s, input, dt) {
  if (s.status !== 'playing') { s.prevAction = !!input.action; return s; }
  const pressed = !!input.action && !s.prevAction;
  s.prevAction = !!input.action;
  if (!s.started && (pressed || input.left || input.right)) s.started = true;
  s.time += dt;

  // kanca at / bırak
  if (pressed && s.hook < 0) {
    const t = pickTarget(s, input);
    if (t >= 0) { s.hook = t; s.hanging = false; s.events.push({ type: 'hook' }); }
    else s.events.push({ type: 'miss' });
  }
  if (!input.action && s.hook >= 0) {
    s.hook = -1; s.hanging = false; s.events.push({ type: 'release' });
  }

  if (s.hook >= 0) {
    const a = s.anchors[s.hook];
    a.wear += dt;
    if (a.wear >= C.BREAK) {
      a.broken = true; s.hook = -1; s.hanging = false;
      s.events.push({ type: 'break', x: a.x, y: a.y });
    }
  }

  if (s.hook >= 0) {
    const a = s.anchors[s.hook];
    const dx = a.x - s.px, dy = a.y - s.py;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (s.hanging || d < C.SNAP) {
      if (!s.hanging) s.events.push({ type: 'snap' });
      s.hanging = true;
      s.px = a.x; s.py = a.y + C.SNAP * 0.5; s.vx = 0; s.vy = 0;
    } else {
      s.vx += (dx / d) * C.PULL * dt;
      s.vy += (dy / d) * C.PULL * dt + C.G * 0.3 * dt;
    }
  } else {
    s.vy += C.G * dt;
    if (input.left) s.vx -= C.AIR * dt;
    if (input.right) s.vx += C.AIR * dt;
    s.vx *= 1 - 0.6 * dt;
  }

  const sp = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
  if (sp > C.MAXV) { s.vx *= C.MAXV / sp; s.vy *= C.MAXV / sp; }
  if (!s.hanging) { s.px += s.vx * dt; s.py += s.vy * dt; }

  // duvarlar ve başlangıç zemini (y = 0)
  if (s.px < C.R) { s.px = C.R; s.vx = Math.abs(s.vx) * 0.5; }
  if (s.px > C.W - C.R) { s.px = C.W - C.R; s.vx = -Math.abs(s.vx) * 0.5; }
  if (s.py > -C.R) { s.py = -C.R; if (s.vy > 0) s.vy = 0; s.vx *= 1 - 4 * dt; }

  // kamera yalnızca yukarı gider
  const want = s.py - C.H * 0.55;
  if (want < s.camY) s.camY += (want - s.camY) * Math.min(1, 6 * dt);

  // sis
  const h = Math.max(0, -s.py);
  if (h > s.maxH) s.maxH = h;
  s.score = Math.floor(s.maxH / 10);
  if (s.started) {
    const fogV = Math.min(C.FOG_MAX, C.FOG0 + C.FOG_K * s.maxH);
    s.fogY -= fogV * dt;
    s.fogY = Math.min(s.fogY, s.camY + C.H + C.FOG_LEAD);
  }
  genAnchors(s);

  if (s.py + C.R * 0.5 > s.fogY) {
    finish(s, 'Sis seni yuttu (' + s.score + ' m)');
  } else if (s.maxH >= C.WIN_H) {
    s.status = 'won';
    s.overReason = '';
    s.events.push({ type: 'won' });
  }
  return s;
}

if (typeof module !== 'undefined') module.exports = { createState, step, pickTarget, C };
if (typeof window !== 'undefined') window.GameLogic = { createState, step, pickTarget, C };
