import {mkdir,open,rename,unlink} from 'node:fs/promises';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {type Invoice,validate} from './model';
import {readBounded} from './io';
import {acquireLock} from './lock';

export const MAX_STORE_BYTES=16*1024*1024;
export const MAX_DRAFTS=1000;
export const PAGE_SIZE=50;

interface State {schema:1; next:number; drafts:Invoice[]}
export class Store {
  constructor(readonly directory=join(process.env.XDG_DATA_HOME || join(homedir(),'.local/share'),'omarchy-pdf-studio')) {}
  async read(): Promise<State> {
    try {
      const s=JSON.parse(await readBounded(join(this.directory,'drafts.json'),MAX_STORE_BYTES));
      if(!s || s.schema!==1 || !Number.isSafeInteger(s.next) || s.next<1 || s.next>=Number.MAX_SAFE_INTEGER || !Array.isArray(s.drafts) || s.drafts.length>MAX_DRAFTS) throw Error('Invalid data format.');
      const drafts:Invoice[]=s.drafts.map((d:unknown)=>validate(d));
      if(new Set(drafts.map(d=>d.id)).size!==drafts.length || new Set(drafts.map(d=>d.number)).size!==drafts.length) throw Error('Duplicate draft identities or invoice numbers.');
      return {schema:1,next:s.next,drafts};
    } catch(e:any) {if(e.code==='ENOENT') return {schema:1,next:1,drafts:[]}; throw Error('Cannot read saved drafts. Your data has not been overwritten. '+e.message);}
  }
  async list(offset:unknown=0) {
    if(typeof offset!=='number' || !Number.isSafeInteger(offset) || offset<0 || offset>=MAX_DRAFTS || offset%PAGE_SIZE!==0) throw Error('Invalid draft page.');
    const {drafts}=await this.read();
    return {drafts:drafts.slice(offset,offset+PAGE_SIZE).map(({id,number})=>({id,number})),offset,total: drafts.length};
  }
  async load(id:unknown) {
    if(typeof id!=='string' || id.length!==36) throw Error('Invalid draft identity.');
    const d=(await this.read()).drafts.find(d=>d.id===id);
    if(!d) throw Error('Draft no longer exists. Refresh the saved drafts.');
    return d;
  }
  async save(input:unknown) {
    const d=structuredClone(validate(input));
    await mkdir(this.directory,{recursive:true,mode:0o700});
    const release=await acquireLock(join(this.directory,'write.lock'));
    try {
      const state=await this.read(); const index=state.drafts.findIndex(x=>x.id===d.id);
      if ((index>=0 && state.drafts[index].revision!==d.revision) || (index<0 && d.revision!==0)) throw Error('This draft changed elsewhere. Reopen the saved draft before editing.');
      if (!d.number.trim()) {
        do {d.number=`INV-${String(state.next++).padStart(5,'0')}`;} while(state.drafts.some(x=>x.number===d.number));
      }
      if(state.drafts.some(x=>x.id!==d.id && x.number===d.number)) throw Error('That invoice number is already used by another draft.');
      if(index<0 && state.drafts.length>=MAX_DRAFTS) throw Error('Draft storage supports at most 1000 invoices. Existing drafts can still be edited.');
      if(state.next>=Number.MAX_SAFE_INTEGER) throw Error('Invoice numbering limit reached.');
      if(d.revision>=Number.MAX_SAFE_INTEGER) throw Error('Draft revision limit reached.');
      d.revision++;
      if(index<0) state.drafts.unshift(d); else state.drafts[index]=d;
      const json=JSON.stringify(state);
      if(Buffer.byteLength(json)>MAX_STORE_BYTES) throw Error('Draft storage exceeds the 16 MiB limit. Your data has not been overwritten.');
      const temp=join(this.directory,`.drafts-${randomUUID()}.tmp`);
      try {
        const file=await open(temp,'wx',0o600);
        try {await file.writeFile(json);await file.sync();} finally {await file.close();}
        await rename(temp,join(this.directory,'drafts.json'));
        const directory=await open(this.directory,'r');
        try {await directory.sync();} finally {await directory.close();}
      }
      finally {await unlink(temp).catch(()=>{});}
      return d;
    } finally {await release();}
  }
}
