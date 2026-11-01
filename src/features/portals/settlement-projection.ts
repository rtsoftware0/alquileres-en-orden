import type { PortfolioDataset } from "@/features/portfolio/data/types";
import type { Context, Settlement, State as SettlementState, Version } from "@/features/settlements/types";
import { contexts as settlementContexts } from "@/features/settlements/data/examples";
import { PORTAL_COMPANIES, demoPortalGrants, type PortalGrant } from "./data/demo-portal-access";
import type { SettlementShare, SharingState } from "./data/demo-portal-sharing";

// Pure sharing engine + minimal external projection of approved settlement
// versions for the owner portal preview. Never mutates sources; demo only.

export interface ShareTarget { companyId: string; contactId: string; settlementId: string; version: number }
export interface ShareDeps { data: PortfolioDataset; settlements: SettlementState; contexts?: Context[]; grants?: PortalGrant[] }
export type ShareResult = { ok: true; state: SharingState; changed: boolean } | { ok: false; error: string };

const EXCLUDED_CONTACTS = new Set(["con-011"]);

function activeGrant(t: { companyId: string; contactId: string }, propertyId: string, revoked: readonly string[], grants: PortalGrant[]) {
  return grants.find((g) => g.companyId === t.companyId && g.contactId === t.contactId && g.profile === "propietario"
    && g.relation.kind === "inmueble" && g.relation.id === propertyId && !revoked.includes(g.id));
}

/** Revalidates every rule for sharing (and for reading) a settlement version. Returns an error or null. */
export function shareEligibility(t: ShareTarget, deps: ShareDeps, revoked: readonly string[]): string | null {
  const ctxs = deps.contexts ?? settlementContexts;
  const grants = deps.grants ?? demoPortalGrants;
  const company = PORTAL_COMPANIES.find((c) => c.id === t.companyId);
  if (!company || company.didactic) return "La empresa no tiene relaciones de cartera.";
  if (EXCLUDED_CONTACTS.has(t.contactId)) return "El arrendador no es propietario autorizado.";
  const s = deps.settlements.settlements.find((x) => x.id === t.settlementId);
  if (!s) return "La liquidación no existe.";
  const v = s.versions.find((x) => x.number === t.version);
  if (!v) return "La versión no existe.";
  if (v.status !== "aprobado") return "Solo se comparten versiones aprobadas.";
  const ctx = ctxs.find((c) => c.id === s.contextId);
  if (!ctx || ctx.scope !== "cartera" || !ctx.propertyId) return "Los contextos didácticos no se comparten.";
  if (v.rules.model !== "agencia" && v.rules.model !== "renta_fija") return "El patrimonio propio no se comparte.";
  if (ctx.model !== "agencia" && ctx.model !== "renta_fija") return "El patrimonio propio no se comparte.";
  const property = deps.data.properties.find((p) => p.id === ctx.propertyId);
  if (!property || property.ownerId !== t.contactId || ctx.ownerId !== t.contactId) return "El destinatario no es el propietario actual.";
  if (!v.rules.participants.some((p) => p.id === t.contactId && p.basisPoints > 0)) return "El destinatario no participa en esta versión.";
  if (!activeGrant(t, property.id, revoked, grants)) return "No hay acceso activo de propietario a este inmueble.";
  return null;
}

const pairOf = (s: SettlementShare, t: { companyId: string; contactId: string; settlementId: string }) =>
  s.companyId === t.companyId && s.contactId === t.contactId && s.settlementId === t.settlementId;

export function shareVersion(state: SharingState, t: ShareTarget, deps: ShareDeps): ShareResult {
  const error = shareEligibility(t, deps, state.revokedGrants);
  if (error) return { ok: false, error };
  const current = state.shares.find((s) => s.active && pairOf(s, t));
  if (current && current.version === t.version) return { ok: true, state, changed: false };
  const seq = state.nextSeq;
  const shares = state.shares.map((s) => s === current ? { ...s, active: false, endedReason: "reemplazada" as const, endedSeq: seq } : s);
  shares.push({ id: `psh-${seq}`, ...t, active: true, seq });
  return { ok: true, changed: true, state: { ...state, shares, nextSeq: seq + 1,
    log: [...state.log, { seq, action: current ? "reemplazar" : "compartir", ...t }] } };
}

export function withdrawShare(state: SharingState, t: Omit<ShareTarget, "version">): SharingState {
  const current = state.shares.find((s) => s.active && pairOf(s, t));
  if (!current) return state;
  const seq = state.nextSeq;
  return { ...state, nextSeq: seq + 1,
    shares: state.shares.map((s) => s === current ? { ...s, active: false, endedReason: "retirada" as const, endedSeq: seq } : s),
    log: [...state.log, { seq, action: "retirar", companyId: t.companyId, contactId: t.contactId, settlementId: t.settlementId, version: current.version }] };
}

export function revokeGrant(state: SharingState, grantId: string, grants: PortalGrant[] = demoPortalGrants): SharingState {
  const g = grants.find((x) => x.id === grantId);
  if (!g || state.revokedGrants.includes(grantId)) return state;
  const seq = state.nextSeq;
  return { ...state, nextSeq: seq + 1, revokedGrants: [...state.revokedGrants, grantId],
    shares: state.shares.map((s) => s.active && s.companyId === g.companyId && s.contactId === g.contactId
      ? { ...s, active: false, endedReason: "revocada" as const, endedSeq: seq } : s),
    log: [...state.log, { seq, action: "revocar_acceso", companyId: g.companyId, contactId: g.contactId, grantId }] };
}

/** Restores the grant only; previous shares stay inactive and need a new confirmation. */
export function restoreGrant(state: SharingState, grantId: string, grants: PortalGrant[] = demoPortalGrants): SharingState {
  const g = grants.find((x) => x.id === grantId);
  if (!g || !state.revokedGrants.includes(grantId)) return state;
  const seq = state.nextSeq;
  return { ...state, nextSeq: seq + 1, revokedGrants: state.revokedGrants.filter((x) => x !== grantId),
    log: [...state.log, { seq, action: "restaurar_acceso", companyId: g.companyId, contactId: g.contactId, grantId }] };
}

export const activeShareFor = (state: SharingState, t: Omit<ShareTarget, "version">) =>
  state.shares.find((s) => s.active && pairOf(s, t));

// ---- Minimal external projection ----

export interface ProjectedLine { label: string; cents: number }
export interface SettlementProjection {
  shareId: string;
  settlementId: string;
  month: string;
  propertyName: string;
  version: number;
  /** Fictitious version date (not an approval date). */
  versionDate: string;
  model: "agencia" | "renta_fija";
  shareBasisPoints: number;
  lines: ProjectedLine[];
  /** Signed result of the approved version (may be negative or zero). */
  resultCents: number;
  /** Payable amount for this recipient per the approved version (zero is a value). */
  recipientPayableCents: number;
}

function project(share: SettlementShare, s: Settlement, v: Version, propertyName: string): SettlementProjection {
  const c = v.calculation;
  const r = v.rules;
  const model = r.model as "agencia" | "renta_fija";
  const lines: ProjectedLine[] = model === "agencia"
    ? [
        { label: "Ingresos incluidos", cents: c.incomeCents },
        { label: "Honorario de gestión", cents: -c.feeCents },
        { label: "Gastos a cargo del propietario", cents: -c.deductibleCents },
        { label: "Saldo anterior", cents: r.priorCents },
        { label: "Ajuste", cents: r.adjustmentCents },
      ]
    : [
        { label: "Obligación fija", cents: r.fixedCents },
        { label: "Saldo anterior", cents: r.priorCents },
        { label: "Ajuste", cents: r.adjustmentCents },
      ];
  const part = r.participants.find((p) => p.id === share.contactId);
  const own = c.shares.find((x) => x.id === share.contactId);
  return {
    shareId: share.id, settlementId: s.id, month: s.month, propertyName, version: v.number, versionDate: v.date, model,
    shareBasisPoints: part?.basisPoints ?? 0, lines, resultCents: c.resultCents, recipientPayableCents: own?.cents ?? 0,
  };
}

/** Active, revalidated settlement projections visible to an owner context. */
export function sharedSettlementsFor(state: SharingState, ctx: { companyId: string; profile: string; contactId: string }, deps: ShareDeps): SettlementProjection[] {
  if (ctx.profile !== "propietario") return [];
  const ctxs = deps.contexts ?? settlementContexts;
  const out: SettlementProjection[] = [];
  for (const sh of state.shares) {
    if (!sh.active || sh.companyId !== ctx.companyId || sh.contactId !== ctx.contactId) continue;
    if (shareEligibility(sh, deps, state.revokedGrants)) continue;
    const s = deps.settlements.settlements.find((x) => x.id === sh.settlementId)!;
    const v = s.versions.find((x) => x.number === sh.version)!;
    const sctx = ctxs.find((x) => x.id === s.contextId)!;
    const name = deps.data.properties.find((p) => p.id === sctx.propertyId)?.name ?? "";
    out.push(project(sh, s, v, name));
  }
  return out.sort((a, b) => b.month.localeCompare(a.month) || a.settlementId.localeCompare(b.settlementId));
}

export function sharedSettlementDetail(state: SharingState, ctx: { companyId: string; profile: string; contactId: string }, settlementId: string, deps: ShareDeps) {
  return sharedSettlementsFor(state, ctx, deps).find((p) => p.settlementId === settlementId) ?? null;
}
