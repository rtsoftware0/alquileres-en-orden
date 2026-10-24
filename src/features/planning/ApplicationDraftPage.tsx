import { Link } from '@tanstack/react-router';
import { buttonVariants } from '@/components/ui/button';
import { DraftWizard } from '@/features/contracts/DraftWizard';
import { NotFoundMessage } from '@/features/layout/NotFound';
import { usePlanning } from './PlanningContext';
import { applicationDraftValues, updateApplicationDraft } from './simulator';
import { ScenarioNotice } from './PlanningUi';
export function ApplicationDraftPage({id}:{id:string}){
 const {state,setState}=usePlanning();const a=state.applications.find(a=>a.id===id);const draft=state.drafts[id];
 if(!a||!draft)return <><NotFoundMessage title="Borrador temporal no disponible" text="Acepta la solicitud y prepara su borrador, o vuelve tras reiniciar la simulación."/><Link to="/solicitudes/$applicationId" params={{applicationId:id}} className={buttonVariants({variant:'outline'})}>Volver a solicitud</Link></>;
 if(a.status!=='aceptada')return <><ScenarioNotice/><h1 className="mb-3 text-2xl font-semibold">Borrador temporal conservado</h1><p role="status" className="mb-4 text-sm">La solicitud ya no está aceptada. No se permite preparar ni editar este borrador. Al reaceptarla recuperarás el mismo borrador y sus condiciones.</p><Link to="/solicitudes/$applicationId" params={{applicationId:id}} className={buttonVariants({variant:'outline'})}>Volver a {id}</Link></>;
 return <><ScenarioNotice/><div className="mb-4"><Link to="/solicitudes/$applicationId" params={{applicationId:id}} className={buttonVariants({variant:'outline'})}>Volver a {id}</Link><p className="mt-2 text-sm text-demo-foreground">Borrador temporal de {id} · La revisión no ocupa la unidad.</p></div><DraftWizard session={{values:{...draft.values,tenantId:a.contactId,roomId:a.roomId},step:draft.step,linked:true,resetValues:applicationDraftValues(state,id),onChange:(values,step)=>setState(s=>updateApplicationDraft(s,id,values,step))}}/></>;
}
