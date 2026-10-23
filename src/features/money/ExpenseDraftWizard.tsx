import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Info, RotateCcw } from "lucide-react";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import { contactsWithRole, getContact } from "@/features/contacts/selectors";
import { parseEuroToCents } from "@/features/contracts/draft";
import {
  emptyExpenseDraft, splitEqual, splitManual, validateExpenseData, validateExpenseSplit,
  type ExpenseDraftErrors, type ExpenseDraftValues,
} from "./expense-draft";
import { bearerLabel } from "./expenses";
import { EXPENSE_CATEGORIES } from "./data/demo-expenses";
import { Breadcrumbs, PageHeader, Panel, crumbLinkClass } from "@/features/layout/PageHeader";
import { fieldClass } from "@/features/layout/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const steps = ["Datos del gasto", "Coste y reparto", "Resumen"];
const STEP0_ORDER = ["concept", "providerId", "category", "propertyId", "date", "period", "dueDate", "amount"] as const;

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

export function ExpenseDraftWizard() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<ExpenseDraftValues>(emptyExpenseDraft);
  const [errors, setErrors] = useState<ExpenseDraftErrors>({});
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstStep = useRef(true);

  useEffect(() => {
    if (firstStep.current) { firstStep.current = false; return; }
    headingRef.current?.focus();
  }, [step]);

  const set = (patch: Partial<ExpenseDraftValues>) => {
    setValues((v) => {
      const next = { ...v, ...patch };
      // Changing amount, property or unit selection invalidates the previous split.
      if ("amount" in patch || "propertyId" in patch || "roomIds" in patch || "splitMode" in patch) {
        if ("propertyId" in patch) { next.roomIds = []; next.manualAmounts = {}; }
      }
      return next;
    });
    setErrors((e) => {
      const n = { ...e };
      for (const k of Object.keys(patch)) delete n[k as keyof ExpenseDraftErrors];
      if ("amount" in patch || "roomIds" in patch || "splitMode" in patch) delete n.split;
      return n;
    });
  };

  const aria = (k: string, hint = false) => ({
    id: k,
    "aria-invalid": errors[k as keyof ExpenseDraftErrors] ? true : undefined,
    "aria-describedby": [hint ? `${k}-hint` : "", errors[k as keyof ExpenseDraftErrors] ? `${k}-error` : ""].filter(Boolean).join(" ") || undefined,
  });

  const next = () => {
    const e = step === 0 ? validateExpenseData(values, data) : validateExpenseSplit(values, data);
    setErrors(e);
    if (Object.keys(e).length) {
      const first = step === 0 ? STEP0_ORDER.find((k) => e[k]) : (e.bearer ? "bearer" : "split");
      document.getElementById(first!)?.focus();
      return;
    }
    setStep((s) => s + 1);
  };
  const back = () => { setErrors({}); setStep((s) => s - 1); };
  const restart = () => { setValues(emptyExpenseDraft); setErrors({}); setStep(0); };

  const providers = contactsWithRole(data, ["proveedor"]);
  const property = data.properties.find((p) => p.id === values.propertyId);
  const rooms = property ? data.rooms.filter((r) => r.propertyId === property.id) : [];
  const amountCents = parseEuroToCents(values.amount) ?? 0;
  const split =
    step === 2 && amountCents > 0 && values.splitMode === "igualitario" ? splitEqual(amountCents, values.roomIds)
    : step === 2 && amountCents > 0 && values.splitMode === "manual" ? splitManual(amountCents, values.roomIds, values.manualAmounts)
    : null;

  const toggleRoom = (id: string) =>
    set({ roomIds: values.roomIds.includes(id) ? values.roomIds.filter((x) => x !== id) : [...values.roomIds, id] });

  return (
    <>
      <Breadcrumbs items={[
        { label: "Dinero", link: <Link to="/dinero" className={crumbLinkClass}>Dinero</Link> },
        { label: "Gastos", link: <Link to="/dinero/gastos" className={crumbLinkClass}>Gastos</Link> },
        { label: "Preparar gasto de ejemplo" },
      ]} />
      <PageHeader title="Preparar gasto de ejemplo" subtitle="Asistente de demostración en 3 pasos." />

      <p className="mb-4 flex items-center gap-2 rounded-md border border-demo-foreground/20 bg-demo px-3 py-2 text-sm font-medium text-demo-foreground" role="note">
        <Info className="h-4 w-4 shrink-0" aria-hidden="true" /> Demostración: no se guarda ningún gasto ni se generan cargos.
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
            <Field id="concept" label="Concepto" error={errors.concept}>
              <input {...aria("concept")} value={values.concept} onChange={(e) => set({ concept: e.target.value })} className={fieldClass} autoComplete="off" />
            </Field>
            <Field id="providerId" label="Proveedor" error={errors.providerId}>
              <select {...aria("providerId")} value={values.providerId} onChange={(e) => set({ providerId: e.target.value })} className={fieldClass}>
                <option value="">Elige un proveedor</option>
                {providers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field id="category" label="Categoría" error={errors.category}>
              <select {...aria("category")} value={values.category} onChange={(e) => set({ category: e.target.value })} className={fieldClass}>
                <option value="">Elige una categoría</option>
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field id="propertyId" label="Inmueble" error={errors.propertyId}>
              <select {...aria("propertyId")} value={values.propertyId} onChange={(e) => set({ propertyId: e.target.value })} className={fieldClass}>
                <option value="">Elige un inmueble</option>
                {data.properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field id="date" label="Fecha del gasto" error={errors.date}>
              <input type="date" {...aria("date")} value={values.date} onChange={(e) => set({ date: e.target.value })} className={fieldClass} />
            </Field>
            <Field id="period" label="Periodo (mes del gasto)" hint="Mes al que se imputa el gasto, distinto de la fecha de pago." error={errors.period}>
              <input type="month" {...aria("period", true)} value={values.period} onChange={(e) => set({ period: e.target.value })} className={fieldClass} />
            </Field>
            <Field id="dueDate" label="Vencimiento del pago" error={errors.dueDate}>
              <input type="date" {...aria("dueDate")} value={values.dueDate} onChange={(e) => set({ dueDate: e.target.value })} className={fieldClass} />
            </Field>
            <Field id="amount" label="Importe (€)" hint="Mayor que 0, con 2 decimales como máximo. Ejemplo: 120 o 120,50." error={errors.amount}>
              <input inputMode="decimal" autoComplete="off" {...aria("amount", true)} value={values.amount} onChange={(e) => set({ amount: e.target.value })} className={fieldClass} />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <fieldset>
              <legend className="mb-1 text-sm font-medium">¿Quién soporta el coste?</legend>
              <p id="bearer-hint" className="mb-2 text-xs text-muted-foreground">Elección explícita: la demostración no decide automáticamente si se puede cobrar a inquilinos.</p>
              <div className="flex flex-col gap-2 text-sm" role="radiogroup" aria-describedby="bearer-hint">
                {(["operador", "propietario", "inquilino"] as const).map((b) => (
                  <label key={b} className="flex items-center gap-2">
                    <input type="radio" name="bearer" value={b} checked={values.bearer === b} onChange={() => set({ bearer: b })} className="h-4 w-4 accent-primary" />
                    {bearerLabel[b]}
                  </label>
                ))}
              </div>
              {errors.bearer && <p id="bearer-error" className="mt-1 text-xs font-medium text-destructive">{errors.bearer}</p>}
            </fieldset>

            <fieldset>
              <legend className="mb-1 text-sm font-medium">Reparto entre unidades</legend>
              <div className="flex flex-col gap-2 text-sm">
                <label className="flex items-center gap-2">
                  <input type="radio" name="splitMode" value="sin_reparto" checked={values.splitMode === "sin_reparto"} onChange={() => set({ splitMode: "sin_reparto" })} className="h-4 w-4 accent-primary" />
                  Sin reparto (gasto del inmueble)
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="splitMode" value="igualitario" checked={values.splitMode === "igualitario"} onChange={() => set({ splitMode: "igualitario" })} className="h-4 w-4 accent-primary" />
                  Reparto igualitario entre unidades elegidas
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="splitMode" value="manual" checked={values.splitMode === "manual"} onChange={() => set({ splitMode: "manual" })} className="h-4 w-4 accent-primary" />
                  Reparto manual (debe sumar el importe exacto)
                </label>
              </div>
            </fieldset>

            {values.splitMode !== "sin_reparto" && (
              <fieldset>
                <legend className="mb-1 text-sm font-medium">Unidades de {property?.name ?? "…"}</legend>
                {!property && <p className="text-sm text-muted-foreground">Elige primero un inmueble en el paso anterior.</p>}
                <div className="grid gap-2 sm:grid-cols-2">
                  {rooms.map((r) => (
                    <div key={r.id} className="flex items-center gap-2 text-sm">
                      <label className="flex min-w-24 items-center gap-2">
                        <input type="checkbox" checked={values.roomIds.includes(r.id)} onChange={() => toggleRoom(r.id)} className="h-4 w-4 accent-primary" />
                        {r.code}
                      </label>
                      {values.splitMode === "manual" && values.roomIds.includes(r.id) && (
                        <input
                          aria-label={`Importe para ${r.code}`}
                          inputMode="decimal" autoComplete="off" placeholder="0,00"
                          value={values.manualAmounts[r.id] ?? ""}
                          onChange={(e) => set({ manualAmounts: { ...values.manualAmounts, [r.id]: e.target.value } })}
                          className={cn(fieldClass, "h-9 w-28")}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </fieldset>
            )}
            {errors.split && <p id="split-error" className="text-xs font-medium text-destructive">{errors.split}</p>}
            <p className="text-xs text-muted-foreground">El reparto es simulado: no es un cargo registrado y no aparece en la cuenta de ningún inquilino.</p>
          </div>
        )}

        {step === 2 && property && (
          <div>
            <p className="mb-4 text-sm text-muted-foreground">Resumen de ejemplo. No se ha guardado ningún gasto, ningún pago ni ningún cargo a inquilinos.</p>
            <dl className="tabular grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Concepto</dt><dd>{values.concept}</dd>
              <dt className="text-muted-foreground">Proveedor</dt><dd>{getContact(data, values.providerId)?.name}</dd>
              <dt className="text-muted-foreground">Categoría</dt><dd>{values.category}</dd>
              <dt className="text-muted-foreground">Inmueble</dt><dd>{property.name}</dd>
              <dt className="text-muted-foreground">Fecha del gasto</dt><dd>{formatDate(values.date)}</dd>
              <dt className="text-muted-foreground">Periodo</dt><dd>{values.period}</dd>
              <dt className="text-muted-foreground">Vencimiento del pago</dt><dd>{formatDate(values.dueDate)}</dd>
              <dt className="text-muted-foreground">Importe</dt><dd className="font-semibold">{formatMoney(amountCents)}</dd>
              <dt className="text-muted-foreground">Soporta el coste</dt><dd>{bearerLabel[values.bearer as keyof typeof bearerLabel]}</dd>
            </dl>
            {split && (
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-semibold">Reparto de ejemplo ({values.splitMode === "igualitario" ? "igualitario" : "manual"})</h3>
                <ul className="divide-y divide-border text-sm">
                  {split.map((s) => (
                    <li key={s.roomId} className="flex items-center justify-between gap-3 py-2">
                      <span>{data.rooms.find((r) => r.id === s.roomId)?.code}</span>
                      <span className="tabular font-semibold">{formatMoney(s.amountCents)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">Si sobra algún céntimo, se asigna a la primera unidad por orden de código. No es un cargo registrado.</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between">
          {step === 0 ? (
            <Link to="/dinero/gastos" className={buttonVariants({ variant: "outline" })}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a gastos</Link>
          ) : (
            <Button variant="outline" onClick={back}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Paso anterior</Button>
          )}
          {step === 0 && <Button onClick={next}>Siguiente <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>}
          {step === 1 && <Button onClick={next}>Ver resumen de ejemplo <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>}
          {step === 2 && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={restart}><RotateCcw className="h-4 w-4" aria-hidden="true" /> Reiniciar demostración</Button>
              <Link to="/dinero/gastos" className={buttonVariants()}>Volver a gastos</Link>
            </div>
          )}
        </div>
      </Panel>
    </>
  );
}
