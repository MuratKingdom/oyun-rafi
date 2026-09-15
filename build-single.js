var fs = require('fs');
var path = require('path');

var dir = __dirname;
var html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
var logic = fs.readFileSync(path.join(dir, 'logic.js'), 'utf8');
var render = fs.readFileSync(path.join(dir, 'render.js'), 'utf8');
var main = fs.readFileSync(path.join(dir, 'main.js'), 'utf8');

var inlined = html
  .replace('<script src="logic.js"></script>', '<script>\n' + logic + '\n</script>')
  .replace('<script src="render.js"></script>', '<script>\n' + render + '\n</script>')
  .replace('<script src="main.js"></script>', '<script>\n' + main + '\n</script>');

fs.writeFileSync(path.join(dir, 'oyun-tek-dosya.html'), inlined, 'utf8');
console.log('oyun-tek-dosya.html oluşturuldu (' + inlined.length + ' bayt).');
