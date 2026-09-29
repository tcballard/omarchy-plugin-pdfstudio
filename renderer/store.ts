import {mkdir,readFile,writeFile,rename,open,unlink} from 'node:fs/promises';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {type Invoice,validate} from './model';

interface State {schema:1; next:number; drafts:Invoice[]}
export class Store {
  constructor(readonly directory=join(process.env.XDG_DATA_HOME || join(homedir(),'.local/share'),'omarchy-pdf-studio')) {}
  async read(): Promise<State> {
    try {
      const s=JSON.parse(await readFile(join(this.directory,'drafts.json'),'utf8'));
      if(s.schema!==1 || !Number.isSafeInteger(s.next) || s.next<1 || !Array.isArray(s.drafts)) throw Error('Invalid data format.');
      s.drafts.forEach((d:unknown)=>validate(d)); return s;
    } catch(e:any) {if(e.code==='ENOENT') return {schema:1,next:1,drafts:[]}; throw Error('Cannot read saved drafts. Your data has not been overwritten. '+e.message);}
  }
  async save(input:unknown) {
    const d=structuredClone(validate(input));
    await mkdir(this.directory,{recursive:true,mode:0o700});
    let lock;
    try {lock=await open(join(this.directory,'write.lock'),'wx',0o600);} catch {throw Error('Draft storage is locked. Another save may be running; retry shortly.');}
    try {
      const state=await this.read(); const index=state.drafts.findIndex(x=>x.id===d.id);
      if ((index>=0 && state.drafts[index].revision!==d.revision) || (index<0 && d.revision!==0)) throw Error('This draft changed elsewhere. Reopen the saved draft before editing.');
      if (!d.number.trim()) {
        do {d.number=`INV-${String(state.next++).padStart(5,'0')}`;} while(state.drafts.some(x=>x.number===d.number));
      }
      if(state.drafts.some(x=>x.id!==d.id && x.number===d.number)) throw Error('That invoice number is already used by another draft.');
      d.revision++;
      if(index<0) state.drafts.unshift(d); else state.drafts[index]=d;
      const temp=join(this.directory,`.drafts-${randomUUID()}.tmp`);
      try {await writeFile(temp,JSON.stringify(state,null,2),{mode:0o600});await rename(temp,join(this.directory,'drafts.json'));}
      finally {await unlink(temp).catch(()=>{});}
      return d;
    } finally {await lock.close();await unlink(join(this.directory,'write.lock'));}
  }
}
