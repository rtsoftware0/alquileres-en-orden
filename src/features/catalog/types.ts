// Temporary catalog overlay types. Compatible extensions of the base domain
// types: every Catalog* record is assignable to its base type, so existing
// selectors keep working on the merged view. Memory-only; never persisted.
import type { Contact, PortfolioDataset, Property, Room } from "@/features/portfolio/data/types";

export interface CatalogContact extends Contact {
  phone?: string; // fictitious
  address?: string; // fictitious
}

export type PropertyKind = "vivienda" | "edificio" | "local";

export interface CatalogProperty extends Property {
  kind?: PropertyKind;
  portfolioLabel?: string; // cartera (descriptive)
  companyLabel?: string; // sociedad (descriptive)
  managerName?: string; // responsable interno (descriptive)
}

export type UnitKind = "habitacion" | "vivienda_completa" | "estudio";

export interface CatalogRoom extends Room {
  unitKind?: UnitKind;
  capacity?: number; // integer persons
}

export type CatalogKind = "contact" | "property" | "room";

/** Descriptive fields that may be patched (protection decides per record). */
export type ContactPatch = Partial<Pick<CatalogContact, "name" | "code" | "type" | "roles" | "email" | "phone" | "address" | "note">>;
/** Optional descriptive fields are tri-state in patches: absent = keep, value = set, null = clear. */
export type PropertyPatch = Partial<Pick<CatalogProperty, "name" | "code" | "address" | "ownerId" | "portfolioLabel" | "companyLabel" | "managerName">> & { kind?: PropertyKind | null };
/** propertyId is only accepted for added units without relations; base units keep it protected. */
export type RoomPatch = Partial<Pick<CatalogRoom, "code" | "propertyId" | "monthlyRent" | "areaM2" | "features" | "statusNote">> & { unitKind?: UnitKind | null; capacity?: number | null };

export interface CatalogOverlay {
  added: { contacts: CatalogContact[]; properties: CatalogProperty[]; rooms: CatalogRoom[] };
  edits: { contacts: Record<string, ContactPatch>; properties: Record<string, PropertyPatch>; rooms: Record<string, RoomPatch> };
  /** Monotonic counter for stable IDs that never derive from editable names/codes. */
  seq: number;
  /** CSV import receipts; absent in overlays created before imports existed. Reset clears them. */
  imports?: CatalogImports;
}

/** One receipt per imported logical record (canonical fingerprint, not file position). */
export interface ImportReceipt {
  entity: CatalogKind;
  id: string;
  externalRef?: string;
  batch: number;
}

export interface CatalogImports {
  /** Keyed by "fp:" + canonical fingerprint (prefixed so special keys like __proto__ are inert). */
  receipts: Record<string, ImportReceipt>;
  /** Keyed by "ref:" + entity + ":" + external reference → fingerprint key. */
  externalRefs: Record<string, string>;
  batches: number;
}

/** Merged view: only contacts/properties/rooms differ from the base dataset. */
export type CatalogDataset = Omit<PortfolioDataset, "contacts" | "properties" | "rooms"> & {
  contacts: CatalogContact[];
  properties: CatalogProperty[];
  rooms: CatalogRoom[];
};

export type FieldName = "id" | "name" | "code" | "type" | "roles" | "email" | "phone" | "address" | "note" | "ownerId" | "kind" | "propertyId" | "monthlyRent" | "areaM2" | "capacity" | "unitKind" | "features" | "status";
export type FieldErrors = Partial<Record<FieldName, string>>;

export type CatalogResult =
  | { ok: true; overlay: CatalogOverlay; id: string; warnings: string[] }
  | { ok: false; errors: FieldErrors; warnings: string[] };

export interface CatalogLabels {
  contactName: (id: string) => string;
  contactCode: (id: string) => string;
  propertyName: (id: string) => string;
  propertyCode: (id: string) => string;
  roomCode: (id: string) => string;
}
