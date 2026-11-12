// index.html + logic.js + render.js + main.js -> oyun-tek-dosya.html
var fs = require('fs'), path = require('path');
var dir = __dirname;
var html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
['logic.js', 'render.js', 'main.js'].forEach(function (f) {
  var code = fs.readFileSync(path.join(dir, f), 'utf8').replace(/<\/script/gi, '<\\/script');
  html = html.replace('<script src="' + f + '"></script>', function () { return '<script>/* ' + f + ' */\n' + code + '\n</script>'; });
});
fs.writeFileSync(path.join(dir, 'oyun-tek-dosya.html'), html);
console.log('oyun-tek-dosya.html yazıldı, ' + html.length + ' karakter');
