import {Document,Page,View,Text,Image,Table,Row,Cell,PageBreak,serialize,type Style} from '@formepdf/react';
import {renderSerializedDoc} from '@formepdf/core';
import {fileURLToPath} from 'node:url';
import {type Design,type Block,validateDesign} from './document';
import {imageData} from './assets';
const families={sans:'DejaVu Sans',serif:'DejaVu Serif',mono:'DejaVu Sans Mono'};
const fonts=Object.entries({sans:'DejaVuSans',serif:'DejaVuSerif',mono:'DejaVuSansMono'}).flatMap(([key,name])=>[
 {family:families[key as keyof typeof families],src:fileURLToPath(new URL(`../renderer/fonts/${name}.ttf`,import.meta.url))},
 {family:families[key as keyof typeof families],src:fileURLToPath(new URL(`../renderer/fonts/${name}-Bold.ttf`,import.meta.url)),fontWeight:700}
]);
export async function renderDesign(input:Design,directory:string){
 const d=validateDesign(input,true);
 const images=new Map<string,Awaited<ReturnType<typeof imageData>>>();
 for(const b of d.blocks)if(b.type==='image'&&b.asset&&!images.has(b.asset))images.set(b.asset,await imageData(directory,b.asset));
 let [width,height]=d.page.size==='A4'?[595.28,841.89]:[612,792];if(d.page.orientation==='landscape')[width,height]=[height,width];
 const contentWidth=width-2*d.page.margin;
 function draw(b:Block){
  const free=d.layout==='free',space=free?0:b.spacing;
  const style:Style={fontFamily:families[b.font],fontSize:b.size,fontWeight:b.bold?700:400,color:b.color,textAlign:b.align,marginBottom:space};
  if(b.type==='pageBreak')return <PageBreak key={b.id}/>;
  if(b.type==='heading'||b.type==='text')return <Text key={b.id} style={style}>{b.text||' '}</Text>;
  if(b.type==='columns')return <View key={b.id} style={{flexDirection:'row',marginBottom:space}}>
   <View style={{width:'50%',paddingRight:10}}><Text style={{...style,marginBottom:0}}>{b.left||' '}</Text></View>
   <View style={{width:'50%',paddingLeft:10}}><Text style={{...style,marginBottom:0}}>{b.right||' '}</Text></View>
  </View>;
  if(b.type==='divider')return <View key={b.id} style={{height:free?b.frame!.height:b.height,backgroundColor:b.color,marginBottom:space}}/>;
  if(b.type==='spacer')return <View key={b.id} style={{height:b.height,marginBottom:space}}/>;
  if(b.type==='table')return <Table key={b.id} columns={b.rows![0].map(()=>({width:{fraction:1/b.rows![0].length}}))} style={{marginBottom:space}}>
   {b.rows!.map((row,i)=><Row key={i} header={b.header&&i===0} style={{backgroundColor:b.header&&i===0?'#edf0f3':d.page.background}}>
    {row.map((cell,j)=><Cell key={j} style={{padding:7,borderWidth:0.5,borderColor:'#c7ccd1'}}><Text style={{...style,marginBottom:0,fontWeight:b.header&&i===0?700:style.fontWeight}}>{cell||' '}</Text></Cell>)}
   </Row>)}
  </Table>;
  if(b.type==='image'){
   const image=images.get(b.asset!)!,limitWidth=free?b.frame!.width:contentWidth*b.width!/100;
   const scale=Math.min(limitWidth/image.width,(free?b.frame!.height:Math.min(b.height!,height-2*d.page.margin-b.spacing))/image.height),w=image.width*scale,h=image.height*scale;
   return <View key={b.id} wrap={false} style={{marginBottom:space,alignItems:b.align==='center'?'center':b.align==='right'?'flex-end':'flex-start'}}><Image src={image.src} width={w} height={h} alt={b.text}/></View>;
  }
 }
 const pages=d.layout==='free'
  ?Array.from({length:d.pageCount!},(_,i)=><Page key={i} size={{width,height}} margin={0} style={{backgroundColor:d.page.background}}>
    <View wrap={false} style={{width,height,position:'relative',overflow:'hidden',backgroundColor:d.page.background}}>
     {d.blocks.filter(b=>b.frame!.page===i+1).map(b=><View key={b.id} wrap={false} style={{position:'absolute',left:b.frame!.x,top:b.frame!.y,width:b.frame!.width,height:b.frame!.height,overflow:'hidden'}}>{draw(b)}</View>)}
    </View>
   </Page>)
  :<Page size={{width,height}} margin={d.page.margin} style={{backgroundColor:d.page.background}}>{d.blocks.length?d.blocks.map(draw):<Text> </Text>}</Page>;
 const serialized=serialize(<Document title={d.title} fonts={fonts} style={{fontFamily:families.sans,fontSize:11,color:'#18212b'}}>{pages}</Document>);
 const result=Buffer.from(await renderSerializedDoc(serialized as unknown as Record<string,unknown>));
 if(result.length>48*1024*1024)throw Error('PDF exceeds 48 MiB. Use smaller images.');return result;
}
