import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {previewPdf} from './preview';
import {newDesign,validateDesign} from './document';
import {DesignStore} from './design-store';
import {importImage} from './assets';
export async function designRequest(r:any){
 const store=new DesignStore();
 switch(r.action){
  case 'designNew':{const document=newDesign(r.preset??'blank');if((r.preset??'blank')==='blank'){document.schema=2;document.layout='free';document.pageCount=1;}return {document,assetBaseUrl:pathToFileURL(join(store.directory,'assets')+'/').href};}
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
   return {...result,...await previewPdf(path,page)};
  }
  default:throw Error('Unknown designer action.');
 }
}
