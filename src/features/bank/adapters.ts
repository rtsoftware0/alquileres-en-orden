import type { PortfolioDataset } from '@/features/portfolio/data/types';
import type { RecordView } from './types';
// Read-only projections: reconciliation never writes to these ledgers.
export function baseRecords(d:PortfolioDataset):RecordView[] {
 return [
 ...d.payments.map(p=>({id:`rent:${p.id}`,reference:p.reference,date:p.receivedOn,cents:p.amountCents,kind:'renta' as const,scope:'base' as const,accountId:'cuenta-demo',currency:'EUR',base:true,contactId:p.payerId,...(p.contractId?{contractId:p.contractId}:{})})),
 ...d.expensePayments.map(p=>({id:`provider:${p.id}`,reference:p.reference,date:p.date,cents:-p.amountCents,kind:'proveedor' as const,scope:'base' as const,accountId:'cuenta-demo',currency:'EUR',base:true,expenseId:p.expenseId,contactId:d.expenses.find(e=>e.id===p.expenseId)?.providerId})),
 ...d.depositMovements.map(p=>({id:`deposit:${p.id}`,reference:p.id.toUpperCase(),date:p.date,cents:p.kind==='recepcion'?p.amountCents:-p.amountCents,kind:'fianza' as const,scope:'base' as const,accountId:'cuenta-demo',currency:'EUR',base:true,contractId:p.contractId,contactId:p.partyId})),
 ];
}
