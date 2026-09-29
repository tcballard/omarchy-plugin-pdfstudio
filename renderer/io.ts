import {open} from 'node:fs/promises';
import {constants} from 'node:fs';

export const MAX_REQUEST_BYTES=256*1024;
export async function requestLine(input:NodeJS.ReadableStream):Promise<string> {
  const chunks:Buffer[]=[];let size=0;
  for await (const value of input) {
    const chunk=Buffer.isBuffer(value)?value:Buffer.from(value);
    const newline=chunk.indexOf(10);
    const part=newline<0?chunk:chunk.subarray(0,newline);
    size+=part.length;
    if(size>MAX_REQUEST_BYTES) throw Error('Request is too large.');
    chunks.push(part);
    if(newline>=0) return Buffer.concat(chunks,size).toString('utf8');
  }
  if(!size) throw Error('No request received.');
  return Buffer.concat(chunks,size).toString('utf8');
}

export async function readBounded(path:string,limit:number):Promise<string> {
  const file=await open(path,constants.O_RDONLY|constants.O_NONBLOCK);
  try {
    const info=await file.stat();
    if(!info.isFile() || info.size>limit) throw Error('Draft storage exceeds the supported size or is not a regular file.');
    const chunks:Buffer[]=[];let size=0;
    while(true) {
      const buffer=Buffer.alloc(Math.min(65536,limit+1-size));
      const {bytesRead}=await file.read(buffer,0,buffer.length,null);
      if(!bytesRead) break;
      size+=bytesRead;
      if(size>limit) throw Error('Draft storage exceeds the supported size.');
      chunks.push(buffer.subarray(0,bytesRead));
    }
    return Buffer.concat(chunks,size).toString('utf8');
  } finally {await file.close();}
}
