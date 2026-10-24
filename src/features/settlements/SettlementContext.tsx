import {createContext,Fragment,useContext,useState,type Dispatch,type ReactNode,type SetStateAction} from 'react';
import type {Rules,State} from './types';
import {initialSettlements} from './engine';
export interface WizardDraft {contextId:string;month:string;rules:Rules;step:number;reviewKey:string}
const Context=createContext<{state:State;setState:Dispatch<SetStateAction<State>>;draft:WizardDraft|null;setDraft:Dispatch<SetStateAction<WizardDraft|null>>;reset:()=>void}|null>(null);
export function SettlementProvider({children}:{children:ReactNode}){const [state,setState]=useState(initialSettlements);const [draft,setDraft]=useState<WizardDraft|null>(null);const [epoch,setEpoch]=useState(0);return <Context.Provider value={{state,setState,draft,setDraft,reset:()=>{setState(initialSettlements());setDraft(null);setEpoch(x=>x+1);}}}><Fragment key={epoch}>{children}</Fragment></Context.Provider>;}
export function useSettlements(){const c=useContext(Context);if(!c)throw new Error('Escenario de liquidaciones no disponible');return c;}
