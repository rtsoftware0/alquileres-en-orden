import type { Expense, ExpensePayment, ExpenseShare } from "@/features/portfolio/data/types";

// Fictitious expense records. A separate synthetic ledger: expenses and
// provider payments are never netted against tenant debt, never rent and
// never deposits. Balances always derive from these records.

export const EXPENSE_CATEGORIES = ["Reparación y mantenimiento", "Limpieza", "Suministros"] as const;

export const demoExpenses: Expense[] = [
  {
    id: "gs-ej-001", reference: "GS-EJ-001",
    concept: "Reparación de persiana en OLI-01",
    providerId: "con-012", propertyId: "casa-olivo",
    category: "Reparación y mantenimiento",
    period: "2026-10", date: "2026-10-19", dueDate: "2026-10-30",
    amountCents: 12000, bearer: "operador",
    note: "Sin pagar. Vinculado a la incidencia de la persiana (ejemplo).",
  },
  {
    id: "gs-ej-002", reference: "GS-EJ-002",
    concept: "Limpieza de zonas comunes de octubre",
    providerId: "con-015", propertyId: "casa-azahar",
    category: "Limpieza",
    period: "2026-10", date: "2026-10-20", dueDate: "2026-11-05",
    amountCents: 10000, bearer: "inquilino",
    note: "Reparto de coste simulado entre 3 habitaciones. No genera ningún cargo a inquilinos ni afirma que sea repercutible.",
  },
  {
    id: "gs-ej-003", reference: "GS-EJ-003",
    concept: "Revisión de caldera y ajuste de suministros",
    providerId: "con-012", propertyId: "casa-olivo",
    category: "Suministros",
    period: "2026-10", date: "2026-10-10", dueDate: "2026-10-20",
    amountCents: 24000, bearer: "operador",
    note: "Con un pago previo de ejemplo de 90,00 €.",
  },
  {
    id: "gs-ej-004", reference: "GS-EJ-004",
    concept: "Limpieza de zonas comunes de septiembre",
    providerId: "con-015", propertyId: "casa-azahar",
    category: "Limpieza",
    period: "2026-09", date: "2026-09-30", dueDate: "2026-10-10",
    amountCents: 8000, bearer: "propietario",
    note: "Pagado por completo (ejemplo).",
  },
];

export const demoExpensePayments: ExpensePayment[] = [
  {
    id: "pg-ej-001", reference: "PG-EJ-001", expenseId: "gs-ej-003",
    date: "2026-10-12", amountCents: 9000,
    note: "Pago parcial de ejemplo al proveedor.",
  },
  {
    id: "pg-ej-002", reference: "PG-EJ-002", expenseId: "gs-ej-004",
    date: "2026-10-08", amountCents: 8000,
    note: "Pago completo de ejemplo al proveedor.",
  },
];

// Simulated cost assignment of GS-EJ-002 (100,00 €) across 3 rooms:
// 33,34 + 33,33 + 33,33; the extra cent goes to the first room code in
// stable order. It is NOT a tenant charge.
export const demoExpenseShares: ExpenseShare[] = [
  { id: "rp-01", expenseId: "gs-ej-002", roomId: "aza-01", amountCents: 3334 },
  { id: "rp-02", expenseId: "gs-ej-002", roomId: "aza-02", amountCents: 3333 },
  { id: "rp-03", expenseId: "gs-ej-002", roomId: "aza-03", amountCents: 3333 },
];
