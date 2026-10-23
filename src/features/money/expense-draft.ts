import type { PortfolioDataset } from "@/features/portfolio/data/types";
import { getContact } from "@/features/contacts/selectors";
import { isValidIsoDate, parseEuroToCents } from "@/features/contracts/draft";

// Pure validation and split math for the demo expense wizard.
// Nothing here saves anything or creates tenant charges.

export interface ExpenseDraftValues {
  concept: string;
  providerId: string;
  category: string;
  propertyId: string;
  date: string; // expense date, ISO
  period: string; // yyyy-mm
  dueDate: string; // ISO
  amount: string; // EUR as typed
  bearer: string; // "operador" | "propietario" | "inquilino"
  splitMode: string; // "sin_reparto" | "igualitario" | "manual"
  roomIds: string[]; // rooms of the chosen property
  manualAmounts: Record<string, string>; // roomId -> EUR as typed
}

export const emptyExpenseDraft: ExpenseDraftValues = {
  concept: "", providerId: "", category: "", propertyId: "",
  date: "", period: "", dueDate: "", amount: "",
  bearer: "", splitMode: "sin_reparto", roomIds: [], manualAmounts: {},
};

export type ExpenseDraftErrors = Partial<Record<"concept" | "providerId" | "category" | "propertyId" | "date" | "period" | "dueDate" | "amount" | "bearer" | "split", string>>;

export function validateExpenseData(v: ExpenseDraftValues, d: PortfolioDataset): ExpenseDraftErrors {
  const e: ExpenseDraftErrors = {};
  if (!v.concept.trim()) e.concept = "Indica el concepto del gasto.";
  else if (v.concept.trim().length < 4) e.concept = "Describe el concepto con un poco más de detalle.";
  const provider = getContact(d, v.providerId);
  if (!provider || !provider.roles.includes("proveedor")) e.providerId = "Elige un proveedor.";
  if (!v.category) e.category = "Elige una categoría.";
  if (!d.properties.some((p) => p.id === v.propertyId)) e.propertyId = "Elige un inmueble.";
  if (!v.date) e.date = "Indica la fecha del gasto.";
  else if (!isValidIsoDate(v.date)) e.date = "Fecha no válida.";
  if (!v.period) e.period = "Indica el periodo (mes del gasto).";
  else if (!/^\d{4}-\d{2}$/.test(v.period)) e.period = "Periodo no válido.";
  if (!v.dueDate) e.dueDate = "Indica la fecha de vencimiento del pago.";
  else if (!isValidIsoDate(v.dueDate)) e.dueDate = "Fecha no válida.";
  const amount = parseEuroToCents(v.amount);
  if (!v.amount.trim()) e.amount = "Indica el importe del gasto.";
  else if (amount === null) e.amount = "Importe no válido. Ejemplo: 120 o 120,50.";
  else if (amount <= 0) e.amount = "El importe debe ser mayor que 0 €.";
  return e;
}

export function validateExpenseSplit(v: ExpenseDraftValues, d: PortfolioDataset): ExpenseDraftErrors {
  const e: ExpenseDraftErrors = {};
  if (v.bearer !== "operador" && v.bearer !== "propietario" && v.bearer !== "inquilino")
    e.bearer = "Elige quién soporta el coste. No se decide automáticamente.";
  const amount = parseEuroToCents(v.amount);
  if (v.splitMode === "sin_reparto") {
    if (v.bearer === "inquilino") e.split = "Si el coste recae sobre inquilinos, elige un reparto (igualitario o manual).";
    return e;
  }
  if (v.splitMode !== "igualitario" && v.splitMode !== "manual") { e.split = "Elige un tipo de reparto."; return e; }
  const rooms = d.rooms.filter((r) => r.propertyId === v.propertyId);
  const chosen = v.roomIds.filter((id) => rooms.some((r) => r.id === id));
  if (chosen.length === 0) { e.split = "Elige al menos una unidad del inmueble para repartir."; return e; }
  if (amount === null || amount <= 0) { e.split = "Corrige primero el importe del gasto en el paso anterior."; return e; }
  if (v.splitMode === "manual") {
    let total = 0;
    for (const id of chosen) {
      const c = parseEuroToCents(v.manualAmounts[id] ?? "");
      if (c === null || c < 0) { e.split = "Los importes manuales deben ser válidos y no negativos, con 2 decimales como máximo."; return e; }
      total += c;
    }
    if (total !== amount)
      e.split = `El reparto manual debe sumar exactamente el importe del gasto.`;
  }
  return e;
}

/** Equal split in exact cents; leftover cents go to the first room codes in stable order. */
export function splitEqual(amountCents: number, roomIds: string[]): { roomId: string; amountCents: number }[] {
  const ids = [...roomIds].sort();
  const base = Math.floor(amountCents / ids.length);
  const extra = amountCents - base * ids.length;
  return ids.map((roomId, i) => ({ roomId, amountCents: base + (i < extra ? 1 : 0) }));
}

/** Manual split parsed to cents; null if any value is invalid or the sum differs. */
export function splitManual(amountCents: number, roomIds: string[], manual: Record<string, string>): { roomId: string; amountCents: number }[] | null {
  const ids = [...roomIds].sort();
  const out: { roomId: string; amountCents: number }[] = [];
  let total = 0;
  for (const roomId of ids) {
    const c = parseEuroToCents(manual[roomId] ?? "");
    if (c === null || c < 0) return null;
    total += c;
    out.push({ roomId, amountCents: c });
  }
  return total === amountCents ? out : null;
}
