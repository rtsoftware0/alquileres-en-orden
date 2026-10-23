import { describe, expect, it } from "vitest";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import { pendingCents } from "./selectors";
import { expenseBalance, expenseTotals, filterExpenses, getExpense, providerAccount, providerAccountContacts, sharesOfExpense } from "./expenses";
import { simulateProviderPayment } from "./expense-simulator";
import { splitEqual, splitManual, validateExpenseData, validateExpenseSplit, emptyExpenseDraft } from "./expense-draft";

const all = { q: "", propertyId: "todos", providerId: "todos", category: "todos", period: "todos", status: "todos", overdueOnly: false } as const;

describe("expense totals and coherence", () => {
  it("cost 540 €, paid 170 €, pending 370 € across 4 expenses", () => {
    const t = expenseTotals(data);
    expect([t.count, t.costCents, t.paidCents, t.pendingCents]).toEqual([4, 54000, 17000, 37000]);
  });

  it("each expense balance matches its payments", () => {
    expect(expenseBalance(data, getExpense(data, "gs-ej-001")!)).toMatchObject({ paidCents: 0, outstandingCents: 12000, status: "pendiente" });
    expect(expenseBalance(data, getExpense(data, "gs-ej-002")!)).toMatchObject({ paidCents: 0, outstandingCents: 10000, status: "pendiente" });
    expect(expenseBalance(data, getExpense(data, "gs-ej-003")!)).toMatchObject({ paidCents: 9000, outstandingCents: 15000, status: "parcial", overdue: true });
    expect(expenseBalance(data, getExpense(data, "gs-ej-004")!)).toMatchObject({ paidCents: 8000, outstandingCents: 0, status: "pagado" });
  });

  it("expenses never touch tenant debt or collections", () => {
    expect(pendingCents(data)).toBe(140000);
    expect(data.expensePayments.some((p) => data.payments.some((x) => x.id === p.id))).toBe(false);
    expect(data.expenses.every((e) => data.contacts.find((c) => c.id === e.providerId)?.roles.includes("proveedor"))).toBe(true);
  });

  it("demo share of GS-EJ-002 sums exactly 100 € and creates no tenant charges", () => {
    const shares = sharesOfExpense(data, "gs-ej-002");
    expect(shares.map((s) => [s.roomId, s.amountCents])).toEqual([["aza-01", 3334], ["aza-02", 3333], ["aza-03", 3333]]);
    expect(data.charges.some((c) => c.concept.includes("Limpieza"))).toBe(false);
  });

  it("filters combine and can return zero results", () => {
    expect(filterExpenses(data, { ...all, providerId: "con-015" })).toHaveLength(2);
    expect(filterExpenses(data, { ...all, status: "pendiente" })).toHaveLength(2);
    expect(filterExpenses(data, { ...all, overdueOnly: true }).map((e) => e.id)).toEqual(["gs-ej-003"]);
    expect(filterExpenses(data, { ...all, q: "zzz" })).toHaveLength(0);
  });
});

describe("provider accounts are isolated by provider role", () => {
  it("provider account only includes its own expenses", () => {
    const a = providerAccount(data, "con-012");
    expect([a.expenses.length, a.costCents, a.paidCents, a.pendingCents]).toEqual([2, 36000, 9000, 27000]);
    expect(providerAccount(data, "con-015").pendingCents).toBe(10000);
    expect(providerAccountContacts(data).map((c) => c.id)).toEqual(["con-012", "con-015"]);
  });

  it("contacts without provider expenses have no provider account", () => {
    expect(providerAccount(data, "con-001").expenses).toHaveLength(0);
  });
});

describe("expense split math", () => {
  it("equal split 100 € across 3 rooms: 33,34 + 33,33 + 33,33, extra cent to first code", () => {
    expect(splitEqual(10000, ["aza-03", "aza-01", "aza-02"])).toEqual([
      { roomId: "aza-01", amountCents: 3334 },
      { roomId: "aza-02", amountCents: 3333 },
      { roomId: "aza-03", amountCents: 3333 },
    ]);
  });

  it("equal split 120 € across 4 rooms: 30 each", () => {
    expect(splitEqual(12000, ["oli-01", "oli-02", "oli-03", "oli-04"]).every((s) => s.amountCents === 3000)).toBe(true);
  });

  it("manual split must sum exactly; 99 instead of 100 is rejected", () => {
    const rooms = ["aza-01", "aza-02", "aza-03"];
    expect(splitManual(10000, rooms, { "aza-01": "34", "aza-02": "33", "aza-03": "33" })).not.toBeNull();
    expect(splitManual(10000, rooms, { "aza-01": "33", "aza-02": "33", "aza-03": "33" })).toBeNull();
    expect(splitManual(10000, rooms, { "aza-01": "-1", "aza-02": "50", "aza-03": "51" })).toBeNull();
    expect(splitManual(10000, rooms, { "aza-01": "abc", "aza-02": "50", "aza-03": "50" })).toBeNull();
  });
});

describe("expense draft validation", () => {
  const base = { ...emptyExpenseDraft, concept: "Limpieza de ejemplo", providerId: "con-015", category: "Limpieza", propertyId: "casa-azahar", date: "2026-10-20", period: "2026-10", dueDate: "2026-11-05", amount: "100" };

  it("valid data passes; empty and invalid values fail per field", () => {
    expect(validateExpenseData(base, data)).toEqual({});
    expect(validateExpenseData(emptyExpenseDraft, data)).toMatchObject({ concept: expect.any(String), providerId: expect.any(String), amount: expect.any(String) });
    expect(validateExpenseData({ ...base, amount: "1,234" }, data).amount).toBeDefined();
    expect(validateExpenseData({ ...base, amount: "0" }, data).amount).toBeDefined();
    expect(validateExpenseData({ ...base, providerId: "con-001" }, data).providerId).toBeDefined();
  });

  it("bearer must be explicit; inquilino bearer requires a split", () => {
    expect(validateExpenseSplit({ ...base, bearer: "", splitMode: "sin_reparto", roomIds: [] }, data).bearer).toBeDefined();
    expect(validateExpenseSplit({ ...base, bearer: "inquilino", splitMode: "sin_reparto", roomIds: [] }, data).split).toBeDefined();
    expect(validateExpenseSplit({ ...base, bearer: "operador", splitMode: "sin_reparto", roomIds: [] }, data)).toEqual({});
  });

  it("split needs units of the chosen property; manual must sum the amount", () => {
    expect(validateExpenseSplit({ ...base, bearer: "inquilino", splitMode: "igualitario", roomIds: [] }, data).split).toBeDefined();
    expect(validateExpenseSplit({ ...base, bearer: "inquilino", splitMode: "igualitario", roomIds: ["oli-01"] }, data).split).toBeDefined();
    expect(validateExpenseSplit({ ...base, bearer: "inquilino", splitMode: "igualitario", roomIds: ["aza-01", "aza-02", "aza-03"] }, data)).toEqual({});
    expect(validateExpenseSplit({ ...base, bearer: "inquilino", splitMode: "manual", roomIds: ["aza-01", "aza-02", "aza-03"], manualAmounts: { "aza-01": "34", "aza-02": "33", "aza-03": "32" } }, data).split).toBeDefined();
    expect(validateExpenseSplit({ ...base, bearer: "inquilino", splitMode: "manual", roomIds: ["aza-01", "aza-02", "aza-03"], manualAmounts: { "aza-01": "34", "aza-02": "33", "aza-03": "33" } }, data)).toEqual({});
  });
});

describe("provider payment simulator", () => {
  it("GS-EJ-001 (120 € unpaid): paying 50 leaves 70; paying 120 leaves 0", () => {
    const r50 = simulateProviderPayment(data, { providerId: "con-012", expenseId: "gs-ej-001", paidCents: 5000 });
    expect(r50).toMatchObject({ ok: true, costCents: 12000, paidAfterCents: 5000, outstandingAfterCents: 7000, totalPendingCents: 37000 });
    const r120 = simulateProviderPayment(data, { providerId: "con-012", expenseId: "gs-ej-001", paidCents: 12000 });
    expect(r120).toMatchObject({ ok: true, outstandingAfterCents: 0 });
  });

  it("rejects overpayment (121 > 120), paid expenses and other provider's expenses", () => {
    expect(simulateProviderPayment(data, { providerId: "con-012", expenseId: "gs-ej-001", paidCents: 12100 }).ok).toBe(false);
    expect(simulateProviderPayment(data, { providerId: "con-015", expenseId: "gs-ej-004", paidCents: 100 }).ok).toBe(false);
    expect(simulateProviderPayment(data, { providerId: "con-015", expenseId: "gs-ej-001", paidCents: 100 }).ok).toBe(false);
  });

  it("never mutates data: totals stay 540/170/370 and tenant debt 1.400 €", () => {
    const before = JSON.stringify(data);
    simulateProviderPayment(data, { providerId: "con-012", expenseId: "gs-ej-001", paidCents: 12000 });
    expect(JSON.stringify(data)).toBe(before);
    const t = expenseTotals(data);
    expect([t.costCents, t.paidCents, t.pendingCents]).toEqual([54000, 17000, 37000]);
    expect(pendingCents(data)).toBe(140000);
  });
});
