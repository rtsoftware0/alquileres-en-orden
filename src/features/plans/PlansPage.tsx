import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/features/layout/PageHeader";
import { chipClass, fieldClass } from "@/features/layout/ui";
import { formatMoney } from "@/lib/format";
import { usePlans } from "./PlansContext";
import {
  DAY, ENTERPRISE, HOUR, INF_PENDING_NOTE, PLANS, PLAN_ORDER, TRIAL_PLANS, TRIAL_STORAGE_MB, type PlanId,
} from "./data/plans";
import {
  PHASE_LABEL, access, currentLimits, currentPlan, dunningFor, effectiveSub, exceeded, nextCut, notices, scheduledExcess,
  type PaymentResult, type PlansResult, type QuoteKind, type SimOutcome,
} from "./engine";

const madrid = new Intl.DateTimeFormat("es-ES", {
  timeZone: "Europe/Madrid", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
});
const utc = new Intl.DateTimeFormat("es-ES", {
  timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
});
/** Europe/Madrid time (DST included) with the UTC reference. */
export const fmtTime = (ms: number) => `${madrid.format(ms)} (Madrid) · ${utc.format(ms)} UTC`;
const fmtMb = (mb: number) => (mb >= 1024 && mb % 1024 === 0 ? `${mb / 1024} GB` : `${mb} MB`);
const ACCESS_LABEL = { sin_plan: "Sin plan", completo: "Completo (etiqueta demo)", consulta: "Solo consulta y exportación (etiqueta demo)", politica_pendiente: "Pendiente de política comercial" } as const;

export const PLANS_NOTICE = "Simulación: no hay cobros, tarjetas ni pagos reales. Los tipos de acceso son etiquetas de demostración y no bloquean otras pantallas. Recargar la página reinicia toda la demostración; no es un control real contra abusos.";

function Feedback({ r }: { r: PlansResult | null }) {
  if (!r) return null;
  return <p role="status" className={`mt-3 text-sm ${r.ok ? "text-primary" : "text-destructive"}`}>{r.ok ? "Hecho." : r.error}</p>;
}

export function PlansPage() {
  const p = usePlans();
  const { state: s, usage } = p;
  const [last, setLast] = useState<PlansResult | null>(null);
  const [consent, setConsent] = useState(false);
  const [sim, setSim] = useState<SimOutcome | null>(null);
  const [mb, setMb] = useState("100");
  const [storage, setStorage] = useState(String(s.storageMb));
  const act = (r: PlansResult) => { setLast(r); return r; };

  const ph = p.phase;
  const plan = currentPlan(s);
  const limits = currentLimits(s);
  const sub = effectiveSub(s);
  const cut = nextCut(s);
  const pendingQuote = [...s.quotes].reverse().find((q) => q.status !== "pagada");
  const excess = exceeded(s, usage);
  const futureExcess = scheduledExcess(s, usage);

  const quote = (k: QuoteKind, pl: PlanId) => { setConsent(false); act(p.quote(k, pl)); };

  return (
    <div className="space-y-6">
      <PageHeader title="Planes" subtitle="Precios mensuales por empresa, antes de impuestos, sin permanencia ni descuento anual." />
      <p className="rounded-md border border-border bg-muted p-3 text-sm">{PLANS_NOTICE}</p>

      <Panel title="Estado de la empresa">
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Fase</dt><dd data-testid="plans-phase" className="font-medium">{PHASE_LABEL[ph]}</dd></div>
          <div><dt className="text-muted-foreground">Acceso</dt><dd>{ACCESS_LABEL[access(s)]}</dd></div>
          <div><dt className="text-muted-foreground">Plan aplicado</dt><dd>{plan ? PLANS[plan].name : "Ninguno"}</dd></div>
          <div><dt className="text-muted-foreground">Reloj simulado</dt><dd data-testid="plans-now">{fmtTime(s.now)}</dd></div>
          {s.trial && <div><dt className="text-muted-foreground">Fin de la prueba</dt><dd data-testid="trial-end">{fmtTime(s.trial.endsAt)}</dd></div>}
          {sub && <div><dt className="text-muted-foreground">Periodo pagado</dt><dd>{fmtTime(sub.periodStart)} → {fmtTime(sub.periodEnd)}</dd></div>}
          {sub && (ph === "gracia" || ph === "solo_consulta_impago" || ph === "retencion_pendiente_impago") && (
            <div className="sm:col-span-2"><dt className="text-muted-foreground">Plazos de impago (desde el vencimiento)</dt>
              <dd>Gracia hasta {fmtTime(dunningFor(sub).restrictedFrom)}; solo consulta hasta {fmtTime(dunningFor(sub).readOnlyUntil)}</dd></div>
          )}
          {s.scheduled && <div className="sm:col-span-2"><dt className="text-muted-foreground">Programado al fin del periodo</dt><dd>{s.scheduled.kind === "bajada" ? `Bajada a ${PLANS[s.scheduled.plan].name}` : "Cancelación"}</dd></div>}
        </dl>
        {notices(s).map((n) => <p key={n.text} role="alert" className="mt-3 text-sm text-destructive">{n.text}</p>)}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => act(p.advance(HOUR))}>Avanzar 1 hora</Button>
          <Button variant="outline" size="sm" onClick={() => act(p.advance(DAY))}>Avanzar 24 horas</Button>
          <Button variant="outline" size="sm" onClick={() => act(p.advance(7 * DAY))}>Avanzar 7 días</Button>
          <Button variant="outline" size="sm" onClick={() => act(p.advance(30 * DAY))}>Avanzar 30 días</Button>
          <Button variant="outline" size="sm" disabled={cut === null} onClick={() => act(p.advanceToNextCut())}>Hasta el próximo corte</Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Reloj ficticio en UTC que solo avanza. Periodo mensual: mismo día del mes siguiente o el último día válido (convención de la demostración, no política comercial).</p>
        <Feedback r={last} />
      </Panel>

      <Panel title="Catálogo de planes">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PLAN_ORDER.map((id) => {
            const d = PLANS[id];
            return (
              <article key={id} aria-label={`Plan ${d.name}`} className="rounded-md border border-border p-4 text-sm">
                <h3 className="font-semibold">{d.name}</h3>
                <p className="text-lg font-semibold">{formatMoney(d.priceCents)}<span className="text-sm font-normal text-muted-foreground">/mes</span></p>
                <p>{d.limits.units} unidades · {d.limits.internalUsers} {d.limits.internalUsers === 1 ? "usuario interno" : "usuarios internos"} · {fmtMb(d.limits.storageMb)}</p>
                {d.inheritsFrom && <p className="mt-2 text-muted-foreground">Todo lo de {PLANS[d.inheritsFrom].name}, más:</p>}
                <ul className="mt-2 list-disc pl-5">{d.features.map((f) => <li key={f}>{f}</li>)}</ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  {ph === "sin_plan" && TRIAL_PLANS.includes(id) && <Button size="sm" onClick={() => act(p.startTrial(id))}>Empezar prueba {d.name}</Button>}
                  {ph === "prueba" && TRIAL_PLANS.includes(id) && s.trial!.plan !== id && <Button size="sm" variant="outline" onClick={() => act(p.switchTrial(id))}>Cambiar prueba a {d.name}</Button>}
                  {ph === "prueba" && !s.trialPurchase && <Button size="sm" variant="outline" onClick={() => quote("compra_en_prueba", id)}>Cotizar {d.name} al fin de la prueba</Button>}
                  {(ph === "sin_plan" || ph === "solo_consulta_prueba") && <Button size="sm" variant="outline" onClick={() => quote("compra", id)}>Cotizar {d.name}</Button>}
                  {ph === "activo" && sub && PLAN_ORDER.indexOf(id) > PLAN_ORDER.indexOf(sub.plan) && <Button size="sm" variant="outline" onClick={() => quote("subida", id)}>Cotizar subida a {d.name}</Button>}
                  {ph === "activo" && sub && PLAN_ORDER.indexOf(id) < PLAN_ORDER.indexOf(sub.plan) && <Button size="sm" variant="outline" onClick={() => act(p.downgrade(id))}>Programar bajada a {d.name}</Button>}
                </div>
              </article>
            );
          })}
          <article aria-label="Plan Enterprise" className="rounded-md border border-border p-4 text-sm">
            <h3 className="font-semibold">{ENTERPRISE.name}</h3>
            <p className="text-lg font-semibold">desde {formatMoney(ENTERPRISE.fromPriceCents)}<span className="text-sm font-normal text-muted-foreground">/mes</span></p>
            <p className="mt-2">{ENTERPRISE.note}</p>
          </article>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Prueba única por empresa de Pro o Max: 168 horas exactas, sin tarjeta, {TRIAL_STORAGE_MB} MB. Mostrar funciones no concede permisos reales. {INF_PENDING_NOTE}</p>
        {ph === "activo" && (
          <div className="mt-3 flex flex-wrap gap-2">
            {!s.scheduled && <Button size="sm" variant="outline" onClick={() => act(p.cancel())}>Programar cancelación</Button>}
            {s.scheduled && <Button size="sm" variant="outline" onClick={() => act(p.clearScheduled())}>Retirar cambio programado</Button>}
          </div>
        )}
        {(ph === "gracia" || ph === "solo_consulta_impago") && sub && (
          <div className="mt-3"><Button size="sm" onClick={() => quote("renovacion", s.scheduled?.kind === "bajada" ? s.scheduled.plan : sub.plan)}>Cotizar renovación pendiente</Button></div>
        )}
        {s.trialPurchase && <p className="mt-3 text-sm">Compra verificada: {PLANS[s.trialPurchase.plan].name} empieza al fin original de la prueba ({fmtTime(s.trial!.endsAt)}).</p>}
      </Panel>

      {pendingQuote && (
        <Panel title="Cotización ficticia">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Plan</dt><dd>{PLANS[pendingQuote.plan].name}</dd></div>
            <div><dt className="text-muted-foreground">Importe ficticio</dt><dd data-testid="quote-amount">{formatMoney(pendingQuote.amountCents)}</dd></div>
            <div><dt className="text-muted-foreground">Empieza</dt><dd>{fmtTime(pendingQuote.startsAt)}</dd></div>
            <div><dt className="text-muted-foreground">Origen</dt><dd>{pendingQuote.origin}</dd></div>
            {pendingQuote.label && <div className="sm:col-span-2"><dt className="text-muted-foreground">Nota</dt><dd>{pendingQuote.label}</dd></div>}
          </dl>
          {pendingQuote.status === "abierta" && (
            <div className="mt-3 space-y-2 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> Acepto la cotización ficticia (consentimiento simulado)</label>
              <Button size="sm" onClick={() => act(p.confirm(pendingQuote.id, consent))}>Confirmar cotización</Button>
            </div>
          )}
          {pendingQuote.status === "confirmada" && (
            <div className="mt-3 flex flex-wrap gap-2">
              {(["verificado", "pendiente", "fallido"] as PaymentResult[]).map((r) => (
                <Button key={r} size="sm" variant={r === "verificado" ? "default" : "outline"} onClick={() => act(p.pay(pendingQuote.id, r))}>Simular pago {r}</Button>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">Sin pago verificado simulado no cambia ningún derecho. Ningún cobro es real.</p>
        </Panel>
      )}

      <Panel title="Uso y límites">
        <ul className="space-y-1 text-sm">
          <li data-testid="usage-units">Unidades gestionadas: {usage.units}{limits ? ` de ${limits.units}` : ""}</li>
          <li data-testid="usage-users">Usuarios internos activos: {usage.internalUsers}{limits ? ` de ${limits.internalUsers}` : ""}</li>
          <li>Invitaciones pendientes: {usage.pendingInvitations} (política de plazas pendiente; no se suman)</li>
          <li>Almacenamiento simulado: {usage.storageMb} MB{limits ? ` de ${fmtMb(limits.storageMb)}` : ""}</li>
        </ul>
        {limits && usage.units === limits.units && <p className="mt-2 text-sm text-destructive">Has alcanzado el límite de unidades del plan.</p>}
        {excess.length > 0 && <p role="alert" className="mt-2 text-sm text-destructive">Exceso actual (no se borra nada; las altas simuladas quedan bloqueadas): {excess.join("; ")}</p>}
        {futureExcess.length > 0 && <p role="alert" className="mt-2 text-sm text-destructive">Tras la bajada habría exceso: {futureExcess.join("; ")}. Nada se borrará.</p>}
        <div className="mt-3 flex flex-wrap items-end gap-2 text-sm">
          <div><label htmlFor="pl-storage" className="font-medium">Uso simulado (MB)</label><input id="pl-storage" className={fieldClass} inputMode="numeric" value={storage} onChange={(e) => setStorage(e.target.value)} /></div>
          <Button size="sm" variant="outline" onClick={() => act(p.setStorage(Number(storage)))}>Aplicar uso simulado</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-2 text-sm">
          <Button size="sm" variant="outline" onClick={() => setSim(p.simulate({ kind: "unidad" }))}>Simular nueva unidad</Button>
          <Button size="sm" variant="outline" onClick={() => setSim(p.simulate({ kind: "usuario" }))}>Simular nuevo usuario</Button>
          <div><label htmlFor="pl-mb" className="font-medium">Subida simulada (MB)</label><input id="pl-mb" className={fieldClass} inputMode="numeric" value={mb} onChange={(e) => setMb(e.target.value)} /></div>
          <Button size="sm" variant="outline" onClick={() => setSim(p.simulate({ kind: "subida", mb: Number(mb) }))}>Simular subida</Button>
        </div>
        {sim && <p role="status" data-testid="sim-result" className="mt-2 text-sm">{sim.message}</p>}
        <p className="mt-2 text-xs text-muted-foreground">El simulador no crea altas, no cobra, no borra y no bloquea Cartera, importación ni documentos.</p>
      </Panel>

      <Panel title="Historial de planes">
        {s.history.length === 0 ? <p className="text-sm text-muted-foreground">Sin movimientos.</p> : (
          <ol className="space-y-1 text-sm">
            {s.history.map((h) => <li key={h.id}><span className={chipClass}>{h.action}</span> {fmtTime(h.at)} {h.detail}</li>)}
          </ol>
        )}
      </Panel>
    </div>
  );
}
