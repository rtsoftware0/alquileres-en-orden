import type { Incident, IncidentStatus, PortfolioDataset } from "@/features/portfolio/data/types";

// Pure what-if state machine for incident follow-up. It never mutates the
// dataset, never unlocks rooms and never creates expenses or payments.

export interface SimState {
  status: IncidentStatus;
  providerId?: string | undefined;
  budget?: { amountCents: number; status: "propuesto" | "aprobado" | "rechazado"; version: number } | undefined;
  resolution?: string | undefined;
  closure?: string | undefined; // close result, kept separate from the resolution result
  log: string[]; // temporary history entries, clearly marked as simulated
}

export const initialSim = (i: Incident): SimState => ({
  status: i.status,
  providerId: i.providerId,
  budget: i.budget ? { amountCents: i.budget.amountCents, status: i.budget.status, version: i.budget.version } : undefined,
  resolution: i.resolution?.text,
  log: [],
});

export type SimAction =
  | { type: "asignar_proveedor"; providerId: string }
  | { type: "presentar_presupuesto"; amountCents: number }
  | { type: "aprobar" }
  | { type: "rechazar" }
  | { type: "iniciar" }
  | { type: "resolver"; result: string }
  | { type: "cerrar"; result: string }
  | { type: "reabrir"; motive: string };

export type SimOutcome = { ok: true; state: SimState; entry: string } | { ok: false; error: string };

const fail = (error: string): SimOutcome => ({ ok: false, error });

export function applySimAction(d: PortfolioDataset, s: SimState, a: SimAction): SimOutcome {
  switch (a.type) {
    case "asignar_proveedor": {
      if (s.status !== "nueva" && s.status !== "en_revision") return fail("Solo se puede asignar proveedor estando nueva o en revisión.");
      const provider = d.contacts.find((c) => c.id === a.providerId);
      if (!provider || !provider.roles.includes("proveedor")) return fail("Elige un proveedor válido.");
      // A new provider invalidates any previous budget: no reused approvals.
      return { ok: true, state: { ...s, status: "asignada", providerId: a.providerId, budget: undefined }, entry: `Proveedor asignado: ${provider.name} (simulado).` };
    }
    case "presentar_presupuesto": {
      if (s.status !== "asignada") return fail("Primero asigna un proveedor.");
      if (!Number.isSafeInteger(a.amountCents) || a.amountCents <= 0) return fail("Importe de presupuesto no válido.");
      const version = (s.budget?.version ?? 0) + 1;
      return { ok: true, state: { ...s, status: "pendiente_aprobacion", budget: { amountCents: a.amountCents, status: "propuesto", version } }, entry: `Presupuesto v${version} presentado (simulado).` };
    }
    case "aprobar": {
      if (s.status !== "pendiente_aprobacion" || s.budget?.status !== "propuesto") return fail("No hay ningún presupuesto propuesto que aprobar.");
      return { ok: true, state: { ...s, status: "en_curso", budget: { ...s.budget, status: "aprobado" } }, entry: `Presupuesto v${s.budget.version} aprobado (simulado). No crea ningún gasto ni pago.` };
    }
    case "rechazar": {
      if (s.status !== "pendiente_aprobacion" || s.budget?.status !== "propuesto") return fail("No hay ningún presupuesto propuesto que rechazar.");
      // Rejection is not approval: back to asignada with the budget marked rejected.
      return { ok: true, state: { ...s, status: "asignada", budget: { ...s.budget, status: "rechazado" } }, entry: `Presupuesto v${s.budget.version} rechazado (simulado).` };
    }
    case "iniciar": {
      if (s.status !== "asignada") return fail("Solo se puede pasar a en curso desde asignada.");
      // Starting without a budget is only allowed when none was ever presented.
      // A rejected or proposed budget requires a new version and its approval.
      if (s.budget) return fail("El presupuesto fue rechazado: presenta una nueva versión y apruébala antes de iniciar.");
      return { ok: true, state: { ...s, status: "en_curso" }, entry: "Trabajos iniciados (simulado)." };
    }
    case "resolver": {
      if (s.status !== "en_curso") return fail("Solo se puede resolver una incidencia en curso.");
      if (!a.result.trim()) return fail("Indica el resultado de la resolución.");
      return { ok: true, state: { ...s, status: "resuelta", resolution: a.result.trim() }, entry: "Incidencia resuelta (simulado)." };
    }
    case "cerrar": {
      if (s.status !== "resuelta") return fail("Solo se puede cerrar una incidencia resuelta.");
      if (!a.result.trim()) return fail("Indica el resultado para cerrar.");
      // The close result is kept separately: it never overwrites the resolution result.
      return { ok: true, state: { ...s, status: "cerrada", closure: a.result.trim() }, entry: `Incidencia cerrada (simulado). Resultado de cierre: ${a.result.trim()}. No cambia el estado de ninguna habitación.` };
    }
    case "reabrir": {
      if (s.status !== "resuelta" && s.status !== "cerrada") return fail("Solo se puede reabrir una incidencia resuelta o cerrada.");
      if (!a.motive.trim()) return fail("Indica el motivo de la reapertura.");
      return { ok: true, state: { ...s, status: "en_revision", resolution: undefined, closure: undefined }, entry: `Reabierta (simulado). Motivo: ${a.motive.trim()}` };
    }
  }
}

/** Actions offered for a simulated status, in a coherent order. */
export function availableActions(s: SimState): SimAction["type"][] {
  switch (s.status) {
    case "nueva":
    case "en_revision": return ["asignar_proveedor"];
    case "asignada": return s.budget ? ["presentar_presupuesto"] : ["presentar_presupuesto", "iniciar"];
    case "pendiente_aprobacion": return ["aprobar", "rechazar"];
    case "en_curso": return ["resolver"];
    case "resuelta": return ["cerrar", "reabrir"];
    case "cerrada": return ["reabrir"];
  }
}
