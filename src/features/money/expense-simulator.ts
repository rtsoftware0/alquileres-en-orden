import type { PortfolioDataset } from "@/features/portfolio/data/types";
import { expenseBalance, getExpense } from "./expenses";

// Pure what-if calculation for a provider payment. It never mutates the
// dataset and records nothing. Overpayment is rejected in this demo.

export type PaymentSimulation =
  | {
      ok: true;
      expenseId: string;
      paidSimulatedCents: number;
      costCents: number;
      paidBeforeCents: number;
      outstandingBeforeCents: number;
      paidAfterCents: number;
      outstandingAfterCents: number;
      totalCostCents: number; // real, unchanged
      totalPaidCents: number; // real, unchanged
      totalPendingCents: number; // real, unchanged
    }
  | { ok: false; error: string };

export function simulateProviderPayment(
  d: PortfolioDataset,
  input: { providerId: string; expenseId: string; paidCents: number },
): PaymentSimulation {
  const expense = getExpense(d, input.expenseId);
  if (!expense) return { ok: false, error: "Elige un gasto." };
  if (expense.providerId !== input.providerId) return { ok: false, error: "Ese gasto no pertenece a este proveedor." };
  const b = expenseBalance(d, expense);
  if (b.status === "pagado") return { ok: false, error: "Ese gasto ya está pagado por completo." };
  if (!Number.isSafeInteger(input.paidCents) || input.paidCents <= 0) return { ok: false, error: "Importe no válido." };
  if (input.paidCents > b.outstandingCents)
    return { ok: false, error: `El importe no puede superar el saldo pendiente de este gasto. En esta demostración no se crean anticipos.` };
  const totals = d.expenses.map((e) => expenseBalance(d, e));
  return {
    ok: true,
    expenseId: expense.id,
    paidSimulatedCents: input.paidCents,
    costCents: b.amountCents,
    paidBeforeCents: b.paidCents,
    outstandingBeforeCents: b.outstandingCents,
    paidAfterCents: b.paidCents + input.paidCents,
    outstandingAfterCents: b.outstandingCents - input.paidCents,
    totalCostCents: totals.reduce((s, t) => s + t.amountCents, 0),
    totalPaidCents: totals.reduce((s, t) => s + t.paidCents, 0),
    totalPendingCents: totals.reduce((s, t) => s + t.outstandingCents, 0),
  };
}
