#!/usr/bin/env node
// Bopgate Android — www/ klasörünü hazırlar.
//
// 1) Depo kökünde `node build-single.js` çalıştırır (tek dosya güncel olsun diye).
//    `--derleme-yok` verilirse bu adım atlanır ve mevcut oyun-tek-dosya.html kullanılır.
// 2) ../oyun-tek-dosya.html dosyasını www/index.html olarak kopyalar.
// 3) bridge.js içeriğini, oyun betiklerinin İLK <script> etiketinden ÖNCE satır içi
//    (inline) olarak ekler. Böylece main.js açılırken window.BopgateNative zaten tanımlıdır
//    ve www/ tek dosya olarak (ağsız) çalışmaya devam eder.
//
// Oyunun kendi JS dosyalarına dokunmaz.
'use strict';

var fs = require('fs');
var path = require('path');
var childProcess = require('child_process');

var BURASI = __dirname;
var KOK = path.resolve(BURASI, '..');
var TEK_DOSYA = path.join(KOK, 'oyun-tek-dosya.html');
var KOPRU = path.join(BURASI, 'bridge.js');
var WWW = path.join(BURASI, 'www');
var HEDEF = path.join(WWW, 'index.html');
var ISARET = 'data-bopgate-kopru';

function derle() {
  if (process.argv.indexOf('--derleme-yok') !== -1) {
    console.log('[hazirla] build-single.js atlandı (--derleme-yok)');
    return;
  }
  childProcess.execFileSync(process.execPath, [path.join(KOK, 'build-single.js')], {
    cwd: KOK,
    stdio: 'inherit'
  });
}

function kopruyuEkle(html, kopru) {
  if (html.indexOf(ISARET) !== -1) {
    throw new Error('Köprü zaten eklenmiş görünüyor; kaynak HTML temiz olmalı');
  }
  if (/<\/script/i.test(kopru)) {
    throw new Error('bridge.js içinde "</script" geçemez (satır içi gömülüyor)');
  }
  var govde = html.search(/<body[\s>]/i);
  if (govde === -1) throw new Error('<body> bulunamadı');
  var ilkBetik = html.indexOf('<script', govde);
  if (ilkBetik === -1) throw new Error('Oyun betiği (<script>) bulunamadı');
  // <head> içinde betik olmamalı; olursa köprü ondan da önce gelmeli.
  var bastakiBetik = html.indexOf('<script');
  if (bastakiBetik !== -1 && bastakiBetik < govde) ilkBetik = bastakiBetik;

  var etiket = '<script ' + ISARET + '>\n' + kopru + '\n</script>\n';
  return html.slice(0, ilkBetik) + etiket + html.slice(ilkBetik);
}

function main() {
  derle();
  if (!fs.existsSync(TEK_DOSYA)) {
    throw new Error('oyun-tek-dosya.html yok: önce depo kökünde `node build-single.js` çalıştırın');
  }
  var html = fs.readFileSync(TEK_DOSYA, 'utf8');
  var kopru = fs.readFileSync(KOPRU, 'utf8');
  var cikti = kopruyuEkle(html, kopru);

  fs.mkdirSync(WWW, { recursive: true });
  fs.writeFileSync(HEDEF, cikti, 'utf8');
  console.log('[hazirla] www/index.html yazıldı, ' + cikti.length + ' bayt (köprü satır içi, oyun betiklerinden önce)');
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    console.error('[hazirla] HATA: ' + e.message);
    process.exit(1);
  }
}

module.exports = { kopruyuEkle: kopruyuEkle };
