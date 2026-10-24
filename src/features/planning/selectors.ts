import type { PortfolioDataset } from '@/features/portfolio/data/types';
import type { Interval, PlanningState } from './types';
import { overlaps } from './dates';
export function intervals(data:PortfolioDataset,state:PlanningState):Interval[] {
 const contracts = data.contracts.filter(c=>c.status==='activo'||c.status==='finalizado').flatMap(c=>{
  const segments=state.changes[c.id]?.segments ?? [{roomId:c.roomId,propertyId:c.propertyId,startDate:c.startDate,endDate:c.endDate}];
  return segments.map((s,i)=>({id:`${c.id}-${i}`, ...s,kind:'contrato' as const,label:c.reference,contractId:c.id}));
 });
 const reservations=state.reservations.filter(r=>r.status==='confirmada').map(r=>({id:r.id,propertyId:r.propertyId,roomId:r.roomId,startDate:r.startDate,endDate:r.endDate,kind:'reserva' as const,label:r.id==='res-1'?'Reserva OLI-06':`Reserva simulada ${r.id}`,reservationId:r.id,contractId:r.contractId}));
 return [...contracts,...reservations,{id:'maint-aza-06',propertyId:'casa-azahar',roomId:'aza-06',startDate:'2026-10-14',kind:'mantenimiento',label:'Humedad · sin fin conocido',incidentId:'inc-1'}];
}
export function conflicts(list:Interval[],scope:{propertyId:string;roomId?:string | undefined;startDate:string;endDate:string},ignoreIds:string[]=[]) {
 return list.filter(i=>!ignoreIds.includes(i.id)&&i.propertyId===scope.propertyId&&(!scope.roomId||!i.roomId||i.roomId===scope.roomId)&&overlaps(i,scope));
}
export const contactName=(data:PortfolioDataset,id:string)=>data.contacts.find(c=>c.id===id)?.name??id;
export const unitName=(data:PortfolioDataset,propertyId:string,roomId?:string)=>roomId ? data.rooms.find(r=>r.id===roomId)?.code??roomId : `${data.properties.find(p=>p.id===propertyId)?.name} · vivienda completa`;
export const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
