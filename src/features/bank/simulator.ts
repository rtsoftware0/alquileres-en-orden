import { demoPortfolio } from '@/features/portfolio/data/demo-data';
import { baseRecords } from './adapters';
import { demoMovements, educationalRecords } from './data/demo-bank';
import { compatible, movementRemaining, recordRemaining } from './selectors';
import { sameBankFingerprint } from './csv';
import type { BankState, Decision, ImportReview, Kind, RecordView } from './types';
export function initialBank():BankState {return {movements:demoMovements(),records:[...baseRecords(demoPortfolio),...educationalRecords.map(r=>({...r}))],links:[],history:[],batches:[],operations:{},nextHypotheticalNumber:1};}
function log(s:BankState,action:string,reason:string,extra:Partial<BankState['history'][number]>={}) {return {...s,history:[...s.history,{id:`event-${s.history.length+1}`,action,reason,actor:'Administrador de demostración',date:demoPortfolio.referenceDate,...extra}]};}
export function incorporate(s:BankState,r:ImportReview,decisions:Record<number,Decision>):BankState {
 if(s.batches.includes(r.key))return s;
 const additions=[];let next=s;
 for(const row of r.rows){if(row.error)continue;if(row.disposition==='discrepancia')throw new Error(`Fila ${row.row}: referencia existente con datos distintos; cambia el ejemplo o mapeo.`);
 const m=row.movement;if(!m)continue;
 if(!m.reference&&row.disposition!=='dudosa'&&[...s.movements,...additions].some(x=>sameBankFingerprint(x,m)))throw new Error('La revisión ha cambiado: hay una coincidencia dudosa. Revisa y decide incluir u omitir con motivo.');
 if(row.disposition==='duplicada'){next=log(next,'Duplicado omitido','Referencia estable con datos coincidentes',{movementId:m.id});continue;}
 if(row.disposition==='dudosa'){const d=decisions[row.row];if(!d?.choice||!d.reason.trim())throw new Error(`Fila ${row.row}: decide incluir u omitir e indica motivo.`);next=log(next,`Coincidencia dudosa: ${d.choice}`,d.reason,{movementId:m.id});if(d.choice==='omitir')continue;}
 // Defensive validation against state changes since preview.
 const collision=[...s.movements,...additions].find(x=>m.reference&&x.accountId===m.accountId&&x.reference===m.reference);
 if(collision)throw new Error('La revisión ha cambiado. Revisa de nuevo antes de incorporar.');
 additions.push(m);
 }
 if(!r.rows.some(row=>row.movement))throw new Error('No hay filas válidas que incorporar.');
 next={...next,movements:[...s.movements,...additions],batches:[...s.batches,r.key]};
 return log(next,additions.length?'Lote incorporado temporalmente':'Lote revisado sin nuevos movimientos',`${additions.length} movimientos; ${r.rows.filter(x=>x.error).length} filas inválidas excluidas explícitamente.`);
}
export function linkErrors(s:BankState,movementId:string,recordId:string,cents:number) {
 const e:Record<string,string>={};const m=s.movements.find(x=>x.id===movementId);const r=s.records.find(x=>x.id===recordId);
 if(!m||m.discarded)e['recordId']='El movimiento no está disponible para conciliación.';
 if(!r)e['recordId']='Elige un registro existente.';
 if(m&&r&&!compatible(m,r))e['recordId']='Signo, cuenta, moneda o tipo incompatibles. Renta, proveedor y fianza se mantienen separados.';
 if(!Number.isSafeInteger(cents)||cents<=0)e['amount']='Indica una cantidad positiva con hasta dos decimales.';
 else if(m&&r&&(cents>movementRemaining(s,m)||cents>recordRemaining(s,r)))e['amount']='El importe supera el restante del movimiento o del registro, incluso por un céntimo.';
 return e;
}
export function reconcile(s:BankState,movementId:string,recordId:string,cents:number,operationId:string):BankState {
 const fingerprint=JSON.stringify([movementId,recordId,cents]);
 if(s.operations[operationId]){if(s.operations[operationId]!==fingerprint)throw new Error('Reintento con datos incompatibles.');if(!s.links.some(l=>l.active&&l.operationId===operationId))throw new Error('Este vínculo ya se deshizo. Prepara una revisión nueva, no repitas la anterior.');return s;}
 const e=linkErrors(s,movementId,recordId,cents);if(Object.keys(e).length)throw new Error(Object.values(e)[0]);
 const id=`link-${s.links.length+1}`;
 return log({...s,links:[...s.links,{id,operationId,movementId,recordId,cents,active:true}],operations:{...s.operations,[operationId]:fingerprint}},'Conciliación simulada','Enlace explícito; no cambia caja ni deuda',{movementId,recordId,cents});
}
export function prepareRecord(s:BankState,movementId:string,kind:Kind,cents:number,operationId:string):BankState {
 const fingerprint=JSON.stringify(['new',movementId,kind,cents]);if(s.operations[operationId]){if(s.operations[operationId]!==fingerprint)throw new Error('Reintento incompatible.');if(!s.records.some(r=>r.id===`hyp-${operationId}`))throw new Error('Este registro hipotético ya se revirtió. Prepara una revisión nueva.');return s;}
 const m=s.movements.find(x=>x.id===movementId);if(!m||m.discarded)throw new Error('Movimiento no disponible.');
 if(!Number.isSafeInteger(cents)||cents<=0||cents>movementRemaining(s,m))throw new Error('Importe positivo, no superior al restante.');
 if(kind!==m.kind||(m.cents<0&&kind==='renta')||(m.cents>0&&kind==='proveedor'))throw new Error('Tipo incompatible con este movimiento.');
 const id=`hyp-${operationId}`;const r:RecordView={id,reference:`HIP-${s.nextHypotheticalNumber}`,date:m.date,cents:Math.sign(m.cents)*cents,kind,scope:m.scope,accountId:m.accountId,currency:m.currency,base:false,temporary:true};
 return log({...s,records:[...s.records,r],nextHypotheticalNumber:s.nextHypotheticalNumber+1,operations:{...s.operations,[operationId]:fingerprint}},'Registro hipotético preparado',kind==='renta'?'Cobro hipotético sin asignar. No crea obligaciones ni modifica caja base.':'Movimiento hipotético separado del dinero base.',{movementId,recordId:id,cents});
}
export function unlink(s:BankState,id:string,reason:string,decision:'conservar'|'revertir'):BankState {
 if(!reason.trim())throw new Error('Indica el motivo de la desconciliación.');
 const l=s.links.find(x=>x.id===id);if(!l)throw new Error('Vínculo inexistente.');if(!l.active)return s;
 const r=s.records.find(x=>x.id===l.recordId);if(!r)throw new Error('Registro inexistente.');
 if(decision==='revertir'&&(!r.temporary||s.links.some(x=>x.active&&x.recordId===r.id&&x.id!==id)))throw new Error(r.base?'Un registro base se conserva siempre; no se revierte una operación real.':'Hay otros vínculos activos: conserva el registro o resuélvelos primero.');
 const next={...s,links:s.links.map(x=>x.id===id?{...x,active:false}:x),records:decision==='revertir'?s.records.filter(x=>x.id!==r.id):s.records};
 return log(next,'Desconciliación simulada',`${reason} · ${decision==='revertir'?'Registro hipotético revertido':'Registro conservado'}`,{movementId:l.movementId,recordId:l.recordId,cents:l.cents});
}
export function revertUnlinkedRecord(s:BankState,id:string,reason:string):BankState {
 if(!reason.trim())throw new Error('Indica motivo.');const r=s.records.find(x=>x.id===id);if(!r?.temporary)throw new Error('Solo se revierte un registro hipotético.');if(s.links.some(x=>x.active&&x.recordId===id))throw new Error('Resuelve todos los vínculos antes de revertir.');
 return log({...s,records:s.records.filter(x=>x.id!==id)},'Registro hipotético revertido',reason,{recordId:id,cents:Math.abs(r.cents)});
}
export function discard(s:BankState,id:string,reason:string,recover=false):BankState {
 if(!reason.trim())throw new Error('Indica un motivo.');const m=s.movements.find(x=>x.id===id);if(!m)throw new Error('Movimiento inexistente.');if(!recover&&s.links.some(x=>x.active&&x.movementId===id))throw new Error('Resuelve los vínculos antes de descartar.');if(Boolean(m.discarded)===!recover)return s;
 return log({...s,movements:s.movements.map(x=>x.id===id?{...x,discarded:!recover}:x)},recover?'Movimiento recuperado':'Movimiento descartado',reason,{movementId:id,cents:Math.abs(m.cents)});
}
