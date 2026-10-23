import type { Expense, PortfolioDataset } from "@/features/portfolio/data/types";

// Expense selectors. Balances derive from expense payments; the ledger is
// separate from tenant debt, rent and deposits.

export type ExpenseStatus = "pendiente" | "parcial" | "pagado";
export const EXPENSE_STATUSES: ExpenseStatus[] = ["pendiente", "parcial", "pagado"];

export const bearerLabel: Record<Expense["bearer"], string> = {
  operador: "Operador",
  propietario: "Propietario",
  inquilino: "Inquilinos (reparto simulado)",
};

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();


export const getExpense = (d: PortfolioDataset, id: string) => d.expenses.find((e) => e.id === id.toLowerCase());
export const paymentsOfExpense = (d: PortfolioDataset, expenseId: string) =>
  d.expensePayments.filter((p) => p.expenseId === expenseId).sort((a, b) => a.date.localeCompare(b.date));
export const sharesOfExpense = (d: PortfolioDataset, expenseId: string) =>
  d.expenseShares.filter((s) => s.expenseId === expenseId).sort((a, b) => a.roomId.localeCompare(b.roomId));

export interface ExpenseBalance {
  amountCents: number;
  paidCents: number;
  outstandingCents: number;
  status: ExpenseStatus;
  /** Condition, not a status: unpaid amount whose due date is before the reference date. */
  overdue: boolean;
}

export function expenseBalance(d: PortfolioDataset, e: Expense): ExpenseBalance {
  const paidCents = sum(paymentsOfExpense(d, e.id).map((p) => p.amountCents));
  const outstandingCents = Math.max(0, e.amountCents - paidCents);
  const status: ExpenseStatus = outstandingCents === 0 ? "pagado" : paidCents > 0 ? "parcial" : "pendiente";
  return { amountCents: e.amountCents, paidCents, outstandingCents, status, overdue: outstandingCents > 0 && e.dueDate < d.referenceDate };
}

export interface ExpenseFilter {
  period?: string | undefined; // expense month
  propertyId?: string | undefined;
}

export const expensesMatching = (d: PortfolioDataset, f: ExpenseFilter = {}) =>
  d.expenses.filter((e) => (!f.period || e.period === f.period) && (!f.propertyId || e.propertyId === f.propertyId));

export function expenseTotals(d: PortfolioDataset, f: ExpenseFilter = {}) {
  const rows = expensesMatching(d, f).map((e) => expenseBalance(d, e));
  return {
    count: rows.length,
    costCents: sum(rows.map((r) => r.amountCents)),
    paidCents: sum(rows.map((r) => r.paidCents)),
    pendingCents: sum(rows.map((r) => r.outstandingCents)),
    overdueCents: sum(rows.filter((r) => r.overdue).map((r) => r.outstandingCents)),
  };
}

export const expensePeriodsOf = (d: PortfolioDataset) => [...new Set(d.expenses.map((e) => e.period))].sort();
export const expenseCategoriesOf = (d: PortfolioDataset) => [...new Set(d.expenses.map((e) => e.category))].sort();

export interface ExpenseQuery {
  q: string;
  propertyId: string | "todos";
  providerId: string | "todos";
  category: string | "todos";
  period: string | "todos";
  status: ExpenseStatus | "todos";
  overdueOnly: boolean;
}

export function filterExpenses(d: PortfolioDataset, o: ExpenseQuery): Expense[] {
  const q = normalize(o.q);
  return d.expenses
    .filter((e) => o.propertyId === "todos" || e.propertyId === o.propertyId)
    .filter((e) => o.providerId === "todos" || e.providerId === o.providerId)
    .filter((e) => o.category === "todos" || e.category === o.category)
    .filter((e) => o.period === "todos" || e.period === o.period)
    .filter((e) => {
      const b = expenseBalance(d, e);
      return (o.status === "todos" || b.status === o.status) && (!o.overdueOnly || b.overdue);
    })
    .filter((e) => {
      if (!q) return true;
      const provider = d.contacts.find((c) => c.id === e.providerId)?.name ?? "";
      const property = d.properties.find((p) => p.id === e.propertyId)?.name ?? "";
      return [e.reference, e.concept, e.category, provider, property].some((v) => normalize(v).includes(q));
    })
    .sort((a, b) => b.date.localeCompare(a.date) || a.reference.localeCompare(b.reference));
}

// --- Provider accounts: only expenses where the contact is the provider.

export const providerExpenses = (d: PortfolioDataset, contactId: string) =>
  d.expenses.filter((e) => e.providerId === contactId).sort((a, b) => b.date.localeCompare(a.date) || a.reference.localeCompare(b.reference));
export const hasProviderAccount = (d: PortfolioDataset, contactId: string) => providerExpenses(d, contactId).length > 0;
export const providerAccountContacts = (d: PortfolioDataset) => d.contacts.filter((c) => hasProviderAccount(d, c.id));

export function providerAccount(d: PortfolioDataset, contactId: string) {
  const expenses = providerExpenses(d, contactId);
  const bal = expenses.map((e) => expenseBalance(d, e));
  return {
    expenses,
    costCents: sum(bal.map((b) => b.amountCents)),
    paidCents: sum(bal.map((b) => b.paidCents)),
    pendingCents: sum(bal.map((b) => b.outstandingCents)),
  };
}
