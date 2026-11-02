import { Link } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { useCatalogData } from "@/features/catalog/CatalogContext";
import { threadContextLabel, threadMessages } from "./selectors";
import { PageHeader } from "@/features/layout/PageHeader";
import { linkClass } from "@/features/layout/ui";
import { cn } from "@/lib/utils";

export function ThreadsPage() {
  const data = useCatalogData();
  return (
    <>
      <PageHeader
        title="Mensajes"
        subtitle={`${data.threads.length} conversaciones ficticias vinculadas a contratos e incidencias. Nada se envía.`}
      />
      <ul className="space-y-2">
        {data.threads.map((t) => {
          const shared = threadMessages(t, "compartidos").length;
          const internal = t.messages.length - shared;
          return (
            <li key={t.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link to="/mensajes/$threadId" params={{ threadId: t.id }} className={cn(linkClass, "text-sm")}>{t.title}</Link>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                  {t.messages.length} entradas · {shared} compartidas · {internal} internas
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t.context.kind === "contrato" ? "Contrato" : "Incidencia"}: {threadContextLabel(data, t)}
              </p>
            </li>
          );
        })}
      </ul>
    </>
  );
}
