import { Link, useNavigate } from "@tanstack/react-router";
import { Search, SearchX } from "lucide-react";
import { useCatalogData } from "@/features/catalog/CatalogContext";
import { getContact } from "@/features/contacts/selectors";
import { CHARGE_STATUSES, type ChargeStatus, chargeBalance, chargeContract, filterCharges } from "./selectors";
import { Amounts, ChargeStatusBadge, MoneyNav, OverdueTag, PeriodPropertyFilters, chargeStatusMeta } from "./components/MoneyUi";
import { MoneyHeader, validateMoneySearch } from "./MoneySummaryPage";
import { fieldClass, linkClass } from "@/features/layout/ui";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ChargesSearch {
  q?: string | undefined;
  inmueble?: string | undefined;
  periodo?: string | undefined;
  estado?: ChargeStatus | undefined;
  abiertos?: "si" | undefined;
  vencido?: "si" | undefined;
}

export function validateChargesSearch(input: Record<string, unknown>): ChargesSearch {
  return {
    ...validateMoneySearch(input),
    q: typeof input["q"] === "string" && input["q"] ? input["q"].slice(0, 80) : undefined,
    estado: CHARGE_STATUSES.includes(input["estado"] as ChargeStatus) ? (input["estado"] as ChargeStatus) : undefined,
    abiertos: input["abiertos"] === "si" ? "si" : undefined,
    vencido: input["vencido"] === "si" ? "si" : undefined,
  };
}

export function ChargesPage({ search }: { search: ChargesSearch }) {
  const data = useCatalogData();
  const navigate = useNavigate({ from: "/dinero/vencimientos/" });
  const update = (patch: ChargesSearch) => navigate({ search: (prev: ChargesSearch) => ({ ...prev, ...patch }), replace: true });
  const q = search.q ?? "";
  const statusValue = search.abiertos ? "abiertos" : (search.estado ?? "todos");
  const list = filterCharges(data, {
    q, propertyId: search.inmueble ?? "todos", period: search.periodo ?? "todos",
    status: search.estado ?? "todos", overdueOnly: Boolean(search.vencido),
  }).filter((c) => !search.abiertos || chargeBalance(data, c).outstandingCents > 0);
  const hasExtra = Boolean(q || search.estado || search.abiertos || search.vencido);

  return (
    <>
      <MoneyHeader title="Vencimientos" subtitle="Cargos de renta de ejemplo" />
      <MoneyNav />
      <PeriodPropertyFilters
        period={search.periodo} propertyId={search.inmueble} periodHelp={false} hasOther={hasExtra}
        onChange={update} onReset={() => navigate({ search: {}, replace: true })}
      >
        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] sm:items-end">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Buscar</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input type="search" value={q} onChange={(e) => update({ q: e.target.value || undefined })} placeholder="Referencia, habitación, contrato o inquilino" className={cn(fieldClass, "pl-9")} />
            </span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Estado</span>
            <select
              value={statusValue}
              onChange={(e) => {
                const v = e.target.value;
                update(v === "abiertos" ? { abiertos: "si", estado: undefined } : { abiertos: undefined, estado: v === "todos" ? undefined : (v as ChargeStatus) });
              }}
              className={fieldClass}
            >
              <option value="todos">Todos</option>
              <option value="abiertos">Con saldo (pendiente o parcial)</option>
              {CHARGE_STATUSES.map((s) => <option key={s} value={s}>{chargeStatusMeta[s].label}</option>)}
            </select>
          </label>
          <label className="flex h-10 items-center gap-2 text-sm">
            <input type="checkbox" checked={Boolean(search.vencido)} onChange={(e) => update({ vencido: e.target.checked ? "si" : undefined })} className="h-4 w-4 accent-primary" />
            Solo vencidos
          </label>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          El periodo es el mes del cargo. «Vencido» indica que la fecha de vencimiento es anterior al {formatDate(data.referenceDate)} y queda importe sin cubrir; no es un pago ni sustituye al estado.
        </p>
      </PeriodPropertyFilters>

      <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
        Mostrando <strong className="tabular text-foreground">{list.length}</strong> de {data.charges.length} vencimientos
      </p>

      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
          <SearchX className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
          <p className="mt-2 font-medium">No hay vencimientos que coincidan</p>
          <p className="mt-1 text-sm text-muted-foreground">Cambia la búsqueda o restablece los filtros.</p>
          {hasExtra && <button type="button" onClick={() => navigate({ search: {}, replace: true })} className={cn(linkClass, "mt-3 text-sm")}>Quitar todos los filtros</button>}
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((c) => {
            const b = chargeBalance(data, c);
            const ct = chargeContract(data, c);
            const room = data.rooms.find((r) => r.id === ct.roomId)!;
            return (
              <li key={c.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link to="/dinero/vencimientos/$chargeId" params={{ chargeId: c.id }} className={cn(linkClass, "text-sm")}>{c.reference} · {c.concept}</Link>
                  <span className="flex flex-wrap gap-1.5"><ChargeStatusBadge status={b.status} />{b.overdue && <OverdueTag />}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Vence {formatDate(c.dueDate)} · {room.code} · {ct.reference} · {getContact(data, c.payerId)?.name}
                </p>
                <div className="mt-3">
                  <Amounts items={[["Importe original", formatMoney(b.amountCents)], ["Cobrado / asignado", formatMoney(b.allocatedCents)], ["Pendiente", formatMoney(b.outstandingCents), true]]} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
