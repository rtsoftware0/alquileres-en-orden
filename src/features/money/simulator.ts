import type { PortfolioDataset } from "@/features/portfolio/data/types";
import { chargeBalance, getCharge, pendingCents } from "./selectors";

// Pure what-if calculation. It never mutates the dataset and records nothing.

export const MAX_SIMULATED_CENTS = 10_000_000; // 100.000,00 €

export type AmountResult = { cents: number; error?: undefined } | { cents?: undefined; error: string };

/** Positive EUR amount with at most 2 decimals, parsed to exact integer cents. */
export function parseSimulatedAmount(input: string): AmountResult {
  const s = input.trim().replace(/\s|€/g, "");
  if (!s) return { error: "Indica el importe recibido simulado." };
  if (s.startsWith("-")) return { error: "El importe no puede ser negativo." };
  const m = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:[,.](\d+))?$/.exec(s);
  if (!m) return { error: "Importe no válido. Usa solo números, por ejemplo 200 o 200,50." };
  if ((m[2] ?? "").length > 2) return { error: "Usa como máximo 2 decimales." };
  const euros = Number(m[1]!.replace(/\./g, ""));
  const cents = euros * 100 + Number((m[2] ?? "").padEnd(2, "0") || "0");
  if (!Number.isSafeInteger(cents)) return { error: "Importe no válido." };
  if (cents === 0) return { error: "El importe debe ser mayor que 0 €." };
  if (cents > MAX_SIMULATED_CENTS) return { error: "Importe demasiado alto para la simulación (máximo 100.000,00 €)." };
  return { cents };
}

/** Charges the payer still owes (pending or partial), optionally for one contract. */
export const eligibleCharges = (d: PortfolioDataset, payerId: string, contractId?: string) =>
  d.charges
    .filter((c) => c.payerId === payerId && (!contractId || c.contractId === contractId))
    .filter((c) => chargeBalance(d, c).outstandingCents > 0)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

export type SimulationResult =
  | {
      ok: true;
      chargeId: string;
      receivedCents: number;
      outstandingBeforeCents: number;
      allocatedCents: number;
      outstandingAfterCents: number;
      unallocatedCents: number;
      portfolioPendingCents: number; // real, unchanged
      portfolioPendingIfRealCents: number; // hypothetical
    }
  | { ok: false; error: string };

export function simulateCollection(d: PortfolioDataset, input: { payerId: string; chargeId: string; receivedCents: number }): SimulationResult {
  const charge = getCharge(d, input.chargeId);
  if (!charge) return { ok: false, error: "Elige un vencimiento." };
  if (charge.payerId !== input.payerId) return { ok: false, error: "Ese vencimiento no pertenece a este inquilino." };
  const b = chargeBalance(d, charge);
  if (b.status === "satisfecho" || b.status === "anulado") return { ok: false, error: "Ese vencimiento no tiene importe pendiente." };
  if (!Number.isSafeInteger(input.receivedCents) || input.receivedCents <= 0 || input.receivedCents > MAX_SIMULATED_CENTS)
    return { ok: false, error: "Importe no válido." };
  const allocatedCents = Math.min(input.receivedCents, b.outstandingCents);
  const portfolio = pendingCents(d);
  return {
    ok: true,
    chargeId: charge.id,
    receivedCents: input.receivedCents,
    outstandingBeforeCents: b.outstandingCents,
    allocatedCents,
    outstandingAfterCents: b.outstandingCents - allocatedCents,
    unallocatedCents: input.receivedCents - allocatedCents,
    portfolioPendingCents: portfolio,
    portfolioPendingIfRealCents: portfolio - allocatedCents,
  };
}
