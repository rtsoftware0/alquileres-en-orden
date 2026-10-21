import { Archive, Ban, FileCheck, FilePen, Hourglass, type LucideIcon } from "lucide-react";
import type { ContractStatus } from "@/features/portfolio/data/types";
import { cn } from "@/lib/utils";

export const contractStatusMeta: Record<ContractStatus, { label: string; icon: LucideIcon; className: string }> = {
  borrador: { label: "Borrador", icon: FilePen, className: "text-muted-foreground bg-muted border-border" },
  pendiente: { label: "Pendiente de formalización", icon: Hourglass, className: "text-status-reserved bg-status-reserved/10 border-status-reserved/25" },
  activo: { label: "Activo", icon: FileCheck, className: "text-status-occupied bg-status-occupied/10 border-status-occupied/25" },
  finalizado: { label: "Finalizado", icon: Archive, className: "text-secondary-foreground bg-secondary border-border" },
  cancelado: { label: "Cancelado", icon: Ban, className: "text-status-blocked bg-status-blocked/10 border-status-blocked/25" },
};

export function ContractStatusBadge({ status, className }: { status: ContractStatus; className?: string }) {
  const m = contractStatusMeta[status];
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap", m.className, className)}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {m.label}
    </span>
  );
}
