var Lg = require('./logic.js');
function clone(s){ return JSON.parse(JSON.stringify(s)); }
// Her karede ileri sarıp "şimdi bırakırsam konar mı?" diye bakar.
function botAct(s) {
  if (s.mode !== 'swing') return false;
  var c = clone(s); c.prevAction = false;
  var sc = c.score;
  Lg.step(c, { action: true }, 1/60);
  for (var i = 0; i < 240 && c.status === 'playing' && c.mode === 'fly'; i++) Lg.step(c, {}, 1/60);
  return c.status === 'playing' && c.score > sc;
}
module.exports = { botAct: botAct };
