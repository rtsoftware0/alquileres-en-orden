// General reports (tanda 6). Pure read-only derivations over the current
// catalog view. Economic collections are never mutated; every figure comes from
// the existing money/expense selectors or from sums of the same movements.
// Accrual (devengo), cash (caja) and current debt are kept as separate concepts.
import type { PortfolioDataset } from "@/features/portfolio/data/types";
import {
  chargeBalance, chargesMatching, paymentPropertyId, paymentUnallocatedCents, paymentsMatching,
} from "@/features/money/selectors";
import { expenseTotals } from "@/features/money/expenses";
import { contexts } from "@/features/settlements/data/examples";
import { serializeCsv, DEFAULT_CSV, type Cell } from "@/features/catalog/csv/export";

export const ALL_MONTHS = "todos";
export const DEFAULT_MONTH = "2026-10";

export interface ReportsSearch { mes: string; fecha: string; inmueble?: string }

const str = (v: unknown, max = 80) => (typeof v === "string" ? v.slice(0, max) : undefined);

/** Keeps raw values (also invalid ones) so the screen can warn instead of widening. */
export function validateReportsSearch(input: Record<string, unknown>, referenceDate: string): ReportsSearch {
  const inmueble = str(input["inmueble"]);
  return {
    mes: str(input["mes"], 20) ?? DEFAULT_MONTH,
    fecha: str(input["fecha"], 20) ?? referenceDate,
    ...(inmueble ? { inmueble } : {}),
  };
}

export const isMonth = (m: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(m);
export function isCivilDate(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export interface ResolvedFilters {
  month: string | null; // null = all months
  date: string;
  propertyId: string | null; // null = whole portfolio
  issues: string[];
}

export function resolveFilters(d: PortfolioDataset, s: ReportsSearch): ResolvedFilters {
  const issues: string[] = [];
  const monthOk = s.mes === ALL_MONTHS || isMonth(s.mes);
  if (!monthOk) issues.push(`Mes económico no válido: «${s.mes}». Usa AAAA-MM o «todos».`);
  if (!isCivilDate(s.fecha)) issues.push(`Fecha de ocupación no válida: «${s.fecha}». Usa AAAA-MM-DD.`);
  if (s.inmueble && !d.properties.some((p) => p.id === s.inmueble))
    issues.push(`El inmueble seleccionado (${s.inmueble}) no existe en la cartera actual. No se muestra la cartera completa en su lugar.`);
  return { month: monthOk && s.mes !== ALL_MONTHS ? s.mes : null, date: s.fecha, propertyId: s.inmueble ?? null, issues };
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const inMonth = (iso: string, m: string | null) => !m || iso.startsWith(m);

// --- Occupancy -------------------------------------------------------------

export interface OccupancyReport {
  date: string;
  isReference: boolean;
  managed: number;
  /** Managed minus currently blocked units (current status only, no history). */
  enabledNow: number;
  occupied: number;
  occupiedRoomIds: string[];
  /** Only at the reference date; null otherwise (no reliable historical blocks). */
  rate: number | null;
}

export function occupancyAt(d: PortfolioDataset, date: string, propertyId: string | null): OccupancyReport {
  const rooms = d.rooms.filter((r) => !propertyId || r.propertyId === propertyId);
  const ids = new Set(rooms.map((r) => r.id));
  const occupied = [...new Set(
    d.contracts
      .filter((c) => (c.status === "activo" || c.status === "finalizado") && ids.has(c.roomId) && c.startDate <= date && date < c.endDate)
      .map((c) => c.roomId),
  )].sort();
  const enabledNow = rooms.filter((r) => r.status !== "bloqueada").length;
  const isReference = date === d.referenceDate;
  return {
    date, isReference, managed: rooms.length, enabledNow, occupied: occupied.length, occupiedRoomIds: occupied,
    rate: isReference && enabledNow > 0 ? occupied.length / enabledNow : null,
  };
}

// --- Current debt by origin month -----------------------------------------

export interface DebtRow { period: string; cents: number; chargeIds: string[] }

/** Current outstanding at the reference date, grouped by the charge's accrual month. */
export function currentDebtByOrigin(d: PortfolioDataset, propertyId: string | null): { rows: DebtRow[]; totalCents: number } {
  const map = new Map<string, DebtRow>();
  for (const c of chargesMatching(d, propertyId ? { propertyId } : {})) {
    if (c.voidReason) continue;
    const out = chargeBalance(d, c).outstandingCents;
    if (out <= 0) continue;
    const row = map.get(c.period) ?? { period: c.period, cents: 0, chargeIds: [] };
    row.cents += out;
    row.chargeIds.push(c.id);
    map.set(c.period, row);
  }
  const rows = [...map.values()].sort((a, b) => a.period.localeCompare(b.period));
  return { rows, totalCents: sum(rows.map((r) => r.cents)) };
}

// --- Tenant income: accrual and cash --------------------------------------

export interface IncomeRow { propertyId: string | null; accruedCents: number; receivedCents: number; allocatedCents: number; unallocatedCents: number; paymentCount: number }

function accrued(d: PortfolioDataset, month: string | null, propertyId: string) {
  return sum(chargesMatching(d, { period: month ?? undefined, propertyId }).filter((c) => !c.voidReason).map((c) => c.amountCents));
}
function cashRow(d: PortfolioDataset, month: string | null, propertyId: string | null): Omit<IncomeRow, "accruedCents"> {
  const pays = paymentsMatching(d, { period: month ?? undefined }).filter((p) => (paymentPropertyId(d, p) ?? null) === propertyId);
  const received = sum(pays.map((p) => p.amountCents));
  const unallocated = sum(pays.map((p) => paymentUnallocatedCents(d, p)));
  return { propertyId, receivedCents: received, allocatedCents: received - unallocated, unallocatedCents: unallocated, paymentCount: pays.length };
}

export interface IncomeReport {
  rows: IncomeRow[]; // one per property in scope
  /** Payments without a contract: shown once, never split across properties. */
  unattributed: Omit<IncomeRow, "accruedCents" | "propertyId">;
  totalAccruedCents: number;
  totalReceivedCents: number;
}

export function incomeReport(d: PortfolioDataset, month: string | null, propertyId: string | null): IncomeReport {
  const props = d.properties.filter((p) => !propertyId || p.id === propertyId);
  const rows = props.map((p) => ({ ...cashRow(d, month, p.id), accruedCents: accrued(d, month, p.id) }));
  const { propertyId: _x, ...unattributed } = cashRow(d, month, null);
  const included = propertyId ? 0 : unattributed.receivedCents;
  return {
    rows, unattributed,
    totalAccruedCents: sum(rows.map((r) => r.accruedCents)),
    totalReceivedCents: sum(rows.map((r) => r.receivedCents)) + included,
  };
}

// --- Expenses: accrual and provider cash ----------------------------------

export interface ExpenseRow { propertyId: string; costCents: number; paidOnTheseCents: number; pendingCents: number; providerCashCents: number }

export function providerCash(d: PortfolioDataset, month: string | null, propertyId: string | null) {
  const pays = d.expensePayments.filter((p) => {
    const e = d.expenses.find((x) => x.id === p.expenseId);
    return e && inMonth(p.date, month) && (!propertyId || e.propertyId === propertyId);
  });
  return { cents: sum(pays.map((p) => p.amountCents)), paymentIds: pays.map((p) => p.id) };
}

export function expenseReport(d: PortfolioDataset, month: string | null, propertyId: string | null) {
  const props = d.properties.filter((p) => !propertyId || p.id === propertyId);
  const rows: ExpenseRow[] = props.map((p) => {
    const t = expenseTotals(d, { period: month ?? undefined, propertyId: p.id });
    return { propertyId: p.id, costCents: t.costCents, paidOnTheseCents: t.paidCents, pendingCents: t.pendingCents, providerCashCents: providerCash(d, month, p.id).cents };
  });
  return {
    rows,
    costCents: sum(rows.map((r) => r.costCents)),
    paidOnTheseCents: sum(rows.map((r) => r.paidOnTheseCents)),
    pendingCents: sum(rows.map((r) => r.pendingCents)),
    providerCashCents: sum(rows.map((r) => r.providerCashCents)),
  };
}

// --- Orientative result per property --------------------------------------

export type ResultRow =
  | { propertyId: string; status: "ok"; accruedCents: number; costCents: number; resultCents: number }
  | { propertyId: string; status: "no_calculable"; reason: string; noActivity: boolean };

export function resultReport(d: PortfolioDataset, month: string | null, propertyId: string | null) {
  const inc = incomeReport(d, month, propertyId);
  const exp = expenseReport(d, month, propertyId);
  const rows: ResultRow[] = inc.rows.map((r) => {
    const pid = r.propertyId!;
    const cost = exp.rows.find((e) => e.propertyId === pid)?.costCents ?? 0;
    const ctx = contexts.find((c) => c.scope === "cartera" && c.propertyId === pid);
    const noActivity = r.accruedCents === 0 && cost === 0 && r.receivedCents === 0;
    // fixedCents 0 on a fixed-rent agreement is a marker for "not defined", never a real 0 cost.
    if (ctx?.model === "renta_fija" && !(ctx.fixedCents > 0))
      return { propertyId: pid, status: "no_calculable", reason: "Renta fija del acuerdo no definida.", noActivity };
    if (!ctx) return { propertyId: pid, status: "no_calculable", reason: "Sin acuerdo registrado para este inmueble.", noActivity };
    return { propertyId: pid, status: "ok", accruedCents: r.accruedCents, costCents: cost, resultCents: r.accruedCents - cost };
  });
  const complete = rows.every((r) => r.status === "ok");
  const totalCents = complete ? sum(rows.map((r) => (r.status === "ok" ? r.resultCents : 0))) : null;
  return { rows, complete, totalCents };
}

// --- Whole report + CSV -----------------------------------------------------

export function buildReport(d: PortfolioDataset, s: ReportsSearch) {
  const f = resolveFilters(d, s);
  if (f.issues.length) return { filters: f, report: null };
  return {
    filters: f,
    report: {
      occupancy: occupancyAt(d, f.date, f.propertyId),
      debt: currentDebtByOrigin(d, f.propertyId),
      income: incomeReport(d, f.month, f.propertyId),
      expenses: expenseReport(d, f.month, f.propertyId),
      result: resultReport(d, f.month, f.propertyId),
    },
  };
}

const eur = (c: number) => c / 100;

/** CSV of exactly the visible report; null when filters are invalid (never exports the whole portfolio instead). */
export function reportCsv(d: PortfolioDataset, s: ReportsSearch): string | null {
  const { filters: f, report: r } = buildReport(d, s);
  if (!r) return null;
  const name = (id: string | null) => (id ? d.properties.find((p) => p.id === id)?.name ?? id : "Toda la cartera");
  const rows: Cell[][] = [
    ["meta", "Mes económico", f.month ?? "Todos los meses", "", "Devengo por periodo del cargo/gasto; caja por fecha de cobro/pago"],
    ["meta", "Fecha de referencia", d.referenceDate, "", "Deuda actual a esta fecha"],
    ["meta", "Fecha de ocupación", f.date, "", "Contratos activo/finalizado con entrada <= fecha < salida"],
    ["meta", "Inmueble", name(f.propertyId), "", "Datos ficticios · demostración"],
    ["ocupacion", "Unidades gestionadas", name(f.propertyId), r.occupancy.managed, ""],
    ["ocupacion", "Unidades ocupadas", name(f.propertyId), r.occupancy.occupied, `A ${f.date}`],
    ["ocupacion", "Habilitadas (estado actual)", name(f.propertyId), r.occupancy.enabledNow, "Bloqueos solo en estado actual, sin historial"],
  ];
  for (const x of r.debt.rows) rows.push(["deuda_actual", `Origen ${x.period}`, name(f.propertyId), eur(x.cents), `Saldo actual a ${d.referenceDate}`]);
  rows.push(["deuda_actual", "Total", name(f.propertyId), eur(r.debt.totalCents), `Saldo actual a ${d.referenceDate}`]);
  for (const x of r.income.rows) {
    rows.push(["devengo", "Cargos no anulados", name(x.propertyId), eur(x.accruedCents), "Por periodo"]);
    rows.push(["caja_cobros", "Recibido", name(x.propertyId), eur(x.receivedCents), "Por fecha de cobro"]);
    rows.push(["caja_cobros", "Asignado", name(x.propertyId), eur(x.allocatedCents), ""]);
    rows.push(["caja_cobros", "Sin asignar", name(x.propertyId), eur(x.unallocatedCents), "No reduce deuda"]);
  }
  if (!f.propertyId) rows.push(["caja_cobros", "No atribuidos a inmueble", "Toda la cartera", eur(r.income.unattributed.receivedCents), "Contados una vez"]);
  else rows.push(["caja_cobros", "No atribuidos a inmueble (fuera del filtro)", "Toda la cartera", eur(r.income.unattributed.receivedCents), "No incluidos en el total filtrado"]);
  rows.push(["caja_cobros", "Total recibido", name(f.propertyId), eur(r.income.totalReceivedCents), ""]);
  for (const x of r.expenses.rows) {
    rows.push(["gastos_devengo", "Coste", name(x.propertyId), eur(x.costCents), "Por periodo del gasto"]);
    rows.push(["gastos_devengo", "Pagado sobre esos gastos", name(x.propertyId), eur(x.paidOnTheseCents), "No es caja del mes"]);
    rows.push(["gastos_devengo", "Pendiente", name(x.propertyId), eur(x.pendingCents), ""]);
    rows.push(["caja_proveedores", "Pagado en el mes", name(x.propertyId), eur(x.providerCashCents), "Por fecha de pago"]);
  }
  for (const x of r.result.rows)
    rows.push(x.status === "ok"
      ? ["resultado_orientativo", "Devengo − coste", name(x.propertyId), eur(x.resultCents), "Orientativo; no fiscal ni liquidación"]
      : ["resultado_orientativo", "No calculable", name(x.propertyId), "", x.reason]);
  rows.push(["resultado_orientativo", "Total", name(f.propertyId), r.result.totalCents === null ? "" : eur(r.result.totalCents), r.result.complete ? "" : "Incompleto: hay inmuebles no calculables"]);
  return serializeCsv(["seccion", "concepto", "inmueble", "importe_eur", "criterio"], rows, DEFAULT_CSV).text;
}

export const reportFileName = (s: ReportsSearch) =>
  `informe-${(s.mes || "mes").replace(/[^a-z0-9-]/gi, "")}-${(s.inmueble ?? "cartera").replace(/[^a-z0-9-]/gi, "")}.csv`;

