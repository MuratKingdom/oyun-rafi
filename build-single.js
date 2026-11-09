'use strict';
var fs = require('fs');
var html = fs.readFileSync('index.html', 'utf8');
['logic.js', 'render.js', 'main.js'].forEach(function (f) {
  var code = fs.readFileSync(f, 'utf8');
  var tag = '<script src="' + f + '"></script>';
  if (html.indexOf(tag) < 0) throw new Error('index.html icinde bulunamadi: ' + f);
  html = html.split(tag).join('<script>\n' + code.split('</script>').join('<\\/script>') + '\n</script>');
});
fs.writeFileSync('oyun-tek-dosya.html', html);
console.log('oyun-tek-dosya.html yazildi, ' + html.length + ' karakter');
