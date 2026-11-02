import { describe, expect, it } from "vitest";
import { demoPortfolio } from "@/features/portfolio/data/demo-data";
import type { PortfolioDataset } from "@/features/portfolio/data/types";
import { addRoom, emptyOverlay, mergeCatalog } from "@/features/catalog/engine";
import { pendingCents } from "@/features/money/selectors";
import { parseCsvText } from "@/features/catalog/csv/import-engine";
import {
  buildReport, currentDebtByOrigin, expenseReport, incomeReport, occupancyAt, reportCsv, resolveFilters, resultReport,
  validateReportsSearch,
} from "./selectors";

const base = demoPortfolio;
const REF = base.referenceDate;

describe("occupancy", () => {
  it("reference date: 8/11 enabled, 12 managed; rate only at reference", () => {
    const o = occupancyAt(base, REF, null);
    expect(REF).toBe("2026-10-21");
    expect([o.occupied, o.enabledNow, o.managed]).toEqual([8, 11, 12]);
    expect(o.rate).toBeCloseTo(8 / 11);
    expect(occupancyAt(base, "2026-10-20", null).rate).toBeNull();
  });
  it("a new available unit gives 8/12 and 13 managed", () => {
    const r = addRoom(base, emptyOverlay(), { code: "INF-01", propertyId: "casa-olivo", monthlyRent: 400, features: [] });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const o = occupancyAt(mergeCatalog(base, r.overlay), REF, null);
    expect([o.occupied, o.enabledNow, o.managed]).toEqual([8, 12, 13]);
  });
  it("boundaries: check-in occupies, check-out does not; finalizado counts historically; borrador/pendiente never", () => {
    // CT-EJ-0102 oli-02 starts 2026-09-01.
    expect(occupancyAt(base, "2026-08-31", "casa-olivo").occupiedRoomIds).not.toContain("oli-02");
    expect(occupancyAt(base, "2026-09-01", "casa-olivo").occupiedRoomIds).toContain("oli-02");
    // CT-EJ-0098 finalizado aza-04 2024-11-01..2025-11-01; CT-EJ-0204 starts 2025-11-01.
    expect(occupancyAt(base, "2025-10-31", "casa-azahar").occupiedRoomIds).toContain("aza-04");
    // borrador oli-05 (2026-11-15) and pendiente oli-06 (2026-11-01) never occupy.
    const later = occupancyAt(base, "2026-12-01", "casa-olivo").occupiedRoomIds;
    expect(later).not.toContain("oli-05");
    expect(later).not.toContain("oli-06");
    // cancelado aza-05 never occupies.
    expect(occupancyAt(base, "2026-10-15", "casa-azahar").occupiedRoomIds).not.toContain("aza-05");
  });
});

describe("debt, income and expenses", () => {
  it("current debt by origin: Sep 150, Oct 1250, global 1400", () => {
    const d = currentDebtByOrigin(base, null);
    expect(d.rows.map((r) => [r.period, r.cents])).toEqual([["2026-09", 15000], ["2026-10", 125000]]);
    expect(d.totalCents).toBe(140000);
    expect(d.totalCents).toBe(pendingCents(base));
  });
  it("debt is the current criterion whatever month/date filter", () => {
    const a = buildReport(base, { mes: "2026-09", fecha: "2026-01-01" }).report!;
    expect(a.debt.totalCents).toBe(140000);
  });
  it("expenses global 540/170/370; October accrual 460/90/370 vs provider cash 170", () => {
    const g = expenseReport(base, null, null);
    expect([g.costCents, g.paidOnTheseCents, g.pendingCents]).toEqual([54000, 17000, 37000]);
    const oct = expenseReport(base, "2026-10", null);
    expect([oct.costCents, oct.paidOnTheseCents, oct.pendingCents]).toEqual([46000, 9000, 37000]);
    expect(oct.providerCashCents).toBe(17000);
    expect(oct.providerCashCents).not.toBe(oct.paidOnTheseCents);
  });
  it("base income total received 4720 reconciles with property rows + unattributed", () => {
    const i = incomeReport(base, null, null);
    expect(i.totalReceivedCents).toBe(472000);
    expect(i.rows.reduce((a, r) => a + r.receivedCents, 0) + i.unattributed.receivedCents).toBe(i.totalReceivedCents);
  });
  it("late payment and an unattributed payment are each counted once", () => {
    const d: PortfolioDataset = {
      ...base,
      payments: [...base.payments,
        { id: "x-late", reference: "X-LATE", payerId: "con-001", contractId: base.contracts.find((c) => c.roomId === "oli-01")!.id, receivedOn: "2026-10-18", amountCents: 1000, note: "Atrasado (ficticio)." },
        { id: "x-free", reference: "X-FREE", payerId: "con-002", receivedOn: "2026-10-18", amountCents: 700, note: "Sin contrato (ficticio)." }],
    };
    const before = incomeReport(base, "2026-10", null);
    const after = incomeReport(d, "2026-10", null);
    expect(after.totalReceivedCents - before.totalReceivedCents).toBe(1700);
    expect(after.unattributed.receivedCents - before.unattributed.receivedCents).toBe(700);
    expect(after.totalAccruedCents).toBe(before.totalAccruedCents);
    // Filtered by property, unattributed money stays outside the filtered total.
    const olivo = incomeReport(d, "2026-10", "casa-olivo");
    expect(olivo.totalReceivedCents).toBe(olivo.rows[0]!.receivedCents);
    // Unallocated money never reduces debt.
    expect(currentDebtByOrigin(d, null).totalCents).toBe(140000);
  });
});

describe("orientative result", () => {
  it("Azahar fixed rent fixedCents 0 means undefined → No calculable; total incomplete", () => {
    const r = resultReport(base, "2026-10", null);
    const aza = r.rows.find((x) => x.propertyId === "casa-azahar")!;
    expect(aza.status).toBe("no_calculable");
    expect(r.complete).toBe(false);
    expect(r.totalCents).toBeNull();
    const oli = r.rows.find((x) => x.propertyId === "casa-olivo")!;
    expect(oli.status).toBe("ok");
    if (oli.status === "ok") expect(oli.resultCents).toBe(oli.accruedCents - oli.costCents);
  });
});

describe("filters and CSV", () => {
  it("invalid month/date and unknown property give issues and no report", () => {
    expect(resolveFilters(base, { mes: "2026-13", fecha: REF }).issues).toHaveLength(1);
    expect(resolveFilters(base, { mes: "2026-10", fecha: "2026-02-30" }).issues).toHaveLength(1);
    const u = buildReport(base, { mes: "2026-10", fecha: REF, inmueble: "cat-inm-99" });
    expect(u.report).toBeNull();
    expect(reportCsv(base, { mes: "2026-10", fecha: REF, inmueble: "cat-inm-99" })).toBeNull();
  });
  it("search keeps raw values and defaults", () => {
    expect(validateReportsSearch({}, REF)).toEqual({ mes: "2026-10", fecha: REF });
    expect(validateReportsSearch({ mes: "x", inmueble: "cat-inm-5" }, REF)).toEqual({ mes: "x", fecha: REF, inmueble: "cat-inm-5" });
  });
  it("CSV follows the same filter: property scope only lists that property", () => {
    const text = reportCsv(base, { mes: "2026-10", fecha: REF, inmueble: "casa-olivo" })!;
    const p = parseCsvText(text, ";");
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    expect(p.csv.headers).toEqual(["seccion", "concepto", "inmueble", "importe_eur", "criterio"]);
    const props = new Set(p.csv.rows.filter((r) => r[0] === "gastos_devengo").map((r) => r[2]));
    expect([...props]).toEqual(["Casa Olivo"]);
    const total = p.csv.rows.find((r) => r[0] === "deuda_actual" && r[1] === "Total")!;
    expect(total[3]).toBe(String(currentDebtByOrigin(base, "casa-olivo").totalCents / 100).replace(".", ","));
    const g = buildReport(base, { mes: "2026-10", fecha: REF }).report!;
    const all = parseCsvText(reportCsv(base, { mes: "2026-10", fecha: REF })!, ";");
    if (!all.ok) throw new Error("csv");
    expect(all.csv.rows.find((r) => r[0] === "deuda_actual" && r[1] === "Total")![3]).toBe("1400");
    expect(g.expenses.providerCashCents).toBe(17000);
  });
});
