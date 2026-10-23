import type { DocLinkKind, DocVisibility, PortfolioDataset } from "@/features/portfolio/data/types";
import { docLinkKindLabel, docRecipients } from "./selectors";
import { DOC_CATEGORIES } from "./data/demo-docs";

// "Preparar documento de ejemplo" draft. Memory only: nothing is saved,
// uploaded or shared, and no new rows ever appear in the library.

export interface DocDraftValues {
  exampleId: string; // embedded content template
  name: string;
  category: string;
  linkKind: DocLinkKind | "";
  linkId: string;
  visibility: DocVisibility | "";
  recipientIds: string[];
}

export type DocDraftErrors = Partial<Record<"exampleId" | "name" | "category" | "linkKind" | "linkId" | "visibility" | "recipients", string>>;

/** Embedded example contents to choose from; short synthetic texts. */
export const DOC_EXAMPLES = [
  { id: "ej-inventario", label: "Inventario de entrada (ejemplo)", content: "Contenido de ejemplo. Lista ficticia de mobiliario del día de entrada. No es un inventario real." },
  { id: "ej-informe", label: "Informe de revisión (ejemplo)", content: "Contenido de ejemplo. Informe ficticio de una revisión. No es un informe real ni una prueba." },
  { id: "ej-anexo", label: "Anexo de condiciones (ejemplo)", content: "Contenido de ejemplo. Anexo ficticio de condiciones. No es un documento jurídico válido." },
] as const;

export const emptyDocDraft: DocDraftValues = {
  exampleId: "", name: "", category: "", linkKind: "", linkId: "", visibility: "", recipientIds: [],
};

export function docLinkOptions(d: PortfolioDataset, kind: DocLinkKind): { id: string; label: string }[] {
  switch (kind) {
    case "contrato": return d.contracts.map((c) => ({ id: c.id, label: c.reference }));
    case "incidencia": return d.incidents.map((i) => ({ id: i.id, label: i.title }));
    case "gasto": return d.expenses.map((e) => ({ id: e.id, label: `${e.reference} · ${e.concept}` }));
    case "inmueble": return d.properties.map((p) => ({ id: p.id, label: p.name }));
  }
}

/** Property derived from the linked record, never chosen by hand. */
export function docDraftProperty(d: PortfolioDataset, linkKind: DocLinkKind | "", linkId: string): string | undefined {
  if (!linkKind || !linkId) return undefined;
  switch (linkKind) {
    case "contrato": return d.contracts.find((c) => c.id === linkId)?.propertyId;
    case "incidencia": return d.incidents.find((i) => i.id === linkId)?.propertyId;
    case "gasto": return d.expenses.find((e) => e.id === linkId)?.propertyId;
    case "inmueble": return d.properties.some((p) => p.id === linkId) ? linkId : undefined;
  }
}

export function validateDocDraftData(v: DocDraftValues): DocDraftErrors {
  const e: DocDraftErrors = {};
  if (!v.exampleId) e.exampleId = "Elige un contenido de ejemplo.";
  if (!v.name.trim()) e.name = "Indica un nombre.";
  if (!v.category) e.category = "Elige una categoría.";
  else if (!(DOC_CATEGORIES as readonly string[]).includes(v.category)) e.category = "Categoría no válida.";
  if (!v.linkKind) e.linkKind = "Elige el tipo de registro relacionado.";
  if (!v.linkId) e.linkId = "Elige el registro relacionado.";
  return e;
}

export function validateDocDraftVisibility(d: PortfolioDataset, v: DocDraftValues): DocDraftErrors {
  const e: DocDraftErrors = {};
  if (!v.visibility) { e.visibility = "Elige una visibilidad de ejemplo."; return e; }
  if (v.visibility === "interna") {
    if (v.recipientIds.length) e.recipients = "Un documento interno no tiene destinatarios externos.";
    return e;
  }
  // compartida: recipients required and each must be compatible with the link
  const allowed = v.linkKind && v.linkId ? docRecipients(d, { kind: v.linkKind, id: v.linkId }).map((c) => c.id) : [];
  if (!v.recipientIds.length) { e.recipients = "Elige al menos un destinatario de ejemplo."; return e; }
  if (v.recipientIds.some((id) => !allowed.includes(id))) {
    e.recipients = `Hay destinatarios no relacionados con este ${v.linkKind ? docLinkKindLabel[v.linkKind].toLowerCase() : "registro"}.`;
  }
  return e;
}
