import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import { getContact } from "@/features/contacts/selectors";
import { chargeBalance, getCharge, pendingCents, tenantAccountContacts } from "./selectors";
import { eligibleCharges, parseSimulatedAmount, simulateCollection, type SimulationResult } from "./simulator";
import { MoneyNav, SimulationNotice } from "./components/MoneyUi";
import { MoneyHeader } from "./MoneySummaryPage";
import { Panel } from "@/features/layout/PageHeader";
import { fieldClass, linkClass } from "@/features/layout/ui";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/format";

// State lives only in React memory: a refresh resets it; nothing is stored.

interface Form { payerId: string; contractId: string; chargeId: string; amount: string }
const empty: Form = { payerId: "", contractId: "", chargeId: "", amount: "" };
type Errors = Partial<Record<keyof Form, string>>;

const payers = tenantAccountContacts(data).filter((c) => eligibleCharges(data, c.id).length > 0);

function validate(f: Form): Errors {
  const e: Errors = {};
  if (!f.payerId) e.payerId = "Elige un inquilino.";
  if (!f.contractId) e.contractId = "Elige un contrato.";
  if (!f.chargeId) e.chargeId = "Elige un vencimiento.";
  const a = parseSimulatedAmount(f.amount);
  if (a.error) e.amount = a.error;
  return e;
}

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string | undefined; hint?: string; children: React.ReactNode }) {
  return (
    <div className="text-sm">
      <label htmlFor={id} className="mb-1 block font-medium">{label}</label>
      {children}
      {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={`${id}-error`} className="mt-1 text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

export function SimulatorPage() {
  const [form, setForm] = useState<Form>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [result, setResult] = useState<Extract<SimulationResult, { ok: true }> | null>(null);
  const reviewRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLHeadingElement>(null);
  const [focusTarget, setFocusTarget] = useState<"review" | "form" | null>(null);

  useEffect(() => {
    if (focusTarget === "review") reviewRef.current?.focus();
    if (focusTarget === "form") formRef.current?.focus();
  }, [focusTarget, result]);

  const contracts = form.payerId
    ? data.contracts.filter((c) => eligibleCharges(data, form.payerId, c.id).length > 0)
    : [];
  const charges = form.payerId && form.contractId ? eligibleCharges(data, form.payerId, form.contractId) : [];
  const selected = form.chargeId ? getCharge(data, form.chargeId) : undefined;

  const set = (patch: Partial<Form>) => {
    setForm((f) => {
      const next = { ...f, ...patch };
      if ("payerId" in patch) {
        const cs = data.contracts.filter((c) => eligibleCharges(data, next.payerId, c.id).length > 0);
        next.contractId = cs.length === 1 ? cs[0]!.id : "";
        next.chargeId = "";
      }
      if ("payerId" in patch || "contractId" in patch) {
        const ch = next.payerId && next.contractId ? eligibleCharges(data, next.payerId, next.contractId) : [];
        next.chargeId = ch.length === 1 ? ch[0]!.id : "";
      }
      return next;
    });
    setErrors((e) => {
      const n = { ...e };
      for (const k of Object.keys(patch) as (keyof Form)[]) delete n[k];
      return n;
    });
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length) {
      const first = (["payerId", "contractId", "chargeId", "amount"] as const).find((k) => e[k]);
      document.getElementById(`sim-${first}`)?.focus();
      return;
    }
    const r = simulateCollection(data, { payerId: form.payerId, chargeId: form.chargeId, receivedCents: parseSimulatedAmount(form.amount).cents! });
    if (!r.ok) { setErrors({ chargeId: r.error }); return; }
    setResult(r);
    setFocusTarget("review");
  };

  const reset = () => { setForm(empty); setErrors({}); setResult(null); setFocusTarget("form"); };
  const backToEdit = () => { setResult(null); setFocusTarget("form"); };
  const described = (k: keyof Form, hint = false) => [hint ? `sim-${k}-hint` : "", errors[k] ? `sim-${k}-error` : ""].filter(Boolean).join(" ") || undefined;

  return (
    <>
      <MoneyHeader title="Simular un cobro" subtitle="Cálculo hipotético" />
      <MoneyNav />
      <SimulationNotice />

      {result ? (
        <Panel>
          <h2 ref={reviewRef} tabIndex={-1} className="mb-1 text-lg font-semibold outline-none">Resultado de la simulación</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {getContact(data, form.payerId)?.name} · {selected?.reference} · {selected?.concept}. Ningún listado ni saldo ha cambiado.
          </p>
          <div className="overflow-x-auto">
            <table className="tabular w-full table-fixed text-sm">
              <colgroup><col className="w-[44%]" /><col className="w-[28%]" /><col className="w-[28%]" /></colgroup>
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th scope="col" className="py-2 font-medium">Concepto</th>
                  <th scope="col" className="py-2 text-right font-medium">Antes</th>
                  <th scope="col" className="py-2 text-right font-medium">Después</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr><th scope="row" className="py-2 text-left font-normal">Pendiente del vencimiento</th><td className="py-2 pl-2 text-right">{formatMoney(result.outstandingBeforeCents)}</td><td className="py-2 pl-2 text-right font-semibold">{formatMoney(result.outstandingAfterCents)}</td></tr>
                <tr><th scope="row" className="py-2 text-left font-normal">Importe recibido simulado</th><td className="py-2 pl-2 text-right">—</td><td className="py-2 pl-2 text-right">{formatMoney(result.receivedCents)}</td></tr>
                <tr><th scope="row" className="py-2 text-left font-normal">Asignado al vencimiento</th><td className="py-2 pl-2 text-right">—</td><td className="py-2 pl-2 text-right">{formatMoney(result.allocatedCents)}</td></tr>
                <tr><th scope="row" className="py-2 text-left font-normal">Sin asignar</th><td className="py-2 pl-2 text-right">—</td><td className="py-2 pl-2 text-right">{formatMoney(result.unallocatedCents)}</td></tr>
                <tr><th scope="row" className="py-2 text-left font-normal">Pendiente de la cartera</th><td className="py-2 pl-2 text-right">{formatMoney(result.portfolioPendingCents)}</td><td className="py-2 pl-2 text-right">{formatMoney(result.portfolioPendingIfRealCents)} <span className="block text-xs text-muted-foreground">solo si fuera real</span></td></tr>
              </tbody>
            </table>
          </div>
          {result.unallocatedCents > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">El exceso de {formatMoney(result.unallocatedCents)} quedaría sin asignar: no se convierte en renta adicional ni reduce otras deudas.</p>
          )}
          <p className="mt-3 text-sm">Pendiente real de la cartera, sin cambios: <strong className="tabular">{formatMoney(pendingCents(data))}</strong></p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="outline" onClick={backToEdit}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a editar</Button>
            <Button onClick={reset}><RotateCcw className="h-4 w-4" aria-hidden="true" /> Reiniciar simulación</Button>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Panel>
            <h2 ref={formRef} tabIndex={-1} className="mb-4 text-sm font-semibold outline-none">Datos de la simulación</h2>
            <form noValidate onSubmit={submit} className="space-y-4">
              <Field id="sim-payerId" label="Inquilino" error={errors.payerId} hint="Solo aparecen inquilinos con vencimientos pendientes o parciales.">
                <select id="sim-payerId" value={form.payerId} onChange={(e) => set({ payerId: e.target.value })} className={fieldClass} aria-invalid={Boolean(errors.payerId)} aria-describedby={described("payerId", true)}>
                  <option value="">Elige un inquilino</option>
                  {payers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field id="sim-contractId" label="Contrato" error={errors.contractId}>
                <select id="sim-contractId" value={form.contractId} disabled={!form.payerId} onChange={(e) => set({ contractId: e.target.value })} className={fieldClass} aria-invalid={Boolean(errors.contractId)} aria-describedby={described("contractId")}>
                  <option value="">{form.payerId ? "Elige un contrato" : "Primero elige un inquilino"}</option>
                  {contracts.map((c) => <option key={c.id} value={c.id}>{c.reference} · {data.rooms.find((r) => r.id === c.roomId)?.code}</option>)}
                </select>
              </Field>
              <Field id="sim-chargeId" label="Vencimiento con saldo" error={errors.chargeId}>
                <select id="sim-chargeId" value={form.chargeId} disabled={!form.contractId} onChange={(e) => set({ chargeId: e.target.value })} className={fieldClass} aria-invalid={Boolean(errors.chargeId)} aria-describedby={described("chargeId")}>
                  <option value="">{form.contractId ? "Elige un vencimiento" : "Primero elige un contrato"}</option>
                  {charges.map((c) => <option key={c.id} value={c.id}>{c.reference} · {c.concept} · pendiente {formatMoney(chargeBalance(data, c).outstandingCents)}</option>)}
                </select>
              </Field>
              <Field id="sim-amount" label="Importe recibido simulado (€)" error={errors.amount} hint="Mayor que 0, con 2 decimales como máximo. Ejemplo: 200 o 200,50.">
                <input id="sim-amount" inputMode="decimal" autoComplete="off" value={form.amount} onChange={(e) => set({ amount: e.target.value })} className={fieldClass} aria-invalid={Boolean(errors.amount)} aria-describedby={described("amount", true)} />
              </Field>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="submit">Ver simulación</Button>
                <Button type="button" variant="outline" onClick={reset}><RotateCcw className="h-4 w-4" aria-hidden="true" /> Reiniciar simulación</Button>
              </div>
            </form>
          </Panel>
          <Panel title="Situación actual (sin cambios)">
            <dl className="tabular grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Pendiente de la cartera</dt><dd className="font-semibold">{formatMoney(pendingCents(data))}</dd>
              {selected && (
                <>
                  <dt className="text-muted-foreground">Vencimiento elegido</dt>
                  <dd><Link to="/dinero/vencimientos/$chargeId" params={{ chargeId: selected.id }} className={linkClass}>{selected.reference}</Link> · vence {formatDate(selected.dueDate)}</dd>
                  <dt className="text-muted-foreground">Pendiente del vencimiento</dt><dd className="font-semibold">{formatMoney(chargeBalance(data, selected).outstandingCents)}</dd>
                </>
              )}
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">Se aplica un solo vencimiento por simulación. Al recargar la página se reinicia.</p>
          </Panel>
        </div>
      )}
    </>
  );
}
