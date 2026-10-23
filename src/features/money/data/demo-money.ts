import type { Allocation, Charge, DepositMovement, Payment } from "@/features/portfolio/data/types";
import { demoContracts } from "@/features/contracts/data/demo-contracts";

// Fictitious money records. They only explain the demo balances; nothing
// here is generated from contract status and nothing is ever written back.

const ct = (num: string) => {
  const c = demoContracts.find((x) => x.reference === `CT-EJ-${num}`);
  if (!c) throw new Error(`Unknown demo contract ${num}`);
  return c;
};

const monthName: Record<string, string> = { "2026-09": "septiembre 2026", "2026-10": "octubre 2026" };

function charge(num: string, period: "2026-09" | "2026-10", voidReason?: string): Charge {
  const c = ct(num);
  const mm = period.slice(5);
  return {
    id: `vc-${num}-${mm}`,
    reference: `VC-${num}-${mm}`,
    contractId: c.id,
    payerId: c.tenantIds[0]!,
    concept: `Renta de ${monthName[period]}`,
    period,
    dueDate: `${period}-${String(c.dueDay).padStart(2, "0")}`,
    amountCents: c.rentCents,
    ...(voidReason ? { voidReason } : {}),
  };
}

export const demoCharges: Charge[] = [
  ...["0101", "0102", "0103", "0104", "0201", "0203", "0204"].map((n) => charge(n, "2026-09")),
  charge("0202", "2026-09", "Emitido por error: la entrada fue el 15/09/2026 (ejemplo). No se debe."),
  ...["0101", "0102", "0103", "0104", "0201", "0202", "0203", "0204"].map((n) => charge(n, "2026-10")),
];

// Each seed is one fictitious payment applied to one charge.
const seeds: { charge: string; amountCents?: number; note?: string }[] = [
  { charge: "vc-0101-09" },
  { charge: "vc-0102-09" },
  { charge: "vc-0103-09", amountCents: 30000, note: "Pago parcial de septiembre (ejemplo)." },
  { charge: "vc-0104-09" },
  { charge: "vc-0201-09" },
  { charge: "vc-0203-09" },
  { charge: "vc-0204-09" },
  { charge: "vc-0101-10" },
  { charge: "vc-0104-10" },
  { charge: "vc-0201-10", amountCents: 42000, note: "Importe superior al cargo; 30,00 € quedan sin asignar (ejemplo)." },
  { charge: "vc-0202-10" },
  { charge: "vc-0204-10" },
];

export const demoPayments: Payment[] = [];
export const demoAllocations: Allocation[] = [];

seeds.forEach((s, i) => {
  const ch = demoCharges.find((c) => c.id === s.charge)!;
  const n = String(i + 1).padStart(3, "0");
  const amountCents = s.amountCents ?? ch.amountCents;
  demoPayments.push({
    id: `cb-${n}`,
    reference: `CB-EJ-${n}`,
    payerId: ch.payerId,
    contractId: ch.contractId,
    receivedOn: ch.dueDate,
    amountCents,
    note: s.note ?? "Cobro de ejemplo.",
  });
  demoAllocations.push({ id: `as-${n}`, paymentId: `cb-${n}`, chargeId: ch.id, amountCents: Math.min(amountCents, ch.amountCents) });
});

const rx = (id: string, num: string, date: string, amountCents: number, note = "Recepción de fianza (ejemplo).") => {
  const c = ct(num);
  return { id, contractId: c.id, partyId: c.tenantIds[0]!, kind: "recepcion" as const, date, amountCents, note };
};

export const demoDepositMovements: DepositMovement[] = [
  rx("fz-01", "0101", "2026-01-28", 42000),
  rx("fz-02", "0102", "2026-08-28", 35000),
  rx("fz-03", "0103", "2026-01-10", 90000),
  rx("fz-04", "0104", "2026-06-28", 38000),
  rx("fz-05", "0201", "2026-02-25", 39000),
  rx("fz-06", "0202", "2026-09-15", 20000, "Primera parte de la fianza (ejemplo). Falta el resto."),
  rx("fz-07", "0203", "2026-04-28", 45000),
  rx("fz-08", "0204", "2025-10-25", 40000),
  rx("fz-09", "0098", "2024-10-28", 38500),
  {
    id: "fz-10", contractId: ct("0098").id, partyId: ct("0098").tenantIds[0]!, kind: "devolucion", date: "2025-11-15", amountCents: 38500,
    note: "Devolución ficticia al terminar el periodo anterior (ejemplo).",
  },
];
