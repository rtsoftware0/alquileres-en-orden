import type { PortfolioDataset } from "@/features/portfolio/data/types";
import { getContact } from "@/features/contacts/selectors";
import { isValidIsoDate } from "@/features/contracts/draft";
import { INCIDENT_PRIORITIES } from "./selectors";
import { INCIDENT_CATEGORIES } from "./data/demo-incidents";

// Pure validation for the demo incident wizard. Nothing here saves anything.

export interface IncidentDraftValues {
  propertyId: string;
  roomId: string; // optional: empty means common areas
  category: string;
  title: string;
  description: string;
  priority: string;
  contactId: string; // optional related contact
  openedOn: string; // ISO
  assigneeName: string;
  targetDate: string; // ISO
  providerId: string; // optional
}

export const emptyIncidentDraft: IncidentDraftValues = {
  propertyId: "", roomId: "", category: "", title: "", description: "",
  priority: "", contactId: "", openedOn: "", assigneeName: "", targetDate: "", providerId: "",
};

export type IncidentDraftErrors = Partial<Record<"propertyId" | "roomId" | "category" | "title" | "description" | "priority" | "contactId" | "openedOn" | "assigneeName" | "targetDate" | "providerId", string>>;

export function validateIncidentPlace(v: IncidentDraftValues, d: PortfolioDataset): IncidentDraftErrors {
  const e: IncidentDraftErrors = {};
  if (!d.properties.some((p) => p.id === v.propertyId)) e.propertyId = "Elige un inmueble.";
  if (v.roomId) {
    const room = d.rooms.find((r) => r.id === v.roomId);
    if (!room) e.roomId = "Unidad desconocida.";
    else if (room.propertyId !== v.propertyId) e.roomId = "Esa unidad no pertenece al inmueble elegido.";
  }
  if (!(INCIDENT_CATEGORIES as readonly string[]).includes(v.category)) e.category = "Elige una categoría.";
  if (!v.title.trim()) e.title = "Indica un título.";
  else if (v.title.trim().length < 4) e.title = "Describe el título con un poco más de detalle.";
  if (!v.description.trim()) e.description = "Indica una descripción.";
  if (!INCIDENT_PRIORITIES.includes(v.priority as never)) e.priority = "Elige una prioridad.";
  if (v.contactId && !getContact(d, v.contactId)) e.contactId = "Contacto desconocido.";
  if (!v.openedOn) e.openedOn = "Indica la fecha de registro.";
  else if (!isValidIsoDate(v.openedOn)) e.openedOn = "Fecha no válida.";
  return e;
}

export function validateIncidentFollowUp(v: IncidentDraftValues, d: PortfolioDataset): IncidentDraftErrors {
  const e: IncidentDraftErrors = {};
  if (!v.assigneeName.trim()) e.assigneeName = "Indica el responsable interno.";
  if (!v.targetDate) e.targetDate = "Indica la fecha objetivo.";
  else if (!isValidIsoDate(v.targetDate)) e.targetDate = "Fecha no válida.";
  if (v.providerId) {
    const p = getContact(d, v.providerId);
    if (!p || !p.roles.includes("proveedor")) e.providerId = "El proveedor debe tener el rol de proveedor.";
  }
  return e;
}
