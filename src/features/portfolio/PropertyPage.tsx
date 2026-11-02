import { Link } from "@tanstack/react-router";
import { ArrowLeft, MapPin } from "lucide-react";
import type { Property } from "./data/types";
import type { CatalogProperty } from "@/features/catalog/types";
import { CatalogNotice, CatalogOriginBadge, useCatalog, useCatalogData } from "@/features/catalog/CatalogContext";
import { getContact } from "@/features/contacts/selectors";
import { incidentsFor, roomsOf, summarizeOccupancy } from "./selectors";
import { StatusBadge } from "./components/StatusBadge";
import { OccupancySummary } from "./components/OccupancySummary";
import { Breadcrumbs, CarteraCrumb, PageHeader, Panel } from "@/features/layout/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatEUR, formatMoney } from "@/lib/format";
import { pendingCents } from "@/features/money/selectors";

export function PropertyPage({ property: prop }: { property: Property }) {
  const data = useCatalogData();
  const { isAdded } = useCatalog();
  const property: CatalogProperty = prop;
  const added = isAdded("property", property.id);
  const owner = getContact(data, property.ownerId);
  const kindLabel = { vivienda: "Vivienda", edificio: "Edificio", local: "Local" } as const;
  const details: [string, string][] = [
    ["Código", property.code],
    ...(property.kind ? [["Tipo", kindLabel[property.kind]] as [string, string]] : []),
    ...(property.portfolioLabel ? [["Cartera", property.portfolioLabel] as [string, string]] : []),
    ...(property.companyLabel ? [["Sociedad", property.companyLabel] as [string, string]] : []),
    ...(property.managerName ? [["Responsable", property.managerName] as [string, string]] : []),
  ];
  const rooms = roomsOf(data, property.id);
  const incidents = incidentsFor(data, property.id);
  return (
    <>
      <Breadcrumbs items={[{ label: "Cartera", link: <CarteraCrumb /> }, { label: property.name }]} />
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">{property.name} <CatalogOriginBadge kind="property" id={property.id} /></span>}
        subtitle={<span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />{property.address}</span>}
        actions={
          <Link to="/cartera" search={{ vista: "inmuebles" }} className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a cartera
          </Link>
        }
      />
      <CatalogNotice />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-4">
          <Panel title="Ocupación"><OccupancySummary s={summarizeOccupancy(rooms)} /></Panel>
          <Panel title="Datos del inmueble">
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
              {details.map(([k, v]) => (<><dt key={`${k}-t`} className="text-muted-foreground">{k}</dt><dd key={`${k}-d`}>{v}</dd></>))}
            </dl>
          </Panel>
          <Panel title="Propietario">
            {owner ? (
              <Link to="/contactos/$contactId" params={{ contactId: owner.id }} className="rounded-sm text-sm font-medium text-primary hover:underline">
                {owner.name}
              </Link>
            ) : <p className="text-sm text-muted-foreground">Sin propietario disponible.</p>}
            <p className="mt-1 text-xs text-muted-foreground">Indicar un propietario no concede acceso a ningún portal.</p>
          </Panel>
          <Panel title="Dinero">
            {added ? (
              <p className="text-sm text-muted-foreground">Sin movimientos: este inmueble es un alta temporal y no tiene contratos, cobros ni gastos en la demostración.</p>
            ) : (<>
            <p className="text-sm">
              Pendiente de cobro de ejemplo: <strong className="tabular">{formatMoney(pendingCents(data, { propertyId: property.id }))}</strong>
            </p>
            <Link to="/dinero" search={{ inmueble: property.id }} className="mt-2 inline-block rounded-sm text-sm font-medium text-primary hover:underline">Ver dinero de {property.name}</Link>
            </>)}
          </Panel>
          {incidents.length > 0 && (
            <Panel title="Incidencias de ejemplo">
              <ul className="space-y-3 text-sm">
                {incidents.map((i) => (
                  <li key={i.id}>
                    <p className="font-medium">
                      <Link to="/incidencias/$incidentId" params={{ incidentId: i.id }} className="rounded-sm text-primary hover:underline">{i.title}</Link>{" "}
                      <span className="font-normal text-muted-foreground">· desde {formatDate(i.openedOn)}</span>
                    </p>
                    <p className="text-muted-foreground">{i.description}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
        <Panel title={`Habitaciones (${rooms.length})`}>
          <ul className="divide-y divide-border">
            {rooms.map((r) => (
              <li key={r.id}>
                <Link
                  to="/cartera/habitaciones/$roomId"
                  params={{ roomId: r.id }}
                  className="flex items-center justify-between gap-3 rounded-sm px-1 py-3 hover:bg-muted/40"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 font-medium text-primary">{r.code} <CatalogOriginBadge kind="room" id={r.id} /></span>
                    <span className="tabular block text-xs text-muted-foreground">{r.areaM2 ? `${r.areaM2} m²` : "Superficie sin indicar"} · {formatEUR(r.monthlyRent)}/mes</span>
                  </span>
                  <StatusBadge status={r.status} />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
