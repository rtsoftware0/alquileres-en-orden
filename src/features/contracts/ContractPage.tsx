import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Info } from "lucide-react";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import type { Contract } from "@/features/portfolio/data/types";
import { getContact } from "@/features/contacts/selectors";
import { ContractStatusBadge } from "./components/ContractStatusBadge";
import { Breadcrumbs, PageHeader, Panel, crumbLinkClass } from "@/features/layout/PageHeader";
import { linkClass } from "@/features/layout/ui";
import { buttonVariants } from "@/components/ui/button";
import { addDays, formatCents, formatDate } from "@/lib/format";

function ContactLink({ id }: { id: string }) {
  const c = getContact(data, id);
  if (!c) return <span>{id}</span>;
  return <Link to="/contactos/$contactId" params={{ contactId: c.id }} className={linkClass}>{c.name}</Link>;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (<><dt className="text-muted-foreground">{label}</dt><dd className="min-w-0">{children}</dd></>);
}

export function ContractPage({ contract: c }: { contract: Contract }) {
  const room = data.rooms.find((r) => r.id === c.roomId)!;
  const property = data.properties.find((p) => p.id === c.propertyId)!;
  const isOwnerLandlord = property.ownerId === c.landlordId;

  return (
    <>
      <Breadcrumbs items={[{ label: "Contratos", link: <Link to="/contratos" className={crumbLinkClass}>Contratos</Link> }, { label: c.reference }]} />
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">{c.reference} <ContractStatusBadge status={c.status} /></span>}
        subtitle={<>
          <Link to="/cartera/inmuebles/$propertyId" params={{ propertyId: property.id }} className={linkClass}>{property.name}</Link>
          {" · "}
          <Link to="/cartera/habitaciones/$roomId" params={{ roomId: room.id }} className={linkClass}>Habitación {room.code}</Link>
        </>}
        actions={<Link to="/contratos" className={buttonVariants({ variant: "outline" })}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a contratos</Link>}
      />
      <p className="mb-4 flex items-start gap-2 rounded-md border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Resumen de ejemplo con datos ficticios. No es un documento jurídico.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Partes">
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
            <Row label="Arrendador">
              <ContactLink id={c.landlordId} />
              <span className="block text-xs text-muted-foreground">{isOwnerLandlord ? "Es la propietaria del inmueble." : "No es el propietario del inmueble (subarriendo de ejemplo)."}</span>
            </Row>
            <Row label={c.tenantIds.length > 1 ? "Inquilinos" : "Inquilino"}>
              {c.tenantIds.map((id, i) => <span key={id}>{i > 0 && ", "}<ContactLink id={id} /></span>)}
            </Row>
            <Row label="Avalista">{c.guarantorIds.length ? c.guarantorIds.map((id) => <ContactLink key={id} id={id} />) : <span className="text-muted-foreground">Sin avalista</span>}</Row>
            <Row label="Propietario"><ContactLink id={property.ownerId} /></Row>
          </dl>
        </Panel>
        <Panel title="Condiciones">
          <dl className="tabular grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
            <Row label="Entrada">{formatDate(c.startDate)} <span className="text-xs text-muted-foreground">(incluida)</span></Row>
            <Row label="Salida">{formatDate(c.endDate)} <span className="text-xs text-muted-foreground">(no incluida)</span></Row>
            <Row label="Último día ocupado">{formatDate(addDays(c.endDate, -1))}</Row>
            <Row label="Renta mensual"><strong>{formatCents(c.rentCents)}</strong></Row>
            <Row label="Fianza">{formatCents(c.depositCents)} <span className="text-xs text-muted-foreground">(aparte de la renta)</span></Row>
            <Row label="Vencimiento">Día {c.dueDay} de cada mes</Row>
            <Row label="Modalidad">{c.modality}</Row>
            <Row label="Firma">{c.signature}</Row>
          </dl>
        </Panel>
        <Panel title="Historial de ejemplo" className="lg:col-span-2">
          <ol className="space-y-2 text-sm">
            {c.history.map((h, i) => (
              <li key={i} className="flex gap-3"><span className="tabular w-24 shrink-0 text-muted-foreground">{formatDate(h.date)}</span><span>{h.text}</span></li>
            ))}
          </ol>
        </Panel>
      </div>
    </>
  );
}
