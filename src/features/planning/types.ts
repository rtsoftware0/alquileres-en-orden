import type { DraftValues } from '@/features/contracts/draft';
export type ApplicationStatus = 'nueva' | 'en_revision' | 'pendiente_informacion' | 'aceptada' | 'rechazada' | 'retirada';
export interface Application { id: string; contactId: string; status: ApplicationStatus; origin: string; date: string; propertyId: string; roomId: string; startDate: string; endDate: string; responsible: string; nextAction: string; notes: string; contractId?: string }
export interface Reservation { id: string; applicationId: string; propertyId: string; roomId?: string; startDate: string; endDate: string; expiresOn: string; contractId?: string; status: 'confirmada' | 'cancelada' | 'caducada'; reason?: string }
export interface Interval { id: string; propertyId: string; roomId?: string; startDate: string; endDate?: string; kind: 'contrato' | 'reserva' | 'mantenimiento'; label: string; contractId?: string; reservationId?: string; incidentId?: string }
export interface Segment { roomId: string; propertyId: string; startDate: string; endDate: string; rentCents: number; dueDay: number }
export type ChangeKind = 'renta' | 'habitacion' | 'prorroga' | 'salida';
export interface ChangeValues { kind: ChangeKind; effectiveDate: string; endDate: string; roomId: string; rent: string; dueDay: string; reason: string; futureDecision: string }
export interface ChangePreview { contractId: string; kind: ChangeKind; segments: Segment[]; effectiveDate: string; reason: string; futureDecision: string }
export interface TemporalDraft { applicationId: string; values: DraftValues; step: number }
export interface PlanningState { applications: Application[]; reservations: Reservation[]; drafts: Record<string, TemporalDraft>; changes: Record<string, ChangePreview> }
