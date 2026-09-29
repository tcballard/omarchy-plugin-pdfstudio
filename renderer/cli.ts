import {requestLine,reply,errorReply} from './io';
import {pathToFileURL} from 'node:url';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {Store} from './store';
import {fresh,validate,totals,money} from './model';

// One JSON request on stdin. No shell evaluation, web server or network requests.
process.umask(0o077);
const timer=setTimeout(()=>{reply(errorReply('Operation timed out.'));process.exit(1);},45000);
try {
    const line=await requestLine(process.stdin);
    const r=JSON.parse(line);
    if(!r || typeof r!=='object' || Array.isArray(r) || typeof r.action!=='string') throw Error('Invalid request.');
    const store=new Store();let result;
    switch(r.action) {
      case 'list':result=await store.list(r.offset ?? 0);break;
      case 'load':result={draft:await store.load(r.id)};break;
      case 'new':result={draft:fresh()};break;
      case 'save':result={draft:await store.save(r.draft)};break;
      case 'total':{const d=validate(r.draft);const t=totals(d);result={total:money(t.total,d.currency),subtotal:money(t.subtotal,d.currency),tax:money(t.tax,d.currency)};break;}
      case 'preview':case 'export':{
        const d=validate(r.draft,true);
        if(!d.number) throw Error('Save this draft to assign its invoice number first.');
        const {renderInvoice}=await import('./invoice');
        const bytes=await renderInvoice(d);
        const dir=r.action==='preview'?join(process.env.XDG_CACHE_HOME||join(homedir(),'.cache'),'omarchy-pdf-studio'):join(homedir(),'Documents','PDF Studio');
        await mkdir(dir,{recursive:true,mode:0o700});
        const path=join(dir,`invoice-${d.id}-${randomUUID()}.pdf`);
        await writeFile(path,bytes,{flag:'wx',mode:0o600});result={path,url:pathToFileURL(path).href};break;
      }
      default:throw Error('Unknown action.');
    }
    reply({ok:true,...result});
} catch(e:any) {reply(errorReply(e.message||'Operation failed.'));process.exitCode=1;}
finally {clearTimeout(timer);process.stdin.destroy();}
