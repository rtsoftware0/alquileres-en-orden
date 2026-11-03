// Plans demo state: lives inside Account + Catalog and outside Planning/Settlement so other
// resets never restart it. Memory only; a reload restarts the whole demo (not anti-abuse).
import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { useAccount } from "@/features/account/AccountContext";
import { pendingInvitations } from "@/features/account/engine";
import { useCatalog } from "@/features/catalog/CatalogContext";
import type { PlanId } from "./data/plans";
import * as E from "./engine";

export interface PlansApi {
  state: E.PlansState;
  phase: E.Phase;
  usage: E.Usage;
  advance: (ms: number) => E.PlansResult;
  advanceToNextCut: () => E.PlansResult;
  startTrial: (p: PlanId) => E.PlansResult;
  switchTrial: (p: PlanId) => E.PlansResult;
  quote: (k: E.QuoteKind, p: PlanId) => E.PlansResult;
  confirm: (id: string, consent: boolean) => E.PlansResult;
  pay: (id: string, r: E.PaymentResult) => E.PlansResult;
  downgrade: (p: PlanId) => E.PlansResult;
  cancel: () => E.PlansResult;
  clearScheduled: () => E.PlansResult;
  setStorage: (mb: number) => E.PlansResult;
  simulate: (a: E.SimAction) => E.SimOutcome;
}

const Ctx = createContext<PlansApi | null>(null);

export function PlansProvider({ children }: { children: ReactNode }) {
  const account = useAccount();
  const catalog = useCatalog();
  const [state, setState] = useState(() => E.initialPlansState(account.companyId));
  const ref = useRef(state);

  const ops = useMemo(() => {
    const run = (f: (s: E.PlansState) => E.PlansResult) => {
      const r = f(ref.current);
      if (r.ok) { ref.current = r.state; setState(r.state); }
      return r;
    };
    return {
      advance: (ms: number) => run((s) => E.advanceClock(s, ms)),
      advanceToNextCut: () => run(E.advanceToNextCut),
      startTrial: (p: PlanId) => run((s) => E.startTrial(s, p)),
      switchTrial: (p: PlanId) => run((s) => E.switchTrialPlan(s, p)),
      quote: (k: E.QuoteKind, p: PlanId) => run((s) => E.createQuote(s, k, p)),
      confirm: (id: string, c: boolean) => run((s) => E.confirmQuote(s, id, c)),
      pay: (id: string, r: E.PaymentResult) => run((s) => E.simulatePayment(s, id, r)),
      downgrade: (p: PlanId) => run((s) => E.scheduleDowngrade(s, p)),
      cancel: () => run(E.scheduleCancel),
      clearScheduled: () => run(E.clearScheduled),
      setStorage: (mb: number) => run((s) => E.setSimulatedStorage(s, mb)),
    };
  }, []);

  const usage = useMemo<E.Usage>(() => ({
    units: catalog.data.rooms.length,
    internalUsers: account.activeSeats,
    storageMb: state.storageMb,
    pendingInvitations: pendingInvitations(account.state).length,
  }), [catalog.data.rooms.length, account.activeSeats, account.state, state.storageMb]);

  const api = useMemo<PlansApi>(() => ({
    ...ops, state, usage, phase: E.phase(state),
    // Reads plans state and simulated storage from the same last accepted state (ref is only
    // written inside actions, never during render); units/users/invitations come from Account/Catalog.
    simulate: (a: E.SimAction) => {
      const cur = ref.current;
      return E.simulate(cur, { ...usage, storageMb: cur.storageMb }, a);
    },
  }), [ops, state, usage]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function usePlans(): PlansApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePlans debe usarse dentro de PlansProvider");
  return v;
}
