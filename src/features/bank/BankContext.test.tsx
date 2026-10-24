import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { useState } from 'react';
import { BankProvider, useBank } from './BankContext';
afterEach(cleanup);
function AccountScreen(){const {accountId,setAccount}=useBank();return <button onClick={()=>setAccount('cuenta-aula')}>{accountId}</button>;}
function Navigation(){const [visible,setVisible]=useState(true);const {reset}=useBank();return <><button onClick={()=>setVisible(v=>!v)}>Cambiar pantalla</button><button onClick={reset}>Reiniciar</button>{visible&&<AccountScreen/>}</>;}
it('selected account survives page remount and global reset restores demo account',()=>{render(<BankProvider><Navigation/></BankProvider>);fireEvent.click(screen.getByRole('button',{name:'cuenta-demo'}));expect(screen.getByRole('button',{name:'cuenta-aula'})).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Cambiar pantalla'}));fireEvent.click(screen.getByRole('button',{name:'Cambiar pantalla'}));expect(screen.getByRole('button',{name:'cuenta-aula'})).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Reiniciar'}));expect(screen.getByRole('button',{name:'cuenta-demo'})).toBeTruthy();});