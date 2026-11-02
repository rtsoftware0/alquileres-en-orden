import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Info, RotateCcw } from "lucide-react";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import { useCatalogLabels } from "@/features/catalog/CatalogContext";
import type { DocVisibility, MessageThread } from "@/features/portfolio/data/types";
import { getContact } from "@/features/contacts/selectors";
import { threadMessages, threadRecipients } from "./selectors";
import { VisibilityBadge } from "./components/DocsUi";
import { Breadcrumbs, PageHeader, Panel, crumbLinkClass } from "@/features/layout/PageHeader";
import { fieldClass, linkClass } from "@/features/layout/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

// Temporary draft: memory only, never sent and never added to the history.
interface DraftState {
  visibility: DocVisibility;
  recipientIds: string[];
  text: string;
  review: boolean;
  error: string;
}

const emptyDraft: DraftState = { visibility: "interna", recipientIds: [], text: "", review: false, error: "" };

function ContextLink({ thread }: { thread: MessageThread }) {
  if (thread.context.kind === "contrato") {
    const c = data.contracts.find((x) => x.id === thread.context.id);
    return <Link to="/contratos/$contractId" params={{ contractId: thread.context.id }} className={linkClass}>{c?.reference ?? thread.context.id}</Link>;
  }
  const i = data.incidents.find((x) => x.id === thread.context.id);
  return <Link to="/incidencias/$incidentId" params={{ incidentId: thread.context.id }} className={linkClass}>{i?.title ?? thread.context.id}</Link>;
}

export function ThreadPage({ thread }: { thread: MessageThread }) {
  const [view, setView] = useState<"todos" | "compartidos">("todos");
  const [draft, setDraft] = useState<DraftState>(emptyDraft);
  const messages = threadMessages(thread, view);
  const recipients = threadRecipients(data, thread);
  const labels = useCatalogLabels();

  const setVisibility = (v: DocVisibility) =>
    // Changing visibility invalidates the review and clears recipients.
    setDraft((d) => ({ ...d, visibility: v, recipientIds: [], review: false, error: "" }));

  const toggleRecipient = (id: string) =>
    setDraft((d) => ({
      ...d, review: false, error: "",
      recipientIds: d.recipientIds.includes(id) ? d.recipientIds.filter((x) => x !== id) : [...d.recipientIds, id],
    }));

  const review = () => {
    if (!draft.text.trim()) {
      setDraft((d) => ({ ...d, review: false, error: "Escribe el texto del borrador." }));
      document.getElementById("draft-text")?.focus();
      return;
    }
    if (draft.visibility === "compartida" && !draft.recipientIds.length) {
      setDraft((d) => ({ ...d, review: false, error: "Elige al menos un destinatario de ejemplo." }));
      document.getElementById("draft-recipients")?.focus();
      return;
    }
    setDraft((d) => ({ ...d, review: true, error: "" }));
  };

  return (
    <>
      <Breadcrumbs items={[
        { label: "Mensajes", link: <Link to="/mensajes" className={crumbLinkClass}>Mensajes</Link> },
        { label: thread.title },
      ]} />
      <PageHeader
        title={thread.title}
        subtitle={<>Relacionado con: <ContextLink thread={thread} /></>}
        actions={<Link to="/mensajes" className={buttonVariants({ variant: "outline" })}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a mensajes</Link>}
      />

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar historial">
        {(["todos", "compartidos"] as const).map((v) => (
          <button
            key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v}
            className={cn("rounded-md border px-3 py-1.5 text-sm font-medium", view === v ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card text-foreground hover:bg-muted")}
          >
            {v === "todos" ? "Todo el historial" : "Solo compartidos"}
          </button>
        ))}
      </div>
      {view === "compartidos" && (
        <p className="mb-3 text-xs text-muted-foreground">Vista compartida de ejemplo: las notas internas nunca aparecen aquí.</p>
      )}

      <Panel title={`Historial ficticio (${messages.length})`}>
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay mensajes compartidos de ejemplo en este hilo.</p>
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => (
              <li
                key={m.id}
                className={cn(
                  "rounded-md border p-3 text-sm",
                  m.visibility === "interna" ? "border-dashed border-border bg-muted/50" : "border-primary/30 bg-accent/40",
                )}
              >
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{m.author}</span>
                  <span className="flex items-center gap-2">
                    <VisibilityBadge visibility={m.visibility} />
                    <span className="tabular text-xs text-muted-foreground">{formatDate(m.date)}</span>
                  </span>
                </div>
                <p>{m.text}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted-foreground">Historial ficticio: un registro compartido de ejemplo no es una entrega ni una lectura real.</p>
      </Panel>

      <Panel title="Borrador temporal" className="mt-4">
        <p className="mb-4 flex items-center gap-2 rounded-md border border-demo-foreground/20 bg-demo px-3 py-2 text-sm font-medium text-demo-foreground" role="note">
          <Info className="h-4 w-4 shrink-0" aria-hidden="true" /> Demostración: el borrador no se envía ni se añade al historial.
        </p>

        <fieldset className="mb-4 text-sm">
          <legend className="mb-1 font-medium">Tipo de borrador</legend>
          <div className="flex flex-col gap-2 sm:flex-row">
            {(["interna", "compartida"] as DocVisibility[]).map((v) => (
              <label key={v} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
                <input type="radio" name="draft-visibility" checked={draft.visibility === v} onChange={() => setVisibility(v)} className="h-4 w-4 accent-primary" />
                {v === "interna" ? "Nota interna" : "Mensaje compartido (ejemplo)"}
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {draft.visibility === "interna" ? "Una nota interna no tiene destinatarios externos." : "Los destinatarios se limitan a contactos relacionados con este expediente."}
          </p>
        </fieldset>

        {draft.visibility === "compartida" && (
          <fieldset className="mb-4 text-sm" aria-describedby={draft.error && !draft.text.trim() ? undefined : draft.error ? "draft-error" : undefined}>
            <legend className="mb-1 font-medium">Destinatarios de ejemplo</legend>
            {recipients.length === 0 ? (
              <p className="text-xs text-muted-foreground">Este expediente no tiene contactos relacionados disponibles.</p>
            ) : (
              <div className="flex flex-col gap-2" id="draft-recipients" tabIndex={-1}>
                {recipients.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 rounded-md border border-border bg-card p-3">
                    <input type="checkbox" checked={draft.recipientIds.includes(c.id)} onChange={() => toggleRecipient(c.id)} className="h-4 w-4 accent-primary" />
                    <span>{labels.contactName(c.id)}</span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        )}

        <label className="mb-1 block text-sm font-medium" htmlFor="draft-text">Texto del borrador</label>
        <textarea
          id="draft-text" value={draft.text}
          onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value, review: false, error: "" }))}
          className={cn(fieldClass, "h-24 py-2")} aria-invalid={draft.error && !draft.text.trim() ? true : undefined}
          aria-describedby={draft.error ? "draft-error" : undefined}
        />
        {draft.error && <p id="draft-error" role="alert" className="mt-1 text-xs font-medium text-destructive">{draft.error}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={review}>Ver revisión</Button>
          <Button variant="outline" onClick={() => setDraft(emptyDraft)}><RotateCcw className="h-4 w-4" aria-hidden="true" /> Reiniciar borrador</Button>
        </div>

        {draft.review && (
          <div className="mt-4 rounded-md border border-border bg-muted/50 p-4 text-sm" aria-live="polite">
            <p className="font-medium">Revisión del borrador (no se ha enviado nada)</p>
            <dl className="tabular mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2">
              <dt className="text-muted-foreground">Visibilidad</dt>
              <dd><strong>{draft.visibility === "interna" ? "Nota interna" : "Mensaje compartido (ejemplo)"}</strong></dd>
              {draft.visibility === "compartida" && (
                <>
                  <dt className="text-muted-foreground">Destinatarios exactos</dt>
                  <dd>{draft.recipientIds.map((id) => labels.contactName(id)).join(", ")}</dd>
                </>
              )}
              <dt className="text-muted-foreground">Texto</dt>
              <dd className="whitespace-pre-wrap">{draft.text.trim()}</dd>
            </dl>
          </div>
        )}
      </Panel>
    </>
  );
}
