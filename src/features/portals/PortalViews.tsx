import { useState, type ReactNode } from "react";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import { incidentStatusLabel } from "@/features/incidents/selectors";
import { formatDate, formatMoney, formatPercent } from "@/lib/format";
import { fieldClass, chipClass } from "@/features/layout/ui";
import {
  ownerView, portalDetail, providerView, tenantView, validateProviderDraft, validateTenantDraft, parseEuroToCents,
  type PortalContext, type ProviderDraft, type TenantDraft,
} from "./selectors";

// Portal previews. All state is local React memory; the parent remounts
// these views (key) on any context change or revocation, which clears open
// details and drafts.

const roomStatus: Record<string, string> = { ocupada: "Ocupada", disponible: "Disponible", reservada: "Reservada", bloqueada: "Bloqueada" };
const contractStatus: Record<string, string> = { activo: "Vigente", pendiente: "Pendiente de inicio", finalizado: "Finalizado" };
const chargeStatus: Record<string, string> = { pendiente: "Pendiente", parcial: "Parcial", satisfecho: "Pagado", anulado: "Anulado" };

const btn = "inline-flex h-9 items-center justify-center rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring";
const btnPrimary = "inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-ring";
export { btn, btnPrimary };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}
const Empty = ({ children }: { children: ReactNode }) => <p className="text-sm text-muted-foreground">{children}</p>;

function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: { id: T; label: string }[]; value: T; onChange: (t: T) => void; label: string }) {
  return (
    <nav aria-label={label} className="mb-4 flex flex-wrap gap-1 border-b border-border">
      {tabs.map((t) => (
        <button key={t.id} type="button" aria-current={value === t.id ? "page" : undefined} onClick={() => onChange(t.id)}
          className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring ${value === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          {t.label}
        </button>
      ))}
    </nav>
  );
}

type Doc = ReturnType<typeof ownerView>["documents"][number];

function DocList({ ctx, docs, emptyText }: { ctx: PortalContext; docs: Doc[]; emptyText: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const detail = openId ? (portalDetail(data, ctx, "documento", openId) as Doc | null) : null;
  if (docs.length === 0) return <Empty>{emptyText}</Empty>;
  return (
    <div className="space-y-3">
      <ul className="divide-y divide-border">
        {docs.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span className="min-w-0 text-sm"><span className="font-medium text-foreground">{d.title}</span> <span className="text-muted-foreground">· {d.category} · v{d.current.version}</span></span>
            <button type="button" className={btn} onClick={() => setOpenId(d.id)} aria-label={`Ver documento ${d.title}`}>Ver</button>
          </li>
        ))}
      </ul>
      {openId && (
        <div className="rounded-md border border-border bg-muted/40 p-3" role="region" aria-label="Detalle del documento">
          {detail ? (
            <>
              <p className="text-sm font-semibold text-foreground">{detail.title}</p>
              {detail.versions.map((v) => (
                <div key={v.version} className="mt-2 text-sm">
                  <p className="text-muted-foreground">Versión {v.version} · {formatDate(v.date)} · {v.note}</p>
                  <p className="text-foreground">{v.content}</p>
                </div>
              ))}
              <p className="mt-2 text-xs text-muted-foreground">Contenido sintético de ejemplo. Sin descarga ni archivo.</p>
            </>
          ) : <Empty>No disponible en este portal.</Empty>}
          <button type="button" className={`${btn} mt-3`} onClick={() => setOpenId(null)}>Cerrar detalle</button>
        </div>
      )}
    </div>
  );
}

function SettlementPending() {
  return <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">Liquidaciones: integración pendiente del bloque 09.</p>;
}

// ---------------- Owner

export function OwnerPortal({ ctx }: { ctx: PortalContext }) {
  const v = ownerView(data, ctx);
  const [tab, setTab] = useState<"inmuebles" | "documentos" | "incidencias" | "liquidaciones">("inmuebles");
  return (
    <div>
      <Tabs label="Secciones del portal de propietario" value={tab} onChange={setTab}
        tabs={[{ id: "inmuebles", label: "Inmuebles" }, { id: "documentos", label: "Documentos" }, { id: "incidencias", label: "Incidencias" }, { id: "liquidaciones", label: "Liquidaciones" }]} />
      {tab === "inmuebles" && (
        <Section title="Inmuebles vinculados">
          {v.properties.length === 0 ? <Empty>Este contacto no tiene inmuebles vinculados como propietario.</Empty> : v.properties.map((p) => (
            <div key={p.id} className="mb-4 last:mb-0">
              <p className="font-medium text-foreground">{p.name}</p>
              <p className="text-sm text-muted-foreground">{p.address}</p>
              <p className="mt-2 text-sm text-foreground">
                Ocupación a {formatDate(v.referenceDate)}: <strong>{p.occupancy.occupied} de {p.occupancy.rentable}</strong> habitaciones habilitadas ({formatPercent(p.occupancy.rate)}); {p.occupancy.total} gestionadas, {p.occupancy.blocked} bloqueada(s).
              </p>
              <ul className="mt-2 flex flex-wrap gap-2" aria-label={`Habitaciones de ${p.name}`}>
                {p.rooms.map((r) => <li key={r.id} className={chipClass}>{r.code} · {roomStatus[r.status]}</li>)}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">No se muestran datos personales, contratos ni saldos de los inquilinos.</p>
            </div>
          ))}
        </Section>
      )}
      {tab === "documentos" && <Section title="Documentos compartidos contigo"><DocList ctx={ctx} docs={v.documents} emptyText="No hay documentos compartidos explícitamente con este propietario en los datos de ejemplo." /></Section>}
      {tab === "incidencias" && <Section title="Incidencias autorizadas"><IncidentList ctx={ctx} items={v.incidents} /></Section>}
      {tab === "liquidaciones" && <Section title="Liquidaciones"><SettlementPending /></Section>}
    </div>
  );
}

function IncidentList({ ctx, items }: { ctx: PortalContext; items: { id: string; title: string; status: keyof typeof incidentStatusLabel; targetDate: string; description: string }[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const detail = openId ? (portalDetail(data, ctx, "incidencia", openId) as { id: string } | null) : null;
  const item = detail ? items.find((i) => i.id === detail.id) : undefined;
  if (items.length === 0) return <Empty>No hay incidencias autorizadas para este contexto.</Empty>;
  return (
    <div>
      <ul className="divide-y divide-border">
        {items.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span className="text-sm"><span className="font-medium text-foreground">{i.title}</span> <span className="text-muted-foreground">· {incidentStatusLabel[i.status]}</span></span>
            <button type="button" className={btn} onClick={() => setOpenId(i.id)} aria-label={`Ver incidencia ${i.title}`}>Ver</button>
          </li>
        ))}
      </ul>
      {openId && (
        <div className="mt-3 rounded-md border border-border bg-muted/40 p-3 text-sm" role="region" aria-label="Detalle de la incidencia">
          {item ? <><p className="font-semibold text-foreground">{item.title}</p><p className="text-foreground">{item.description}</p><p className="text-muted-foreground">Objetivo: {formatDate(item.targetDate)}</p></> : <Empty>No disponible en este portal.</Empty>}
          <button type="button" className={`${btn} mt-3`} onClick={() => setOpenId(null)}>Cerrar detalle</button>
        </div>
      )}
    </div>
  );
}

// ---------------- Tenant

export function TenantPortal({ ctx }: { ctx: PortalContext }) {
  const v = tenantView(data, ctx);
  const [tab, setTab] = useState<"contratos" | "documentos" | "incidencias" | "preparar">("contratos");
  const all = [...v.current, ...v.history];
  return (
    <div>
      <Tabs label="Secciones del portal de inquilino" value={tab} onChange={setTab}
        tabs={[{ id: "contratos", label: "Contratos y cargos" }, { id: "documentos", label: "Documentos" }, { id: "incidencias", label: "Incidencias" }, { id: "preparar", label: "Preparar" }]} />
      {tab === "contratos" && (
        <div className="space-y-4">
          {all.length === 0 && <Section title="Contratos"><Empty>No hay contratos autorizados para este contacto.</Empty></Section>}
          {all.map((a) => (
            <Section key={a.contract.id} title={`${a.contract.reference} · ${a.contract.propertyName} ${a.contract.roomCode}`}>
              <p className="text-sm text-foreground">{contractStatus[a.contract.status] ?? a.contract.status} · del {formatDate(a.contract.startDate)} al {formatDate(a.contract.endDate)} (salida no incluida) · renta {formatMoney(a.contract.rentCents)} · vence el día {a.contract.dueDay}</p>
              <p className="mt-2 text-sm">Saldo pendiente de este contrato: <strong>{formatMoney(a.pendingCents)}</strong></p>
              {a.charges.length > 0 ? (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[420px] text-sm">
                    <caption className="sr-only">Cargos del contrato {a.contract.reference}</caption>
                    <thead><tr className="text-left text-muted-foreground"><th className="py-1 font-medium">Cargo</th><th className="font-medium">Vence</th><th className="text-right font-medium">Importe</th><th className="text-right font-medium">Pendiente</th><th className="pl-3 font-medium">Estado</th></tr></thead>
                    <tbody>{a.charges.map((c) => (
                      <tr key={c.id} className="border-t border-border"><td className="py-1">{c.reference}</td><td>{formatDate(c.dueDate)}</td><td className="text-right tabular-nums">{formatMoney(c.amountCents)}</td><td className="text-right tabular-nums">{formatMoney(c.outstandingCents)}</td><td className="pl-3">{chargeStatus[c.status]}{c.overdue ? " · vencido" : ""}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              ) : <Empty>Sin cargos de ejemplo en este contrato.</Empty>}
              <p className="mt-3 text-sm font-medium text-foreground">Cobros registrados (ejemplo)</p>
              {a.payments.length ? <ul className="text-sm text-foreground">{a.payments.map((p) => <li key={p.id}>{p.reference} · {formatDate(p.receivedOn)} · {formatMoney(p.amountCents)}</li>)}</ul> : <Empty>Sin cobros de ejemplo.</Empty>}
              <p className="mt-2 text-xs text-muted-foreground">Sin pago con tarjeta ni recibos descargables en esta demostración.</p>
            </Section>
          ))}
        </div>
      )}
      {tab === "documentos" && <Section title="Documentos compartidos contigo"><DocList ctx={ctx} docs={v.documents} emptyText="No hay documentos compartidos explícitamente contigo en los datos de ejemplo." /></Section>}
      {tab === "incidencias" && <Section title="Tus incidencias"><IncidentList ctx={ctx} items={v.incidents} /></Section>}
      {tab === "preparar" && <TenantDraftForm />}
    </div>
  );
}

function TenantDraftForm() {
  const [d, setD] = useState<TenantDraft>({ kind: "", text: "" });
  const [errors, setErrors] = useState<ReturnType<typeof validateTenantDraft>>({});
  const [preview, setPreview] = useState(false);
  const discard = () => { setD({ kind: "", text: "" }); setErrors({}); setPreview(false); };
  const review = () => {
    const e = validateTenantDraft(d); setErrors(e);
    if (e.kind) document.getElementById("pt-kind")?.focus();
    else if (e.text) document.getElementById("pt-text")?.focus();
    else setPreview(true);
  };
  return (
    <Section title="Preparar incidencia o mensaje (vista previa)">
      {preview ? (
        <div role="region" aria-label="Resumen previo">
          <p className="text-sm text-foreground"><strong>{d.kind === "incidencia" ? "Incidencia" : "Mensaje"} de ejemplo:</strong> {d.text}</p>
          <p className="mt-2 text-sm text-muted-foreground">Vista previa temporal. No se envía, no entra en el historial ni modifica las incidencias internas.</p>
          <div className="mt-3 flex gap-2"><button type="button" className={btn} onClick={() => setPreview(false)}>Volver a editar</button><button type="button" className={btnPrimary} onClick={discard}>Descartar</button></div>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm"><span className="font-medium">Tipo</span>
            <select id="pt-kind" className={fieldClass} value={d.kind} aria-invalid={!!errors.kind} aria-describedby={errors.kind ? "pt-kind-err" : undefined} onChange={(e) => setD({ ...d, kind: e.target.value as TenantDraft["kind"] })}>
              <option value="">Elige…</option><option value="incidencia">Incidencia</option><option value="mensaje">Mensaje</option>
            </select>
          </label>
          {errors.kind && <p id="pt-kind-err" className="text-sm text-destructive">{errors.kind}</p>}
          <label className="block text-sm"><span className="font-medium">Descripción</span>
            <textarea id="pt-text" rows={3} className={`${fieldClass} h-auto py-2`} value={d.text} aria-invalid={!!errors.text} aria-describedby={errors.text ? "pt-text-err" : undefined} onChange={(e) => setD({ ...d, text: e.target.value })} />
          </label>
          {errors.text && <p id="pt-text-err" className="text-sm text-destructive">{errors.text}</p>}
          <div className="flex gap-2"><button type="button" className={btnPrimary} onClick={review}>Ver resumen previo</button><button type="button" className={btn} onClick={discard}>Descartar</button></div>
        </div>
      )}
    </Section>
  );
}

// ---------------- Provider

export function ProviderPortal({ ctx }: { ctx: PortalContext }) {
  const v = providerView(data, ctx);
  const [tab, setTab] = useState<"trabajos" | "documentos" | "preparar">("trabajos");
  return (
    <div>
      <Tabs label="Secciones del portal de proveedor" value={tab} onChange={setTab}
        tabs={[{ id: "trabajos", label: "Trabajos asignados" }, { id: "documentos", label: "Documentos" }, { id: "preparar", label: "Preparar presupuesto o evidencia" }]} />
      {tab === "trabajos" && (
        <div className="space-y-4">
          {v.assignments.length === 0 && <Section title="Trabajos asignados"><Empty>Este proveedor no tiene trabajos asignados en los datos de ejemplo.</Empty></Section>}
          {v.assignments.map((a) => (
            <Section key={a.id} title={`${a.title} · ${a.propertyName} ${a.location}`}>
              <p className="text-sm text-foreground">{a.description}</p>
              <p className="text-sm text-muted-foreground">Estado: {incidentStatusLabel[a.status]} · objetivo {formatDate(a.targetDate)}</p>
              {a.budget && <p className="mt-2 text-sm">Tu presupuesto: {formatMoney(a.budget.amountCents)} · versión {a.budget.version} · {a.budget.status}. La aprobación corresponde a la gestión.</p>}
              <p className="mt-3 text-sm font-medium text-foreground">Mensajes compartidos</p>
              {a.messages.length ? <ul className="space-y-1 text-sm">{a.messages.map((m) => <li key={m.id}><span className="text-muted-foreground">{formatDate(m.date)} · {m.author}:</span> {m.text}</li>)}</ul> : <Empty>Sin mensajes compartidos.</Empty>}
            </Section>
          ))}
        </div>
      )}
      {tab === "documentos" && <Section title="Documentos compartidos contigo"><DocList ctx={ctx} docs={v.documents} emptyText="No hay documentos compartidos explícitamente con este proveedor." /></Section>}
      {tab === "preparar" && <ProviderDraftForm options={v.assignments.map((a) => ({ id: a.id, label: `${a.title} (${a.location})` }))} />}
    </div>
  );
}

function ProviderDraftForm({ options }: { options: { id: string; label: string }[] }) {
  const empty: ProviderDraft = { incidentId: "", kind: "", amount: "", text: "" };
  const [d, setD] = useState<ProviderDraft>(empty);
  const [errors, setErrors] = useState<ReturnType<typeof validateProviderDraft>>({});
  const [preview, setPreview] = useState(false);
  if (options.length === 0) return <Section title="Preparar presupuesto o evidencia"><Empty>Sin trabajos asignados: no hay nada que preparar.</Empty></Section>;
  const discard = () => { setD(empty); setErrors({}); setPreview(false); };
  const review = () => {
    const e = validateProviderDraft(d, options.map((o) => o.id)); setErrors(e);
    const first = (["incidentId", "kind", "amount", "text"] as const).find((k) => e[k]);
    if (first) document.getElementById(`pp-${first}`)?.focus(); else setPreview(true);
  };
  const err = (k: keyof typeof errors) => errors[k] && <p id={`pp-${k}-err`} className="text-sm text-destructive">{errors[k]}</p>;
  const aria = (k: keyof typeof errors) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `pp-${k}-err` : undefined });
  return (
    <Section title="Preparar presupuesto o evidencia (vista previa)">
      {preview ? (
        <div role="region" aria-label="Resumen previo">
          <p className="text-sm">Trabajo: {options.find((o) => o.id === d.incidentId)?.label}</p>
          <p className="text-sm">{d.kind === "presupuesto" ? `Presupuesto propuesto: ${formatMoney(parseEuroToCents(d.amount) ?? 0)}` : "Evidencia ficticia de resolución"}</p>
          <p className="text-sm">{d.text}</p>
          <p className="mt-2 text-sm text-muted-foreground">Vista previa temporal. No se envía, no crea gastos, cobros ni facturas, no aprueba presupuestos y no desbloquea habitaciones.</p>
          <div className="mt-3 flex gap-2"><button type="button" className={btn} onClick={() => setPreview(false)}>Volver a editar</button><button type="button" className={btnPrimary} onClick={discard}>Descartar</button></div>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm"><span className="font-medium">Trabajo</span>
            <select id="pp-incidentId" className={fieldClass} value={d.incidentId} {...aria("incidentId")} onChange={(e) => setD({ ...d, incidentId: e.target.value })}>
              <option value="">Elige…</option>{options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select></label>{err("incidentId")}
          <label className="block text-sm"><span className="font-medium">Qué preparas</span>
            <select id="pp-kind" className={fieldClass} value={d.kind} {...aria("kind")} onChange={(e) => setD({ ...d, kind: e.target.value as ProviderDraft["kind"] })}>
              <option value="">Elige…</option><option value="presupuesto">Nueva propuesta de presupuesto</option><option value="evidencia">Evidencia de resolución</option>
            </select></label>{err("kind")}
          {d.kind === "presupuesto" && <><label className="block text-sm"><span className="font-medium">Importe (€)</span>
            <input id="pp-amount" inputMode="decimal" className={fieldClass} value={d.amount} {...aria("amount")} onChange={(e) => setD({ ...d, amount: e.target.value })} />
            <span className="mt-1 block text-xs text-muted-foreground">Formato aceptado: 120, 120,50 o 120.50 (hasta dos decimales; miles con punto: 1.250,50).</span></label>{err("amount")}</>}
          <label className="block text-sm"><span className="font-medium">Descripción</span>
            <textarea id="pp-text" rows={3} className={`${fieldClass} h-auto py-2`} value={d.text} {...aria("text")} onChange={(e) => setD({ ...d, text: e.target.value })} /></label>{err("text")}
          <div className="flex gap-2"><button type="button" className={btnPrimary} onClick={review}>Ver resumen previo</button><button type="button" className={btn} onClick={discard}>Descartar</button></div>
        </div>
      )}
    </Section>
  );
}
