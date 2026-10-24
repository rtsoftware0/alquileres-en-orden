import { createFileRoute } from '@tanstack/react-router';
import { ApplicationsPage } from '@/features/planning/ApplicationsPage';
import { site } from '@/config/site';
const title = `Candidatos y solicitudes · ${site.name}`;
const description = 'Candidatos y solicitudes con datos ficticios y simulación temporal sin operaciones reales.';
export const Route = createFileRoute('/solicitudes')({
 head:()=>({meta:[{title},{name:'description',content:description},{property:'og:title',content:title},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),
 component: Page,
});
function Page(){return <ApplicationsPage/>; }
