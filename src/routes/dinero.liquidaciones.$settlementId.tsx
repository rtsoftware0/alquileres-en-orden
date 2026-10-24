import {createFileRoute} from '@tanstack/react-router';
import {site} from '@/config/site';
import {SettlementDetailPage} from '@/features/settlements/DetailPage';
export const Route=createFileRoute('/dinero/liquidaciones/$settlementId')({head:()=>({meta:[{title:`Detalle de liquidación · ${site.name}`},{name:'description',content:'Detalle de liquidación en una demostración temporal con datos ficticios, sin operaciones reales.'},{property:'og:title',content:`Detalle de liquidación · ${site.name}`},{property:'og:description',content:'Detalle de liquidación en una demostración temporal con datos ficticios.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:Page});
function Page(){const {settlementId}=Route.useParams();return <SettlementDetailPage key={settlementId} id={settlementId}/>;}
