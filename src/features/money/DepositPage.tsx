import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useCatalogData } from "@/features/catalog/CatalogContext";
import { demoPortfolio as baseData } from "@/features/portfolio/data/demo-data";
import type { Contract } from "@/features/portfolio/data/types";
import { getContact } from "@/features/contacts/selectors";
import { depositOf } from "./selectors";
import { DepositStatusBadge, MoneyNav } from "./components/MoneyUi";
import { ContractStatusBadge } from "@/features/contracts/components/ContractStatusBadge";
import { Breadcrumbs, PageHeader, Panel, crumbLinkClass } from "@/features/layout/PageHeader";
import { linkClass } from "@/features/layout/ui";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/format";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (<><dt className="text-muted-foreground">{label}</dt><dd className="min-w-0">{children}</dd></>);
}

export function DepositPage({ contract: c }: { contract: Contract }) {
  const data = useCatalogData();
  const d = depositOf(data, c);
  const tenant = getContact(data, c.tenantIds[0]!)!;
  const landlord = getContact(data, c.landlordId)!;
  return (
    <>
      <Breadcrumbs items={[
        { label: "Dinero", link: <Link to="/dinero" className={crumbLinkClass}>Dinero</Link> },
        { label: "Fianzas", link: <Link to="/dinero/fianzas" className={crumbLinkClass}>Fianzas</Link> },
        { label: c.reference },
      ]} />
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">Fianza de {c.reference} <DepositStatusBadge status={d.status} /></span>}
        subtitle={<span className="inline-flex flex-wrap items-center gap-2">Contrato <ContractStatusBadge status={c.status} /></span>}
        actions={<Link to="/dinero/fianzas" className={buttonVariants({ variant: "outline" })}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a fianzas</Link>}
      />
      <MoneyNav />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Partes">
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
            <Row label="Contrato"><Link to="/contratos/$contractId" params={{ contractId: c.id }} className={linkClass}>{c.reference}</Link> · <Link to="/cartera/habitaciones/$roomId" params={{ roomId: c.roomId }} className={linkClass}>{data.rooms.find((r) => r.id === c.roomId)?.code}</Link></Row>
            <Row label="Aporta (inquilino)"><Link to="/contactos/$contactId" params={{ contactId: tenant.id }} className={linkClass}>{tenant.name}</Link></Row>
            <Row label="Custodia (arrendador)"><Link to="/contactos/$contactId" params={{ contactId: landlord.id }} className={linkClass}>{landlord.name}</Link></Row>
          </dl>
        </Panel>
        <Panel title="Importes">
          <dl className="tabular grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
            <Row label="Prevista en contrato">{formatMoney(d.expectedCents)} <span className="block text-xs text-muted-foreground">Solo informa lo pactado; no prueba recepción.</span></Row>
            <Row label="Recibida">{formatMoney(d.receivedCents)}</Row>
            <Row label="Devuelta">{formatMoney(d.returnedCents)}</Row>
            <Row label="Retenida">{formatMoney(d.heldCents)}</Row>
            <Row label="Pendiente de aportar">
              {c.status === "activo" ? formatMoney(d.toContributeCents) : <span className="text-muted-foreground">No aplica (contrato {c.status === "pendiente" ? "pendiente de formalización" : "finalizado"})</span>}
            </Row>
          </dl>
        </Panel>
        <Panel title={`Movimientos ficticios (${d.movements.length})`} className="lg:col-span-2">
          {d.movements.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin movimientos de fianza registrados en el ejemplo.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {d.movements.map((m) => (
                <li key={m.id} className="flex flex-col gap-1 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:justify-between">
                  <span><span className="tabular text-muted-foreground">{formatDate(m.date)}</span> · {m.kind === "recepcion" ? "Recepción" : "Devolución"} · {m.note}</span>
                  <span className="tabular font-semibold">{m.kind === "recepcion" ? "+" : "−"}{formatMoney(m.amountCents)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted-foreground">Ejemplo sin valor legal. No se ejecutan devoluciones, compensaciones ni depósitos oficiales.</p>
        </Panel>
      </div>
    </>
  );
}
