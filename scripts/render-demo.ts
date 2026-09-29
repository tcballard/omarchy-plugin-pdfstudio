import {readFile,writeFile} from 'node:fs/promises';
import {renderInvoice} from '../renderer/invoice';
const path=process.argv[2];
if(!path) throw Error('Usage: node --import tsx scripts/render-demo.ts /path/to/sample.pdf');
const data=JSON.parse(await readFile(new URL('../demo/fixtures/invoice.json',import.meta.url),'utf8'));
await writeFile(path,await renderInvoice(data),{flag:'wx'});
console.log(path);
