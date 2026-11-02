import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CalendarDays } from "lucide-react";
import { useCatalogData } from "@/features/catalog/CatalogContext";
import { demoPortfolio as baseData } from "@/features/portfolio/data/demo-data";
import { getContact } from "@/features/contacts/selectors";
import { capitalize, moneySummary, paymentPropertyId, paymentUnallocatedCents, paymentsMatching, pendingByRoom, periodLabel, periodsOf } from "./selectors";
import { Figure, MoneyNav, PeriodPropertyFilters } from "./components/MoneyUi";
import { PageHeader, Panel } from "@/features/layout/PageHeader";
import { linkClass } from "@/features/layout/ui";
import { formatDate, formatMoney } from "@/lib/format";

export interface MoneySearch {
  periodo?: string | undefined;
  inmueble?: string | undefined;
}

export function validateMoneySearch(input: Record<string, unknown>): MoneySearch {
  return {
    periodo: periodsOf(data).includes(input["periodo"] as string) ? (input["periodo"] as string) : undefined,
    inmueble: data.properties.some((p) => p.id === input["inmueble"]) ? (input["inmueble"] as string) : undefined,
  };
}

export function MoneyHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const data = useCatalogData();
  return (
    <PageHeader
      title={title}
      subtitle={
        <span className="inline-flex items-start gap-1.5">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Fecha de referencia {formatDate(data.referenceDate)}{subtitle ? ` · ${subtitle}` : " · Importes de ejemplo"}</span>
        </span>
      }
    />
  );
}

export function MoneySummaryPage({ search }: { search: MoneySearch }) {
  const data = useCatalogData();
  const navigate = useNavigate({ from: "/dinero/" });
  const f = { period: search.periodo, propertyId: search.inmueble };
  const s = moneySummary(data, f);
  const rooms = pendingByRoom(data, f);
  const payments = paymentsMatching(data, f);
  const update = (patch: MoneySearch) => navigate({ search: (prev: MoneySearch) => ({ ...prev, ...patch }), replace: true });
  const scope = [search.periodo ? capitalize(periodLabel(search.periodo)) : "Todos los periodos", search.inmueble ? data.properties.find((p) => p.id === search.inmueble)!.name : "todos los inmuebles"].join(" · ");
  const roomCode = (id: string) => data.rooms.find((r) => r.id === id)!.code;

  return (
    <>
      <MoneyHeader title="Dinero" />
      <MoneyNav />
      <PeriodPropertyFilters period={search.periodo} propertyId={search.inmueble} onChange={update} onReset={() => navigate({ search: {}, replace: true })} />
      <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">Mostrando: <strong className="text-foreground">{scope}</strong></p>

      <h2 className="mb-2 text-sm font-semibold text-foreground">Deuda de inquilinos <span className="font-normal text-muted-foreground">· por mes del cargo</span></h2>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Figure strong label="Pendiente de cobro" value={formatMoney(s.pendingCents)} help={`Parte aún no cubierta de ${s.openChargeCount} vencimientos a ${formatDate(data.referenceDate)}. No se le resta el dinero sin asignar.`}>
          <Link to="/dinero/vencimientos" search={{ periodo: search.periodo, inmueble: search.inmueble, abiertos: "si" }} className={linkClass}>Ver vencimientos con saldo</Link>
        </Figure>
        <Figure label="De ello, vencido" value={formatMoney(s.overdueCents)} help="Importe pendiente cuya fecha de vencimiento ya pasó en la fecha de referencia." />
        <Figure label="Importe de cargos" value={formatMoney(s.chargedCents)} help="Suma original de los cargos de renta del periodo, sin los anulados. No es dinero recibido." />
      </div>

      <h2 className="mb-2 text-sm font-semibold text-foreground">Cobros ficticios <span className="font-normal text-muted-foreground">· por fecha de recepción</span></h2>
      <div className="mb-2 grid gap-3 sm:grid-cols-3">
        <Figure label="Cobros recibidos (ejemplo)" value={formatMoney(s.receivedCents)} help={`${s.paymentCount} cobros de ejemplo. Dinero recibido, no beneficio ni factura.`} />
        <Figure label="Asignado a vencimientos" value={formatMoney(s.allocatedCents)} help="Parte de esos cobros aplicada a cargos. Ya está dentro de los cobros; no es otra entrada." />
        <Figure label="Sin asignar" value={formatMoney(s.unallocatedCents)} help="Recibido pero no aplicado a ningún cargo. No se descuenta de la deuda." />
      </div>
      {search.inmueble && (
        <p className="mb-2 text-xs text-muted-foreground">
          Ámbito por inmueble: solo cobros cuyo contrato indicado es de este inmueble. Cobros sin inmueble atribuido (sin repartir): {formatMoney(s.unattributedUnallocatedCents)} sin asignar.
        </p>
      )}
      <p className="mb-6 text-xs text-muted-foreground">
        Las fianzas van aparte y no se suman a cobros ni a deuda. <Link to="/dinero/fianzas" className={linkClass}>Ver fianzas</Link>
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={`Pendiente por habitación (${rooms.length})`}>
          {rooms.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin importes pendientes en esta selección.</p>
          ) : (
            <ul className="divide-y divide-border">
              {rooms.map((r) => (
                <li key={r.contractId} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0 text-sm">
                    <Link to="/cartera/habitaciones/$roomId" params={{ roomId: r.roomId }} className={linkClass}>{roomCode(r.roomId)}</Link>
                    {" · "}
                    <Link to="/dinero/inquilinos/$contactId" params={{ contactId: r.payerId }} search={{ contrato: r.contractId }} className={linkClass}>{getContact(data, r.payerId)?.name}</Link>
                    <p className="text-xs text-muted-foreground">{r.concept}</p>
                  </div>
                  <span className="tabular shrink-0 text-sm font-semibold">{formatMoney(r.cents)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={`Cobros de ejemplo (${payments.length})`}>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin cobros en esta selección.</p>
          ) : (
            <ul className="divide-y divide-border">
              {payments.map((p) => {
                const un = paymentUnallocatedCents(data, p);
                return (
                  <li key={p.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0 text-sm">
                      <span className="font-medium">{p.reference}</span> · {formatDate(p.receivedOn)}
                      <span className="block text-xs text-muted-foreground">
                        <Link to="/dinero/inquilinos/$contactId" params={{ contactId: p.payerId }} className={linkClass}>{getContact(data, p.payerId)?.name}</Link>
                        {!paymentPropertyId(data, p) && " · sin inmueble atribuido"}
                        {un > 0 && <> · <strong className="text-foreground">{formatMoney(un)} sin asignar</strong></>}
                      </span>
                    </div>
                    <span className="tabular shrink-0 text-sm font-semibold">{formatMoney(p.amountCents)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <Link to="/dinero/simular" className={linkClass}>Simular un cobro <ArrowRight className="inline h-3.5 w-3.5" aria-hidden="true" /></Link>
        <Link to="/dinero/inquilinos" className={linkClass}>Cuentas de inquilinos <ArrowRight className="inline h-3.5 w-3.5" aria-hidden="true" /></Link>
        <Link to="/dinero/gastos" className={linkClass}>Gastos y proveedores <ArrowRight className="inline h-3.5 w-3.5" aria-hidden="true" /></Link>
      </div>
    </>
  );
}
