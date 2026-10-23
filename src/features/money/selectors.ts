import type { Charge, Contract, Payment, PortfolioDataset } from "@/features/portfolio/data/types";
import { formatMoney } from "@/lib/format";

// All money figures derive here from charges, payments and allocations.
// Unallocated money is never netted against debt; deposits are never rent.

export type ChargeStatus = "pendiente" | "parcial" | "satisfecho" | "anulado";
export const CHARGE_STATUSES: ChargeStatus[] = ["pendiente", "parcial", "satisfecho", "anulado"];

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const periodLabel = (p: string) => {
  const [y, m] = p.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
};
export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const periodsOf = (d: PortfolioDataset) => [...new Set(d.charges.map((c) => c.period))].sort();

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const contractOf = (d: PortfolioDataset, id: string) => d.contracts.find((c) => c.id === id)!;

export const getCharge = (d: PortfolioDataset, id: string) => d.charges.find((c) => c.id === id.toLowerCase());
export const getPayment = (d: PortfolioDataset, id: string) => d.payments.find((p) => p.id === id);
export const allocationsOfCharge = (d: PortfolioDataset, chargeId: string) => d.allocations.filter((a) => a.chargeId === chargeId);
export const allocationsOfPayment = (d: PortfolioDataset, paymentId: string) => d.allocations.filter((a) => a.paymentId === paymentId);

export interface ChargeBalance {
  amountCents: number;
  allocatedCents: number;
  outstandingCents: number;
  status: ChargeStatus;
  /** Condition, not a status: unpaid amount whose due date is before the reference date. */
  overdue: boolean;
}

export function chargeBalance(d: PortfolioDataset, c: Charge): ChargeBalance {
  if (c.voidReason) return { amountCents: c.amountCents, allocatedCents: 0, outstandingCents: 0, status: "anulado", overdue: false };
  const allocatedCents = sum(allocationsOfCharge(d, c.id).map((a) => a.amountCents));
  const outstandingCents = Math.max(0, c.amountCents - allocatedCents);
  const status: ChargeStatus = outstandingCents === 0 ? "satisfecho" : allocatedCents > 0 ? "parcial" : "pendiente";
  return { amountCents: c.amountCents, allocatedCents, outstandingCents, status, overdue: outstandingCents > 0 && c.dueDate < d.referenceDate };
}

export const chargeContract = (d: PortfolioDataset, c: Charge): Contract => contractOf(d, c.contractId);
export const chargePropertyId = (d: PortfolioDataset, c: Charge) => contractOf(d, c.contractId).propertyId;

export const paymentUnallocatedCents = (d: PortfolioDataset, p: Payment) =>
  p.amountCents - sum(allocationsOfPayment(d, p.id).map((a) => a.amountCents));
export const paymentPropertyId = (d: PortfolioDataset, p: Payment) => (p.contractId ? contractOf(d, p.contractId).propertyId : undefined);

export interface MoneyFilter {
  /** Charges: accrual month. Payments: month of the receipt date. */
  period?: string | undefined;
  propertyId?: string | undefined;
}

export const chargesMatching = (d: PortfolioDataset, f: MoneyFilter = {}) =>
  d.charges.filter((c) => (!f.period || c.period === f.period) && (!f.propertyId || chargePropertyId(d, c) === f.propertyId));

export const paymentsMatching = (d: PortfolioDataset, f: MoneyFilter = {}) =>
  d.payments
    .filter((p) => (!f.period || p.receivedOn.startsWith(f.period)) && (!f.propertyId || paymentPropertyId(d, p) === f.propertyId))
    .sort((a, b) => b.receivedOn.localeCompare(a.receivedOn) || a.reference.localeCompare(b.reference));

export const pendingCents = (d: PortfolioDataset, f: MoneyFilter = {}) =>
  sum(chargesMatching(d, f).map((c) => chargeBalance(d, c).outstandingCents));

export function moneySummary(d: PortfolioDataset, f: MoneyFilter = {}) {
  const bal = chargesMatching(d, f).filter((c) => !c.voidReason).map((c) => chargeBalance(d, c));
  const payments = paymentsMatching(d, f);
  const unattributed = f.propertyId ? d.payments.filter((p) => !paymentPropertyId(d, p) && (!f.period || p.receivedOn.startsWith(f.period))) : [];
  const unallocated = sum(payments.map((p) => paymentUnallocatedCents(d, p)));
  const received = sum(payments.map((p) => p.amountCents));
  return {
    chargedCents: sum(bal.map((b) => b.amountCents)),
    pendingCents: sum(bal.map((b) => b.outstandingCents)),
    overdueCents: sum(bal.filter((b) => b.overdue).map((b) => b.outstandingCents)),
    openChargeCount: bal.filter((b) => b.outstandingCents > 0).length,
    receivedCents: received,
    allocatedCents: received - unallocated,
    unallocatedCents: unallocated,
    paymentCount: payments.length,
    unattributedUnallocatedCents: sum(unattributed.map((p) => paymentUnallocatedCents(d, p))),
  };
}

export interface ContractPending {
  roomId: string;
  contractId: string;
  payerId: string;
  cents: number;
  concept: string;
  chargeIds: string[];
}

/** Outstanding debt grouped by contract (one per room in the demo). */
export function pendingByRoom(d: PortfolioDataset, f: MoneyFilter = {}): ContractPending[] {
  const groups = new Map<string, Charge[]>();
  for (const c of chargesMatching(d, f)) {
    if (chargeBalance(d, c).outstandingCents > 0) groups.set(c.contractId, [...(groups.get(c.contractId) ?? []), c]);
  }
  return [...groups.entries()]
    .map(([contractId, cs]) => {
      cs.sort((a, b) => a.period.localeCompare(b.period));
      const parts = cs.map((c) => {
        const b = chargeBalance(d, c);
        const base = `${b.status === "parcial" ? "resto de" : "renta de"} ${periodLabel(c.period)}`;
        return cs.length > 1 ? `${base} (${formatMoney(b.outstandingCents)})` : base;
      });
      return {
        roomId: contractOf(d, contractId).roomId,
        contractId,
        payerId: cs[0]!.payerId,
        cents: sum(cs.map((c) => chargeBalance(d, c).outstandingCents)),
        concept: capitalize(parts.join(" y ")),
        chargeIds: cs.map((c) => c.id),
      };
    })
    .sort((a, b) => a.roomId.localeCompare(b.roomId));
}

const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export interface ChargeQuery {
  q: string;
  propertyId: string | "todos";
  status: ChargeStatus | "todos";
  period: string | "todos";
  overdueOnly: boolean;
}

export function filterCharges(d: PortfolioDataset, o: ChargeQuery): Charge[] {
  const q = normalize(o.q);
  return d.charges
    .filter((c) => o.propertyId === "todos" || chargePropertyId(d, c) === o.propertyId)
    .filter((c) => o.period === "todos" || c.period === o.period)
    .filter((c) => {
      const b = chargeBalance(d, c);
      return (o.status === "todos" || b.status === o.status) && (!o.overdueOnly || b.overdue);
    })
    .filter((c) => {
      if (!q) return true;
      const ct = contractOf(d, c.contractId);
      const room = d.rooms.find((r) => r.id === ct.roomId)?.code ?? "";
      const payer = d.contacts.find((x) => x.id === c.payerId)?.name ?? "";
      return [c.reference, c.concept, ct.reference, room, payer].some((v) => normalize(v).includes(q));
    })
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate) || a.reference.localeCompare(b.reference));
}

// --- Tenant accounts: only charges where the contact is the payer.

export const tenantContracts = (d: PortfolioDataset, contactId: string) => d.contracts.filter((c) => c.tenantIds.includes(contactId));
export const guarantorOnlyContracts = (d: PortfolioDataset, contactId: string) =>
  d.contracts.filter((c) => c.guarantorIds.includes(contactId) && !c.tenantIds.includes(contactId));
export const hasTenantAccount = (d: PortfolioDataset, contactId: string) => tenantContracts(d, contactId).length > 0;
export const tenantAccountContacts = (d: PortfolioDataset) => d.contacts.filter((c) => hasTenantAccount(d, c.id));

export function tenantAccount(d: PortfolioDataset, contactId: string, contractId?: string) {
  const charges = d.charges
    .filter((c) => c.payerId === contactId && (!contractId || c.contractId === contractId))
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate) || a.reference.localeCompare(b.reference));
  const payments = d.payments
    .filter((p) => p.payerId === contactId && (!contractId || p.contractId === contractId))
    .sort((a, b) => b.receivedOn.localeCompare(a.receivedOn));
  const bal = charges.filter((c) => !c.voidReason).map((c) => chargeBalance(d, c));
  const received = sum(payments.map((p) => p.amountCents));
  const unallocated = sum(payments.map((p) => paymentUnallocatedCents(d, p)));
  return {
    charges,
    payments,
    chargedCents: sum(bal.map((b) => b.amountCents)),
    pendingCents: sum(bal.map((b) => b.outstandingCents)),
    overdueCents: sum(bal.filter((b) => b.overdue).map((b) => b.outstandingCents)),
    receivedCents: received,
    allocatedCents: received - unallocated,
    unallocatedCents: unallocated,
  };
}

// --- Deposits: separate ledger. The contract amount is only what is expected.

export type DepositStatus = "sin_movimientos" | "pendiente_aportar" | "recibida" | "devuelta" | "devuelta_parcial";

export const depositContracts = (d: PortfolioDataset) =>
  d.contracts.filter((c) => c.status === "activo" || c.status === "pendiente" || c.status === "finalizado").sort((a, b) => a.reference.localeCompare(b.reference));

export function depositOf(d: PortfolioDataset, c: Contract) {
  const movements = d.depositMovements.filter((m) => m.contractId === c.id).sort((a, b) => a.date.localeCompare(b.date));
  const receivedCents = sum(movements.filter((m) => m.kind === "recepcion").map((m) => m.amountCents));
  const returnedCents = sum(movements.filter((m) => m.kind === "devolucion").map((m) => m.amountCents));
  const heldCents = receivedCents - returnedCents;
  const toContributeCents = c.status === "activo" ? Math.max(0, c.depositCents - receivedCents) : 0;
  const status: DepositStatus =
    returnedCents > 0 ? (heldCents === 0 ? "devuelta" : "devuelta_parcial")
    : toContributeCents > 0 ? "pendiente_aportar"
    : receivedCents === 0 ? "sin_movimientos"
    : "recibida";
  return { contract: c, movements, expectedCents: c.depositCents, receivedCents, returnedCents, heldCents, toContributeCents, status };
}

export function depositTotals(d: PortfolioDataset, propertyId?: string) {
  const rows = depositContracts(d).filter((c) => !propertyId || c.propertyId === propertyId).map((c) => depositOf(d, c));
  return {
    rows,
    expectedActiveCents: sum(rows.filter((r) => r.contract.status === "activo").map((r) => r.expectedCents)),
    receivedCents: sum(rows.map((r) => r.receivedCents)),
    returnedCents: sum(rows.map((r) => r.returnedCents)),
    heldCents: sum(rows.map((r) => r.heldCents)),
    toContributeCents: sum(rows.map((r) => r.toContributeCents)),
  };
}
