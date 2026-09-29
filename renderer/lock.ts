import {open} from 'node:fs/promises';
import {spawn} from 'node:child_process';

// util-linux flock is part of Omarchy. Keep the inode: removing a lock file
// lets concurrent writers lock different inodes. The kernel releases this lock
// on exit, including when a killed parent closes the child's stdin pipe.
export async function acquireLock(path:string):Promise<()=>Promise<void>> {
  const file=await open(path,'a',0o600);await file.close();
  const child=spawn('/usr/bin/flock',['--exclusive','--nonblock',path,process.execPath,'-e',
    "process.stdin.resume();process.stdout.write('locked\\n');"],{stdio:['pipe','pipe','ignore']});
  let failure:Error|undefined;
  child.stdin.on('error',()=>{});
  const exited=new Promise<void>(resolve=>{
    child.once('error',e=>{failure=e;resolve();});
    child.once('exit',()=>resolve());
  });
  try {
    await new Promise<void>((resolve,reject)=>{
      child.stdout.once('data',()=>resolve());
      void exited.then(()=>reject(failure || Error('Draft storage is locked. Another save may be running; retry shortly.')));
    });
  } catch(e) {child.stdin.end();await exited;throw e;}
  return async()=>{child.stdin.end();await exited;};
}
