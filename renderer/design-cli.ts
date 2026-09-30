import {mkdir,writeFile,chmod} from 'node:fs/promises';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {newDesign,validateDesign} from './document';
import {DesignStore} from './design-store';
import {importImage} from './assets';
const exec=promisify(execFile);
export async function designRequest(r:any){
 const store=new DesignStore();
 switch(r.action){
  case 'designNew':return {document:newDesign(r.preset??'blank'),assetBaseUrl:pathToFileURL(join(store.directory,'assets')+'/').href};
  case 'designList':return store.list(r.template??false,r.offset??0);
  case 'designLoad':return {document:await store.load(r.id),assetBaseUrl:pathToFileURL(join(store.directory,'assets')+'/').href};
  case 'designSave':return {document:await store.save(r.document)};
  case 'designTemplate':return {template:await store.template(r.document)};
  case 'designUseTemplate':return {document:await store.useTemplate(r.id)};
  case 'designImport':return importImage(store.directory,r.path);
  case 'designPreview':case 'designExport':{
   const d=validateDesign(r.document,true);
   const page=r.page??1;if(!Number.isInteger(page)||page<1||page>1000)throw Error('Invalid preview page.');
   const {renderDesign}=await import('./design-render');const data=await renderDesign(d,store.directory);
   const dir=r.action==='designExport'?join(homedir(),'Documents','PDF Studio'):join(process.env.XDG_CACHE_HOME||join(homedir(),'.cache'),'omarchy-pdf-studio');
   await mkdir(dir,{recursive:true,mode:0o700});const base=join(dir,`document-${d.id}-${randomUUID()}`),path=base+'.pdf';
   await writeFile(path,data,{flag:'wx',mode:0o600});const result={path,url:pathToFileURL(path).href};
   // Export and preview share the same on-screen result. Keep raster files in cache.
   const cache=join(process.env.XDG_CACHE_HOME||join(homedir(),'.cache'),'omarchy-pdf-studio');
   const rasterBase=join(cache,`preview-${randomUUID()}`);
   try {
    await mkdir(cache,{recursive:true,mode:0o700});
    const {stdout}=await exec('/usr/bin/timeout',['--signal=KILL','10s','/usr/bin/pdfinfo',path],{timeout:12000,maxBuffer:8192,env:{...process.env,LC_ALL:'C'}});
    const match=/^Pages:\s+(\d+)\s*$/m.exec(stdout),pages=Number(match?.[1]);if(!Number.isInteger(pages)||pages<1||pages>1000)throw Error('Preview supports up to 1,000 pages.');
    const selected=Math.min(page,pages);
    await exec('/usr/bin/timeout',['--signal=KILL','15s','/usr/bin/pdftoppm','-f',String(selected),'-l',String(selected),'-singlefile','-scale-to','1200','-png',path,rasterBase],{timeout:17000,maxBuffer:8192});
    await chmod(rasterBase+'.png',0o600);return {...result,previewUrl:pathToFileURL(rasterBase+'.png').href,page:selected,pages};
   }catch(e:any){return {...result,previewError:'PDF is ready, but inline preview is unavailable. Check that Poppler (pdfinfo and pdftoppm) is installed. '+String(e.message).slice(0,200)};}
  }
  default:throw Error('Unknown designer action.');
 }
}
