import { describe, expect, it } from "vitest";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import { totalPending } from "@/features/portfolio/selectors";
import {
  chargeBalance, depositContracts, depositOf, filterCharges, getCharge, moneySummary, pendingByRoom, pendingCents, tenantAccount,
} from "./selectors";
import { eligibleCharges, parseSimulatedAmount, simulateCollection } from "./simulator";

const all = { q: "", propertyId: "todos", status: "todos", period: "todos", overdueOnly: false } as const;

describe("money totals and coherence", () => {
  it("total pending is 1.400 € and October alone is 1.250 €", () => {
    expect(pendingCents(data)).toBe(140000);
    expect(totalPending(data)).toBe(140000);
    expect(moneySummary(data, { period: "2026-10" }).pendingCents).toBe(125000);
    expect(moneySummary(data, { period: "2026-09" }).pendingCents).toBe(15000);
  });

  it("pending by room: OLI-02 350, OLI-03 150 Sept + 450 Oct, AZA-03 450, all on occupied rooms", () => {
    const rows = pendingByRoom(data).map((r) => [r.roomId, r.cents]);
    expect(rows).toEqual([["aza-03", 45000], ["oli-02", 35000], ["oli-03", 60000]]);
    expect(chargeBalance(data, getCharge(data, "vc-0103-09")!)).toMatchObject({ status: "parcial", outstandingCents: 15000 });
    expect(chargeBalance(data, getCharge(data, "vc-0103-10")!)).toMatchObject({ status: "pendiente", outstandingCents: 45000 });
    for (const r of pendingByRoom(data)) expect(data.rooms.find((x) => x.id === r.roomId)?.status).toBe("ocupada");
  });

  it("allocations never exceed their payment or charge", () => {
    for (const p of data.payments) {
      const allocated = data.allocations.filter((a) => a.paymentId === p.id).reduce((s, a) => s + a.amountCents, 0);
      expect(allocated).toBeLessThanOrEqual(p.amountCents);
    }
    for (const c of data.charges) expect(chargeBalance(data, c).allocatedCents).toBeLessThanOrEqual(c.amountCents);
  });

  it("unallocated 30 € is shown apart and never subtracted from debt; allocated is not extra cash", () => {
    const s = moneySummary(data);
    expect(s.unallocatedCents).toBe(3000);
    expect(s.pendingCents).toBe(140000);
    expect(s.allocatedCents + s.unallocatedCents).toBe(s.receivedCents);
  });

  it("void charge counts for nothing; overdue is a condition, not a status", () => {
    const v = chargeBalance(data, getCharge(data, "vc-0202-09")!);
    expect([v.status, v.outstandingCents, v.overdue]).toEqual(["anulado", 0, false]);
    const overdue = filterCharges(data, { ...all, overdueOnly: true });
    expect(new Set(overdue.map((c) => chargeBalance(data, c).status))).toEqual(new Set(["pendiente", "parcial"]));
    expect(overdue).toHaveLength(4);
  });

  it("filters combine and can return zero results", () => {
    expect(filterCharges(data, { ...all, status: "satisfecho" })).toHaveLength(11);
    expect(filterCharges(data, { ...all, propertyId: "casa-azahar", status: "pendiente" }).map((c) => c.reference)).toEqual(["VC-0203-10"]);
    expect(filterCharges(data, { ...all, q: "zzz" })).toHaveLength(0);
  });
});

describe("tenant accounts are isolated by payer", () => {
  it("dual-role contact (tenant + guarantor) only owes her own contract", () => {
    const acc = tenantAccount(data, "con-003");
    expect(acc.pendingCents).toBe(60000);
    expect(new Set(acc.charges.map((c) => c.contractId))).toEqual(new Set(["ct-ej-0103"]));
  });

  it("owners/landlords have no tenant debt; contract filter narrows the account", () => {
    expect(tenantAccount(data, "con-009").charges).toHaveLength(0);
    expect(tenantAccount(data, "con-005").unallocatedCents).toBe(3000);
    expect(tenantAccount(data, "con-005").pendingCents).toBe(0);
    expect(tenantAccount(data, "con-003", "ct-ej-0101").charges).toHaveLength(0);
  });
});

describe("deposits are a separate ledger", () => {
  it("expected amount differs from received; one pending, one returned", () => {
    const d0202 = depositOf(data, data.contracts.find((c) => c.reference === "CT-EJ-0202")!);
    expect([d0202.expectedCents, d0202.receivedCents, d0202.toContributeCents, d0202.status]).toEqual([41000, 20000, 21000, "pendiente_aportar"]);
    const d0098 = depositOf(data, data.contracts.find((c) => c.reference === "CT-EJ-0098")!);
    expect([d0098.heldCents, d0098.status]).toEqual([0, "devuelta"]);
    const d0106 = depositOf(data, data.contracts.find((c) => c.reference === "CT-EJ-0106")!);
    expect([d0106.receivedCents, d0106.status]).toEqual([0, "sin_movimientos"]);
    expect(depositContracts(data)).toHaveLength(10);
  });

  it("deposits are not counted as rent payments", () => {
    expect(moneySummary(data).receivedCents).toBe(data.payments.reduce((s, p) => s + p.amountCents, 0));
    expect(data.payments.some((p) => data.depositMovements.some((m) => m.id === p.id))).toBe(false);
  });
});

describe("collection simulator", () => {
  it("OLI-02: received 200 -> allocated 200, remaining 150, unallocated 0", () => {
    const r = simulateCollection(data, { payerId: "con-002", chargeId: "vc-0102-10", receivedCents: 20000 });
    expect(r).toMatchObject({ ok: true, allocatedCents: 20000, outstandingAfterCents: 15000, unallocatedCents: 0, portfolioPendingCents: 140000 });
  });

  it("OLI-02: received 400 -> allocated 350, remaining 0, unallocated 50", () => {
    const r = simulateCollection(data, { payerId: "con-002", chargeId: "vc-0102-10", receivedCents: 40000 });
    expect(r).toMatchObject({ ok: true, allocatedCents: 35000, outstandingAfterCents: 0, unallocatedCents: 5000, portfolioPendingIfRealCents: 105000 });
  });

  it("never mutates data: balances stay 350 and 1.400 after simulating", () => {
    const before = JSON.stringify(data);
    simulateCollection(data, { payerId: "con-002", chargeId: "vc-0102-10", receivedCents: 40000 });
    expect(JSON.stringify(data)).toBe(before);
    expect(chargeBalance(data, getCharge(data, "vc-0102-10")!).outstandingCents).toBe(35000);
    expect(pendingCents(data)).toBe(140000);
  });

  it("rejects other payer's, satisfied and void charges; offers only own open charges", () => {
    expect(simulateCollection(data, { payerId: "con-001", chargeId: "vc-0102-10", receivedCents: 100 }).ok).toBe(false);
    expect(simulateCollection(data, { payerId: "con-002", chargeId: "vc-0102-09", receivedCents: 100 }).ok).toBe(false);
    expect(simulateCollection(data, { payerId: "con-006", chargeId: "vc-0202-09", receivedCents: 100 }).ok).toBe(false);
    expect(eligibleCharges(data, "con-003").map((c) => c.id)).toEqual(["vc-0103-09", "vc-0103-10"]);
    expect(eligibleCharges(data, "con-008")).toHaveLength(0);
  });

  it("amount validation: exact cents, positive, at most 2 decimals", () => {
    expect(parseSimulatedAmount("200").cents).toBe(20000);
    expect(parseSimulatedAmount("200,5").cents).toBe(20050);
    expect(parseSimulatedAmount("0,10").cents).toBe(10);
    expect(parseSimulatedAmount("1.250,75").cents).toBe(125075);
    for (const bad of ["", "  ", "abc", "-5", "0", "0,00", "1,234", "Infinity", "NaN", "1e3", "200000"])
      expect(parseSimulatedAmount(bad).error).toBeDefined();
  });
});
