import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/features/layout/PageHeader";
import { fieldClass, linkClass } from "@/features/layout/ui";
import { useCatalogData } from "@/features/catalog/CatalogContext";
import { downloadCsv } from "@/features/catalog/csv/export";
import { formatDate, formatMoney, formatPercent } from "@/lib/format";
import { ALL_MONTHS, buildReport, isMonth, reportCsv, reportFileName, type ReportsSearch } from "./selectors";

const th = "px-3 py-2 text-left font-medium text-muted-foreground";
const td = "px-3 py-2";
const num = "px-3 py-2 text-right tabular-nums";

function Table({ caption, head, children }: { caption: string; head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead><tr className="border-b border-border">{head.map((h, i) => <th key={h} scope="col" className={i === 0 ? th : `${th} text-right`}>{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function ReportsPage({ search, onSearch }: { search: ReportsSearch; onSearch: (next: ReportsSearch) => void }) {
  const d = useCatalogData();
  const { filters: f, report: r } = buildReport(d, search);
  const pname = (id: string | null) => (id ? d.properties.find((p) => p.id === id)?.name ?? id : "Toda la cartera");
  const months = [...new Set([
    ...d.charges.map((c) => c.period), ...d.expenses.map((e) => e.period),
    ...d.payments.map((p) => p.receivedOn.slice(0, 7)), ...d.expensePayments.map((p) => p.date.slice(0, 7)),
  ])].sort();
  if (isMonth(search.mes) && !months.includes(search.mes)) months.push(search.mes);
  const set = (patch: { mes?: string; fecha?: string; inmueble?: string | undefined }) => {
    const inmueble = "inmueble" in patch ? patch.inmueble : search.inmueble;
    onSearch({ mes: patch.mes ?? search.mes, fecha: patch.fecha ?? search.fecha, ...(inmueble ? { inmueble } : {}) });
  };
  const exportCsv = () => {
    const text = reportCsv(d, search);
    if (text) downloadCsv(reportFileName(search), text);
  };
  const unknownProperty = search.inmueble && !d.properties.some((p) => p.id === search.inmueble);
  const monthLabel = f.month ?? "todos los meses";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Informes"
        subtitle="Ocupación, devengo, caja, deuda actual y gastos de la cartera de ejemplo. Datos ficticios; no es contabilidad fiscal ni liquidación."
        actions={<Button variant="outline" onClick={exportCsv} disabled={!r}><Download className="mr-2 h-4 w-4" aria-hidden="true" />Exportar CSV de este informe</Button>}
      />

      <Panel title="Filtros">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm">Mes económico
            <select aria-label="Mes económico" className={fieldClass} value={search.mes} onChange={(e) => set({ mes: e.target.value })}>
              <option value={ALL_MONTHS}>Todos los meses</option>
              {months.map((m) => <option key={m} value={m}>{m}</option>)}
              {search.mes !== ALL_MONTHS && !isMonth(search.mes) && <option value={search.mes}>No válido: {search.mes}</option>}
            </select>
          </label>
          <label className="text-sm">Fecha de ocupación
            <input aria-label="Fecha de ocupación" type="date" className={fieldClass} value={search.fecha} onChange={(e) => set({ fecha: e.target.value || d.referenceDate })} />
          </label>
          <label className="text-sm">Inmueble
            <select aria-label="Inmueble" className={fieldClass} value={search.inmueble ?? ""} onChange={(e) => set({ inmueble: e.target.value || undefined })}>
              <option value="">Toda la cartera</option>
              {d.properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              {unknownProperty && <option value={search.inmueble}>No disponible: {search.inmueble}</option>}
            </select>
          </label>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">El mes afecta a devengo y caja; la fecha solo a ocupación; la deuda es siempre la actual a {formatDate(d.referenceDate)}.</p>
      </Panel>

      {f.issues.length > 0 && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-medium">No se calculan cifras con estos filtros.</p>
          <ul className="mt-2 list-disc pl-5">{f.issues.map((i) => <li key={i}>{i}</li>)}</ul>
          <p className="mt-2">Cifras: —. Elige un valor válido en los filtros.</p>
        </div>
      )}

      {r && (
        <>
          <Panel title={`Ocupación a ${formatDate(r.occupancy.date)} · ${pname(f.propertyId)}`}>
            <dl className="grid gap-3 sm:grid-cols-3 text-sm">
              <div><dt className="text-muted-foreground">Ocupadas</dt><dd className="text-lg font-semibold" data-testid="occ-occupied">{r.occupancy.isReference ? `${r.occupancy.occupied}/${r.occupancy.enabledNow}` : r.occupancy.occupied}</dd></div>
              <div><dt className="text-muted-foreground">Unidades gestionadas</dt><dd className="text-lg font-semibold" data-testid="occ-managed">{r.occupancy.managed}</dd></div>
              <div><dt className="text-muted-foreground">Tasa</dt><dd className="text-lg font-semibold">{r.occupancy.rate === null ? "No disponible" : formatPercent(r.occupancy.rate)}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              Cuenta unidades distintas con contrato activo o finalizado cuya entrada es anterior o igual a la fecha y cuya salida es posterior. Borradores, pendientes y reservas no ocupan.
              Los bloqueos solo se conocen en su estado actual (sin historial), por eso la tasa solo se muestra a la fecha de referencia.
            </p>
          </Panel>

          <Panel title={`Deuda actual a ${formatDate(d.referenceDate)} por mes de origen`}>
            <Table caption="Deuda actual por mes de origen" head={["Mes de origen", "Pendiente"]}>
              {r.debt.rows.map((x) => <tr key={x.period} className="border-b border-border/60"><td className={td}>{x.period}</td><td className={num}>{formatMoney(x.cents)}</td></tr>)}
              {r.debt.rows.length === 0 && <tr><td className={td} colSpan={2}>Sin movimientos</td></tr>}
              <tr className="font-semibold"><td className={td}>Total</td><td className={num} data-testid="debt-total">{formatMoney(r.debt.totalCents)}</td></tr>
            </Table>
            <p className="mt-3 text-xs text-muted-foreground">Criterio fijo: saldo actual de cargos no anulados. No es el saldo histórico del mes ni de la fecha de ocupación. El dinero sin asignar no reduce esta deuda. <Link to="/dinero/vencimientos" className={linkClass}>Ver vencimientos</Link></p>
          </Panel>

          <Panel title={`Cobros a inquilinos · ${monthLabel}`}>
            <Table caption="Devengo y caja de cobros por inmueble" head={["Inmueble", "Devengo", "Recibido", "Asignado", "Sin asignar"]}>
              {r.income.rows.map((x) => (
                <tr key={x.propertyId} className="border-b border-border/60">
                  <td className={td}><Link to="/cartera/inmuebles/$propertyId" params={{ propertyId: x.propertyId! }} className={linkClass}>{pname(x.propertyId)}</Link>{x.accruedCents === 0 && x.paymentCount === 0 && <span className="ml-2 text-xs text-muted-foreground">Sin movimientos</span>}</td>
                  <td className={num}>{formatMoney(x.accruedCents)}</td><td className={num}>{formatMoney(x.receivedCents)}</td>
                  <td className={num}>{formatMoney(x.allocatedCents)}</td><td className={num}>{formatMoney(x.unallocatedCents)}</td>
                </tr>
              ))}
              <tr className="border-b border-border/60">
                <td className={td}>No atribuidos a inmueble{f.propertyId ? " (fuera del filtro)" : ""}</td><td className={num}>—</td>
                <td className={num}>{formatMoney(r.income.unattributed.receivedCents)}</td><td className={num}>{formatMoney(r.income.unattributed.allocatedCents)}</td><td className={num}>{formatMoney(r.income.unattributed.unallocatedCents)}</td>
              </tr>
              <tr className="font-semibold"><td className={td}>Total {pname(f.propertyId)}</td><td className={num} data-testid="income-accrued">{formatMoney(r.income.totalAccruedCents)}</td><td className={num} data-testid="income-received">{formatMoney(r.income.totalReceivedCents)}</td><td className={num} /><td className={num} /></tr>
            </Table>
            <p className="mt-3 text-xs text-muted-foreground">Devengo: cargos no anulados del periodo. Caja: cobros por fecha de recepción. Los cobros sin contrato se cuentan una sola vez. Las fianzas están fuera. <Link to="/dinero" className={linkClass}>Ver Dinero</Link></p>
          </Panel>

          <Panel title={`Gastos y pagos a proveedores · ${monthLabel}`}>
            <Table caption="Gastos por inmueble" head={["Inmueble", "Coste", "Pagado sobre esos gastos", "Pendiente", "Caja a proveedores"]}>
              {r.expenses.rows.map((x) => (
                <tr key={x.propertyId} className="border-b border-border/60">
                  <td className={td}>{pname(x.propertyId)}</td><td className={num}>{formatMoney(x.costCents)}</td><td className={num}>{formatMoney(x.paidOnTheseCents)}</td>
                  <td className={num}>{formatMoney(x.pendingCents)}</td><td className={num}>{formatMoney(x.providerCashCents)}</td>
                </tr>
              ))}
              <tr className="font-semibold"><td className={td}>Total</td><td className={num} data-testid="exp-cost">{formatMoney(r.expenses.costCents)}</td><td className={num} data-testid="exp-paid">{formatMoney(r.expenses.paidOnTheseCents)}</td><td className={num} data-testid="exp-pending">{formatMoney(r.expenses.pendingCents)}</td><td className={num} data-testid="exp-cash">{formatMoney(r.expenses.providerCashCents)}</td></tr>
            </Table>
            <p className="mt-3 text-xs text-muted-foreground">«Pagado sobre esos gastos» son pagos de los gastos del periodo, sea cual sea su fecha; no es la caja del mes. «Caja a proveedores» suma pagos por su fecha de pago, aunque el gasto sea de otro mes. <Link to="/dinero/gastos" className={linkClass}>Ver gastos</Link></p>
          </Panel>

          <Panel title={`Resultado orientativo por inmueble · ${monthLabel}`}>
            <Table caption="Resultado orientativo" head={["Inmueble", "Devengo", "Coste", "Resultado"]}>
              {r.result.rows.map((x) => (
                <tr key={x.propertyId} className="border-b border-border/60">
                  <td className={td}>{pname(x.propertyId)}</td>
                  {x.status === "ok"
                    ? <><td className={num}>{formatMoney(x.accruedCents)}</td><td className={num}>{formatMoney(x.costCents)}</td><td className={num}>{formatMoney(x.resultCents)}</td></>
                    : <td className={num} colSpan={3}>No calculable · {x.reason}{x.noActivity ? " Sin movimientos." : ""}</td>}
                </tr>
              ))}
              <tr className="font-semibold"><td className={td}>Total</td><td className={num} colSpan={3} data-testid="result-total">{r.result.totalCents === null ? "Incompleto: hay inmuebles no calculables" : formatMoney(r.result.totalCents)}</td></tr>
            </Table>
            <p className="mt-3 text-xs text-muted-foreground">Devengo de cobros menos coste de gastos conocidos del periodo. Orientativo: no es beneficio fiscal ni importe a liquidar. Los ejemplos didácticos A15/A16/copropiedad y los estados simulados de liquidaciones no se incluyen.</p>
          </Panel>
        </>
      )}
      <p className="text-xs text-muted-foreground">Pendiente fuera de esta demostración: PDF, permisos reales e historial completo.</p>
    </div>
  );
}
