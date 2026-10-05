'use strict';
const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
['logic.js', 'render.js', 'main.js'].forEach((f) => {
  const code = fs.readFileSync(f, 'utf8');
  html = html.replace('<script src="' + f + '"></script>', () => '<script>\n' + code + '\n</script>');
});
fs.writeFileSync('oyun-tek-dosya.html', html);
console.log('yazildi: oyun-tek-dosya.html (' + html.length + ' karakter)');
