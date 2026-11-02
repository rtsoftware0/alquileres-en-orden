import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, FileText } from "lucide-react";
import type { Room } from "./data/types";
import type { CatalogRoom } from "@/features/catalog/types";
import { NotFoundMessage } from "@/features/layout/NotFound";
import { CatalogNotice, CatalogOriginBadge, useCatalog, useCatalogData } from "@/features/catalog/CatalogContext";
import { getProperty, incidentsFor, pendingForRoom } from "./selectors";
import { StatusBadge } from "./components/StatusBadge";
import { Breadcrumbs, CarteraCrumb, PageHeader, Panel, crumbLinkClass } from "@/features/layout/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { CatalogEditPanel } from "@/features/catalog/ContactForm";
import { RoomForm } from "@/features/catalog/RoomForm";
import { addDays, formatCents, formatDate, formatEUR } from "@/lib/format";
import { activeContractForRoom, contractsForRoom, tenantNames } from "@/features/contracts/selectors";
import { ContractStatusBadge } from "@/features/contracts/components/ContractStatusBadge";

const statusContextTitle = {
  disponible: "Disponible",
  reservada: "Reserva de ejemplo",
  bloqueada: "Fuera de alquiler",
} as const;

const unitKindLabel = { habitacion: "Habitación", vivienda_completa: "Vivienda completa", estudio: "Estudio" } as const;

export function RoomPage({ room: roomProp }: { room: Room }) {
  const data = useCatalogData();
  const { isAdded } = useCatalog();
  const room: CatalogRoom = roomProp;
  const added = isAdded("room", room.id);
  const property = getProperty(data, room.propertyId);
  if (!property) return <NotFoundMessage title="Inmueble no encontrado" text="El inmueble de esta unidad no existe en la cartera de ejemplo." />;
  const pending = pendingForRoom(data, room.id);
  const incidents = incidentsFor(data, property.id, room.id);
  const active = activeContractForRoom(data, room.id);
  const others = contractsForRoom(data, room.id).filter((c) => c.id !== active?.id);
  const propertyLink = (
    <Link to="/cartera/inmuebles/$propertyId" params={{ propertyId: property.id }} className={crumbLinkClass}>
      {property.name}
    </Link>
  );

  return (
    <>
      <Breadcrumbs items={[{ label: "Cartera", link: <CarteraCrumb /> }, { label: property.name, link: propertyLink }, { label: room.code }]} />
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">{room.unitKind ? unitKindLabel[room.unitKind] : "Habitación"} {room.code} <StatusBadge status={room.status} /> <CatalogOriginBadge kind="room" id={room.id} /></span>}
        subtitle={<>En <Link to="/cartera/inmuebles/$propertyId" params={{ propertyId: property.id }} className="rounded-sm font-medium text-primary hover:underline">{property.name}</Link></>}
        actions={
          <Link to="/cartera/inmuebles/$propertyId" params={{ propertyId: property.id }} className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a {property.name}
          </Link>
        }
      />

      <CatalogNotice />
      <CatalogEditPanel recordId={room.id} title="Editar unidad (temporal)">
        {(close) => <RoomForm roomId={room.id} onSaved={close} onCancel={close} />}
      </CatalogEditPanel>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Datos de la habitación">
          <dl className="tabular grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-muted-foreground">Renta orientativa</dt>
            <dd className="font-semibold">{formatEUR(room.monthlyRent)}/mes</dd>
            <dt className="text-muted-foreground">Superficie</dt>
            <dd>{room.areaM2 ? `${room.areaM2} m²` : "Sin indicar"}</dd>
            {room.unitKind && (<><dt className="text-muted-foreground">Tipo</dt><dd>{unitKindLabel[room.unitKind]}</dd></>)}
            {room.capacity !== undefined && (<><dt className="text-muted-foreground">Capacidad</dt><dd>{room.capacity} {room.capacity === 1 ? "persona" : "personas"}</dd></>)}
          </dl>
          <h3 className="mt-5 mb-2 text-xs font-semibold text-muted-foreground uppercase">Características</h3>
          {room.features.length === 0 && <p className="text-sm text-muted-foreground">Sin características indicadas.</p>}
          <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
            {room.features.map((f) => (
              <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />{f}</li>
            ))}
          </ul>
        </Panel>

        {room.status === "ocupada" && active ? (
          <Panel title={<span className="inline-flex items-center gap-2"><FileText className="h-4 w-4" aria-hidden="true" />Contrato vigente de ejemplo</span>}>
            <dl className="tabular grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Referencia</dt>
              <dd><Link to="/contratos/$contractId" params={{ contractId: active.id }} className="rounded-sm font-medium text-primary hover:underline">{active.reference}</Link></dd>
              <dt className="text-muted-foreground">Inquilino</dt>
              <dd>{active.tenantIds.map((id) => <Link key={id} to="/contactos/$contactId" params={{ contactId: id }} className="rounded-sm font-medium text-primary hover:underline">{tenantNames(data, { ...active, tenantIds: [id] })}</Link>)}</dd>
              <dt className="text-muted-foreground">Entrada</dt><dd>{formatDate(active.startDate)}</dd>
              <dt className="text-muted-foreground">Último día ocupado</dt><dd>{formatDate(addDays(active.endDate, -1))}</dd>
              <dt className="text-muted-foreground">Renta</dt><dd>{formatCents(active.rentCents)}/mes</dd>
            </dl>
            {pending.length > 0 && (
              <div className="mt-4 rounded-md bg-muted p-3 text-sm">
                {pending.map((b) => (
                  <p key={b.contractId}>Saldo pendiente de ejemplo: <strong className="tabular">{formatCents(b.cents)}</strong> · {b.concept}{" · "}<Link to="/dinero/inquilinos/$contactId" params={{ contactId: b.payerId }} search={{ contrato: b.contractId }} className="rounded-sm font-medium text-primary hover:underline">Ver cuenta del inquilino</Link></p>
                ))}
              </div>
            )}
          </Panel>
        ) : (
          room.status !== "ocupada" && (
            <Panel title={statusContextTitle[room.status]}>
              <p className="text-sm text-muted-foreground">{room.statusNote ?? (added ? "Alta temporal disponible: sin contratos, reservas, cobros ni gastos. La renta orientativa no crea ni altera ningún contrato." : "")}</p>
              <p className="mt-2 text-sm text-muted-foreground">Sin contrato vigente a {formatDate(data.referenceDate)}.</p>
              {others.filter((c) => c.status === "pendiente" || c.status === "borrador").map((c) => (
                <p key={c.id} className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <Link to="/contratos/$contractId" params={{ contractId: c.id }} className="rounded-sm font-medium text-primary hover:underline">{c.reference}</Link>
                  <ContractStatusBadge status={c.status} />
                  <span className="text-muted-foreground">no genera ocupación</span>
                </p>
              ))}
              {incidents.map((i) => (
                <p key={i.id} className="mt-3 rounded-md bg-muted p-3 text-sm">
                  Incidencia de ejemplo: <Link to="/incidencias/$incidentId" params={{ incidentId: i.id }} className="rounded-sm font-medium text-primary hover:underline">{i.title}</Link> · desde {formatDate(i.openedOn)}
                </p>
              ))}
            </Panel>
          )
        )}
        {room.status === "ocupada" && incidents.length > 0 && (
          <Panel title="Incidencias de ejemplo" className="lg:col-span-2">
            {incidents.map((i) => (
              <p key={i.id} className="text-sm"><Link to="/incidencias/$incidentId" params={{ incidentId: i.id }} className="rounded-sm font-medium text-primary hover:underline">{i.title}</Link> · desde {formatDate(i.openedOn)} — <span className="text-muted-foreground">{i.description}</span></p>
            ))}
          </Panel>
        )}
        {others.some((c) => c.status === "finalizado" || c.status === "cancelado") && (
          <Panel title="Otros contratos de esta habitación" className="lg:col-span-2">
            <ul className="space-y-2 text-sm">
              {others.filter((c) => c.status === "finalizado" || c.status === "cancelado").map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-2">
                  <Link to="/contratos/$contractId" params={{ contractId: c.id }} className="rounded-sm font-medium text-primary hover:underline">{c.reference}</Link>
                  <ContractStatusBadge status={c.status} />
                  <span className="tabular text-muted-foreground">{formatDate(c.startDate)} – salida {formatDate(c.endDate)}</span>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </>
  );
}
