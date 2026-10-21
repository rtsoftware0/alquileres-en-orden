// Domain types for the portfolio. Shapes are kept flat and id-based so a future
// data source can replace the local demo module without touching the UI.

export type RoomStatus = "ocupada" | "disponible" | "reservada" | "bloqueada";

export interface Property {
  id: string; // URL slug, e.g. "casa-olivo"
  code: string; // short code, e.g. "OLI"
  name: string;
  address: string; // always fictitious in demo data
}

export interface Contract {
  reference: string;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string; // ISO yyyy-mm-dd
}

export interface Room {
  id: string; // URL slug, e.g. "oli-01"
  code: string; // e.g. "OLI-01"
  propertyId: string;
  status: RoomStatus;
  monthlyRent: number; // EUR, orientative
  areaM2: number;
  features: string[];
  contract?: Contract; // only when status === "ocupada"
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
  title: string;
  description: string;
  openedOn: string; // ISO
}

export interface PortfolioDataset {
  companyName: string;
  referenceDate: string; // ISO
  referencePeriod: string; // human label
  properties: Property[];
  rooms: Room[];
  pendingBalances: PendingBalance[];
  incidents: Incident[];
}
