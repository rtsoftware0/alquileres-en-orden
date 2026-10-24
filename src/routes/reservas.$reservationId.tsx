import { createFileRoute } from '@tanstack/react-router';
import { ReservationPage } from '@/features/planning/ReservationsPage';
import { site } from '@/config/site';
const title = `Reserva de ejemplo · ${site.name}`;
const description = 'Reserva de ejemplo con datos ficticios y simulación temporal sin operaciones reales.';
export const Route = createFileRoute('/reservas/$reservationId')({
 head:()=>({meta:[{title},{name:'description',content:description},{property:'og:title',content:title},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),
 component: Page,
});
function Page(){return <ReservationPage key={Route.useParams().reservationId} id={Route.useParams().reservationId}/>; }
