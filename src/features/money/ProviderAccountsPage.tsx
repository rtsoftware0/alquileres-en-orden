import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useCatalogData } from "@/features/catalog/CatalogContext";
import { demoPortfolio as baseData } from "@/features/portfolio/data/demo-data";
import type { Contact } from "@/features/portfolio/data/types";
import { expenseBalance, providerAccount, providerAccountContacts } from "./expenses";
import { Amounts, ExpenseStatusBadge, Figure, MoneyNav, OverdueTag } from "./components/MoneyUi";
import { MoneyHeader } from "./MoneySummaryPage";
import { Breadcrumbs, PageHeader, Panel, crumbLinkClass } from "@/features/layout/PageHeader";
import { linkClass } from "@/features/layout/ui";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ProviderAccountsPage() {
  const data = useCatalogData();
  const providers = providerAccountContacts(data);
  return (
    <>
      <MoneyHeader title="Cuentas de proveedores" subtitle="Solo gastos donde cada contacto es proveedor" />
      <MoneyNav />
      <p className="mb-3 text-sm text-muted-foreground">
        {providers.length} contactos con gastos de ejemplo como proveedor. Otros roles del mismo contacto no se mezclan aquí.
      </p>
      <ul className="space-y-2">
        {providers.map((p) => {
          const a = providerAccount(data, p.id);
          return (
            <li key={p.id} className="rounded-lg border border-border bg-card p-4">
              <Link to="/dinero/proveedores/$contactId" params={{ contactId: p.id }} className={cn(linkClass, "text-sm")}>{p.name}</Link>
              <p className="mt-0.5 text-xs text-muted-foreground">{p.code} · {a.expenses.length} gastos</p>
              <div className="mt-3">
                <Amounts items={[["Pendiente", formatMoney(a.pendingCents), true], ["Coste total", formatMoney(a.costCents)], ["Pagado", formatMoney(a.paidCents)]]} />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function ProviderAccountPage({ contact }: { contact: Contact }) {
  const data = useCatalogData();
  const a = providerAccount(data, contact.id);
  return (
    <>
      <Breadcrumbs items={[
        { label: "Dinero", link: <Link to="/dinero" className={crumbLinkClass}>Dinero</Link> },
        { label: "Gastos", link: <Link to="/dinero/gastos" className={crumbLinkClass}>Gastos</Link> },
        { label: "Proveedores", link: <Link to="/dinero/proveedores" className={crumbLinkClass}>Proveedores</Link> },
        { label: contact.name },
      ]} />
      <PageHeader
        title={`Cuenta de proveedor · ${contact.name}`}
        subtitle={<>A {formatDate(data.referenceDate)} · <Link to="/contactos/$contactId" params={{ contactId: contact.id }} className={linkClass}>Ver ficha de contacto</Link></>}
        actions={<Link to="/dinero/proveedores" className={buttonVariants({ variant: "outline" })}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a proveedores</Link>}
      />
      <MoneyNav />

      <p className="mb-4 rounded-md border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
        Solo gastos donde es proveedor y sus pagos asociados. Sus otros roles (propietario, inquilino, etc.) y los cobros a inquilinos no aparecen aquí.
      </p>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Figure label="Coste total" value={formatMoney(a.costCents)} help={`Suma original de ${a.expenses.length} gastos de ejemplo.`} />
        <Figure label="Pagado" value={formatMoney(a.paidCents)} help="Salidas de dinero de ejemplo a este proveedor." />
        <Figure strong label="Pendiente" value={formatMoney(a.pendingCents)} help="Saldo aún sin pagar a este proveedor." />
      </div>

      <Panel title={`Gastos como proveedor (${a.expenses.length})`}>
        <ul className="divide-y divide-border text-sm">
          {a.expenses.map((e) => {
            const b = expenseBalance(data, e);
            return (
              <li key={e.id} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link to="/dinero/gastos/$expenseId" params={{ expenseId: e.id }} className={linkClass}>{e.reference} · {e.concept}</Link>
                  <span className="flex gap-1.5"><ExpenseStatusBadge status={b.status} />{b.overdue && <OverdueTag />}</span>
                </div>
                <p className="tabular text-xs text-muted-foreground">
                  {data.properties.find((p) => p.id === e.propertyId)?.name} · vence {formatDate(e.dueDate)} · importe {formatMoney(b.amountCents)} · pagado {formatMoney(b.paidCents)} · pendiente <strong className="text-foreground">{formatMoney(b.outstandingCents)}</strong>
                </p>
              </li>
            );
          })}
        </ul>
      </Panel>
    </>
  );
}
