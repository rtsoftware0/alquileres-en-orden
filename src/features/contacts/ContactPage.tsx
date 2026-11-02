import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { Contact } from "@/features/portfolio/data/types";
import type { CatalogContact } from "@/features/catalog/types";
import { CatalogNotice, CatalogOriginBadge, useCatalog, useCatalogData } from "@/features/catalog/CatalogContext";
import { contractsOfContact, incidentsOfProvider, propertiesOwnedBy } from "./selectors";
import { RoleChips, TypeLabel } from "./ContactsPage";
import { ContractStatusBadge } from "@/features/contracts/components/ContractStatusBadge";
import { Breadcrumbs, PageHeader, Panel, crumbLinkClass } from "@/features/layout/PageHeader";
import { linkClass } from "@/features/layout/ui";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/format";
import { hasTenantAccount, tenantAccount } from "@/features/money/selectors";
import { hasProviderAccount, providerAccount } from "@/features/money/expenses";

export function ContactPage({ contact: contactProp }: { contact: Contact }) {
  const data = useCatalogData();
  const { isAdded } = useCatalog();
  const contact: CatalogContact = contactProp;
  const added = isAdded("contact", contact.id);
  const contracts = contractsOfContact(data, contact.id);
  const owned = propertiesOwnedBy(data, contact.id);
  const incidents = incidentsOfProvider(data, contact.id);
  const roomCode = (id: string) => data.rooms.find((r) => r.id === id)?.code ?? id;

  return (
    <>
      <Breadcrumbs items={[{ label: "Contactos", link: <Link to="/contactos" className={crumbLinkClass}>Contactos</Link> }, { label: contact.name }]} />
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">{contact.name} <CatalogOriginBadge kind="contact" id={contact.id} /></span>}
        subtitle={<span className="flex flex-wrap items-center gap-2">{contact.code} · <TypeLabel type={contact.type} /></span>}
        actions={<Link to="/contactos" className={buttonVariants({ variant: "outline" })}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a contactos</Link>}
      />
      <CatalogNotice />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Panel title="Datos de ejemplo">
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
            <dt className="text-muted-foreground">Roles</dt><dd><RoleChips roles={contact.roles} /></dd>
            <dt className="text-muted-foreground">Tipo</dt><dd>{contact.type === "empresa" ? "Empresa" : "Persona"}</dd>
            {contact.email && (<><dt className="text-muted-foreground">Email</dt><dd className="break-all">{contact.email} <span className="text-xs text-muted-foreground">(ficticio)</span></dd></>)}
            {contact.phone && (<><dt className="text-muted-foreground">Teléfono</dt><dd>{contact.phone} <span className="text-xs text-muted-foreground">(ficticio)</span></dd></>)}
            {contact.address && (<><dt className="text-muted-foreground">Dirección</dt><dd>{contact.address} <span className="text-xs text-muted-foreground">(ficticia)</span></dd></>)}
          </dl>
          {contact.note && <p className="mt-4 text-sm text-muted-foreground">{contact.note}</p>}
          {added && <p className="mt-4 text-sm text-muted-foreground">Alta temporal: sin contratos, cobros ni gastos, y sin acceso a ningún portal.</p>}
        </Panel>

        <div className="space-y-4">
          <Panel title={`Contratos (${contracts.length})`}>
            {contracts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin contratos vinculados.</p>
            ) : (
              <ul className="divide-y divide-border">
                {contracts.map(({ contract: c, parts }) => (
                  <li key={c.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                    <span className="min-w-0 text-sm">
                      <Link to="/contratos/$contractId" params={{ contractId: c.id }} className={linkClass}>{c.reference}</Link>
                      {" · "}
                      <Link to="/cartera/habitaciones/$roomId" params={{ roomId: c.roomId }} className={linkClass}>{roomCode(c.roomId)}</Link>
                      <span className="block text-xs text-muted-foreground">{parts.join(" y ")} · {formatDate(c.startDate)} – salida {formatDate(c.endDate)}</span>
                    </span>
                    <ContractStatusBadge status={c.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          {hasTenantAccount(data, contact.id) && (
            <Panel title="Dinero como inquilino">
              <p className="text-sm">Pendiente de cobro de ejemplo: <strong className="tabular">{formatMoney(tenantAccount(data, contact.id).pendingCents)}</strong></p>
              {contracts.some((x) => x.parts.includes("Avalista")) && (
                <p className="mt-1 text-xs text-muted-foreground">Solo cuenta su deuda como inquilino; ser avalista no le atribuye la de otros contratos.</p>
              )}
              <Link to="/dinero/inquilinos/$contactId" params={{ contactId: contact.id }} className="mt-2 inline-block rounded-sm text-sm font-medium text-primary hover:underline">Ver cuenta del inquilino</Link>
            </Panel>
          )}
          {hasProviderAccount(data, contact.id) && (
            <Panel title="Dinero como proveedor">
              <p className="text-sm">Pendiente a este proveedor (ejemplo): <strong className="tabular">{formatMoney(providerAccount(data, contact.id).pendingCents)}</strong></p>
              <Link to="/dinero/proveedores/$contactId" params={{ contactId: contact.id }} className="mt-2 inline-block rounded-sm text-sm font-medium text-primary hover:underline">Ver cuenta de proveedor</Link>
            </Panel>
          )}
          {owned.length > 0 && (
            <Panel title="Inmuebles en propiedad">
              <ul className="space-y-1 text-sm">
                {owned.map((p) => <li key={p.id}><Link to="/cartera/inmuebles/$propertyId" params={{ propertyId: p.id }} className={linkClass}>{p.name}</Link></li>)}
              </ul>
            </Panel>
          )}
          {incidents.length > 0 && (
            <Panel title="Incidencias asignadas (ejemplo)">
              <ul className="space-y-2 text-sm">
                {incidents.map((i) => (
                  <li key={i.id}>
                    <strong>{i.title}</strong> · desde {formatDate(i.openedOn)}
                    {i.roomId && <> · <Link to="/cartera/habitaciones/$roomId" params={{ roomId: i.roomId }} className={linkClass}>{roomCode(i.roomId)}</Link></>}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
