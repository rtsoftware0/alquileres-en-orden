import { createFileRoute } from '@tanstack/react-router';
import { ReservationDraftPage } from '@/features/planning/ReservationsPage';
import { site } from '@/config/site';
const title = `Preparar reserva simulada · ${site.name}`;
const description = 'Preparar reserva simulada con datos ficticios y simulación temporal sin operaciones reales.';
export const Route = createFileRoute('/reservas/preparar')({
 head:()=>({meta:[{title},{name:'description',content:description},{property:'og:title',content:title},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),
 component: Page,
});
function Page(){return <ReservationDraftPage/>; }
