// Run from repository root: node tests/cotejo-regression.cjs
// No real production documents or third-party packages required.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('cotejo-comprobaciones.html','utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
for(const script of scripts)new vm.Script(script);
const js=scripts.at(-1);
function section(start,end){
 const a=js.indexOf(start),b=js.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'Missing function '+start);
 return js.slice(a,b);
}
const code=[
 section('const num=','const basename='),
 section('function parseCsv(','function mapCover('),
 section('function matchRow(','async function unpack('),
].join('\n');
const context={};
vm.createContext(context);
vm.runInContext(`
 const clean=s=>String(s);
 const $=()=>({value:'AF-002'});
 const state={rows:[{id:'r1',number:1,amount:'35.00'},{id:'r2',number:2,amount:'113.00'}]};
 ${code}
 globalThis.test={num,parseCsv,matchRow};
`,context);
const {num,parseCsv,matchRow}=context.test;
for(const [input,expected] of [['1,234.56',1234.56],['1.234,56',1234.56],['$1,234',1234],['113,50',113.5],['35.00',35]])assert.equal(num(input),expected);
assert.ok(Number.isNaN(num('')));
assert.deepEqual(Array.from(parseCsv('Concepto;Proveedor;Importe\nRenta;A, B;1.234,56'),r=>Array.from(r)),[['Concepto','Proveedor','Importe'],['Renta','A, B','1.234,56']]);
assert.deepEqual(Array.from(parseCsv('Concepto,Proveedor\n"Locación, interior","Casa ""A"""'),r=>Array.from(r)),[['Concepto','Proveedor'],['Locación, interior','Casa "A"']]);
assert.equal(matchRow({original:'FACTURA_001.xml',amount:''}),null);
assert.equal(matchRow({original:'AF-002-001.pdf',amount:''}),'r1');
assert.equal(matchRow({original:'AF-002-002.xml',amount:'113'}),'r2');
assert.equal(matchRow({original:'invoice.xml',amount:'35'}),'r1');
assert.equal(matchRow({original:'invoice.xml',amount:'999'}),null);
console.log('PASS: script syntax, monetary formats, CSV delimiters/quotes, association safety');
