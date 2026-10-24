import { createFileRoute } from '@tanstack/react-router';
import { CalendarPage } from '@/features/planning/CalendarPage';
import { site } from '@/config/site';
const title = `Calendario y disponibilidad · ${site.name}`;
const description = 'Calendario y disponibilidad con datos ficticios y simulación temporal sin operaciones reales.';
export const Route = createFileRoute('/calendario')({
 head:()=>({meta:[{title},{name:'description',content:description},{property:'og:title',content:title},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),
 component: Page,
});
function Page(){return <CalendarPage/>; }
