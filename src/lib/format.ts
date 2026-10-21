const eur0 = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
  useGrouping: "always",
} as unknown as Intl.NumberFormatOptions);

const eur2 = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: "always",
} as unknown as Intl.NumberFormatOptions);

export const formatEUR = (n: number) => eur0.format(n);

/** Integer cents -> EUR, showing cents only when not a whole amount. */
export const formatCents = (cents: number) =>
  cents % 100 === 0 ? eur0.format(cents / 100) : eur2.format(cents / 100);

export const formatPercent = (rate: number) => `${Math.round(rate * 100)} %`;

/** ISO yyyy-mm-dd -> DD/MM/AAAA, without timezone conversion. */
export function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** Calendar arithmetic in UTC so local timezones never shift the day. */
export function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y!, m! - 1, d! + days));
  return t.toISOString().slice(0, 10);
}
