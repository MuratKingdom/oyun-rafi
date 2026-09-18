// Yercekimi Tuneli - saf oyun mantigi (DOM yok, canvas yok, window yok)

var VIEW_W = 480;
var VIEW_H = 270;
var WALL_T = 10;
var BALL_R = 8;
var BALL_X = 90;
var GRAVITY = 950;
var MAX_FALL_SPEED = 420;
var BASE_SPEED = 130;
var MAX_SPEED = 300;
var OBSTACLE_W = 22;
var MIN_GAP = 72;
var MAX_GAP = 150;
var MIN_SPACING = 150;
var MAX_SPACING = 260;

function nextRandom(state) {
  state.rngState = (state.rngState + 0x6D2B79F5) >>> 0;
  var t = state.rngState;
  var r = Math.imul(t ^ (t >>> 15), 1 | t);
  r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
  return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
}

function randRange(state, lo, hi) {
  return lo + nextRandom(state) * (hi - lo);
}

function currentSpeed(worldX) {
  var s = BASE_SPEED + worldX * 0.045;
  return s > MAX_SPEED ? MAX_SPEED : s;
}

function currentGapH(worldX) {
  var g = MAX_GAP - worldX * 0.018;
  return g < MIN_GAP ? MIN_GAP : g;
}

function spawnObstacle(state) {
  var gapH = currentGapH(state.nextObstacleWorldX);
  var margin = WALL_T + gapH / 2 + 12;
  var gapY = randRange(state, margin, VIEW_H - margin);
  state.obstacles.push({
    x: state.nextObstacleWorldX,
    gapY: gapY,
    gapH: gapH,
    passed: false
  });
  var spacing = randRange(state, MIN_SPACING, MAX_SPACING);
  state.nextObstacleWorldX += spacing;
}

function createState(seed) {
  var state = {
    status: 'playing',
    overReason: '',
    rngState: (seed >>> 0) || 1,
    worldX: 0,
    y: VIEW_H / 2,
    vy: 0,
    gravityDir: 1,
    prevActionHeld: false,
    obstacles: [],
    nextObstacleWorldX: 220,
    score: 0,
    best: 0
  };
  while (state.nextObstacleWorldX < 1800) {
    spawnObstacle(state);
  }
  return state;
}

function step(state, input, dt) {
  if (state.status !== 'playing') {
    if (input && input.restart) {
      var seed = (state.rngState + 12345) >>> 0;
      var fresh = createState(seed);
      for (var k in fresh) { state[k] = fresh[k]; }
    }
    return state;
  }

  var actionHeld = !!(input && input.action);
  if (actionHeld && !state.prevActionHeld) {
    state.gravityDir = -state.gravityDir;
  }
  state.prevActionHeld = actionHeld;

  state.vy += GRAVITY * state.gravityDir * dt;
  if (state.vy > MAX_FALL_SPEED) state.vy = MAX_FALL_SPEED;
  if (state.vy < -MAX_FALL_SPEED) state.vy = -MAX_FALL_SPEED;
  state.y += state.vy * dt;

  var speed = currentSpeed(state.worldX);
  state.worldX += speed * dt;
  state.score = Math.floor(state.worldX / 10);

  if (state.y - BALL_R <= WALL_T) {
    state.y = WALL_T + BALL_R;
    state.status = 'over';
    state.overReason = 'Tünelin tavanına çarptın';
  } else if (state.y + BALL_R >= VIEW_H - WALL_T) {
    state.y = VIEW_H - WALL_T - BALL_R;
    state.status = 'over';
    state.overReason = 'Tünelin tabanına çarptın';
  }

  if (state.status === 'playing') {
    for (var i = 0; i < state.obstacles.length; i++) {
      var o = state.obstacles[i];
      var screenX = o.x - state.worldX + BALL_X;
      if (screenX + OBSTACLE_W / 2 >= BALL_X - BALL_R && screenX - OBSTACLE_W / 2 <= BALL_X + BALL_R) {
        var top = o.gapY - o.gapH / 2;
        var bottom = o.gapY + o.gapH / 2;
        if (state.y - BALL_R < top || state.y + BALL_R > bottom) {
          state.status = 'over';
          state.overReason = 'Engele çarptın';
          break;
        }
      }
    }
  }

  while (state.nextObstacleWorldX < state.worldX + VIEW_W * 2) {
    spawnObstacle(state);
  }
  while (state.obstacles.length && state.obstacles[0].x < state.worldX - VIEW_W) {
    state.obstacles.shift();
  }

  if (state.status === 'over' && state.score > state.best) {
    state.best = state.score;
  }

  return state;
}

if (typeof module !== 'undefined') {
  module.exports = { createState: createState, step: step };
}
if (typeof window !== 'undefined') {
  window.GameLogic = { createState: createState, step: step };
}
