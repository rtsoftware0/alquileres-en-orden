import { createFileRoute } from '@tanstack/react-router';
import { site } from '@/config/site';
import { BankPage } from '@/features/bank/BankPage';
export const Route=createFileRoute('/dinero/banco/')({
 head:()=>({meta:[{title:`Banco y conciliación · ${site.name}`},{name:'description',content:'Movimientos bancarios ficticios y conciliación temporal, separados de la caja registrada.'},{property:'og:title',content:`Banco y conciliación · ${site.name}`},{property:'og:description',content:'Movimientos bancarios ficticios y conciliación temporal, separados de la caja registrada.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),
 component:Page,
});
function Page(){return <BankPage/>;}
