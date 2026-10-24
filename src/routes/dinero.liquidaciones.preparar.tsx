import {createFileRoute} from '@tanstack/react-router';
import {site} from '@/config/site';
import {PrepareSettlementPage} from '@/features/settlements/PreparePage';
export const Route=createFileRoute('/dinero/liquidaciones/preparar')({head:()=>({meta:[{title:`Preparar liquidación · ${site.name}`},{name:'description',content:'Preparar liquidación en una demostración temporal con datos ficticios, sin operaciones reales.'},{property:'og:title',content:`Preparar liquidación · ${site.name}`},{property:'og:description',content:'Preparar liquidación en una demostración temporal con datos ficticios.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:Page});
function Page(){return <PrepareSettlementPage/>;}
