import type { Contact } from "@/features/portfolio/data/types";

// Fictitious contacts. Names are invented; emails use the reserved
// example.invalid domain and are never used to send anything.
const mail = (local: string) => `${local}@example.invalid`;

export const demoContacts: Contact[] = [
  { id: "con-001", code: "CON-001", name: "Lucía Prueba Ortega", type: "persona", roles: ["inquilino"], email: mail("lucia.prueba") },
  { id: "con-002", code: "CON-002", name: "Marcos Ficticio Sanz", type: "persona", roles: ["inquilino"], email: mail("marcos.ficticio") },
  {
    id: "con-003", code: "CON-003", name: "Elena Muestra Ruiz", type: "persona", roles: ["inquilino", "avalista"], email: mail("elena.muestra"),
    note: "Inquilina en Casa Olivo y avalista de otro contrato de ejemplo.",
  },
  { id: "con-004", code: "CON-004", name: "Pablo Ejemplo Vidal", type: "persona", roles: ["inquilino"], email: mail("pablo.ejemplo") },
  { id: "con-005", code: "CON-005", name: "Sara Demo Castillo", type: "persona", roles: ["inquilino"], email: mail("sara.demo") },
  { id: "con-006", code: "CON-006", name: "Iván Simulado Prieto", type: "persona", roles: ["inquilino"], email: mail("ivan.simulado") },
  { id: "con-007", code: "CON-007", name: "Nuria Ensayo Gil", type: "persona", roles: ["inquilino"], email: mail("nuria.ensayo") },
  { id: "con-008", code: "CON-008", name: "Tomás Modelo Rey", type: "persona", roles: ["inquilino"], email: mail("tomas.modelo") },
  {
    id: "con-009", code: "CON-009", name: "Inversiones Olivo Ejemplo S.L.", type: "empresa", roles: ["propietario", "arrendador"], email: mail("olivo.empresa"),
    note: "Propietaria de Casa Olivo y parte arrendadora de sus contratos.",
  },
  {
    id: "con-010", code: "CON-010", name: "Rosa Propietaria Ejemplo", type: "persona", roles: ["propietario"], email: mail("rosa.propietaria"),
    note: "Propietaria de Casa Azahar. No firma los contratos de habitación (subarriendo).",
  },
  {
    id: "con-011", code: "CON-011", name: "Gestión Azahar Demo S.L.", type: "empresa", roles: ["arrendador"], email: mail("gestion.azahar"),
    note: "Arrienda Casa Azahar a su propietaria y la subarrienda por habitaciones.",
  },
  { id: "con-012", code: "CON-012", name: "Reparaciones Ejemplo S.L.", type: "empresa", roles: ["proveedor"], email: mail("reparaciones") },
  {
    id: "con-013", code: "CON-013", name: "Javier Candidato Ejemplo", type: "persona", roles: ["candidato"], email: mail("javier.candidato"),
    note: "Candidato con reserva de ejemplo en OLI-06.",
  },
  { id: "con-014", code: "CON-014", name: "Ana Borrador Ejemplo", type: "persona", roles: ["candidato"], email: mail("ana.borrador") },
];
