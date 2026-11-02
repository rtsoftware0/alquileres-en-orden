// Pure CSV import engine for the temporary catalog. Parses locally (PapaParse,
// never dynamicTyping), maps only allowed fields, validates a whole batch with
// the catalog validators and produces at most one new overlay. Never mutates
// the base dataset or the overlay passed in; creates no contracts, money or access.
// Depends on ../engine only (engine never imports this module).
import Papa from "papaparse";
import type { ContactRole, ContactType, PortfolioDataset } from "@/features/portfolio/data/types";
import {
  CATALOG_ID_PREFIX, CATALOG_ROLES, mergeCatalog, normalizeCode, normalizeName, validateContact, validateProperty, validateRoom,
} from "../engine";
import type {
  CatalogContact, CatalogDataset, CatalogImports, CatalogKind, CatalogOverlay, CatalogProperty, CatalogRoom, FieldErrors,
  ImportReceipt, PropertyKind, UnitKind,
} from "../types";
import {
  ENTITY_KIND, MAX_IMPORT_BYTES, MAX_IMPORT_ROWS, TEMPLATE_FIELDS, normalizeKey,
  type DecimalFormat, type Delimiter, type ImportEntity,
} from "./templates";

// ---------- File level ----------

export function checkFileSize(size: number): string | null {
  if (size <= 0) return "El archivo está vacío.";
  if (size > MAX_IMPORT_BYTES) return "El archivo supera el límite preventivo de 10 MB. No se ha leído ni recortado.";
  return null;
}

/** Strict UTF-8 decoding: invalid bytes reject the file instead of being replaced. */
export function decodeUtf8(buf: ArrayBuffer): { ok: true; text: string } | { ok: false; error: string } {
  try {
    return { ok: true, text: new TextDecoder("utf-8", { fatal: true }).decode(buf) };
  } catch {
    return { ok: false, error: "El archivo no está codificado en UTF-8. Guárdalo como «CSV UTF-8» e inténtalo de nuevo." };
  }
}

export interface ParsedCsv { headers: string[]; rows: string[][] }
export type ParseOutcome = { ok: true; csv: ParsedCsv } | { ok: false; error: string };

export function parseCsvText(raw: string, delimiter: Delimiter): ParseOutcome {
  const text = raw.startsWith("\uFEFF") ? raw.slice(1) : raw;
  if (!text.trim()) return { ok: false, error: "El archivo está vacío." };
  // preview stops early: a file over the limit is rejected without parsing it all.
  const res = Papa.parse<string[]>(text, { delimiter, header: false, dynamicTyping: false, skipEmptyLines: "greedy", preview: MAX_IMPORT_ROWS + 2 });
  const quoteErr = res.errors.find((e) => e.type === "Quotes");
  if (quoteErr) return { ok: false, error: `CSV mal formado: comillas sin cerrar o inesperadas${quoteErr.row !== undefined ? ` cerca de la fila ${quoteErr.row + 2}` : ""}.` };
  const data = res.data;
  if (data.length > MAX_IMPORT_ROWS + 1) return { ok: false, error: `El archivo supera el límite preventivo de ${MAX_IMPORT_ROWS} registros. No se importa ni se recorta; divídelo en varios archivos.` };
  const headerRow = data[0];
  if (!headerRow) return { ok: false, error: "El archivo está vacío." };
  const headers = headerRow.map((h) => h.trim());
  if (data.length < 2) return { ok: false, error: "El archivo solo contiene la cabecera; no hay registros." };
  if (headers.some((h) => !h)) return { ok: false, error: "Hay columnas sin nombre en la cabecera." };
  const seen = new Map<string, string>();
  const repeated: string[] = [];
  for (const h of headers) {
    const k = normalizeKey(h);
    if (seen.has(k)) repeated.push(`${seen.get(k)} / ${h}`);
    else seen.set(k, h);
  }
  if (repeated.length) return { ok: false, error: `Columnas repetidas o ambiguas: ${repeated.join(", ")}.` };
  const rows = data.slice(1);
  const bad = rows.map((r, i) => ({ line: i + 2, n: r.length })).filter((x) => x.n !== headers.length);
  if (bad.length) {
    const list = bad.slice(0, 5).map((b) => `fila ${b.line} (${b.n})`).join(", ");
    return { ok: false, error: `Anchura de filas desigual: se esperaban ${headers.length} columnas; ${list}${bad.length > 5 ? ` y ${bad.length - 5} más` : ""}. Revisa el separador elegido.` };
  }
  return { ok: true, csv: { headers, rows } };
}

// ---------- Mapping ----------

/** Per header index: the allowed field key, or null when the column is excluded. */
export type Mapping = (string | null)[];

export function autoMapping(entity: ImportEntity, headers: string[]): Mapping {
  const fields = TEMPLATE_FIELDS[entity];
  return headers.map((h) => {
    const k = normalizeKey(h);
    const f = fields.find((x) => x.key === k) ?? fields.find((x) => x.aliases.includes(k) || normalizeKey(x.label) === k);
    return f ? f.key : null;
  });
}

export function mappingIssues(entity: ImportEntity, headers: string[], mapping: Mapping) {
  const fields = TEMPLATE_FIELDS[entity];
  const errors: string[] = [];
  const excluded: string[] = [];
  const byField = new Map<string, string[]>();
  headers.forEach((h, i) => {
    const key = mapping[i] ?? null;
    if (key === null) { excluded.push(h); return; }
    if (!fields.some((f) => f.key === key)) { errors.push(`La columna ${h} tiene un campo no permitido.`); return; }
    byField.set(key, [...(byField.get(key) ?? []), h]);
  });
  for (const [key, cols] of byField) {
    if (cols.length > 1) errors.push(`El campo «${fields.find((f) => f.key === key)?.label}» está asignado a varias columnas: ${cols.join(", ")}.`);
  }
  for (const f of fields) if (f.required && !byField.has(f.key)) errors.push(`Falta asignar el campo obligatorio «${f.label}».`);
  return { errors, excluded };
}

// ---------- Values ----------

export type Parsed<T> = { ok: true; value: T | undefined } | { ok: false; error: string };

/** Strict decimal: digits, optional sign and the chosen decimal mark; no thousands separator, at most 2 decimals. */
export function parseDecimalStrict(raw: string, decimal: DecimalFormat): Parsed<number> {
  const s = raw.trim();
  if (!s) return { ok: true, value: undefined };
  const m = (decimal === "," ? /^([+-]?)(\d+)(?:,(\d+))?$/ : /^([+-]?)(\d+)(?:\.(\d+))?$/).exec(s);
  if (!m) return { ok: false, error: `Número no válido: usa «${decimal}» como separador decimal y sin separador de miles.` };
  const frac = m[3] ?? "";
  if (frac.length > 2) return { ok: false, error: "Usa como máximo dos decimales." };
  const cents = Number(m[2]) * 100 + Number(frac.padEnd(2, "0") || "0");
  if (!Number.isFinite(cents)) return { ok: false, error: "Número no válido." };
  return { ok: true, value: (m[1] === "-" ? -cents : cents) / 100 };
}

export function parseIntegerStrict(raw: string): Parsed<number> {
  const s = raw.trim();
  if (!s) return { ok: true, value: undefined };
  if (!/^[+-]?\d+$/.test(s)) return { ok: false, error: "Debe ser un número entero." };
  return { ok: true, value: Number(s) };
}

const CONTACT_TYPES: ContactType[] = ["persona", "empresa"];
const PROPERTY_KINDS: PropertyKind[] = ["vivienda", "edificio", "local"];
const UNIT_KINDS: UnitKind[] = ["habitacion", "vivienda_completa", "estudio"];
const pickEnum = <T extends string>(list: readonly T[], raw: string): T | undefined => list.find((x) => x === normalizeKey(raw));
const splitList = (raw: string) => raw.split("|").map((x) => x.trim()).filter(Boolean);
const clean = (s: string) => s.trim().replace(/\s+/g, " ");

// ---------- Review ----------

export interface ImportInput {
  entity: ImportEntity;
  headers: string[];
  rows: string[][];
  mapping: Mapping;
  delimiter: Delimiter;
  decimal: DecimalFormat;
  /** Identifies the file content (name, size and a hash of the text). */
  contentKey: string;
}

export type RowStatus = "nueva" | "omitida" | "error";
export interface RowReport { line: number; code: string; status: RowStatus; messages: string[] }

export interface ImportReview {
  input: ImportInput;
  /** Overlay the review was computed from; any other current overlay makes it stale. */
  basis: CatalogOverlay;
  key: string;
  ok: boolean;
  errors: string[];
  warnings: string[];
  rows: RowReport[];
  created: number;
  omitted: number;
  ids: string[];
  next?: CatalogOverlay;
}

export type ImportCommit =
  | { ok: true; created: number; omitted: number; ids: string[]; batch: number | null }
  | { ok: false; reason: "stale" | "errors" | "warnings"; message: string };

/** Small deterministic string hash (not security; only identifies content). */
export function hashText(s: string): string {
  let h1 = 0xdeadbeef ^ s.length, h2 = 0x41c6ce57 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

export const reviewKey = (i: ImportInput) =>
  hashText(JSON.stringify([i.entity, i.contentKey, i.delimiter, i.decimal, i.headers, i.mapping]));

const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);
const fpKey = (fp: string) => `fp:${fp}`;
const refKey = (kind: CatalogKind, ref: string) => `ref:${kind}:${ref}`;
const emptyImports = (): CatalogImports => ({ receipts: {}, externalRefs: {}, batches: 0 });

const fieldLabel = (entity: ImportEntity, f: string) => TEMPLATE_FIELDS[entity].find((x) => x.key === f)?.label ?? f;
const ERR_FIELD: Partial<Record<keyof FieldErrors, string>> = {
  code: "codigo", name: "nombre", type: "tipo", roles: "roles", email: "email", phone: "telefono", address: "direccion", note: "nota",
  ownerId: "propietario_codigo", kind: "tipo", propertyId: "inmueble_codigo", monthlyRent: "renta_mensual", areaM2: "superficie_m2",
  capacity: "capacidad", unitKind: "tipo_unidad", features: "caracteristicas",
};

interface Built { rec: CatalogContact | CatalogProperty | CatalogRoom; code: string; name: string; email: string; fp: string; ref: string }

function buildRow(entity: ImportEntity, view: CatalogDataset, get: (k: string) => string, id: string, decimal: DecimalFormat): { built?: Built; messages: string[] } {
  const messages: string[] = [];
  const err = (f: string, m: string) => messages.push(`${fieldLabel(entity, f)}: ${m}`);
  const ref = clean(get("referencia_externa"));
  if (ref.length > 80) err("referencia_externa", "máximo 80 caracteres.");
  const code = clean(get("codigo"));
  const opt = (k: string) => { const v = clean(get(k)); return v ? v : undefined; };
  if (entity === "contactos") {
    const type = pickEnum(CONTACT_TYPES, get("tipo"));
    if (!type) err("tipo", "usa persona o empresa.");
    const rawRoles = splitList(get("roles"));
    const roles: ContactRole[] = [];
    for (const r of rawRoles) {
      const k = pickEnum(CATALOG_ROLES, r);
      if (!k) err("roles", `rol «${r}» no admitido.`);
      else if (!roles.includes(k)) roles.push(k);
    }
    const email = opt("email"), phone = opt("telefono"), address = opt("direccion"), note = opt("nota");
    if (messages.length || !type) return { messages };
    const rec: CatalogContact = {
      id, code, name: clean(get("nombre")), type, roles,
      ...(email ? { email } : {}), ...(phone ? { phone } : {}), ...(address ? { address } : {}), ...(note ? { note } : {}),
    };
    const fp = JSON.stringify(["contact", normalizeCode(code), normalizeName(rec.name), type, [...roles].sort(), (email ?? "").toLowerCase(), phone ?? "", normalizeName(address ?? ""), note ?? ""]);
    return { messages, built: { rec, code, name: rec.name, email: (email ?? "").toLowerCase(), fp, ref } };
  }
  if (entity === "inmuebles") {
    const ownerCode = normalizeCode(get("propietario_codigo"));
    const owners = ownerCode ? view.contacts.filter((c) => normalizeCode(c.code) === ownerCode) : [];
    if (owners.length !== 1) err("propietario_codigo", owners.length ? "código ambiguo." : `no existe un contacto con el código «${clean(get("propietario_codigo"))}».`);
    const kindRaw = clean(get("tipo"));
    const kind = kindRaw ? pickEnum(PROPERTY_KINDS, kindRaw) : undefined;
    if (kindRaw && !kind) err("tipo", "usa vivienda, edificio o local.");
    const owner = owners[0];
    if (messages.length || !owner) return { messages };
    const portfolioLabel = opt("cartera"), companyLabel = opt("sociedad"), managerName = opt("responsable");
    const rec: CatalogProperty = {
      id, code, name: clean(get("nombre")), address: clean(get("direccion")), ownerId: owner.id,
      ...(kind ? { kind } : {}), ...(portfolioLabel ? { portfolioLabel } : {}), ...(companyLabel ? { companyLabel } : {}), ...(managerName ? { managerName } : {}),
    };
    const fp = JSON.stringify(["property", normalizeCode(code), normalizeName(rec.name), normalizeName(rec.address), owner.id, kind ?? "", portfolioLabel ?? "", companyLabel ?? "", managerName ?? ""]);
    return { messages, built: { rec, code, name: rec.name, email: "", fp, ref } };
  }
  const propCode = normalizeCode(get("inmueble_codigo"));
  const props = propCode ? view.properties.filter((p) => normalizeCode(p.code) === propCode) : [];
  if (props.length !== 1) err("inmueble_codigo", props.length ? "código ambiguo." : `no existe un inmueble con el código «${clean(get("inmueble_codigo"))}».`);
  const rent = parseDecimalStrict(get("renta_mensual"), decimal);
  if (!rent.ok) err("renta_mensual", rent.error);
  else if (rent.value === undefined) err("renta_mensual", "obligatoria.");
  const area = parseDecimalStrict(get("superficie_m2"), decimal);
  if (!area.ok) err("superficie_m2", area.error);
  const cap = parseIntegerStrict(get("capacidad"));
  if (!cap.ok) err("capacidad", cap.error);
  const ukRaw = clean(get("tipo_unidad"));
  const unitKind = ukRaw ? pickEnum(UNIT_KINDS, ukRaw) : undefined;
  if (ukRaw && !unitKind) err("tipo_unidad", "usa habitacion, vivienda_completa o estudio.");
  const prop = props[0];
  if (messages.length || !prop || !rent.ok || rent.value === undefined || !area.ok || !cap.ok) return { messages };
  const features = splitList(get("caracteristicas"));
  const statusNote = opt("nota");
  const rec: CatalogRoom = {
    id, code, propertyId: prop.id, status: "disponible", monthlyRent: rent.value, areaM2: area.value ?? 0, features,
    ...(unitKind ? { unitKind } : {}), ...(cap.value !== undefined ? { capacity: cap.value } : {}), ...(statusNote ? { statusNote } : {}),
  };
  const fp = JSON.stringify(["room", normalizeCode(code), prop.id, Math.round(rent.value * 100), Math.round((area.value ?? 0) * 100), unitKind ?? "", cap.value ?? "", [...features].sort(), statusNote ?? ""]);
  return { messages, built: { rec, code, name: "", email: "", fp, ref } };
}

/** Reviews a whole batch against the given overlay; returns the single next overlay when valid. */
export function prepareImport(base: PortfolioDataset, overlay: CatalogOverlay, input: ImportInput): ImportReview {
  const { entity, headers, rows, mapping, decimal } = input;
  const kind = ENTITY_KIND[entity];
  const key = reviewKey(input);
  const fail = (errors: string[]): ImportReview => ({ input, basis: overlay, key, ok: false, errors, warnings: [], rows: [], created: 0, omitted: 0, ids: [] });
  if (rows.length === 0) return fail(["No hay registros."]);
  if (rows.length > MAX_IMPORT_ROWS) return fail([`Más de ${MAX_IMPORT_ROWS} registros: no se importa ni se recorta.`]);
  const issues = mappingIssues(entity, headers, mapping);
  if (issues.errors.length) return fail(issues.errors);

  const col = new Map<string, number>();
  mapping.forEach((k, i) => { if (k !== null) col.set(k, i); });
  const view = mergeCatalog(base, overlay);
  const imports = overlay.imports ?? emptyImports();
  const existing = kind === "contact" ? view.contacts : kind === "property" ? view.properties : view.rooms;
  const codes = new Set(existing.map((x) => normalizeCode(x.code)));
  const seenFp = new Map<string, number>(), seenCode = new Map<string, number>(), seenRef = new Map<string, number>();
  const seenName = new Map<string, number>(), seenMail = new Map<string, number>();
  const reports: RowReport[] = [];
  const warnings: string[] = [];
  const created: (CatalogContact | CatalogProperty | CatalogRoom)[] = [];
  const receipts: Record<string, ImportReceipt> = { ...imports.receipts };
  const refs: Record<string, string> = { ...imports.externalRefs };
  const batch = imports.batches + 1;
  let seq = overlay.seq;
  let omitted = 0;

  rows.forEach((row, i) => {
    const line = i + 2;
    const get = (k: string) => { const c = col.get(k); return c === undefined ? "" : (row[c] ?? ""); };
    const code = clean(get("codigo"));
    const id = `${CATALOG_ID_PREFIX[kind]}${seq + 1}`;
    const { built, messages } = buildRow(entity, view, get, id, decimal);
    const report: RowReport = { line, code, status: "error", messages };
    reports.push(report);
    if (!built) return;
    const nCode = normalizeCode(code);
    const dupFp = seenFp.get(built.fp);
    if (dupFp !== undefined) { messages.push(`Fila repetida: coincide con la fila ${dupFp}.`); return; }
    seenFp.set(built.fp, line);
    const dupCode = nCode ? seenCode.get(nCode) : undefined;
    if (dupCode !== undefined) { messages.push(`El código ${code} se repite en la fila ${dupCode}.`); return; }
    if (nCode) seenCode.set(nCode, line);
    if (built.ref) {
      const dupRef = seenRef.get(built.ref);
      if (dupRef !== undefined) { messages.push(`La referencia externa ${built.ref} se repite en la fila ${dupRef}.`); return; }
      seenRef.set(built.ref, line);
    }
    const fk = fpKey(built.fp);
    // An external reference already bound to a different fingerprint is a
    // conflict, checked before omitting by known fingerprint.
    if (built.ref) {
      const rk = refKey(kind, built.ref);
      if (own(imports.externalRefs, rk) && imports.externalRefs[rk] !== fk) {
        messages.push(`Conflicto: la referencia externa ${built.ref} ya se importó con otros datos. No se actualiza ni se fusiona.`);
        return;
      }
    }
    if (own(imports.receipts, fk)) {
      const r = imports.receipts[fk];
      report.status = "omitida";
      messages.push(`Ya importada en el lote ${r?.batch ?? "anterior"}; se omite sin cambios.`);
      omitted++;
      return;
    }
    if (built.ref && own(imports.externalRefs, refKey(kind, built.ref))) {
      messages.push(`Conflicto: la referencia externa ${built.ref} ya se importó con otros datos. No se actualiza ni se fusiona.`);
      return;
    }
    if (nCode && codes.has(nCode)) {
      messages.push(`Conflicto: el código ${code} ya existe en el catálogo con otros datos. No se fusiona ni se actualiza.`);
      return;
    }
    const v = kind === "contact" ? validateContact(view, built.rec as CatalogContact, false)
      : kind === "property" ? validateProperty(view, built.rec as CatalogProperty)
      : validateRoom(view, built.rec as CatalogRoom);
    for (const [f, m] of Object.entries(v.errors)) {
      const tf = ERR_FIELD[f as keyof FieldErrors];
      messages.push(tf ? `${fieldLabel(entity, tf)}: ${m}` : m);
    }
    if (messages.length) return;
    for (const w of v.warnings) warnings.push(`Fila ${line}: ${w}`);
    const nName = built.name ? normalizeName(built.name) : "";
    if (nName) {
      const prev = seenName.get(nName);
      if (prev !== undefined) warnings.push(`Fila ${line}: nombre parecido al de la fila ${prev}. No se fusionan automáticamente.`);
      else seenName.set(nName, line);
    }
    if (built.email) {
      const prev = seenMail.get(built.email);
      if (prev !== undefined) warnings.push(`Fila ${line}: el correo coincide con la fila ${prev}. No se fusionan automáticamente.`);
      else seenMail.set(built.email, line);
    }
    seq++;
    created.push(built.rec);
    receipts[fk] = { entity: kind, id: built.rec.id, batch, ...(built.ref ? { externalRef: built.ref } : {}) };
    if (built.ref) refs[refKey(kind, built.ref)] = fk;
    report.status = "nueva";
  });

  const ok = reports.every((r) => r.status !== "error");
  const ids = ok ? created.map((r) => r.id) : [];
  const review: ImportReview = { input, basis: overlay, key, ok, errors: [], warnings: ok ? warnings : [], rows: reports, created: ok ? created.length : 0, omitted, ids };
  if (ok && created.length > 0) {
    const added = { ...overlay.added };
    if (kind === "contact") added.contacts = [...added.contacts, ...(created as CatalogContact[])];
    else if (kind === "property") added.properties = [...added.properties, ...(created as CatalogProperty[])];
    else added.rooms = [...added.rooms, ...(created as CatalogRoom[])];
    review.next = { ...overlay, added, seq, imports: { receipts, externalRefs: refs, batches: batch } };
  }
  return review;
}

/**
 * Confirms a review against the CURRENT overlay. A review computed from any
 * other overlay is stale (this also rejects a second confirmation). Errors or
 * unaccepted warnings change nothing. Returns the overlay to write, if any.
 */
export function commitImport(base: PortfolioDataset, current: CatalogOverlay, review: ImportReview, acceptWarnings: boolean): { result: ImportCommit; next?: CatalogOverlay } {
  if (current !== review.basis) return { result: { ok: false, reason: "stale", message: "La revisión ha caducado porque el catálogo cambió. Revisa de nuevo antes de confirmar." } };
  const fresh = prepareImport(base, current, review.input);
  if (fresh.key !== review.key || !fresh.ok) return { result: { ok: false, reason: "errors", message: "La revisión contiene errores. No se ha importado nada." } };
  if (fresh.warnings.length && !acceptWarnings) return { result: { ok: false, reason: "warnings", message: "Acepta las advertencias antes de confirmar. No se ha importado nada." } };
  if (!fresh.next) return { result: { ok: true, created: 0, omitted: fresh.omitted, ids: [], batch: null } };
  return { result: { ok: true, created: fresh.created, omitted: fresh.omitted, ids: fresh.ids, batch: fresh.next.imports?.batches ?? null }, next: fresh.next };
}

/** Index of external references by record ID (kind:id), built once per export. */
export function externalRefIndex(overlay: CatalogOverlay): Map<string, string> {
  const out = new Map<string, string>();
  const rec = overlay.imports?.receipts;
  if (!rec) return out;
  for (const k of Object.keys(rec)) {
    const r = rec[k];
    if (r?.externalRef) out.set(`${r.entity}:${r.id}`, r.externalRef);
  }
  return out;
}
