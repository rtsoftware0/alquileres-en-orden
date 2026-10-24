import {createFileRoute} from '@tanstack/react-router';
import {site} from '@/config/site';
import {ClosingPage} from '@/features/settlements/ClosingPage';
export const Route=createFileRoute('/dinero/cierre')({head:()=>({meta:[{title:`Cierre mensual · ${site.name}`},{name:'description',content:'Cierre mensual en una demostración temporal con datos ficticios, sin operaciones reales.'},{property:'og:title',content:`Cierre mensual · ${site.name}`},{property:'og:description',content:'Cierre mensual en una demostración temporal con datos ficticios.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:Page});
function Page(){return <ClosingPage/>;}
