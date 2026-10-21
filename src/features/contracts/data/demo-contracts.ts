import type { Contract } from "@/features/portfolio/data/types";

// Fictitious contracts. endDate is the check-out day (excluded).
// Only "activo" contracts relate to current occupancy; the rest are context.

const longStay = "Larga estancia por habitación";
const outside = "Firmado fuera del sistema (estado de ejemplo, sin archivo)";

type Base = Omit<Contract, "id" | "reference" | "history" | "signature"> & { ref: string; signature?: string; history?: Contract["history"] };

const make = ({ ref, signature, history, ...c }: Base): Contract => ({
  id: ref.toLowerCase(),
  reference: ref,
  signature: signature ?? outside,
  history: history ?? [
    { date: c.startDate, text: "Entrada del inquilino (ejemplo)." },
  ],
  ...c,
});

const olivo = { propertyId: "casa-olivo", landlordId: "con-009" };
const azahar = { propertyId: "casa-azahar", landlordId: "con-011" };

export const demoContracts: Contract[] = [
  make({ ref: "CT-EJ-0101", status: "activo", ...olivo, roomId: "oli-01", tenantIds: ["con-001"], guarantorIds: [], startDate: "2026-02-01", endDate: "2027-02-01", rentCents: 42000, depositCents: 42000, dueDay: 5, modality: longStay }),
  make({
    ref: "CT-EJ-0102", status: "activo", ...olivo, roomId: "oli-02", tenantIds: ["con-002"], guarantorIds: [], startDate: "2026-09-01", endDate: "2027-07-01", rentCents: 35000, depositCents: 35000, dueDay: 5, modality: "Temporada por estudios",
    history: [
      { date: "2026-08-20", text: "Borrador preparado (ejemplo)." },
      { date: "2026-08-28", text: "Formalizado fuera del sistema (ejemplo)." },
      { date: "2026-09-01", text: "Entrada del inquilino (ejemplo)." },
    ],
  }),
  make({ ref: "CT-EJ-0103", status: "activo", ...olivo, roomId: "oli-03", tenantIds: ["con-003"], guarantorIds: [], startDate: "2026-01-15", endDate: "2027-01-01", rentCents: 45000, depositCents: 90000, dueDay: 1, modality: longStay }),
  make({ ref: "CT-EJ-0104", status: "activo", ...olivo, roomId: "oli-04", tenantIds: ["con-004"], guarantorIds: [], startDate: "2026-07-01", endDate: "2027-07-01", rentCents: 38000, depositCents: 38000, dueDay: 5, modality: longStay }),
  make({
    ref: "CT-EJ-0105", status: "borrador", ...olivo, roomId: "oli-05", tenantIds: ["con-014"], guarantorIds: [], startDate: "2026-11-15", endDate: "2027-06-01", rentCents: 41000, depositCents: 41000, dueDay: 5, modality: longStay,
    signature: "Sin firmar (borrador de ejemplo)",
    history: [{ date: "2026-10-19", text: "Borrador preparado (ejemplo). No reserva la habitación." }],
  }),
  make({
    ref: "CT-EJ-0106", status: "pendiente", ...olivo, roomId: "oli-06", tenantIds: ["con-013"], guarantorIds: [], startDate: "2026-11-01", endDate: "2027-07-01", rentCents: 43000, depositCents: 43000, dueDay: 5, modality: longStay,
    signature: "Pendiente de firma fuera del sistema (ejemplo)",
    history: [
      { date: "2026-10-10", text: "Borrador preparado (ejemplo)." },
      { date: "2026-10-15", text: "Habitación reservada en espera de formalización (ejemplo)." },
    ],
  }),
  make({ ref: "CT-EJ-0201", status: "activo", ...azahar, roomId: "aza-01", tenantIds: ["con-005"], guarantorIds: [], startDate: "2026-03-01", endDate: "2027-03-01", rentCents: 39000, depositCents: 39000, dueDay: 10, modality: longStay }),
  make({ ref: "CT-EJ-0202", status: "activo", ...azahar, roomId: "aza-02", tenantIds: ["con-006"], guarantorIds: [], startDate: "2026-09-15", endDate: "2027-08-01", rentCents: 41000, depositCents: 41000, dueDay: 5, modality: "Temporada por estudios" }),
  make({ ref: "CT-EJ-0203", status: "activo", ...azahar, roomId: "aza-03", tenantIds: ["con-007"], guarantorIds: [], startDate: "2026-05-01", endDate: "2027-05-01", rentCents: 45000, depositCents: 45000, dueDay: 5, modality: longStay }),
  make({
    ref: "CT-EJ-0204", status: "activo", ...azahar, roomId: "aza-04", tenantIds: ["con-008"], guarantorIds: ["con-003"], startDate: "2025-11-01", endDate: "2026-11-01", rentCents: 40000, depositCents: 40000, dueDay: 5, modality: longStay,
    history: [
      { date: "2025-10-25", text: "Renovación formalizada fuera del sistema (ejemplo)." },
      { date: "2025-11-01", text: "Inicio del periodo renovado (ejemplo)." },
    ],
  }),
  make({
    ref: "CT-EJ-0098", status: "finalizado", ...azahar, roomId: "aza-04", tenantIds: ["con-008"], guarantorIds: [], startDate: "2024-11-01", endDate: "2025-11-01", rentCents: 38500, depositCents: 38500, dueDay: 5, modality: longStay,
    history: [
      { date: "2024-11-01", text: "Entrada del inquilino (ejemplo)." },
      { date: "2025-10-31", text: "Último día del periodo; renovado con CT-EJ-0204 (ejemplo)." },
    ],
  }),
  make({
    ref: "CT-EJ-0205", status: "cancelado", ...azahar, roomId: "aza-05", tenantIds: ["con-014"], guarantorIds: [], startDate: "2026-10-01", endDate: "2027-06-01", rentCents: 42000, depositCents: 42000, dueDay: 5, modality: longStay,
    signature: "No llegó a firmarse (ejemplo)",
    history: [
      { date: "2026-09-05", text: "Borrador preparado (ejemplo)." },
      { date: "2026-09-20", text: "Cancelado antes de la entrada (ejemplo). Sin efecto en ocupación ni saldos." },
    ],
  }),
];
