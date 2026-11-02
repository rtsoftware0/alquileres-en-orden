// Root memory-only catalog overlay. Mounted outside Planning/Settlement
// providers so it survives navigation and the settlements reset. A reload
// loses it (no storage, no network); the browser warns while it is not empty.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { demoPortfolio } from "@/features/portfolio/data/demo-data";
import { Button } from "@/components/ui/button";
import type {
  CatalogDataset, CatalogKind, CatalogLabels, CatalogOverlay, CatalogResult, ContactPatch, PropertyPatch, RoomPatch,
} from "./types";
import {
  addContact, addProperty, addRoom, catalogLabels, editContact, editProperty, editRoom, emptyOverlay,
  isAddedRecord, isOverlayEmpty, mergeCatalog, protectedFields, requiredRoles, type NewContact, type NewProperty, type NewRoom,
} from "./engine";

interface CatalogApi {
  overlay: CatalogOverlay;
  data: CatalogDataset;
  labels: CatalogLabels;
  isEmpty: boolean;
  isAdded: (kind: CatalogKind, id: string) => boolean;
  isEdited: (kind: CatalogKind, id: string) => boolean;
  protectedFields: (kind: CatalogKind, id: string) => string[];
  requiredRoles: (contactId: string) => ReturnType<typeof requiredRoles>;
  addContact: (input: NewContact) => CatalogResult;
  addProperty: (input: NewProperty) => CatalogResult;
  addRoom: (input: NewRoom) => CatalogResult;
  editContact: (id: string, p: ContactPatch) => CatalogResult;
  editProperty: (id: string, p: PropertyPatch) => CatalogResult;
  editRoom: (id: string, p: RoomPatch) => CatalogResult;
  reset: () => void;
}

const Context = createContext<CatalogApi | null>(null);
const base = demoPortfolio;

function buildApi(overlay: CatalogOverlay, setOverlay: (o: CatalogOverlay) => void): CatalogApi {
  const data = mergeCatalog(base, overlay);
  const commit = (r: CatalogResult) => { if (r.ok) setOverlay(r.overlay); return r; };
  const editsOf = (kind: CatalogKind) => (kind === "contact" ? overlay.edits.contacts : kind === "property" ? overlay.edits.properties : overlay.edits.rooms);
  return {
    overlay,
    data,
    labels: catalogLabels(data),
    isEmpty: isOverlayEmpty(overlay),
    isAdded: (kind, id) => isAddedRecord(overlay, kind, id),
    isEdited: (kind, id) => id in editsOf(kind),
    protectedFields: (kind, id) => protectedFields(base, kind, id),
    requiredRoles: (id) => requiredRoles(data, id),
    addContact: (i) => commit(addContact(base, overlay, i)),
    addProperty: (i) => commit(addProperty(base, overlay, i)),
    addRoom: (i) => commit(addRoom(base, overlay, i)),
    editContact: (id, p) => commit(editContact(base, overlay, id, p)),
    editProperty: (id, p) => commit(editProperty(base, overlay, id, p)),
    editRoom: (id, p) => commit(editRoom(base, overlay, id, p)),
    reset: () => setOverlay(emptyOverlay()),
  };
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [overlay, setOverlay] = useState<CatalogOverlay>(emptyOverlay);
  const api = useMemo(() => buildApi(overlay, setOverlay), [overlay]);
  useEffect(() => {
    if (api.isEmpty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [api.isEmpty]);
  return <Context.Provider value={api}>{children}</Context.Provider>;
}

const fallback = buildApi(emptyOverlay(), () => {});

/** Catalog API; outside the provider (isolated tests) it exposes the untouched base view. */
export function useCatalog(): CatalogApi {
  return useContext(Context) ?? fallback;
}
export const useCatalogData = () => useCatalog().data;
export const useCatalogLabels = () => useCatalog().labels;

/** Persistent notice for catalog screens with an explicit reset. */
export function CatalogNotice() {
  const { isEmpty, reset } = useCatalog();
  return (
    <div className="mb-4 flex flex-col gap-2 rounded-md border border-border bg-muted/50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between" role="note">
      <p className="text-muted-foreground">
        {isEmpty
          ? "Catálogo de ejemplo sin cambios. Las altas y ediciones serán temporales: se pierden al recargar la página."
          : "Hay altas o ediciones temporales en el catálogo. Se pierden al recargar la página y no cambian contratos, dinero ni accesos."}
      </p>
      <Button variant="outline" size="sm" onClick={reset} disabled={isEmpty} className="shrink-0">
        <RotateCcw className="h-4 w-4" aria-hidden="true" /> Restablecer catálogo de ejemplo
      </Button>
    </div>
  );
}

/** Small origin label for a record. */
export function CatalogOriginBadge({ kind, id }: { kind: CatalogKind; id: string }) {
  const { isAdded, isEdited } = useCatalog();
  const label = isAdded(kind, id) ? "Alta temporal" : isEdited(kind, id) ? "Editado temporalmente" : null;
  if (!label) return null;
  return <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{label}</span>;
}
