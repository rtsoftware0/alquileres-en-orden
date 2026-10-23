import type { DocVisibility, NoticeType } from "@/features/portfolio/data/types";
import { noticeTypeLabel } from "../selectors";
import { cn } from "@/lib/utils";

export function VisibilityBadge({ visibility }: { visibility: DocVisibility }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
      visibility === "interna" ? "border-border bg-muted text-secondary-foreground" : "border-primary/40 bg-accent text-accent-foreground",
    )}>
      {visibility === "interna" ? "Nota interna" : "Compartido (ejemplo)"}
    </span>
  );
}

export function NoticeTypeBadge({ type }: { type: NoticeType }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-secondary-foreground whitespace-nowrap">
      {noticeTypeLabel[type]}
    </span>
  );
}
