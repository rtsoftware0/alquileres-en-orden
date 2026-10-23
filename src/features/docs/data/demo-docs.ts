import type { DemoDocument, DemoNotice, MessageThread } from "@/features/portfolio/data/types";
import { site } from "@/config/site";

// Embedded fictitious documents, threads and notices. No uploads, no
// downloads, no sending: the content is short synthetic text and the
// visibility flags are examples that grant no access.

const admin = site.demoUser;

export const DOC_CATEGORIES = ["Contrato", "Inventario", "Presupuesto", "Factura", "Informe"] as const;

export const demoDocuments: DemoDocument[] = [
  {
    id: "doc-1",
    title: "Presupuesto de la persiana de OLI-01 (ejemplo)",
    category: "Presupuesto",
    author: "Reparaciones Ejemplo S.L.",
    createdOn: "2026-10-20",
    link: { kind: "incidencia", id: "inc-2" },
    propertyId: "casa-olivo",
    visibility: "compartida",
    recipientIds: ["con-012"],
    versions: [
      {
        version: 1, date: "2026-10-20", author: "Reparaciones Ejemplo S.L.",
        note: "Propuesta inicial, pendiente de aprobación.",
        content:
          "Contenido de ejemplo. Sustitución del mecanismo de la persiana de la habitación OLI-01 por 120,00 €. " +
          "Este texto es ficticio: no es un presupuesto real ni un documento jurídico, y sigue pendiente de aprobación.",
      },
    ],
  },
  {
    id: "doc-2",
    title: "Contrato de ejemplo CT-EJ-0102",
    category: "Contrato",
    author: admin,
    createdOn: "2026-09-01",
    link: { kind: "contrato", id: "ct-ej-0102" },
    propertyId: "casa-olivo",
    visibility: "interna",
    recipientIds: [],
    versions: [
      {
        version: 1, date: "2026-09-01", author: admin,
        note: "Primera redacción de ejemplo.",
        content:
          "Contenido de ejemplo (versión 1). Borrador ficticio del contrato CT-EJ-0102 para la habitación OLI-02 de Casa Olivo. " +
          "No es un contrato firmado ni un documento jurídico válido.",
      },
      {
        version: 2, date: "2026-09-15", author: admin,
        note: "Aclaración de ejemplo sobre la modalidad de temporada.",
        content:
          "Contenido de ejemplo (versión 2). Se aclara la modalidad de temporada por estudios y la fecha de salida, que no se incluye en la estancia. " +
          "Texto ficticio sin validez jurídica; la versión 1 se conserva sin cambios.",
      },
    ],
  },
  {
    id: "doc-3",
    title: "Inventario de entrada de OLI-02 (ejemplo)",
    category: "Inventario",
    author: admin,
    createdOn: "2026-09-01",
    link: { kind: "contrato", id: "ct-ej-0102" },
    propertyId: "casa-olivo",
    visibility: "compartida",
    recipientIds: ["con-002"],
    versions: [
      {
        version: 1, date: "2026-09-01", author: admin,
        note: "Inventario ficticio del día de entrada.",
        content:
          "Contenido de ejemplo. Lista ficticia del mobiliario de la habitación OLI-02 el día de entrada: cama, escritorio, armario y lámpara. " +
          "No es un inventario real ni una prueba de estado.",
      },
    ],
  },
  {
    id: "doc-4",
    title: "Resumen del gasto GS-EJ-001 (ejemplo)",
    category: "Informe",
    author: "Reparaciones Ejemplo S.L.",
    createdOn: "2026-10-19",
    link: { kind: "gasto", id: "gs-ej-001" },
    propertyId: "casa-olivo",
    visibility: "interna",
    recipientIds: [],
    versions: [
      {
        version: 1, date: "2026-10-19", author: "Reparaciones Ejemplo S.L.",
        note: "Resumen ficticio del gasto de ejemplo ya existente.",
        content:
          "Contenido de ejemplo. Resumen ficticio del gasto preexistente GS-EJ-001 por 120,00 €, pendiente de pago. " +
          "No afirma que la reparación se haya ejecutado ni que el presupuesto esté aprobado; no es una factura ni un justificante descargable.",
      },
    ],
  },
  {
    id: "doc-5",
    title: "Informe de humedad de AZA-06 (ejemplo)",
    category: "Informe",
    author: "Reparaciones Ejemplo S.L.",
    createdOn: "2026-10-15",
    link: { kind: "incidencia", id: "inc-1" },
    propertyId: "casa-azahar",
    visibility: "interna",
    recipientIds: [],
    versions: [
      {
        version: 1, date: "2026-10-15", author: "Reparaciones Ejemplo S.L.",
        note: "Diagnóstico ficticio inicial.",
        content:
          "Contenido de ejemplo. Informe ficticio sobre la humedad de la pared de AZA-06: se recomienda reparar antes de ofrecer la habitación. " +
          "La habitación sigue bloqueada; este texto no cambia su estado.",
      },
    ],
  },
];

export const demoThreads: MessageThread[] = [
  {
    id: "thr-ct-0102",
    title: "Contrato CT-EJ-0102 · OLI-02",
    context: { kind: "contrato", id: "ct-ej-0102" },
    messages: [
      { id: "m-1", date: "2026-08-28", author: admin, visibility: "interna", text: "Nota interna de ejemplo: preparar el inventario antes de la entrada." },
      { id: "m-2", date: "2026-09-01", author: admin, visibility: "compartida", text: "Mensaje compartido de ejemplo: se entrega el inventario de entrada al inquilino." },
      { id: "m-3", date: "2026-10-05", author: "Contacto de ejemplo CON-002", visibility: "compartida", text: "Mensaje compartido de ejemplo: el inquilino confirma la recepción del inventario." },
    ],
  },
  {
    id: "thr-inc-2",
    title: "Incidencia · Persiana atascada (OLI-01)",
    context: { kind: "incidencia", id: "inc-2" },
    messages: [
      { id: "m-4", date: "2026-10-19", author: admin, visibility: "interna", text: "Nota interna de ejemplo: comparar el presupuesto con otra reparación similar antes de aprobar." },
      { id: "m-5", date: "2026-10-20", author: admin, visibility: "compartida", text: "Mensaje compartido de ejemplo: se recibe el presupuesto de 120,00 € del proveedor, pendiente de aprobación." },
    ],
  },
  {
    id: "thr-inc-1",
    title: "Incidencia · Humedad en pared (AZA-06)",
    context: { kind: "incidencia", id: "inc-1" },
    messages: [
      { id: "m-6", date: "2026-10-15", author: admin, visibility: "compartida", text: "Mensaje compartido de ejemplo: se acuerda la visita del proveedor para valorar la humedad." },
      // Same text as the incident's internal note: one coherent record, not a duplicate.
      { id: "m-7", date: "2026-10-18", author: admin, visibility: "interna", text: "Nota interna de ejemplo: revisar de nuevo la pared antes de desbloquear la habitación." },
    ],
  },
];

export const demoNotices: DemoNotice[] = [
  {
    id: "av-1", type: "deuda",
    text: "Cargo vencido: la renta de septiembre 2026 de OLI-03 aún tiene 150,00 € pendientes.",
    date: "2026-10-06", read: false,
    link: { kind: "cargo", id: "vc-0103-09" },
  },
  {
    id: "av-2", type: "vencimiento",
    text: "Vencimiento de ejemplo: la renta de octubre 2026 de OLI-02 (350,00 €) venció el 05/10/2026 y sigue pendiente.",
    date: "2026-10-05", read: false,
    link: { kind: "cargo", id: "vc-0102-10" },
  },
  {
    id: "av-3", type: "incidencia",
    text: "El presupuesto de 120,00 € de la persiana de OLI-01 está pendiente de aprobación.",
    date: "2026-10-20", read: false,
    link: { kind: "incidencia", id: "inc-2" },
  },
  {
    id: "av-4", type: "tarea",
    text: "Tarea vencida: llamar al proveedor de la humedad (vencía el 19/10/2026).",
    date: "2026-10-19", read: true,
    link: { kind: "tareas" },
  },
  {
    id: "av-5", type: "fianza",
    text: "Fianza de ejemplo pendiente de aportar en el contrato CT-EJ-0203 (AZA-03).",
    date: "2026-10-10", read: true,
    link: { kind: "fianza", id: "ct-ej-0203" },
  },
];
