// Domain types for the demo. Shapes are flat and id-based so a future data
// source can replace the local demo modules without touching the UI.
// Money is stored in integer cents; dates as ISO yyyy-mm-dd calendar strings.

export type RoomStatus = "ocupada" | "disponible" | "reservada" | "bloqueada";

export interface Property {
  id: string; // URL slug, e.g. "casa-olivo"
  code: string; // short code, e.g. "OLI"
  name: string;
  address: string; // always fictitious in demo data
  ownerId: string; // contact id
}

export interface Room {
  id: string; // URL slug, e.g. "oli-01"
  code: string; // e.g. "OLI-01"
  propertyId: string;
  status: RoomStatus;
  monthlyRent: number; // EUR, orientative
  areaM2: number;
  features: string[];
  statusNote?: string; // context for reservada / bloqueada / disponible
}

export interface PendingBalance {
  id: string;
  roomId: string;
  amount: number; // EUR
  concept: string;
}

export interface Incident {
  id: string;
  propertyId: string;
  roomId?: string;
  providerId?: string; // contact id
  title: string;
  description: string;
  openedOn: string; // ISO
}

export type ContactType = "persona" | "empresa";
export type ContactRole = "inquilino" | "propietario" | "arrendador" | "proveedor" | "avalista" | "candidato";

export interface Contact {
  id: string; // URL slug, e.g. "con-002"
  code: string; // e.g. "CON-002"
  name: string;
  type: ContactType;
  roles: ContactRole[];
  email?: string; // always @example.invalid
  note?: string;
}

export type ContractStatus = "borrador" | "pendiente" | "activo" | "finalizado" | "cancelado";

export interface ContractEvent {
  date: string; // ISO
  text: string;
}

export interface Contract {
  id: string; // URL slug, e.g. "ct-ej-0102"
  reference: string; // e.g. "CT-EJ-0102"
  status: ContractStatus;
  propertyId: string;
  roomId: string;
  landlordId: string; // explicit lessor party (may differ from owner)
  tenantIds: string[];
  guarantorIds: string[];
  startDate: string; // check-in, included
  endDate: string; // check-out, excluded (last occupied day = endDate - 1)
  rentCents: number;
  depositCents: number; // kept separate from rent
  dueDay: number; // 1..28
  modality: string;
  signature: string; // textual status only; no files
  history: ContractEvent[];
}

export interface PortfolioDataset {
  companyName: string;
  referenceDate: string; // ISO
  referencePeriod: string; // human label
  properties: Property[];
  rooms: Room[];
  pendingBalances: PendingBalance[];
  incidents: Incident[];
  contacts: Contact[];
  contracts: Contract[];
}
