import { createContext, useContext, useState, type ReactNode } from 'react';
import type { PlanningState } from './types';
import { initialPlanning } from './simulator';
const PlanningContext=createContext<{state:PlanningState;setState:React.Dispatch<React.SetStateAction<PlanningState>>;reset:()=>void}|null>(null);
export function PlanningProvider({children}:{children:ReactNode}) {
 const [state,setState]=useState(initialPlanning);
 return <PlanningContext.Provider value={{state,setState,reset:()=>setState(initialPlanning())}}>{children}</PlanningContext.Provider>;
}
export function usePlanning(){const value=useContext(PlanningContext);if(!value)throw new Error('Falta el escenario temporal');return value;}
