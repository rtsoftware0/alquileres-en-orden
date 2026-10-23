import { Link } from "@tanstack/react-router";
import { ArrowLeft, MapPin } from "lucide-react";
import { demoPortfolio as data } from "./data/demo-data";
import type { Property } from "./data/types";
import { getContact } from "@/features/contacts/selectors";
import { incidentsFor, roomsOf, summarizeOccupancy } from "./selectors";
import { StatusBadge } from "./components/StatusBadge";
import { OccupancySummary } from "./components/OccupancySummary";
import { Breadcrumbs, CarteraCrumb, PageHeader, Panel } from "@/features/layout/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatEUR, formatMoney } from "@/lib/format";
import { pendingCents } from "@/features/money/selectors";

export function PropertyPage({ property }: { property: Property }) {
  const rooms = roomsOf(data, property.id);
  const incidents = incidentsFor(data, property.id);
  return (
    <>
      <Breadcrumbs items={[{ label: "Cartera", link: <CarteraCrumb /> }, { label: property.name }]} />
      <PageHeader
        title={property.name}
        subtitle={<span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />{property.address}</span>}
        actions={
          <Link to="/cartera" search={{ vista: "inmuebles" }} className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a cartera
          </Link>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-4">
          <Panel title="Ocupación"><OccupancySummary s={summarizeOccupancy(rooms)} /></Panel>
          <Panel title="Propietario">
            <Link to="/contactos/$contactId" params={{ contactId: property.ownerId }} className="rounded-sm text-sm font-medium text-primary hover:underline">
              {getContact(data, property.ownerId)?.name}
            </Link>
          </Panel>
          <Panel title="Dinero">
            <p className="text-sm">
              Pendiente de cobro de ejemplo: <strong className="tabular">{formatMoney(pendingCents(data, { propertyId: property.id }))}</strong>
            </p>
            <Link to="/dinero" search={{ inmueble: property.id }} className="mt-2 inline-block rounded-sm text-sm font-medium text-primary hover:underline">Ver dinero de {property.name}</Link>
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
                    <span className="block font-medium text-primary">{r.code}</span>
                    <span className="tabular block text-xs text-muted-foreground">{r.areaM2} m² · {formatEUR(r.monthlyRent)}/mes</span>
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
