import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Info, RotateCcw } from "lucide-react";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import type { DocLinkKind, DocVisibility } from "@/features/portfolio/data/types";
import { getContact } from "@/features/contacts/selectors";
import { DOC_EXAMPLES, docLinkOptions, docDraftProperty, emptyDocDraft, validateDocDraftData, validateDocDraftVisibility, type DocDraftErrors, type DocDraftValues } from "./draft";
import { docCategories, docLinkKindLabel, docRecipients } from "./selectors";
import { Breadcrumbs, PageHeader, Panel, crumbLinkClass } from "@/features/layout/PageHeader";
import { fieldClass } from "@/features/layout/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const steps = ["Contenido y vínculo", "Visibilidad", "Resumen"];
const STEP0_ORDER = ["exampleId", "name", "category", "linkKind", "linkId"] as const;
const STEP1_ORDER = ["visibility", "recipients"] as const;

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string | undefined; children: ReactNode }) {
  return (
    <div className="text-sm">
      <label htmlFor={id} className="mb-1 block font-medium">{label}</label>
      {children}
      {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={`${id}-error`} className="mt-1 text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

export function DocDraftWizard() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<DocDraftValues>(emptyDocDraft);
  const [errors, setErrors] = useState<DocDraftErrors>({});
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstStep = useRef(true);

  useEffect(() => {
    if (firstStep.current) { firstStep.current = false; return; }
    headingRef.current?.focus();
  }, [step]);

  const set = (patch: Partial<DocDraftValues>) => {
    setValues((v) => {
      const next = { ...v, ...patch };
      // Changing the link or the visibility invalidates incompatible recipients.
      if ("linkKind" in patch) { next.linkId = ""; next.recipientIds = []; }
      if ("linkId" in patch) next.recipientIds = [];
      if ("visibility" in patch) next.recipientIds = [];
      return next;
    });
    setErrors((e) => {
      const n = { ...e };
      for (const k of Object.keys(patch)) delete n[k as keyof DocDraftErrors];
      if ("linkKind" in patch) delete n.linkId;
      if ("linkKind" in patch || "linkId" in patch || "visibility" in patch) delete n.recipients;
      return n;
    });
  };

  const toggleRecipient = (id: string) =>
    set({ recipientIds: values.recipientIds.includes(id) ? values.recipientIds.filter((x) => x !== id) : [...values.recipientIds, id] });

  const aria = (k: string, hint = false) => ({
    id: k,
    "aria-invalid": errors[k as keyof DocDraftErrors] ? true : undefined,
    "aria-describedby": [hint ? `${k}-hint` : "", errors[k as keyof DocDraftErrors] ? `${k}-error` : ""].filter(Boolean).join(" ") || undefined,
  });

  const next = () => {
    const e = step === 0 ? validateDocDraftData(values) : validateDocDraftVisibility(data, values);
    setErrors(e);
    if (Object.keys(e).length) {
      const order = step === 0 ? STEP0_ORDER : STEP1_ORDER;
      const first = order.find((k) => e[k]);
      document.getElementById(first!)?.focus();
      return;
    }
    setStep((s) => s + 1);
  };
  const back = () => { setErrors({}); setStep((s) => s - 1); };
  const restart = () => { setValues(emptyDocDraft); setErrors({}); setStep(0); };

  const linkOpts = values.linkKind ? docLinkOptions(data, values.linkKind) : [];
  const propertyId = docDraftProperty(data, values.linkKind, values.linkId);
  const property = propertyId ? data.properties.find((p) => p.id === propertyId) : undefined;
  const recipients = values.linkKind && values.linkId ? docRecipients(data, { kind: values.linkKind, id: values.linkId }) : [];
  const example = DOC_EXAMPLES.find((x) => x.id === values.exampleId);

  return (
    <>
      <Breadcrumbs items={[
        { label: "Documentos", link: <Link to="/documentos" className={crumbLinkClass}>Documentos</Link> },
        { label: "Preparar documento de ejemplo" },
      ]} />
      <PageHeader title="Preparar documento de ejemplo" subtitle="Asistente de demostración en 3 pasos." />

      <p className="mb-4 flex items-center gap-2 rounded-md border border-demo-foreground/20 bg-demo px-3 py-2 text-sm font-medium text-demo-foreground" role="note">
        <Info className="h-4 w-4 shrink-0" aria-hidden="true" /> Demostración: no se guarda ni se comparte ningún documento.
      </p>

      <ol className="mb-4 grid grid-cols-3 gap-2 text-xs sm:text-sm" aria-label="Pasos">
        {steps.map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined}
            className={cn("rounded-md border px-2 py-2 sm:px-3", i === step ? "border-primary bg-accent font-semibold text-accent-foreground" : i < step ? "border-border bg-card text-foreground" : "border-border bg-card text-muted-foreground")}>
            <span className="tabular">{i + 1}.</span> {s}
          </li>
        ))}
      </ol>

      <Panel>
        <h2 ref={headingRef} tabIndex={-1} className="mb-4 text-base font-semibold focus:outline-none">Paso {step + 1} de 3 · {steps[step]}</h2>

        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="exampleId" label="Contenido de ejemplo" hint="Textos ficticios incorporados; no se sube ningún archivo." error={errors.exampleId}>
              <select {...aria("exampleId", true)} value={values.exampleId} onChange={(e) => set({ exampleId: e.target.value })} className={fieldClass}>
                <option value="">Elige un contenido</option>
                {DOC_EXAMPLES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
              </select>
            </Field>
            <Field id="name" label="Nombre del documento" error={errors.name}>
              <input {...aria("name")} value={values.name} onChange={(e) => set({ name: e.target.value })} className={fieldClass} autoComplete="off" />
            </Field>
            <Field id="category" label="Categoría" error={errors.category}>
              <select {...aria("category")} value={values.category} onChange={(e) => set({ category: e.target.value })} className={fieldClass}>
                <option value="">Elige una categoría</option>
                {docCategories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field id="linkKind" label="Tipo de registro relacionado" error={errors.linkKind}>
              <select {...aria("linkKind")} value={values.linkKind} onChange={(e) => set({ linkKind: e.target.value as DocLinkKind | "" })} className={fieldClass}>
                <option value="">Elige un tipo</option>
                {(Object.keys(docLinkKindLabel) as DocLinkKind[]).map((k) => <option key={k} value={k}>{docLinkKindLabel[k]}</option>)}
              </select>
            </Field>
            <Field id="linkId" label="Registro relacionado" error={errors.linkId}>
              <select {...aria("linkId")} value={values.linkId} disabled={!values.linkKind} onChange={(e) => set({ linkId: e.target.value })} className={fieldClass}>
                <option value="">{values.linkKind ? "Elige un registro" : "Primero elige un tipo"}</option>
                {linkOpts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </Field>
            {property && (
              <p className="self-end text-sm text-muted-foreground">Inmueble derivado: <strong className="text-foreground">{property.name}</strong></p>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4">
            <fieldset
              id="visibility" tabIndex={-1}
              className="rounded-md text-sm focus:outline-2 focus:outline-ring"
              aria-invalid={errors.visibility ? true : undefined}
              aria-describedby={errors.visibility ? "visibility-error" : undefined}
            >
              <legend className="mb-1 font-medium">Visibilidad de ejemplo</legend>
              <div className="flex flex-col gap-2">
                {(["interna", "compartida"] as DocVisibility[]).map((v) => (
                  <label key={v} className="flex items-start gap-2 rounded-md border border-border bg-card p-3">
                    <input
                      type="radio" name="visibility" value={v} checked={values.visibility === v}
                      onChange={() => set({ visibility: v })} className="mt-0.5 h-4 w-4 accent-primary"
                      aria-invalid={errors.visibility ? true : undefined}
                    />
                    <span>
                      <span className="font-medium">{v === "interna" ? "Interna" : "Compartida (ejemplo)"}</span>
                      <span className="block text-xs text-muted-foreground">
                        {v === "interna" ? "Solo la ve el equipo interno; sin destinatarios externos." : "Con destinatarios de ejemplo relacionados con el registro. No concede acceso real."}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              {errors.visibility && <p id="visibility-error" className="mt-1 text-xs font-medium text-destructive">{errors.visibility}</p>}
            </fieldset>

            {values.visibility === "compartida" && (
              <fieldset
                id="recipients" tabIndex={-1}
                className="rounded-md text-sm focus:outline-2 focus:outline-ring"
                aria-invalid={errors.recipients ? true : undefined}
                aria-describedby={errors.recipients ? "recipients-error" : undefined}
              >
                <legend className="mb-1 font-medium">Destinatarios de ejemplo</legend>
                {recipients.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Este registro no tiene contactos relacionados disponibles como destinatarios.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {recipients.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 rounded-md border border-border bg-card p-3">
                        <input
                          type="checkbox" checked={values.recipientIds.includes(c.id)} onChange={() => toggleRecipient(c.id)}
                          className="h-4 w-4 accent-primary" aria-invalid={errors.recipients ? true : undefined}
                        />
                        <span>{c.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-xs text-muted-foreground">Un contacto no es una cuenta de acceso; esto no envía nada.</p>
                {errors.recipients && <p id="recipients-error" className="mt-1 text-xs font-medium text-destructive">{errors.recipients}</p>}
              </fieldset>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="mb-4 text-sm text-muted-foreground">Resumen de ejemplo. No se ha creado ningún documento ni se ha compartido nada.</p>
            <dl className="tabular grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Nombre</dt><dd>{values.name}</dd>
              <dt className="text-muted-foreground">Categoría</dt><dd>{values.category}</dd>
              <dt className="text-muted-foreground">Contenido</dt><dd>{example?.label}</dd>
              <dt className="text-muted-foreground">Relacionado con</dt>
              <dd>{values.linkKind && docLinkKindLabel[values.linkKind]}: {linkOpts.find((o) => o.id === values.linkId)?.label}</dd>
              <dt className="text-muted-foreground">Inmueble</dt><dd>{property?.name}</dd>
              <dt className="text-muted-foreground">Visibilidad</dt>
              <dd>{values.visibility === "interna" ? "Interna" : "Compartida (ejemplo)"}<span className="block text-xs text-muted-foreground">Visibilidad de ejemplo; no concede acceso.</span></dd>
              {values.visibility === "compartida" && (
                <>
                  <dt className="text-muted-foreground">Destinatarios</dt>
                  <dd>{values.recipientIds.map((id) => getContact(data, id)?.name ?? id).join(", ")}</dd>
                </>
              )}
            </dl>
            {example && <p className="mt-4 rounded-md border border-border bg-muted/50 p-3 text-sm text-muted-foreground">{example.content}</p>}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between">
          {step === 0 ? (
            <Link to="/documentos" className={buttonVariants({ variant: "outline" })}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a documentos</Link>
          ) : (
            <Button variant="outline" onClick={back}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Paso anterior</Button>
          )}
          {step === 0 && <Button onClick={next}>Siguiente <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>}
          {step === 1 && <Button onClick={next}>Ver resumen de ejemplo <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>}
          {step === 2 && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={restart}><RotateCcw className="h-4 w-4" aria-hidden="true" /> Reiniciar demostración</Button>
              <Link to="/documentos" className={buttonVariants()}>Volver a documentos</Link>
            </div>
          )}
        </div>
      </Panel>
    </>
  );
}
