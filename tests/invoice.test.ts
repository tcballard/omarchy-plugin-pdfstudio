import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fresh,validate,totals} from '../renderer/model';
import {Store} from '../renderer/store';
import {renderInvoice} from '../renderer/invoice';

test('decimal rounding, fractional quantities and tax',()=>{
 const d=fresh();d.items=[{description:'Hours',quantity:'1.125',price:'19.99'},{description:'Parts',quantity:'3',price:'0.10'}];d.taxRate='20';
 assert.deepEqual(totals(d),{lines:[2249n,30n],subtotal:2279n,tax:456n,total:2735n});
});
test('reject invalid inputs instead of silently calculating',()=>{
 for(const price of ['-1','NaN','1e3','1.999','']) {const d=fresh();d.items[0].price=price;assert.throws(()=>validate(d));}
 const d=fresh();d.date='2026-02-30';assert.throws(()=>validate(d));
});
test('numbering, revisions, collisions, corruption and path validation',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'pdf-studio-'));const s=new Store(dir);
 try {
  const one=await s.save(fresh());const two=await s.save(fresh());
  assert.equal(one.number,'INV-00001');assert.equal(two.number,'INV-00002');
  await s.save(one);await assert.rejects(()=>s.save(one),/changed elsewhere/);
  two.number=one.number;await assert.rejects(()=>s.save(two),/already used/);
  const invalid=fresh();invalid.id='../../outside';await assert.rejects(()=>s.save(invalid));
  await writeFile(join(dir,'drafts.json'),'broken');await assert.rejects(()=>s.save(fresh()),/not been overwritten/);
  assert.equal(await readFile(join(dir,'drafts.json'),'utf8'),'broken');
 } finally {await rm(dir,{recursive:true,force:true});}
});
test('real pdfcn/Forme renderer generates a PDF',async()=>{
 const d=fresh();d.number='TEST-001';d.company='Example Studio';d.customer='Sample Customer';d.items=[{description:'Design work',quantity:'2.5',price:'120.00'}];
 const pdf=await renderInvoice(d);assert.equal(pdf.subarray(0,5).toString(),'%PDF-');assert.ok(pdf.length>1000);
});

test('stdin helper works outside its checkout and saves then previews',async()=>{
 const {execFileSync}=await import('node:child_process');
 const {fileURLToPath}=await import('node:url');
 const dir=await mkdtemp(join(tmpdir(),'pdf-studio-cli-'));
 const cli=fileURLToPath(new URL('../renderer/run.mjs',import.meta.url));
 const run=(request:unknown)=>JSON.parse(execFileSync(process.execPath,[cli],{cwd:dir,env:{...process.env,XDG_DATA_HOME:dir,XDG_CACHE_HOME:dir},input:JSON.stringify(request)+'\n',encoding:'utf8',timeout:10000}));
 try {
  const d=run({action:'new'}).draft;
  d.company='Example Studio';d.customer='Sample Customer';d.items[0]={description:'A real rendered invoice',quantity:'2.5',price:'120.00'};
  const saved=run({action:'save',draft:d});assert.equal(saved.ok,true);
  const preview=run({action:'preview',draft:saved.draft});assert.equal(preview.ok,true);
  assert.equal((await readFile(preview.path)).subarray(0,5).toString(),'%PDF-');
  assert.equal(run({action:'list'}).drafts.length,1);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('distributed renderer runs with no node_modules, npm or tsx',async()=>{
 const {execFileSync}=await import('node:child_process');
 const {fileURLToPath}=await import('node:url');
 const {cp,mkdir}=await import('node:fs/promises');
 const dir=await mkdtemp(join(tmpdir(),'pdfstudio-distributed-'));
 try {
  await cp(fileURLToPath(new URL('../dist',import.meta.url)),join(dir,'dist'),{recursive:true});
  await mkdir(join(dir,'renderer'));
  await cp(fileURLToPath(new URL('../renderer/fonts',import.meta.url)),join(dir,'renderer/fonts'),{recursive:true});
  // Only shipped assets; no source, modules, network bootstrap or package manager.
  const run=(request:unknown)=>JSON.parse(execFileSync(process.execPath,[join(dir,'dist/renderer.mjs')],{cwd:dir,env:{...process.env,PATH:'/nonexistent',NODE_PATH:'',XDG_DATA_HOME:join(dir,'data'),XDG_CACHE_HOME:join(dir,'cache')},input:JSON.stringify(request)+'\n',encoding:'utf8',timeout:10000}));
  const d=run({action:'new'}).draft;
  d.company='Clean Install Studio';d.customer='Example Customer';d.taxRate='20';
  d.items=[{description:'Packaged PDF export',quantity:'1.125',price:'19.99'}];
  const saved=run({action:'save',draft:d});assert.equal(saved.ok,true);
  assert.equal(run({action:'total',draft:saved.draft}).total,'GBP 26.99');
  const preview=run({action:'preview',draft:saved.draft});assert.equal(preview.ok,true);
  assert.equal((await readFile(preview.path)).subarray(0,5).toString(),'%PDF-');
  assert.equal(run({action:'list'}).drafts.length,1);
 }finally{await rm(dir,{recursive:true,force:true});}
});
