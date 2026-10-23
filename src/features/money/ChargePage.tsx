import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import type { Charge } from "@/features/portfolio/data/types";
import { getContact } from "@/features/contacts/selectors";
import { allocationsOfCharge, capitalize, chargeBalance, chargeContract, getPayment, paymentUnallocatedCents, periodLabel } from "./selectors";
import { ChargeStatusBadge, MoneyNav, OverdueTag } from "./components/MoneyUi";
import { Breadcrumbs, PageHeader, Panel, crumbLinkClass } from "@/features/layout/PageHeader";
import { linkClass } from "@/features/layout/ui";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/format";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (<><dt className="text-muted-foreground">{label}</dt><dd className="min-w-0">{children}</dd></>);
}

export function ChargePage({ charge: c }: { charge: Charge }) {
  const b = chargeBalance(data, c);
  const ct = chargeContract(data, c);
  const room = data.rooms.find((r) => r.id === ct.roomId)!;
  const payer = getContact(data, c.payerId)!;
  const allocations = allocationsOfCharge(data, c.id);

  return (
    <>
      <Breadcrumbs items={[
        { label: "Dinero", link: <Link to="/dinero" className={crumbLinkClass}>Dinero</Link> },
        { label: "Vencimientos", link: <Link to="/dinero/vencimientos" className={crumbLinkClass}>Vencimientos</Link> },
        { label: c.reference },
      ]} />
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">{c.reference} <ChargeStatusBadge status={b.status} />{b.overdue && <OverdueTag />}</span>}
        subtitle={`${c.concept} · cargo de ejemplo`}
        actions={<Link to="/dinero/vencimientos" className={buttonVariants({ variant: "outline" })}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a vencimientos</Link>}
      />
      <MoneyNav />
      {c.voidReason && <p className="mb-4 rounded-md border border-border bg-muted p-3 text-sm">Cargo anulado: {c.voidReason}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Cargo">
          <dl className="tabular grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
            <Row label="Concepto">{c.concept}</Row>
            <Row label="Periodo (devengo)">{capitalize(periodLabel(c.period))}</Row>
            <Row label="Vencimiento">{formatDate(c.dueDate)}</Row>
            <Row label="Contrato"><Link to="/contratos/$contractId" params={{ contractId: ct.id }} className={linkClass}>{ct.reference}</Link></Row>
            <Row label="Habitación"><Link to="/cartera/habitaciones/$roomId" params={{ roomId: room.id }} className={linkClass}>{room.code}</Link></Row>
            <Row label="Inquilino (pagador)">
              <Link to="/contactos/$contactId" params={{ contactId: payer.id }} className={linkClass}>{payer.name}</Link>
              <span className="block"><Link to="/dinero/inquilinos/$contactId" params={{ contactId: payer.id }} search={{ contrato: ct.id }} className={linkClass}>Ver cuenta del inquilino</Link></span>
            </Row>
          </dl>
        </Panel>
        <Panel title="Importes">
          <dl className="tabular grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
            <Row label="Importe original">{formatMoney(b.amountCents)}</Row>
            <Row label="Cobrado / asignado">{formatMoney(b.allocatedCents)}</Row>
            <Row label="Pendiente"><strong>{formatMoney(b.outstandingCents)}</strong></Row>
            <Row label="Condición">
              {b.overdue ? "Vencido: la fecha de vencimiento es anterior a la de referencia y queda importe sin cubrir."
                : b.status === "anulado" ? "No se debe: cargo anulado." : b.outstandingCents === 0 ? "Sin importe pendiente." : "Aún no vencido."}
            </Row>
          </dl>
        </Panel>
        <Panel title={`Cobros de ejemplo que cubren este cargo (${allocations.length})`} className="lg:col-span-2">
          {allocations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ningún cobro de ejemplo está asignado a este cargo.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {allocations.map((a) => {
                const p = getPayment(data, a.paymentId)!;
                const un = paymentUnallocatedCents(data, p);
                return (
                  <li key={a.id} className="flex flex-col gap-1 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:justify-between">
                    <span>
                      <strong>{p.reference}</strong> · recibido el {formatDate(p.receivedOn)} · total del cobro {formatMoney(p.amountCents)}
                      <span className="block text-xs text-muted-foreground">{p.note}{un > 0 && ` Sin asignar de este cobro: ${formatMoney(un)}.`}</span>
                    </span>
                    <span className="tabular font-semibold">Asignado {formatMoney(a.amountCents)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
