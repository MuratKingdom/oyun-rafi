// index.html + logic.js + render.js + main.js icerigini tek dosyada birlestirir
var fs = require('fs');
var path = require('path');

var dir = __dirname;
var html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
var logic = fs.readFileSync(path.join(dir, 'logic.js'), 'utf8');
var render = fs.readFileSync(path.join(dir, 'render.js'), 'utf8');
var main = fs.readFileSync(path.join(dir, 'main.js'), 'utf8');

var combined = '<script>\n' + logic + '\n</script>\n' +
  '<script>\n' + render + '\n</script>\n' +
  '<script>\n' + main + '\n</script>\n';

var out = html
  .replace('<script src="logic.js"></script>\n<script src="render.js"></script>\n<script src="main.js"></script>', combined);

if (out === html) {
  throw new Error('script etiketleri bulunamadi, degistirme yapilamadi');
}

fs.writeFileSync(path.join(dir, 'oyun-tek-dosya.html'), out, 'utf8');
console.log('oyun-tek-dosya.html yazildi, boyut: ' + out.length + ' bayt');
