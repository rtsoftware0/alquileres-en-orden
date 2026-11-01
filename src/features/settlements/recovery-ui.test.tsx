import {useLayoutEffect, useState, type ReactNode} from 'react';
import {randomUUID} from 'node:crypto';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import {demoPortfolio} from '@/features/portfolio/data/demo-data';
import {BankProvider} from '@/features/bank/BankContext';
import {initialBank} from '@/features/bank/simulator';
import {SettlementProvider, useSettlements} from './SettlementContext';
import {SettlementListPage} from './ListPage';
import {SettlementDetailPage} from './DetailPage';
import {ReportsPage} from './ReportsPage';
import {ClosingPage} from './ClosingPage';
import {CalculationView} from './CalculationView';
import {contexts} from './data/examples';
import {sourceFor, closeReview} from './adapters';
import {calculate, close, defaultRules, edit, initialSettlements, pay, prepare, reopen, transition} from './engine';
import type {Rules, State} from './types';

// Navigation itself is covered by the routing suite. Keep real screen components
// and providers; only replace router links so these tests need no browser/server.
vi.mock('@tanstack/react-router', () => ({
  Link: ({to, children, className}: {to: string; children: ReactNode; className?: string}) =>
    <a href={to} className={className}>{children}</a>,
}));
if (!globalThis.crypto.randomUUID) Object.defineProperty(globalThis.crypto, 'randomUUID', {value: randomUUID});
afterEach(cleanup);

const source = (id: string) => sourceFor(demoPortfolio, id, '2026-10');
function rules(id: string): Rules {
  const context = contexts.find(c => c.id === id);
  if (!context) throw new Error('Missing test context');
  return defaultRules(context);
}
function add(state: State, id: string, patch: Partial<Rules> = {}) {
  return prepare(state, source(id), {...rules(id), ...patch});
}
function approve(state: State, id: string) {
  return transition(transition(state, id, 'revisado'), id, 'aprobado');
}
function Seed({state, children}: {state: State; children: ReactNode}) {
  const {setState} = useSettlements();
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => { setState(state); setReady(true); }, [state, setState]);
  return ready ? children : null;
}
function show(state: State, children: ReactNode) {
  return render(<BankProvider><SettlementProvider><Seed state={state}>{children}</Seed></SettlementProvider></BankProvider>);
}
function figure(label: string) {
  const card = screen.getByText(label, {exact: true}).parentElement;
  if (!card) throw new Error('Missing figure');
  return card.querySelector('.tabular')?.textContent?.replace(/\s/g, ' ');
}

describe('Recovered block09: screen regressions', () => {
  it('R1 displays November payment only in November cash, retaining cumulative settlement payments', () => {
    const p = add(initialSettlements(), 'a16');
    const state = pay(approve(p.state, p.id), p.id, 'did-owner-b', 15000, '2026-11-05', 'NOV-EJ', 'nov-op');
    show(state, <ReportsPage/>);
    expect(figure('Pagado acumulado de esta liquidación')).toBe('150,00 €');
    expect(figure('Pagos al dueño con fecha del mes')).toBe('0,00 €');
    expect(figure('Caja comparada (simplificada)')).toBe('2.400,00 €');
    fireEvent.change(screen.getByLabelText('Mes del informe'), {target: {value: '2026-11'}});
    expect(figure('Pagos al dueño con fecha del mes')).toBe('150,00 €');
    expect(figure('Caja comparada (simplificada)')).toBe('-150,00 €');
  });

  it('R2 agency shows managed rent, fee and owner result, without an operator margin', () => {
    const r = rules('a15'); const s = source('a15');
    render(<CalculationView c={calculate(s, r)} r={r} source={s}/>);
    expect(figure('Renta cobrada y asignada (gestionada)')).toBe('1.000,00 €');
    expect(figure('Honorario de gestión')).toBe('100,00 €');
    expect(figure('Resultado a liquidar al propietario')).toBe('850,00 €');
    expect(screen.queryByText(/Margen operativo por devengo/)).not.toBeInTheDocument();
  });

  it('R2 fixed obligation stays 1500 when prior balance raises owner settlement to 1600', () => {
    const r = {...rules('a16'), priorCents: 10000}; const s = source('a16');
    render(<CalculationView c={calculate(s, r)} r={r} source={s}/>);
    expect(figure('Obligación fija (regla)')).toBe('1.500,00 €');
    expect(figure('Resultado a liquidar al propietario')).toBe('1.600,00 €');
    expect(figure('Margen operativo por devengo (rent-to-rent)')).toBe('600,00 €');
  });

  it('R3 portfolio excludes educational rows; owner filter shows 425 of the 850 group', () => {
    let p = add(initialSettlements(), 'olivo', {model: 'agencia', feeValue: 0});
    p = add(p.state, 'copropiedad');
    show(p.state, <SettlementListPage/>);
    expect(screen.getByRole('radio', {name: 'Proyección de cartera'})).toBeChecked();
    expect(figure('Importe externo a propietarios')).toBe('800,00 €');
    fireEvent.click(screen.getByRole('radio', {name: 'Ejemplos didácticos'}));
    expect(figure('Importe externo a propietarios')).toBe('850,00 €');
    fireEvent.change(screen.getByLabelText('Filtrar propietario'), {target: {value: 'did-co-a'}});
    expect(figure('Importe externo · Copropietaria didáctica A')).toBe('425,00 €');
    expect(figure('Pendiente · Copropietaria didáctica A')).toBe('425,00 €');
    expect(screen.getByText(/Parte 425,00.*de 850,00.*del grupo/)).toBeInTheDocument();
  });

  it('R3 opposite adjustments stay visible and closure acknowledgement receives error focus', async () => {
    let p = add(initialSettlements(), 'a15', {adjustmentCents: 10000, adjustmentReason: 'Suma identificada'});
    p = add(p.state, 'copropiedad', {adjustmentCents: -10000, adjustmentReason: 'Resta identificada'});
    show(p.state, <ClosingPage/>);
    expect(screen.getByText('No hay liquidaciones preparadas para este mes')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', {name: 'Ejemplos didácticos A15/A16/copropiedad'}));
    expect(screen.queryByText('No hay liquidaciones preparadas para este mes')).not.toBeInTheDocument();
    expect(screen.getByText(/Ajustes manuales09 del mes: 2 línea\(s\).*neto 0,00/)).toBeInTheDocument();
    expect(screen.getByText(/Suma identificada/)).toBeInTheDocument();
    expect(screen.getByText(/Resta identificada/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Revisar fuentes para cierre'}));
    fireEvent.click(screen.getByRole('button', {name: 'Simular cierre mensual'}));
    await waitFor(() => expect(screen.getByRole('checkbox')).toHaveFocus());
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', {name: 'Simular cierre mensual'}));
    fireEvent.click(screen.getByRole('button', {name: 'Simular reapertura'}));
    await waitFor(() => expect(screen.getByLabelText('Motivo obligatorio de reapertura')).toHaveFocus());
  });

  it('R4 pending edits hide approval; discard retains the applied fee and save requires review again', () => {
    const p = add(initialSettlements(), 'a15');
    show(transition(p.state, p.id, 'revisado'), <SettlementDetailPage id={p.id}/>);
    fireEvent.click(screen.getByRole('button', {name: 'Editar parámetros'}));
    fireEvent.change(screen.getByLabelText('Honorario (%)'), {target: {value: '20'}});
    expect(screen.queryByRole('button', {name: 'Simular aprobación'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Simular revisión'})).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Descartar edición pendiente'}));
    expect(figure('Honorario de gestión')).toBe('100,00 €');
    expect(screen.getByRole('button', {name: 'Simular aprobación'})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Editar parámetros'}));
    fireEvent.change(screen.getByLabelText('Honorario (%)'), {target: {value: '20'}});
    fireEvent.click(screen.getByRole('button', {name: 'Confirmar edición (vuelve a borrador)'}));
    expect(figure('Honorario de gestión')).toBe('200,00 €');
    expect(screen.queryByRole('button', {name: 'Simular aprobación'})).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Simular revisión'}));
    fireEvent.click(screen.getByRole('button', {name: 'Simular aprobación'}));
    expect(screen.getByRole('option', {name: /v1 · aprobado · vigente/})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Preparar corrección'}));
    expect(screen.queryByRole('button', {name: 'Simular pago externo'})).not.toBeInTheDocument();
  });

  it('R5 both closure snapshots remain consultable after reopening and changing an adjustment', () => {
    const p = add(initialSettlements(), 'a15', {adjustmentCents: 10000, adjustmentReason: 'Primero'});
    let state = approve(p.state, p.id);
    const first = closeReview(demoPortfolio, initialBank(), state, '2026-10', 'didactico');
    state = close(state, first, first, true);
    state = reopen(state, '2026-10', 'Corregir ajuste', 'didactico');
    state = edit(state, p.id, source('a15'), {...rules('a15'), adjustmentCents: 20000, adjustmentReason: 'Segundo'}, 'Corrección');
    const second = closeReview(demoPortfolio, initialBank(), state, '2026-10', 'didactico');
    state = close(state, second, second, true);
    show(state, <ClosingPage/>);
    fireEvent.click(screen.getByRole('radio', {name: 'Ejemplos didácticos A15/A16/copropiedad'}));
    const buttons = screen.getAllByRole('button', {name: 'Consultar instantánea'});
    expect(buttons).toHaveLength(3);
    const firstButton=buttons[0], lastButton=buttons[2];
    if(!firstButton||!lastButton)throw new Error('Missing snapshot controls');
    fireEvent.click(firstButton);
    expect(within(screen.getByRole('region', {name: 'Instantánea cierre-1'})).getByText(/Ajustes 1 \(neto 100,00/)).toBeInTheDocument();
    fireEvent.click(lastButton);
    expect(within(screen.getByRole('region', {name: 'Instantánea cierre-3'})).getByText(/Ajustes 1 \(neto 200,00/)).toBeInTheDocument();
  });
});