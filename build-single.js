// index.html + üç betiği tek dosyada birleştirir.
const fs = require('fs');
let html = fs.readFileSync(__dirname + '/index.html', 'utf8');
['logic.js', 'render.js', 'main.js'].forEach(function (f) {
  const code = fs.readFileSync(__dirname + '/' + f, 'utf8');
  html = html.replace('<script src="' + f + '"></script>', function () { return '<script>\n' + code + '\n</script>'; });
});
fs.writeFileSync(__dirname + '/oyun-tek-dosya.html', html);
console.log('oyun-tek-dosya.html yazıldı: ' + html.length + ' bayt');
