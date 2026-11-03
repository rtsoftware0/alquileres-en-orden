import { describe, expect, it } from "vitest";
import { DAY, HOUR, PLANS, PLANS_CLOCK_START } from "./data/plans";
import * as E from "./engine";

const ok = (r: E.PlansResult) => { expect(r.error).toBeUndefined(); expect(r.ok).toBe(true); return r.state; };
const s0 = () => E.initialPlansState("emp-demo-1");
const buy = (s: E.PlansState, kind: E.QuoteKind, plan: "basic" | "pro" | "max", result: E.PaymentResult = "verificado") => {
  const q = E.createQuote(s, kind, plan); const st = ok(q);
  const c = ok(E.confirmQuote(st, q.id!, true));
  return { s: ok(E.simulatePayment(c, q.id!, result)), quoteId: q.id! };
};
const paidPro = () => buy(s0(), "compra", "pro").s;
const usage = (o: Partial<E.Usage> = {}): E.Usage => ({ units: 12, internalUsers: 1, storageMb: 0, pendingInvitations: 0, ...o });

describe("trial", () => {
  it("lasts exactly 168h: phase changes at the exact cut, not 1 ms before", () => {
    const s = ok(E.startTrial(s0(), "pro"));
    expect(s.trial!.endsAt).toBe(PLANS_CLOCK_START + 168 * HOUR);
    expect(E.phase(ok(E.advanceClock(s, 168 * HOUR - 1)))).toBe("prueba");
    expect(E.phase(ok(E.advanceClock(s, 168 * HOUR)))).toBe("solo_consulta_prueba");
  });
  it("crosses DST: 21/10 11:00 Madrid ends 28/10 10:00 Madrid", () => {
    const s = ok(E.startTrial(s0(), "max"));
    const f = new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", hour12: false });
    expect(f.format(s.trial!.startedAt)).toContain("11:00");
    expect(f.format(s.trial!.endsAt)).toContain("28/10");
    expect(f.format(s.trial!.endsAt)).toContain("10:00");
  });
  it("only Pro/Max, uses 500 MB, single trial and no new trial after paying", () => {
    expect(E.startTrial(s0(), "basic").ok).toBe(false);
    const s = ok(E.startTrial(s0(), "pro"));
    expect(E.currentLimits(s)!.storageMb).toBe(500);
    const after = ok(E.advanceClock(s, 40 * DAY));
    const again = E.startTrial(after, "max");
    expect(again.ok).toBe(false); expect(again.state).toBe(after);
    const paid = paidPro();
    expect(E.startTrial(paid, "max").ok).toBe(false);
  });
  it("switching Pro↔Max keeps start and end", () => {
    const s = ok(E.startTrial(s0(), "pro"));
    const t = ok(E.switchTrialPlan(ok(E.advanceClock(s, 5 * HOUR)), "max"));
    expect(t.trial).toEqual({ plan: "max", startedAt: s.trial!.startedAt, endsAt: s.trial!.endsAt });
  });
  it("ending without purchase: 30 days read only, no Basic free, then retention pending", () => {
    const s = ok(E.startTrial(s0(), "pro"));
    const a = ok(E.advanceClock(s, 168 * HOUR));
    expect(E.currentPlan(a)).toBeNull(); expect(E.access(a)).toBe("consulta");
    expect(E.phase(ok(E.advanceClock(a, 30 * DAY - 1)))).toBe("solo_consulta_prueba");
    expect(E.phase(ok(E.advanceClock(a, 30 * DAY)))).toBe("retencion_pendiente_prueba");
  });
});

describe("purchase during trial", () => {
  it("Max trial → Basic keeps Max until the original end; Basic period starts there", () => {
    const t = ok(E.startTrial(s0(), "max"));
    const { s } = buy(ok(E.advanceClock(t, 10 * HOUR)), "compra_en_prueba", "basic");
    expect(E.currentPlan(s)).toBe("max");
    expect(E.phase(s)).toBe("prueba");
    const end = ok(E.advanceClock(s, t.trial!.endsAt - s.now));
    expect(E.currentPlan(end)).toBe("basic");
    expect(end.sub!.periodStart).toBe(t.trial!.endsAt);
    expect(end.sub!.periodEnd).toBe(E.addMonthUTC(t.trial!.endsAt));
  });
  it("no rights before consent and verified payment; pending/failed do not activate", () => {
    const t = ok(E.startTrial(s0(), "pro"));
    const q = E.createQuote(t, "compra_en_prueba", "max");
    expect(E.confirmQuote(q.state, q.id!, false).ok).toBe(false);
    expect(E.simulatePayment(q.state, q.id!, "verificado").ok).toBe(false);
    const c = ok(E.confirmQuote(q.state, q.id!, true));
    const pend = ok(E.simulatePayment(c, q.id!, "pendiente"));
    const fail = ok(E.simulatePayment(pend, q.id!, "fallido"));
    expect(fail.trialPurchase).toBeNull(); expect(fail.everPaid).toBe(false);
    const end = ok(E.advanceClock(fail, 168 * HOUR));
    expect(E.phase(end)).toBe("solo_consulta_prueba");
  });
});

describe("payments", () => {
  it("duplicate verified payment is rejected without changing state or history", () => {
    const { s, quoteId } = buy(s0(), "compra", "pro");
    const r = E.simulatePayment(s, quoteId, "verificado");
    expect(r.ok).toBe(false); expect(r.state).toBe(s);
    expect(s.payments.filter((p) => p.result === "verificado")).toHaveLength(1);
  });
  it("stale quote is rejected after the phase/plan changes", () => {
    const t = ok(E.startTrial(s0(), "pro"));
    const q = E.createQuote(t, "compra_en_prueba", "pro");
    const moved = ok(E.switchTrialPlan(q.state, "max"));
    const r = E.confirmQuote(moved, q.id!, true);
    expect(r.ok).toBe(false); expect(r.state).toBe(moved);
  });
  it("upgrade: fixed fictitious example, rights only after verified; failure keeps paid plan", () => {
    const s = paidPro();
    const q = E.createQuote(s, "subida", "max");
    const quote = q.state.quotes.find((x) => x.id === q.id)!;
    expect(quote.amountCents).toBe(5000);
    expect(quote.label).toBe("ajuste ficticio, cálculo comercial pendiente");
    const c = ok(E.confirmQuote(q.state, q.id!, true));
    expect(E.currentPlan(ok(E.simulatePayment(c, q.id!, "fallido")))).toBe("pro");
    const v = ok(E.simulatePayment(c, q.id!, "verificado"));
    expect(E.currentPlan(v)).toBe("max");
    expect(v.sub!.periodEnd).toBe(s.sub!.periodEnd);
  });
});

describe("month convention", () => {
  it("same UTC day next month or last valid day", () => {
    expect(new Date(E.addMonthUTC(Date.UTC(2027, 0, 31, 9))).toISOString()).toBe("2027-02-28T09:00:00.000Z");
    expect(new Date(E.addMonthUTC(Date.UTC(2026, 9, 21, 9))).toISOString()).toBe("2026-11-21T09:00:00.000Z");
  });
});

describe("downgrade, cancel and renewal", () => {
  it("downgrade applies at period end, history kept, excess shown and simulated adds blocked, nothing deleted", () => {
    const s = ok(E.scheduleDowngrade(paidPro(), "basic"));
    expect(E.currentPlan(s)).toBe("pro");
    expect(E.scheduledExcess(s, usage())).toEqual(["Unidades: 12 de 10"]);
    const end = ok(E.advanceClock(s, s.sub!.periodEnd - s.now));
    expect(E.phase(end)).toBe("gracia");
    const { s: renewed } = buy(end, "renovacion", "basic");
    expect(E.currentPlan(renewed)).toBe("basic");
    expect(E.exceeded(renewed, usage())).toEqual(["Unidades: 12 de 10"]);
    expect(E.simulate(renewed, usage(), { kind: "unidad" }).allowed).toBe(false);
    expect(renewed.history.length).toBeGreaterThan(s.history.length);
  });
  it("cancel at period end: pending policy, no 30 days invented", () => {
    const s = ok(E.scheduleCancel(paidPro()));
    const end = ok(E.advanceClock(s, s.sub!.periodEnd - s.now + 60 * DAY));
    expect(E.phase(end)).toBe("cancelado"); expect(E.access(end)).toBe("politica_pendiente");
  });
  it("unpaid renewal: grace exactly 7d from due date, read only 30d more; retries do not shift windows", () => {
    const s = paidPro();
    const due = s.sub!.periodEnd;
    const atDue = ok(E.advanceClock(s, due - s.now));
    const { s: failed } = buy(atDue, "renovacion", "pro", "fallido");
    const later = ok(E.advanceClock(failed, 3 * DAY));
    const { s: failed2 } = buy(later, "renovacion", "pro", "fallido");
    const d = E.dunningFor(failed2.sub!);
    expect(d.restrictedFrom).toBe(due + 7 * DAY);
    expect(d.readOnlyUntil).toBe(due + 37 * DAY);
    expect(E.phase(ok(E.advanceClock(failed2, due + 7 * DAY - 1 - failed2.now)))).toBe("gracia");
    expect(E.phase(ok(E.advanceClock(failed2, due + 7 * DAY - failed2.now)))).toBe("solo_consulta_impago");
    expect(E.phase(ok(E.advanceClock(failed2, due + 37 * DAY - failed2.now)))).toBe("retencion_pendiente_impago");
  });
  it("big jump without payment never gifts months; windows stay anchored to due date", () => {
    const s = paidPro();
    const jump = ok(E.advanceClock(s, 90 * DAY));
    expect(E.phase(jump)).toBe("retencion_pendiente_impago");
    expect(jump.sub!.periodEnd).toBe(s.sub!.periodEnd);
  });
  it("recovery in read-only requires verified payment; period starts at recovery (demo convention)", () => {
    const s = paidPro();
    const ro = ok(E.advanceClock(s, s.sub!.periodEnd - s.now + 10 * DAY));
    expect(E.phase(ro)).toBe("solo_consulta_impago");
    const pend = buy(ro, "renovacion", "pro", "pendiente").s;
    expect(E.phase(pend)).toBe("solo_consulta_impago");
    const q = pend.quotes.at(-1)!;
    const rec = ok(E.simulatePayment(pend, q.id, "verificado"));
    expect(E.phase(rec)).toBe("activo");
    expect(rec.sub!.periodStart).toBe(ro.now);
    expect(q.label).toMatch(/regularización comercial pendiente/);
  });
});

describe("clock and simulator", () => {
  it("clock only advances; rejection leaves state identical", () => {
    const s = s0();
    for (const v of [0, -1, NaN, Infinity, 1.5]) { const r = E.advanceClock(s, v); expect(r.ok).toBe(false); expect(r.state).toBe(s); }
  });
  it("next cut lands on 24h notice then trial end", () => {
    const s = ok(E.startTrial(s0(), "pro"));
    const a = ok(E.advanceToNextCut(s));
    expect(a.now).toBe(s.trial!.endsAt - DAY);
    expect(E.notices(a).length).toBe(1);
    expect(ok(E.advanceToNextCut(a)).now).toBe(s.trial!.endsAt);
  });
  it("one jump across several cuts derives final phase (trial purchase → period → grace)", () => {
    const t = ok(E.startTrial(s0(), "pro"));
    const { s } = buy(t, "compra_en_prueba", "pro");
    const far = ok(E.advanceClock(s, 168 * HOUR + 32 * DAY));
    expect(E.phase(far)).toBe("gracia");
    expect(far.sub!.periodStart).toBe(t.trial!.endsAt);
  });
  it("simulator: limit reached allowed, beyond rejected, never writes", () => {
    const s = ok(E.startTrial(s0(), "pro"));
    expect(E.simulate(s, usage({ units: 49 }), { kind: "unidad" }).allowed).toBe(true);
    expect(E.simulate(s, usage({ units: 50 }), { kind: "unidad" }).allowed).toBe(false);
    expect(E.simulate(s, usage({ storageMb: 450 }), { kind: "subida", mb: 51 }).allowed).toBe(false);
    expect(E.simulate(s, usage({ internalUsers: 3 }), { kind: "usuario" }).allowed).toBe(false);
    expect(E.simulate(s0(), usage(), { kind: "unidad" }).allowed).toBe(false);
  });
});

describe("PLAN01 downgrade applies from the exact period end", () => {
  it("Max→Basic: Max before the cut, Basic limits at the cut, history kept, no renewal, windows intact", () => {
    const max = buy(s0(), "compra", "max").s;
    const s = ok(E.scheduleDowngrade(max, "basic"));
    const due = s.sub!.periodEnd;
    const before = ok(E.advanceClock(s, due - 1 - s.now));
    expect(E.currentPlan(before)).toBe("max");
    expect(E.currentLimits(before)!.units).toBe(150);
    const end = ok(E.advanceClock(s, due - s.now));
    expect(E.phase(end)).toBe("gracia");
    expect(E.currentPlan(end)).toBe("basic");
    expect(E.currentLimits(end)).toEqual(PLANS.basic.limits); expect(PLANS.basic.limits.units).toBe(10); expect(PLANS.basic.limits.internalUsers).toBe(1);
    expect(end.sub).toEqual(s.sub);
    expect(end.sub!.plan).toBe("max");
    expect(end.payments).toEqual(s.payments);
    expect(E.exceeded(end, usage())).toEqual(["Unidades: 12 de 10"]);
    const sim = E.simulate(end, usage(), { kind: "unidad" });
    expect(sim.allowed).toBe(false); expect(sim.after).toBe(13); expect(sim.message).toMatch(/Nada se borra/);
    const d = E.dunningFor(end.sub!);
    expect(d.restrictedFrom).toBe(due + 7 * DAY); expect(d.readOnlyUntil).toBe(due + 37 * DAY);
    expect(E.phase(ok(E.advanceClock(end, 7 * DAY)))).toBe("solo_consulta_impago");
    expect(E.currentPlan(ok(E.advanceClock(end, 7 * DAY)))).toBeNull();
    const { s: renewed } = buy(end, "renovacion", "basic");
    expect(E.phase(renewed)).toBe("activo"); expect(E.currentPlan(renewed)).toBe("basic");
    expect(renewed.scheduled).toBeNull();
  });
  it("cancellation keeps priority over the period end", () => {
    const s = ok(E.scheduleCancel(buy(s0(), "compra", "max").s));
    const end = ok(E.advanceClock(s, s.sub!.periodEnd - s.now));
    expect(E.phase(end)).toBe("cancelado"); expect(E.currentPlan(end)).toBeNull();
  });
});

describe("PLAN03 quotes tied to the simulated instant", () => {
  const stale = (r: E.PlansResult, prev: E.PlansState) => {
    expect(r.ok).toBe(false); expect(r.error).toMatch(/Vuelve a cotizar/); expect(r.state).toBe(prev);
  };
  const setups: Array<[E.QuoteKind, "basic" | "pro" | "max", () => E.PlansState]> = [
    ["compra", "pro", s0],
    ["subida", "max", paidPro],
    ["renovacion", "pro", () => { const p = paidPro(); return ok(E.advanceClock(p, p.sub!.periodEnd - p.now)); }],
  ];
  for (const [kind, plan, mk] of setups) {
    it(`${kind}: stale at payment and at confirmation; a fresh quote is payable`, () => {
      const base = mk();
      const q = E.createQuote(base, kind, plan); const st = ok(q);
      const c = ok(E.confirmQuote(st, q.id!, true));
      const later = ok(E.advanceClock(c, DAY));
      const pay = E.simulatePayment(later, q.id!, "verificado");
      stale(pay, later);
      expect(later.payments).toEqual(c.payments);
      expect(later.quotes.find((x) => x.id === q.id)!.status).toBe("confirmada");
      const notConf = ok(E.advanceClock(st, HOUR));
      stale(E.confirmQuote(notConf, q.id!, true), notConf);
      if (kind === "subida") {
        const fresh = E.createQuote(later, kind, plan); const fq = fresh.state.quotes.find((x) => x.id === fresh.id)!;
        expect(fq.amountCents).toBe(st.quotes.find((x) => x.id === q.id)!.amountCents);
        expect(fq.startsAt).toBe(later.now);
      }
      const { s: done } = buy(later, kind, plan);
      expect(E.phase(done)).toBe("activo"); expect(E.currentPlan(done)).toBe(plan);
      if (kind !== "subida") expect(done.sub!.periodStart).toBe(later.now);
    });
  }
  it("trial purchase is exempt and keeps the original trial end after 1h", () => {
    const t = ok(E.startTrial(s0(), "pro"));
    const q = E.createQuote(t, "compra_en_prueba", "max");
    const c = ok(E.confirmQuote(ok(E.advanceClock(q.state, HOUR)), q.id!, true));
    const paid = ok(E.simulatePayment(ok(E.advanceClock(c, HOUR)), q.id!, "verificado"));
    expect(paid.trialPurchase).toEqual({ plan: "max", quoteId: q.id });
    const end = ok(E.advanceClock(paid, t.trial!.endsAt - paid.now));
    expect(end.sub!.periodStart).toBe(t.trial!.endsAt);
  });
});
