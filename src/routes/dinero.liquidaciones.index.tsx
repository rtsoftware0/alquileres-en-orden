import {createFileRoute} from '@tanstack/react-router';
import {site} from '@/config/site';
import {SettlementListPage} from '@/features/settlements/ListPage';
export const Route=createFileRoute('/dinero/liquidaciones/')({head:()=>({meta:[{title:`Liquidaciones · ${site.name}`},{name:'description',content:'Liquidaciones en una demostración temporal con datos ficticios, sin operaciones reales.'},{property:'og:title',content:`Liquidaciones · ${site.name}`},{property:'og:description',content:'Liquidaciones en una demostración temporal con datos ficticios.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:Page});
function Page(){return <SettlementListPage/>;}
