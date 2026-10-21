import type { OccupancySummary as Summary } from "../selectors";
import { formatPercent } from "@/lib/format";

export function OccupancySummary({ s }: { s: Summary }) {
  return (
    <div>
      <p className="tabular text-3xl font-semibold text-foreground">{formatPercent(s.rate)}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {s.occupied} de {s.rentable} habitaciones disponibles para alquilar están ocupadas
      </p>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`Ocupación ${formatPercent(s.rate)}`}
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${s.rate * 100}%` }} />
      </div>
      <dl className="tabular mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
        <div><dt className="text-muted-foreground">Ocupadas</dt><dd className="font-medium">{s.occupied}</dd></div>
        <div><dt className="text-muted-foreground">Disponibles</dt><dd className="font-medium">{s.available}</dd></div>
        <div><dt className="text-muted-foreground">Reservadas</dt><dd className="font-medium">{s.reserved}</dd></div>
        <div><dt className="text-muted-foreground">Bloqueadas</dt><dd className="font-medium">{s.blocked}</dd></div>
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">
        {s.total} habitaciones gestionadas en total. Las bloqueadas no cuentan para la ocupación.
      </p>
    </div>
  );
}
