// Sekme Gücü — saf oyun mantığı (DOM/canvas/window kullanılmaz)

var CANVAS_W = 520;
var CANVAS_H = 540;
var BALL_X = 160;
var BALL_R = 12;
var FLOOR_Y = 480;
var CEIL_Y = 30;
var GRAVITY = 900;
var THRUST = -700;
var BOUNCE_V = -480;
var MAX_VY = 900;
var SPEED0 = 200;
var SPEED_RAMP = 3;
var GAP_H0 = 170;
var GAP_MIN = 100;
var GAP_SHRINK = 0.8;
var WALL_W = 28;
var SPAWN_GRACE = 2.2;
var SPAWN_INTERVAL_MIN = 1.15;
var SPAWN_INTERVAL_MAX = 1.9;
var SPAWN_RAMP = 0.01;

function nextRand(state) {
  state.rngA = (state.rngA + 0x6D2B79F5) | 0;
  var t = state.rngA;
  t = Math.imul(t ^ (t >>> 15), 1 | t);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function createState(seed) {
  return {
    rngA: (seed || 1) >>> 0,
    y: FLOOR_Y - BALL_R - 60,
    vy: 0,
    t: 0,
    speed: SPEED0,
    gapH: GAP_H0,
    spawnTimer: SPAWN_GRACE,
    obstacles: [],
    bounces: 0,
    score: 0,
    distance: 0,
    status: 'playing',
    overReason: ''
  };
}

function step(state, input, dt) {
  if (state.status !== 'playing') return state;

  var accel = GRAVITY;
  if (input.action) accel += THRUST;
  state.vy += accel * dt;
  if (state.vy > MAX_VY) state.vy = MAX_VY;
  if (state.vy < -MAX_VY) state.vy = -MAX_VY;
  state.y += state.vy * dt;

  if (state.y + BALL_R >= FLOOR_Y) {
    state.y = FLOOR_Y - BALL_R;
    state.vy = BOUNCE_V;
    state.bounces++;
  }

  if (state.y - BALL_R <= CEIL_Y) {
    state.status = 'over';
    state.overReason = 'Tavana çarptın';
    return state;
  }

  state.t += dt;
  state.speed = SPEED0 + state.t * SPEED_RAMP;
  state.gapH = Math.max(GAP_MIN, GAP_H0 - state.t * GAP_SHRINK);

  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    var maxTop = FLOOR_Y - 40 - state.gapH;
    var minTop = CEIL_Y + 40;
    var span = Math.max(10, maxTop - minTop);
    var gapY = minTop + nextRand(state) * span;
    state.obstacles.push({ x: CANVAS_W + WALL_W, gapY: gapY, gapH: state.gapH, passed: false });
    var interval = SPAWN_INTERVAL_MAX - state.t * SPAWN_RAMP;
    if (interval < SPAWN_INTERVAL_MIN) interval = SPAWN_INTERVAL_MIN;
    state.spawnTimer = interval;
  }

  for (var i = 0; i < state.obstacles.length; i++) {
    var o = state.obstacles[i];
    o.x -= state.speed * dt;
    if (!o.passed && o.x + WALL_W < BALL_X) {
      o.passed = true;
      state.score++;
    }
    if (o.x < BALL_X + BALL_R && o.x + WALL_W > BALL_X - BALL_R) {
      if (state.y - BALL_R < o.gapY || state.y + BALL_R > o.gapY + o.gapH) {
        state.status = 'over';
        state.overReason = 'Duvara çarptın';
        return state;
      }
    }
  }
  var kept = [];
  for (var j = 0; j < state.obstacles.length; j++) {
    if (state.obstacles[j].x + WALL_W > -10) kept.push(state.obstacles[j]);
  }
  state.obstacles = kept;

  state.distance += state.speed * dt;
  return state;
}

if (typeof module !== 'undefined') module.exports = { createState: createState, step: step };
if (typeof window !== 'undefined') window.GameLogic = { createState: createState, step: step };
