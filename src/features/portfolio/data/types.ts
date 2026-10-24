// Domain types for the demo. Shapes are flat and id-based so a future data
// source can replace the local demo modules without touching the UI.
// Money is stored in integer cents; dates as ISO yyyy-mm-dd calendar strings.
import type { Application, Reservation } from '@/features/planning/types';

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

export type IncidentStatus = "nueva" | "en_revision" | "asignada" | "pendiente_aprobacion" | "en_curso" | "resuelta" | "cerrada";
export type IncidentPriority = "baja" | "media" | "alta";

/** Example budget: proposed/approved/rejected is never a cost, expense or payment. */
export interface IncidentBudget {
  amountCents: number;
  status: "propuesto" | "aprobado" | "rechazado";
  version: number;
  note?: string;
}

export interface IncidentResolution {
  text: string;
  date: string; // ISO
  costCents?: number; // final cost, separate from the budget
}

export interface IncidentNote {
  date: string; // ISO
  text: string;
}

export interface Incident {
  id: string;
  propertyId: string;
  roomId?: string;
  providerId?: string; // contact id with role "proveedor"; never an access account
  title: string;
  description: string;
  openedOn: string; // ISO
  category: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  assigneeName: string; // internal responsible; the demo has a single fictitious admin
  targetDate: string; // ISO goal; overdue derives from it vs the reference date
  history: IncidentNote[];
  internalNotes: IncidentNote[]; // read-only, never sent anywhere
  budget?: IncidentBudget;
  resolution?: IncidentResolution;
  linkedExpenseId?: string; // pre-existing fictitious expense, never created by simulation
}

export type TaskStatus = "pendiente" | "completada";

export interface Task {
  id: string;
  title: string;
  dueDate: string; // ISO
  status: TaskStatus;
  assigneeName: string;
  origin: string; // e.g. "Incidencia INC-…" or "Tarea independiente"
  incidentId?: string;
  result?: string; // completion note (fictitious)
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
  incidents: Incident[];
  tasks: Task[];
  contacts: Contact[];
  contracts: Contract[];
  charges: Charge[];
  payments: Payment[];
  allocations: Allocation[];
  depositMovements: DepositMovement[];
  expenses: Expense[];
  expenseShares: ExpenseShare[];
  expensePayments: ExpensePayment[];
  documents: DemoDocument[];
  threads: MessageThread[];
  notices: DemoNotice[];
  applications: Application[];
  reservations: Reservation[];
}

// --- Money (demo). Balances are never stored: they derive from charges,
// payments and allocations. Deposits are a separate ledger, never rent.

/** A rent charge owed by one payer (tenant) under one contract. */
export interface Charge {
  id: string; // e.g. "vc-0102-10"
  reference: string; // e.g. "VC-0102-10"
  contractId: string;
  payerId: string; // contact id of the tenant who owes it
  concept: string;
  period: string; // accrual month, yyyy-mm
  dueDate: string; // ISO
  amountCents: number; // original amount
  voidReason?: string; // set => charge is "anulado"
}

/** Fictitious money received from a payer. Not an invoice. */
export interface Payment {
  id: string;
  reference: string;
  payerId: string;
  contractId?: string; // contract the payer indicated, used for property scope
  receivedOn: string; // ISO, cash date
  amountCents: number;
  note: string;
}

/** Part of a payment applied to a charge. Not a second cash inflow. */
export interface Allocation {
  id: string;
  paymentId: string;
  chargeId: string;
  amountCents: number;
}

export interface DepositMovement {
  id: string;
  contractId: string;
  partyId: string; // contact who contributes / receives back
  kind: "recepcion" | "devolucion";
  date: string; // ISO
  amountCents: number;
  note: string;
}

// --- Expenses (demo). Separate synthetic ledger: never netted against
// tenant debt, never rent, never a deposit. Payments are separate records
// with their own date; balances always derive.

/** Who bears the cost. "inquilino" shares are only simulated assignments. */
export type ExpenseBearer = "operador" | "propietario" | "inquilino";

export interface Expense {
  id: string; // e.g. "gs-ej-001"
  reference: string; // e.g. "GS-EJ-001"
  concept: string;
  providerId: string; // contact with role "proveedor"
  propertyId: string;
  category: string;
  period: string; // expense month, yyyy-mm
  date: string; // ISO, expense date
  dueDate: string; // ISO, payment due date
  amountCents: number;
  bearer: ExpenseBearer;
  note?: string;
}

/** Simulated cost assignment to rooms. Never creates tenant charges. */
export interface ExpenseShare {
  id: string;
  expenseId: string;
  roomId: string;
  amountCents: number;
}

/** Fictitious money paid to a provider. Separate record, own date. */
export interface ExpensePayment {
  id: string;
  reference: string; // e.g. "PG-EJ-001"
  expenseId: string;
  date: string; // ISO, cash out date
  amountCents: number;
  note: string;
}

// --- Documents, messages and notices (demo). Embedded fictitious content
// only: no uploads, no downloads, no sending, no real access grants.

export type DocVisibility = "interna" | "compartida";

/** One version of a document. History is never overwritten. */
export interface DocVersion {
  version: number;
  date: string; // ISO
  author: string; // fictitious
  note: string;
  content: string; // short synthetic text, never a legal document
}

export type DocLinkKind = "contrato" | "incidencia" | "gasto" | "inmueble";

export interface DemoDocument {
  id: string; // e.g. "doc-1"
  title: string;
  category: string;
  author: string; // fictitious
  createdOn: string; // ISO
  link: { kind: DocLinkKind; id: string };
  propertyId: string; // derived from the linked record
  visibility: DocVisibility; // example visibility; grants no access
  recipientIds: string[]; // example recipients, only when "compartida"
  versions: DocVersion[]; // current = last
}

export interface ThreadMessage {
  id: string;
  date: string; // ISO
  author: string; // fictitious
  visibility: DocVisibility; // internal notes never appear in the shared view
  text: string;
}

export interface MessageThread {
  id: string; // e.g. "thr-inc-2"
  title: string;
  context: { kind: "contrato" | "incidencia"; id: string };
  messages: ThreadMessage[]; // fictitious history; drafts never enter it
}

export type NoticeType = "vencimiento" | "deuda" | "incidencia" | "tarea" | "fianza";

export type NoticeLink =
  | { kind: "cargo"; id: string }
  | { kind: "incidencia"; id: string }
  | { kind: "tareas" }
  | { kind: "fianza"; id: string };

export interface DemoNotice {
  id: string; // e.g. "av-1"
  type: NoticeType;
  text: string;
  date: string; // ISO
  read: boolean; // base state; simulated reads never change it
  link: NoticeLink;
}
