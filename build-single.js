var fs = require('fs');
var html = fs.readFileSync(__dirname + '/index.html', 'utf8');
html = html.replace(/<script src="([^"]+)"><\/script>/g, function (m, f) {
  return '<script>\n' + fs.readFileSync(__dirname + '/' + f, 'utf8') + '\n</script>';
});
fs.writeFileSync(__dirname + '/oyun-tek-dosya.html', html);
console.log('yazıldı: oyun-tek-dosya.html (' + html.length + ' karakter)');
