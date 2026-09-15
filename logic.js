(function () {
  'use strict';

  var GRID_W = 5;
  var GRID_H = 5;
  var MOVE_INTERVAL = 0.15;
  var WOOD_RATE = 0.4;
  var STONE_RATE = 0.4;
  var WELL_RATE = 0.9;
  var WELL_COST_WOOD = 3;
  var WELL_COST_STONE = 3;
  var BASE_DRAIN = 0.6;
  var DRAIN_RAMP = 0.3;
  var DRAIN_RAMP_INTERVAL = 25;
  var START_WOOD = 3;
  var START_STONE = 3;
  var START_WATER = 15;

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function buildGrid(seed) {
    var rand = mulberry32(seed >>> 0);
    var indices = [];
    var i;
    for (i = 0; i < GRID_W * GRID_H; i++) indices.push(i);
    for (i = indices.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var tmp = indices[i];
      indices[i] = indices[j];
      indices[j] = tmp;
    }
    var grid = [];
    for (i = 0; i < GRID_W * GRID_H; i++) {
      grid.push({ type: 'empty', building: null });
    }
    for (i = 0; i < 4; i++) grid[indices[i]].type = 'wood-source';
    for (i = 4; i < 8; i++) grid[indices[i]].type = 'stone-source';
    return grid;
  }

  function createState(seed) {
    var s = seed === undefined || seed === null ? 1 : seed;
    return {
      seed: s,
      grid: buildGrid(s),
      cx: 0,
      cy: 0,
      moveCD: 0,
      wood: START_WOOD,
      stone: START_STONE,
      water: START_WATER,
      score: 0,
      elapsed: 0,
      status: 'playing',
      overReason: ''
    };
  }

  function countBuildings(grid) {
    var wood = 0, stone = 0, wells = 0;
    for (var i = 0; i < grid.length; i++) {
      var b = grid[i].building;
      if (b === 'collector-wood') wood++;
      else if (b === 'collector-stone') stone++;
      else if (b === 'well') wells++;
    }
    return { wood: wood, stone: stone, wells: wells };
  }

  function step(state, input, dt) {
    if (state.status !== 'playing') return state;

    state.elapsed += dt;

    state.moveCD -= dt;
    if (state.moveCD <= 0) {
      var moved = false;
      if (input.left && state.cx > 0) { state.cx--; moved = true; }
      else if (input.right && state.cx < GRID_W - 1) { state.cx++; moved = true; }
      if (input.up && state.cy > 0) { state.cy--; moved = true; }
      else if (input.down && state.cy < GRID_H - 1) { state.cy++; moved = true; }
      if (moved) state.moveCD = MOVE_INTERVAL;
    }

    if (input.action) {
      var idx = state.cy * GRID_W + state.cx;
      var cell = state.grid[idx];
      if (!cell.building) {
        if (cell.type === 'wood-source') {
          cell.building = 'collector-wood';
        } else if (cell.type === 'stone-source') {
          cell.building = 'collector-stone';
        } else if (cell.type === 'empty' && state.wood >= WELL_COST_WOOD && state.stone >= WELL_COST_STONE) {
          state.wood -= WELL_COST_WOOD;
          state.stone -= WELL_COST_STONE;
          cell.building = 'well';
        }
      }
    }

    var counts = countBuildings(state.grid);
    var producedWood = counts.wood * WOOD_RATE * dt;
    var producedStone = counts.stone * STONE_RATE * dt;
    var producedWater = counts.wells * WELL_RATE * dt;
    var drain = BASE_DRAIN + Math.floor(state.elapsed / DRAIN_RAMP_INTERVAL) * DRAIN_RAMP;

    state.wood += producedWood;
    state.stone += producedStone;
    state.water += producedWater - drain * dt;
    state.score += producedWood + producedStone + producedWater;

    if (state.water <= 0) {
      state.water = 0;
      state.status = 'over';
      state.overReason = 'Su tükendi';
    }

    return state;
  }

  var api = {
    createState: createState,
    step: step,
    GRID_W: GRID_W,
    GRID_H: GRID_H
  };

  if (typeof module !== 'undefined') module.exports = { createState: createState, step: step, GRID_W: GRID_W, GRID_H: GRID_H };
  if (typeof window !== 'undefined') window.GameLogic = api;
})();
