import { randomUUID } from 'node:crypto';

export interface Invoice {
  id: string; revision: number; number: string; date: string; due: string;
  company: string; companyAddress: string; customer: string; customerAddress: string;
  currency: string; taxRate: string; payment: string; notes: string;
  items: {description: string; quantity: string; price: string}[];
}
export function fresh(): Invoice {
  const today = new Date().toISOString().slice(0,10);
  return {id:randomUUID(),revision:0,number:'',date:today,due:today,company:'',companyAddress:'',customer:'',customerAddress:'',currency:'GBP',taxRate:'0',payment:'',notes:'',items:[{description:'',quantity:'1',price:'0.00'}]};
}
export function decimal(value: string, places: number, label: string): bigint {
  if (typeof value !== 'string' || !new RegExp('^\\d{1,9}(?:\\.\\d{1,'+places+'})?$').test(value)) throw Error(`${label}: enter a positive decimal with at most ${places} decimal places.`);
  const [whole, fraction=''] = value.split('.');
  return BigInt(whole)*10n**BigInt(places)+BigInt(fraction.padEnd(places,'0'));
}
export function validate(input: unknown, complete=false): Invoice {
  if (!input || typeof input !== 'object') throw Error('Invalid invoice.');
  const d = input as Invoice;
  if (!/^[0-9a-f-]{36}$/.test(d.id) || !Number.isSafeInteger(d.revision) || d.revision<0) throw Error('Invalid draft identity.');
  for (const k of ['number','date','due','company','companyAddress','customer','customerAddress','currency','taxRate','payment','notes'] as const) {
    if (typeof d[k] !== 'string' || d[k].length > (['companyAddress','customerAddress','payment','notes'].includes(k)?500:100)) throw Error(`Invalid ${k}.`);
  }
  if (!['GBP','EUR','USD'].includes(d.currency)) throw Error('Choose GBP, EUR or USD.');
  for (const k of ['date','due'] as const) if (!/^\d{4}-\d{2}-\d{2}$/.test(d[k]) || Number.isNaN(Date.parse(d[k])) || new Date(d[k]).toISOString().slice(0,10)!==d[k]) throw Error(`Invalid ${k}; use YYYY-MM-DD.`);
  if (d.due<d.date) throw Error('Due date must be on or after invoice date.');
  if (decimal(d.taxRate,2,'Tax rate')>10000n) throw Error('Tax rate must be between 0 and 100.');
  if (!Array.isArray(d.items) || d.items.length<1 || d.items.length>100) throw Error('Use 1 to 100 invoice lines.');
  for (const line of d.items) {
    if (!line || typeof line.description!=='string' || line.description.length>200) throw Error('Descriptions must be at most 200 characters.');
    if (decimal(line.quantity,3,'Quantity')===0n) throw Error('Quantity must be greater than zero.');
    decimal(line.price,2,'Price');
    if (complete && !line.description.trim()) throw Error('Add a description to each line.');
  }
  if (complete && (!d.company.trim() || !d.customer.trim())) throw Error('Add your business and customer names.');
  const result=totals(d);
  if (result.total>99999999999n) throw Error('Invoice exceeds the supported total.');
  return d;
}
export function totals(d: Invoice) {
  const lines=d.items.map(x=>(decimal(x.quantity,3,'Quantity')*decimal(x.price,2,'Price')+500n)/1000n);
  const subtotal=lines.reduce((a,b)=>a+b,0n);
  const tax=(subtotal*decimal(d.taxRate,2,'Tax rate')+5000n)/10000n;
  return {lines,subtotal,tax,total:subtotal+tax};
}
export function money(value: bigint,currency: string) { return `${currency} ${value/100n}.${String(value%100n).padStart(2,'0')}`; }
