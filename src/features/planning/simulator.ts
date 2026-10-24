import { demoPortfolio as data } from '@/features/portfolio/data/demo-data';
import { emptyDraft, parseEuroToCents, validateTerms, type DraftValues } from '@/features/contracts/draft';
import type { Contract } from '@/features/portfolio/data/types';
import { demoApplications, demoReservations } from './data/demo-planning';
import type { ApplicationStatus, ChangeValues, ChangePreview, PlanningState, Reservation, Segment } from './types';
import { conflicts, intervals } from './selectors';
import { rangeErrors, validDate } from './dates';
export const initialPlanning = ():PlanningState=>({applications:demoApplications.map(a=>({...a})),reservations:demoReservations.map(r=>({...r})),drafts:{},changes:{},changeInputs:{},reservationPreparation:{values:{id:'',applicationId:'',propertyId:'',roomId:'',startDate:'',endDate:'',expiresOn:'',status:'confirmada'},review:false,createdId:''}});
export const STATUS_LABELS:Record<ApplicationStatus,string>={nueva:'Nueva',en_revision:'En revisión',pendiente_informacion:'Pendiente de información',aceptada:'Aceptada',rechazada:'Rechazada',retirada:'Retirada'};
// Explicit lessor relationships, not inferred from property ownership.
const applicationLandlords: Record<string, string> = { 'casa-olivo': 'con-009', 'casa-azahar': 'con-011' };
export function applicationDraftValues(state: PlanningState, id: string): DraftValues {
 const a=state.applications.find(a=>a.id===id);
 const room=data.rooms.find(r=>r.id===a?.roomId);
 const landlordId=a?applicationLandlords[a.propertyId]:undefined;
 if(!a||!room||!landlordId)throw new Error('Solicitud o relación arrendadora no válida.');
 return {...emptyDraft,roomId:a.roomId,tenantId:a.contactId,landlordId,startDate:a.startDate,endDate:a.endDate,rent:String(room.monthlyRent),deposit:String(room.monthlyRent),dueDay:'5',modality:'Larga estancia por habitación'};
}
export function updateApplicationDraft(state: PlanningState, id: string, values: DraftValues, step: number): PlanningState {
 const a=state.applications.find(a=>a.id===id);
 if(!a||a.status!=='aceptada'||!state.drafts[id])throw new Error('El borrador se conserva, pero solo puede editarse con la solicitud aceptada.');
 return {...state,drafts:{...state.drafts,[id]:{applicationId:id,step,values:{...values,roomId:a.roomId,tenantId:a.contactId}}}};
}
export function transitionApplication(state:PlanningState,id:string,status:ApplicationStatus,reason:string):PlanningState {
 const a=state.applications.find(a=>a.id===id);
 if(!a||!(status in STATUS_LABELS)) throw new Error('Solicitud o estado no válido.');
 if(['rechazada','retirada','pendiente_informacion'].includes(status)&&!reason.trim()) throw new Error('Indica un motivo para este cambio.');
 if(a.status===status) return state;
 return {...state,applications:state.applications.map(a=>a.id===id?{...a,status,nextAction:reason.trim()||`Estado ${STATUS_LABELS[status]} en simulación`}:a)};
}
export function convertApplication(state:PlanningState,id:string):PlanningState {
 const a=state.applications.find(a=>a.id===id);
 if(!a||a.status!=='aceptada') throw new Error('La solicitud debe estar aceptada.');
 if(a.contractId||state.drafts[id]) return state;
 return {...state,drafts:{...state.drafts,[id]:{applicationId:id,step:0,values:applicationDraftValues(state,id)}}};
}
const sameReservation=(a:Reservation,b:Reservation)=>a.applicationId===b.applicationId&&a.propertyId===b.propertyId&&(a.roomId||'')===(b.roomId||'')&&a.startDate===b.startDate&&a.endDate===b.endDate&&a.expiresOn===b.expiresOn;
export function reservationErrors(state:PlanningState,r:Reservation) {
 const e=rangeErrors(r.startDate,r.endDate);
 const a=state.applications.find(a=>a.id===r.applicationId);
 if(!a||['rechazada','retirada'].includes(a.status)) e['applicationId']='Elige una solicitud vigente.';
 if(!data.properties.some(p=>p.id===r.propertyId)|| (r.roomId&&!data.rooms.some(x=>x.id===r.roomId&&x.propertyId===r.propertyId))) e['roomId']='Elige una vivienda y unidad válidas.';
 if(!validDate(r.expiresOn)||r.expiresOn<=data.referenceDate||r.expiresOn>=r.startDate) e['expiresOn']='Usa una caducidad posterior al 21/10/2026 y anterior a la entrada en este ejemplo.';
 if(validDate(r.startDate)&&r.startDate<data.referenceDate) e['startDate']='La reserva no puede comenzar antes de la referencia.';
 if(!Object.keys(e).length) {
 const collision=state.reservations.find(x=>x.id===r.id);
 if(collision&&(collision.status!=='confirmada'||!sameReservation(collision,r)))e['roomId']='La reserva existente tiene otras fechas o estado. Reinicia el escenario.';
 const hits=conflicts(intervals(data,state),r,collision&&sameReservation(collision,r)?[r.id]:[]);
 if(hits.length)e['roomId']=`Conflicto: ${hits.map(h=>h.label).join(', ')}.`;
 }
 return e;
}
export function confirmReservation(state:PlanningState,r:Reservation):PlanningState {
 const existing=state.reservations.find(x=>x.id===r.id);
 if(existing){if(existing.status==='confirmada'&&sameReservation(existing,r))return state;throw new Error('Esta reserva ya existe con otras fechas o estado. Reinicia el escenario para otra preparación.');}
 const e=reservationErrors(state,r); if(Object.keys(e).length) throw new Error(Object.values(e)[0]);
 return {...state,reservations:[...state.reservations,{...r,status:'confirmada'}]};
}
export function prepareForApplication(state:PlanningState,id:string):PlanningState {
 const a=state.applications.find(a=>a.id===id);if(!a)throw new Error('Solicitud no válida.');
 return {...state,reservationPreparation:{values:{id:`res-sim-${a.id}-${a.roomId}`,applicationId:a.id,propertyId:a.propertyId,roomId:a.roomId,startDate:a.startDate,endDate:a.endDate,expiresOn:'',status:'confirmada'},review:false,createdId:''}};
}
export function releaseReservation(state:PlanningState,id:string,status:'cancelada'|'caducada',reason:string):PlanningState {
 if(!reason.trim())throw new Error('Indica el motivo de la simulación.');
 return {...state,reservations:state.reservations.map(r=>r.id===id&&r.status==='confirmada'?{...r,status,reason:reason.trim()}:r)};
}
export const emptyChange=(c:Contract):ChangeValues=>({kind:'renta',effectiveDate:'',endDate:'',roomId:'',rent:String(c.rentCents/100),dueDay:String(c.dueDay),reason:'',futureDecision:''});
export function changeErrors(c:Contract,v:ChangeValues,state:PlanningState) {
 const e:Record<string,string>={};
 if(c.status!=='activo') e['kind']='Solo contratos activos.';
 if(!['renta','habitacion','prorroga','salida'].includes(v.kind)) e['kind']='Cambio no válido.';
 const effective=v.kind==='prorroga'?c.endDate:v.effectiveDate;
 if(!validDate(effective)||effective<data.referenceDate||effective<c.startDate||(v.kind!=='prorroga'&&effective>=c.endDate)) e['effectiveDate']='Elige una fecha desde 21/10/2026 y dentro de la vigencia.';
 if(v.kind==='prorroga') {
 if(!validDate(v.endDate)||v.endDate<=c.endDate) e['endDate']='La nueva salida debe ser posterior al fin actual.';
 else if(conflicts(intervals(data,state),{propertyId:c.propertyId,roomId:c.roomId,startDate:c.endDate,endDate:v.endDate},intervals(data,state).filter(i=>i.contractId===c.id).map(i=>i.id)).length)e['endDate']='La prórroga coincide con otro intervalo.';
 }
 if(v.kind==='habitacion') {
 const dest=data.rooms.find(r=>r.id===v.roomId);
 if(!dest||dest.id===c.roomId)e['roomId']='Elige una habitación distinta.';
 else if(!e['effectiveDate']&&conflicts(intervals(data,state),{propertyId:dest.propertyId,roomId:dest.id,startDate:effective,endDate:c.endDate},intervals(data,state).filter(i=>i.contractId===c.id).map(i=>i.id)).length)e['roomId']='El destino tiene ocupación, reserva o mantenimiento en ese tramo.';
 }
 if(v.kind==='renta') {
 const terms=validateTerms({...emptyDraft,startDate:c.startDate,endDate:c.endDate,rent:v.rent,deposit:'0',dueDay:v.dueDay,modality:c.modality});
 if(terms.rent)e['rent']=terms.rent; if(terms.dueDay)e['dueDay']=terms.dueDay;
 }
 if(v.kind==='salida') {
 if(effective===c.startDate)e['effectiveDate']='La salida debe ser posterior a la entrada.';
 if(!v.reason.trim())e['reason']='Indica el motivo de la salida anticipada.';
 if(!['revisar','mantener','anular'].includes(v.futureDecision))e['futureDecision']='Elige qué se propondría hacer con obligaciones futuras.';
 }
 if(!Object.keys(e).length){
 const conflict=segmentConflict(c,changeSegments(c,v),state);
 if(conflict)e[v.kind==='prorroga'?'endDate':'effectiveDate']=conflict;
 }
 return e;
}
function baseSegment(c: Contract): Segment {
 return {roomId:c.roomId,propertyId:c.propertyId,startDate:c.startDate,endDate:c.endDate,rentCents:c.rentCents,dueDay:c.dueDay};
}
function segmentConflict(c: Contract, segments: Segment[], state: PlanningState): string | undefined {
 const list=intervals(data,state);
 const own=list.filter(i=>i.contractId===c.id).map(i=>i.id);
 for(const segment of segments){
 const hits=conflicts(list,segment,own);
 if(hits.length)return `Conflicto en ${segment.roomId.toUpperCase()} (${segment.startDate} – ${segment.endDate}): ${hits.map(i=>i.label).join(', ')}. Se conserva el cambio aplicado; no se han cancelado reservas.`;
 }
 return undefined;
}
function changeSegments(c:Contract,v:ChangeValues):Segment[] {
 const base:Segment={roomId:c.roomId,propertyId:c.propertyId,startDate:c.startDate,endDate:c.endDate,rentCents:c.rentCents,dueDay:c.dueDay};
 const effective=v.kind==='prorroga'?c.endDate:v.effectiveDate;
 let segments:Segment[]=[];
 if(v.kind==='prorroga')segments=[base,{...base,startDate:c.endDate,endDate:v.endDate}];
 else if(v.kind==='salida')segments=[{...base,endDate:effective}];
 else {
 const room=data.rooms.find(r=>r.id===v.roomId);
 segments=[{...base,endDate:effective},{...base,startDate:effective,...(v.kind==='renta'?{rentCents:parseEuroToCents(v.rent)??c.rentCents,dueDay:Number(v.dueDay)}:{roomId:room?.id??c.roomId,propertyId:room?.propertyId??c.propertyId})}].filter(s=>s.startDate<s.endDate);
 }
 return segments;
}
export function previewChange(c:Contract,v:ChangeValues,state:PlanningState):ChangePreview {
 const e=changeErrors(c,v,state); if(Object.keys(e).length)throw new Error(Object.values(e)[0]);
 return {contractId:c.id,kind:v.kind,segments:changeSegments(c,v),effectiveDate:v.kind==='prorroga'?c.endDate:v.effectiveDate,reason:v.reason,futureDecision:v.futureDecision,input:{...v}};
}
export function editChangeInputs(state: PlanningState, id: string, values: ChangeValues): PlanningState {
 return {...state,changeInputs:{...state.changeInputs,[id]:{...values}}};
}
export function revertChange(c: Contract, state: PlanningState): PlanningState {
 const conflict=segmentConflict(c,[baseSegment(c)],state);
 if(conflict)throw new Error(`No se puede reiniciar este cambio: ${conflict} Usa el reinicio global para volver a la base completa.`);
 const changes={...state.changes};delete changes[c.id];
 return {...state,changes,changeInputs:{...state.changeInputs,[c.id]:emptyChange(c)}};
}
