import { AlertCircle, CheckCircle2, CircleDashed, CircleDot, Clock, Eye, PlayCircle, ThumbsUp, XCircle } from "lucide-react";
import type { IncidentPriority, IncidentStatus, TaskStatus } from "@/features/portfolio/data/types";
import { incidentPriorityLabel, incidentStatusLabel } from "../selectors";
import { cn } from "@/lib/utils";

const badge = "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap";

export const incidentStatusMeta: Record<IncidentStatus, { className: string; icon: typeof CircleDot }> = {
  nueva: { icon: CircleDashed, className: "text-muted-foreground bg-muted border-border" },
  en_revision: { icon: Eye, className: "text-secondary-foreground bg-secondary border-border" },
  asignada: { icon: CircleDot, className: "text-status-available bg-status-available/10 border-status-available/25" },
  pendiente_aprobacion: { icon: ThumbsUp, className: "text-status-reserved bg-status-reserved/10 border-status-reserved/25" },
  en_curso: { icon: PlayCircle, className: "text-status-available bg-status-available/10 border-status-available/25" },
  resuelta: { icon: CheckCircle2, className: "text-status-occupied bg-status-occupied/10 border-status-occupied/25" },
  cerrada: { icon: XCircle, className: "text-muted-foreground bg-muted border-border" },
};

export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  const m = incidentStatusMeta[status];
  const Icon = m.icon;
  return <span className={cn(badge, m.className)}><Icon className="h-3.5 w-3.5" aria-hidden="true" />{incidentStatusLabel[status]}</span>;
}

const priorityClass: Record<IncidentPriority, string> = {
  alta: "text-status-blocked bg-status-blocked/10 border-status-blocked/25",
  media: "text-status-reserved bg-status-reserved/10 border-status-reserved/25",
  baja: "text-muted-foreground bg-muted border-border",
};

export function IncidentPriorityBadge({ priority }: { priority: IncidentPriority }) {
  return <span className={cn(badge, priorityClass[priority])}>Prioridad {incidentPriorityLabel[priority].toLowerCase()}</span>;
}

export function OverdueIncidentTag() {
  return (
    <span className={cn(badge, "text-status-blocked bg-status-blocked/10 border-status-blocked/25")} title="Fecha objetivo anterior a la fecha de referencia y estado no final">
      <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />Retrasada
    </span>
  );
}

export function TaskStatusBadge({ status, overdue }: { status: TaskStatus; overdue: boolean }) {
  if (status === "completada")
    return <span className={cn(badge, "text-status-occupied bg-status-occupied/10 border-status-occupied/25")}><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />Completada</span>;
  if (overdue)
    return <span className={cn(badge, "text-status-blocked bg-status-blocked/10 border-status-blocked/25")}><AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />Vencida</span>;
  return <span className={cn(badge, "text-status-reserved bg-status-reserved/10 border-status-reserved/25")}><Clock className="h-3.5 w-3.5" aria-hidden="true" />Pendiente</span>;
}
