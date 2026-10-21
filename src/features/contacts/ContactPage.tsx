import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import type { Contact } from "@/features/portfolio/data/types";
import { contractsOfContact, incidentsOfProvider, propertiesOwnedBy } from "./selectors";
import { RoleChips, TypeLabel } from "./ContactsPage";
import { ContractStatusBadge } from "@/features/contracts/components/ContractStatusBadge";
import { Breadcrumbs, PageHeader, Panel, crumbLinkClass } from "@/features/layout/PageHeader";
import { linkClass } from "@/features/layout/ui";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

export function ContactPage({ contact }: { contact: Contact }) {
  const contracts = contractsOfContact(data, contact.id);
  const owned = propertiesOwnedBy(data, contact.id);
  const incidents = incidentsOfProvider(data, contact.id);
  const roomCode = (id: string) => data.rooms.find((r) => r.id === id)?.code ?? id;

  return (
    <>
      <Breadcrumbs items={[{ label: "Contactos", link: <Link to="/contactos" className={crumbLinkClass}>Contactos</Link> }, { label: contact.name }]} />
      <PageHeader
        title={contact.name}
        subtitle={<span className="flex flex-wrap items-center gap-2">{contact.code} · <TypeLabel type={contact.type} /></span>}
        actions={<Link to="/contactos" className={buttonVariants({ variant: "outline" })}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a contactos</Link>}
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Panel title="Datos de ejemplo">
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
            <dt className="text-muted-foreground">Roles</dt><dd><RoleChips roles={contact.roles} /></dd>
            <dt className="text-muted-foreground">Tipo</dt><dd>{contact.type === "empresa" ? "Empresa" : "Persona"}</dd>
            {contact.email && (<><dt className="text-muted-foreground">Email</dt><dd className="break-all">{contact.email} <span className="text-xs text-muted-foreground">(ficticio)</span></dd></>)}
          </dl>
          {contact.note && <p className="mt-4 text-sm text-muted-foreground">{contact.note}</p>}
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
