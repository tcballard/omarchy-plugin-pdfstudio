import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm,open} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {fresh,validate} from '../renderer/model';
import {Store,MAX_STORE_BYTES,MAX_DRAFTS} from '../renderer/store';
import {acquireLock} from '../renderer/lock';

const cli=fileURLToPath(new URL('../dist/renderer.mjs',import.meta.url));
test('validation projects only known invoice and line fields',()=>{
 const d={...fresh(),unexpected:'x'.repeat(100000)};
 Object.assign(d.items[0],{unexpected:{deep:'value'}});
 const clean=validate(d);
 assert.equal('unexpected' in clean,false);
 assert.equal('unexpected' in clean.items[0],false);
 assert.notEqual(clean.items,d.items);
});

test('distributed helper rejects oversized input without waiting for newline', {timeout:10000},async()=>{
 for(const payload of [Buffer.alloc(300000,120),Buffer.from('£'.repeat(150000))]) {
  const child=spawn(process.execPath,[cli],{stdio:['pipe','pipe','pipe']});
  child.stdin.on('error',()=>{});
  const result=new Promise<string>((resolve,reject)=>{
   let out='';child.stdout.on('data',chunk=>out+=chunk);
   child.once('error',reject);child.once('exit',()=>resolve(out));
  });
  const timer=setTimeout(()=>child.kill('SIGKILL'),3000);
  try {
   child.stdin.write(payload); // Deliberately keep the stream open.
   const out=JSON.parse(await result);
   assert.equal(out.ok,false);assert.match(out.error,/too large/);
  } finally {clearTimeout(timer);child.kill();}
 }
});

test('summaries are paged, details load separately, unknown fields never persist',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'pdfstudio-pages-'));const store=new Store(dir);
 try {
  const drafts=Array.from({length:52},(_,i)=>({...fresh(),number:`TEST-${i}`,revision:1,notes:'private details',unexpected:'discard'}));
  await writeFile(join(dir,'drafts.json'),JSON.stringify({schema:1,next:1,drafts}));
  const page=await store.list();assert.equal(page.total,52);assert.equal(page.drafts.length,50);
  assert.deepEqual(Object.keys(page.drafts[0]).sort(),['id','number']);
  assert.equal((await store.list(50)).drafts.length,2);
  assert.equal((await store.load(drafts[51].id)).notes,'private details');
  await assert.rejects(()=>store.list(-1),/Invalid draft page/);
  await assert.rejects(()=>store.list(1),/Invalid draft page/);
  await assert.rejects(()=>store.load(fresh().id),/no longer exists/);
  await store.save(drafts[0]);
  assert.equal((await readFile(join(dir,'drafts.json'),'utf8')).includes('unexpected'),false);
  // Exercise the shipped IPC contract as well as Store.
  const data=await mkdtemp(join(tmpdir(),'pdfstudio-ipc-'));
  try {
   const run=(r:unknown)=>JSON.parse(execFileSync(process.execPath,[cli],{env:{...process.env,XDG_DATA_HOME:data},input:JSON.stringify(r)+'\n',encoding:'utf8'}));
   const saved=run({action:'save',draft:fresh()}).draft;
   assert.deepEqual(run({action:'list'}).drafts,[{id:saved.id,number:saved.number}]);
   assert.equal(run({action:'load',id:saved.id}).draft.id,saved.id);
  } finally {await rm(data,{recursive:true,force:true});}
 } finally {await rm(dir,{recursive:true,force:true});}
});

test('storage size and count limits fail without overwriting data',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'pdfstudio-limits-'));const store=new Store(dir);const path=join(dir,'drafts.json');
 try {
  const file=await open(path,'w');await file.truncate(MAX_STORE_BYTES+1);await file.close();
  await assert.rejects(()=>store.save(fresh()),/not been overwritten/);
  const check=await open(path);assert.equal((await check.stat()).size,MAX_STORE_BYTES+1);await check.close();
  const drafts=Array.from({length:MAX_DRAFTS},(_,i)=>({...fresh(),number:`TEST-${i}`,revision:1}));
  await writeFile(path,JSON.stringify({schema:1,next:1,drafts}));
  await assert.rejects(()=>store.save(fresh()),/at most 1000/);
  drafts[0].notes='editable at capacity';await store.save(drafts[0]);
  assert.equal((await store.load(drafts[0].id)).notes,'editable at capacity');
  drafts.push({...fresh(),number:'ONE-TOO-MANY',revision:1});
  const invalid=JSON.stringify({schema:1,next:1,drafts});await writeFile(path,invalid);
  await assert.rejects(()=>store.save(fresh()),/not been overwritten/);
  assert.equal(await readFile(path,'utf8'),invalid);
 } finally {await rm(dir,{recursive:true,force:true});}
});

test('kernel lock excludes writers and accepts an old empty lock file',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'pdfstudio-lock-'));const store=new Store(dir);
 try {
  const path=join(dir,'write.lock');await writeFile(path,'');
  const release=await acquireLock(path);
  try {await assert.rejects(()=>store.save(fresh()),/locked/);} finally {await release();}
  const results=await Promise.allSettled([store.save(fresh()),store.save(fresh())]);
  assert.ok(results.some(r=>r.status==='fulfilled'));
  for(const r of results) if(r.status==='rejected') assert.match(r.reason.message,/locked/);
  const saved=await store.save(fresh());assert.ok(saved.number);
  const state=await store.read();assert.equal(new Set(state.drafts.map(d=>d.number)).size,state.drafts.length);
 } finally {await rm(dir,{recursive:true,force:true});}
});

test('killing a lock owner releases the lock without deleting the file',{timeout:10000},async()=>{
 const dir=await mkdtemp(join(tmpdir(),'pdfstudio-crash-'));const path=join(dir,'write.lock');
 const module=new URL('../renderer/lock.ts',import.meta.url).href;
 const child=spawn(process.execPath,['--import','tsx','--input-type=module','-e',
  `import {acquireLock} from ${JSON.stringify(module)};await acquireLock(${JSON.stringify(path)});process.stdout.write('ready');process.stdin.resume();`],{stdio:['pipe','pipe','pipe']});
 try {
  await new Promise<void>((resolve,reject)=>{child.stdout.once('data',()=>resolve());child.once('error',reject);child.once('exit',()=>reject(Error('Lock owner exited before ready')));});
  await assert.rejects(()=>new Store(dir).save(fresh()),/locked/);
  const exit=new Promise<void>(resolve=>child.once('exit',()=>resolve()));child.kill('SIGKILL');await exit;
  let saved=false;
  for(let i=0;i<20;i++) {
   try {await new Store(dir).save(fresh());saved=true;break;} catch(e:any) {if(!/locked/.test(e.message)) throw e;await new Promise(r=>setTimeout(r,50));}
  }
  assert.equal(saved,true);
  assert.equal(await readFile(path,'utf8'),'');
 } finally {child.kill('SIGKILL');await rm(dir,{recursive:true,force:true});}
});
