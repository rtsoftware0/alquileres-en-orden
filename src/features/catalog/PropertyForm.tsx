// Catalog form for properties (create + descriptive edit). Base codes and
// owners stay protected; the owner is chosen by ID among contacts with the
// "propietario" role. Memory-only; grants no access.
import { useId, useState } from "react";
import { demoPortfolio } from "@/features/portfolio/data/demo-data";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/features/layout/ui";
import { useCatalog } from "./CatalogContext";
import { addProperty, editProperty, type NewProperty } from "./engine";
import type { FieldName, PropertyKind, PropertyPatch } from "./types";
import { DuplicateConfirm, Field, ProtectedHint, aria, useCatalogSubmit } from "./ContactForm";

interface Draft { code: string; name: string; address: string; ownerId: string; kind: PropertyKind | ""; portfolioLabel: string; companyLabel: string; managerName: string }
const ORDER: FieldName[] = ["code", "name", "address", "ownerId", "kind"];

export function PropertyForm({ propertyId, onSaved, onCancel }: { propertyId?: string; onSaved: (id: string) => void; onCancel: () => void }) {
  const api = useCatalog();
  const uid = useId();
  const current = propertyId ? api.data.properties.find((p) => p.id === propertyId) : undefined;
  const [draft, setDraft] = useState<Draft>(() => ({
    code: current?.code ?? "", name: current?.name ?? "", address: current?.address ?? "", ownerId: current?.ownerId ?? "",
    kind: current?.kind ?? "", portfolioLabel: current?.portfolioLabel ?? "", companyLabel: current?.companyLabel ?? "", managerName: current?.managerName ?? "",
  }));
  const { formRef, errors, confirm, setConfirm, invalidate, submit } = useCatalogSubmit(ORDER);
  const locked = propertyId ? api.protectedFields("property", propertyId) : [];
  const owners = api.data.contacts.filter((c) => c.roles.includes("propietario") || c.id === draft.ownerId);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => { setDraft((d) => ({ ...d, [k]: v })); invalidate(); };
  const fid = (f: string) => `${uid}-${f}`;

  const payload = (): PropertyPatch => {
    const p: PropertyPatch = {
      name: draft.name.trim(), address: draft.address.trim(),
      portfolioLabel: draft.portfolioLabel.trim(), companyLabel: draft.companyLabel.trim(), managerName: draft.managerName.trim(),
    };
    // Editing sends an explicit clear; creation simply omits the empty field.
    if (draft.kind) p.kind = draft.kind;
    else if (propertyId) p.kind = null;
    if (!locked.includes("code")) p.code = draft.code.trim();
    if (!locked.includes("ownerId")) p.ownerId = draft.ownerId;
    return p;
  };
  const run = (confirmed: boolean) => {
    const p = payload();
    if (propertyId) submit(editProperty(demoPortfolio, api.overlay, propertyId, p), () => api.editProperty(propertyId, p), onSaved, confirmed);
    else {
      const { kind, ...rest } = p;
      const input: NewProperty = { ...rest, code: p.code ?? "", name: p.name ?? "", address: p.address ?? "", ownerId: p.ownerId ?? "", ...(kind ? { kind } : {}) };
      submit(addProperty(demoPortfolio, api.overlay, input), () => api.addProperty(input), onSaved, confirmed);
    }
  };

  return (
    <form ref={formRef} noValidate onSubmit={(e) => { e.preventDefault(); run(false); }} className="space-y-4" aria-label={propertyId ? "Editar inmueble" : "Nuevo inmueble"}>
      {propertyId && <p className="text-xs text-muted-foreground">Identificador (solo lectura): <span className="font-mono">{propertyId}</span></p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={fid("code")} label="Código" error={errors.code} hint={locked.includes("code") ? <ProtectedHint /> : "Único; se compara sin acentos, mayúsculas ni signos."}>
          <input data-field="code" {...aria(fid("code"), errors.code, true)} className={fieldClass} value={draft.code} readOnly={locked.includes("code")} onChange={(e) => set("code", e.target.value)} />
        </Field>
        <Field id={fid("name")} label="Nombre" error={errors.name}>
          <input data-field="name" {...aria(fid("name"), errors.name)} className={fieldClass} value={draft.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field id={fid("address")} label="Dirección ficticia" error={errors.address}>
            <input data-field="address" {...aria(fid("address"), errors.address)} className={fieldClass} value={draft.address} onChange={(e) => set("address", e.target.value)} />
          </Field>
        </div>
        <Field id={fid("ownerId")} label="Propietario" error={errors.ownerId} hint={locked.includes("ownerId") ? <ProtectedHint /> : "Solo contactos con rol propietario. No concede acceso a portales."}>
          <select data-field="ownerId" {...aria(fid("ownerId"), errors.ownerId, true)} className={fieldClass} value={draft.ownerId} disabled={locked.includes("ownerId")} onChange={(e) => set("ownerId", e.target.value)}>
            <option value="">Elige un propietario</option>
            {owners.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
          </select>
        </Field>
        <Field id={fid("kind")} label="Tipo (opcional)" error={errors.kind}>
          <select data-field="kind" {...aria(fid("kind"), errors.kind)} className={fieldClass} value={draft.kind} onChange={(e) => set("kind", e.target.value as Draft["kind"])}>
            <option value="">Sin indicar</option><option value="vivienda">Vivienda</option><option value="edificio">Edificio</option><option value="local">Local</option>
          </select>
        </Field>
        <Field id={fid("portfolioLabel")} label="Cartera (opcional)">
          <input {...aria(fid("portfolioLabel"))} className={fieldClass} value={draft.portfolioLabel} onChange={(e) => set("portfolioLabel", e.target.value)} />
        </Field>
        <Field id={fid("companyLabel")} label="Sociedad (opcional)">
          <input {...aria(fid("companyLabel"))} className={fieldClass} value={draft.companyLabel} onChange={(e) => set("companyLabel", e.target.value)} />
        </Field>
        <Field id={fid("managerName")} label="Responsable (opcional)">
          <input {...aria(fid("managerName"))} className={fieldClass} value={draft.managerName} onChange={(e) => set("managerName", e.target.value)} />
        </Field>
      </div>
      {confirm && <DuplicateConfirm warnings={confirm} onConfirm={() => run(true)} onReview={() => setConfirm(null)} />}
      <div className="flex flex-wrap gap-2">
        <Button type="submit">{propertyId ? "Guardar cambios temporales" : "Crear inmueble temporal"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
      <p className="text-xs text-muted-foreground">Cambio temporal: se pierde al recargar y no crea contratos, dinero ni accesos.</p>
    </form>
  );
}
