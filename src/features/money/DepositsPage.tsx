import { Link, useNavigate } from "@tanstack/react-router";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import { getContact } from "@/features/contacts/selectors";
import { depositTotals } from "./selectors";
import { Amounts, DepositStatusBadge, Figure, MoneyNav } from "./components/MoneyUi";
import { MoneyHeader } from "./MoneySummaryPage";
import { ContractStatusBadge } from "@/features/contracts/components/ContractStatusBadge";
import { fieldClass, linkClass } from "@/features/layout/ui";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface DepositsSearch { inmueble?: string | undefined }
export const validateDepositsSearch = (input: Record<string, unknown>): DepositsSearch => ({
  inmueble: data.properties.some((p) => p.id === input.inmueble) ? (input.inmueble as string) : undefined,
});

export function DepositsPage({ search }: { search: DepositsSearch }) {
  const navigate = useNavigate({ from: "/dinero/fianzas/" });
  const t = depositTotals(data, search.inmueble);
  return (
    <>
      <MoneyHeader title="Fianzas" subtitle="Registro aparte de la renta" />
      <MoneyNav />
      <p className="mb-4 rounded-md border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
        El importe del contrato solo indica la fianza prevista; no demuestra que se haya recibido. Solo cuentan los movimientos ficticios listados. Las fianzas no son renta ni se suman a los cobros.
      </p>
      <div className="mb-4 rounded-lg border border-border bg-card p-4">
        <label className="block max-w-sm text-sm">
          <span className="mb-1 block font-medium">Inmueble</span>
          <select value={search.inmueble ?? "todos"} onChange={(e) => navigate({ search: { inmueble: e.target.value === "todos" ? undefined : e.target.value }, replace: true })} className={fieldClass}>
            <option value="todos">Todos los inmuebles</option>
            {data.properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Figure label="Prevista en contratos activos" value={formatMoney(t.expectedActiveCents)} help="Lo que dicen los contratos activos. No es dinero recibido." />
        <Figure strong label="Retenida (ejemplo)" value={formatMoney(t.heldCents)} help={`Recibido ${formatMoney(t.receivedCents)} menos devuelto ${formatMoney(t.returnedCents)}. No es renta.`} />
        <Figure label="Pendiente de aportar" value={formatMoney(t.toContributeCents)} help="Diferencia entre lo previsto y lo recibido en contratos activos." />
      </div>
      <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">{t.rows.length} contratos con fianza. Borradores y cancelados no se incluyen.</p>
      <ul className="space-y-2">
        {t.rows.map((r) => (
          <li key={r.contract.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link to="/dinero/fianzas/$contractId" params={{ contractId: r.contract.id }} className={cn(linkClass, "text-sm")}>
                Fianza de {r.contract.reference} · {data.rooms.find((x) => x.id === r.contract.roomId)?.code}
              </Link>
              <span className="flex flex-wrap gap-1.5"><DepositStatusBadge status={r.status} /><ContractStatusBadge status={r.contract.status} /></span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Aporta: {getContact(data, r.contract.tenantIds[0]!)?.name} · Custodia: {getContact(data, r.contract.landlordId)?.name}</p>
            <div className="mt-3">
              <Amounts items={[["Prevista", formatMoney(r.expectedCents)], ["Recibida", formatMoney(r.receivedCents)], ["Devuelta", formatMoney(r.returnedCents)]]} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
