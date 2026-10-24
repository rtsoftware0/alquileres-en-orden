import { createFileRoute } from '@tanstack/react-router';
import { ReservationsPage } from '@/features/planning/ReservationsPage';
import { site } from '@/config/site';
const title = `Reservas de ejemplo · ${site.name}`;
const description = 'Reservas de ejemplo con datos ficticios y simulación temporal sin operaciones reales.';
export const Route = createFileRoute('/reservas/')({
 head:()=>({meta:[{title},{name:'description',content:description},{property:'og:title',content:title},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),
 component: Page,
});
function Page(){return <ReservationsPage/>; }
