import type { Contact, DemoDocument, Incident, MessageThread, PortfolioDataset, ThreadMessage } from "@/features/portfolio/data/types";
import { roomsOf, summarizeOccupancy } from "@/features/portfolio/selectors";
import { chargeBalance, tenantAccount } from "@/features/money/selectors";
import { currentVersion } from "@/features/docs/selectors";
import {
  PORTAL_COMPANIES, PROFILE_WITHOUT_RELATIONS, demoPortalGrants,
  type PortalGrant, type PortalProfile,
} from "./data/demo-portal-access";

// Pure derivations for the portal preview. Everything reads existing
// selectors; nothing mutates the dataset. This is a demo filter, not security.

export interface PortalContext {
  companyId: string;
  profile: PortalProfile;
  contactId: string;
}

export const ctxKey = (c: PortalContext) => `${c.companyId}|${c.profile}|${c.contactId}`;

/** Active grants for a context, honoring in-memory revocations. */
export function grantsFor(ctx: PortalContext, revoked: ReadonlySet<string> = new Set(), grants: PortalGrant[] = demoPortalGrants) {
  return grants.filter((g) => g.companyId === ctx.companyId && g.profile === ctx.profile && g.contactId === ctx.contactId && !revoked.has(g.id));
}

/** True if any grant of the context was revoked in memory. */
export const isRevoked = (ctx: PortalContext, revoked: ReadonlySet<string>) =>
  demoPortalGrants.some((g) => g.companyId === ctx.companyId && g.profile === ctx.profile && g.contactId === ctx.contactId && revoked.has(g.id));

/** Contacts selectable for a company+profile: only those with a relation (or the explicit empty-profile example). */
export function selectableContacts(d: PortfolioDataset, companyId: string, profile: PortalProfile): Contact[] {
  const company = PORTAL_COMPANIES.find((c) => c.id === companyId);
  if (!company || company.didactic) return [];
  const ids = new Set(demoPortalGrants.filter((g) => g.companyId === companyId && g.profile === profile).map((g) => g.contactId));
  for (const p of PROFILE_WITHOUT_RELATIONS) if (p.profile === profile) ids.add(p.contactId);
  return d.contacts.filter((c) => ids.has(c.id));
}

const relIds = (gs: PortalGrant[], kind: PortalGrant["relation"]["kind"]) => gs.filter((g) => g.relation.kind === kind).map((g) => g.relation.id);

// --- Owner

export function ownerView(d: PortfolioDataset, ctx: PortalContext, revoked?: ReadonlySet<string>) {
  const gs = ctx.profile === "propietario" ? grantsFor(ctx, revoked) : [];
  const propIds = relIds(gs, "inmueble");
  const properties = d.properties
    .filter((p) => propIds.includes(p.id) && p.ownerId === ctx.contactId)
    .map((p) => {
      const rooms = roomsOf(d, p.id);
      // Room code and status only: never tenant names, emails, contracts or debts.
      return { id: p.id, name: p.name, address: p.address, occupancy: summarizeOccupancy(rooms), rooms: rooms.map((r) => ({ id: r.id, code: r.code, status: r.status })) };
    });
  const allowedProps = properties.map((p) => p.id);
  const incidentIds = new Set(gs.flatMap((g) => g.incidentIds));
  const incidents = d.incidents.filter((i) => incidentIds.has(i.id) && allowedProps.includes(i.propertyId));
  return { properties, incidents, documents: visibleDocuments(d, ctx, revoked), referenceDate: d.referenceDate };
}

// --- Tenant

export function tenantView(d: PortfolioDataset, ctx: PortalContext, revoked?: ReadonlySet<string>) {
  const gs = ctx.profile === "inquilino" ? grantsFor(ctx, revoked) : [];
  const ids = relIds(gs, "contrato");
  // Only contracts where the contact is a tenant; guarantor-only links never appear.
  const contracts = d.contracts.filter((c) => ids.includes(c.id) && c.tenantIds.includes(ctx.contactId));
  const accounts = contracts.map((c) => {
    const acc = tenantAccount(d, ctx.contactId, c.id);
    return {
      contract: { id: c.id, reference: c.reference, status: c.status, roomCode: d.rooms.find((r) => r.id === c.roomId)?.code ?? "", propertyName: d.properties.find((p) => p.id === c.propertyId)?.name ?? "", startDate: c.startDate, endDate: c.endDate, rentCents: c.rentCents, dueDay: c.dueDay },
      charges: acc.charges.map((ch) => ({ id: ch.id, reference: ch.reference, concept: ch.concept, dueDate: ch.dueDate, ...chargeBalance(d, ch) })),
      payments: acc.payments.map((p) => ({ id: p.id, reference: p.reference, receivedOn: p.receivedOn, amountCents: p.amountCents })),
      pendingCents: acc.pendingCents,
    };
  });
  const incidentIds = new Set(gs.flatMap((g) => g.incidentIds));
  const incidents = d.incidents.filter((i) => incidentIds.has(i.id));
  return {
    current: accounts.filter((a) => a.contract.status === "activo" || a.contract.status === "pendiente"),
    history: accounts.filter((a) => a.contract.status === "finalizado"),
    incidents,
    documents: visibleDocuments(d, ctx, revoked),
  };
}

// --- Provider

export function providerView(d: PortfolioDataset, ctx: PortalContext, revoked?: ReadonlySet<string>) {
  const gs = ctx.profile === "proveedor" ? grantsFor(ctx, revoked) : [];
  const ids = relIds(gs, "incidencia");
  const incidents = d.incidents.filter((i) => ids.includes(i.id) && i.providerId === ctx.contactId);
  return {
    assignments: incidents.map((i) => ({
      // Minimal work data: no internal notes, no assignee, no linked expense.
      id: i.id, title: i.title, description: i.description, status: i.status, targetDate: i.targetDate,
      location: i.roomId ? d.rooms.find((r) => r.id === i.roomId)?.code ?? "" : "Zonas comunes",
      propertyName: d.properties.find((p) => p.id === i.propertyId)?.name ?? "",
      budget: i.budget ? { amountCents: i.budget.amountCents, status: i.budget.status, version: i.budget.version } : undefined,
      messages: sharedThreadMessages(d.threads.find((t) => t.context.kind === "incidencia" && t.context.id === i.id)),
    })),
    documents: visibleDocuments(d, ctx, revoked),
  };
}

export const sharedThreadMessages = (t?: MessageThread): ThreadMessage[] =>
  t ? t.messages.filter((m) => m.visibility === "compartida") : [];

// --- Documents: explicit recipient AND authorized relation with the linked record.

function authorizedRecord(d: PortfolioDataset, ctx: PortalContext, gs: PortalGrant[], doc: DemoDocument): boolean {
  const { kind, id } = doc.link;
  if (ctx.profile === "inquilino") {
    if (kind === "contrato") return relIds(gs, "contrato").includes(id);
    if (kind === "incidencia") return gs.some((g) => g.incidentIds.includes(id));
    return false;
  }
  if (ctx.profile === "proveedor") return kind === "incidencia" && relIds(gs, "incidencia").includes(id);
  // Owner
  if (kind === "inmueble") return relIds(gs, "inmueble").includes(id);
  if (kind === "incidencia") return gs.some((g) => g.incidentIds.includes(id));
  return false;
}

export function visibleDocuments(d: PortfolioDataset, ctx: PortalContext, revoked?: ReadonlySet<string>) {
  const gs = grantsFor(ctx, revoked);
  if (gs.length === 0) return [];
  return d.documents
    .filter((doc) => doc.visibility === "compartida" && doc.recipientIds.includes(ctx.contactId) && authorizedRecord(d, ctx, gs, doc))
    .map((doc) => ({ id: doc.id, title: doc.title, category: doc.category, versions: doc.versions, current: currentVersion(doc) }));
}

/** Direct lookup used by detail panels: returns null for any ID outside the context. */
export function portalDetail(d: PortfolioDataset, ctx: PortalContext, kind: "documento" | "incidencia" | "contrato", id: string, revoked?: ReadonlySet<string>) {
  if (revoked && isRevoked(ctx, revoked) && grantsFor(ctx, revoked).length === 0) return null;
  if (kind === "documento") return visibleDocuments(d, ctx, revoked).find((x) => x.id === id) ?? null;
  if (kind === "contrato") {
    const v = tenantView(d, ctx, revoked);
    return [...v.current, ...v.history].find((a) => a.contract.id === id) ?? null;
  }
  const list: Pick<Incident, "id" | "title">[] =
    ctx.profile === "propietario" ? ownerView(d, ctx, revoked).incidents
    : ctx.profile === "inquilino" ? tenantView(d, ctx, revoked).incidents
    : providerView(d, ctx, revoked).assignments;
  return list.find((x) => x.id === id) ?? null;
}

// --- Prepare access: valid relations only.

export interface RelationOption { kind: PortalGrant["relation"]["kind"]; id: string; label: string }

export function validRelations(d: PortfolioDataset, contactId: string, profile: PortalProfile): RelationOption[] {
  if (profile === "propietario")
    return d.properties.filter((p) => p.ownerId === contactId).map((p) => ({ kind: "inmueble", id: p.id, label: p.name }));
  if (profile === "inquilino")
    return d.contracts
      .filter((c) => c.tenantIds.includes(contactId) && (c.status === "activo" || c.status === "pendiente" || c.status === "finalizado"))
      .map((c) => ({ kind: "contrato", id: c.id, label: `${c.reference} · ${d.rooms.find((r) => r.id === c.roomId)?.code ?? ""}` }));
  return d.incidents.filter((i) => i.providerId === contactId).map((i) => ({ kind: "incidencia", id: i.id, label: `${i.id.toUpperCase()} · ${i.title}` }));
}

export const permissionsFor: Record<PortalProfile, string[]> = {
  propietario: ["Ver sus inmuebles y la ocupación derivada", "Ver documentos compartidos explícitamente con él", "Ver incidencias autorizadas"],
  inquilino: ["Ver sus contratos, cargos y saldo por contrato", "Ver documentos compartidos explícitamente con él", "Preparar una incidencia o mensaje (vista previa)"],
  proveedor: ["Ver sus trabajos asignados con datos mínimos", "Ver mensajes compartidos de sus trabajos", "Preparar presupuesto o evidencia (vista previa)"],
};

// --- Provider draft validation (preview only; never creates expenses).

export interface ProviderDraft { incidentId: string; kind: "presupuesto" | "evidencia" | ""; amount: string; text: string }
export type ProviderDraftErrors = Partial<Record<"incidentId" | "kind" | "amount" | "text", string>>;

export function parseEuroToCents(s: string): number | null {
  const t = s.trim().replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  return Math.round(Number(t) * 100);
}

export function validateProviderDraft(draft: ProviderDraft, allowedIncidentIds: string[]): ProviderDraftErrors {
  const e: ProviderDraftErrors = {};
  if (!allowedIncidentIds.includes(draft.incidentId)) e.incidentId = "Elige uno de tus trabajos asignados.";
  if (!draft.kind) e.kind = "Elige qué quieres preparar.";
  if (draft.kind === "presupuesto") {
    const c = parseEuroToCents(draft.amount);
    if (c === null || c <= 0) e.amount = "Indica un importe mayor que 0 con hasta dos decimales.";
  }
  if (draft.text.trim().length < 10) e.text = "Describe el contenido con al menos 10 caracteres.";
  return e;
}

export interface TenantDraft { kind: "incidencia" | "mensaje" | ""; text: string }
export function validateTenantDraft(d: TenantDraft) {
  const e: Partial<Record<"kind" | "text", string>> = {};
  if (!d.kind) e.kind = "Elige qué quieres preparar.";
  if (d.text.trim().length < 10) e.text = "Escribe al menos 10 caracteres.";
  return e;
}
