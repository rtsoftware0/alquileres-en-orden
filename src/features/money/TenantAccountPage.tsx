import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Info } from "lucide-react";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import type { Contact } from "@/features/portfolio/data/types";
import { allocationsOfPayment, chargeBalance, getCharge, guarantorOnlyContracts, paymentUnallocatedCents, tenantAccount, tenantContracts } from "./selectors";
import { ChargeStatusBadge, Figure, MoneyNav, OverdueTag } from "./components/MoneyUi";
import { ContractStatusBadge } from "@/features/contracts/components/ContractStatusBadge";
import { Breadcrumbs, PageHeader, Panel, crumbLinkClass } from "@/features/layout/PageHeader";
import { fieldClass, linkClass } from "@/features/layout/ui";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/format";

export interface AccountSearch { contrato?: string | undefined }

export const validateAccountSearch = (input: Record<string, unknown>): AccountSearch => ({
  contrato: data.contracts.some((c) => c.id === input["contrato"]) ? (input["contrato"] as string) : undefined,
});

export function TenantAccountPage({ contact, search }: { contact: Contact; search: AccountSearch }) {
  const navigate = useNavigate({ from: "/dinero/inquilinos/$contactId" });
  const contracts = tenantContracts(data, contact.id);
  const contractId = contracts.some((c) => c.id === search.contrato) ? search.contrato : undefined;
  const a = tenantAccount(data, contact.id, contractId);
  const asGuarantor = guarantorOnlyContracts(data, contact.id);
  const otherRoles = contact.roles.filter((r) => r === "propietario" || r === "arrendador");

  return (
    <>
      <Breadcrumbs items={[
        { label: "Dinero", link: <Link to="/dinero" className={crumbLinkClass}>Dinero</Link> },
        { label: "Cuentas de inquilinos", link: <Link to="/dinero/inquilinos" className={crumbLinkClass}>Cuentas de inquilinos</Link> },
        { label: contact.name },
      ]} />
      <PageHeader
        title={`Cuenta de ${contact.name}`}
        subtitle={<>Como inquilino · a {formatDate(data.referenceDate)} · <Link to="/contactos/$contactId" params={{ contactId: contact.id }} className={linkClass}>Ver ficha de contacto</Link></>}
        actions={<Link to="/dinero/inquilinos" className={buttonVariants({ variant: "outline" })}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a cuentas</Link>}
      />
      <MoneyNav />

      {(asGuarantor.length > 0 || otherRoles.length > 0) && (
        <p className="mb-4 flex items-start gap-2 rounded-md border border-border bg-muted/50 p-3 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span>
            {asGuarantor.length > 0 && <>Es avalista de {asGuarantor.map((c, i) => <span key={c.id}>{i > 0 && ", "}<Link to="/contratos/$contractId" params={{ contractId: c.id }} className={linkClass}>{c.reference}</Link></span>)}. </>}
            Esta cuenta solo incluye cargos en los que es inquilino y pagador; otros papeles no le atribuyen deuda de terceros.
          </span>
        </p>
      )}

      <div className="mb-4 rounded-lg border border-border bg-card p-4">
        <label className="block max-w-sm text-sm">
          <span className="mb-1 block font-medium">Contrato</span>
          <select value={contractId ?? "todos"} onChange={(e) => navigate({ search: { contrato: e.target.value === "todos" ? undefined : e.target.value }, replace: true })} className={fieldClass}>
            <option value="todos">Todos sus contratos ({contracts.length})</option>
            {contracts.map((c) => <option key={c.id} value={c.id}>{c.reference} · {data.rooms.find((r) => r.id === c.roomId)?.code}</option>)}
          </select>
        </label>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Figure strong label="Pendiente de cobro" value={formatMoney(a.pendingCents)} help={`De ello vencido: ${formatMoney(a.overdueCents)}. No se le resta el dinero sin asignar.`} />
        <Figure label="Cobros recibidos (ejemplo)" value={formatMoney(a.receivedCents)} help={`Asignado a cargos: ${formatMoney(a.allocatedCents)}.`} />
        <Figure label="Sin asignar" value={formatMoney(a.unallocatedCents)} help="Recibido de esta persona sin aplicar a ningún cargo. Se muestra aparte." />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={`Contratos como inquilino (${contracts.length})`} className="lg:col-span-2">
          <ul className="divide-y divide-border text-sm">
            {contracts.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                <span>
                  <Link to="/contratos/$contractId" params={{ contractId: c.id }} className={linkClass}>{c.reference}</Link>
                  {" · "}
                  <Link to="/cartera/habitaciones/$roomId" params={{ roomId: c.roomId }} className={linkClass}>{data.rooms.find((r) => r.id === c.roomId)?.code}</Link>
                  <span className="text-muted-foreground"> · pendiente {formatMoney(tenantAccount(data, contact.id, c.id).pendingCents)}</span>
                </span>
                <ContractStatusBadge status={c.status} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title={`Cargos (${a.charges.length})`}>
          {a.charges.length === 0 ? <p className="text-sm text-muted-foreground">Sin cargos de ejemplo.</p> : (
            <ul className="divide-y divide-border text-sm">
              {a.charges.map((c) => {
                const b = chargeBalance(data, c);
                return (
                  <li key={c.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link to="/dinero/vencimientos/$chargeId" params={{ chargeId: c.id }} className={linkClass}>{c.reference} · {c.concept}</Link>
                      <span className="flex gap-1.5"><ChargeStatusBadge status={b.status} />{b.overdue && <OverdueTag />}</span>
                    </div>
                    <p className="tabular text-xs text-muted-foreground">Vence {formatDate(c.dueDate)} · importe {formatMoney(b.amountCents)} · asignado {formatMoney(b.allocatedCents)} · pendiente <strong className="text-foreground">{formatMoney(b.outstandingCents)}</strong></p>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title={`Cobros y asignaciones (${a.payments.length})`}>
          {a.payments.length === 0 ? <p className="text-sm text-muted-foreground">Sin cobros de ejemplo.</p> : (
            <ul className="divide-y divide-border text-sm">
              {a.payments.map((p) => {
                const un = paymentUnallocatedCents(data, p);
                return (
                  <li key={p.id} className="py-2.5 first:pt-0 last:pb-0">
                    <p className="flex justify-between gap-2"><span><strong>{p.reference}</strong> · {formatDate(p.receivedOn)}</span><span className="tabular font-semibold">{formatMoney(p.amountCents)}</span></p>
                    <ul className="mt-1 text-xs text-muted-foreground">
                      {allocationsOfPayment(data, p.id).map((al) => (
                        <li key={al.id}>Asignado {formatMoney(al.amountCents)} a <Link to="/dinero/vencimientos/$chargeId" params={{ chargeId: al.chargeId }} className={linkClass}>{getCharge(data, al.chargeId)?.reference}</Link></li>
                      ))}
                      {un > 0 && <li className="font-medium text-foreground">Sin asignar: {formatMoney(un)}</li>}
                    </ul>
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
