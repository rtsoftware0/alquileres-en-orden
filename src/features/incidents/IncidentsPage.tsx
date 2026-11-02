import { Link, useNavigate } from "@tanstack/react-router";
import { Search, SearchX } from "lucide-react";
import { demoPortfolio as base } from "@/features/portfolio/data/demo-data";
import { useCatalogData } from "@/features/catalog/CatalogContext";
import type { IncidentPriority, IncidentStatus } from "@/features/portfolio/data/types";
import { getContact } from "@/features/contacts/selectors";
import { INCIDENT_PRIORITIES, INCIDENT_STATUSES, filterIncidents, incidentAssignees, incidentPriorityLabel, incidentStatusLabel, isOverdue } from "./selectors";
import { IncidentPriorityBadge, IncidentStatusBadge, OverdueIncidentTag } from "./components/IncidentUi";
import { PageHeader } from "@/features/layout/PageHeader";
import { fieldClass, linkClass } from "@/features/layout/ui";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface IncidentsSearch {
  q?: string | undefined;
  inmueble?: string | undefined;
  unidad?: string | undefined;
  prioridad?: IncidentPriority | undefined;
  estado?: IncidentStatus | undefined;
  responsable?: string | undefined;
  retrasadas?: "si" | undefined;
}

// Syntactically valid IDs are kept (new or unknown); existence is resolved against the current catalog in the page.
const isId = (v: unknown): v is string => typeof v === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(v);

export function validateIncidentsSearch(input: Record<string, unknown>): IncidentsSearch {
  return {
    q: typeof input["q"] === "string" && input["q"] ? input["q"].slice(0, 80) : undefined,
    inmueble: isId(input["inmueble"]) ? input["inmueble"] : undefined,
    unidad: isId(input["unidad"]) ? input["unidad"] : undefined,
    prioridad: INCIDENT_PRIORITIES.includes(input["prioridad"] as IncidentPriority) ? (input["prioridad"] as IncidentPriority) : undefined,
    estado: INCIDENT_STATUSES.includes(input["estado"] as IncidentStatus) ? (input["estado"] as IncidentStatus) : undefined,
    responsable: incidentAssignees(base).includes(input["responsable"] as string) ? (input["responsable"] as string) : undefined,
    retrasadas: input["retrasadas"] === "si" ? "si" : undefined,
  };
}

export function IncidentsPage({ search }: { search: IncidentsSearch }) {
  const data = useCatalogData();
  const navigate = useNavigate({ from: "/incidencias/" });
  const update = (patch: IncidentsSearch) => navigate({ search: (prev: IncidentsSearch) => ({ ...prev, ...patch }), replace: true });
  const q = search.q ?? "";
  const rooms = search.inmueble ? data.rooms.filter((r) => r.propertyId === search.inmueble) : data.rooms;
  const list = filterIncidents(data, {
    q,
    propertyId: search.inmueble ?? "todos",
    roomId: search.unidad ?? "todos",
    priority: search.prioridad ?? "todos",
    status: search.estado ?? "todos",
    assignee: search.responsable ?? "todos",
    overdueOnly: Boolean(search.retrasadas),
  });
  const active = Boolean(q || search.inmueble || search.unidad || search.prioridad || search.estado || search.responsable || search.retrasadas);
  const unknownProperty = Boolean(search.inmueble && !data.properties.some((p) => p.id === search.inmueble));
  const unknownRoom = Boolean(search.unidad && !data.rooms.some((r) => r.id === search.unidad));
  const overdueCount = data.incidents.filter((i) => isOverdue(data, i)).length;

  return (
    <>
      <PageHeader
        title="Incidencias"
        subtitle={`${data.incidents.length} incidencias de ejemplo · ${overdueCount} retrasada${overdueCount === 1 ? "" : "s"} a ${formatDate(data.referenceDate)} · fecha de referencia fija`}
        actions={<Link to="/incidencias/preparar" className={buttonVariants()}>Preparar incidencia de ejemplo</Link>}
      />

      <div className="mb-4 rounded-lg border border-border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Buscar</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input type="search" value={q} onChange={(e) => update({ q: e.target.value || undefined })} placeholder="Título, descripción, unidad o proveedor" className={cn(fieldClass, "pl-9")} />
            </span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Inmueble</span>
            <select value={search.inmueble ?? "todos"} onChange={(e) => update({ inmueble: e.target.value === "todos" ? undefined : e.target.value, unidad: undefined })} className={fieldClass}>
              <option value="todos">Todos</option>
              {unknownProperty && <option value={search.inmueble}>Inmueble no encontrado</option>}
              {data.properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Unidad</span>
            <select value={search.unidad ?? "todos"} onChange={(e) => update({ unidad: e.target.value === "todos" ? undefined : e.target.value })} className={fieldClass}>
              <option value="todos">Todas (incluye zonas comunes)</option>
              {unknownRoom && <option value={search.unidad}>Unidad no encontrada</option>}
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.code}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Prioridad</span>
            <select value={search.prioridad ?? "todos"} onChange={(e) => update({ prioridad: e.target.value === "todos" ? undefined : (e.target.value as IncidentPriority) })} className={fieldClass}>
              <option value="todos">Todas</option>
              {INCIDENT_PRIORITIES.map((p) => <option key={p} value={p}>{incidentPriorityLabel[p]}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Estado</span>
            <select value={search.estado ?? "todos"} onChange={(e) => update({ estado: e.target.value === "todos" ? undefined : (e.target.value as IncidentStatus) })} className={fieldClass}>
              <option value="todos">Todos</option>
              {INCIDENT_STATUSES.map((s) => <option key={s} value={s}>{incidentStatusLabel[s]}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Responsable</span>
            <select value={search.responsable ?? "todos"} onChange={(e) => update({ responsable: e.target.value === "todos" ? undefined : e.target.value })} className={fieldClass}>
              <option value="todos">Todos</option>
              {incidentAssignees(data).map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={Boolean(search.retrasadas)} onChange={(e) => update({ retrasadas: e.target.checked ? "si" : undefined })} className="h-4 w-4 accent-primary" />
            Solo retrasadas
          </label>
          <button type="button" onClick={() => navigate({ search: {}, replace: true })} disabled={!active} className={cn(linkClass, "text-sm disabled:pointer-events-none disabled:opacity-50")}>Restablecer filtros</button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          «Retrasada» significa fecha objetivo anterior al {formatDate(data.referenceDate)} con estado no final; no es un estado.
        </p>
      </div>

      {(unknownProperty || unknownRoom) && (
        <p role="status" className="mb-3 rounded-md border border-border bg-card px-3 py-2 text-sm">
          {unknownProperty ? "El inmueble del filtro no existe en la cartera actual" : "La unidad del filtro no existe en la cartera actual"}; no se muestran resultados. Restablece los filtros para ver todas las incidencias.
        </p>
      )}
      <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
        Mostrando <strong className="tabular text-foreground">{list.length}</strong> de {data.incidents.length} incidencias
      </p>

      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
          <SearchX className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
          <p className="mt-2 font-medium">No hay incidencias que coincidan</p>
          <p className="mt-1 text-sm text-muted-foreground">Cambia la búsqueda o restablece los filtros.</p>
          {active && <button type="button" onClick={() => navigate({ search: {}, replace: true })} className={cn(linkClass, "mt-3 text-sm")}>Quitar todos los filtros</button>}
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((i) => {
            const room = i.roomId ? data.rooms.find((r) => r.id === i.roomId) : undefined;
            return (
              <li key={i.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link to="/incidencias/$incidentId" params={{ incidentId: i.id }} className={cn(linkClass, "text-sm")}>{i.title}</Link>
                  <span className="flex flex-wrap gap-1.5">
                    <IncidentStatusBadge status={i.status} />
                    <IncidentPriorityBadge priority={i.priority} />
                    {isOverdue(data, i) && <OverdueIncidentTag />}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {i.category} · {data.properties.find((p) => p.id === i.propertyId)?.name}{room ? ` · ${room.code}` : " · zonas comunes"} · desde {formatDate(i.openedOn)} · objetivo {formatDate(i.targetDate)}
                  {i.providerId && <> · {getContact(data, i.providerId)?.name}</>}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
