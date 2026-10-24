export type Model = 'propio' | 'agencia' | 'renta_fija';
export interface Participant { id:string; name:string; basisPoints:number }
export interface SourceLine { id:string; label:string; cents:number; period:string; date:string; kind:'renta'|'gasto'|'fianza'|'libre'; assigned?:boolean; approved?:boolean; bearer?:'propietario'|'operador'|'inquilino'; link?:{kind:'cargo'|'gasto';id:string} }
export interface Source { contextId:string; month:string; lines:SourceLine[]; accrualCents:number; cashCents:number; costCents:number; paidCostCents:number; invalid:string[] }
export interface Context { id:string; name:string; scope:'cartera'|'didactico'; propertyId?:string; ownerId?:string; lessorId?:string; participants:Participant[]; model:Model; fixedCents:number }
export interface Rules { model:Model; feeKind:'porcentaje'|'fijo'; feeValue:number; fixedCents:number; priorCents:number; adjustmentCents:number; adjustmentReason:string; participants:Participant[] }
export interface Calculation { incomeCents:number; feeCents:number; deductibleCents:number; operatingCents:number; marginCents:number; resultCents:number; payableCents:number; shares:{id:string;name:string;cents:number}[]; excluded:SourceLine[]; income:SourceLine[]; deductions:SourceLine[] }
export interface Version { number:number; status:'borrador'|'revisado'|'aprobado'; rules:Rules; source:Source; calculation:Calculation; reason:string; actor:string; date:string }
export interface Settlement { id:string; contextId:string; month:string; versions:Version[] }
export interface OwnerPayment { id:string; operationId:string; settlementId:string; beneficiaryId:string; cents:number; date:string; reference:string }
export interface CloseReview { month:string; fingerprint:string; issues:string[]; invalid:string[]; pendingCents:number; bankPendingCents:number; unallocatedCents:number; adjustmentsCents:number; accountLabel:string }
export interface Closing { review:CloseReview; closed:boolean; actor:string; date:string }
export interface State { settlements:Settlement[]; payments:OwnerPayment[]; closings:Record<string,Closing>; history:{action:string;reason:string;date:string;actor:string}[]; operations:Record<string,string>; nextId:number }
