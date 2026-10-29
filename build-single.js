'use strict';
var fs = require('fs');
var html = fs.readFileSync('index.html', 'utf8');
['logic.js', 'render.js', 'main.js'].forEach(function (f) {
  var code = fs.readFileSync(f, 'utf8');
  html = html.replace('<script src="' + f + '"></script>', function () { return '<script>\n' + code + '\n</script>'; });
});
fs.writeFileSync('oyun-tek-dosya.html', html);
console.log('oyun-tek-dosya.html yazıldı, ' + html.length + ' karakter');
