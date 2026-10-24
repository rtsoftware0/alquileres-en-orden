import { createFileRoute } from '@tanstack/react-router';
import { ContractChangePage } from '@/features/planning/ContractChangePage';
import { site } from '@/config/site';
const title = `Simular cambios contractuales · ${site.name}`;
const description = 'Simular cambios contractuales con datos ficticios y simulación temporal sin operaciones reales.';
export const Route = createFileRoute('/contratos/$contractId_/cambios')({
 head:()=>({meta:[{title},{name:'description',content:description},{property:'og:title',content:title},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),
 component: Page,
});
function Page(){return <ContractChangePage key={Route.useParams().contractId} id={Route.useParams().contractId}/>; }
