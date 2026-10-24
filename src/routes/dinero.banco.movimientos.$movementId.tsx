import { createFileRoute } from '@tanstack/react-router';
import { site } from '@/config/site';
import { MovementPage } from '@/features/bank/MovementPage';
export const Route=createFileRoute('/dinero/banco/movimientos/$movementId')({
 head:()=>({meta:[{title:`Conciliación de movimiento · ${site.name}`},{name:'description',content:'Enlaces simulados de movimientos con cobros, pagos y fianzas de ejemplo.'},{property:'og:title',content:`Conciliación de movimiento · ${site.name}`},{property:'og:description',content:'Enlaces simulados de movimientos con cobros, pagos y fianzas de ejemplo.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),
 component:Page,
});
function Page(){const {movementId}=Route.useParams();return <MovementPage key={movementId} id={movementId}/>;}
