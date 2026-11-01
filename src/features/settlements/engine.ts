import type { Calculation, CloseReview, Context, HistoryEvent, OwnerPayment, Rules, Scope, Settlement, Source, State, Version } from './types';
import { contexts } from './data/examples';
import {validCivilDate} from './adapters';
export const initialSettlements=():State=>({settlements:[],payments:[],closings:{},closingLog:[],history:[],operations:{},nextId:1});
export function defaultRules(c:Context):Rules{return {model:c.model,feeKind:c.id==='copropiedad'?'fijo':'porcentaje',feeValue:c.id==='copropiedad'?10000:1000,fixedCents:c.fixedCents,priorCents:0,adjustmentCents:0,adjustmentReason:'',participants:c.participants.map(p=>({...p}))};}
const cents=(n:number)=>Number.isSafeInteger(n);
export function rulesErrors(source:Source,r:Rules):Record<string,string> {
 const e:Record<string,string>={};
 if([source.accrualCents,source.cashCents,source.costCents,source.paidCostCents].some(n=>!cents(n)||n<0))e['rules']='Totales de fuente inválidos.';
 if(source.invalid.length)e['rules']=source.invalid.join(' · ');
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(source.month))e['month']='Elige un mes válido.';
 for(const l of source.lines)if(!cents(l.cents)||l.cents<0||!validCivilDate(l.date))e['rules']='Hay importes o fechas inválidos en las fuentes.';
 if(!['propio','agencia','renta_fija'].includes(r.model))e['model']='Elige un modelo.';
 if(!['fijo','porcentaje'].includes(r.feeKind))e['feeValue']='Elige una regla de honorario válida.';
 if(r.model==='agencia'&&(!cents(r.feeValue)||r.feeValue<0||r.feeKind==='porcentaje'&&r.feeValue>10000))e['feeValue']='Honorario no negativo; porcentaje entre 0 y 100.';
 if(r.model==='renta_fija'&&(!cents(r.fixedCents)||r.fixedCents<=0))e['fixedCents']='Indica la obligación fija de ejemplo, positiva; no hay acuerdo base inferido.';
 if(!cents(r.priorCents))e['priorCents']='Saldo anterior con hasta dos decimales.';
 if(!cents(r.adjustmentCents)||r.adjustmentCents!==0&&!r.adjustmentReason.trim())e['adjustmentReason']='El ajuste exige importe válido y motivo.';
 if(!r.participants.length||r.participants.some(p=>!p.id||!cents(p.basisPoints)||p.basisPoints<0)||new Set(r.participants.map(p=>p.id)).size!==r.participants.length||r.participants.reduce((n,p)=>n+p.basisPoints,0)!==10000)e['participants']='Participaciones no negativas, sin duplicados y suma exacta 100 %.';
 return e;
}
export function distribute(total:number,participants:Rules['participants']) {
 const sorted=[...participants].sort((a,b)=>a.id.localeCompare(b.id));
 const sign=Math.sign(total);const amount=Math.abs(total);
 const rows=sorted.map(p=>({id:p.id,name:p.name,cents:Math.floor(amount*p.basisPoints/10000)}));
 let rest=amount-rows.reduce((n,p)=>n+p.cents,0);
 for(const row of rows){if(rest>0){row.cents++;rest--;}}
 return rows.map(p=>({...p,cents:p.cents*sign}));
}
export function calculate(source:Source,r:Rules):Calculation {
 const e=rulesErrors(source,r);if(Object.keys(e).length)throw new Error(Object.values(e)[0]);
 const income=source.lines.filter(l=>l.kind==='renta'&&l.assigned&&l.date.slice(0,7)===source.month);
 const deductions=source.lines.filter(l=>l.kind==='gasto'&&l.approved&&l.bearer==='propietario'&&l.period===source.month);
 const incomeCents=income.reduce((n,l)=>n+l.cents,0);const deductibleCents=deductions.reduce((n,l)=>n+l.cents,0);
 const feeCents=r.model==='agencia'?(r.feeKind==='fijo'?r.feeValue:Math.round(incomeCents*r.feeValue/10000)):0;
 const operatingCents=incomeCents-feeCents-deductibleCents;
 const marginCents=source.accrualCents-(r.model==='renta_fija'?r.fixedCents:0)-source.costCents;
 const resultCents=(r.model==='renta_fija'?r.fixedCents:r.model==='propio'?source.accrualCents-source.costCents:operatingCents)+r.priorCents+r.adjustmentCents;
 const payableCents=r.model==='propio'?0:Math.max(0,resultCents);
 return {incomeCents,feeCents,deductibleCents,operatingCents,marginCents,resultCents,payableCents,shares:distribute(payableCents,r.participants),income,deductions,excluded:source.lines.filter(l=>!income.includes(l)&&!deductions.includes(l))};
}
const clone=<T,>(x:T):T=>JSON.parse(JSON.stringify(x));
export const latest=(x:Settlement)=>x.versions.at(-1);
export const scopeOf=(contextId:string):Scope=>contexts.find(c=>c.id===contextId)?.scope??'didactico';
export const closingKey=(scope:Scope,month:string)=>`${scope}:${month}`;
export const isClosed=(s:State,month:string,scope:Scope='cartera')=>Boolean(s.closings[closingKey(scope,month)]?.closed);
function guard(s:State,month:string,contextId:string){if(isClosed(s,month,scopeOf(contextId)))throw new Error('Este mes está cerrado en el escenario09 para este ámbito. Reabre con motivo antes de editar o recalcular.');}
type Ref=Omit<HistoryEvent,'action'|'reason'|'date'|'actor'>;
function event(s:State,action:string,reason:string,ref:Ref={}):State{return {...s,history:[...s.history,{action,reason,actor:'Administrador de demostración',date:'2026-10-21',...ref}]};}
const refOf=(item:{id:string;contextId:string;month:string},version:number):Ref=>({settlementId:item.id,contextId:item.contextId,version,scope:scopeOf(item.contextId),month:item.month});
/** Owner payments whose own date falls in month, for any settlement of the context (cash view). */
export function ownerPaymentsInMonth(s:State,contextId:string,month:string){const ids=new Set(s.settlements.filter(x=>x.contextId===contextId).map(x=>x.id));return s.payments.filter(p=>ids.has(p.settlementId)&&p.date.slice(0,7)===month);}
export function prepare(s:State,source:Source,rules:Rules):{state:State;id:string} {
 guard(s,source.month,source.contextId);calculate(source,rules);
 const existing=s.settlements.find(x=>x.contextId===source.contextId&&x.month===source.month);if(existing)return {state:s,id:existing.id};
 if(!contexts.some(c=>c.id===source.contextId))throw new Error('Activo desconocido.');
 const id=`liq-${s.nextId}`;const version:Version={number:1,status:'borrador',rules:clone(rules),source:clone(source),calculation:calculate(source,rules),reason:'Preparación temporal',actor:'Administrador de demostración',date:'2026-10-21'};
 return {state:event({...s,nextId:s.nextId+1,settlements:[...s.settlements,{id,contextId:source.contextId,month:source.month,versions:[clone(version)]}]},'Borrador temporal preparado',id,refOf({id,contextId:source.contextId,month:source.month},1)),id};
}
function find(s:State,id:string){const item=s.settlements.find(x=>x.id===id);const v=item&&latest(item);if(!item||!v)throw new Error('Liquidación no disponible.');guard(s,item.month,item.contextId);return {item,v};}
function replace(s:State,item:Settlement):State {return {...s,settlements:s.settlements.map(x=>x.id===item.id?item:x)};}
export function edit(s:State,id:string,source:Source,rules:Rules,reason:string):State {
 const {item,v}=find(s,id);if(source.contextId!==item.contextId||source.month!==item.month)throw new Error('La corrección debe mantener activo y mes.');
 if(v.status==='aprobado'&&!reason.trim())throw new Error('La corrección exige motivo.');
 // Beneficiary identities remain stable so versions cannot evade previous payments.
 if([...rules.participants].map(p=>p.id).sort().join('|')!==[...v.rules.participants].map(p=>p.id).sort().join('|'))throw new Error('Conserva los beneficiarios del grupo; cambia solo participaciones.');
 const next:Version={number:v.status==='aprobado'?v.number+1:v.number,status:'borrador',source:clone(source),rules:clone(rules),calculation:calculate(source,rules),reason:reason.trim()||'Edición temporal; revisión invalidada',actor:'Administrador de demostración',date:'2026-10-21'};
 return event(replace(s,{...item,versions:v.status==='aprobado'?[...item.versions,next]:[...item.versions.slice(0,-1),next]}),'Edición de liquidación · vuelve a borrador',next.reason,refOf(item,next.number));
}
export function transition(s:State,id:string,status:'revisado'|'aprobado'):State {
 const {item,v}=find(s,id);if(v.status===status)return s;
 if(status==='revisado'&&v.status!=='borrador'||status==='aprobado'&&v.status!=='revisado')throw new Error('Revisa la versión vigente antes de aprobar.');
 calculate(v.source,v.rules);
 return event(replace(s,{...item,versions:[...item.versions.slice(0,-1),clone({...v,status})]}),status==='aprobado'?'Versión aprobada (simulada)':'Versión revisada (simulada)',`Versión ${v.number} · autoaprobación de administrador único`,refOf(item,v.number));
}
export function balances(s:State,item:Settlement,v=latest(item)) {
 if(!v)return [];
 return v.calculation.shares.map(share=>{const paid=s.payments.filter(p=>p.settlementId===item.id&&p.beneficiaryId===share.id).reduce((n,p)=>n+p.cents,0);return {...share,paid,pending:Math.max(0,share.cents-paid),excess:Math.max(0,paid-share.cents)};});
}
export function pay(s:State,id:string,beneficiaryId:string,amount:number,date:string,reference:string,operationId:string):State {
 const fp=JSON.stringify([id,beneficiaryId,amount,date,reference]);
 if(s.operations[operationId]){if(s.operations[operationId]!==fp)throw new Error('Reintento incompatible.');return s;}
 const {item,v}=find(s,id);if(v.status!=='aprobado'||v.rules.model==='propio')throw new Error('Solo pagos externos sobre versión aprobada; patrimonio propio no crea obligación externa.');
 const balance=balances(s,item).find(x=>x.id===beneficiaryId);
 if(!cents(amount)||amount<=0||!balance||amount>balance.pending||balances(s,item).some(x=>x.excess>0))throw new Error('Importe positivo sin superar pendiente; un excedente bloquea nuevos pagos.');
 const parsed=new Date(`${date}T00:00:00Z`);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(parsed.getTime())||parsed.toISOString().slice(0,10)!==date||!reference.trim())throw new Error('Fecha civil válida y referencia ficticia obligatorias.');
 if(s.payments.some(p=>p.settlementId===id&&p.reference===reference.trim()))throw new Error('Referencia de pago ya utilizada.');
 const p:OwnerPayment={id:`liq-pay-${s.payments.length+1}`,operationId,settlementId:id,beneficiaryId,cents:amount,date,reference:reference.trim()};
 return event({...s,payments:[...s.payments,p],operations:{...s.operations,[operationId]:fp}},'Pago externo simulado',`${reference} · ${beneficiaryId} · fecha ${date} · no cambia Banco ni caja`,refOf(item,v.number));
}
export function differences(a:Version,b:Version){return {result:b.calculation.resultCents-a.calculation.resultCents,fee:b.calculation.feeCents-a.calculation.feeCents,deductions:b.calculation.deductibleCents-a.calculation.deductibleCents,rulesChanged:JSON.stringify(a.rules)!==JSON.stringify(b.rules),linesChanged:JSON.stringify(a.source)!==JSON.stringify(b.source)};}
export function close(s:State,review:CloseReview,fresh:CloseReview,acknowledged:boolean):State {
 if(isClosed(s,review.month,review.scope))return s;
 if(review.scope!==fresh.scope||review.month!==fresh.month||review.fingerprint!==fresh.fingerprint)throw new Error('La revisión está obsoleta. Revisa de nuevo las fuentes.');
 if(fresh.invalid.length)throw new Error('Hay datos inválidos; no se puede cerrar.');
 if(fresh.issues.length&&!acknowledged)throw new Error('Reconoce expresamente todos los pendientes antes del cierre simulado.');
 const key=closingKey(fresh.scope,fresh.month);const id=`cierre-${s.closingLog.length+1}`;const actor='Administrador de demostración',date='2026-10-21';
 return event({...s,closings:{...s.closings,[key]:{id,scope:fresh.scope,month:fresh.month,review:clone(fresh),closed:true,actor,date}},closingLog:[...s.closingLog,{id,scope:fresh.scope,month:fresh.month,action:'cierre',reason:'Pendientes reconocidos',actor,date,snapshotId:id,review:clone(fresh)}]},'Cierre mensual simulado',`${id} · ${fresh.scope} · ${fresh.month} · solo bloquea escenario09`,{scope:fresh.scope,month:fresh.month});
}
export function reopen(s:State,month:string,reason:string,scope:Scope='cartera'):State {if(!reason.trim())throw new Error('La reapertura exige motivo.');const key=closingKey(scope,month);const closing=s.closings[key];if(!closing?.closed)return s;return event({...s,closings:{...s.closings,[key]:{...closing,closed:false}},closingLog:[...s.closingLog,{id:`reapertura-${s.closingLog.length+1}`,scope,month,action:'reapertura',reason:reason.trim(),actor:'Administrador de demostración',date:'2026-10-21',snapshotId:closing.id,review:clone(closing.review)}]},'Reapertura simulada',`${closing.id} · ${scope} · ${month} · ${reason.trim()}`,{scope,month});}
