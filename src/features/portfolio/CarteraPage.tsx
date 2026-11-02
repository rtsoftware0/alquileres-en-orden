import { Link, useNavigate } from "@tanstack/react-router";
import { RotateCcw, Search, SearchX } from "lucide-react";
import { CatalogNotice, CatalogOriginBadge, useCatalogData } from "@/features/catalog/CatalogContext";
import type { RoomStatus } from "./data/types";
import {
  ROOM_STATUSES, filterProperties, filterRooms, getProperty, roomsOf, summarizeOccupancy,
  type PropertySort, type RoomSort,
} from "./selectors";
import { propertySorts, roomSorts, type CarteraSearch } from "./search";
import { StatusBadge, statusMeta } from "./components/StatusBadge";
import { PageHeader } from "@/features/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { formatEUR, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring";
const linkClass = "rounded-sm font-medium text-primary hover:underline";

export function CarteraPage({ search }: { search: CarteraSearch }) {
  const navigate = useNavigate({ from: "/cartera/" });
  const data = useCatalogData();
  const vista = search.vista ?? "habitaciones";
  const q = search.q ?? "";
  const estado: RoomStatus | "todas" = search.estado ?? "todas";

  const update = (patch: Partial<CarteraSearch>) =>
    navigate({ search: (prev: CarteraSearch) => ({ ...prev, ...patch }), replace: true });
  const reset = () => navigate({ search: { vista }, replace: true });

  const roomSort = (roomSorts.find((s) => s.value === search.orden)?.value ?? "codigo") as RoomSort;
  const propSort = (propertySorts.find((s) => s.value === search.orden)?.value ?? "nombre") as PropertySort;

  const rooms = vista === "habitaciones" ? filterRooms(data, { q, status: estado, sort: roomSort }) : [];
  const properties = vista === "inmuebles" ? filterProperties(data, { q, sort: propSort }) : [];
  const total = vista === "habitaciones" ? data.rooms.length : data.properties.length;
  const shown = vista === "habitaciones" ? rooms.length : properties.length;
  const noun = vista === "habitaciones" ? "habitaciones" : "inmuebles";
  const hasFilters = Boolean(q) || estado !== "todas" || Boolean(search.orden);

  return (
    <>
      <PageHeader title="Cartera" subtitle={`${data.companyName} · ${data.properties.length} inmuebles · ${data.rooms.length} habitaciones`} />
      <CatalogNotice />

      <div role="tablist" aria-label="Vista" className="mb-4 inline-flex rounded-md border border-border bg-card p-1">
        {(["inmuebles", "habitaciones"] as const).map((v) => (
          <button
            key={v}
            role="tab"
            aria-selected={vista === v}
            onClick={() => navigate({ search: { vista: v, q: search.q }, replace: true })}
            className={cn(
              "rounded px-4 py-1.5 text-sm font-medium transition-colors",
              vista === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {v === "inmuebles" ? "Inmuebles" : "Habitaciones"}
          </button>
        ))}
      </div>

      <div className="mb-4 grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-foreground">Buscar</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              value={q}
              onChange={(e) => update({ q: e.target.value || undefined })}
              placeholder={vista === "habitaciones" ? "Código o inmueble (p. ej. OLI-01)" : "Nombre o código"}
              className={cn(fieldClass, "pl-9")}
            />
          </span>
        </label>
        {vista === "habitaciones" && (
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-foreground">Estado</span>
            <select
              value={estado}
              onChange={(e) => update({ estado: e.target.value === "todas" ? undefined : (e.target.value as RoomStatus) })}
              className={fieldClass}
            >
              <option value="todas">Todos</option>
              {ROOM_STATUSES.map((s) => <option key={s} value={s}>{statusMeta[s].label}</option>)}
            </select>
          </label>
        )}
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-foreground">Ordenar por</span>
          <select
            value={vista === "habitaciones" ? roomSort : propSort}
            onChange={(e) => update({ orden: e.target.value })}
            className={fieldClass}
          >
            {(vista === "habitaciones" ? roomSorts : propertySorts).map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
        <Button variant="outline" onClick={reset} disabled={!hasFilters} className="h-10">
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> Restablecer
        </Button>
      </div>

      <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
        Mostrando <strong className="tabular text-foreground">{shown}</strong> de {total} {noun}
      </p>

      {shown === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
          <SearchX className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
          <p className="mt-2 font-medium text-foreground">No hay {noun} que coincidan</p>
          <p className="mt-1 text-sm text-muted-foreground">Prueba con otro texto o estado.</p>
          <Button variant="outline" onClick={reset} className="mt-4">
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Restablecer filtros
          </Button>
        </div>
      ) : vista === "habitaciones" ? (
        <>
          {/* Mobile cards */}
          <ul className="space-y-2 md:hidden">
            {rooms.map((r) => (
              <li key={r.id}>
                <Link to="/cartera/habitaciones/$roomId" params={{ roomId: r.id }} className="block rounded-lg border border-border bg-card p-4 hover:border-primary/40">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 font-semibold text-foreground">{r.code} <CatalogOriginBadge kind="room" id={r.id} /></span>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="mt-1 flex justify-between text-sm text-muted-foreground">
                    <span>{getProperty(data, r.propertyId)?.name}</span>
                    <span className="tabular">{formatEUR(r.monthlyRent)}/mes</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">Código</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Inmueble</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Estado</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Renta orientativa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rooms.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link to="/cartera/habitaciones/$roomId" params={{ roomId: r.id }} className={linkClass}>{r.code}</Link>{" "}<CatalogOriginBadge kind="room" id={r.id} />
                    </td>
                    <td className="px-4 py-3">
                      <Link to="/cartera/inmuebles/$propertyId" params={{ propertyId: r.propertyId }} className="rounded-sm hover:underline">
                        {getProperty(data, r.propertyId)?.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="tabular px-4 py-3 text-right">{formatEUR(r.monthlyRent)}/mes</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {properties.map((p) => {
            const s = summarizeOccupancy(roomsOf(data, p.id));
            return (
              <li key={p.id}>
                <Link to="/cartera/inmuebles/$propertyId" params={{ propertyId: p.id }} className="block rounded-lg border border-border bg-card p-5 hover:border-primary/40">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="flex flex-wrap items-center gap-2 font-semibold text-foreground">{p.name} <CatalogOriginBadge kind="property" id={p.id} /></span>
                    <span className="text-xs text-muted-foreground">{p.code}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{p.address}</p>
                  <p className="tabular mt-3 text-sm">
                    <strong>{formatPercent(s.rate)}</strong> ocupación · {s.occupied} de {s.rentable} habilitadas · {s.total} habitaciones
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
