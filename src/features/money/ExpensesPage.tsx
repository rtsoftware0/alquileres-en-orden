import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Search, SearchX } from "lucide-react";
import { useCatalogData } from "@/features/catalog/CatalogContext";
import { demoPortfolio as baseData } from "@/features/portfolio/data/demo-data";
import { getContact } from "@/features/contacts/selectors";
import { EXPENSE_STATUSES, type ExpenseStatus, expenseBalance, expenseCategoriesOf, expenseTotals, filterExpenses, providerAccountContacts } from "./expenses";
import { Amounts, ExpenseStatusBadge, Figure, MoneyNav, OverdueTag, PeriodPropertyFilters, expenseStatusMeta } from "./components/MoneyUi";
import { MoneyHeader, validateMoneySearch } from "./MoneySummaryPage";
import { fieldClass, linkClass } from "@/features/layout/ui";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ExpensesSearch {
  q?: string | undefined;
  inmueble?: string | undefined;
  periodo?: string | undefined;
  proveedor?: string | undefined;
  categoria?: string | undefined;
  estado?: ExpenseStatus | undefined;
  vencido?: "si" | undefined;
}

export function validateExpensesSearch(input: Record<string, unknown>): ExpensesSearch {
  return {
    ...validateMoneySearch(input),
    q: typeof input["q"] === "string" && input["q"] ? input["q"].slice(0, 80) : undefined,
    proveedor: data.contacts.some((c) => c.id === input["proveedor"]) ? (input["proveedor"] as string) : undefined,
    categoria: expenseCategoriesOf(data).includes(input["categoria"] as string) ? (input["categoria"] as string) : undefined,
    estado: EXPENSE_STATUSES.includes(input["estado"] as ExpenseStatus) ? (input["estado"] as ExpenseStatus) : undefined,
    vencido: input["vencido"] === "si" ? "si" : undefined,
  };
}

export function ExpensesPage({ search }: { search: ExpensesSearch }) {
  const data = useCatalogData();
  const navigate = useNavigate({ from: "/dinero/gastos/" });
  const update = (patch: ExpensesSearch) => navigate({ search: (prev: ExpensesSearch) => ({ ...prev, ...patch }), replace: true });
  const q = search.q ?? "";
  const list = filterExpenses(data, {
    q,
    propertyId: search.inmueble ?? "todos",
    providerId: search.proveedor ?? "todos",
    category: search.categoria ?? "todos",
    period: search.periodo ?? "todos",
    status: search.estado ?? "todos",
    overdueOnly: Boolean(search.vencido),
  });
  const totals = expenseTotals(data, { period: search.periodo, propertyId: search.inmueble });
  const hasExtra = Boolean(q || search.proveedor || search.categoria || search.estado || search.vencido);
  const providers = providerAccountContacts(data);

  return (
    <>
      <MoneyHeader title="Gastos" subtitle="Registro sintético separado de la deuda de inquilinos" />
      <MoneyNav />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Figure label="Coste de los gastos" value={formatMoney(totals.costCents)} help={`Suma original de ${totals.count} gastos de ejemplo. No es dinero pagado.`} />
        <Figure label="Pagado a proveedores" value={formatMoney(totals.paidCents)} help="Salidas de dinero de ejemplo, con su propia fecha. No confundir con el coste." />
        <Figure strong label="Pendiente a proveedores" value={formatMoney(totals.pendingCents)} help={`De ello vencido: ${formatMoney(totals.overdueCents)}. No se netea contra deuda de inquilinos.`} />
      </div>

      <PeriodPropertyFilters
        period={search.periodo} propertyId={search.inmueble} periodHelp={false} hasOther={hasExtra}
        onChange={update} onReset={() => navigate({ search: {}, replace: true })}
      >
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Buscar</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input type="search" value={q} onChange={(e) => update({ q: e.target.value || undefined })} placeholder="Referencia, concepto, proveedor o inmueble" className={cn(fieldClass, "pl-9")} />
            </span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Proveedor</span>
            <select value={search.proveedor ?? "todos"} onChange={(e) => update({ proveedor: e.target.value === "todos" ? undefined : e.target.value })} className={fieldClass}>
              <option value="todos">Todos</option>
              {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Categoría</span>
            <select value={search.categoria ?? "todos"} onChange={(e) => update({ categoria: e.target.value === "todos" ? undefined : e.target.value })} className={fieldClass}>
              <option value="todos">Todas</option>
              {expenseCategoriesOf(data).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Estado</span>
            <select value={search.estado ?? "todos"} onChange={(e) => update({ estado: e.target.value === "todos" ? undefined : (e.target.value as ExpenseStatus) })} className={fieldClass}>
              <option value="todos">Todos</option>
              {EXPENSE_STATUSES.map((s) => <option key={s} value={s}>{expenseStatusMeta[s].label}</option>)}
            </select>
          </label>
          <label className="flex h-10 items-center gap-2 text-sm">
            <input type="checkbox" checked={Boolean(search.vencido)} onChange={(e) => update({ vencido: e.target.checked ? "si" : undefined })} className="h-4 w-4 accent-primary" />
            Solo vencidos
          </label>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          El periodo es el mes del gasto. Un pago es una salida de dinero con su propia fecha. «Vencido» indica que la fecha de vencimiento es anterior al {formatDate(data.referenceDate)} y queda saldo sin pagar; no es un estado.
        </p>
      </PeriodPropertyFilters>

      <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
        Mostrando <strong className="tabular text-foreground">{list.length}</strong> de {data.expenses.length} gastos
      </p>

      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
          <SearchX className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
          <p className="mt-2 font-medium">No hay gastos que coincidan</p>
          <p className="mt-1 text-sm text-muted-foreground">Cambia la búsqueda o restablece los filtros.</p>
          {hasExtra && <button type="button" onClick={() => navigate({ search: {}, replace: true })} className={cn(linkClass, "mt-3 text-sm")}>Quitar todos los filtros</button>}
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((e) => {
            const b = expenseBalance(data, e);
            return (
              <li key={e.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link to="/dinero/gastos/$expenseId" params={{ expenseId: e.id }} className={cn(linkClass, "text-sm")}>{e.reference} · {e.concept}</Link>
                  <span className="flex flex-wrap gap-1.5"><ExpenseStatusBadge status={b.status} />{b.overdue && <OverdueTag />}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {e.category} · {data.properties.find((p) => p.id === e.propertyId)?.name} ·{" "}
                  <Link to="/dinero/proveedores/$contactId" params={{ contactId: e.providerId }} className={linkClass}>{getContact(data, e.providerId)?.name}</Link>
                  {" · "}vence {formatDate(e.dueDate)}
                </p>
                <div className="mt-3">
                  <Amounts items={[["Importe original", formatMoney(b.amountCents)], ["Pagado", formatMoney(b.paidCents)], ["Pendiente", formatMoney(b.outstandingCents), true]]} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <Link to="/dinero/gastos/preparar" className={linkClass}>Preparar gasto de ejemplo <ArrowRight className="inline h-3.5 w-3.5" aria-hidden="true" /></Link>
        <Link to="/dinero/gastos/simular-pago" className={linkClass}>Simular un pago a proveedor <ArrowRight className="inline h-3.5 w-3.5" aria-hidden="true" /></Link>
        <Link to="/dinero/proveedores" className={linkClass}>Cuentas de proveedores <ArrowRight className="inline h-3.5 w-3.5" aria-hidden="true" /></Link>
      </div>
    </>
  );
}

export function PrepararGastoLink({ className }: { className?: string }) {
  return <Link to="/dinero/gastos/preparar" className={className ?? buttonVariants()}>Preparar gasto de ejemplo</Link>;
}
