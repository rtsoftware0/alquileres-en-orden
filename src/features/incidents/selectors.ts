import type { Incident, IncidentPriority, IncidentStatus, PortfolioDataset, Task } from "@/features/portfolio/data/types";

// Incident and task selectors. "Retrasada" derives from the fixed reference
// date and a non-final status; it is a condition, never stored.

export const INCIDENT_STATUSES: IncidentStatus[] = ["nueva", "en_revision", "asignada", "pendiente_aprobacion", "en_curso", "resuelta", "cerrada"];
export const INCIDENT_PRIORITIES: IncidentPriority[] = ["baja", "media", "alta"];

export const incidentStatusLabel: Record<IncidentStatus, string> = {
  nueva: "Nueva",
  en_revision: "En revisión",
  asignada: "Asignada",
  pendiente_aprobacion: "Pendiente de aprobación",
  en_curso: "En curso",
  resuelta: "Resuelta",
  cerrada: "Cerrada",
};

export const incidentPriorityLabel: Record<IncidentPriority, string> = {
  baja: "Baja", media: "Media", alta: "Alta",
};

const FINAL: IncidentStatus[] = ["resuelta", "cerrada"];
export const isFinalStatus = (s: IncidentStatus) => FINAL.includes(s);

export const getIncident = (d: PortfolioDataset, id: string) => d.incidents.find((i) => i.id === id.toLowerCase());
export const isOverdue = (d: PortfolioDataset, i: Incident) => !isFinalStatus(i.status) && i.targetDate < d.referenceDate;
export const tasksOfIncident = (d: PortfolioDataset, incidentId: string) =>
  d.tasks.filter((t) => t.incidentId === incidentId).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export interface IncidentQuery {
  q: string;
  propertyId: string | "todos";
  roomId: string | "todos";
  priority: IncidentPriority | "todos";
  status: IncidentStatus | "todos";
  assignee: string | "todos";
  overdueOnly: boolean;
}

export function filterIncidents(d: PortfolioDataset, o: IncidentQuery): Incident[] {
  const q = normalize(o.q);
  return d.incidents
    .filter((i) => o.propertyId === "todos" || i.propertyId === o.propertyId)
    .filter((i) => o.roomId === "todos" || i.roomId === o.roomId)
    .filter((i) => o.priority === "todos" || i.priority === o.priority)
    .filter((i) => o.status === "todos" || i.status === o.status)
    .filter((i) => o.assignee === "todos" || i.assigneeName === o.assignee)
    .filter((i) => !o.overdueOnly || isOverdue(d, i))
    .filter((i) => {
      if (!q) return true;
      const room = i.roomId ? d.rooms.find((r) => r.id === i.roomId)?.code ?? "" : "";
      const provider = i.providerId ? d.contacts.find((c) => c.id === i.providerId)?.name ?? "" : "";
      return [i.title, i.description, i.category, room, provider].some((v) => normalize(v).includes(q));
    })
    .sort((a, b) => b.openedOn.localeCompare(a.openedOn) || a.id.localeCompare(b.id));
}

export const incidentAssignees = (d: PortfolioDataset) => [...new Set(d.incidents.map((i) => i.assigneeName))].sort();

// --- Tasks

export const isTaskOverdue = (d: PortfolioDataset, t: Task) => t.status === "pendiente" && t.dueDate < d.referenceDate;

export interface TaskQuery {
  q: string;
  status: TaskStatus | "todos";
  overdueOnly: boolean;
}

export function filterTasks(d: PortfolioDataset, o: TaskQuery): Task[] {
  const q = normalize(o.q);
  return d.tasks
    .filter((t) => o.status === "todos" || t.status === o.status)
    .filter((t) => !o.overdueOnly || isTaskOverdue(d, t))
    .filter((t) => !q || [t.title, t.origin, t.assigneeName].some((v) => normalize(v).includes(q)))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id));
}

export function taskCounts(d: PortfolioDataset) {
  const pendientes = d.tasks.filter((t) => t.status === "pendiente");
  return {
    pendientes: pendientes.length,
    vencidas: pendientes.filter((t) => isTaskOverdue(d, t)).length,
    completadas: d.tasks.filter((t) => t.status === "completada").length,
  };
}
