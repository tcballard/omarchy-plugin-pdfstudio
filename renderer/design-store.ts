import {mkdir,open,rename,unlink} from 'node:fs/promises';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {type Design,validateDesign,UUID} from './document';
import {readBounded} from './io';
import {acquireLock} from './lock';
export class DesignStore {
 constructor(readonly directory=join(process.env.XDG_DATA_HOME||join(homedir(),'.local/share'),'omarchy-pdf-studio')){}
 async read():Promise<Design[]> {
  try {
   const s=JSON.parse(await readBounded(join(this.directory,'designs.json'),16*1024*1024));
   if(!s||s.schema!==1||!Array.isArray(s.documents)||s.documents.length>128)throw Error('Invalid document collection.');
   const docs:Design[]=s.documents.map((d:unknown)=>validateDesign(d));
   if(new Set(docs.map(d=>d.id)).size!==docs.length)throw Error('Duplicate document identities.');return docs;
  }catch(e:any){if(e.code==='ENOENT')return [];throw Error('Cannot read documents. Existing data has not been overwritten. '+e.message);}
 }
 async list(template:unknown=false,offset:unknown=0){
  if(typeof template!=='boolean'||typeof offset!=='number'||!Number.isInteger(offset)||offset<0||offset>100||offset%50!==0)throw Error('Invalid document page.');
  const docs=(await this.read()).filter(d=>d.template===template);
  return {entries:docs.slice(offset,offset+50).map(({id,title,revision})=>({id,title,revision})),offset,total:docs.length};
 }
 async load(id:unknown){if(typeof id!=='string'||!UUID.test(id))throw Error('Invalid document ID.');const d=(await this.read()).find(d=>d.id===id);if(!d)throw Error('Document no longer exists.');return d;}
 async save(input:unknown){
  const d=validateDesign(input);await mkdir(this.directory,{recursive:true,mode:0o700});
  const release=await acquireLock(join(this.directory,'designs.lock'));
  try {
   const docs=await this.read(),index=docs.findIndex(x=>x.id===d.id);
   if((index<0&&d.revision!==0)||(index>=0&&docs[index].revision!==d.revision))throw Error('Document changed elsewhere. Reopen it before editing.');
   if(index<0&&docs.length>=128)throw Error('The library supports 128 documents and templates.');
   if(d.revision>=Number.MAX_SAFE_INTEGER)throw Error('Document revision limit reached.');
   d.revision++;if(index<0)docs.unshift(d);else docs[index]=d;
   const json=JSON.stringify({schema:1,documents:docs});if(Buffer.byteLength(json)>16*1024*1024)throw Error('Document library exceeds 16 MiB.');
   const temp=join(this.directory,`.designs-${randomUUID()}.tmp`);
   try {const file=await open(temp,'wx',0o600);try{await file.writeFile(json);await file.sync();}finally{await file.close();}
    await rename(temp,join(this.directory,'designs.json'));const dir=await open(this.directory);try{await dir.sync();}finally{await dir.close();}
   }finally{await unlink(temp).catch(()=>{});}
   return d;
  }finally{await release();}
 }
 async template(input:unknown){const d=validateDesign(input);return this.save({...d,id:randomUUID(),revision:0,template:true});}
 async useTemplate(id:unknown){const d=await this.load(id);if(!d.template)throw Error('Select a template.');return {...d,id:randomUUID(),revision:0,template:false};}
}
