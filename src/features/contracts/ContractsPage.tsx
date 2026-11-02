import { Link, useNavigate } from "@tanstack/react-router";
import { FilePlus2, RotateCcw, Search, SearchX } from "lucide-react";
import { useCatalogData } from "@/features/catalog/CatalogContext";
import type { ContractStatus } from "@/features/portfolio/data/types";
import { CONTRACT_STATUSES, filterContracts, tenantNames } from "./selectors";
import { ContractStatusBadge, contractStatusMeta } from "./components/ContractStatusBadge";
import { PageHeader } from "@/features/layout/PageHeader";
import { fieldClass, linkClass } from "@/features/layout/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatCents, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ContractsSearch {
  q?: string | undefined;
  inmueble?: string | undefined;
  estado?: ContractStatus | undefined;
}

export function validateContractsSearch(input: Record<string, unknown>): ContractsSearch {
  const raw = input as { q?: unknown; inmueble?: unknown; estado?: unknown };
  return {
    q: typeof raw.q === "string" && raw.q ? raw.q.slice(0, 80) : undefined,
    // Existence is resolved on screen against the current catalog (new IDs never widen to all).
    inmueble: typeof raw.inmueble === "string" && raw.inmueble.trim() !== "" && raw.inmueble.length <= 80 ? raw.inmueble : undefined,
    estado: CONTRACT_STATUSES.includes(raw.estado as ContractStatus) ? (raw.estado as ContractStatus) : undefined,
  };
}

export function ContractsPage({ search }: { search: ContractsSearch }) {
  const data = useCatalogData();
  const navigate = useNavigate({ from: "/contratos/" });
  const q = search.q ?? "";
  const propertyId = search.inmueble ?? "todos";
  const status = search.estado ?? "todos";
  const list = filterContracts(data, { q, propertyId, status });
  const update = (patch: ContractsSearch) => navigate({ search: (prev: ContractsSearch) => ({ ...prev, ...patch }), replace: true });
  const reset = () => navigate({ search: {}, replace: true });
  const hasFilters = Boolean(q) || propertyId !== "todos" || status !== "todos";
  const roomCode = (id: string) => data.rooms.find((r) => r.id === id)?.code ?? id;
  const propName = (id: string) => data.properties.find((p) => p.id === id)?.name ?? id;
  const unknownProperty = propertyId !== "todos" && !data.properties.some((p) => p.id === propertyId);

  return (
    <>
      <PageHeader
        title="Contratos"
        subtitle={`${data.contracts.length} contratos de ejemplo`}
        actions={<Link to="/contratos/borrador" className={buttonVariants()}><FilePlus2 className="h-4 w-4" aria-hidden="true" /> Preparar borrador</Link>}
      />

      <div className="mb-4 grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Buscar</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input type="search" value={q} onChange={(e) => update({ q: e.target.value || undefined })} placeholder="Referencia, habitación o inquilino" className={cn(fieldClass, "pl-9")} />
          </span>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Inmueble</span>
          <select value={propertyId} onChange={(e) => update({ inmueble: e.target.value === "todos" ? undefined : e.target.value })} className={fieldClass}>
            <option value="todos">Todos</option>
            {unknownProperty && <option value={propertyId}>Inmueble no encontrado</option>}
            {data.properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Estado</span>
          <select value={status} onChange={(e) => update({ estado: e.target.value === "todos" ? undefined : (e.target.value as ContractStatus) })} className={fieldClass}>
            <option value="todos">Todos</option>
            {CONTRACT_STATUSES.map((s) => <option key={s} value={s}>{contractStatusMeta[s].label}</option>)}
          </select>
        </label>
        <Button variant="outline" onClick={reset} disabled={!hasFilters} className="h-10"><RotateCcw className="h-4 w-4" aria-hidden="true" /> Restablecer</Button>
      </div>

      <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
        Mostrando <strong className="tabular text-foreground">{list.length}</strong> de {data.contracts.length} contratos
      </p>

      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
          <SearchX className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
          <p className="mt-2 font-medium">{unknownProperty ? "Inmueble no encontrado" : "No hay contratos que coincidan"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{unknownProperty ? "Este inmueble no existe en el catálogo actual; no se muestra ningún contrato." : "Prueba con otra búsqueda, inmueble o estado."}</p>
          <Button variant="outline" onClick={reset} className="mt-4"><RotateCcw className="h-4 w-4" aria-hidden="true" /> Restablecer filtros</Button>
        </div>
      ) : (
        <>
          <ul className="space-y-2 md:hidden">
            {list.map((c) => (
              <li key={c.id}>
                <Link to="/contratos/$contractId" params={{ contractId: c.id }} className="block rounded-lg border border-border bg-card p-4 hover:border-primary/40">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold">{c.reference}</span>
                    <ContractStatusBadge status={c.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{propName(c.propertyId)} · {roomCode(c.roomId)} · {tenantNames(data, c)}</p>
                  <p className="tabular mt-1 text-sm">{formatDate(c.startDate)} – salida {formatDate(c.endDate)} · {formatCents(c.rentCents)}/mes</p>
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">Referencia</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Habitación</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Inquilino</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Entrada – salida</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Renta</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3"><Link to="/contratos/$contractId" params={{ contractId: c.id }} className={linkClass}>{c.reference}</Link></td>
                    <td className="px-4 py-3">{roomCode(c.roomId)} <span className="text-muted-foreground">· {propName(c.propertyId)}</span></td>
                    <td className="px-4 py-3">{tenantNames(data, c)}</td>
                    <td className="tabular px-4 py-3 whitespace-nowrap">{formatDate(c.startDate)} – {formatDate(c.endDate)}</td>
                    <td className="tabular px-4 py-3 text-right">{formatCents(c.rentCents)}</td>
                    <td className="px-4 py-3"><ContractStatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
