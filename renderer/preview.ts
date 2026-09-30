import {mkdir,chmod} from 'node:fs/promises';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile);
export async function previewPdf(path:string,page=1){
 const cache=join(process.env.XDG_CACHE_HOME||join(homedir(),'.cache'),'omarchy-pdf-studio');
 const base=join(cache,`preview-${randomUUID()}`);
 try {
  if(!Number.isInteger(page)||page<1||page>1000)throw Error('Invalid preview page.');
  await mkdir(cache,{recursive:true,mode:0o700});
  const {stdout}=await exec('/usr/bin/timeout',['--signal=KILL','10s','/usr/bin/pdfinfo',path],{timeout:12000,maxBuffer:8192,env:{...process.env,LC_ALL:'C'}});
  const pages=Number(/^Pages:\s+(\d+)\s*$/m.exec(stdout)?.[1]);
  if(!Number.isInteger(pages)||pages<1||pages>1000)throw Error('Preview supports up to 1,000 pages.');
  const selected=Math.min(page,pages);
  await exec('/usr/bin/timeout',['--signal=KILL','15s','/usr/bin/pdftoppm','-f',String(selected),'-l',String(selected),'-singlefile','-scale-to','1600','-png',path,base],{timeout:17000,maxBuffer:8192});
  await chmod(base+'.png',0o600);
  return {previewUrl:pathToFileURL(base+'.png').href,page:selected,pages};
 }catch(e:any){return {previewError:'PDF created, but its preview is unavailable. Check Poppler (pdfinfo and pdftoppm). '+String(e.message).slice(0,200)};}
}
