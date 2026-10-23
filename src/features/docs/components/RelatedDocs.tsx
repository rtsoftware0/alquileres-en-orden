import { Link } from "@tanstack/react-router";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import { docLinkLabel } from "../selectors";
import { linkClass } from "@/features/layout/ui";

// Cross-links from a record (contract / incident / expense) to its example
// documents and threads. Renders nothing when there is no data.

export function RelatedDocsLinks({ kind, id }: { kind: "contrato" | "incidencia" | "gasto"; id: string }) {
  const docs = data.documents.filter((d) => d.link.kind === kind && d.link.id === id);
  const threads = kind === "gasto" ? [] : data.threads.filter((t) => t.context.kind === kind && t.context.id === id);
  if (!docs.length && !threads.length) return null;
  return (
    <div className="text-sm">
      <span className="text-muted-foreground">Documentos y mensajes de ejemplo: </span>
      <ul className="mt-1 space-y-1">
        {docs.map((d) => (
          <li key={d.id}>
            <Link to="/documentos/$documentId" params={{ documentId: d.id }} className={linkClass}>{d.title}</Link>
            <span className="text-xs text-muted-foreground"> · {docLinkLabel(data, d)}</span>
          </li>
        ))}
        {threads.map((t) => (
          <li key={t.id}>
            <Link to="/mensajes/$threadId" params={{ threadId: t.id }} className={linkClass}>{t.title}</Link>
            <span className="text-xs text-muted-foreground"> · conversación ficticia</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
