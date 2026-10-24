import type { BankState, Movement, RecordView } from './types';
export const linkedMovement=(s:BankState,id:string)=>s.links.filter(l=>l.active&&l.movementId===id).reduce((n,l)=>n+l.cents,0);
export const linkedRecord=(s:BankState,id:string)=>s.links.filter(l=>l.active&&l.recordId===id).reduce((n,l)=>n+l.cents,0);
export const movementRemaining=(s:BankState,m:Movement)=>Math.abs(m.cents)-linkedMovement(s,m.id);
export const recordRemaining=(s:BankState,r:RecordView)=>Math.abs(r.cents)-linkedRecord(s,r.id);
export function movementStatus(s:BankState,m:Movement) {return m.discarded?'descartado':movementRemaining(s,m)===0?'conciliado':linkedMovement(s,m.id)>0?'parcial':'pendiente';}
export function bankSummary(s:BankState,accountId:string) {
 const rows=s.movements.filter(m=>m.accountId===accountId);const active=rows.filter(m=>!m.discarded);
 return {count:rows.length,net:rows.reduce((n,m)=>n+m.cents,0),imported:rows.reduce((n,m)=>n+Math.abs(m.cents),0),linked:active.reduce((n,m)=>n+linkedMovement(s,m.id),0),pending:active.reduce((n,m)=>n+movementRemaining(s,m),0),discarded:rows.filter(m=>m.discarded).reduce((n,m)=>n+Math.abs(m.cents),0)};
}
export function compatible(m:Movement,r:RecordView){return m.accountId===r.accountId&&m.scope===r.scope&&m.currency===r.currency&&m.kind===r.kind&&Math.sign(m.cents)===Math.sign(r.cents);}
export function suggestions(s:BankState,m:Movement) {return s.records.filter(r=>compatible(m,r)&&recordRemaining(s,r)>0).map(r=>{const reasons:string[]=[];let score=0;if(m.reference===r.reference){reasons.push('Referencia exacta');score+=4;}if(movementRemaining(s,m)===recordRemaining(s,r)){reasons.push('Restantes del mismo importe');score+=2;}if(m.date===r.date){reasons.push('Misma fecha');score++;}return {record:r,score,reasons};}).sort((a,b)=>b.score-a.score||a.record.reference.localeCompare(b.record.reference));}
export function filterMovements(s:BankState,accountId:string,q:string,status:string,sign:string,kind:string) {
 const norm=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 return s.movements.filter(m=>m.accountId===accountId&&(status==='todos'||movementStatus(s,m)===status)&&(sign==='todos'||(sign==='entrada'?m.cents>0:m.cents<0))&&(kind==='todos'||kind===m.kind)&&norm(`${m.concept} ${m.reference} ${m.date}`).includes(norm(q))).sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
}
