const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
  useGrouping: "always",
} as unknown as Intl.NumberFormatOptions);

export const formatEUR = (n: number) => eur.format(n);

export const formatPercent = (rate: number) => `${Math.round(rate * 100)} %`;

/** ISO yyyy-mm-dd -> DD/MM/AAAA, without timezone conversion. */
export function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
