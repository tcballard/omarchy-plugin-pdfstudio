import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {newDesign,block,validateDesign,type Design} from '../renderer/document';
import {DesignStore} from '../renderer/design-store';
import {renderDesign} from '../renderer/design-render';
function design():Design {return {...newDesign(),schema:2,layout:'free',pageCount:3,blocks:[{...block('heading'),text:'Placement',frame:{page:2,x:100,y:120,width:300,height:80}}]};}
test('free geometry validates finite coordinates, page membership and page bounds without changing flow documents',()=>{
 const d=design();assert.deepEqual(validateDesign(d),d);const old=newDesign('report');assert.deepEqual(validateDesign(old),old);
 for(const mutation of [(x:Design)=>x.pageCount=0,(x:Design)=>x.pageCount=51,(x:Design)=>x.blocks[0].frame!.x=NaN,(x:Design)=>x.blocks[0].frame!.height=Infinity,(x:Design)=>x.blocks[0].frame!.x=-1,(x:Design)=>x.blocks[0].frame!.width=800,(x:Design)=>x.blocks[0].frame!.y=840,(x:Design)=>x.blocks[0].frame!.page=1.5,(x:Design)=>x.blocks[0].frame!.page=4,(x:Design)=>delete x.blocks[0].frame,(x:Design)=>x.blocks[0].type='pageBreak']){
  const invalid=design();mutation(invalid);assert.throws(()=>validateDesign(invalid));
 }
 const wide=design();wide.page.orientation='landscape';wide.blocks[0].frame={page:1,x:600,y:100,width:200,height:80};assert.doesNotThrow(()=>validateDesign(wide));
});
test('saving and reusing free-layout templates retains page geometry and layer order',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'pdfstudio-free-store-'));
 try {const store=new DesignStore(directory),d=design();d.blocks.push({...block('divider'),frame:{page:1,x:10,y:20,width:120,height:12}});
  const saved=await store.save(d),template=await store.template(saved),copy=await store.useTemplate(template.id);
  assert.deepEqual(copy.blocks,d.blocks);assert.equal(copy.pageCount,3);assert.equal(copy.layout,'free');assert.notEqual(copy.id,d.id);
  copy.blocks[0].frame!.x=200;await store.save(copy);assert.equal((await store.load(template.id)).blocks[0].frame!.x,100);
 }finally{await rm(directory,{recursive:true,force:true});}
});
test('PDF preserves absolute placement, blank pages, clipping and overlapping layer order',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'pdfstudio-free-render-'));
 try {
  const d=design();d.blocks.push({...block('divider'),color:'#ff0000',frame:{page:1,x:50,y:70,width:160,height:40}},
   {...block('divider'),color:'#0000ff',frame:{page:1,x:100,y:80,width:30,height:20}},
   {...block('text'),text:'CLIPPED CONTENT '.repeat(80),frame:{page:1,x:350,y:100,width:100,height:20}});
  const path=join(directory,'free.pdf');await writeFile(path,await renderDesign(d,directory));
  const info=execFileSync('/usr/bin/pdfinfo',[path],{encoding:'utf8'});assert.match(info,/Pages:\s+3/);
  const bbox=execFileSync('/usr/bin/pdftotext',['-bbox',path,'-'],{encoding:'utf8'});
  const match=/<word xMin="([\d.]+)" yMin="([\d.]+)"[^>]*>Placement<\/word>/.exec(bbox);assert.ok(match);assert.equal(Number(match[1]),100);assert.ok(Number(match[2])>=120 && Number(match[2])<130);
  const ppm=execFileSync('/usr/bin/pdftoppm',['-r','72','-f','1','-l','1','-singlefile',path],{maxBuffer:8*1024*1024});
  const header=/^P6\n(\d+) (\d+)\n255\n/.exec(ppm.subarray(0,80).toString());assert.ok(header);const width=Number(header[1]),offset=header[0].length;
  const pixel=(x:number,y:number)=>[...ppm.subarray(offset+(y*width+x)*3,offset+(y*width+x)*3+3)];
  assert.deepEqual(pixel(60,80),[255,0,0]);assert.deepEqual(pixel(110,90),[0,0,255]);assert.deepEqual(pixel(40,80),[255,255,255]);
  for(let y=125;y<200;y++)for(let x=350;x<450;x++)assert.deepEqual(pixel(x,y),[255,255,255],'Text escaped its frame');
  // Large tables remain on their explicit page, even when their content exceeds the frame.
  d.blocks=[{...block('table'),rows:Array.from({length:40},()=>['A long cell '.repeat(15),'B']),frame:{page:1,x:50,y:50,width:400,height:80}}];
  await writeFile(path,await renderDesign(d,directory));assert.match(execFileSync('/usr/bin/pdfinfo',[path],{encoding:'utf8'}),/Pages:\s+3/);
 }finally{await rm(directory,{recursive:true,force:true});}
});
