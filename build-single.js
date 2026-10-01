const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
for (const f of ['logic.js', 'render.js', 'main.js']) {
  const code = fs.readFileSync(f, 'utf8');
  h = h.replace('<script src="' + f + '"></script>', () => '<script>\n' + code + '\n</script>');
}
fs.writeFileSync('oyun-tek-dosya.html', h);
console.log('oyun-tek-dosya.html yazıldı, ' + h.length + ' karakter');
