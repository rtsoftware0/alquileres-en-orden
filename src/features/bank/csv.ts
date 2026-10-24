import Papa from 'papaparse';
import { isValidIsoDate } from '@/features/contracts/draft';
import { accounts } from './data/demo-bank';
import type { BankState, CsvConfig, ImportReview, Movement } from './types';
export function parseCents(value:string,decimal:','|'.'):number|undefined {
 const s=value.trim(); const pattern=decimal===','?/^[+-]?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/:/^[+-]?\d+(?:\.\d{1,2})?$/;
 if(!pattern.test(s))return undefined;
 const normalized=decimal===','?s.replaceAll('.','').replace(',','.'):s;
 const negative=normalized.startsWith('-'); const [whole,fraction='']=normalized.replace(/^[+-]/,'').split('.');
 const cents=Number(whole)*100+Number(fraction.padEnd(2,'0'));
 return Number.isSafeInteger(cents)&&cents!==0?(negative?-cents:cents):undefined;
}
export function csvHeaders(text:string,separator:string) {return Papa.parse<string[]>(text,{delimiter:separator,skipEmptyLines:'greedy'}).data[0]??[];}
export const sameData=(a:Movement,b:Movement)=>a.accountId===b.accountId&&a.date===b.date&&a.cents===b.cents&&a.concept===b.concept&&a.currency===b.currency&&a.kind===b.kind;
const normalizeConcept=(s:string)=>s.trim().replace(/\s+/g,' ').toLocaleLowerCase('es');
export const sameBankFingerprint=(a:Movement,b:Movement)=>a.accountId===b.accountId&&a.date===b.date&&a.cents===b.cents&&a.currency===b.currency&&normalizeConcept(a.concept)===normalizeConcept(b.concept);
const hash=(s:string)=>{let h=2166136261;for(const ch of s){h=Math.imul(h^ch.charCodeAt(0),16777619);}return (h>>>0).toString(36);};
export function reviewCsv(text:string,c:CsvConfig,state:BankState):ImportReview {
 const parsed=Papa.parse<string[]>(text,{delimiter:c.separator,skipEmptyLines:'greedy'});const headers=parsed.data[0]??[];
 const account=accounts.find(a=>a.id===c.accountId);
 const required=[c.date,c.concept,c.amount];const mappings=[...required,...(c.reference?[c.reference]:[]),...(c.currency?[c.currency]:[])];
 if(!account||![';',',','\t'].includes(c.separator)||required.some(x=>!x||headers.filter(h=>h===x).length!==1)||new Set(mappings).size!==mappings.length||mappings.some(x=>!headers.includes(x)))throw new Error('Elige cuenta y columnas distintas para fecha, concepto e importe; revisa el separador.');
 const key=JSON.stringify([text,c]);const seen:Movement[]=[...state.movements];
 const rows=parsed.data.slice(1).map((values,i)=>{
 const row=i+2;const read=(column:string)=>values[headers.indexOf(column)]?.trim()??'';
 const raw=read(c.date);const date=c.dateFormat==='es'&&/^\d{2}\/\d{2}\/\d{4}$/.test(raw)?raw.split('/').reverse().join('-'):c.dateFormat==='iso'?raw:'';
 const cents=parseCents(read(c.amount),c.decimal);const concept=values[headers.indexOf(c.concept)]??'';const currency=c.currency?read(c.currency):'EUR';
 let error=parsed.errors.some(e=>e.row===i+1)?'CSV mal formado.':values.length!==headers.length?'Número de columnas incompatible.':!isValidIsoDate(date)?'Fecha inexistente o formato incompatible.':cents===undefined?'Importe inválido: usa euros con hasta dos decimales, distinto de cero.':currency!=='EUR'?'Solo se admiten ejemplos EUR.':!concept.trim()?'Falta concepto.':undefined;
 if(error||cents===undefined)return {row,error:error??'Importe inválido',matches:[]};
 const reference=c.reference?read(c.reference):'';
 const original=state.movements.find(m=>m.accountId===account.id&&reference&&m.reference===reference);
 const kind=original?.kind??(c.kind==='fianza'?'fianza':cents<0?'proveedor':'renta');
 const movement:Movement={id:`csv-${hash(key)}-${row}`,accountId:account.id,scope:account.scope,origin:c.exampleId,date,concept,reference,cents,currency,kind};
 const stable=movement.reference?seen.filter(m=>m.accountId===movement.accountId&&m.reference===movement.reference):[];
 const doubtful=!movement.reference?seen.filter(m=>sameBankFingerprint(m,movement)):[];
 const disposition=stable.length?(stable.every(m=>sameData(m,movement))?'duplicada' as const:'discrepancia' as const):doubtful.length?'dudosa' as const:'nueva' as const;
 seen.push(movement);return {row,movement,disposition,matches:[...stable,...doubtful].map(m=>m.id)};
 });
 return {key,rows,totalCents:rows.reduce((s,r)=>s+(r.movement?.cents??0),0),valid:rows.filter(r=>r.movement).length};
}
