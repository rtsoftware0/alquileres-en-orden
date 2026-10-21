import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, FileText } from "lucide-react";
import { demoPortfolio as data } from "./data/demo-data";
import type { Room } from "./data/types";
import { getProperty, incidentsFor, pendingForRoom } from "./selectors";
import { StatusBadge } from "./components/StatusBadge";
import { Breadcrumbs, CarteraCrumb, PageHeader, Panel, crumbLinkClass } from "@/features/layout/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatEUR } from "@/lib/format";

const statusContextTitle = {
  disponible: "Disponible",
  reservada: "Reserva de ejemplo",
  bloqueada: "Fuera de alquiler",
} as const;

export function RoomPage({ room }: { room: Room }) {
  const property = getProperty(data, room.propertyId)!;
  const pending = pendingForRoom(data, room.id);
  const incidents = incidentsFor(data, property.id, room.id);
  const propertyLink = (
    <Link to="/cartera/inmuebles/$propertyId" params={{ propertyId: property.id }} className={crumbLinkClass}>
      {property.name}
    </Link>
  );

  return (
    <>
      <Breadcrumbs items={[{ label: "Cartera", link: <CarteraCrumb /> }, { label: property.name, link: propertyLink }, { label: room.code }]} />
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">Habitación {room.code} <StatusBadge status={room.status} /></span>}
        subtitle={<>En <Link to="/cartera/inmuebles/$propertyId" params={{ propertyId: property.id }} className="rounded-sm font-medium text-primary hover:underline">{property.name}</Link></>}
        actions={
          <Link to="/cartera/inmuebles/$propertyId" params={{ propertyId: property.id }} className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a {property.name}
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Datos de la habitación">
          <dl className="tabular grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-muted-foreground">Renta orientativa</dt>
            <dd className="font-semibold">{formatEUR(room.monthlyRent)}/mes</dd>
            <dt className="text-muted-foreground">Superficie</dt>
            <dd>{room.areaM2} m²</dd>
          </dl>
          <h3 className="mt-5 mb-2 text-xs font-semibold text-muted-foreground uppercase">Características</h3>
          <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
            {room.features.map((f) => (
              <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />{f}</li>
            ))}
          </ul>
        </Panel>

        {room.status === "ocupada" && room.contract ? (
          <Panel title={<span className="inline-flex items-center gap-2"><FileText className="h-4 w-4" aria-hidden="true" />Contrato de ejemplo</span>}>
            <dl className="tabular grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Referencia</dt><dd className="font-medium">{room.contract.reference}</dd>
              <dt className="text-muted-foreground">Inicio</dt><dd>{formatDate(room.contract.startDate)}</dd>
              <dt className="text-muted-foreground">Fin</dt><dd>{formatDate(room.contract.endDate)}</dd>
              <dt className="text-muted-foreground">Renta</dt><dd>{formatEUR(room.monthlyRent)}/mes</dd>
            </dl>
            {pending.length > 0 && (
              <div className="mt-4 rounded-md bg-muted p-3 text-sm">
                {pending.map((b) => (
                  <p key={b.id}>Saldo pendiente de ejemplo: <strong className="tabular">{formatEUR(b.amount)}</strong> · {b.concept}</p>
                ))}
              </div>
            )}
          </Panel>
        ) : (
          room.status !== "ocupada" && (
            <Panel title={statusContextTitle[room.status]}>
              <p className="text-sm text-muted-foreground">{room.statusNote}</p>
              <p className="mt-2 text-sm text-muted-foreground">Sin contrato vigente a {formatDate(data.referenceDate)}.</p>
              {incidents.map((i) => (
                <p key={i.id} className="mt-3 rounded-md bg-muted p-3 text-sm">
                  Incidencia de ejemplo: <strong>{i.title}</strong> · desde {formatDate(i.openedOn)}
                </p>
              ))}
            </Panel>
          )
        )}
        {room.status === "ocupada" && incidents.length > 0 && (
          <Panel title="Incidencias de ejemplo" className="lg:col-span-2">
            {incidents.map((i) => (
              <p key={i.id} className="text-sm"><strong>{i.title}</strong> · desde {formatDate(i.openedOn)} — <span className="text-muted-foreground">{i.description}</span></p>
            ))}
          </Panel>
        )}
      </div>
    </>
  );
}
