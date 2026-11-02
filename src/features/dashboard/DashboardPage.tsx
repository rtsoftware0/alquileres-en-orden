import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, CalendarDays } from "lucide-react";
import { useCatalog, useCatalogData } from "@/features/catalog/CatalogContext";
import { getProperty, getRoom, summarizeOccupancy, totalPending } from "@/features/portfolio/selectors";
import { OccupancySummary } from "@/features/portfolio/components/OccupancySummary";
import { PageHeader, Panel } from "@/features/layout/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { formatCents, formatDate } from "@/lib/format";
import { pendingByRoom } from "@/features/money/selectors";

const linkClass = "rounded-sm font-medium text-primary hover:underline";

function PlaceLinks({ propertyId, roomId }: { propertyId: string; roomId?: string | undefined }) {
  const data = useCatalogData();
  const property = getProperty(data, propertyId);
  const room = roomId ? getRoom(data, roomId) : undefined;
  return (
    <span className="text-sm">
      <Link to="/cartera/inmuebles/$propertyId" params={{ propertyId }} className={linkClass}>{property?.name ?? propertyId}</Link>
      {room && (
        <>
          {" · "}
          <Link to="/cartera/habitaciones/$roomId" params={{ roomId: room.id }} className={linkClass}>{room.code}</Link>
        </>
      )}
    </span>
  );
}

export function DashboardPage() {
  const { data, isAdded } = useCatalog();
  const addedUnits = data.rooms.filter((r) => isAdded("room", r.id)).length;
  const occupancy = summarizeOccupancy(data.rooms);
  const pending = totalPending(data);

  return (
    <>
      <PageHeader
        title="Inicio"
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Periodo {data.referencePeriod} · Fecha de referencia {formatDate(data.referenceDate)}
          </span>
        }
        actions={
          <Link to="/cartera" className={buttonVariants()}>
            Ver cartera <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel title="Ocupación">
          <OccupancySummary s={occupancy} />
          {addedUnits > 0 && (
            <p role="note" className="mt-3 text-xs text-muted-foreground">
              Incluye {addedUnits} {addedUnits === 1 ? "alta temporal" : "altas temporales"} de unidad sin actividad: se pierden al recargar y no cambian el dinero.
            </p>
          )}
        </Panel>

        <Panel title="Pendiente de cobro (ejemplo)">
          <p className="tabular text-3xl font-semibold text-foreground">{formatCents(pending)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {pendingByRoom(data).length} habitaciones con saldo de ejemplo a {formatDate(data.referenceDate)}
          </p>
          <ul className="mt-4 divide-y divide-border">
            {pendingByRoom(data).map((b) => {
              const room = getRoom(data, b.roomId);
              return (
                <li key={b.contractId} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    {room ? <PlaceLinks propertyId={room.propertyId} roomId={room.id} /> : <span className="text-sm">{b.roomId}</span>}
                    <p className="text-xs text-muted-foreground">{b.concept}</p>
                  </div>
                  <span className="tabular shrink-0 text-sm font-semibold">{formatCents(b.cents)}</span>
                </li>
              );
            })}
          </ul>
          <Link to="/dinero" className={`${linkClass} mt-3 inline-flex items-center gap-1 text-sm`}>Ver desglose en Dinero <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
        </Panel>
      </div>

      <Panel title="Requiere atención" className="mt-4">
        <ul className="divide-y divide-border">
          {data.incidents.map((i) => (
            <li key={i.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-reserved" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  <Link to="/incidencias/$incidentId" params={{ incidentId: i.id }} className={linkClass}>{i.title}</Link>{" "}
                  <span className="font-normal text-muted-foreground">· desde {formatDate(i.openedOn)}</span>
                </p>
                <p className="text-sm text-muted-foreground">{i.description}</p>
                <PlaceLinks propertyId={i.propertyId} roomId={i.roomId} />
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
