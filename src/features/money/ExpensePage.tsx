import { Link } from "@tanstack/react-router";
import { ArrowLeft, Info } from "lucide-react";
import { useCatalogData } from "@/features/catalog/CatalogContext";
import { demoPortfolio as baseData } from "@/features/portfolio/data/demo-data";
import type { Expense } from "@/features/portfolio/data/types";
import { getContact } from "@/features/contacts/selectors";
import { bearerLabel, expenseBalance, paymentsOfExpense, sharesOfExpense } from "./expenses";
import { Amounts, ExpenseStatusBadge, MoneyNav, OverdueTag } from "./components/MoneyUi";
import { RelatedDocsLinks } from "@/features/docs/components/RelatedDocs";
import { Breadcrumbs, PageHeader, Panel, crumbLinkClass } from "@/features/layout/PageHeader";
import { linkClass } from "@/features/layout/ui";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/format";

export function ExpensePage({ expense }: { expense: Expense }) {
  const data = useCatalogData();
  const b = expenseBalance(data, expense);
  const provider = getContact(data, expense.providerId);
  const property = data.properties.find((p) => p.id === expense.propertyId)!;
  const payments = paymentsOfExpense(data, expense.id);
  const shares = sharesOfExpense(data, expense.id);
  const linkedIncident = data.incidents.find((i) => i.linkedExpenseId === expense.id);

  return (
    <>
      <Breadcrumbs items={[
        { label: "Dinero", link: <Link to="/dinero" className={crumbLinkClass}>Dinero</Link> },
        { label: "Gastos", link: <Link to="/dinero/gastos" className={crumbLinkClass}>Gastos</Link> },
        { label: expense.reference },
      ]} />
      <PageHeader
        title={`${expense.reference} · ${expense.concept}`}
        subtitle={<>{expense.category} · gasto de {formatDate(expense.date)} · vence {formatDate(expense.dueDate)}</>}
        actions={<Link to="/dinero/gastos" className={buttonVariants({ variant: "outline" })}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a gastos</Link>}
      />
      <MoneyNav />

      <div className="mb-4 flex flex-wrap gap-1.5">
        <ExpenseStatusBadge status={b.status} />
        {b.overdue && <OverdueTag />}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Amounts items={[["Importe original", formatMoney(b.amountCents)], ["Pagado", formatMoney(b.paidCents)], ["Pendiente", formatMoney(b.outstandingCents), true]]} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Detalle">
          <dl className="tabular grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
            <dt className="text-muted-foreground">Proveedor</dt>
            <dd><Link to="/dinero/proveedores/$contactId" params={{ contactId: expense.providerId }} className={linkClass}>{provider?.name}</Link>{" "}
              <span className="text-muted-foreground">(<Link to="/contactos/$contactId" params={{ contactId: expense.providerId }} className={linkClass}>ficha de contacto</Link>)</span></dd>
            <dt className="text-muted-foreground">Inmueble</dt>
            <dd><Link to="/cartera/inmuebles/$propertyId" params={{ propertyId: property.id }} className={linkClass}>{property.name}</Link></dd>
            <dt className="text-muted-foreground">Periodo</dt><dd>{expense.period} (mes del gasto)</dd>
            <dt className="text-muted-foreground">Quién soporta el coste</dt><dd>{bearerLabel[expense.bearer]}</dd>
            {linkedIncident && (<><dt className="text-muted-foreground">Incidencia relacionada</dt><dd><Link to="/incidencias/$incidentId" params={{ incidentId: linkedIncident.id }} className={linkClass}>{linkedIncident.title}</Link><span className="block text-xs text-muted-foreground">Vínculo de ejemplo ya existente; no lo creó ninguna simulación.</span></dd></>)}
            {expense.note && (<><dt className="text-muted-foreground">Nota</dt><dd className="text-muted-foreground">{expense.note}</dd></>)}
          </dl>
          {expense.bearer === "inquilino" && (
            <p className="mt-4 flex items-start gap-2 rounded-md border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              Reparto de ejemplo: esta demostración no genera ninguna deuda a inquilinos ni afirma que el gasto sea repercutible legalmente.
            </p>
          )}
          <div className="mt-4 border-t border-border pt-3">
            <RelatedDocsLinks kind="gasto" id={expense.id} />
          </div>
        </Panel>

        <Panel title={`Pagos ficticios (${payments.length})`}>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin pagos de ejemplo. El gasto está pendiente por completo.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {payments.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span><strong>{p.reference}</strong> · {formatDate(p.date)}<span className="block text-xs text-muted-foreground">{p.note}</span></span>
                  <span className="tabular shrink-0 font-semibold">{formatMoney(p.amountCents)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted-foreground">Los pagos son salidas de dinero con fecha propia; no son el coste ni una factura.</p>
        </Panel>

        {shares.length > 0 && (
          <Panel title={`Reparto de ejemplo entre unidades (${shares.length})`} className="lg:col-span-2">
            <ul className="divide-y divide-border text-sm">
              {shares.map((s) => {
                const room = data.rooms.find((r) => r.id === s.roomId)!;
                return (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <Link to="/cartera/habitaciones/$roomId" params={{ roomId: room.id }} className={linkClass}>{room.code}</Link>
                    <span className="tabular font-semibold">{formatMoney(s.amountCents)}</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">Asignación de coste simulada: no es un cargo registrado ni aparece en la cuenta de ningún inquilino.</p>
          </Panel>
        )}
      </div>
    </>
  );
}
