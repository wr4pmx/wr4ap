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
  ['borrar borrador y validación al cambiar foto', /state\.photo=null;\$\('author'\)\.value='';\$\('message'\)\.value='';\$\('validation'\)\.textContent='';/],
  ['limpiar foto anterior después de confirmar reemplazo', /if\(state\.notes\.length&&!confirm\([^\n]*\)\)return;resetPhoto\(\)/],
  ['permite volver a seleccionar el mismo archivo', /e\.target\.value='';if\(state\.notes\.length/],
  ['cancelar reemplazo conserva anotaciones', /if\(state\.notes\.length&&!confirm\([^\n]*\)\)return;resetPhoto\(\)/],
  ['validación de tamaño', /file\.size\s*>\s*MAX_PHOTO_BYTES/],
  ['límite de píxeles decodificados', /img\.naturalWidth\*img\.naturalHeight>MAX_PHOTO_PIXELS/],
  ['lista explícita de formatos seguros (sin SVG)', /\['image\/jpeg','image\/png','image\/webp','image\/gif'\]\.includes\(file\.type\)/],
  ['texto seguro sin HTML dinámico', /body\.textContent\s*=\s*note\.text/],
  ['visibilidad de marcadores', /if\(show&&hasPhoto\)/],
  ['visibilidad independiente por nota sin renumerar', /state\.notes\.forEach\(\(note,i\)=>\{if\(note\.visible===false\)return;/],
  ['numeración estable respecto al listado', /b\.textContent=i\+1/],
  ['foco restaurado tras render de pin seleccionado', /b\.onclick=e=>\{e\.stopPropagation\(\);state\.selected=note\.id;render\(\);const selectedPin=.*?selectedPin\.focus\(\)\}/],
  ['alternar visibilidad manualmente', /visibility\.onclick=\(\)=>\{note\.visible=note\.visible===false;render\(\);const replacement=.*?replacement\.focus\(\)\}/],
  ['visibilidad preservada en JSON', /visible:visible!==false/],
  ['nuevas notas visibles inicialmente', /text,visible:true/],
  ['exportación de notas', /wr4p\.photo-annotations\.v1/],
  ['Escape cancela edición sin guardar', /e\.key==='Escape'&&![^\n]*cancelEditor\(\)/],
  ['cancelación devuelve foco al control', /function cancelEditor\(\)\{[^\n]*\$\('add'\)\.focus\(\)/],
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
