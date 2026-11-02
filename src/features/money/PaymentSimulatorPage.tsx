import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, FlaskConical, RotateCcw } from "lucide-react";
import { useCatalogData } from "@/features/catalog/CatalogContext";
import { getContact } from "@/features/contacts/selectors";
import { expenseBalance, expenseTotals, providerAccountContacts } from "./expenses";
import { simulateProviderPayment, type PaymentSimulation } from "./expense-simulator";
import { parseSimulatedAmount } from "./simulator";
import { MoneyNav } from "./components/MoneyUi";
import { MoneyHeader } from "./MoneySummaryPage";
import { Panel } from "@/features/layout/PageHeader";
import { fieldClass, linkClass } from "@/features/layout/ui";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/format";

// State lives only in React memory: a refresh resets it; nothing is stored.

interface Form { providerId: string; expenseId: string; amount: string }
const empty: Form = { providerId: "", expenseId: "", amount: "" };
type Errors = Partial<Record<keyof Form, string>>;

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

export function PaymentSimulatorPage() {
  const data = useCatalogData();
  // Derived in render for current labels; eligibility still follows expenses only.
  const providers = providerAccountContacts(data).filter((c) =>
    data.expenses.some((e) => e.providerId === c.id && expenseBalance(data, e).outstandingCents > 0));
  const [form, setForm] = useState<Form>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [result, setResult] = useState<Extract<PaymentSimulation, { ok: true }> | null>(null);
  const reviewRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLHeadingElement>(null);
  const [focusTarget, setFocusTarget] = useState<"review" | "form" | null>(null);

  useEffect(() => {
    if (focusTarget === "review") reviewRef.current?.focus();
    if (focusTarget === "form") formRef.current?.focus();
  }, [focusTarget, result]);

  const openExpenses = (providerId: string) =>
    data.expenses.filter((e) => e.providerId === providerId && expenseBalance(data, e).outstandingCents > 0);
  const expenses = form.providerId ? openExpenses(form.providerId) : [];
  const selected = form.expenseId ? data.expenses.find((e) => e.id === form.expenseId) : undefined;
  const selectedBalance = selected ? expenseBalance(data, selected) : undefined;

  const set = (patch: Partial<Form>) => {
    setForm((f) => {
      const next = { ...f, ...patch };
      if ("providerId" in patch) {
        const es = openExpenses(next.providerId);
        next.expenseId = es.length === 1 ? es[0]!.id : "";
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
    const e: Errors = {};
    if (!form.providerId) e.providerId = "Elige un proveedor.";
    if (!form.expenseId) e.expenseId = "Elige un gasto con saldo.";
    const a = parseSimulatedAmount(form.amount);
    if (a.error) e.amount = a.error;
    else if (selectedBalance && a.cents! > selectedBalance.outstandingCents)
      e.amount = `El importe no puede superar el saldo pendiente (${formatMoney(selectedBalance.outstandingCents)}). En esta demostración no se crean anticipos.`;
    setErrors(e);
    if (Object.keys(e).length) {
      const first = (["providerId", "expenseId", "amount"] as const).find((k) => e[k]);
      document.getElementById(`pay-${first}`)?.focus();
      return;
    }
    const r = simulateProviderPayment(data, { providerId: form.providerId, expenseId: form.expenseId, paidCents: a.cents! });
    if (!r.ok) { setErrors({ expenseId: r.error }); return; }
    setResult(r);
    setFocusTarget("review");
  };

  const reset = () => { setForm(empty); setErrors({}); setResult(null); setFocusTarget("form"); };
  const backToEdit = () => { setResult(null); setFocusTarget("form"); };
  const described = (k: keyof Form, hint = false) => [hint ? `pay-${k}-hint` : "", errors[k] ? `pay-${k}-error` : ""].filter(Boolean).join(" ") || undefined;
  const totals = expenseTotals(data);

  return (
    <>
      <MoneyHeader title="Simular un pago a proveedor" subtitle="Cálculo hipotético" />
      <MoneyNav />
      <p role="note" className="mb-4 flex items-center gap-2 rounded-md border border-demo-foreground/30 bg-demo px-3 py-2 text-sm font-semibold text-demo-foreground">
        <FlaskConical className="h-4 w-4 shrink-0" aria-hidden="true" />
        Simulación: no se registra ningún pago
      </p>

      {result && selected ? (
        <Panel>
          <h2 ref={reviewRef} tabIndex={-1} className="mb-1 text-lg font-semibold outline-none">Resultado de la simulación</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {getContact(data, form.providerId)?.name} · {selected.reference} · {selected.concept}. Ningún listado ni saldo ha cambiado.
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
                <tr><th scope="row" className="py-2 text-left font-normal">Coste del gasto</th><td className="py-2 pl-2 text-right">{formatMoney(result.costCents)}</td><td className="py-2 pl-2 text-right">{formatMoney(result.costCents)}</td></tr>
                <tr><th scope="row" className="py-2 text-left font-normal">Pagado</th><td className="py-2 pl-2 text-right">{formatMoney(result.paidBeforeCents)}</td><td className="py-2 pl-2 text-right font-semibold">{formatMoney(result.paidAfterCents)}</td></tr>
                <tr><th scope="row" className="py-2 text-left font-normal">Saldo pendiente del gasto</th><td className="py-2 pl-2 text-right">{formatMoney(result.outstandingBeforeCents)}</td><td className="py-2 pl-2 text-right font-semibold">{formatMoney(result.outstandingAfterCents)}</td></tr>
                <tr><th scope="row" className="py-2 text-left font-normal">Importe pagado simulado</th><td className="py-2 pl-2 text-right">—</td><td className="py-2 pl-2 text-right">{formatMoney(result.paidSimulatedCents)}</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm">Situación real de gastos, sin cambios: coste <strong className="tabular">{formatMoney(result.totalCostCents)}</strong>, pagado <strong className="tabular">{formatMoney(result.totalPaidCents)}</strong>, pendiente <strong className="tabular">{formatMoney(result.totalPendingCents)}</strong>.</p>
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
              <Field id="pay-providerId" label="Proveedor" error={errors.providerId} hint="Solo aparecen proveedores con gastos pendientes o parciales.">
                <select id="pay-providerId" value={form.providerId} onChange={(e) => set({ providerId: e.target.value })} className={fieldClass} aria-invalid={Boolean(errors.providerId)} aria-describedby={described("providerId", true)}>
                  <option value="">Elige un proveedor</option>
                  {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field id="pay-expenseId" label="Gasto con saldo" error={errors.expenseId}>
                <select id="pay-expenseId" value={form.expenseId} disabled={!form.providerId} onChange={(e) => set({ expenseId: e.target.value })} className={fieldClass} aria-invalid={Boolean(errors.expenseId)} aria-describedby={described("expenseId")}>
                  <option value="">{form.providerId ? "Elige un gasto" : "Primero elige un proveedor"}</option>
                  {expenses.map((x) => <option key={x.id} value={x.id}>{x.reference} · {x.concept} · pendiente {formatMoney(expenseBalance(data, x).outstandingCents)}</option>)}
                </select>
              </Field>
              <Field id="pay-amount" label="Importe pagado simulado (€)" error={errors.amount}
                hint={selectedBalance ? `Mayor que 0 y como máximo el saldo pendiente: ${formatMoney(selectedBalance.outstandingCents)}. No se crean anticipos.` : "Mayor que 0, con 2 decimales como máximo."}>
                <input id="pay-amount" inputMode="decimal" autoComplete="off" value={form.amount} onChange={(e) => set({ amount: e.target.value })} className={fieldClass} aria-invalid={Boolean(errors.amount)} aria-describedby={described("amount", true)} />
              </Field>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="submit">Ver simulación</Button>
                <Button type="button" variant="outline" onClick={reset}><RotateCcw className="h-4 w-4" aria-hidden="true" /> Reiniciar simulación</Button>
              </div>
            </form>
          </Panel>
          <Panel title="Situación actual (sin cambios)">
            <dl className="tabular grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Pendiente a proveedores</dt><dd className="font-semibold">{formatMoney(totals.pendingCents)}</dd>
              {selected && selectedBalance && (
                <>
                  <dt className="text-muted-foreground">Gasto elegido</dt>
                  <dd><Link to="/dinero/gastos/$expenseId" params={{ expenseId: selected.id }} className={linkClass}>{selected.reference}</Link> · vence {formatDate(selected.dueDate)}</dd>
                  <dt className="text-muted-foreground">Pendiente del gasto</dt><dd className="font-semibold">{formatMoney(selectedBalance.outstandingCents)}</dd>
                </>
              )}
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">Un gasto por simulación. Al recargar la página se reinicia.</p>
          </Panel>
        </div>
      )}
    </>
  );
}
