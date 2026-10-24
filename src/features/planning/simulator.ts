import { demoPortfolio as data } from '@/features/portfolio/data/demo-data';
import { emptyDraft, parseEuroToCents, validateTerms } from '@/features/contracts/draft';
import type { Contract } from '@/features/portfolio/data/types';
import { demoApplications, demoReservations } from './data/demo-planning';
import type { ApplicationStatus, ChangeValues, ChangePreview, PlanningState, Reservation, Segment } from './types';
import { conflicts, intervals } from './selectors';
import { rangeErrors, validDate } from './dates';
export const initialPlanning = ():PlanningState=>({applications:demoApplications.map(a=>({...a})),reservations:demoReservations.map(r=>({...r})),drafts:{},changes:{},changeInputs:{},reservationPreparation:{values:{id:'',applicationId:'',propertyId:'',roomId:'',startDate:'',endDate:'',expiresOn:'',status:'confirmada'},review:false,createdId:''}});
export const STATUS_LABELS:Record<ApplicationStatus,string>={nueva:'Nueva',en_revision:'En revisión',pendiente_informacion:'Pendiente de información',aceptada:'Aceptada',rechazada:'Rechazada',retirada:'Retirada'};
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
 const room=data.rooms.find(r=>r.id===a.roomId);
 const property=data.properties.find(p=>p.id===a.propertyId);
 if(!room||!property) throw new Error('Unidad no válida.');
 return {...state,drafts:{...state.drafts,[id]:{applicationId:id,step:0,values:{...emptyDraft,roomId:a.roomId,tenantId:a.contactId,landlordId:property.ownerId,startDate:a.startDate,endDate:a.endDate,rent:String(room.monthlyRent),deposit:String(room.monthlyRent),dueDay:'5',modality:'Larga estancia por habitación'}}}};
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
 if(v.kind==='renta' && !e['effectiveDate'] && conflicts(intervals(data,state),{propertyId:c.propertyId,roomId:c.roomId,startDate:c.startDate,endDate:c.endDate},intervals(data,state).filter(i=>i.contractId===c.id).map(i=>i.id)).length)e['effectiveDate']='El tramo base coincide con otro intervalo del escenario. Reinicia antes de cambiar el tipo.';
 if(v.kind==='salida') {
 if(effective===c.startDate)e['effectiveDate']='La salida debe ser posterior a la entrada.';
 if(!v.reason.trim())e['reason']='Indica el motivo de la salida anticipada.';
 if(!['revisar','mantener','anular'].includes(v.futureDecision))e['futureDecision']='Elige qué se propondría hacer con obligaciones futuras.';
 }
 return e;
}
export function previewChange(c:Contract,v:ChangeValues,state:PlanningState):ChangePreview {
 const e=changeErrors(c,v,state); if(Object.keys(e).length)throw new Error(Object.values(e)[0]);
 const base:Segment={roomId:c.roomId,propertyId:c.propertyId,startDate:c.startDate,endDate:c.endDate,rentCents:c.rentCents,dueDay:c.dueDay};
 const effective=v.kind==='prorroga'?c.endDate:v.effectiveDate;
 let segments:Segment[]=[];
 if(v.kind==='prorroga')segments=[base,{...base,startDate:c.endDate,endDate:v.endDate}];
 else if(v.kind==='salida')segments=[{...base,endDate:effective}];
 else {
 const room=data.rooms.find(r=>r.id===v.roomId);
 segments=[{...base,endDate:effective},{...base,startDate:effective,...(v.kind==='renta'?{rentCents:parseEuroToCents(v.rent)??c.rentCents,dueDay:Number(v.dueDay)}:{roomId:room?.id??c.roomId,propertyId:room?.propertyId??c.propertyId})}].filter(s=>s.startDate<s.endDate);
 }
 return {contractId:c.id,kind:v.kind,segments,effectiveDate:effective,reason:v.reason,futureDecision:v.futureDecision};
}
