import { demoPortfolio } from '@/features/portfolio/data/demo-data';
import { baseRecords } from '../adapters';
import type { Account, RecordView, Movement } from '../types';
export const accounts:Account[]=[{id:'cuenta-demo',name:'Cuenta de ejemplo · EUR · IBAN no registrado',scope:'base',currency:'EUR'},{id:'cuenta-aula',name:'Cuenta didáctica · EUR · independiente de la cartera',scope:'didactico',currency:'EUR'}];
export const educationalRecords:RecordView[]=[['aula-600',60000],['aula-300',30000],['aula-multi',60000]].map(([id,cents])=>({id:String(id),reference:String(id).toUpperCase(),date:'2026-10-20',cents:Number(cents),kind:'renta',scope:'didactico',accountId:'cuenta-aula',currency:'EUR',base:false}));
export function demoMovements():Movement[] {
 const records=baseRecords(demoPortfolio);
 const selected=['rent:cb-008','provider:pg-ej-001','provider:pg-ej-002','deposit:fz-02'];
 return [...selected.map((id,i)=>{const r=records.find(x=>x.id===id);if(!r)throw new Error('Referencia de ejemplo ausente');return {id:`mov-${i+1}`,accountId:r.accountId,origin:'extracto-incorporado',date:r.date,concept:r.kind==='renta'?'Renta de ejemplo':r.kind==='proveedor'?'Pago proveedor de ejemplo':'Fianza recibida de ejemplo',reference:r.reference,cents:r.cents,currency:r.currency,kind:r.kind,scope:r.scope};}),
 {id:'mov-5',accountId:'cuenta-demo',origin:'extracto-incorporado',date:'2026-10-21',concept:'Entrada sin registro (ejemplo)',reference:'ENT-EJ-75',cents:7500,currency:'EUR',kind:'renta',scope:'base'},
 ...[90000,20000,40000,12500].map((cents,i)=>({id:`aula-mov-${i+1}`,accountId:'cuenta-aula',origin:'aula',date:'2026-10-20',concept:i===0?'Un movimiento → dos cobros (900 = 600 + 300)':i===3?'Entrada parcial de ejemplo':'Dos movimientos → un cobro (200 + 400)',reference:`AULA-M-${i+1}`,cents,currency:'EUR',kind:'renta' as const,scope:'didactico' as const}))];
}
const es=(c:number)=>(c/100).toFixed(2).replace('.',',');
const baseCsv=()=>['Fecha;Concepto;Referencia;Importe;Moneda',...demoMovements().filter(m=>m.scope==='base').map(m=>`${m.date.split('-').reverse().join('/')};"${m.concept}";${m.reference};${es(m.cents)};EUR`),'21/10/2026;"Ejemplo; concepto entrecomillado";CSV-NUEVO;25,50;EUR'].join('\n');
export const csvExamples=[
 {id:'bueno',label:'Extracto español · entradas y salidas',text:baseCsv(),separator:';',dateFormat:'es' as const,decimal:',' as const,columns:{date:'Fecha',concept:'Concepto',reference:'Referencia',amount:'Importe',currency:'Moneda'}},
 {id:'alternativo',label:'Otro mapeo · ISO y punto decimal',text:'ref,amount,description,day,currency\nALT-1,45.25,"Concepto, con coma",2026-10-21,EUR\nALT-2,-10.00,Salida ficticia,2026-10-21,EUR',separator:',',dateFormat:'iso' as const,decimal:'.' as const,columns:{date:'day',concept:'description',reference:'ref',amount:'amount',currency:'currency'}},
 {id:'errores',label:'Errores y duplicados para revisión',text:'Fecha;Concepto;Referencia;Importe;Moneda\n31/02/2026;Fecha inexistente;ERR-1;10,00;EUR\n21/10/2026;No finito;ERR-2;Infinity;EUR\n21/10/2026;Cero;ERR-3;0,00;EUR\n21/10/2026;Otra moneda;ERR-4;20,00;USD\n21/10/2026;Diferente dato;CB-EJ-008;421,00;EUR\n21/10/2026;Repetible sin referencia;;12,50;EUR\n21/10/2026;Repetible sin referencia;;12,50;EUR\n21/10/2026;Legítimo;DIST-1;33,00;EUR\n21/10/2026;Legítimo;DIST-2;33,00;EUR',separator:';',dateFormat:'es' as const,decimal:',' as const,columns:{date:'Fecha',concept:'Concepto',reference:'Referencia',amount:'Importe',currency:'Moneda'}}
];
