import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {newDesign,BLOCK_TYPES,validateDesign} from '../renderer/document';
const qml=readFileSync(new URL('../Designer.qml',import.meta.url),'utf8');
const functions=[...qml.matchAll(/^  function /gm)].map(match=>{
 const source=ts.createSourceFile('designer.js',qml.slice(match.index),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 assert.ok(ts.isFunctionDeclaration(source.statements[0]));return source.statements[0].getText(source);
}).join('\n');
function panel(){
 const p:any={doc:null,opened:true,dirty:false,selectedIndex:-1,undoStack:[],redoStack:[],editGroup:'',types:BLOCK_TYPES,
  status:'',outputUrl:'',previewUrl:'',previewStale:false,previewPage:1,previewPages:1,entries:[],entryOffset:0,entryTotal:0,showTemplates:false,
  confirmAction:'',transitionArgs:{},queuedAction:'',queuedArgs:{},importTarget:'',inFlight:false,helperStarted:false,receivedOutput:false,receivedExit:false,responseText:'',responseCode:-1,responseExitStatus:-1,
  invoicesRequested(){p.switched=true;},imagePicker:{close(){}},coalesce:{restart(){}},
  worker:{action:'',payload:'',running:false,signal(){this.running=false;}},
  followup:{running:false,start(){this.running=true;},restart(){this.running=true;},stop(){this.running=false;}}
 };
 Object.defineProperty(p,'busy',{get:()=>p.inFlight||p.worker.running||p.followup.running});
 Object.defineProperty(p,'selected',{get:()=>p.doc?.blocks[p.selectedIndex]??null});p.root=p;
 vm.createContext(p);vm.runInContext(functions,p);p.setDoc(newDesign());return p;
}
function output(p:any,r:unknown){p.receiveOutput(JSON.stringify(r));}
function exit(p:any,code=0,status=0){p.worker.running=false;p.receiveExit(code,status);}
test('designer block edits, reordering and undo preserve identity and the latest save revision',()=>{
 const p=panel();for(const type of BLOCK_TYPES)p.addBlock(type);assert.equal(p.doc.blocks.length,8);validateDesign(p.doc);
 p.selectedIndex=1;const id=p.selected.id;p.blockEdit('text','First');p.blockEdit('text','Second');p.history(false);assert.notEqual(p.selected.text,'First');p.history(true);assert.equal(p.selected.text,'Second');
 p.moveBlock(1);assert.equal(p.selected.id,id);assert.equal(p.selectedIndex,2);
 p.duplicateBlock();assert.notEqual(p.selected.id,id);p.removeBlock();
 p.request('designSave');const saved={...p.doc,revision:1};output(p,{ok:true,document:saved});assert.equal(p.doc.revision,0);exit(p);
 p.queuedAction='';p.followup.stop();p.history(false);assert.equal(p.doc.revision,1);assert.equal(p.dirty,true);assert.equal(p.previewStale,true);
});
test('designer waits for both completion signals, rejects crashes and keeps failed discard edits',()=>{
 for(const outputFirst of [true,false]){
  const p=panel();p.edit('title','Keep edits');p.transition('designLoad',{id:newDesign().id});p.discardChanges();
  if(outputFirst){output(p,{ok:false,error:'Missing document'});exit(p,1);}else{exit(p,1);output(p,{ok:false,error:'Missing document'});}
  assert.equal(p.doc.title,'Keep edits');assert.equal(p.dirty,true);assert.equal(p.busy,false);
 }
 for(const kind of ['crash','invalid','incomplete','timeout']){
  const p=panel();p.edit('title','Keep edits');p.request('designSave');
  if(kind==='crash'){output(p,{ok:true,document:newDesign()});exit(p,0,1);}
  if(kind==='invalid'){p.receiveOutput('bad');exit(p);}
  if(kind==='incomplete'){output(p,{ok:true,document:{id:'bad'}});exit(p);}
  if(kind==='timeout'){p.abortRequest('Timeout');output(p,{ok:true,document:newDesign()});exit(p);}
  assert.equal(p.doc.title,'Keep edits');assert.equal(p.dirty,true);assert.equal(p.busy,false);
 }
});
test('switching to invoices saves first and host hide cancels queued navigation',()=>{
 for(const hidden of [false,true]){
  const p=panel();p.edit('title','My design');p.transition('invoices');assert.equal(p.confirmAction,'invoices');p.saveThenContinue();
  if(hidden)p.close();exit(p);output(p,{ok:true,document:{...p.doc,revision:1}});p.runFollowup();
  assert.equal(p.doc.revision,1);assert.equal(p.opened,false);assert.equal(!!p.switched,!hidden);
 }
});
test('import applies to its original block, is undoable and invalidates old PDF links',()=>{
 const p=panel();p.addBlock('image');p.importTarget=p.selected.id;p.addBlock('text');p.outputUrl='file:///old.pdf';p.request('designImport',{path:'file:///image.png'});
 output(p,{ok:true,asset:'a'.repeat(64)+'.png'});exit(p);assert.equal(p.doc.blocks[0].asset,'a'.repeat(64)+'.png');assert.equal(p.doc.blocks[1].type,'text');assert.equal(p.outputUrl,'');p.history(false);assert.equal(p.doc.blocks[0].asset,'');
});
