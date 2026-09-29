import {randomUUID} from 'node:crypto';
export const BLOCK_TYPES=['heading','text','image','table','divider','spacer','columns','pageBreak'] as const;
export type BlockType=typeof BLOCK_TYPES[number];
export interface Block {
 id:string;type:BlockType;font:'sans'|'serif'|'mono';size:number;bold:boolean;color:string;align:'left'|'center'|'right';spacing:number;
 text?:string;left?:string;right?:string;rows?:string[][];header?:boolean;asset?:string;width?:number;height?:number;
}
export interface Design {
 schema:1;id:string;revision:number;title:string;template:boolean;
 page:{size:'A4'|'Letter';orientation:'portrait'|'landscape';margin:number;background:string};blocks:Block[];
}
export function block(type:BlockType):Block {
 const b:Block={id:randomUUID(),type,font:'sans',size:type==='heading'?26:11,bold:type==='heading',color:'#18212b',align:'left',spacing:12};
 if(type==='heading'||type==='text')b.text=type==='heading'?'Your heading':'Write your text here.';
 if(type==='columns'){b.left='Left column';b.right='Right column';}
 if(type==='table'){b.rows=[['Item','Details'],['First item','Description']];b.header=true;}
 if(type==='image'){b.asset='';b.width=100;b.height=180;b.text='';}
 if(type==='divider'||type==='spacer')b.height=type==='divider'?1:24;
 return b;
}
export function newDesign(preset:unknown='blank'):Design {
 const d:Design={schema:1,id:randomUUID(),revision:0,title:'Untitled document',template:false,page:{size:'A4',orientation:'portrait',margin:40,background:'#ffffff'},blocks:[]};
 if(preset==='letter') {d.title='Letter';d.blocks=[{...block('heading'),text:'Your name'},{...block('text'),text:'Your address\nDate'},{...block('text'),text:'Dear recipient,\n\nWrite your letter here.\n\nYours sincerely,\nYour name'}];}
 else if(preset==='report'){d.title='Report';d.blocks=[{...block('heading'),text:'Report title'},{...block('text'),text:'Prepared by your team'},{...block('divider')},{...block('heading'),size:18,text:'Summary'},block('text'),block('table')];}
 else if(preset==='brochure'){d.title='Brochure';d.page.orientation='landscape';d.blocks=[{...block('heading'),size:36,text:'Your next big idea'},block('text'),block('columns')];}
 else if(preset!=='blank')throw Error('Unknown starting template.');
 return d;
}
export const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const ASSET=/^[0-9a-f]{64}\.(png|jpg)$/;
function text(v:unknown,max:number,label:string):string {if(typeof v!=='string'||v.length>max)throw Error(`${label} must be at most ${max} characters.`);return v;}
function num(v:unknown,min:number,max:number,label:string):number {if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw Error(`Invalid ${label}.`);return v;}
function color(v:unknown):string {if(typeof v!=='string'||!/^#[0-9a-f]{6}$/i.test(v))throw Error('Use a colour such as #18212b.');return v;}
function choice<T extends string>(v:unknown,options:readonly T[],label:string):T {if(!options.includes(v as T))throw Error(`Invalid ${label}.`);return v as T;}
export function validateDesign(input:unknown,complete=false):Design {
 const d=input as Design;
 if(!d||d.schema!==1||typeof d.id!=='string'||!UUID.test(d.id)||!Number.isSafeInteger(d.revision)||d.revision<0||typeof d.template!=='boolean')throw Error('Invalid document identity.');
 if(!d.page||!Array.isArray(d.blocks)||d.blocks.length>80)throw Error('Use at most 80 blocks.');
 const title=text(d.title,100,'Document title');if(!title.trim())throw Error('Give the document a title.');
 const page={size:choice(d.page.size,['A4','Letter'],'page size'),orientation:choice(d.page.orientation,['portrait','landscape'],'orientation'),margin:num(d.page.margin,16,100,'page margin'),background:color(d.page.background)};
 const blocks=d.blocks.map((b):Block=>{
  if(!b||typeof b.id!=='string'||!UUID.test(b.id))throw Error('Invalid block identity.');
  const type=choice(b.type,BLOCK_TYPES,'block type');
  if(typeof b.bold!=='boolean')throw Error('Invalid font weight.');
  const out:Block={id:b.id,type,font:choice(b.font,['sans','serif','mono'],'font'),size:num(b.size,8,48,'font size'),bold:b.bold,color:color(b.color),align:choice(b.align,['left','center','right'],'alignment'),spacing:num(b.spacing,0,60,'block spacing')};
  if(type==='heading'||type==='text')out.text=text(b.text,4000,'Block text');
  if(type==='columns'){out.left=text(b.left,4000,'Left column');out.right=text(b.right,4000,'Right column');}
  if(type==='image'){
   out.asset=text(b.asset,68,'Image');if(out.asset&&!ASSET.test(out.asset))throw Error('Choose an imported PNG or JPEG image.');
   if(complete&&!out.asset)throw Error('Import an image or remove the empty image block.');
   out.width=num(b.width,10,100,'image width');out.height=num(b.height,24,500,'image height');out.text=text(b.text,200,'Image description');
  }
  if(type==='divider'||type==='spacer')out.height=num(b.height,type==='divider'?1:4,type==='divider'?8:500,'block height');
  if(type==='table'){
   if(typeof b.header!=='boolean'||!Array.isArray(b.rows)||b.rows.length<1||b.rows.length>40)throw Error('Tables support 1 to 40 rows.');
   const width=Array.isArray(b.rows[0])?b.rows[0].length:0;if(width<1||width>6)throw Error('Tables support 1 to 6 columns.');
   out.rows=b.rows.map(row=>{if(!Array.isArray(row)||row.length!==width)throw Error('Each table row must have the same number of cells.');return row.map(cell=>text(cell,300,'Table cell'));});out.header=b.header;
  }
  return out;
 });
 if(new Set(blocks.map(b=>b.id)).size!==blocks.length)throw Error('Duplicate block identities.');
 if(blocks.filter(b=>b.type==='image').length>8)throw Error('Use at most 8 images.');
 const result:Design={schema:1,id:d.id,revision:d.revision,title,template:d.template,page,blocks};
 if(Buffer.byteLength(JSON.stringify(result))>128*1024)throw Error('Document exceeds the 128 KiB content limit. Shorten some text or tables.');
 return result;
}
