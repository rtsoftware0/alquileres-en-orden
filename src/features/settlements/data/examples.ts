import type { Context, SourceLine } from '../types';
export const contexts:Context[]=[
 {id:'olivo',name:'Casa Olivo',scope:'cartera',propertyId:'casa-olivo',ownerId:'con-009',lessorId:'con-009',participants:[{id:'con-009',name:'Propietaria Casa Olivo · CON-009',basisPoints:10000}],model:'propio',fixedCents:0},
 {id:'azahar',name:'Casa Azahar',scope:'cartera',propertyId:'casa-azahar',ownerId:'con-010',lessorId:'con-011',participants:[{id:'con-010',name:'Propietaria Casa Azahar · CON-010',basisPoints:10000}],model:'renta_fija',fixedCents:0},
 {id:'a15',name:'A15 · Agencia didáctica',scope:'didactico',participants:[{id:'did-owner-a',name:'Propietaria didáctica A',basisPoints:10000}],model:'agencia',fixedCents:0},
 {id:'a16',name:'A16 · Renta fija didáctica',scope:'didactico',participants:[{id:'did-owner-b',name:'Propietario didáctico B',basisPoints:10000}],model:'renta_fija',fixedCents:150000},
 {id:'copropiedad',name:'Copropiedad · Agencia didáctica',scope:'didactico',participants:[{id:'did-co-a',name:'Copropietaria didáctica A',basisPoints:5000},{id:'did-co-b',name:'Copropietario didáctico B',basisPoints:5000}],model:'agencia',fixedCents:0},
];
export function exampleLines(id:string,month:string):SourceLine[]{
 if(month!=='2026-10')return [];
 if(id==='a16')return [
 {id:'a16-renta',label:'A16 · Rentas del periodo',cents:240000,period:month,date:'2026-10-05',kind:'renta',assigned:true},
 {id:'a16-coste-1',label:'A16 · Mantenimiento (pendiente)',cents:20000,period:month,date:'2026-10-10',kind:'gasto',approved:true,bearer:'operador'},
 {id:'a16-coste-2',label:'A16 · Suministros (pendiente)',cents:10000,period:month,date:'2026-10-12',kind:'gasto',approved:true,bearer:'operador'}];
 return [
 {id:`${id}-renta`,label:'Renta de septiembre recibida y asignada en octubre',cents:100000,period:'2026-09',date:'2026-10-05',kind:'renta',assigned:true},
 {id:`${id}-coste`,label:'Gasto aprobado de octubre · a cargo propietario',cents:5000,period:month,date:'2026-10-10',kind:'gasto',approved:true,bearer:'propietario'},
 {id:`${id}-fianza`,label:'Fianza separada · excluida',cents:30000,period:month,date:'2026-10-05',kind:'fianza'},
 {id:`${id}-libre`,label:'Dinero sin asignar · excluido',cents:2000,period:month,date:'2026-10-05',kind:'libre'},
 ];
}
