import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, ArrowRight, Info, RotateCcw } from "lucide-react";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import { contactsWithRole, getContact } from "@/features/contacts/selectors";
import { exampleOverlaps } from "./selectors";
import {
  MODALITIES, emptyDraft, parseEuroToCents, validateParties, validateTerms,
  type DraftErrors, type DraftValues,
} from "./draft";
import { Breadcrumbs, PageHeader, Panel, crumbLinkClass } from "@/features/layout/PageHeader";
import { fieldClass } from "@/features/layout/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { addDays, formatCents, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const steps = ["Partes y unidad", "Fechas y condiciones", "Resumen"];
const FIELD_ORDER: (keyof DraftValues)[] = ["roomId", "landlordId", "tenantId", "guarantorId", "startDate", "endDate", "rent", "deposit", "dueDay", "modality"];

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

export function DraftWizard({ session }: { session?: { values: DraftValues; step: number; linked?: boolean; resetValues?: DraftValues; onChange: (values: DraftValues, step: number) => void } } = {}) {
  const [localStep, setLocalStep] = useState(0);
  const [localValues, setLocalValues] = useState<DraftValues>(emptyDraft);
  const step = session?.step ?? localStep;
  const values = session?.values ?? localValues;
  const setStep = (update: number | ((previous: number) => number)) => {
    const next = typeof update === 'function' ? update(step) : update;
    if (session) session.onChange(values, next); else setLocalStep(next);
  };
  const setValues = (update: DraftValues | ((previous: DraftValues) => DraftValues)) => {
    const next = typeof update === 'function' ? update(values) : update;
    if (session) session.onChange(next, step); else setLocalValues(next);
  };
  const [errors, setErrors] = useState<DraftErrors>({});
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstStep = useRef(true);

  useEffect(() => {
    if (firstStep.current) { firstStep.current = false; return; }
    headingRef.current?.focus();
  }, [step]);

  const set = (k: keyof DraftValues) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => { const n = { ...er }; delete n[k]; return n; });
  };

  const aria = (k: keyof DraftValues, hint = false) => ({
    id: k,
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": [hint ? `${k}-hint` : "", errors[k] ? `${k}-error` : ""].filter(Boolean).join(" ") || undefined,
  });

  const next = () => {
    const e = step === 0 ? validateParties(values, data) : validateTerms(values);
    setErrors(e);
    const first = FIELD_ORDER.find((k) => e[k]);
    if (first) { document.getElementById(first)?.focus(); return; }
    setStep((s) => s + 1);
  };
  const back = () => { setErrors({}); setStep((s) => s - 1); };
  const restart = () => { if (session) session.onChange(session.resetValues ?? session.values, 0); else { setLocalValues(emptyDraft); setLocalStep(0); } setErrors({}); };

  const landlords = contactsWithRole(data, ["propietario", "arrendador"]);
  const tenants = contactsWithRole(data, ["inquilino", "candidato"]);
  const guarantors = contactsWithRole(data, ["avalista"]);
  const room = data.rooms.find((r) => r.id === values.roomId);
  const property = room ? data.properties.find((p) => p.id === room.propertyId) : undefined;
  const overlaps = step === 2 && room ? exampleOverlaps(data, room.id, values.startDate, values.endDate) : [];

  return (
    <>
      <Breadcrumbs items={[{ label: "Contratos", link: <Link to="/contratos" className={crumbLinkClass}>Contratos</Link> }, { label: "Preparar borrador" }]} />
      <PageHeader title="Preparar borrador de ejemplo" subtitle="Asistente de demostración en 3 pasos." />

      <p className="mb-4 flex items-center gap-2 rounded-md border border-demo-foreground/20 bg-demo px-3 py-2 text-sm font-medium text-demo-foreground" role="note">
        <Info className="h-4 w-4 shrink-0" aria-hidden="true" /> Demostración: los cambios no se guardan.
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
        {session?.linked&&session.resetValues&&<p className="mb-4 text-sm text-demo-foreground">Candidato y habitación vinculados a la solicitud (solo lectura). Fechas solicitadas: {formatDate(session.resetValues.startDate)} – {formatDate(session.resetValues.endDate)}. {values.startDate!==session.resetValues.startDate||values.endDate!==session.resetValues.endDate?'Las fechas de este borrador difieren de las solicitadas; no modifican la solicitud ni la reserva.':'Las fechas de este borrador coinciden con las solicitadas.'}</p>}

        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="roomId" label="Habitación" error={errors.roomId}>
              {session?.linked?<input {...aria('roomId')} readOnly value={room?.code ?? values.roomId} className={fieldClass}/>:<select {...aria("roomId")} value={values.roomId} onChange={set("roomId")} className={fieldClass}>
                <option value="">Elige una habitación</option>
                {data.properties.map((p) => (
                  <optgroup key={p.id} label={p.name}>
                    {data.rooms.filter((r) => r.propertyId === p.id).map((r) => <option key={r.id} value={r.id}>{r.code}</option>)}
                  </optgroup>
                ))}
              </select>}
            </Field>
            <Field id="landlordId" label="Parte arrendadora" hint="Quien arrienda. Puede no ser el propietario (p. ej. subarriendo)." error={errors.landlordId}>
              <select {...aria("landlordId", true)} value={values.landlordId} onChange={set("landlordId")} className={fieldClass}>
                <option value="">Elige la parte arrendadora</option>
                {landlords.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field id="tenantId" label="Inquilino" hint="Contactos con rol inquilino o candidato." error={errors.tenantId}>
              {session?.linked?<input {...aria('tenantId',true)} readOnly value={getContact(data,values.tenantId)?.name ?? values.tenantId} className={fieldClass}/>:<select {...aria("tenantId", true)} value={values.tenantId} onChange={set("tenantId")} className={fieldClass}>
                <option value="">Elige un inquilino</option>
                {tenants.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>}
            </Field>
            <Field id="guarantorId" label="Avalista (opcional)" error={errors.guarantorId}>
              <select {...aria("guarantorId")} value={values.guarantorId} onChange={set("guarantorId")} className={fieldClass}>
                <option value="">Sin avalista</option>
                {guarantors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="startDate" label="Fecha de entrada" hint="Día incluido: el inquilino ocupa la habitación desde este día." error={errors.startDate}>
              <input type="date" {...aria("startDate", true)} value={values.startDate} onChange={set("startDate")} className={fieldClass} />
            </Field>
            <Field id="endDate" label="Fecha de salida" hint="Día no incluido: la habitación queda libre ese día." error={errors.endDate}>
              <input type="date" {...aria("endDate", true)} value={values.endDate} onChange={set("endDate")} className={fieldClass} />
            </Field>
            <Field id="rent" label="Renta mensual (€)" hint="Mayor que 0. Ejemplo: 350 o 350,50." error={errors.rent}>
              <input inputMode="decimal" autoComplete="off" {...aria("rent", true)} value={values.rent} onChange={set("rent")} className={fieldClass} />
            </Field>
            <Field id="deposit" label="Fianza (€)" hint="Aparte de la renta. Puede ser 0." error={errors.deposit}>
              <input inputMode="decimal" autoComplete="off" {...aria("deposit", true)} value={values.deposit} onChange={set("deposit")} className={fieldClass} />
            </Field>
            <Field id="dueDay" label="Día de vencimiento" hint="Número entero del 1 al 28." error={errors.dueDay}>
              <input inputMode="numeric" autoComplete="off" {...aria("dueDay", true)} value={values.dueDay} onChange={set("dueDay")} className={fieldClass} />
            </Field>
            <Field id="modality" label="Modalidad" error={errors.modality}>
              <select {...aria("modality")} value={values.modality} onChange={set("modality")} className={fieldClass}>
                <option value="">Elige una modalidad</option>
                {MODALITIES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
          </div>
        )}

        {step === 2 && room && property && (
          <div>
            <p className="mb-4 text-sm text-muted-foreground">Resumen de ejemplo. No se ha creado ningún contrato ni se ha comprobado la disponibilidad real.</p>
            {overlaps.length > 0 && (
              <p className="mb-4 flex items-start gap-2 rounded-md bg-status-reserved/10 p-3 text-sm text-status-reserved">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Aviso de ejemplo: estas fechas coinciden con {overlaps.map((o) => o.reference).join(", ")} en {room.code} dentro de los datos de demostración.</span>
              </p>
            )}
            <dl className="tabular grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Unidad</dt><dd>{property.name} · {room.code}</dd>
              <dt className="text-muted-foreground">Arrendador</dt><dd>{getContact(data, values.landlordId)?.name}</dd>
              <dt className="text-muted-foreground">Inquilino</dt><dd>{getContact(data, values.tenantId)?.name}</dd>
              <dt className="text-muted-foreground">Avalista</dt><dd>{values.guarantorId ? getContact(data, values.guarantorId)?.name : "Sin avalista"}</dd>
              <dt className="text-muted-foreground">Entrada</dt><dd>{formatDate(values.startDate)} (incluida)</dd>
              <dt className="text-muted-foreground">Salida</dt><dd>{formatDate(values.endDate)} (no incluida)</dd>
              <dt className="text-muted-foreground">Último día ocupado</dt><dd className="font-semibold">{formatDate(addDays(values.endDate, -1))}</dd>
              <dt className="text-muted-foreground">Renta mensual</dt><dd className="font-semibold">{formatCents(parseEuroToCents(values.rent) ?? 0)}</dd>
              <dt className="text-muted-foreground">Fianza</dt><dd>{formatCents(parseEuroToCents(values.deposit) ?? 0)}</dd>
              <dt className="text-muted-foreground">Vencimiento</dt><dd>Día {Number(values.dueDay)} de cada mes</dd>
              <dt className="text-muted-foreground">Modalidad</dt><dd>{values.modality}</dd>
            </dl>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between">
          {step === 0 ? (
            <Link to="/contratos" className={buttonVariants({ variant: "outline" })}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a contratos</Link>
          ) : (
            <Button variant="outline" onClick={back}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Paso anterior</Button>
          )}
          {step === 0 && <Button onClick={next}>Siguiente <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>}
          {step === 1 && <Button onClick={next}>Ver resumen de ejemplo <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>}
          {step === 2 && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={restart}><RotateCcw className="h-4 w-4" aria-hidden="true" /> Reiniciar demostración</Button>
              <Link to="/contratos" className={buttonVariants()}>Volver a contratos</Link>
            </div>
          )}
        </div>
      </Panel>
    </>
  );
}
