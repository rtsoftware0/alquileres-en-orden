import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Info, RotateCcw } from "lucide-react";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import { contactsWithRole, getContact } from "@/features/contacts/selectors";
import { emptyIncidentDraft, validateIncidentFollowUp, validateIncidentPlace, type IncidentDraftErrors, type IncidentDraftValues } from "./draft";
import { INCIDENT_PRIORITIES, incidentPriorityLabel } from "./selectors";
import { INCIDENT_CATEGORIES } from "./data/demo-incidents";
import { Breadcrumbs, PageHeader, Panel, crumbLinkClass } from "@/features/layout/PageHeader";
import { fieldClass } from "@/features/layout/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const steps = ["Lugar y descripción", "Responsable y objetivo", "Resumen"];
const STEP0_ORDER = ["propertyId", "roomId", "category", "title", "description", "priority", "contactId", "openedOn"] as const;
const STEP1_ORDER = ["assigneeName", "targetDate", "providerId"] as const;

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

export function IncidentDraftWizard() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<IncidentDraftValues>(emptyIncidentDraft);
  const [errors, setErrors] = useState<IncidentDraftErrors>({});
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstStep = useRef(true);

  useEffect(() => {
    if (firstStep.current) { firstStep.current = false; return; }
    headingRef.current?.focus();
  }, [step]);

  const set = (patch: Partial<IncidentDraftValues>) => {
    setValues((v) => {
      const next = { ...v, ...patch };
      if ("propertyId" in patch) next.roomId = ""; // units belong to one property
      return next;
    });
    setErrors((e) => {
      const n = { ...e };
      for (const k of Object.keys(patch)) delete n[k as keyof IncidentDraftErrors];
      if ("propertyId" in patch) delete n.roomId;
      return n;
    });
  };

  const aria = (k: keyof IncidentDraftValues, hint = false) => ({
    id: k,
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": [hint ? `${k}-hint` : "", errors[k] ? `${k}-error` : ""].filter(Boolean).join(" ") || undefined,
  });

  const next = () => {
    const e = step === 0 ? validateIncidentPlace(values, data) : validateIncidentFollowUp(values, data);
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
  const restart = () => { setValues(emptyIncidentDraft); setErrors({}); setStep(0); };

  const property = data.properties.find((p) => p.id === values.propertyId);
  const rooms = property ? data.rooms.filter((r) => r.propertyId === property.id) : [];
  const providers = contactsWithRole(data, ["proveedor"]);
  const room = values.roomId ? data.rooms.find((r) => r.id === values.roomId) : undefined;

  return (
    <>
      <Breadcrumbs items={[
        { label: "Incidencias", link: <Link to="/incidencias" className={crumbLinkClass}>Incidencias</Link> },
        { label: "Preparar incidencia de ejemplo" },
      ]} />
      <PageHeader title="Preparar incidencia de ejemplo" subtitle="Asistente de demostración en 3 pasos." />

      <p className="mb-4 flex items-center gap-2 rounded-md border border-demo-foreground/20 bg-demo px-3 py-2 text-sm font-medium text-demo-foreground" role="note">
        <Info className="h-4 w-4 shrink-0" aria-hidden="true" /> Demostración: no se guarda ninguna incidencia.
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
            <Field id="propertyId" label="Inmueble" error={errors.propertyId}>
              <select {...aria("propertyId")} value={values.propertyId} onChange={(e) => set({ propertyId: e.target.value })} className={fieldClass}>
                <option value="">Elige un inmueble</option>
                {data.properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field id="roomId" label="Unidad (opcional)" hint="Déjalo vacío si afecta a zonas comunes." error={errors.roomId}>
              <select {...aria("roomId", true)} value={values.roomId} disabled={!property} onChange={(e) => set({ roomId: e.target.value })} className={fieldClass}>
                <option value="">{property ? "Zonas comunes" : "Primero elige un inmueble"}</option>
                {rooms.map((r) => <option key={r.id} value={r.id}>{r.code}</option>)}
              </select>
            </Field>
            <Field id="category" label="Categoría" error={errors.category}>
              <select {...aria("category")} value={values.category} onChange={(e) => set({ category: e.target.value })} className={fieldClass}>
                <option value="">Elige una categoría</option>
                {INCIDENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field id="priority" label="Prioridad" error={errors.priority}>
              <select {...aria("priority")} value={values.priority} onChange={(e) => set({ priority: e.target.value })} className={fieldClass}>
                <option value="">Elige una prioridad</option>
                {INCIDENT_PRIORITIES.map((p) => <option key={p} value={p}>{incidentPriorityLabel[p]}</option>)}
              </select>
            </Field>
            <Field id="title" label="Título" error={errors.title}>
              <input {...aria("title")} value={values.title} onChange={(e) => set({ title: e.target.value })} className={fieldClass} autoComplete="off" />
            </Field>
            <Field id="openedOn" label="Fecha de registro" error={errors.openedOn}>
              <input type="date" {...aria("openedOn")} value={values.openedOn} onChange={(e) => set({ openedOn: e.target.value })} className={fieldClass} />
            </Field>
            <div className="sm:col-span-2">
              <Field id="description" label="Descripción" error={errors.description}>
                <textarea {...aria("description")} value={values.description} onChange={(e) => set({ description: e.target.value })} className={cn(fieldClass, "h-24 py-2")} />
              </Field>
            </div>
            <Field id="contactId" label="Contacto relacionado (opcional)" error={errors.contactId}>
              <select {...aria("contactId")} value={values.contactId} onChange={(e) => set({ contactId: e.target.value })} className={fieldClass}>
                <option value="">Sin contacto</option>
                {data.contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="assigneeName" label="Responsable interno" hint="La demostración tiene un único administrador ficticio." error={errors.assigneeName}>
              <input {...aria("assigneeName", true)} value={values.assigneeName} onChange={(e) => set({ assigneeName: e.target.value })} className={fieldClass} autoComplete="off" placeholder="Administrador de demostración" />
            </Field>
            <Field id="targetDate" label="Fecha objetivo" error={errors.targetDate}>
              <input type="date" {...aria("targetDate")} value={values.targetDate} onChange={(e) => set({ targetDate: e.target.value })} className={fieldClass} />
            </Field>
            <Field id="providerId" label="Proveedor (opcional)" hint="Un contacto con rol proveedor; no es una cuenta de acceso." error={errors.providerId}>
              <select {...aria("providerId", true)} value={values.providerId} onChange={(e) => set({ providerId: e.target.value })} className={fieldClass}>
                <option value="">Sin proveedor</option>
                {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
          </div>
        )}

        {step === 2 && property && (
          <div>
            <p className="mb-4 text-sm text-muted-foreground">Resumen de ejemplo. No se ha creado ninguna incidencia ni ha cambiado ningún indicador.</p>
            <dl className="tabular grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Inmueble</dt><dd>{property.name}</dd>
              <dt className="text-muted-foreground">Unidad</dt><dd>{room ? room.code : "Zonas comunes"}</dd>
              <dt className="text-muted-foreground">Categoría</dt><dd>{values.category}</dd>
              <dt className="text-muted-foreground">Título</dt><dd>{values.title}</dd>
              <dt className="text-muted-foreground">Descripción</dt><dd>{values.description}</dd>
              <dt className="text-muted-foreground">Prioridad</dt><dd>{incidentPriorityLabel[values.priority as keyof typeof incidentPriorityLabel]}</dd>
              <dt className="text-muted-foreground">Contacto</dt><dd>{values.contactId ? getContact(data, values.contactId)?.name : "Sin contacto"}</dd>
              <dt className="text-muted-foreground">Fecha de registro</dt><dd>{formatDate(values.openedOn)}</dd>
              <dt className="text-muted-foreground">Responsable</dt><dd>{values.assigneeName}</dd>
              <dt className="text-muted-foreground">Fecha objetivo</dt><dd>{formatDate(values.targetDate)}</dd>
              <dt className="text-muted-foreground">Proveedor</dt><dd>{values.providerId ? getContact(data, values.providerId)?.name : "Sin proveedor"}</dd>
            </dl>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between">
          {step === 0 ? (
            <Link to="/incidencias" className={buttonVariants({ variant: "outline" })}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a incidencias</Link>
          ) : (
            <Button variant="outline" onClick={back}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Paso anterior</Button>
          )}
          {step === 0 && <Button onClick={next}>Siguiente <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>}
          {step === 1 && <Button onClick={next}>Ver resumen de ejemplo <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>}
          {step === 2 && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={restart}><RotateCcw className="h-4 w-4" aria-hidden="true" /> Reiniciar demostración</Button>
              <Link to="/incidencias" className={buttonVariants()}>Volver a incidencias</Link>
            </div>
          )}
        </div>
      </Panel>
    </>
  );
}
