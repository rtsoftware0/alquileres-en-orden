import type { PortfolioDataset } from "@/features/portfolio/data/types";
import { getContact } from "@/features/contacts/selectors";

// Pure validation for the demo draft wizard. Nothing here saves anything.

export interface DraftValues {
  roomId: string;
  landlordId: string;
  tenantId: string;
  guarantorId: string; // optional
  startDate: string; // check-in (included)
  endDate: string; // check-out (excluded)
  rent: string; // EUR as typed, e.g. "350" or "350,50"
  deposit: string;
  dueDay: string;
  modality: string;
}

export const emptyDraft: DraftValues = {
  roomId: "", landlordId: "", tenantId: "", guarantorId: "",
  startDate: "", endDate: "", rent: "", deposit: "", dueDay: "", modality: "",
};

export type DraftErrors = Partial<Record<keyof DraftValues, string>>;

export const MODALITIES = ["Larga estancia por habitación", "Temporada por estudios", "Temporada por trabajo"];

/** "1.250,50" / "350" / "350.5" -> cents; null if not a valid amount. */
export function parseEuroToCents(input: string): number | null {
  const s = input.trim().replace(/\s|€/g, "");
  if (!s) return null;
  // Accept thousands dots with decimal comma, or plain digits with , or . decimals.
  const m = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:[,.](\d{1,2}))?$/.exec(s);
  if (!m) return null;
  const euros = Number(m[1]!.replace(/\./g, ""));
  const dec = (m[2] ?? "").padEnd(2, "0");
  const cents = euros * 100 + Number(dec || "0");
  return Number.isSafeInteger(cents) ? cents : null;
}

export function isValidIsoDate(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const t = new Date(Date.UTC(y!, m! - 1, d!));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m! - 1 && t.getUTCDate() === d;
}

export function validateParties(v: DraftValues, data: PortfolioDataset): DraftErrors {
  const e: DraftErrors = {};
  if (!data.rooms.some((r) => r.id === v.roomId)) e.roomId = "Elige una habitación.";
  const landlord = getContact(data, v.landlordId);
  if (!landlord || !landlord.roles.some((r) => r === "propietario" || r === "arrendador"))
    e.landlordId = "Elige la parte arrendadora (propietario o arrendador).";
  const tenant = getContact(data, v.tenantId);
  if (!tenant || !tenant.roles.some((r) => r === "inquilino" || r === "candidato"))
    e.tenantId = "Elige un inquilino o candidato.";
  if (v.guarantorId) {
    const g = getContact(data, v.guarantorId);
    if (!g || !g.roles.includes("avalista")) e.guarantorId = "El avalista debe tener el rol de avalista.";
    else if (v.guarantorId === v.tenantId) e.guarantorId = "El avalista no puede ser el mismo inquilino.";
  }
  if (v.landlordId && v.landlordId === v.tenantId) e.tenantId = "El inquilino no puede ser la parte arrendadora.";
  return e;
}

export function validateTerms(v: DraftValues): DraftErrors {
  const e: DraftErrors = {};
  if (!v.startDate) e.startDate = "Indica la fecha de entrada.";
  else if (!isValidIsoDate(v.startDate)) e.startDate = "Fecha no válida.";
  if (!v.endDate) e.endDate = "Indica la fecha de salida.";
  else if (!isValidIsoDate(v.endDate)) e.endDate = "Fecha no válida.";
  else if (!e.startDate && v.endDate <= v.startDate) e.endDate = "La salida debe ser posterior a la entrada.";

  const rent = parseEuroToCents(v.rent);
  if (!v.rent.trim()) e.rent = "Indica la renta mensual.";
  else if (rent === null) e.rent = "Importe no válido. Ejemplo: 350 o 350,50.";
  else if (rent <= 0) e.rent = "La renta debe ser mayor que 0 €.";

  const deposit = parseEuroToCents(v.deposit);
  if (!v.deposit.trim()) e.deposit = "Indica la fianza (0 si no hay).";
  else if (deposit === null) e.deposit = "Importe no válido. Ejemplo: 350 o 0.";

  if (!v.dueDay.trim()) e.dueDay = "Indica el día de vencimiento.";
  else if (!/^\d+$/.test(v.dueDay.trim()) || Number(v.dueDay) < 1 || Number(v.dueDay) > 28)
    e.dueDay = "Debe ser un número entero del 1 al 28.";

  if (!v.modality) e.modality = "Elige una modalidad.";
  return e;
}
