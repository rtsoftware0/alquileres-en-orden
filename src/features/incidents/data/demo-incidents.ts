import type { Incident, Task } from "@/features/portfolio/data/types";
import { site } from "@/config/site";

// Fictitious incidents and tasks. The three incidents keep their original
// ids, titles, locations, dates and descriptions; only coherent metadata is
// added. Nothing here changes room status or any money figure.

const admin = site.demoUser;

export const INCIDENT_CATEGORIES = ["Humedades", "Reparación", "Caldera y climatización"] as const;

export const demoIncidents: Incident[] = [
  {
    id: "inc-1", propertyId: "casa-azahar", roomId: "aza-06", providerId: "con-012",
    title: "Humedad en pared",
    description: "Mantenimiento en curso. La habitación AZA-06 queda bloqueada hasta la reparación.",
    openedOn: "2026-10-14",
    category: "Humedades", priority: "alta", status: "en_curso",
    assigneeName: admin, targetDate: "2026-10-28",
    history: [
      { date: "2026-10-14", text: "Incidencia registrada (ejemplo)." },
      { date: "2026-10-15", text: "Proveedor asignado y visita acordada (ejemplo)." },
      { date: "2026-10-18", text: "Trabajos iniciados; la habitación sigue bloqueada (ejemplo)." },
    ],
    internalNotes: [
      { date: "2026-10-18", text: "Nota interna de ejemplo: revisar de nuevo la pared antes de desbloquear la habitación." },
    ],
  },
  {
    id: "inc-2", propertyId: "casa-olivo", roomId: "oli-01", providerId: "con-012",
    title: "Persiana atascada",
    description: "Pendiente de revisión por el servicio técnico.",
    openedOn: "2026-10-18",
    category: "Reparación", priority: "media", status: "pendiente_aprobacion",
    assigneeName: admin, targetDate: "2026-10-24",
    history: [
      { date: "2026-10-18", text: "Incidencia registrada (ejemplo)." },
      { date: "2026-10-19", text: "Proveedor asignado (ejemplo)." },
      { date: "2026-10-20", text: "Presupuesto de 120,00 € presentado, pendiente de aprobación (ejemplo)." },
    ],
    internalNotes: [],
    budget: { amountCents: 12000, status: "propuesto", version: 1, note: "Sustitución del mecanismo (ejemplo)." },
    // Pre-existing fictitious expense record (GS-EJ-001), not created by any simulation.
    linkedExpenseId: "gs-ej-001",
  },
  {
    id: "inc-3", propertyId: "casa-olivo",
    title: "Revisión de caldera",
    description: "Revisión anual programada para las zonas comunes.",
    openedOn: "2026-10-20",
    category: "Caldera y climatización", priority: "baja", status: "nueva",
    assigneeName: admin, targetDate: "2026-11-15",
    history: [
      { date: "2026-10-20", text: "Incidencia registrada (ejemplo)." },
    ],
    internalNotes: [],
  },
];

export const demoTasks: Task[] = [
  {
    id: "tar-1", title: "Llamar al proveedor de la humedad", dueDate: "2026-10-19",
    status: "pendiente", assigneeName: admin, origin: "Incidencia · Humedad en pared", incidentId: "inc-1",
  },
  {
    id: "tar-2", title: "Revisar el presupuesto de la persiana", dueDate: "2026-10-22",
    status: "pendiente", assigneeName: admin, origin: "Incidencia · Persiana atascada", incidentId: "inc-2",
  },
  {
    id: "tar-3", title: "Confirmar la fecha de la revisión de caldera", dueDate: "2026-11-10",
    status: "completada", assigneeName: admin, origin: "Incidencia · Revisión de caldera", incidentId: "inc-3",
    result: "Fecha acordada con el servicio técnico (ejemplo).",
  },
  {
    id: "tar-4", title: "Actualizar la ficha de la cartera de ejemplo", dueDate: "2026-10-25",
    status: "pendiente", assigneeName: admin, origin: "Tarea independiente",
  },
];
