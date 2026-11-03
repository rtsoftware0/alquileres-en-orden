// Approved demo plan catalogue (monthly, per company, before taxes, no commitment or annual discount).
// Showing features does not grant real permissions. Exact INF01–09 assignment is pending.

export type PlanId = "basic" | "pro" | "max";
export type CatalogPlanId = PlanId | "enterprise";

export interface PlanLimits {
  units: number;
  internalUsers: number;
  storageMb: number;
}

export interface PlanDef {
  id: PlanId;
  name: string;
  priceCents: number;
  limits: PlanLimits;
  features: string[];
  inheritsFrom?: PlanId;
}

export const PLANS: Record<PlanId, PlanDef> = {
  basic: {
    id: "basic",
    name: "Basic",
    priceCents: 1900,
    limits: { units: 10, internalUsers: 1, storageMb: 1024 },
    features: [
      "Cartera y contactos",
      "Contratos",
      "Dinero con registro manual",
      "Incidencias y documentos internos",
      "Importación y exportación",
      "Calendario en consulta",
      "Informes básicos",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceCents: 4900,
    limits: { units: 50, internalUsers: 3, storageMb: 5 * 1024 },
    inheritsFrom: "basic",
    features: [
      "Prealquiler",
      "Calendario completo",
      "Banco por CSV y conciliación",
      "Repartos y liquidaciones simples",
      "Portales de propietario e inquilino",
      "Informes financieros",
    ],
  },
  max: {
    id: "max",
    name: "Max",
    priceCents: 9900,
    limits: { units: 150, internalUsers: 5, storageMb: 15 * 1024 },
    inheritsFrom: "pro",
    features: ["Portal de proveedor", "Todos los informes de la V1"],
  },
};

export const PLAN_ORDER: PlanId[] = ["basic", "pro", "max"];
export const TRIAL_PLANS: PlanId[] = ["pro", "max"];

export const ENTERPRISE = {
  id: "enterprise" as const,
  name: "Enterprise",
  fromPriceCents: 19900,
  note: "Precio orientativo desde 199 €/mes. Oferta individual con capacidades acordadas y probadas; no es ilimitado y no se puede activar en esta demostración.",
};

export const TRIAL_HOURS = 168;
export const TRIAL_STORAGE_MB = 500;
export const GRACE_DAYS = 7;
export const READ_ONLY_DAYS = 30;

export const INF_PENDING_NOTE = "El reparto exacto de los informes INF01–09 entre planes está pendiente.";
export const UPGRADE_LABEL = "ajuste ficticio, cálculo comercial pendiente";

export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;
/** Fictitious UTC start of the plans clock: 21/10/2026 09:00 UTC. */
export const PLANS_CLOCK_START = Date.UTC(2026, 9, 21, 9, 0, 0);
