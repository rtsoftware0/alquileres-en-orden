import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,it,expect} from 'vitest';
import {useState} from 'react';
import {SettlementProvider,useSettlements} from './SettlementContext';
import {defaultRules} from './engine';
import {contexts} from './data/examples';
afterEach(cleanup);
function Draft(){const {draft,setDraft}=useSettlements();const c=contexts[0];if(!c)return null;return <><span>{draft?.contextId??'vacío'}</span><button onClick={()=>setDraft({contextId:c.id,month:'2026-10',rules:defaultRules(c),step:2,reviewKey:''})}>Editar contexto</button></>;}
function Screens(){const [show,setShow]=useState(true);const {reset}=useSettlements();return <><button onClick={()=>setShow(s=>!s)}>Navegar</button><button onClick={reset}>Reiniciar09</button>{show&&<Draft/>}</>;}
it('volver conserva preparación en memoria y reinicio global limpia formularios',()=>{render(<SettlementProvider><Screens/></SettlementProvider>);fireEvent.click(screen.getByRole('button',{name:'Editar contexto'}));expect(screen.getByText('olivo')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Navegar'}));fireEvent.click(screen.getByRole('button',{name:'Navegar'}));expect(screen.getByText('olivo')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Reiniciar09'}));expect(screen.getByText('vacío')).toBeTruthy();});
