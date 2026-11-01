// Fictitious in-memory sharing metadata for approved settlement versions in
// the owner portal preview. References only IDs and version numbers: amounts
// are never copied. Grants no real access and is never persisted.

export type ShareEndReason = "reemplazada" | "retirada" | "revocada";

export interface SettlementShare {
  id: string;
  companyId: string;
  contactId: string;
  settlementId: string;
  version: number;
  active: boolean;
  /** Monotonic sequence of the simulated sharing (not a real date). */
  seq: number;
  endedReason?: ShareEndReason;
  endedSeq?: number;
}

export interface SharingEvent {
  seq: number;
  action: "compartir" | "reemplazar" | "retirar" | "revocar_acceso" | "restaurar_acceso";
  companyId: string;
  contactId: string;
  settlementId?: string;
  version?: number;
  grantId?: string;
}

export interface SharingState {
  shares: SettlementShare[];
  revokedGrants: string[];
  log: SharingEvent[];
  nextSeq: number;
}

export const initialSharing = (): SharingState => ({ shares: [], revokedGrants: [], log: [], nextSeq: 1 });
