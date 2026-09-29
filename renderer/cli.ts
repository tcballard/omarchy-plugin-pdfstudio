import {createInterface} from 'node:readline';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {Store} from './store';
import {fresh,validate,totals,money} from './model';

// One JSON request on stdin. No shell evaluation, web server or network requests.
process.umask(0o077);
const timer=setTimeout(()=>{console.log(JSON.stringify({ok:false,error:'Operation timed out.'}));process.exit(1);},45000);
const lines=createInterface({input:process.stdin});
try {
  for await (const line of lines) {
    if(line.length>262144) throw Error('Request is too large.');
    const r=JSON.parse(line);const store=new Store();let result;
    switch(r.action) {
      case 'list':result={drafts:(await store.read()).drafts};break;
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
        await writeFile(path,bytes,{flag:'wx',mode:0o600});result={path};break;
      }
      default:throw Error('Unknown action.');
    }
    console.log(JSON.stringify({ok:true,...result}));break;
  }
} catch(e:any) {console.log(JSON.stringify({ok:false,error:e.message||'Operation failed.'}));process.exitCode=1;}
finally {clearTimeout(timer);lines.close();process.stdin.destroy();}
