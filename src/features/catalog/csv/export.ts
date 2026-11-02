// Single CSV serializer for templates, visible catalog lists and error reports.
// UTF-8 BOM + CRLF, RFC 4180 quoting, and formula neutralization for text
// cells. Downloads are local Blobs only (no network, no storage).
import type { CatalogContact, CatalogDataset, CatalogOverlay, CatalogProperty, CatalogRoom } from "../types";
import { externalRefIndex, type ImportReview } from "./import-engine";
import { TEMPLATE_EXAMPLE, TEMPLATE_FIELDS, type DecimalFormat, type Delimiter, type ImportEntity } from "./templates";

export interface CsvOptions { delimiter: Delimiter; decimal: DecimalFormat }
export const DEFAULT_CSV: CsvOptions = { delimiter: ";", decimal: "," };

export type Cell = string | number | undefined | null;

const PLAIN_NUMBER = /^[+-]?\d+(?:[.,]\d+)?$/;

/** True for text a spreadsheet could run as a formula (also behind spaces/control characters). */
export function isDangerousText(s: string): boolean {
  if (PLAIN_NUMBER.test(s)) return false;
  if (/^[\t\r]/.test(s)) return true;
  const lead = s.replace(/^[\s\u0000-\u001f\u007f]+/, "");
  return /^[=+\-@]/.test(lead);
}

export function formatNumber(n: number, decimal: DecimalFormat): string {
  const s = Number.isInteger(n) ? String(n) : n.toFixed(2);
  return decimal === "," ? s.replace(".", ",") : s;
}

export function csvCell(v: Cell, opts: CsvOptions): { text: string; protectedText: boolean } {
  if (v === undefined || v === null) return { text: "", protectedText: false };
  let s = typeof v === "number" ? (Number.isFinite(v) ? formatNumber(v, opts.decimal) : "") : v;
  let protectedText = false;
  if (typeof v === "string" && isDangerousText(s)) { s = `'${s}`; protectedText = true; }
  const needsQuote = s.includes(opts.delimiter) || /["\r\n]/.test(s) || /^\s|\s$/.test(s);
  return { text: needsQuote ? `"${s.replace(/"/g, '""')}"` : s, protectedText };
}

export function serializeCsv(headers: string[], rows: Cell[][], opts: CsvOptions): { text: string; protectedCells: number } {
  let protectedCells = 0;
  const line = (cells: Cell[]) => cells.map((c) => { const r = csvCell(c, opts); if (r.protectedText) protectedCells++; return r.text; }).join(opts.delimiter);
  const body = [line(headers), ...rows.map(line)].join("\r\n");
  return { text: `\uFEFF${body}\r\n`, protectedCells };
}

export function templateCsv(entity: ImportEntity, opts: CsvOptions = DEFAULT_CSV) {
  const example = TEMPLATE_EXAMPLE[entity].map((v) => (opts.decimal === "." ? v.replace(/^(\d+),(\d+)$/, "$1.$2") : v));
  return serializeCsv(TEMPLATE_FIELDS[entity].map((f) => f.key), [example], opts);
}

/** Visible records with the same columns as the template (relations as codes). */
export function catalogCsv(entity: ImportEntity, ids: string[], view: CatalogDataset, overlay: CatalogOverlay, opts: CsvOptions = DEFAULT_CSV) {
  const refs = externalRefIndex(overlay);
  const headers = TEMPLATE_FIELDS[entity].map((f) => f.key);
  const want = new Set(ids);
  let rows: Cell[][];
  if (entity === "contactos") {
    rows = view.contacts.filter((c) => want.has(c.id)).map((c: CatalogContact) => [refs.get(`contact:${c.id}`) ?? "", c.code, c.name, c.type, c.roles.join("|"), c.email, c.phone, c.address, c.note]);
  } else if (entity === "inmuebles") {
    const contactCode = new Map(view.contacts.map((c) => [c.id, c.code]));
    rows = view.properties.filter((p) => want.has(p.id)).map((p: CatalogProperty) => [refs.get(`property:${p.id}`) ?? "", p.code, p.name, p.address, contactCode.get(p.ownerId) ?? "", p.kind, p.portfolioLabel, p.companyLabel, p.managerName]);
  } else {
    const propCode = new Map(view.properties.map((p) => [p.id, p.code]));
    rows = view.rooms.filter((r) => want.has(r.id)).map((r: CatalogRoom) => [refs.get(`room:${r.id}`) ?? "", r.code, propCode.get(r.propertyId) ?? "", r.monthlyRent, r.unitKind, r.capacity, r.areaM2 ? r.areaM2 : undefined, r.features.join("|"), r.statusNote]);
  }
  return serializeCsv(headers, rows, opts);
}

export function errorsCsv(review: ImportReview, opts: CsvOptions = DEFAULT_CSV) {
  const rows: Cell[][] = [
    ...review.errors.map((m) => ["", "", "error", m] as Cell[]),
    ...review.rows.filter((r) => r.status !== "nueva").flatMap((r) => r.messages.map((m) => [r.line, r.code, r.status, m] as Cell[])),
  ];
  return serializeCsv(["fila", "codigo", "estado", "mensaje"], rows, opts);
}

/** Local download through a temporary object URL, revoked right after use. */
export function downloadCsv(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
