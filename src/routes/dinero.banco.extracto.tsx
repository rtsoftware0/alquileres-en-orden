import { createFileRoute } from '@tanstack/react-router';
import { site } from '@/config/site';
import { ImportWizard } from '@/features/bank/ImportWizard';
export const Route=createFileRoute('/dinero/banco/extracto')({
 head:()=>({meta:[{title:`Extracto incorporado · ${site.name}`},{name:'description',content:'Revisión de CSV ficticios incorporados, errores y decisiones temporales.'},{property:'og:title',content:`Extracto incorporado · ${site.name}`},{property:'og:description',content:'Revisión de CSV ficticios incorporados, errores y decisiones temporales.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),
 component:Page,
});
function Page(){return <ImportWizard/>;}
