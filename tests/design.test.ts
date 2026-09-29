import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm,cp,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {newDesign,block,validateDesign} from '../renderer/document';
import {DesignStore} from '../renderer/design-store';
import {importImage,imageData,imageInfo} from '../renderer/assets';
import {acquireLock} from '../renderer/lock';
const cli=fileURLToPath(new URL('../dist/renderer.mjs',import.meta.url));
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jF1kAAAAASUVORK5CYII=','base64');
test('document validation rejects unsafe assets, malformed blocks and content outside budgets',()=>{
 for(const preset of ['blank','letter','report','brochure']){const d=newDesign(preset);assert.deepEqual(validateDesign(d),d);}
 const d=newDesign();d.blocks=[block('image')];
 assert.throws(()=>validateDesign(d,true),/Import an image/);
 for(const asset of ['https://example.com/logo.png','../../secret','file:///etc/passwd']){d.blocks[0].asset=asset;assert.throws(()=>validateDesign(d),/imported PNG/);}
 d.blocks=[block('table')];d.blocks[0].rows=[['one'],['two','three']];assert.throws(()=>validateDesign(d),/same number/);
 d.blocks=Array.from({length:81},()=>block('text'));assert.throws(()=>validateDesign(d),/80 blocks/);
 d.blocks=Array.from({length:40},()=>({...block('text'),text:'£'.repeat(4000)}));assert.throws(()=>validateDesign(d),/128 KiB/);
 d.blocks=[block('text')];d.blocks.push({...d.blocks[0]});assert.throws(()=>validateDesign(d),/Duplicate/);
 d.blocks=[{...block('heading'),text:'<b>Plain text</b>'}];Object.assign(d.blocks[0],{url:'discard'});Object.assign(d,{extra:'discard'});
 const clean=validateDesign(d);assert.equal('url' in clean.blocks[0],false);assert.equal('extra' in clean,false);
});

test('designer store isolates invoices, protects revisions and copies reusable templates',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'pdfstudio-design-store-'));const store=new DesignStore(dir);
 try {
  await writeFile(join(dir,'drafts.json'),'invoice data is independent');
  const original=newDesign('report'),saved=await store.save(original);assert.equal(saved.revision,1);assert.equal(original.revision,0);
  await assert.rejects(()=>store.save(original),/changed elsewhere/);
  const template=await store.template(saved),copy=await store.useTemplate(template.id);
  assert.notEqual(copy.id,template.id);assert.equal(copy.revision,0);assert.equal(copy.template,false);assert.deepEqual(copy.blocks,template.blocks);
  copy.blocks[0].text='Edited copy';await store.save(copy);assert.notEqual((await store.load(template.id)).blocks[0].text,'Edited copy');
  assert.equal((await store.list(true)).total,1);assert.equal((await store.list()).total,2);
  const release=await acquireLock(join(dir,'designs.lock'));try{await assert.rejects(()=>store.save(saved),/locked/);}finally{await release();}
  assert.equal(await readFile(join(dir,'drafts.json'),'utf8'),'invoice data is independent');
  await writeFile(join(dir,'designs.json'),'broken');await assert.rejects(()=>store.save(saved),/not been overwritten/);
  assert.equal(await readFile(join(dir,'designs.json'),'utf8'),'broken');
 } finally {await rm(dir,{recursive:true,force:true});}
});

test('image imports are bounded local copies with immutable content references',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'pdfstudio-images-'));const path=join(dir,'source.png');
 try {
  await writeFile(path,png);const imported=await importImage(dir,path);await rm(path);
  assert.equal((await imageData(dir,imported.asset)).width,1);
  await assert.rejects(()=>importImage(dir,'https://example.com/image.png'),/local image/);
  await assert.rejects(()=>imageData(dir,'../../passwd'),/Invalid image/);
  await symlink(join(dir,'assets',imported.asset),path);await assert.rejects(()=>importImage(dir,path));
  const huge=Buffer.from(png);huge.writeUInt32BE(8001,16);assert.throws(()=>imageInfo(huge),/12 megapixels/);
  await writeFile(join(dir,'assets',imported.asset),Buffer.concat([png,Buffer.from('changed')]));await assert.rejects(()=>imageData(dir,imported.asset),/has changed/);
  await rm(path);await writeFile(path,png);await importImage(dir,path);assert.equal((await imageData(dir,imported.asset)).width,1);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('shipped designer works without node_modules and renders all block types and fonts',{timeout:30000},async()=>{
 const dir=await mkdtemp(join(tmpdir(),'pdfstudio-design-dist-'));
 try {
  await cp(new URL('../dist',import.meta.url),join(dir,'dist'),{recursive:true});
  await cp(new URL('../renderer/fonts',import.meta.url),join(dir,'renderer/fonts'),{recursive:true});
  const run=(r:unknown)=>JSON.parse(execFileSync(process.execPath,[join(dir,'dist/renderer.mjs')],{cwd:dir,env:{...process.env,HOME:dir,XDG_DATA_HOME:join(dir,'data'),XDG_CACHE_HOME:join(dir,'cache')},input:JSON.stringify(r)+'\n',encoding:'utf8',timeout:25000}));
  const d=run({action:'designNew',preset:'report'}).document;assert.equal(d.blocks.length,6);
  const path=join(dir,'image.png');await writeFile(path,png);const imported=run({action:'designImport',path});assert.equal(imported.ok,true);await rm(path);
  d.blocks=[{...block('heading'),text:'Custom brochure',font:'serif'},
   {...block('text'),text:'Text in a mono font',font:'mono'},
   {...block('columns'),left:'Left column content',right:'Right column content'},
   {...block('image'),asset:imported.asset},block('divider'),block('spacer'),block('table'),block('pageBreak'),
   {...block('heading'),text:'Second page',font:'sans'}];
  const saved=run({action:'designSave',document:d}).document;assert.equal(saved.revision,1);
  const template=run({action:'designTemplate',document:saved}).template;
  const fresh=run({action:'designUseTemplate',id:template.id}).document;assert.notEqual(fresh.id,saved.id);
  const pdf=run({action:'designPreview',document:saved,page:2});assert.equal(pdf.ok,true);assert.ok(pdf.previewUrl,pdf.previewError);assert.equal(pdf.pages,2);assert.equal(pdf.page,2);
  const bytes=await readFile(pdf.path);assert.equal(bytes.subarray(0,5).toString(),'%PDF-');
  const text=execFileSync('/usr/bin/pdftotext',[pdf.path,'-'],{encoding:'utf8'});
  for(const phrase of ['Custom brochure','Text in a mono font','Left column content','Right column content','Second page','First item'])assert.ok(text.includes(phrase),text);
  assert.ok((await readFile(fileURLToPath(pdf.previewUrl))).length>100);
  const exported=run({action:'designExport',document:saved});assert.equal(exported.ok,true);assert.ok(exported.path.startsWith(join(dir,'Documents','PDF Studio')));
  assert.equal(run({action:'designList'}).total,1);assert.equal(run({action:'designList',template:true}).total,1);
  saved.schema=2;saved.layout='free';saved.pageCount=2;
  saved.blocks=saved.blocks.filter((b:any)=>b.type!=='pageBreak').map((b:any,i:number)=>({...b,frame:{page:1,x:20+(i%2)*250,y:20+Math.floor(i/2)*150,width:220,height:120}}));
  const free=run({action:'designSave',document:saved}).document;assert.equal(free.schema,2);
  assert.deepEqual(run({action:'designLoad',id:free.id}).document.blocks,free.blocks);
  const freePdf=run({action:'designPreview',document:free,page:2});assert.equal(freePdf.ok,true);assert.equal(freePdf.pages,2);assert.equal(freePdf.page,2);

 }finally{await rm(dir,{recursive:true,force:true});}
});
