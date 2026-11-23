// WR4P: checks de contrato del laboratorio; no sustituyen pruebas de navegador.
'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '..', 'laboratorio-anotaciones.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
assert.equal(scripts.length, 1, 'Debe haber un solo script inline');
new vm.Script(scripts[0], { filename: 'laboratorio-anotaciones.html' });
const checks = [
  ['escenario accesible por teclado', /tabindex="0" role="group"/],
  ['anotación central con teclado', /state\.pending=\{x:0\.5,y:0\.5\}/],
  ['teclas Enter y espacio', /\['Enter',' '\]\.includes\(e\.key\)/],
  ['imagen original intacta', /URL\.createObjectURL\(file\)/],
  ['liberación de URL', /URL\.revokeObjectURL\(state\.url\)/],
  ['coordenadas relativas', /getBoundingClientRect\(\)/],
  ['validación de tamaño', /file\.size\s*>\s*MAX_PHOTO_BYTES/],
  ['límite de píxeles decodificados', /img\.naturalWidth\*img\.naturalHeight>MAX_PHOTO_PIXELS/],
  ['lista explícita de formatos seguros (sin SVG)', /\['image\/jpeg','image\/png','image\/webp','image\/gif'\]\.includes\(file\.type\)/],
  ['texto seguro sin HTML dinámico', /body\.textContent\s*=\s*note\.text/],
  ['visibilidad de marcadores', /if\(show&&hasPhoto\)/],
  ['exportación de notas', /wr4p\.photo-annotations\.v1/],
  ['tarea solo por acción explícita', /task\.onclick\s*=/],
  ['reinicio de URL al abandonar página', /addEventListener\('pagehide',resetPhoto\)/],
  ['identificación de foto en exportación', /photo:state\.photo/],
  ['metadatos sin incrustar imagen', /state\.photo=\{name:file\.name,size:file\.size,lastModified:file\.lastModified,type:file\.type\}/]
];
for (const [name, pattern] of checks) {
  assert.match(html, pattern, name);
  process.stdout.write('PASS ' + name + '\n');
}
assert.doesNotMatch(html, /\.innerHTML\s*=/, 'No insertar contenido de usuarios como HTML');
console.log('PASS sintaxis JS y contrato estático. PENDIENTE: pruebas reales en navegador.');
