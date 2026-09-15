(function () {
  'use strict';

  var COLORS = {
    bg: '#0b1220',
    grid: '#1b2740',
    woodSource: '#5b3a1e',
    stoneSource: '#4a4f57',
    collectorWood: '#c98a3a',
    collectorStone: '#9aa1ab',
    well: '#2f8fd1',
    cursor: '#f2d24b',
    text: '#e8ecf1',
    dim: '#7c8aa5',
    danger: '#e85b5b'
  };

  function draw(ctx, state, view) {
    var w = view && view.width ? view.width : ctx.canvas.width;
    var h = view && view.height ? view.height : ctx.canvas.height;
    var gridLen = state.grid ? state.grid.length : 25;
    var GRID_W = Math.round(Math.sqrt(gridLen)) || 5;
    var topH = 70;
    var gridSize = Math.min(w, h - topH);
    var cell = gridSize / GRID_W;
    var offX = (w - gridSize) / 2;
    var offY = topH;

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = COLORS.text;
    ctx.font = '16px system-ui, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText('Odun: ' + Math.floor(state.wood), 12, 12);
    ctx.fillText('Taş: ' + Math.floor(state.stone), 130, 12);
    ctx.fillStyle = state.water < 4 ? COLORS.danger : COLORS.text;
    ctx.fillText('Su: ' + Math.floor(state.water), 248, 12);
    ctx.fillStyle = COLORS.text;
    ctx.fillText('Üretim: ' + Math.floor(state.score), 360, 12);

    var best = state.best || 0;
    ctx.fillStyle = COLORS.dim;
    ctx.fillText('Rekor: ' + Math.floor(best), 12, 34);

    for (var gy = 0; gy < GRID_W; gy++) {
      for (var gx = 0; gx < GRID_W; gx++) {
        var idx = gy * GRID_W + gx;
        var c = state.grid[idx];
        var x = offX + gx * cell;
        var y = offY + gy * cell;
        var fill = COLORS.grid;
        if (c.building === 'collector-wood') fill = COLORS.collectorWood;
        else if (c.building === 'collector-stone') fill = COLORS.collectorStone;
        else if (c.building === 'well') fill = COLORS.well;
        else if (c.type === 'wood-source') fill = COLORS.woodSource;
        else if (c.type === 'stone-source') fill = COLORS.stoneSource;

        ctx.fillStyle = fill;
        ctx.fillRect(x + 2, y + 2, cell - 4, cell - 4);

        if (c.building) {
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 2, y + 2, cell - 4, cell - 4);
        }
      }
    }

    ctx.strokeStyle = COLORS.cursor;
    ctx.lineWidth = 3;
    ctx.strokeRect(offX + state.cx * cell + 2, offY + state.cy * cell + 2, cell - 4, cell - 4);

    ctx.fillStyle = COLORS.dim;
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('Kaynak karesinde: topla (boşluk) · boş karede kuyu (3 odun + 3 taş)', 12, h - 20);

    if (state.status === 'over') {
      ctx.fillStyle = 'rgba(5,7,12,0.82)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(state.overReason || 'Oyun bitti', w / 2, h / 2 - 30);
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillText('Üretim: ' + Math.floor(state.score) + '  ·  Rekor: ' + Math.floor(best), w / 2, h / 2 + 4);
      ctx.fillStyle = COLORS.dim;
      ctx.fillText('R ile yeniden başla', w / 2, h / 2 + 32);
      ctx.textAlign = 'left';
    }
  }

  var api = { draw: draw };
  if (typeof module !== 'undefined') module.exports = { draw: draw };
  if (typeof window !== 'undefined') window.GameRender = api;
})();
