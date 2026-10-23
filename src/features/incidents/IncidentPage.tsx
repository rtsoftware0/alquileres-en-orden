import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, FlaskConical, RotateCcw } from "lucide-react";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import type { Incident } from "@/features/portfolio/data/types";
import { getContact, contactsWithRole } from "@/features/contacts/selectors";
import { getExpense } from "@/features/money/expenses";
import { incidentStatusLabel, isOverdue, tasksOfIncident } from "./selectors";
import { applySimAction, availableActions, initialSim, type SimState } from "./simulator";
import { parseSimulatedAmount } from "@/features/money/simulator";
import { IncidentPriorityBadge, IncidentStatusBadge, OverdueIncidentTag, TaskStatusBadge, incidentStatusMeta } from "./components/IncidentUi";
import { Breadcrumbs, PageHeader, Panel, crumbLinkClass } from "@/features/layout/PageHeader";
import { fieldClass, linkClass } from "@/features/layout/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/format";
import { isTaskOverdue } from "./selectors";
import { cn } from "@/lib/utils";

const budgetStatusLabel = { propuesto: "Propuesto", aprobado: "Aprobado", rechazado: "Rechazado" } as const;

function SimulationPanel({ incident }: { incident: Incident }) {
  const [sim, setSim] = useState<SimState | null>(null);
  const [error, setError] = useState("");
  const [providerId, setProviderId] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [resultText, setResultText] = useState("");
  const [motive, setMotive] = useState("");
  const logRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => { if (sim) logRef.current?.focus(); }, [sim?.log.length]);

  const providers = contactsWithRole(data, ["proveedor"]);
  const run = (action: Parameters<typeof applySimAction>[2]) => {
    if (!sim) return;
    const r = applySimAction(data, sim, action);
    if (!r.ok) { setError(r.error); return; }
    setError("");
    setSim({ ...r.state, log: [...r.state.log, r.entry] });
  };
  const start = () => { setSim(initialSim(incident)); setError(""); setProviderId(""); setBudgetAmount(""); setResultText(""); setMotive(""); };
  const stop = () => { setSim(null); setError(""); };

  if (!sim) {
    return (
      <Panel title="Seguimiento simulado" className="lg:col-span-2">
        <p className="mb-3 text-sm text-muted-foreground">
          Prueba el recorrido de estados sobre una copia temporal: asignar proveedor, presupuesto, aprobación, resolución, cierre y reapertura. Nada se guarda ni cambia la ficha real.
        </p>
        <Button onClick={start}><FlaskConical className="h-4 w-4" aria-hidden="true" /> Iniciar simulación</Button>
      </Panel>
    );
  }

  const actions = availableActions(sim);
  return (
    <Panel className="lg:col-span-2 border-demo-foreground/30">
      <p role="note" className="mb-4 flex items-center gap-2 rounded-md border border-demo-foreground/30 bg-demo px-3 py-2 text-sm font-semibold text-demo-foreground">
        <FlaskConical className="h-4 w-4 shrink-0" aria-hidden="true" />
        Simulación: no se guarda ningún cambio ni se crea ningún gasto
      </p>
      <h2 ref={logRef} tabIndex={-1} className="mb-3 text-sm font-semibold outline-none">
        Estado simulado: <IncidentStatusBadge status={sim.status} /> {isOverdue(data, { ...incident, status: sim.status }) && <OverdueIncidentTag />}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {actions.includes("asignar_proveedor") && (
          <div className="text-sm">
            <label htmlFor="sim-provider" className="mb-1 block font-medium">Asignar proveedor</label>
            <div className="flex gap-2">
              <select id="sim-provider" value={providerId} onChange={(e) => setProviderId(e.target.value)} className={fieldClass}>
                <option value="">Elige un proveedor</option>
                {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <Button variant="outline" onClick={() => run({ type: "asignar_proveedor", providerId })}>Asignar</Button>
            </div>
          </div>
        )}
        {actions.includes("presentar_presupuesto") && (
          <div className="text-sm">
            <label htmlFor="sim-budget" className="mb-1 block font-medium">Presentar presupuesto (€)</label>
            <div className="flex gap-2">
              <input id="sim-budget" inputMode="decimal" autoComplete="off" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} className={fieldClass} placeholder="120" />
              <Button variant="outline" onClick={() => { const a = parseSimulatedAmount(budgetAmount); run({ type: "presentar_presupuesto", amountCents: a.cents ?? -1 }); }}>Presentar</Button>
            </div>
          </div>
        )}
        {(actions.includes("resolver") || actions.includes("cerrar")) && (
          <div className="text-sm">
            <label htmlFor="sim-result" className="mb-1 block font-medium">Resultado (obligatorio)</label>
            <input id="sim-result" autoComplete="off" value={resultText} onChange={(e) => setResultText(e.target.value)} className={fieldClass} placeholder="Describe el resultado" />
          </div>
        )}
        {actions.includes("reabrir") && (
          <div className="text-sm">
            <label htmlFor="sim-motive" className="mb-1 block font-medium">Motivo de reapertura (obligatorio)</label>
            <input id="sim-motive" autoComplete="off" value={motive} onChange={(e) => setMotive(e.target.value)} className={fieldClass} placeholder="Por qué se reabre" />
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {actions.includes("aprobar") && <Button onClick={() => run({ type: "aprobar" })}>Aprobar presupuesto</Button>}
        {actions.includes("rechazar") && <Button variant="outline" onClick={() => run({ type: "rechazar" })}>Rechazar presupuesto</Button>}
        {actions.includes("iniciar") && <Button onClick={() => run({ type: "iniciar" })}>Pasar a en curso</Button>}
        {actions.includes("resolver") && <Button onClick={() => run({ type: "resolver", result: resultText })}>Resolver</Button>}
        {actions.includes("cerrar") && <Button onClick={() => run({ type: "cerrar", result: resultText })}>Cerrar</Button>}
        {actions.includes("reabrir") && <Button variant="outline" onClick={() => run({ type: "reabrir", motive })}>Reabrir</Button>}
        <Button variant="outline" onClick={stop}><RotateCcw className="h-4 w-4" aria-hidden="true" /> Volver al estado base</Button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm font-medium text-destructive">{error}</p>}

      {sim.budget && (
        <p className="mt-4 text-sm">
          Presupuesto simulado v{sim.budget.version}: <strong className="tabular">{formatMoney(sim.budget.amountCents)}</strong> · {budgetStatusLabel[sim.budget.status]}.
          <span className="block text-xs text-muted-foreground">Un presupuesto propuesto o aprobado no es un coste, un gasto ni un pago.</span>
        </p>
      )}
      {sim.resolution && <p className="mt-2 text-sm">Resultado simulado: {sim.resolution}</p>}

      {sim.log.length > 0 && (
        <ul className="mt-4 divide-y divide-border text-sm" aria-label="Historial temporal simulado">
          {sim.log.map((entry, i) => (
            <li key={i} className="py-2 text-muted-foreground"><strong className="text-foreground">Simulado:</strong> {entry}</li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted-foreground">Estado base real: {incidentStatusLabel[incident.status]}. Al cambiar de incidencia o recargar, la simulación desaparece.</p>
    </Panel>
  );
}

export function IncidentPage({ incident }: { incident: Incident }) {
  const property = data.properties.find((p) => p.id === incident.propertyId)!;
  const room = incident.roomId ? data.rooms.find((r) => r.id === incident.roomId) : undefined;
  const provider = incident.providerId ? getContact(data, incident.providerId) : undefined;
  const tasks = tasksOfIncident(data, incident.id);
  const expense = incident.linkedExpenseId ? getExpense(data, incident.linkedExpenseId) : undefined;

  return (
    <>
      <Breadcrumbs items={[
        { label: "Incidencias", link: <Link to="/incidencias" className={crumbLinkClass}>Incidencias</Link> },
        { label: incident.title },
      ]} />
      <PageHeader
        title={incident.title}
        subtitle={<>{incident.category} · registrada el {formatDate(incident.openedOn)} · objetivo {formatDate(incident.targetDate)}</>}
        actions={<Link to="/incidencias" className={buttonVariants({ variant: "outline" })}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a incidencias</Link>}
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        <IncidentStatusBadge status={incident.status} />
        <IncidentPriorityBadge priority={incident.priority} />
        {isOverdue(data, incident) && <OverdueIncidentTag />}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Descripción y ubicación">
          <p className="text-sm">{incident.description}</p>
          <dl className="tabular mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
            <dt className="text-muted-foreground">Inmueble</dt>
            <dd><Link to="/cartera/inmuebles/$propertyId" params={{ propertyId: property.id }} className={linkClass}>{property.name}</Link></dd>
            <dt className="text-muted-foreground">Unidad</dt>
            <dd>{room ? <Link to="/cartera/habitaciones/$roomId" params={{ roomId: room.id }} className={linkClass}>{room.code}</Link> : "Zonas comunes"}</dd>
            <dt className="text-muted-foreground">Responsable interno</dt><dd>{incident.assigneeName}</dd>
            <dt className="text-muted-foreground">Proveedor</dt>
            <dd>{provider ? <Link to="/contactos/$contactId" params={{ contactId: provider.id }} className={linkClass}>{provider.name}</Link> : "Sin proveedor asignado"}</dd>
          </dl>
        </Panel>

        <Panel title="Presupuesto y resolución">
          {incident.budget ? (
            <p className="text-sm">
              Presupuesto v{incident.budget.version}: <strong className="tabular">{formatMoney(incident.budget.amountCents)}</strong> · {budgetStatusLabel[incident.budget.status]}
              {incident.budget.note && <span className="block text-xs text-muted-foreground">{incident.budget.note}</span>}
              <span className="block text-xs text-muted-foreground">Un presupuesto no es un coste, un gasto ni un pago.</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Sin presupuesto de ejemplo.</p>
          )}
          {incident.resolution ? (
            <p className="mt-3 text-sm">Resolución ({formatDate(incident.resolution.date)}): {incident.resolution.text}
              {incident.resolution.costCents !== undefined && <span className="tabular"> · coste final {formatMoney(incident.resolution.costCents)}</span>}
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Pendiente de resolución; no se inventa un cierre.</p>
          )}
          {expense && (
            <p className="mt-3 text-sm">
              Gasto ficticio ya existente relacionado:{" "}
              <Link to="/dinero/gastos/$expenseId" params={{ expenseId: expense.id }} className={linkClass}>{expense.reference} · {expense.concept}</Link>
              <span className="block text-xs text-muted-foreground">Registro previo de la demostración; no lo creó ninguna simulación ni aprobación.</span>
            </p>
          )}
        </Panel>

        <Panel title={`Historial ficticio (${incident.history.length})`}>
          <ul className="divide-y divide-border text-sm">
            {incident.history.map((h, i) => (
              <li key={i} className="py-2 first:pt-0 last:pb-0"><span className="tabular text-muted-foreground">{formatDate(h.date)}</span> · {h.text}</li>
            ))}
          </ul>
        </Panel>

        <Panel title={`Notas internas (solo lectura) (${incident.internalNotes.length})`}>
          {incident.internalNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin notas internas de ejemplo.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {incident.internalNotes.map((n, i) => (
                <li key={i} className="py-2 first:pt-0 last:pb-0"><span className="tabular text-muted-foreground">{formatDate(n.date)}</span> · {n.text}</li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted-foreground">Notas internas de ejemplo: no son un chat, no tienen destinatarios y no se envían.</p>
        </Panel>

        <Panel title={`Tareas vinculadas (${tasks.length})`} className="lg:col-span-2">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin tareas vinculadas.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {tasks.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                  <span><Link to="/tareas" search={{ q: t.title }} className={linkClass}>{t.title}</Link><span className="tabular text-muted-foreground"> · vence {formatDate(t.dueDate)}</span></span>
                  <TaskStatusBadge status={t.status} overdue={isTaskOverdue(data, t)} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <SimulationPanel key={incident.id} incident={incident} />
      </div>
    </>
  );
}

// re-export for tests
export { incidentStatusMeta };
export const _cn = cn;
