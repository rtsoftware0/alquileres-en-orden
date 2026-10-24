import type { PortfolioDataset } from '@/features/portfolio/data/types';
import type { BankState } from '@/features/bank/types';
import { movementRemaining } from '@/features/bank/selectors';
import { chargeBalance, moneySummary } from '@/features/money/selectors';
import { contexts, exampleLines } from './data/examples';
import type { CloseReview, Source, SourceLine, State } from './types';
const sum=(xs:number[])=>xs.reduce((a,b)=>a+b,0);
export function sourceFor(d:PortfolioDataset,contextId:string,month:string):Source {
 const context=contexts.find(c=>c.id===contextId);if(!context)throw new Error('Elige un activo de ejemplo.');
 if(context.scope==='didactico') {const lines=exampleLines(contextId,month);return {contextId,month,lines,accrualCents:contextId==='a16'?sum(lines.filter(l=>l.kind==='renta').map(l=>l.cents)):0,cashCents:sum(lines.filter(l=>l.kind==='renta'||l.kind==='libre').map(l=>l.cents)),costCents:sum(lines.filter(l=>l.kind==='gasto').map(l=>l.cents)),paidCostCents:0,invalid:[]};}
 const lines:SourceLine[]=[];const invalid:string[]=[];
 for(const a of d.allocations){const p=d.payments.find(x=>x.id===a.paymentId);const ch=d.charges.find(x=>x.id===a.chargeId);const ct=d.contracts.find(x=>x.id===ch?.contractId);
 if(!p||!ch||!ct){invalid.push(`Asignación ${a.id} con relación inválida`);continue;}
 if(ct.propertyId===context.propertyId&&!ch.voidReason&&p.receivedOn.slice(0,7)===month)lines.push({id:a.id,label:`${p.reference} → ${ch.reference} · recibido ${p.receivedOn}`,cents:a.amountCents,period:ch.period,date:p.receivedOn,kind:'renta',assigned:true,link:{kind:'cargo',id:ch.id}});
 }
 for(const p of d.payments){const ct=d.contracts.find(c=>c.id===p.contractId);if(ct?.propertyId!==context.propertyId||p.receivedOn.slice(0,7)!==month)continue;const free=p.amountCents-sum(d.allocations.filter(a=>a.paymentId===p.id).map(a=>a.amountCents));if(free<0)invalid.push(`${p.reference}: asignaciones superiores al cobro`);if(free>0)lines.push({id:`free-${p.id}`,label:`${p.reference} · sin asignar`,cents:free,period:month,date:p.receivedOn,kind:'libre'});}
 for(const m of d.depositMovements){if(d.contracts.find(c=>c.id===m.contractId)?.propertyId===context.propertyId&&m.date.slice(0,7)===month)lines.push({id:m.id,label:`${m.id} · fianza ${m.kind}`,cents:m.amountCents,period:month,date:m.date,kind:'fianza'});}
 const expenses=d.expenses.filter(e=>e.propertyId===context.propertyId&&e.period===month);
 for(const e of expenses)lines.push({id:e.id,label:`${e.reference} · ${e.concept} · aprobación no registrada`,cents:e.amountCents,period:e.period,date:e.date,kind:'gasto',approved:false,bearer:e.bearer,link:{kind:'gasto',id:e.id}});
 const charges=d.charges.filter(ch=>!ch.voidReason&&ch.period===month&&d.contracts.find(c=>c.id===ch.contractId)?.propertyId===context.propertyId);
 for(const ch of d.charges){if(!d.contracts.some(c=>c.id===ch.contractId))invalid.push(`${ch.id}: contrato inexistente`);const allocated=sum(d.allocations.filter(a=>a.chargeId===ch.id).map(a=>a.amountCents));if(allocated>ch.amountCents||ch.voidReason&&allocated>0)invalid.push(`${ch.id}: asignación incompatible`);}
 const cash=d.payments.filter(p=>p.receivedOn.slice(0,7)===month&&d.contracts.find(c=>c.id===p.contractId)?.propertyId===context.propertyId);
 const paid=d.expensePayments.filter(p=>p.date.slice(0,7)===month&&d.expenses.some(e=>e.id===p.expenseId&&e.propertyId===context.propertyId));
 return {contextId,month,lines,accrualCents:sum(charges.map(c=>c.amountCents)),cashCents:sum(cash.map(p=>p.amountCents)),costCents:sum(expenses.map(e=>e.amountCents)),paidCostCents:sum(paid.map(p=>p.amountCents)),invalid};
}
export function closeReview(d:PortfolioDataset,bank:BankState,s:State,month:string):CloseReview {
 const sources=contexts.filter(c=>c.scope==='cartera').map(c=>sourceFor(d,c.id,month));
 const rows=bank.movements.filter(m=>m.scope==='base'&&m.accountId==='cuenta-demo'&&m.date.slice(0,7)===month&&!m.discarded);
 const pendingCents=sum(d.charges.filter(c=>c.period<=month).map(c=>chargeBalance(d,c).outstandingCents));
 const bankPendingCents=sum(rows.map(m=>movementRemaining(bank,m)));const unallocatedCents=moneySummary(d,{period:month}).unallocatedCents;
 const current=s.settlements.filter(x=>x.month===month);const issues:string[]=[];
 if(pendingCents)issues.push(`Deuda acumulada hasta ${month} pendiente de cobro`);
 if(bankPendingCents)issues.push('Movimientos de cuenta de cartera sin conciliar completamente');
 if(unallocatedCents)issues.push('Cobros del mes con dinero sin asignar');
 if(sources.some(x=>x.lines.some(l=>l.kind==='gasto'&&!l.approved)))issues.push('Gastos de cartera sin aprobación registrada; no deducidos en agencia');
 if(current.some(x=>x.versions.at(-1)?.status!=='aprobado'))issues.push('Hay liquidaciones temporales sin aprobar');
 if(!current.length)issues.push('No hay liquidaciones preparadas para este mes');
 const invalid=[...new Set(sources.flatMap(x=>x.invalid))];
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))invalid.push('Mes inválido');
 for(const source of sources)for(const l of source.lines)if(!Number.isSafeInteger(l.cents)||l.cents<0||!/^\d{4}-\d{2}-\d{2}$/.test(l.date))invalid.push(`Línea inválida ${l.id}`);
 const scopedLinks=bank.links.filter(l=>rows.some(m=>m.id===l.movementId));
 const adjustmentsCents=sum(current.map(x=>x.versions.at(-1)?.rules.adjustmentCents??0));
 if(adjustmentsCents)issues.push('Ajustes manuales de liquidaciones a reconocer');
 const fingerprint=JSON.stringify({month,sources,rows,scopedLinks,current,payments:s.payments.filter(p=>current.some(x=>x.id===p.settlementId)),pendingCents,unallocatedCents});
 return {month,fingerprint,issues,invalid,pendingCents,bankPendingCents,unallocatedCents,adjustmentsCents,accountLabel:'Cuenta de cartera · cuenta-demo; excluye cuenta didáctica'};
}
