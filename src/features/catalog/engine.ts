// Pure catalog overlay engine. Never mutates the base dataset or the overlay
// passed in; every operation returns a new overlay. Only contacts, properties
// and rooms are replaced in the merged view; all other collections keep the
// exact base references so money, contracts, occupancy and portals derive the
// same values. Grants no access and creates no financial activity.
import type { ContactRole, PortfolioDataset } from "@/features/portfolio/data/types";
import type {
  CatalogContact, CatalogDataset, CatalogKind, CatalogLabels, CatalogOverlay, CatalogProperty, CatalogResult, CatalogRoom,
  ContactPatch, FieldErrors, FieldName, PropertyPatch, RoomPatch,
} from "./types";

export const CATALOG_ROLES: ContactRole[] = ["inquilino", "propietario", "arrendador", "proveedor", "avalista", "candidato"];
const PROPERTY_KINDS = ["vivienda", "edificio", "local"] as const;
const UNIT_KINDS = ["habitacion", "vivienda_completa", "estudio"] as const;

export const emptyOverlay = (): CatalogOverlay => ({
  added: { contacts: [], properties: [], rooms: [] },
  edits: { contacts: {}, properties: {}, rooms: {} },
  seq: 0,
});

export const isOverlayEmpty = (o: CatalogOverlay) =>
  o.added.contacts.length + o.added.properties.length + o.added.rooms.length === 0 &&
  Object.keys(o.edits.contacts).length + Object.keys(o.edits.properties).length + Object.keys(o.edits.rooms).length === 0;

/** Accent/case/punctuation-insensitive code comparison. */
export const normalizeCode = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const normalizeName = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const patch = <T extends object>(rec: T, p: object | undefined): T => (p ? { ...rec, ...p } : rec);

/** Applies a property patch; only `kind` accepts null, which removes it (the record never holds null). */
export function applyPropertyPatch(rec: CatalogProperty, p: PropertyPatch | undefined): CatalogProperty {
  if (!p) return rec;
  const { kind, ...rest } = p;
  const next: CatalogProperty = { ...rec, ...rest };
  if (kind === null) delete next.kind;
  else if (kind !== undefined) next.kind = kind;
  return next;
}

/** Applies a room patch; only `unitKind` and `capacity` accept null, which removes them. */
export function applyRoomPatch(rec: CatalogRoom, p: RoomPatch | undefined): CatalogRoom {
  if (!p) return rec;
  const { unitKind, capacity, ...rest } = p;
  const next: CatalogRoom = { ...rec, ...rest };
  if (unitKind === null) delete next.unitKind;
  else if (unitKind !== undefined) next.unitKind = unitKind;
  if (capacity === null) delete next.capacity;
  else if (capacity !== undefined) next.capacity = capacity;
  return next;
}

export function mergeCatalog(base: PortfolioDataset, overlay: CatalogOverlay): CatalogDataset {
  return {
    ...base,
    contacts: [...base.contacts, ...overlay.added.contacts].map((c) => patch<CatalogContact>(c, overlay.edits.contacts[c.id])),
    properties: [...base.properties, ...overlay.added.properties].map((p) => applyPropertyPatch(p, overlay.edits.properties[p.id])),
    rooms: [...base.rooms, ...overlay.added.rooms].map((r) => applyRoomPatch(r, overlay.edits.rooms[r.id])),
  };
}

export function isBaseRecord(base: PortfolioDataset, kind: CatalogKind, id: string) {
  const list = kind === "contact" ? base.contacts : kind === "property" ? base.properties : base.rooms;
  return list.some((x) => x.id === id);
}
export function isAddedRecord(overlay: CatalogOverlay, kind: CatalogKind, id: string) {
  const list = kind === "contact" ? overlay.added.contacts : kind === "property" ? overlay.added.properties : overlay.added.rooms;
  return list.some((x) => x.id === id);
}

/** Fields that cannot change for a record; IDs are always immutable. */
export function protectedFields(base: PortfolioDataset, kind: CatalogKind, id: string): string[] {
  // Added units may move to another property only while they have no relations
  // (checked in editRoom); their availability status stays derived.
  if (!isBaseRecord(base, kind, id)) return kind === "room" ? ["id", "status"] : ["id"];
  if (kind === "property") return ["id", "code", "ownerId"];
  if (kind === "room") return ["id", "code", "propertyId", "status"];
  return ["id"];
}

/** Roles a contact must keep because existing relations depend on them. */
export function requiredRoles(view: CatalogDataset, contactId: string): ContactRole[] {
  const req = new Set<ContactRole>();
  for (const ct of view.contracts) {
    if (ct.tenantIds.includes(contactId)) req.add("inquilino");
    if (ct.landlordId === contactId) req.add("arrendador");
    if (ct.guarantorIds.includes(contactId)) req.add("avalista");
  }
  if (view.properties.some((p) => p.ownerId === contactId)) req.add("propietario");
  if (view.expenses.some((e) => e.providerId === contactId) || view.incidents.some((i) => i.providerId === contactId)) req.add("proveedor");
  if (view.applications.some((a) => a.contactId === contactId)) req.add("candidato");
  return CATALOG_ROLES.filter((r) => req.has(r));
}

export const roleLabels: Record<ContactRole, string> = {
  inquilino: "Inquilino", propietario: "Propietario", arrendador: "Arrendador",
  proveedor: "Proveedor", avalista: "Avalista", candidato: "Candidato",
};

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function codeTaken(list: { id: string; code: string }[], code: string, selfId?: string) {
  const n = normalizeCode(code);
  return list.some((x) => x.id !== selfId && normalizeCode(x.code) === n);
}
function similarName<T extends { id: string; name: string; code: string }>(list: T[], name: string, selfId?: string) {
  const n = normalizeName(name);
  return n ? list.filter((x) => x.id !== selfId && normalizeName(x.name) === n) : [];
}

export function validateContact(view: CatalogDataset, c: CatalogContact, isBase: boolean, original?: CatalogContact) {
  const errors: FieldErrors = {};
  const warnings: string[] = [];
  const name = text(c.name);
  if (!name) errors.name = "Indica un nombre.";
  else if (name.length > 120) errors.name = "El nombre no puede superar 120 caracteres.";
  const code = text(c.code);
  if (!code) errors.code = "Indica un código.";
  else if (!normalizeCode(code)) errors.code = "El código debe contener letras o números.";
  else if (codeTaken(view.contacts, code, c.id)) errors.code = `El código ${code} ya existe en los contactos.`;
  if (c.type !== "persona" && c.type !== "empresa") errors.type = "Elige persona o empresa.";
  const roles = c.roles ?? [];
  if (roles.length === 0) errors.roles = "Elige al menos un rol.";
  else if (roles.some((r) => !CATALOG_ROLES.includes(r))) errors.roles = "Rol no válido.";
  else if (new Set(roles).size !== roles.length) errors.roles = "Hay roles repetidos.";
  else if (original) {
    // Only roles the contact already has AND that existing relations depend on
    // are protected; a descriptive edit never forces a retrospective role.
    const current = original.roles ?? [];
    const missing = requiredRoles(view, c.id).filter((r) => current.includes(r) && !roles.includes(r));
    if (missing.length) errors.roles = `No se puede quitar ${missing.map((r) => roleLabels[r]).join(", ")}: tiene relaciones existentes.`;
  }
  if (c.email !== undefined && text(c.email)) {
    if (!/^[^\s@]+@example\.invalid$/i.test(text(c.email))) errors.email = "Usa un correo ficticio terminado en @example.invalid.";
  }
  if (c.phone !== undefined && text(c.phone) && !/^[+0-9 ()-]{6,20}$/.test(text(c.phone))) errors.phone = "Teléfono ficticio no válido.";
  if (c.address !== undefined && text(c.address).length > 160) errors.address = "La dirección no puede superar 160 caracteres.";
  if (c.note !== undefined && text(c.note).length > 500) errors.note = "La nota no puede superar 500 caracteres.";
  if (!isBase && original && original.id !== c.id) errors.id = "El identificador no se puede cambiar.";
  const dup = similarName(view.contacts, name, c.id);
  if (dup.length) warnings.push(`Ya existe un contacto con un nombre parecido: ${dup.map((d) => d.code).join(", ")}. No se fusionan automáticamente.`);
  const mail = text(c.email).toLowerCase();
  if (mail) {
    const same = view.contacts.filter((x) => x.id !== c.id && text(x.email).toLowerCase() === mail);
    if (same.length) warnings.push(`El correo ${text(c.email)} ya figura en: ${same.map((d) => d.code).join(", ")}. No se fusionan automáticamente.`);
  }
  return { errors, warnings };
}

export function validateProperty(view: CatalogDataset, p: CatalogProperty) {
  const errors: FieldErrors = {};
  const warnings: string[] = [];
  const name = text(p.name);
  if (!name) errors.name = "Indica un nombre.";
  else if (name.length > 120) errors.name = "El nombre no puede superar 120 caracteres.";
  const code = text(p.code);
  if (!code) errors.code = "Indica un código.";
  else if (!normalizeCode(code)) errors.code = "El código debe contener letras o números.";
  else if (codeTaken(view.properties, code, p.id)) errors.code = `El código ${code} ya existe en los inmuebles.`;
  if (!text(p.address)) errors.address = "Indica una dirección ficticia.";
  const owner = view.contacts.find((c) => c.id === p.ownerId);
  if (!owner) errors.ownerId = "Elige un propietario existente.";
  else if (!owner.roles.includes("propietario")) errors.ownerId = "El contacto elegido no tiene el rol propietario.";
  if (p.kind !== undefined && !PROPERTY_KINDS.includes(p.kind)) errors.kind = "Tipo de inmueble no válido.";
  const dup = similarName(view.properties, name, p.id);
  if (dup.length) warnings.push(`Ya existe un inmueble con un nombre parecido: ${dup.map((d) => d.code).join(", ")}.`);
  return { errors, warnings };
}

export function validateRoom(view: CatalogDataset, r: CatalogRoom) {
  const errors: FieldErrors = {};
  const code = text(r.code);
  if (!code) errors.code = "Indica un código.";
  else if (!normalizeCode(code)) errors.code = "El código debe contener letras o números.";
  else if (codeTaken(view.rooms, code, r.id)) errors.code = `El código ${code} ya existe en las unidades.`;
  if (!view.properties.some((p) => p.id === r.propertyId)) errors.propertyId = "Elige un inmueble existente.";
  if (typeof r.monthlyRent !== "number" || !Number.isFinite(r.monthlyRent) || r.monthlyRent <= 0 || r.monthlyRent > 100000) errors.monthlyRent = "La renta orientativa debe ser un importe mayor que 0.";
  else if (Math.round(r.monthlyRent * 100) / 100 !== r.monthlyRent) errors.monthlyRent = "Usa como máximo dos decimales.";
  if (r.areaM2 !== 0 && (!Number.isFinite(r.areaM2) || r.areaM2 < 0 || r.areaM2 > 10000)) errors.areaM2 = "Superficie no válida.";
  if (r.capacity !== undefined && (!Number.isInteger(r.capacity) || r.capacity < 1 || r.capacity > 50)) errors.capacity = "La capacidad debe ser un número entero de personas.";
  if (r.unitKind !== undefined && !UNIT_KINDS.includes(r.unitKind)) errors.unitKind = "Tipo de unidad no válido.";
  if (!Array.isArray(r.features) || r.features.some((f) => typeof f !== "string")) errors.features = "Características no válidas.";
  return { errors, warnings: [] as string[] };
}

const has = (e: FieldErrors) => Object.keys(e).length > 0;

function protectionErrors(base: PortfolioDataset, kind: CatalogKind, id: string, current: object, p: object): FieldErrors {
  const errors: FieldErrors = {};
  const locked = protectedFields(base, kind, id);
  for (const [k, v] of Object.entries(p)) {
    if (locked.includes(k) && (current as Record<string, unknown>)[k] !== v) errors[k as FieldName] = "Campo protegido: vinculado a contratos, dinero, ocupación o titularidad.";
  }
  return errors;
}

// ---------- Additions (stable IDs from a monotonic counter) ----------

export type NewContact = Omit<CatalogContact, "id">;
export type NewProperty = Omit<CatalogProperty, "id">;
export type NewRoom = Omit<CatalogRoom, "id" | "status" | "areaM2"> & { areaM2?: number };

export function addContact(base: PortfolioDataset, overlay: CatalogOverlay, input: NewContact): CatalogResult {
  const seq = overlay.seq + 1;
  const rec: CatalogContact = { ...input, id: `cat-con-${seq}`, name: text(input.name), code: text(input.code) };
  const view = mergeCatalog(base, overlay);
  const { errors, warnings } = validateContact(view, rec, false);
  if (has(errors)) return { ok: false, errors, warnings };
  return { ok: true, id: rec.id, warnings, overlay: { ...overlay, seq, added: { ...overlay.added, contacts: [...overlay.added.contacts, rec] } } };
}

export function addProperty(base: PortfolioDataset, overlay: CatalogOverlay, input: NewProperty): CatalogResult {
  const seq = overlay.seq + 1;
  const rec: CatalogProperty = { ...input, id: `cat-inm-${seq}`, name: text(input.name), code: text(input.code) };
  const view = mergeCatalog(base, overlay);
  const { errors, warnings } = validateProperty(view, rec);
  if (has(errors)) return { ok: false, errors, warnings };
  return { ok: true, id: rec.id, warnings, overlay: { ...overlay, seq, added: { ...overlay.added, properties: [...overlay.added.properties, rec] } } };
}

/** New units are always "disponible": occupancy stays derived, no contract or charge is created. */
export function addRoom(base: PortfolioDataset, overlay: CatalogOverlay, input: NewRoom): CatalogResult {
  const seq = overlay.seq + 1;
  const rec: CatalogRoom = { ...input, id: `cat-uni-${seq}`, code: text(input.code), status: "disponible", areaM2: input.areaM2 ?? 0 };
  const view = mergeCatalog(base, overlay);
  const { errors, warnings } = validateRoom(view, rec);
  if (has(errors)) return { ok: false, errors, warnings };
  return { ok: true, id: rec.id, warnings, overlay: { ...overlay, seq, added: { ...overlay.added, rooms: [...overlay.added.rooms, rec] } } };
}

// ---------- Descriptive edits (base and added records) ----------

export function editContact(base: PortfolioDataset, overlay: CatalogOverlay, id: string, p: ContactPatch): CatalogResult {
  const view = mergeCatalog(base, overlay);
  const current = view.contacts.find((c) => c.id === id);
  if (!current) return { ok: false, errors: { id: "Contacto no encontrado." }, warnings: [] };
  const prot = protectionErrors(base, "contact", id, current, p);
  if (has(prot)) return { ok: false, errors: prot, warnings: [] };
  const next = { ...current, ...p, id };
  const { errors, warnings } = validateContact(view, next, isBaseRecord(base, "contact", id), current);
  if (has(errors)) return { ok: false, errors, warnings };
  return { ok: true, id, warnings, overlay: { ...overlay, edits: { ...overlay.edits, contacts: { ...overlay.edits.contacts, [id]: { ...overlay.edits.contacts[id], ...p } } } } };
}

export function editProperty(base: PortfolioDataset, overlay: CatalogOverlay, id: string, p: PropertyPatch): CatalogResult {
  const view = mergeCatalog(base, overlay);
  const current = view.properties.find((x) => x.id === id);
  if (!current) return { ok: false, errors: { id: "Inmueble no encontrado." }, warnings: [] };
  const prot = protectionErrors(base, "property", id, current, p);
  if (has(prot)) return { ok: false, errors: prot, warnings: [] };
  const { errors, warnings } = validateProperty(view, { ...applyPropertyPatch(current, p), id });
  if (has(errors)) return { ok: false, errors, warnings };
  return { ok: true, id, warnings, overlay: { ...overlay, edits: { ...overlay.edits, properties: { ...overlay.edits.properties, [id]: { ...overlay.edits.properties[id], ...p } } } } };
}

export function editRoom(base: PortfolioDataset, overlay: CatalogOverlay, id: string, p: RoomPatch): CatalogResult {
  const view = mergeCatalog(base, overlay);
  const current = view.rooms.find((x) => x.id === id);
  if (!current) return { ok: false, errors: { id: "Unidad no encontrada." }, warnings: [] };
  const prot = protectionErrors(base, "room", id, current, p);
  if (p.propertyId !== undefined && p.propertyId !== current.propertyId && roomHasRelations(view, id)) {
    prot.propertyId = "Campo protegido: la unidad tiene relaciones (contratos, reservas, solicitudes, incidencias o gastos).";
  }
  if (has(prot)) return { ok: false, errors: prot, warnings: [] };
  const { errors, warnings } = validateRoom(view, { ...applyRoomPatch(current, p), id });
  if (has(errors)) return { ok: false, errors, warnings };
  return { ok: true, id, warnings, overlay: { ...overlay, edits: { ...overlay.edits, rooms: { ...overlay.edits.rooms, [id]: { ...overlay.edits.rooms[id], ...p } } } } };
}

// ---------- Labels for descriptive readers ----------

export function catalogLabels(view: CatalogDataset): CatalogLabels {
  const c = new Map(view.contacts.map((x) => [x.id, x]));
  const p = new Map(view.properties.map((x) => [x.id, x]));
  const r = new Map(view.rooms.map((x) => [x.id, x]));
  return {
    contactName: (id) => c.get(id)?.name ?? id,
    contactCode: (id) => c.get(id)?.code ?? id,
    propertyName: (id) => p.get(id)?.name ?? id,
    propertyCode: (id) => p.get(id)?.code ?? id,
    roomCode: (id) => r.get(id)?.code ?? id,
  };
}

/** True when the record has no financial history in the base ledgers. */
export function hasMoneyActivity(view: CatalogDataset, kind: "property" | "room", id: string) {
  const key = kind === "property" ? "propertyId" : "roomId";
  return view.contracts.some((ct) => ct[key] === id) || view.expenses.some((e) => (e as unknown as Record<string, unknown>)[key] === id);
}

/** True when any base relation (contract, reservation, application, incident, task, expense) points at the unit. */
export function roomHasRelations(view: CatalogDataset, id: string) {
  const refs = (list: readonly unknown[]) => list.some((x) => (x as Record<string, unknown>)["roomId"] === id);
  return hasMoneyActivity(view, "room", id) || refs(view.reservations) || refs(view.applications) || refs(view.incidents) || refs(view.tasks) || refs(view.expenseShares);
}
