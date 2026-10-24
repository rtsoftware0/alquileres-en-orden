import { createContext, Fragment, useContext, useState, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import { initialBank } from './simulator';
import type { BankState } from './types';
const Context=createContext<{state:BankState;setState:Dispatch<SetStateAction<BankState>>;reset:()=>void}|null>(null);
export function BankProvider({children}:{children:ReactNode}) {const [state,setState]=useState(initialBank);const [epoch,setEpoch]=useState(0);return <Context.Provider value={{state,setState,reset:()=>{setState(initialBank());setEpoch(x=>x+1);}}}><Fragment key={epoch}>{children}</Fragment></Context.Provider>;}
export function useBank(){const c=useContext(Context);if(!c)throw new Error('Escenario Banco no disponible');return c;}
