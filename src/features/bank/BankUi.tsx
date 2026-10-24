import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { RotateCcw, Landmark } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { fieldClass, linkClass } from '@/features/layout/ui';
import { MoneyNav } from '@/features/money/components/MoneyUi';
import { useBank } from './BankContext';
import type { RecordView } from './types';
export function BankNav(){return <><MoneyNav/><nav aria-label="Banco" className="mb-4 flex flex-wrap gap-3"><Link to="/dinero/banco" className={linkClass}><Landmark className="mr-1 inline h-4 w-4"/>Movimientos</Link><Link to="/dinero/banco/extracto" className={linkClass}>Preparar extracto incorporado</Link></nav></>;}
export function BankNotice(){const {reset}=useBank();return <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-y border-border py-3"><p className="text-sm text-demo-foreground">Simulación temporal · Referencia 21/10/2026. No cambia caja, deuda ni fianzas.</p><Button variant="outline" size="sm" onClick={reset}><RotateCcw/>Reiniciar Banco</Button></div>;}
export function Field({id,label,error,children}:{id:string;label:string;error?:string|undefined;children:ReactNode}){return <div className="min-w-0"><label htmlFor={id} className="mb-1 block text-sm font-medium">{label}</label>{children}{error&&<p id={`${id}-error`} className="mt-1 text-sm text-destructive">{error}</p>}</div>;}
export const aria=(id:string,errors:Record<string,string>)=>({id,'aria-invalid':Boolean(errors[id]),'aria-describedby':errors[id]?`${id}-error`:undefined});
export const focusError=(e:Record<string,string>)=>{const id=Object.keys(e)[0];if(id)document.getElementById(id)?.focus();};
export function RecordLink({r}:{r:RecordView}) {return r.kind==='proveedor'&&r.expenseId?<Link to="/dinero/gastos/$expenseId" params={{expenseId:r.expenseId}} className={linkClass}>{r.reference} · Abrir gasto existente</Link>:r.kind==='fianza'&&r.contractId?<Link to="/dinero/fianzas/$contractId" params={{contractId:r.contractId}} className={linkClass}>{r.reference} · Abrir fianza separada</Link>:r.contactId?<Link to="/dinero/inquilinos/$contactId" params={{contactId:r.contactId}} className={linkClass}>{r.reference} · Cuenta del inquilino</Link>:<span>{r.reference} · {r.temporary?'Hipotético':'Didáctico'}</span>;}
export { fieldClass, linkClass, Button, buttonVariants };
