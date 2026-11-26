// index.html + logic/render/main -> oyun-tek-dosya.html (node build-single.js)
'use strict';
const fs = require('fs');
const path = require('path');
const dir = __dirname;
let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
for (const f of ['logic.js', 'render.js', 'main.js']) {
  const code = fs.readFileSync(path.join(dir, f), 'utf8').replace(/<\/script/gi, '<\\/script');
  html = html.replace('<script src="' + f + '"></script>', () => '<script>\n/* ' + f + ' */\n' + code + '\n</script>');
}
fs.writeFileSync(path.join(dir, 'oyun-tek-dosya.html'), html);
console.log('oyun-tek-dosya.html yazıldı (' + html.length + ' karakter)');
