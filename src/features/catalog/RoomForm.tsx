// Catalog form for units (create + descriptive edit). Base code/property/status
// stay protected; added units may change property only without relations.
// New units are always "disponible" and never create contracts or charges.
import { useId, useState } from "react";
import { demoPortfolio } from "@/features/portfolio/data/demo-data";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/features/layout/ui";
import { useCatalog } from "./CatalogContext";
import { addRoom, editRoom, roomHasRelations } from "./engine";
import type { FieldName, RoomPatch, UnitKind } from "./types";
import { DuplicateConfirm, Field, ProtectedHint, aria, textareaClass, useCatalogSubmit } from "./ContactForm";

/** Accepts "525,55" or "525.55"; anything else (including empty) is NaN for the engine to reject. */
export function parseDecimal(s: string): number {
  const t = s.trim();
  if (!/^-?\d+(?:[.,]\d+)?$/.test(t)) return Number.NaN;
  return Number(t.replace(",", "."));
}

interface Draft { propertyId: string; code: string; unitKind: UnitKind | ""; capacity: string; areaM2: string; monthlyRent: string; features: string; statusNote: string }
const ORDER: FieldName[] = ["propertyId", "code", "unitKind", "capacity", "areaM2", "monthlyRent", "features"];

export function RoomForm({ roomId, initialPropertyId, onSaved, onCancel }: { roomId?: string; initialPropertyId?: string; onSaved: (id: string) => void; onCancel: () => void }) {
  const api = useCatalog();
  const uid = useId();
  const current = roomId ? api.data.rooms.find((r) => r.id === roomId) : undefined;
  // An unknown preselected property is never replaced silently: the user must choose.
  const knownInitial = initialPropertyId && api.data.properties.some((p) => p.id === initialPropertyId) ? initialPropertyId : "";
  const unknownInitial = Boolean(initialPropertyId) && !knownInitial;
  const [draft, setDraft] = useState<Draft>(() => ({
    propertyId: current?.propertyId ?? knownInitial, code: current?.code ?? "", unitKind: current?.unitKind ?? "",
    capacity: current?.capacity !== undefined ? String(current.capacity) : "", areaM2: current?.areaM2 ? String(current.areaM2) : "",
    monthlyRent: current ? String(current.monthlyRent).replace(".", ",") : "", features: current?.features.join(", ") ?? "", statusNote: current?.statusNote ?? "",
  }));
  const { formRef, errors, confirm, setConfirm, invalidate, submit } = useCatalogSubmit(ORDER);
  const locked = roomId ? api.protectedFields("room", roomId) : [];
  const propertyLocked = locked.includes("propertyId") || (roomId ? roomHasRelations(api.data, roomId) : false);
  const codeLocked = locked.includes("code");
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => { setDraft((d) => ({ ...d, [k]: v })); invalidate(); };
  const fid = (f: string) => `${uid}-${f}`;

  const payload = (): RoomPatch => {
    const p: RoomPatch = {
      monthlyRent: parseDecimal(draft.monthlyRent),
      areaM2: draft.areaM2.trim() ? parseDecimal(draft.areaM2) : 0,
      features: draft.features.split(",").map((f) => f.trim()).filter(Boolean),
      statusNote: draft.statusNote.trim(),
    };
    if (draft.capacity.trim()) p.capacity = parseDecimal(draft.capacity);
    if (draft.unitKind) p.unitKind = draft.unitKind;
    if (!codeLocked) p.code = draft.code.trim();
    if (!propertyLocked) p.propertyId = draft.propertyId;
    return p;
  };
  const run = (confirmed: boolean) => {
    const p = payload();
    if (roomId) submit(editRoom(demoPortfolio, api.overlay, roomId, p), () => api.editRoom(roomId, p), onSaved, confirmed);
    else {
      const input = { ...p, code: p.code ?? "", propertyId: p.propertyId ?? "", monthlyRent: p.monthlyRent ?? Number.NaN, features: p.features ?? [] };
      submit(addRoom(demoPortfolio, api.overlay, input), () => api.addRoom(input), onSaved, confirmed);
    }
  };

  return (
    <form ref={formRef} noValidate onSubmit={(e) => { e.preventDefault(); run(false); }} className="space-y-4" aria-label={roomId ? "Editar unidad" : "Nueva unidad"}>
      {roomId && <p className="text-xs text-muted-foreground">Identificador (solo lectura): <span className="font-mono">{roomId}</span> · El estado se deriva de contratos, reservas e incidencias y no se edita aquí.</p>}
      {unknownInitial && <p role="status" className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm">El inmueble indicado no existe en la cartera de ejemplo. Elige un inmueble.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={fid("propertyId")} label="Inmueble" error={errors.propertyId} hint={propertyLocked ? <ProtectedHint /> : undefined}>
          <select data-field="propertyId" {...aria(fid("propertyId"), errors.propertyId, propertyLocked)} className={fieldClass} value={draft.propertyId} disabled={propertyLocked} onChange={(e) => set("propertyId", e.target.value)}>
            <option value="">Elige un inmueble</option>
            {api.data.properties.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
          </select>
        </Field>
        <Field id={fid("code")} label="Código" error={errors.code} hint={codeLocked ? <ProtectedHint /> : "Único; se compara sin acentos, mayúsculas ni signos."}>
          <input data-field="code" {...aria(fid("code"), errors.code, true)} className={fieldClass} value={draft.code} readOnly={codeLocked} onChange={(e) => set("code", e.target.value)} />
        </Field>
        <Field id={fid("unitKind")} label="Tipo (opcional)" error={errors.unitKind}>
          <select data-field="unitKind" {...aria(fid("unitKind"), errors.unitKind)} className={fieldClass} value={draft.unitKind} onChange={(e) => set("unitKind", e.target.value as Draft["unitKind"])}>
            <option value="">Sin indicar</option><option value="habitacion">Habitación</option><option value="vivienda_completa">Vivienda completa</option><option value="estudio">Estudio</option>
          </select>
        </Field>
        <Field id={fid("capacity")} label="Capacidad en personas (opcional)" error={errors.capacity}>
          <input data-field="capacity" inputMode="numeric" {...aria(fid("capacity"), errors.capacity)} className={fieldClass} value={draft.capacity} onChange={(e) => set("capacity", e.target.value)} />
        </Field>
        <Field id={fid("areaM2")} label="Superficie en m² (opcional)" error={errors.areaM2}>
          <input data-field="areaM2" inputMode="decimal" {...aria(fid("areaM2"), errors.areaM2)} className={fieldClass} value={draft.areaM2} onChange={(e) => set("areaM2", e.target.value)} />
        </Field>
        <Field id={fid("monthlyRent")} label="Renta orientativa (€/mes)" error={errors.monthlyRent} hint="Hasta dos decimales, con coma o punto. No crea ni cambia contratos.">
          <input data-field="monthlyRent" inputMode="decimal" {...aria(fid("monthlyRent"), errors.monthlyRent, true)} className={fieldClass} value={draft.monthlyRent} onChange={(e) => set("monthlyRent", e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field id={fid("features")} label="Características (separadas por comas)" error={errors.features}>
            <input data-field="features" {...aria(fid("features"), errors.features)} className={fieldClass} value={draft.features} onChange={(e) => set("features", e.target.value)} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field id={fid("statusNote")} label="Nota (opcional)">
            <textarea {...aria(fid("statusNote"))} className={textareaClass} value={draft.statusNote} onChange={(e) => set("statusNote", e.target.value)} />
          </Field>
        </div>
      </div>
      {confirm && <DuplicateConfirm warnings={confirm} onConfirm={() => run(true)} onReview={() => setConfirm(null)} />}
      <div className="flex flex-wrap gap-2">
        <Button type="submit">{roomId ? "Guardar cambios temporales" : "Crear unidad temporal"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
      <p className="text-xs text-muted-foreground">Cambio temporal: se pierde al recargar. Las altas quedan disponibles, sin contratos, cobros ni accesos.</p>
    </form>
  );
}
