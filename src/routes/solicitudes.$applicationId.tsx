import { createFileRoute } from '@tanstack/react-router';
import { ApplicationPage } from '@/features/planning/ApplicationsPage';
import { site } from '@/config/site';
const title = `Solicitud de ejemplo · ${site.name}`;
const description = 'Solicitud de ejemplo con datos ficticios y simulación temporal sin operaciones reales.';
export const Route = createFileRoute('/solicitudes/$applicationId')({
 head:()=>({meta:[{title},{name:'description',content:description},{property:'og:title',content:title},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),
 component: Page,
});
function Page(){return <ApplicationPage key={Route.useParams().applicationId} id={Route.useParams().applicationId}/>; }
