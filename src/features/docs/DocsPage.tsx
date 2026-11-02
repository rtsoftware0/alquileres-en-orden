import { Link, useNavigate } from "@tanstack/react-router";
import { FilePlus2, Search, SearchX } from "lucide-react";
import { useCatalogData } from "@/features/catalog/CatalogContext";
import type { DocLinkKind } from "@/features/portfolio/data/types";
import { currentVersion, docCategories, docLinkKindLabel, docLinkLabel, filterDocuments, visibilityLabel } from "./selectors";
import { PageHeader } from "@/features/layout/PageHeader";
import { fieldClass, linkClass } from "@/features/layout/ui";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface DocsSearch {
  q?: string | undefined;
  categoria?: string | undefined;
  inmueble?: string | undefined;
  tipo?: DocLinkKind | undefined;
}

// Syntactically valid property IDs are kept (new or unknown); existence is resolved in the page.
const isId = (v: unknown): v is string => typeof v === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(v);

export function validateDocsSearch(input: Record<string, unknown>): DocsSearch {
  return {
    q: typeof input["q"] === "string" && input["q"] ? input["q"].slice(0, 80) : undefined,
    categoria: typeof input["categoria"] === "string" && docCategories.includes(input["categoria"]) ? input["categoria"] : undefined,
    inmueble: isId(input["inmueble"]) ? input["inmueble"] : undefined,
    tipo: ["contrato", "incidencia", "gasto", "inmueble"].includes(input["tipo"] as string) ? (input["tipo"] as DocLinkKind) : undefined,
  };
}

export function DocsPage({ search }: { search: DocsSearch }) {
  const data = useCatalogData();
  const navigate = useNavigate({ from: "/documentos/" });
  const update = (patch: DocsSearch) => navigate({ search: (prev: DocsSearch) => ({ ...prev, ...patch }), replace: true });
  const q = search.q ?? "";
  const list = filterDocuments(data, {
    q,
    category: search.categoria ?? "todas",
    propertyId: search.inmueble ?? "todos",
    linkKind: search.tipo ?? "todos",
  });
  const unknownProperty = Boolean(search.inmueble && !data.properties.some((p) => p.id === search.inmueble));
  const active = Boolean(q || search.categoria || search.inmueble || search.tipo);

  return (
    <>
      <PageHeader
        title="Documentos"
        subtitle={`Biblioteca de ejemplo: ${data.documents.length} documentos ficticios incorporados. Nada se sube ni se descarga.`}
        actions={<Link to="/documentos/preparar" className={buttonVariants()}><FilePlus2 className="h-4 w-4" aria-hidden="true" /> Preparar documento de ejemplo</Link>}
      />

      <div className="mb-4 rounded-lg border border-border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Buscar</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input type="search" value={q} onChange={(e) => update({ q: e.target.value || undefined })} placeholder="Título o registro" className={cn(fieldClass, "pl-9")} />
            </span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Categoría</span>
            <select value={search.categoria ?? "todas"} onChange={(e) => update({ categoria: e.target.value === "todas" ? undefined : e.target.value })} className={fieldClass}>
              <option value="todas">Todas</option>
              {docCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Inmueble</span>
            <select value={search.inmueble ?? "todos"} onChange={(e) => update({ inmueble: e.target.value === "todos" ? undefined : e.target.value })} className={fieldClass}>
              <option value="todos">Todos</option>
              {unknownProperty && <option value={search.inmueble}>Inmueble no encontrado</option>}
              {data.properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Registro relacionado</span>
            <select value={search.tipo ?? "todos"} onChange={(e) => update({ tipo: e.target.value === "todos" ? undefined : (e.target.value as DocLinkKind) })} className={fieldClass}>
              <option value="todos">Todos</option>
              {(Object.keys(docLinkKindLabel) as DocLinkKind[]).map((k) => <option key={k} value={k}>{docLinkKindLabel[k]}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => navigate({ search: {}, replace: true })} disabled={!active} className={cn(linkClass, "h-10 text-sm disabled:pointer-events-none disabled:opacity-50")}>Restablecer</button>
        </div>
      </div>

      {unknownProperty && (
        <p role="status" className="mb-3 rounded-md border border-border bg-card px-3 py-2 text-sm">
          El inmueble del filtro no existe en la cartera actual; no se muestran resultados. Restablece los filtros para ver todos los documentos.
        </p>
      )}
      <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
        Mostrando <strong className="tabular text-foreground">{list.length}</strong> de {data.documents.length} documentos
      </p>

      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
          <SearchX className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
          <p className="mt-2 font-medium">No hay documentos que coincidan</p>
          <p className="mt-1 text-sm text-muted-foreground">Cambia la búsqueda o restablece los filtros.</p>
          {active && <button type="button" onClick={() => navigate({ search: {}, replace: true })} className={cn(linkClass, "mt-3 text-sm")}>Quitar todos los filtros</button>}
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((doc) => {
            const v = currentVersion(doc);
            return (
              <li key={doc.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link to="/documentos/$documentId" params={{ documentId: doc.id }} className={cn(linkClass, "text-sm")}>{doc.title}</Link>
                  <span className="text-xs text-muted-foreground">{visibilityLabel[doc.visibility]}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {doc.category} · {docLinkKindLabel[doc.link.kind]}: {docLinkLabel(data, doc)} · versión actual v{v.version} ({formatDate(v.date)})
                  {doc.versions.length > 1 && ` · ${doc.versions.length} versiones`}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
