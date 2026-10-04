// Sekme Gücü — betik dosyalarını index.html içine gömüp tek dosya üretir
var fs = require('fs');
var path = require('path');

var dir = __dirname;
var FILES = ['logic.js', 'shop.js', 'monetize.js', 'quests.js', 'audio.js', 'render.js', 'main.js'];
var html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');

var tags = FILES.map(function (f) { return '<script src="' + f + '"></script>'; }).join('\n');
var bundle = FILES.map(function (f) {
  return '<script>\n' + fs.readFileSync(path.join(dir, f), 'utf8') + '\n</script>\n';
}).join('');

var out = html.replace(tags, bundle);

if (out === html) {
  throw new Error('script etiketleri bulunamadı, gömme başarısız');
}

fs.writeFileSync(path.join(dir, 'oyun-tek-dosya.html'), out, 'utf8');
console.log('oyun-tek-dosya.html yazıldı, ' + out.length + ' bayt');
