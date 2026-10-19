// Test yardımcısı: logic.js üzerinden, yalnızca input vererek oynayan botlar.
const L = require('./logic.js');
function tap(s, key) { const i = { left: 0, right: 0, up: 0, down: 0, action: 0, restart: 0, cell: -1 }; i[key] = true; L.step(s, i, 1 / 60); L.step(s, { cell: -1 }, 1 / 60); }
function moveTo(s, idx) {
  while (s.cursor % 5 < idx % 5) tap(s, 'right');
  while (s.cursor % 5 > idx % 5) tap(s, 'left');
  while (Math.floor(s.cursor / 5) < Math.floor(idx / 5)) tap(s, 'down');
  while (Math.floor(s.cursor / 5) > Math.floor(idx / 5)) tap(s, 'up');
}
// pick: 'best' en yüksek, 'worst' en düşük kazançlı boş kareyi seçer
function play(seed, pick) {
  const s = L.createState(seed);
  while (s.status === 'playing') {
    let bi = -1, bg = null;
    for (let c = 0; c < 25; c++) {
      if (s.board[c] >= 0) continue;
      const g = L.gainAt(s.board, c, s.queue[0]);
      if (bg === null || (pick === 'best' ? g > bg : g < bg)) { bg = g; bi = c; }
    }
    moveTo(s, bi);
    tap(s, 'action');
  }
  return s;
}
module.exports = { play, tap, moveTo };
