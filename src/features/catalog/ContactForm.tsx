// Catalog form for contacts (create + descriptive edit). Prevalidates with the
// pure engine before committing, asks for confirmation on duplicate warnings
// and only then calls the catalog API. Memory-only; grants no access.
import { useId, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Lock } from "lucide-react";
import { demoPortfolio } from "@/features/portfolio/data/demo-data";
import type { ContactRole } from "@/features/portfolio/data/types";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/features/layout/ui";
import { useCatalog } from "./CatalogContext";
import { addContact, CATALOG_ROLES, editContact, roleLabels } from "./engine";
import type { CatalogResult, ContactPatch, FieldErrors, FieldName } from "./types";

export const PROTECTED_REASON = "Protegido: vinculado a contratos, dinero, ocupación o titularidad.";
const textareaClass = "min-h-20 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring aria-[invalid=true]:border-destructive";
export { textareaClass };

/** Field wrapper: label, control, optional hint and associated error. */
export function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string | undefined; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="text-sm">
      <label htmlFor={id} className="mb-1 block font-medium">{label}</label>
      {children}
      {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={`${id}-error`} className="mt-1 text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

/** ARIA props linking a control to its error/hint. */
export function aria(id: string, error?: string, hint?: boolean) {
  const by = [error ? `${id}-error` : "", hint ? `${id}-hint` : ""].filter(Boolean).join(" ");
  return { id, "aria-invalid": error ? true : undefined, "aria-describedby": by || undefined } as const;
}

export function ProtectedHint() {
  return <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" aria-hidden="true" />{PROTECTED_REASON}</span>;
}

/** Focus the first control with an error, in visual field order. */
export function focusFirstError(root: HTMLElement | null, order: FieldName[], errors: FieldErrors) {
  const first = order.find((f) => errors[f]);
  if (!root || !first) return;
  const el = root.querySelector<HTMLElement>(`[data-field="${first}"]:not([disabled])`);
  el?.focus();
}

/** Confirmation required before committing when the pure prevalidation warns. */
export function DuplicateConfirm({ warnings, onConfirm, onReview }: { warnings: string[]; onConfirm: () => void; onReview: () => void }) {
  return (
    <div role="alertdialog" aria-labelledby="dup-title" className="rounded-md border border-primary/40 bg-primary/10 p-3 text-sm">
      <p id="dup-title" className="flex items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4" aria-hidden="true" /> Revisa posibles duplicados antes de guardar</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={onConfirm}>Guardar de todos modos</Button>
        <Button type="button" size="sm" variant="outline" onClick={onReview}>Revisar datos</Button>
      </div>
    </div>
  );
}

/** Shared submit flow: prevalidate → errors/focus or confirmation → commit. */
export function useCatalogSubmit(order: FieldName[]) {
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [confirm, setConfirm] = useState<string[] | null>(null);
  const invalidate = () => { setConfirm(null); };
  const submit = (preview: CatalogResult, commit: () => CatalogResult, onSaved: (id: string) => void, confirmed: boolean) => {
    if (!preview.ok) {
      setErrors(preview.errors); setConfirm(null);
      queueMicrotask(() => focusFirstError(formRef.current, order, preview.errors));
      return;
    }
    setErrors({});
    if (preview.warnings.length && !confirmed) { setConfirm(preview.warnings); return; }
    const r = commit();
    if (!r.ok) { setErrors(r.errors); setConfirm(null); queueMicrotask(() => focusFirstError(formRef.current, order, r.errors)); return; }
    setConfirm(null);
    onSaved(r.id);
  };
  return { formRef, errors, confirm, setConfirm, invalidate, submit };
}

interface Draft { type: "persona" | "empresa"; code: string; name: string; roles: ContactRole[]; email: string; phone: string; address: string; note: string }
const ORDER: FieldName[] = ["type", "code", "name", "roles", "email", "phone", "address", "note"];
const opt = (s: string) => (s.trim() ? s.trim() : undefined);

export function ContactForm({ contactId, onSaved, onCancel }: { contactId?: string; onSaved: (id: string) => void; onCancel: () => void }) {
  const api = useCatalog();
  const uid = useId();
  const current = contactId ? api.data.contacts.find((c) => c.id === contactId) : undefined;
  const [draft, setDraft] = useState<Draft>(() => ({
    type: current?.type ?? "persona", code: current?.code ?? "", name: current?.name ?? "", roles: current?.roles ?? [],
    email: current?.email ?? "", phone: current?.phone ?? "", address: current?.address ?? "", note: current?.note ?? "",
  }));
  const { formRef, errors, confirm, setConfirm, invalidate, submit } = useCatalogSubmit(ORDER);
  // Only roles the contact already has and that relations depend on are locked.
  const locked = contactId && current ? api.requiredRoles(contactId).filter((r) => current.roles.includes(r)) : [];
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => { setDraft((d) => ({ ...d, [k]: v })); invalidate(); };
  const toggleRole = (r: ContactRole) => set("roles", draft.roles.includes(r) ? draft.roles.filter((x) => x !== r) : CATALOG_ROLES.filter((x) => x === r || draft.roles.includes(x)));
  const fid = (f: string) => `${uid}-${f}`;

  const payload = (): ContactPatch => ({
    type: draft.type, code: draft.code.trim(), name: draft.name.trim(), roles: draft.roles,
    email: opt(draft.email), phone: opt(draft.phone), address: opt(draft.address), note: opt(draft.note),
  });
  const run = (confirmed: boolean) => {
    const p = payload();
    if (contactId) submit(editContact(demoPortfolio, api.overlay, contactId, p), () => api.editContact(contactId, p), onSaved, confirmed);
    else {
      const input = { ...p, type: draft.type, code: p.code ?? "", name: p.name ?? "", roles: draft.roles };
      submit(addContact(demoPortfolio, api.overlay, input), () => api.addContact(input), onSaved, confirmed);
    }
  };

  return (
    <form ref={formRef} noValidate onSubmit={(e) => { e.preventDefault(); run(false); }} className="space-y-4" aria-label={contactId ? "Editar contacto" : "Nuevo contacto"}>
      {contactId && <p className="text-xs text-muted-foreground">Identificador (solo lectura): <span className="font-mono">{contactId}</span></p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={fid("type")} label="Tipo" error={errors.type}>
          <select data-field="type" {...aria(fid("type"), errors.type)} className={fieldClass} value={draft.type} onChange={(e) => set("type", e.target.value as Draft["type"])}>
            <option value="persona">Persona</option><option value="empresa">Empresa</option>
          </select>
        </Field>
        <Field id={fid("code")} label="Código" error={errors.code} hint="Único; se compara sin acentos, mayúsculas ni signos.">
          <input data-field="code" {...aria(fid("code"), errors.code, true)} className={fieldClass} value={draft.code} onChange={(e) => set("code", e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field id={fid("name")} label="Nombre" error={errors.name}>
            <input data-field="name" {...aria(fid("name"), errors.name)} className={fieldClass} value={draft.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
        </div>
      </div>

      <fieldset className="text-sm" aria-describedby={errors.roles ? `${fid("roles")}-error` : undefined} aria-invalid={errors.roles ? true : undefined}>
        <legend className="mb-1 font-medium">Roles</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {CATALOG_ROLES.map((r) => {
            const isLocked = locked.includes(r);
            return (
              <label key={r} className="inline-flex items-center gap-2">
                <input type="checkbox" data-field="roles" checked={draft.roles.includes(r)} disabled={isLocked} onChange={() => toggleRole(r)} />
                {roleLabels[r]}{isLocked && <Lock className="h-3 w-3 text-muted-foreground" aria-label="protegido" />}
              </label>
            );
          })}
        </div>
        {locked.length > 0 && <p className="mt-1 text-xs text-muted-foreground">No se pueden quitar {locked.map((r) => roleLabels[r]).join(", ")}: tiene relaciones existentes.</p>}
        <p className="mt-1 text-xs text-muted-foreground">Los roles son descriptivos: no conceden acceso a ningún portal.</p>
        {errors.roles && <p id={`${fid("roles")}-error`} className="mt-1 text-xs font-medium text-destructive">{errors.roles}</p>}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={fid("email")} label="Correo ficticio (opcional)" error={errors.email} hint="Solo direcciones terminadas en @example.invalid.">
          <input data-field="email" type="email" {...aria(fid("email"), errors.email, true)} className={fieldClass} value={draft.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field id={fid("phone")} label="Teléfono ficticio (opcional)" error={errors.phone}>
          <input data-field="phone" {...aria(fid("phone"), errors.phone)} className={fieldClass} value={draft.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field id={fid("address")} label="Dirección ficticia (opcional)" error={errors.address}>
            <input data-field="address" {...aria(fid("address"), errors.address)} className={fieldClass} value={draft.address} onChange={(e) => set("address", e.target.value)} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field id={fid("note")} label="Nota (opcional)" error={errors.note}>
            <textarea data-field="note" {...aria(fid("note"), errors.note)} className={textareaClass} value={draft.note} onChange={(e) => set("note", e.target.value)} />
          </Field>
        </div>
      </div>

      {confirm && <DuplicateConfirm warnings={confirm} onConfirm={() => run(true)} onReview={() => setConfirm(null)} />}
      <div className="flex flex-wrap gap-2">
        <Button type="submit">{contactId ? "Guardar cambios temporales" : "Crear contacto temporal"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
      <p className="text-xs text-muted-foreground">Cambio temporal: se pierde al recargar y no crea contratos, dinero ni accesos.</p>
    </form>
  );
}
