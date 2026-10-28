// Fictitious portal authorization metadata. Isolated from the source
// datasets of blocks 01–08: it only references existing IDs and never
// changes figures, states or visibility. It grants no real access.

export type PortalProfile = "propietario" | "inquilino" | "proveedor";

export interface PortalCompany {
  id: string;
  name: string;
  didactic: boolean;
}

/** One authorized relation between a contact, a profile and a record. */
export interface PortalGrant {
  id: string;
  companyId: string;
  contactId: string;
  profile: PortalProfile;
  relation: { kind: "inmueble" | "contrato" | "incidencia"; id: string };
  /** Extra incidents explicitly authorized for this grant (owner/tenant). */
  incidentIds: string[];
}

export const PORTAL_COMPANIES: PortalCompany[] = [
  { id: "cartera", name: "Cartera de ejemplo", didactic: false },
  // Didactic empty context: no relations, no financial data.
  { id: "empresa-vacia", name: "Empresa didáctica sin relaciones", didactic: true },
];

const g = (id: string, contactId: string, profile: PortalProfile, kind: PortalGrant["relation"]["kind"], relId: string, incidentIds: string[] = []): PortalGrant => ({
  id, companyId: "cartera", contactId, profile, relation: { kind, id: relId }, incidentIds,
});

export const demoPortalGrants: PortalGrant[] = [
  // Owners: by Property.ownerId. con-011 is lessor only, never owner.
  g("pg-own-009", "con-009", "propietario", "inmueble", "casa-olivo", ["inc-3"]),
  g("pg-own-010", "con-010", "propietario", "inmueble", "casa-azahar", ["inc-1"]),
  // Tenants: own contracts only (never guarantor-only contracts).
  g("pg-ten-001", "con-001", "inquilino", "contrato", "ct-ej-0101", ["inc-2"]),
  g("pg-ten-002", "con-002", "inquilino", "contrato", "ct-ej-0102"),
  g("pg-ten-003", "con-003", "inquilino", "contrato", "ct-ej-0103"),
  g("pg-ten-004", "con-004", "inquilino", "contrato", "ct-ej-0104"),
  g("pg-ten-005", "con-005", "inquilino", "contrato", "ct-ej-0201"),
  g("pg-ten-006", "con-006", "inquilino", "contrato", "ct-ej-0202"),
  g("pg-ten-007", "con-007", "inquilino", "contrato", "ct-ej-0203"),
  g("pg-ten-008a", "con-008", "inquilino", "contrato", "ct-ej-0204"),
  g("pg-ten-008b", "con-008", "inquilino", "contrato", "ct-ej-0098"),
  // Providers: by Incident.providerId. con-015 has the profile but no assignments.
  g("pg-pro-012a", "con-012", "proveedor", "incidencia", "inc-1"),
  g("pg-pro-012b", "con-012", "proveedor", "incidencia", "inc-2"),
];

/** Contacts that may enter a profile even with zero assignments (honest empty state). */
export const PROFILE_WITHOUT_RELATIONS: { contactId: string; profile: PortalProfile }[] = [
  { contactId: "con-015", profile: "proveedor" },
];

export const profileLabel: Record<PortalProfile, string> = {
  propietario: "Propietario",
  inquilino: "Inquilino",
  proveedor: "Proveedor",
};
