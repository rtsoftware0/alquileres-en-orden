import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { FlaskConical, RotateCcw, Search, SearchX } from "lucide-react";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import type { DemoNotice, NoticeType } from "@/features/portfolio/data/types";
import { filterNotices, noticeCounts, noticeTypeLabel } from "./selectors";
import { NoticeTypeBadge } from "./components/DocsUi";
import { PageHeader, Panel } from "@/features/layout/PageHeader";
import { fieldClass, linkClass } from "@/features/layout/ui";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface NoticesSearch {
  q?: string | undefined;
  tipo?: NoticeType | undefined;
  noleidos?: "si" | undefined;
}

export function validateNoticesSearch(input: Record<string, unknown>): NoticesSearch {
  return {
    q: typeof input["q"] === "string" && input["q"] ? input["q"].slice(0, 80) : undefined,
    tipo: ["vencimiento", "deuda", "incidencia", "tarea", "fianza"].includes(input["tipo"] as string) ? (input["tipo"] as NoticeType) : undefined,
    noleidos: input["noleidos"] === "si" ? "si" : undefined,
  };
}

function NoticeLink({ notice }: { notice: DemoNotice }) {
  const l = notice.link;
  switch (l.kind) {
    case "cargo": return <Link to="/dinero/vencimientos/$chargeId" params={{ chargeId: l.id }} className={linkClass}>Ver el cargo</Link>;
    case "incidencia": return <Link to="/incidencias/$incidentId" params={{ incidentId: l.id }} className={linkClass}>Ver la incidencia</Link>;
    case "tareas": return <Link to="/tareas" className={linkClass}>Ver mis tareas</Link>;
    case "fianza": return <Link to="/dinero/fianzas/$contractId" params={{ contractId: l.id }} className={linkClass}>Ver la fianza</Link>;
  }
}

export function NoticesPage({ search }: { search: NoticesSearch }) {
  const navigate = useNavigate({ from: "/avisos/" });
  const update = (patch: NoticesSearch) => navigate({ search: (prev: NoticesSearch) => ({ ...prev, ...patch }), replace: true });
  const q = search.q ?? "";

  // Simulated reads live only in React memory; the base list never changes.
  const [readSim, setReadSim] = useState<ReadonlySet<string>>(new Set());
  const markRead = (id: string) => setReadSim((s) => new Set(s).add(id));

  const list = filterNotices(data, { q, type: search.tipo ?? "todos", onlyUnread: Boolean(search.noleidos) }, readSim);
  const counts = noticeCounts(data, readSim);
  const active = Boolean(q || search.tipo || search.noleidos);

  return (
    <>
      <PageHeader
        title="Avisos"
        subtitle={`${counts.unread} sin leer de ${counts.total} · a ${formatDate(data.referenceDate)} · avisos de ejemplo, no envíos externos`}
      />

      <div className="mb-4 rounded-lg border border-border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto_auto] sm:items-end">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Buscar</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input type="search" value={q} onChange={(e) => update({ q: e.target.value || undefined })} placeholder="Texto del aviso" className={cn(fieldClass, "pl-9")} />
            </span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Tipo</span>
            <select value={search.tipo ?? "todos"} onChange={(e) => update({ tipo: e.target.value === "todos" ? undefined : (e.target.value as NoticeType) })} className={fieldClass}>
              <option value="todos">Todos</option>
              {(Object.keys(noticeTypeLabel) as NoticeType[]).map((t) => <option key={t} value={t}>{noticeTypeLabel[t]}</option>)}
            </select>
          </label>
          <label className="flex h-10 items-center gap-2 text-sm">
            <input type="checkbox" checked={Boolean(search.noleidos)} onChange={(e) => update({ noleidos: e.target.checked ? "si" : undefined })} className="h-4 w-4 accent-primary" />
            Solo no leídos
          </label>
          <button type="button" onClick={() => navigate({ search: {}, replace: true })} disabled={!active} className={cn(linkClass, "h-10 text-sm disabled:pointer-events-none disabled:opacity-50")}>Restablecer</button>
        </div>
      </div>

      <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
        Mostrando <strong className="tabular text-foreground">{list.length}</strong> de {data.notices.length} avisos
      </p>

      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
          <SearchX className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
          <p className="mt-2 font-medium">No hay avisos que coincidan</p>
          <p className="mt-1 text-sm text-muted-foreground">Cambia la búsqueda o restablece los filtros.</p>
          {active && <button type="button" onClick={() => navigate({ search: {}, replace: true })} className={cn(linkClass, "mt-3 text-sm")}>Quitar todos los filtros</button>}
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((n) => (
            <li key={n.id} className={cn("rounded-lg border bg-card p-4", n.effectiveRead ? "border-border" : "border-primary/40")}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <NoticeTypeBadge type={n.type} />
                  {!n.effectiveRead && <span className="text-xs font-semibold text-primary">No leído</span>}
                  {n.effectiveRead && readSim.has(n.id) && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-demo-foreground/30 bg-demo px-2 py-0.5 text-xs font-medium text-demo-foreground">
                      <FlaskConical className="h-3 w-3" aria-hidden="true" />Leído (simulado)
                    </span>
                  )}
                </span>
                <span className="tabular text-xs text-muted-foreground">{formatDate(n.date)}</span>
              </div>
              <p className="mt-2 text-sm">{n.text}</p>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                <NoticeLink notice={n} />
                {!n.effectiveRead && (
                  <Button variant="outline" size="sm" onClick={() => markRead(n.id)}>Simular lectura</Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {readSim.size > 0 && (
        <Panel className="mt-4">
          <p className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <FlaskConical className="h-4 w-4 shrink-0" aria-hidden="true" />
            Hay lecturas simuladas temporales. La lista base no ha cambiado.
            <Button variant="outline" size="sm" onClick={() => setReadSim(new Set())}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Volver al estado base
            </Button>
          </p>
        </Panel>
      )}
    </>
  );
}
