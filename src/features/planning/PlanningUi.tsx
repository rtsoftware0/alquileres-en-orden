import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fieldClass, linkClass } from '@/features/layout/ui';
import { demoPortfolio as data } from '@/features/portfolio/data/demo-data';
import { formatDate } from '@/lib/format';
import { nextDay } from './dates';
import type { Interval } from './types';
import { usePlanning } from './PlanningContext';
export function ScenarioNotice(){const {reset}=usePlanning();return <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-y border-border py-3 text-sm"><p className="text-demo-foreground">Simulación temporal · Referencia 21/10/2026 · No se guardan cambios.</p><Button variant="outline" size="sm" onClick={reset}><RotateCcw className="h-4 w-4"/>Reiniciar escenario</Button></div>;}
export function PlanningNav(){return <nav aria-label="Planificación" className="mb-5 flex flex-wrap gap-4 text-sm"><Link to="/calendario" className={linkClass}>Calendario</Link><Link to="/solicitudes" className={linkClass}>Candidatos y solicitudes</Link><Link to="/reservas" className={linkClass}>Reservas</Link></nav>;}
export function Field({id,label,error,children}:{id:string;label:string;error?:string;children:ReactNode}){return <div className="min-w-0 text-sm"><label htmlFor={id} className="mb-1 block font-medium">{label}</label>{children}{error&&<p id={`${id}-error`} className="mt-1 text-sm text-destructive" role="alert">{error}</p>}</div>;}
export const ariaField=(id:string,errors:Record<string,string>)=>({id,'aria-invalid':Boolean(errors[id]),'aria-describedby':errors[id]?`${id}-error`:undefined});
export function focusError(errors:Record<string,string>){const key=Object.keys(errors)[0];if(key)requestAnimationFrame(()=>document.getElementById(key)?.focus());return Boolean(key);}
export function ScopeFields({propertyId,roomId,onChange,errors={},whole=true}:{propertyId:string;roomId:string;onChange:(propertyId:string,roomId:string)=>void;errors?:Record<string,string>;whole?:boolean}){return <><Field id="propertyId" label="Vivienda" error={errors.propertyId}><select {...ariaField('propertyId',errors)} className={fieldClass} value={propertyId} onChange={e=>onChange(e.target.value,'')}><option value="">Elige una vivienda</option>{data.properties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><Field id="roomId" label="Unidad" error={errors.roomId}><select {...ariaField('roomId',errors)} className={fieldClass} value={roomId} onChange={e=>onChange(propertyId,e.target.value)}><option value="">{whole?'Vivienda completa':'Elige una habitación'}</option>{data.rooms.filter(r=>r.propertyId===propertyId).map(r=><option key={r.id} value={r.id}>{r.code}</option>)}</select></Field></>;}
export function Period({start,end}:{start:string;end?:string}){return <span className="tabular">Entrada {formatDate(start)} (incluida){end?<> · Salida {formatDate(end)} (excluida)<br/>Último día ocupado: {formatDate(nextDay(end,-1))}</>:<> · Sin fin conocido</>}</span>;}
export function IntervalLink({interval:i}:{interval:Interval}){if(i.reservationId)return <Link to="/reservas/$reservationId" params={{reservationId:i.reservationId}} className={linkClass}>{i.label}</Link>;if(i.contractId)return <Link to="/contratos/$contractId" params={{contractId:i.contractId}} className={linkClass}>{i.label}</Link>;return <Link to="/incidencias/$incidentId" params={{incidentId:i.incidentId??'inc-1'}} className={linkClass}>{i.label}</Link>;}
