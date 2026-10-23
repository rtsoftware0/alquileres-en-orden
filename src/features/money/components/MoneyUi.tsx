import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AlertCircle, Ban, CheckCircle2, CircleDashed, CircleDot, FlaskConical, RotateCcw } from "lucide-react";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import type { ChargeStatus, DepositStatus } from "../selectors";
import { capitalize, periodLabel, periodsOf } from "../selectors";
import { fieldClass } from "@/features/layout/ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/dinero", label: "Resumen", exact: true },
  { to: "/dinero/vencimientos", label: "Vencimientos", exact: false },
  { to: "/dinero/inquilinos", label: "Cuentas de inquilinos", exact: false },
  { to: "/dinero/simular", label: "Simular un cobro", exact: false },
  { to: "/dinero/fianzas", label: "Fianzas", exact: false },
] as const;

export function MoneyNav() {
  return (
    <nav aria-label="Secciones de Dinero" className="mb-6">
      <ul className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <li key={t.to}>
            <Link
              to={t.to}
              activeOptions={{ exact: t.exact, includeSearch: false }}
              activeProps={{ "aria-current": "page" }}
              className="inline-flex rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-muted data-[status=active]:border-primary data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export const chargeStatusMeta: Record<ChargeStatus, { label: string; className: string; icon: typeof CircleDot }> = {
  pendiente: { label: "Pendiente", icon: CircleDashed, className: "text-status-reserved bg-status-reserved/10 border-status-reserved/25" },
  parcial: { label: "Parcial", icon: CircleDot, className: "text-status-available bg-status-available/10 border-status-available/25" },
  satisfecho: { label: "Satisfecho", icon: CheckCircle2, className: "text-status-occupied bg-status-occupied/10 border-status-occupied/25" },
  anulado: { label: "Anulado", icon: Ban, className: "text-muted-foreground bg-muted border-border" },
};

const badge = "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap";

export function ChargeStatusBadge({ status }: { status: ChargeStatus }) {
  const m = chargeStatusMeta[status];
  const Icon = m.icon;
  return <span className={cn(badge, m.className)}><Icon className="h-3.5 w-3.5" aria-hidden="true" />{m.label}</span>;
}

export function OverdueTag() {
  return (
    <span className={cn(badge, "text-status-blocked bg-status-blocked/10 border-status-blocked/25")} title={`Fecha de vencimiento anterior a la fecha de referencia con importe sin cubrir`}>
      <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />Vencido
    </span>
  );
}

export const depositStatusMeta: Record<DepositStatus, { label: string; className: string }> = {
  sin_movimientos: { label: "Sin movimientos", className: "text-muted-foreground bg-muted border-border" },
  pendiente_aportar: { label: "Pendiente de aportar", className: "text-status-reserved bg-status-reserved/10 border-status-reserved/25" },
  recibida: { label: "Recibida", className: "text-status-occupied bg-status-occupied/10 border-status-occupied/25" },
  devuelta: { label: "Devuelta", className: "text-secondary-foreground bg-secondary border-border" },
  devuelta_parcial: { label: "Devuelta en parte", className: "text-secondary-foreground bg-secondary border-border" },
};

export function DepositStatusBadge({ status }: { status: DepositStatus }) {
  const m = depositStatusMeta[status];
  return <span className={cn(badge, m.className)}>{m.label}</span>;
}

/** A figure that always says what it measures. */
export function Figure({ label, value, help, strong, children }: { label: string; value: string; help: string; strong?: boolean; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className={cn("tabular mt-1 font-semibold text-foreground", strong ? "text-3xl" : "text-xl")}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{help}</p>
      {children && <div className="mt-2 text-sm">{children}</div>}
    </div>
  );
}

export function SimulationNotice() {
  return (
    <p role="note" className="mb-4 flex items-center gap-2 rounded-md border border-demo-foreground/30 bg-demo px-3 py-2 text-sm font-semibold text-demo-foreground">
      <FlaskConical className="h-4 w-4 shrink-0" aria-hidden="true" />
      Simulación: no se registra ningún cobro
    </p>
  );
}

export function PeriodPropertyFilters({
  period, propertyId, onChange, onReset, children, periodHelp = true, hasOther = false,
}: {
  period: string | undefined;
  propertyId: string | undefined;
  onChange: (patch: { periodo?: string | undefined; inmueble?: string | undefined }) => void;
  onReset: () => void;
  children?: ReactNode;
  periodHelp?: boolean;
  hasOther?: boolean;
}) {
  const active = Boolean(period || propertyId) || hasOther;
  return (
    <div className="mb-4 rounded-lg border border-border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Periodo</span>
          <select value={period ?? "todos"} onChange={(e) => onChange({ periodo: e.target.value === "todos" ? undefined : e.target.value })} className={fieldClass}>
            <option value="todos">Todos los periodos</option>
            {periodsOf(data).map((p) => <option key={p} value={p}>{capitalize(periodLabel(p))}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Inmueble</span>
          <select value={propertyId ?? "todos"} onChange={(e) => onChange({ inmueble: e.target.value === "todos" ? undefined : e.target.value })} className={fieldClass}>
            <option value="todos">Todos los inmuebles</option>
            {data.properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <Button variant="outline" onClick={onReset} disabled={!active} className="h-10"><RotateCcw className="h-4 w-4" aria-hidden="true" /> Restablecer</Button>
      </div>
      {children}
      {periodHelp && (
        <p className="mt-3 text-xs text-muted-foreground">
          El periodo filtra los cargos por su mes de devengo y los cobros por su fecha de recepción.
        </p>
      )}
    </div>
  );
}

export function Amounts({ items }: { items: [string, string, boolean?][] }) {
  return (
    <dl className="tabular grid grid-cols-3 gap-2 text-sm">
      {items.map(([k, v, bold]) => (
        <div key={k} className="min-w-0">
          <dt className="text-xs text-muted-foreground">{k}</dt>
          <dd className={bold ? "font-semibold" : ""}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}
