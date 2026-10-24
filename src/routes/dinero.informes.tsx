import {createFileRoute} from '@tanstack/react-router';
import {site} from '@/config/site';
import {ReportsPage} from '@/features/settlements/ReportsPage';
export const Route=createFileRoute('/dinero/informes')({head:()=>({meta:[{title:`Informes básicos · ${site.name}`},{name:'description',content:'Informes básicos en una demostración temporal con datos ficticios, sin operaciones reales.'},{property:'og:title',content:`Informes básicos · ${site.name}`},{property:'og:description',content:'Informes básicos en una demostración temporal con datos ficticios.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:Page});
function Page(){return <ReportsPage/>;}
