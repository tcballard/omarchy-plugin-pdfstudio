import {Document,Page,View,serialize} from '@formepdf/react';
import {renderSerializedDoc} from '@formepdf/core';
import {fileURLToPath} from 'node:url';
import {professionalTheme} from './vendor/registry/themes/professional';
const theme=structuredClone(professionalTheme);
theme.typography.body.fontFamily='DejaVu Sans';
theme.typography.heading.fontFamily='DejaVu Sans';
const fonts=[{family:'DejaVu Sans',src:fileURLToPath(new URL('../renderer/fonts/DejaVuSans.ttf',import.meta.url))},{family:'DejaVu Sans',src:fileURLToPath(new URL('../renderer/fonts/DejaVuSans-Bold.ttf',import.meta.url)),fontWeight:700}];
import {Text} from './vendor/registry/bases/forme/components/text/text';
import {PageHeader} from './vendor/registry/bases/forme/components/page-header/page-header';
import {PdfcnThemeProvider} from './vendor/registry/bases/forme/components/theme-provider';
import {type Invoice,totals,money,validate} from './model';

// Explicit small pages keep long descriptions and addresses away from totals.
// Text remains real PDF text; no screenshot-based invoice output.
function Content({data:d}:{data:Invoice}) {
  const t=totals(d); const pages=[];
  for(let i=0;i<d.items.length;i+=5) pages.push(d.items.slice(i,i+5));
  return <Document title={`Invoice ${d.number}`} fonts={fonts}><>{pages.map((items,p)=><Page key={p} size="A4" margin={40}>
    <PageHeader title={d.company} subtitle="INVOICE" variant="minimal"/>
    <View style={{flexDirection:'row',marginBottom:20}}>
      <View style={{width:'55%',paddingRight:20}}>
        <Text variant="xs">{d.companyAddress}</Text>
        <Text variant="sm" weight="bold">Bill to: {d.customer}</Text>
        <Text variant="xs">{d.customerAddress}</Text>
      </View>
      <View style={{width:'45%'}}>
        <Text variant="sm" weight="bold">{d.number}</Text>
        <Text variant="xs">Issued: {d.date}</Text>
        <Text variant="xs">Due: {d.due}</Text>
        <Text variant="xs">Currency: {d.currency}</Text>
      </View>
    </View>
    <View style={{flexDirection:'row',padding:8,backgroundColor:'#eef1f5'}}>
      <Text style={{width:'46%'}} variant="xs" noMargin weight="bold">DESCRIPTION</Text>
      <Text style={{width:'12%'}} variant="xs" noMargin>QTY</Text>
      <Text style={{width:'21%'}} variant="xs" noMargin>RATE</Text>
      <Text style={{width:'21%'}} variant="xs" noMargin align="right">AMOUNT</Text>
    </View>
    {items.map((line,i)=><View key={i} wrap={false} style={{flexDirection:'row',padding:8,borderBottomWidth:1,borderBottomColor:'#e5e7eb'}}>
      <Text style={{width:'46%',paddingRight:10}} variant="xs" noMargin>{line.description}</Text>
      <Text style={{width:'12%'}} variant="xs" noMargin>{line.quantity}</Text>
      <Text style={{width:'21%'}} variant="xs" noMargin>{money(totals({...d,items:[{...line,quantity:'1'}]}).subtotal,d.currency)}</Text>
      <Text style={{width:'21%'}} variant="xs" noMargin align="right">{money(t.lines[p*5+i],d.currency)}</Text>
    </View>)}
    {p===pages.length-1 && <View wrap={false} style={{marginTop:20}}>
      <Text variant="sm" align="right">Subtotal: {money(t.subtotal,d.currency)}</Text>
      <Text variant="sm" align="right">Tax ({d.taxRate}%): {money(t.tax,d.currency)}</Text>
      <Text variant="lg" align="right" weight="bold">Total: {money(t.total,d.currency)}</Text>
      {d.payment && <Text variant="xs">Payment details: {d.payment}</Text>}
      {d.notes && <Text variant="xs">{d.notes}</Text>}
    </View>}
    <Text variant="xs" color="mutedForeground" style={{marginTop:24}}>{d.number} · Section {p+1} of {pages.length}</Text>
  </Page>)}</></Document>;
}
export async function renderInvoice(data:Invoice) {
  validate(data,true);
  const document=serialize(<PdfcnThemeProvider theme={theme}><Content data={data}/></PdfcnThemeProvider>);
  return Buffer.from(await renderSerializedDoc(document as unknown as Record<string,unknown>));
}
