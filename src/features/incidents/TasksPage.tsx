import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { FlaskConical, RotateCcw, Search, SearchX } from "lucide-react";
import { useCatalogData } from "@/features/catalog/CatalogContext";
import type { TaskStatus } from "@/features/portfolio/data/types";
import { filterTasks, isTaskOverdue, taskCounts } from "./selectors";
import { TaskStatusBadge } from "./components/IncidentUi";
import { PageHeader, Panel } from "@/features/layout/PageHeader";
import { fieldClass, linkClass } from "@/features/layout/ui";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface TasksSearch {
  q?: string | undefined;
  estado?: TaskStatus | undefined;
  vencidas?: "si" | undefined;
}

export function validateTasksSearch(input: Record<string, unknown>): TasksSearch {
  return {
    q: typeof input["q"] === "string" && input["q"] ? input["q"].slice(0, 80) : undefined,
    estado: input["estado"] === "pendiente" || input["estado"] === "completada" ? input["estado"] : undefined,
    vencidas: input["vencidas"] === "si" ? "si" : undefined,
  };
}

export function TasksPage({ search }: { search: TasksSearch }) {
  const data = useCatalogData();
  const navigate = useNavigate({ from: "/tareas/" });
  const update = (patch: TasksSearch) => navigate({ search: (prev: TasksSearch) => ({ ...prev, ...patch }), replace: true });
  const q = search.q ?? "";
  const list = filterTasks(data, { q, status: search.estado ?? "todos", overdueOnly: Boolean(search.vencidas) });
  const counts = taskCounts(data);
  const active = Boolean(q || search.estado || search.vencidas);

  // Simulated completions live only in React memory; the base list never changes.
  const [done, setDone] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [err, setErr] = useState<Record<string, string>>({});

  const complete = (id: string) => {
    const r = (draft[id] ?? "").trim();
    if (!r) {
      setErr((e) => ({ ...e, [id]: "Indica el resultado para completar la tarea." }));
      document.getElementById(`res-${id}`)?.focus();
      return;
    }
    setErr((e) => { const n = { ...e }; delete n[id]; return n; });
    setDone((d) => ({ ...d, [id]: r }));
  };

  return (
    <>
      <PageHeader
        title="Mis tareas"
        subtitle={`${counts.pendientes} pendientes (${counts.vencidas} vencida${counts.vencidas === 1 ? "" : "s"}) · ${counts.completadas} completada${counts.completadas === 1 ? "" : "s"} · a ${formatDate(data.referenceDate)}`}
      />

      <div className="mb-4 rounded-lg border border-border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto_auto] sm:items-end">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Buscar</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input type="search" value={q} onChange={(e) => update({ q: e.target.value || undefined })} placeholder="Título u origen" className={cn(fieldClass, "pl-9")} />
            </span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Estado</span>
            <select value={search.estado ?? "todos"} onChange={(e) => update({ estado: e.target.value === "todos" ? undefined : (e.target.value as TaskStatus) })} className={fieldClass}>
              <option value="todos">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="completada">Completada</option>
            </select>
          </label>
          <label className="flex h-10 items-center gap-2 text-sm">
            <input type="checkbox" checked={Boolean(search.vencidas)} onChange={(e) => update({ vencidas: e.target.checked ? "si" : undefined })} className="h-4 w-4 accent-primary" />
            Solo vencidas
          </label>
          <button type="button" onClick={() => navigate({ search: {}, replace: true })} disabled={!active} className={cn(linkClass, "h-10 text-sm disabled:pointer-events-none disabled:opacity-50")}>Restablecer</button>
        </div>
      </div>

      <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
        Mostrando <strong className="tabular text-foreground">{list.length}</strong> de {data.tasks.length} tareas
      </p>

      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
          <SearchX className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
          <p className="mt-2 font-medium">No hay tareas que coincidan</p>
          <p className="mt-1 text-sm text-muted-foreground">Cambia la búsqueda o restablece los filtros.</p>
          {active && <button type="button" onClick={() => navigate({ search: {}, replace: true })} className={cn(linkClass, "mt-3 text-sm")}>Quitar todos los filtros</button>}
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((t) => {
            const simulated = done[t.id];
            const effectivelyDone = t.status === "completada" || Boolean(simulated);
            return (
              <li key={t.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">{t.title}</span>
                  {simulated
                    ? <span className="inline-flex items-center gap-1.5 rounded-full border border-demo-foreground/30 bg-demo px-2 py-0.5 text-xs font-medium text-demo-foreground"><FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />Completada (simulado)</span>
                    : <TaskStatusBadge status={t.status} overdue={isTaskOverdue(data, t)} />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Vence {formatDate(t.dueDate)} · {t.assigneeName} · {t.incidentId
                    ? <Link to="/incidencias/$incidentId" params={{ incidentId: t.incidentId }} className={linkClass}>{t.origin}</Link>
                    : t.origin}
                </p>
                {t.result && <p className="mt-2 text-sm text-muted-foreground">Resultado: {t.result}</p>}
                {simulated && <p className="mt-2 text-sm text-muted-foreground">Resultado simulado: {simulated} (no se ha guardado)</p>}
                {!effectivelyDone && (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <label className="sr-only" htmlFor={`res-${t.id}`}>Resultado de la finalización simulada</label>
                    <input
                      id={`res-${t.id}`} autoComplete="off" placeholder="Resultado (obligatorio)"
                      value={draft[t.id] ?? ""} onChange={(e) => setDraft((d) => ({ ...d, [t.id]: e.target.value }))}
                      className={cn(fieldClass, "sm:max-w-xs")} aria-invalid={Boolean(err[t.id])} aria-describedby={err[t.id] ? `res-${t.id}-error` : undefined}
                    />
                    <Button variant="outline" onClick={() => complete(t.id)}>Simular finalización</Button>
                    {err[t.id] && <p id={`res-${t.id}-error`} className="text-xs font-medium text-destructive">{err[t.id]}</p>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {Object.keys(done).length > 0 && (
        <Panel className="mt-4">
          <p className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <FlaskConical className="h-4 w-4 shrink-0" aria-hidden="true" />
            Hay finalizaciones simuladas temporales. La lista base no ha cambiado.
            <Button variant="outline" size="sm" onClick={() => { setDone({}); setDraft({}); setErr({}); }}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Volver al estado base
            </Button>
          </p>
        </Panel>
      )}
    </>
  );
}
