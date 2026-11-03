// Pure plans/trial/payment state machine for the demo. No Date.now, no I/O.
// Rejected commands return the previous state unchanged.
import {
  DAY, GRACE_DAYS, HOUR, PLANS, PLANS_CLOCK_START, READ_ONLY_DAYS, TRIAL_HOURS, TRIAL_PLANS, TRIAL_STORAGE_MB, UPGRADE_LABEL,
  type PlanId, type PlanLimits,
} from "./data/plans";

export type Phase =
  | "sin_plan"
  | "prueba"
  | "solo_consulta_prueba"
  | "retencion_pendiente_prueba"
  | "activo"
  | "gracia"
  | "solo_consulta_impago"
  | "retencion_pendiente_impago"
  | "cancelado";

export type AccessLabel = "sin_plan" | "completo" | "consulta" | "politica_pendiente";

export type QuoteKind = "compra" | "compra_en_prueba" | "subida" | "renovacion";
export type QuoteStatus = "abierta" | "confirmada" | "pagada";
export type PaymentResult = "verificado" | "pendiente" | "fallido";

export interface Quote {
  id: string;
  kind: QuoteKind;
  plan: PlanId;
  amountCents: number;
  createdAt: number;
  startsAt: number;
  endsAt: number;
  origin: string;
  label?: string;
  context: string;
  status: QuoteStatus;
}

export interface Payment { id: string; quoteId: string; at: number; result: PaymentResult }
export interface HistoryEntry { id: string; at: number; action: string; detail: string }

export interface Subscription { plan: PlanId; periodStart: number; periodEnd: number }

export interface PlansState {
  companyId: string;
  now: number;
  seq: number;
  trial: { plan: PlanId; startedAt: number; endsAt: number } | null;
  trialUsed: boolean;
  everPaid: boolean;
  sub: Subscription | null;
  /** Verified purchase made during the trial; its paid period starts at the original trial end. */
  trialPurchase: { plan: PlanId; quoteId: string } | null;
  scheduled: { kind: "bajada"; plan: PlanId } | { kind: "cancelacion" } | null;
  quotes: Quote[];
  payments: Payment[];
  history: HistoryEntry[];
  storageMb: number;
}

export interface PlansResult { ok: boolean; state: PlansState; error?: string; id?: string }

export const initialPlansState = (companyId: string, now = PLANS_CLOCK_START): PlansState => ({
  companyId, now, seq: 0, trial: null, trialUsed: false, everPaid: false, sub: null, trialPurchase: null,
  scheduled: null, quotes: [], payments: [], history: [], storageMb: 0,
});

/** Demo convention: same UTC calendar day next month, or the last valid day. */
export function addMonthUTC(ms: number): number {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return Date.UTC(y, m, Math.min(d.getUTCDate(), last), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds());
}

/** Subscription in force at state.now, including the one starting at the trial end. */
export function effectiveSub(s: PlansState): Subscription | null {
  if (s.sub) return s.sub;
  if (s.trial && s.trialPurchase && s.now >= s.trial.endsAt) {
    return { plan: s.trialPurchase.plan, periodStart: s.trial.endsAt, periodEnd: addMonthUTC(s.trial.endsAt) };
  }
  return null;
}

/** Fixes the trial purchase into a concrete subscription once its start has passed (idempotent). */
function settle(s: PlansState): PlansState {
  if (!s.sub && s.trial && s.trialPurchase && s.now >= s.trial.endsAt) {
    return { ...s, sub: effectiveSub(s), trialPurchase: null };
  }
  return s;
}

export interface Dunning { dueAt: number; restrictedFrom: number; readOnlyUntil: number }
export const dunningFor = (sub: Subscription): Dunning => {
  const restrictedFrom = sub.periodEnd + GRACE_DAYS * DAY;
  return { dueAt: sub.periodEnd, restrictedFrom, readOnlyUntil: restrictedFrom + READ_ONLY_DAYS * DAY };
};

export function phase(s: PlansState): Phase {
  const sub = effectiveSub(s);
  if (sub) {
    if (s.now < sub.periodEnd) return "activo";
    if (s.scheduled?.kind === "cancelacion") return "cancelado";
    const d = dunningFor(sub);
    if (s.now < d.restrictedFrom) return "gracia";
    if (s.now < d.readOnlyUntil) return "solo_consulta_impago";
    return "retencion_pendiente_impago";
  }
  if (s.trial) {
    if (s.now < s.trial.endsAt) return "prueba";
    if (s.now < s.trial.endsAt + READ_ONLY_DAYS * DAY) return "solo_consulta_prueba";
    return "retencion_pendiente_prueba";
  }
  return "sin_plan";
}

export const PHASE_LABEL: Record<Phase, string> = {
  sin_plan: "Sin plan",
  prueba: "Prueba gratuita",
  solo_consulta_prueba: "Prueba terminada · solo consulta y exportación",
  retencion_pendiente_prueba: "Retención pendiente de política",
  activo: "Plan activo",
  gracia: "Renovación pendiente · periodo de gracia",
  solo_consulta_impago: "Impago · solo consulta y exportación",
  retencion_pendiente_impago: "Retención pendiente de política",
  cancelado: "Cancelado · acceso posterior pendiente de política comercial",
};

export function access(s: PlansState): AccessLabel {
  const p = phase(s);
  if (p === "prueba" || p === "activo" || p === "gracia") return "completo";
  if (p === "solo_consulta_prueba" || p === "solo_consulta_impago") return "consulta";
  if (p === "sin_plan") return "sin_plan";
  return "politica_pendiente";
}

/** Plan whose limits apply now (null when none). */
export function currentPlan(s: PlansState): PlanId | null {
  const p = phase(s);
  if (p === "prueba") return s.trial!.plan;
  if (p === "activo" || p === "gracia") return effectiveSub(s)!.plan;
  return null;
}

export function currentLimits(s: PlansState): PlanLimits | null {
  const plan = currentPlan(s);
  if (!plan) return null;
  const l = PLANS[plan].limits;
  return phase(s) === "prueba" ? { ...l, storageMb: TRIAL_STORAGE_MB } : l;
}

/** Context key: quotes become stale when phase, plan, period or trial purchase change. */
export function contextKey(s: PlansState): string {
  const sub = effectiveSub(s);
  return [phase(s), currentPlan(s) ?? "-", sub?.periodStart ?? "-", sub?.plan ?? "-", s.trial?.endsAt ?? "-", s.trialPurchase?.plan ?? "-", s.scheduled ? JSON.stringify(s.scheduled) : "-"].join("|");
}

/** Next time-based cut after now (24h notices, trial end, period end, grace, read-only). */
export function nextCut(s: PlansState): number | null {
  const cuts: number[] = [];
  if (s.trial) cuts.push(s.trial.endsAt - DAY, s.trial.endsAt, s.trial.endsAt + READ_ONLY_DAYS * DAY);
  const sub = effectiveSub(s) ?? (s.trial && s.trialPurchase ? { plan: s.trialPurchase.plan, periodStart: s.trial.endsAt, periodEnd: addMonthUTC(s.trial.endsAt) } : null);
  if (sub) {
    const d = dunningFor(sub);
    cuts.push(sub.periodEnd - DAY, sub.periodEnd, d.restrictedFrom, d.readOnlyUntil);
  }
  const future = cuts.filter((c) => c > s.now).sort((a, b) => a - b);
  return future[0] ?? null;
}

export interface Notice { tone: "info" | "warn"; text: string }
export function notices(s: PlansState): Notice[] {
  const out: Notice[] = [];
  const p = phase(s);
  if (p === "prueba" && s.trial!.endsAt - s.now <= DAY) out.push({ tone: "warn", text: "Quedan 24 horas o menos para el fin de la prueba." });
  if (p === "solo_consulta_prueba") out.push({ tone: "warn", text: "La prueba ha terminado sin compra: solo consulta y exportación durante 30 días, sin cargo y sin pasar a Basic gratis." });
  const sub = effectiveSub(s);
  if (p === "activo" && sub && sub.periodEnd - s.now <= DAY) out.push({ tone: "warn", text: s.scheduled?.kind === "cancelacion" ? "El periodo pagado termina en 24 horas o menos; después se aplica la cancelación." : "El periodo pagado termina en 24 horas o menos. La renovación necesita un pago simulado verificado; no se renueva sola." });
  if (p === "gracia") out.push({ tone: "warn", text: "Renovación pendiente por falta de pago verificado. Gracia de 7 días desde el vencimiento." });
  if (p === "solo_consulta_impago") out.push({ tone: "warn", text: "Impago: solo consulta y exportación durante 30 días desde el inicio de la restricción." });
  if (p === "retencion_pendiente_prueba" || p === "retencion_pendiente_impago") out.push({ tone: "warn", text: "Retención pendiente de política: no se borra nada y no se promete conservación indefinida." });
  if (p === "cancelado") out.push({ tone: "warn", text: "Cancelación aplicada al fin del periodo pagado. El acceso posterior está pendiente de política comercial." });
  return out;
}

function commit(prev: PlansState, next: PlansState, action: string, detail: string, id?: string): PlansResult {
  const seq = prev.seq + 1;
  const entry: HistoryEntry = { id: `plh-${seq}`, at: next.now, action, detail };
  return { ok: true, state: { ...next, seq, history: [...prev.history, entry] }, ...(id ? { id } : {}) };
}
const reject = (s: PlansState, error: string): PlansResult => ({ ok: false, state: s, error });
const isPlan = (p: unknown): p is PlanId => p === "basic" || p === "pro" || p === "max";
const rank = (p: PlanId) => (p === "basic" ? 0 : p === "pro" ? 1 : 2);

export function advanceClock(s: PlansState, ms: number): PlansResult {
  if (!Number.isFinite(ms) || !Number.isInteger(ms) || ms <= 0) return reject(s, "El reloj solo avanza con un intervalo positivo.");
  const next = settle({ ...s, now: s.now + ms });
  return commit(s, next, "Reloj simulado", `+${Math.round(ms / HOUR)} h`);
}

export function advanceToNextCut(s: PlansState): PlansResult {
  const c = nextCut(s);
  if (c === null) return reject(s, "No hay ningún corte próximo.");
  return advanceClock(s, c - s.now);
}

export function startTrial(s: PlansState, plan: PlanId): PlansResult {
  if (!TRIAL_PLANS.includes(plan)) return reject(s, "La prueba solo está disponible para Pro o Max.");
  if (s.everPaid) return reject(s, "Una empresa que ya ha pagado no obtiene otra prueba.");
  if (s.trialUsed) return reject(s, "Esta empresa ya usó su única prueba.");
  if (phase(s) !== "sin_plan") return reject(s, "La prueba solo empieza sin plan.");
  const endsAt = s.now + TRIAL_HOURS * HOUR;
  return commit(s, { ...s, trialUsed: true, trial: { plan, startedAt: s.now, endsAt } }, "Prueba iniciada", `${PLANS[plan].name} · sin tarjeta`);
}

export function switchTrialPlan(s: PlansState, plan: PlanId): PlansResult {
  if (phase(s) !== "prueba") return reject(s, "Solo se cambia de plan durante la prueba.");
  if (!TRIAL_PLANS.includes(plan) || plan === s.trial!.plan) return reject(s, "Cambio de prueba no válido.");
  return commit(s, { ...s, trial: { ...s.trial!, plan } }, "Plan de prueba cambiado", `${PLANS[plan].name} · mismo inicio y fin`);
}

export function upgradeExampleCents(from: PlanId, to: PlanId) {
  return PLANS[to].priceCents - PLANS[from].priceCents;
}

export function createQuote(s: PlansState, kind: QuoteKind, plan: PlanId): PlansResult {
  if (!isPlan(plan)) return reject(s, "Plan no válido.");
  const p = phase(s);
  const id = `cot-${s.seq + 1}`;
  const base = { id, kind, plan, createdAt: s.now, context: contextKey(s), status: "abierta" as const };
  let q: Quote;
  if (kind === "compra_en_prueba") {
    if (p !== "prueba") return reject(s, "Solo durante la prueba.");
    if (s.trialPurchase) return reject(s, "Ya hay una compra verificada para el fin de la prueba.");
    const start = s.trial!.endsAt;
    q = { ...base, amountCents: PLANS[plan].priceCents, startsAt: start, endsAt: addMonthUTC(start), origin: `Prueba ${PLANS[s.trial!.plan].name}; empieza al fin original de la prueba` };
  } else if (kind === "compra") {
    if (p !== "sin_plan" && p !== "solo_consulta_prueba") return reject(s, "La compra directa no está disponible en esta fase.");
    q = { ...base, amountCents: PLANS[plan].priceCents, startsAt: s.now, endsAt: addMonthUTC(s.now), origin: p === "sin_plan" ? "Sin plan" : "Prueba terminada" };
  } else if (kind === "subida") {
    const sub = effectiveSub(s);
    if (p !== "activo" || !sub) return reject(s, "La subida requiere un plan pagado activo.");
    if (rank(plan) <= rank(sub.plan)) return reject(s, "Solo se sube a un plan superior.");
    q = { ...base, amountCents: upgradeExampleCents(sub.plan, plan), startsAt: s.now, endsAt: sub.periodEnd, origin: `Plan ${PLANS[sub.plan].name} pagado`, label: UPGRADE_LABEL };
  } else {
    const sub = effectiveSub(s);
    if ((p !== "gracia" && p !== "solo_consulta_impago") || !sub) return reject(s, "La renovación pendiente solo existe tras el vencimiento sin pago verificado.");
    const renewPlan = s.scheduled?.kind === "bajada" ? s.scheduled.plan : sub.plan;
    if (plan !== renewPlan) return reject(s, "La renovación usa el plan vigente o la bajada programada.");
    q = { ...base, amountCents: PLANS[plan].priceCents, startsAt: s.now, endsAt: addMonthUTC(s.now), origin: `Vencido el periodo de ${PLANS[sub.plan].name}`, label: "Convención del ejemplo: el periodo empieza en la recuperación; regularización comercial pendiente" };
  }
  return commit(s, { ...s, quotes: [...s.quotes, q] }, "Cotización ficticia", `${PLANS[plan].name} · ${q.amountCents} céntimos`, id);
}

export function confirmQuote(s: PlansState, quoteId: string, consent: boolean): PlansResult {
  const q = s.quotes.find((x) => x.id === quoteId);
  if (!q) return reject(s, "Cotización inexistente.");
  if (q.status !== "abierta") return reject(s, "La cotización ya fue confirmada.");
  if (q.context !== contextKey(s)) return reject(s, "La cotización está obsoleta: cambió el plan, el periodo o la fase.");
  if (!consent) return reject(s, "Falta el consentimiento explícito.");
  return commit(s, { ...s, quotes: s.quotes.map((x) => (x.id === q.id ? { ...x, status: "confirmada" } : x)) }, "Cotización confirmada", q.id);
}

export function simulatePayment(s: PlansState, quoteId: string, result: PaymentResult): PlansResult {
  const q = s.quotes.find((x) => x.id === quoteId);
  if (!q) return reject(s, "Cotización inexistente.");
  if (q.status === "pagada") return reject(s, "El pago ya está verificado; no se vuelve a aplicar.");
  if (q.status !== "confirmada") return reject(s, "Confirma la cotización antes del pago simulado.");
  if (q.context !== contextKey(s)) return reject(s, "La cotización está obsoleta: cambió el plan, el periodo o la fase.");
  if (result !== "verificado" && result !== "pendiente" && result !== "fallido") return reject(s, "Resultado no válido.");
  const pay: Payment = { id: `pago-${s.seq + 1}`, quoteId, at: s.now, result };
  let next: PlansState = { ...s, payments: [...s.payments, pay] };
  if (result === "verificado") {
    next = { ...next, quotes: s.quotes.map((x) => (x.id === q.id ? { ...x, status: "pagada" } : x)), everPaid: true };
    if (q.kind === "compra_en_prueba") next = { ...next, trialPurchase: { plan: q.plan, quoteId: q.id } };
    else if (q.kind === "subida") next = { ...next, sub: { ...effectiveSub(s)!, plan: q.plan }, scheduled: null };
    else next = { ...next, sub: { plan: q.plan, periodStart: q.startsAt, periodEnd: q.endsAt }, scheduled: null, trialPurchase: null };
    next = settle(next);
  }
  return commit(s, next, "Pago simulado", `${q.id} · ${result}`, pay.id);
}

export function scheduleDowngrade(s: PlansState, plan: PlanId): PlansResult {
  const sub = effectiveSub(s);
  if (phase(s) !== "activo" || !sub) return reject(s, "La bajada requiere un plan pagado activo.");
  if (rank(plan) >= rank(sub.plan)) return reject(s, "Solo se baja a un plan inferior.");
  return commit(settle(s), { ...settle(s), scheduled: { kind: "bajada", plan } }, "Bajada programada", `${PLANS[plan].name} al fin del periodo pagado`);
}

export function scheduleCancel(s: PlansState): PlansResult {
  if (phase(s) !== "activo") return reject(s, "La cancelación requiere un plan pagado activo.");
  if (s.scheduled?.kind === "cancelacion") return reject(s, "La cancelación ya está programada.");
  return commit(settle(s), { ...settle(s), scheduled: { kind: "cancelacion" } }, "Cancelación programada", "Al fin del periodo pagado");
}

export function clearScheduled(s: PlansState): PlansResult {
  if (phase(s) !== "activo" || !s.scheduled) return reject(s, "No hay cambio programado.");
  return commit(s, { ...s, scheduled: null }, "Cambio programado retirado", "");
}

export function setSimulatedStorage(s: PlansState, mb: number): PlansResult {
  if (!Number.isFinite(mb) || mb < 0 || mb > 1_000_000) return reject(s, "Uso simulado no válido.");
  const v = Math.round(mb);
  if (v === s.storageMb) return reject(s, "Sin cambios.");
  return commit(s, { ...s, storageMb: v }, "Almacenamiento simulado", `${v} MB`);
}

// ---------- Limits simulator (never writes, never charges, never deletes) ----------

export interface Usage { units: number; internalUsers: number; storageMb: number; pendingInvitations: number }
export type SimAction = { kind: "unidad" } | { kind: "usuario" } | { kind: "subida"; mb: number };
export interface SimOutcome { allowed: boolean; message: string; limit?: number; after?: number }

export function exceeded(s: PlansState, u: Usage): string[] {
  const l = currentLimits(s);
  if (!l) return [];
  const out: string[] = [];
  if (u.units > l.units) out.push(`Unidades: ${u.units} de ${l.units}`);
  if (u.internalUsers > l.internalUsers) out.push(`Usuarios internos: ${u.internalUsers} de ${l.internalUsers}`);
  if (u.storageMb > l.storageMb) out.push(`Almacenamiento simulado: ${u.storageMb} de ${l.storageMb} MB`);
  return out;
}

export function scheduledExcess(s: PlansState, u: Usage): string[] {
  if (s.scheduled?.kind !== "bajada") return [];
  const l = PLANS[s.scheduled.plan].limits;
  const out: string[] = [];
  if (u.units > l.units) out.push(`Unidades: ${u.units} de ${l.units}`);
  if (u.internalUsers > l.internalUsers) out.push(`Usuarios internos: ${u.internalUsers} de ${l.internalUsers}`);
  if (u.storageMb > l.storageMb) out.push(`Almacenamiento simulado: ${u.storageMb} de ${l.storageMb} MB`);
  return out;
}

export function simulate(s: PlansState, u: Usage, a: SimAction): SimOutcome {
  const acc = access(s);
  if (acc === "sin_plan") return { allowed: false, message: "Rechazado: no hay plan ni prueba en la demostración." };
  if (acc === "consulta") return { allowed: false, message: "Rechazado: solo consulta y exportación." };
  if (acc === "politica_pendiente") return { allowed: false, message: "Rechazado: acceso pendiente de política comercial." };
  const l = currentLimits(s)!;
  const [cur, limit, add, name] =
    a.kind === "unidad" ? [u.units, l.units, 1, "unidades"] :
    a.kind === "usuario" ? [u.internalUsers, l.internalUsers, 1, "usuarios internos"] :
    [u.storageMb, l.storageMb, a.mb, "MB simulados"];
  if (a.kind === "subida" && (!Number.isFinite(a.mb) || a.mb <= 0)) return { allowed: false, message: "Tamaño simulado no válido." };
  const after = cur + add;
  if (cur > limit) return { allowed: false, limit, after, message: `Rechazado: ya hay exceso (${cur} de ${limit} ${name}). Nada se borra.` };
  if (after > limit) return { allowed: false, limit, after, message: `Rechazado: superaría el límite (${after} de ${limit} ${name}).` };
  return { allowed: true, limit, after, message: after === limit ? `Permitido: alcanza el límite (${after} de ${limit} ${name}).` : `Permitido: ${after} de ${limit} ${name}.` };
}
