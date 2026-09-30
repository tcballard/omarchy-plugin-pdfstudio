import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {fresh} from '../renderer/model';

// Execute the actual root-level JavaScript functions in Panel.qml. Only the
// Process, Timer and ListModel interfaces are stubbed; no copied state logic.
const qml=readFileSync(new URL('../InvoicePanel.qml',import.meta.url),'utf8');
const functions=[...qml.matchAll(/^  function /gm)].map(match=>{
 const source=ts.createSourceFile('panel.js',qml.slice(match.index),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 assert.ok(ts.isFunctionDeclaration(source.statements[0]));
 return source.statements[0].getText(source);
}).join('\n');
function panel() {
 const items:any[]=[];
 const p:any={automaticPreview:false,backgroundPreview:false,renderSnapshot:"",autoPreview:{restart(){},stop(){}},colourPicker:{close(){}},doc:null,drafts:[],draftOffset:0,draftTotal:0,opened:true,dirty:false,status:'',outputPath:'',outputUrl:'',totalLabel:'',
  pendingAction:'',pendingDraftId:'',queuedAction:'',confirmAction:'',inFlight:false,helperStarted:false,receivedOutput:false,receivedExit:false,
  responseText:'',responseCode:-1,responseExitStatus:-1,
  worker:{action:'',payload:'',running:false,signal(n:number){this.running=false;}},
  followup:{running:false,start(){this.running=true;},restart(){this.running=true;},stop(){this.running=false;}},
  lines:{get count(){return items.length;},get(i:number){return items[i];},clear(){items.length=0;},append(x:unknown){items.push(x);}}
 };
 Object.defineProperty(p,'editingBusy',{get:()=>p.busy&&!p.backgroundPreview});
 Object.defineProperty(p,'busy',{get:()=>p.inFlight||p.worker.running||p.followup.running});p.root=p;
 vm.createContext(p);vm.runInContext(functions,p);p.setDoc(fresh());return p;
}
function output(p:any,value:unknown){p.receiveOutput(JSON.stringify(value));}
function exit(p:any,code=0,status=0){p.worker.running=false;p.receiveExit(code,status);}
function tick(p:any){p.runFollowup();}

test('panel waits for output and successful exit in either signal order',()=>{
 for(const outputFirst of [true,false]) {
  const p=panel();p.doc.company='Edits';p.dirty=true;p.pendingAction='preview';p.request('save');
  const saved={...fresh(),company:'Saved',revision:1,number:'INV-1'};
  if(outputFirst) {output(p,{ok:true,draft:saved});assert.equal(p.doc.company,'Edits');exit(p);}
  else {exit(p);assert.equal(p.doc.company,'Edits');output(p,{ok:true,draft:saved});}
  assert.equal(p.doc.company,'Saved');assert.equal(p.dirty,false);assert.equal(p.busy,true);
  p.request('new');assert.equal(p.worker.action,'save'); // Queued preview owns the next turn.
  tick(p);assert.equal(p.worker.action,'preview');assert.equal(p.inFlight,true);
 }
});

test('crash, invalid output and timeout preserve edits and cancel follow-ups',()=>{
 for(const failure of ['crash','invalid','incomplete','timeout','domain']) {
  const p=panel();p.dirty=true;p.doc.company='Keep me';p.pendingAction='export';p.request('save');
  if(failure==='crash') {output(p,{ok:true,draft:{...fresh(),company:'Must not apply'}});exit(p,0,1);}
  if(failure==='incomplete') {output(p,{ok:true,draft:{id:'broken'}});exit(p);}
  if(failure==='invalid') {p.receiveOutput('not json');exit(p);}
  if(failure==='timeout') {
   p.abortRequest('Timed out');output(p,{ok:true,draft:fresh()});exit(p); // Ignore late completion.
  }
  if(failure==='domain') {output(p,{ok:false,error:'Storage failed'});exit(p,1);}
  assert.equal(p.doc.company,'Keep me');assert.equal(p.dirty,true);assert.equal(p.pendingAction,'');
  assert.equal(p.queuedAction,'');assert.equal(p.busy,false);
 }
});

test('failed discard-and-load keeps unsaved edits; retry uses selected ID',()=>{
 const p=panel();p.dirty=true;p.doc.company='Unsaved';const selected=fresh();
 p.drafts=[{id:selected.id,number:'INV-2'}];p.transition('load',0);
 assert.equal(p.confirmAction,'load');p.discardChanges();
 assert.equal(JSON.parse(p.worker.payload).id,selected.id);
 output(p,{ok:false,error:'Draft no longer exists'});exit(p,1);
 assert.equal(p.dirty,true);assert.equal(p.doc.company,'Unsaved');
 p.request('load');output(p,{ok:true,draft:selected});exit(p);
 assert.equal(p.doc.id,selected.id);assert.equal(p.dirty,false);
});

test('host hide cancels queued navigation while allowing an explicit save to finish',()=>{
 const p=panel();p.doc.company='Saved while hidden';p.dirty=true;p.pendingAction='export';p.request('save');
 p.close();const saved={...p.doc,revision:1,number:'INV-1'};output(p,{ok:true,draft:saved});exit(p);
 assert.equal(p.doc.revision,1);assert.equal(p.opened,false);assert.equal(p.followup.running,false);
 assert.equal(p.pendingAction,'');assert.equal(p.queuedAction,'');
});

test('discard-and-close clears the editor; cancel does not start a request',()=>{
 const p=panel();p.dirty=true;p.transition('close');p.confirmAction='';
 assert.equal(p.dirty,true);assert.equal(p.busy,false);assert.equal(p.opened,true);
 p.transition('close');p.discardChanges();assert.equal(p.doc,null);assert.equal(p.dirty,false);assert.equal(p.opened,false);
});

test('live invoice preview does not save or number the draft and cannot apply stale output',()=>{
 const p=panel();p.edit('company','Studio');p.request('preview',{automatic:true});
 assert.equal(JSON.parse(p.worker.payload).draft.number,'DRAFT');assert.equal(p.doc.number,'');assert.equal(p.editingBusy,false);
 p.edit('company','New studio');output(p,{ok:true,path:'/old.pdf',url:'file:///old.pdf',previewUrl:'file:///old.png',page:1,pages:1});exit(p);
 assert.equal(p.outputPath,'');assert.equal(p.doc.company,'New studio');assert.equal(p.showPdf,false);assert.equal(p.dirty,true);
});
