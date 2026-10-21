import { CircleCheck, Clock, DoorOpen, Wrench, type LucideIcon } from "lucide-react";
import type { RoomStatus } from "../data/types";
import { cn } from "@/lib/utils";

export const statusMeta: Record<RoomStatus, { label: string; icon: LucideIcon; className: string }> = {
  ocupada: { label: "Ocupada", icon: CircleCheck, className: "text-status-occupied bg-status-occupied/10 border-status-occupied/25" },
  disponible: { label: "Disponible", icon: DoorOpen, className: "text-status-available bg-status-available/10 border-status-available/25" },
  reservada: { label: "Reservada", icon: Clock, className: "text-status-reserved bg-status-reserved/10 border-status-reserved/25" },
  bloqueada: { label: "Bloqueada", icon: Wrench, className: "text-status-blocked bg-status-blocked/10 border-status-blocked/25" },
};

export function StatusBadge({ status, className }: { status: RoomStatus; className?: string }) {
  const m = statusMeta[status];
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap", m.className, className)}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {m.label}
    </span>
  );
}
