// WR4P Centro de Pruebas: static regression checks (no external dependencies).
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'pruebas.html'), 'utf8');
const coordination = fs.readFileSync(path.join(root, 'coordinacion.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script, 'El Centro de Pruebas debe incluir script');
new vm.Script(script, { filename: 'pruebas.html' });
assert.ok(script.indexOf('const $=') >= 0 && script.indexOf('const $=') < script.indexOf("$('sampleCover')"), 'El selector debe inicializarse antes de registrar eventos');
for (const id of ['sampleCover','sampleXml','run','copy','notes','results','copied']) {
  assert.match(html, new RegExp('id="'+id+'"'), 'Falta elemento '+id);
}
for (const filename of ['coordinacion.html','bandeja-documental.html','cotejo-comprobaciones.html','entregas.html','wr4p-transfer.js']) {
  assert.ok(fs.existsSync(path.join(root, filename)), 'Falta dependencia '+filename);
}
assert.match(coordination, /href="\.\/pruebas\.html"/, 'Coordinación debe enlazar el Centro de Pruebas');
assert.match(script, /WR4P_PRUEBA_CARATULA\.csv/);
assert.match(script, /WR4P_PRUEBA_01\.xml/);
console.log('OK: sintaxis, inicialización, controles, enlaces y fixtures del Centro de Pruebas.');
