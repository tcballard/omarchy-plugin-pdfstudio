import {open,mkdir,readdir,stat,rename,unlink} from 'node:fs/promises';
import {constants} from 'node:fs';
import {join,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {ASSET} from './document';
import {acquireLock} from './lock';
const MAX_IMAGE=4*1024*1024;
async function bytes(path:string){
 const f=await open(path,constants.O_RDONLY|constants.O_NONBLOCK|constants.O_NOFOLLOW);
 try {const s=await f.stat();if(!s.isFile()||s.size>MAX_IMAGE)throw Error('Choose a regular PNG/JPEG file smaller than 4 MiB.');
  const buffer=Buffer.alloc(MAX_IMAGE+1);let size=0;
  while(size<buffer.length){const r=await f.read(buffer,size,buffer.length-size,null);if(!r.bytesRead)break;size+=r.bytesRead;}
  if(size>MAX_IMAGE)throw Error('Image exceeds 4 MiB.');return buffer.subarray(0,size);
 }finally{await f.close();}
}
export function imageInfo(b:Buffer){
 let width=0,height=0,extension='';
 if(b.length>=33&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&b.toString('ascii',12,16)==='IHDR') {width=b.readUInt32BE(16);height=b.readUInt32BE(20);extension='png';}
 else if(b.length>4&&b[0]===255&&b[1]===216){
  let pos=2;
  while(pos+4<=b.length){if(b[pos++]!==255)break;while(b[pos]===255)pos++;const marker=b[pos++];if(marker===0xda||marker===0xd9)break;
   if(marker===1||(marker>=0xd0&&marker<=0xd7))continue;
   if(pos+2>b.length)break;const length=b.readUInt16BE(pos);if(length<2||pos+length>b.length)break;
   if([0xc0,0xc1,0xc2].includes(marker)&&length>=8){height=b.readUInt16BE(pos+3);width=b.readUInt16BE(pos+5);extension='jpg';break;}pos+=length;
  }
 }
 if(!extension||width<1||height<1||width>8000||height>8000||width*height>12000000)throw Error('Use a PNG/JPEG image up to 12 megapixels (8,000 pixels per side).');
 return {width,height,extension};
}
export async function importImage(directory:string,input:unknown){
 if(typeof input!=='string'||input.length>4096)throw Error('Choose a local image.');
 const path=input.startsWith('file:')?fileURLToPath(input):input;if(!isAbsolute(path))throw Error('Choose a local image with an absolute path.');
 const data=await bytes(path),info=imageInfo(data),asset=createHash('sha256').update(data).digest('hex')+'.'+info.extension;
 const dir=join(directory,'assets');await mkdir(dir,{recursive:true,mode:0o700});
 const release=await acquireLock(join(directory,'assets.lock'));
 try {
 const names=(await readdir(dir)).filter(name=>ASSET.test(name));if(!names.includes(asset)){
  if(names.length>=128)throw Error('The image library supports 128 imported images.');
  let total=0;for(const name of names)if(ASSET.test(name))total+=(await stat(join(dir,name))).size;
  if(total+data.length>128*1024*1024)throw Error('The image library exceeds 128 MiB.');
 }
 const temporary=join(dir,`.image-${randomUUID()}.tmp`);
 try {
  const file=await open(temporary,'wx',0o600);try{await file.writeFile(data);await file.sync();}finally{await file.close();}
  await rename(temporary,join(dir,asset));const folder=await open(dir);try{await folder.sync();}finally{await folder.close();}
 }finally{await unlink(temporary).catch(()=>{});}
 return {asset,...info};
 } finally {await release();}
}
export async function imageData(directory:string,asset:string){
 if(!ASSET.test(asset))throw Error('Invalid image reference.');
 const data=await bytes(join(directory,'assets',asset));const info=imageInfo(data);
 if(createHash('sha256').update(data).digest('hex')+'.'+info.extension!==asset)throw Error('Imported image has changed. Import it again.');
 return {src:`data:image/${info.extension==='jpg'?'jpeg':'png'};base64,${data.toString('base64')}`,...info};
}
