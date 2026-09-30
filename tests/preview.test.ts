import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {previewPdf} from '../renderer/preview';
import {fresh} from '../renderer/model';
import {renderInvoice} from '../renderer/invoice';

test('shared preview selects invoice pages and reports an unwritable cache without losing the PDF',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'pdfstudio-preview-'));const previous=process.env.XDG_CACHE_HOME;
 try{
  process.env.XDG_CACHE_HOME=join(dir,'cache');
  const d=fresh();d.number='TEST';d.company='Studio';d.customer='Client';
  d.items=Array.from({length:100},(_,i)=>({description:`Line ${i+1}`,quantity:'1',price:'10.00'}));
  const path=join(dir,'invoice.pdf');await writeFile(path,await renderInvoice(d));
  const page=await previewPdf(path,2);assert.ok(page.previewUrl,page.previewError);assert.equal(page.page,2);assert.ok(page.pages!>1);
  const blocked=join(dir,'blocked');await writeFile(blocked,'not a directory');process.env.XDG_CACHE_HOME=blocked;
  const failed=await previewPdf(path);assert.ok(failed.previewError);assert.equal(failed.previewUrl,undefined);
 }finally{if(previous===undefined)delete process.env.XDG_CACHE_HOME;else process.env.XDG_CACHE_HOME=previous;await rm(dir,{recursive:true,force:true});}
});
