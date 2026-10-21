import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  link?: ReactNode; // pre-built <Link>, keeps routes type-safe
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Migas de pan" className="mb-3 text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
            {c.link ?? <span aria-current="page" className="font-medium text-foreground">{c.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export const crumbLinkClass = "rounded-sm hover:text-foreground hover:underline";

export function CarteraCrumb() {
  return <Link to="/cartera" className={crumbLinkClass}>Cartera</Link>;
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, className = "" }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-border bg-card p-5 ${className}`}>
      {title && <h2 className="mb-4 text-sm font-semibold text-foreground">{title}</h2>}
      {children}
    </section>
  );
}
