import { Link, useNavigate } from "@tanstack/react-router";
import { Building, RotateCcw, Search, SearchX, User } from "lucide-react";
import { CatalogNotice, CatalogOriginBadge, useCatalogData } from "@/features/catalog/CatalogContext";
import type { ContactRole } from "@/features/portfolio/data/types";
import { CONTACT_ROLES, contractsOfContact, filterContacts, roleLabel } from "./selectors";
import { PageHeader } from "@/features/layout/PageHeader";
import { chipClass, fieldClass, linkClass } from "@/features/layout/ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ContactsSearch {
  q?: string | undefined;
  rol?: ContactRole | undefined;
}

export function validateContactsSearch(input: Record<string, unknown>): ContactsSearch {
  const raw = input as { q?: unknown; rol?: unknown };
  return {
    q: typeof raw.q === "string" && raw.q ? raw.q.slice(0, 80) : undefined,
    rol: CONTACT_ROLES.includes(raw.rol as ContactRole) ? (raw.rol as ContactRole) : undefined,
  };
}

export function TypeLabel({ type }: { type: "persona" | "empresa" }) {
  const Icon = type === "empresa" ? Building : User;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {type === "empresa" ? "Empresa" : "Persona"}
    </span>
  );
}

export function RoleChips({ roles }: { roles: ContactRole[] }) {
  return (
    <span className="flex flex-wrap gap-1">
      {roles.map((r) => <span key={r} className={chipClass}>{roleLabel[r]}</span>)}
    </span>
  );
}

export function ContactsPage({ search }: { search: ContactsSearch }) {
  const navigate = useNavigate({ from: "/contactos/" });
  const data = useCatalogData();
  const q = search.q ?? "";
  const role = search.rol ?? "todos";
  const list = filterContacts(data, { q, role });
  const update = (patch: ContactsSearch) => navigate({ search: (prev: ContactsSearch) => ({ ...prev, ...patch }), replace: true });
  const reset = () => navigate({ search: {}, replace: true });
  const hasFilters = Boolean(q) || role !== "todos";

  return (
    <>
      <PageHeader title="Contactos" subtitle={`${data.contacts.length} contactos de ejemplo · personas y empresas`} />
      <CatalogNotice />

      <div className="mb-4 grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] sm:items-end">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Buscar</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input type="search" value={q} onChange={(e) => update({ q: e.target.value || undefined })} placeholder="Nombre o código (p. ej. CON-003)" className={cn(fieldClass, "pl-9")} />
          </span>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Rol</span>
          <select value={role} onChange={(e) => update({ rol: e.target.value === "todos" ? undefined : (e.target.value as ContactRole) })} className={fieldClass}>
            <option value="todos">Todos</option>
            {CONTACT_ROLES.map((r) => <option key={r} value={r}>{roleLabel[r]}</option>)}
          </select>
        </label>
        <Button variant="outline" onClick={reset} disabled={!hasFilters} className="h-10">
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> Restablecer
        </Button>
      </div>

      <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
        Mostrando <strong className="tabular text-foreground">{list.length}</strong> de {data.contacts.length} contactos
      </p>

      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
          <SearchX className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
          <p className="mt-2 font-medium">No hay contactos que coincidan</p>
          <p className="mt-1 text-sm text-muted-foreground">Prueba con otro nombre, código o rol.</p>
          <Button variant="outline" onClick={reset} className="mt-4"><RotateCcw className="h-4 w-4" aria-hidden="true" /> Restablecer filtros</Button>
        </div>
      ) : (
        <>
          <ul className="space-y-2 md:hidden">
            {list.map((c) => (
              <li key={c.id}>
                <Link to="/contactos/$contactId" params={{ contactId: c.id }} className="block rounded-lg border border-border bg-card p-4 hover:border-primary/40">
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0 font-semibold">{c.name} <CatalogOriginBadge kind="contact" id={c.id} /></span>
                    <span className="shrink-0 text-xs text-muted-foreground">{c.code}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2"><TypeLabel type={c.type} /><RoleChips roles={c.roles} /></div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">Código</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Nombre</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Tipo</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Roles</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Contratos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 text-muted-foreground">{c.code}</td>
                    <td className="px-4 py-3"><Link to="/contactos/$contactId" params={{ contactId: c.id }} className={linkClass}>{c.name}</Link>{" "}<CatalogOriginBadge kind="contact" id={c.id} /></td>
                    <td className="px-4 py-3"><TypeLabel type={c.type} /></td>
                    <td className="px-4 py-3"><RoleChips roles={c.roles} /></td>
                    <td className="tabular px-4 py-3 text-right">{contractsOfContact(data, c.id).length}</td>
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
