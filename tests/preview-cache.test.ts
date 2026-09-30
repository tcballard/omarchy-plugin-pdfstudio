import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readdir,rm,symlink} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {trimPreviewCache} from '../renderer/preview';
test('automatic preview cache is bounded without deleting protected or unrelated files',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'pdfstudio-cache-'));
 try {
  await Promise.all(Array.from({length:140},(_,i)=>writeFile(join(dir,`preview-${i.toString(16)}.png`),'image')));
  await writeFile(join(dir,'personal.pdf'),'keep');
  await symlink(join(dir,'personal.pdf'),join(dir,'document-abc.pdf'));
  const current=join(dir,'preview-0.png');
  await trimPreviewCache(dir,[current]);
  const names=await readdir(dir);
  assert.equal(names.filter(n=>n.startsWith('preview-')).length,128);
  assert.ok(names.includes('preview-0.png'));
  assert.ok(names.includes('personal.pdf'));
  assert.ok(names.includes('document-abc.pdf'));
 }finally{await rm(dir,{recursive:true,force:true});}
});
