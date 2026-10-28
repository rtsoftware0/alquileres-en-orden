import { describe, expect, it, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { useState } from "react";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import { totalPending } from "@/features/portfolio/selectors";
import { ownerView, portalDetail, providerView, selectableContacts, tenantView, validRelations, validateProviderDraft, visibleDocuments, type PortalContext } from "./selectors";
import { PortalPreview } from "./PortalsPage";

afterEach(cleanup);
const c = (profile: PortalContext["profile"], contactId: string, companyId = "cartera"): PortalContext => ({ companyId, profile, contactId });

describe("owner portal", () => {
  it("con-009 sees only Casa Olivo with derived occupancy and no tenant identity", () => {
    const v = ownerView(data, c("propietario", "con-009"));
    expect(v.properties.map((p) => p.id)).toEqual(["casa-olivo"]);
    expect(v.properties[0]!.occupancy).toMatchObject({ occupied: 4, rentable: 6 });
    const json = JSON.stringify(v);
    for (const t of ["Lucía", "Marcos", "example.invalid", "ct-ej-", "pendingCents"]) expect(json).not.toContain(t);
    expect(v.incidents.map((i) => i.id)).toEqual(["inc-3"]);
    expect(v.documents).toEqual([]);
  });
  it("con-010 sees Azahar; con-011 (lessor) is not an owner", () => {
    expect(ownerView(data, c("propietario", "con-010")).properties.map((p) => p.id)).toEqual(["casa-azahar"]);
    expect(ownerView(data, c("propietario", "con-011")).properties).toEqual([]);
    expect(validRelations(data, "con-011", "propietario")).toEqual([]);
  });
});

describe("tenant portal", () => {
  it("con-002 sees doc-3 and 350 € debt, never internal doc-2", () => {
    const v = tenantView(data, c("inquilino", "con-002"));
    expect(v.documents.map((d) => d.id)).toEqual(["doc-3"]);
    expect(v.current[0]!.pendingCents).toBe(35000);
    expect(portalDetail(data, c("inquilino", "con-002"), "documento", "doc-2")).toBeNull();
  });
  it("con-003 never sees CT-EJ-0204 where it is only guarantor", () => {
    const v = tenantView(data, c("inquilino", "con-003"));
    expect([...v.current, ...v.history].map((a) => a.contract.id)).toEqual(["ct-ej-0103"]);
    expect(portalDetail(data, c("inquilino", "con-003"), "contrato", "ct-ej-0204")).toBeNull();
    expect(validRelations(data, "con-003", "inquilino").map((r) => r.id)).toEqual(["ct-ej-0103"]);
  });
  it("con-008 keeps own historic contract", () => {
    expect(tenantView(data, c("inquilino", "con-008")).history.map((a) => a.contract.id)).toEqual(["ct-ej-0098"]);
  });
});

describe("provider portal", () => {
  it("con-012 sees inc-1/inc-2, doc-1 and zero internal notes", () => {
    const v = providerView(data, c("proveedor", "con-012"));
    expect(v.assignments.map((a) => a.id)).toEqual(["inc-1", "inc-2"]);
    expect(v.documents.map((d) => d.id)).toEqual(["doc-1"]);
    expect(JSON.stringify(v)).not.toMatch(/Nota interna/);
    expect(portalDetail(data, c("proveedor", "con-012"), "incidencia", "inc-3")).toBeNull();
  });
  it("con-015 has no assignments", () => {
    const v = providerView(data, c("proveedor", "con-015"));
    expect(v.assignments).toEqual([]);
    expect(v.documents).toEqual([]);
  });
  it("validates budget draft", () => {
    expect(validateProviderDraft({ incidentId: "inc-3", kind: "presupuesto", amount: "0", text: "corto" }, ["inc-1"])).toEqual(
      expect.objectContaining({ incidentId: expect.any(String), amount: expect.any(String), text: expect.any(String) }),
    );
    expect(validateProviderDraft({ incidentId: "inc-1", kind: "presupuesto", amount: "95,50", text: "Reparación de pared" }, ["inc-1"])).toEqual({});
  });
});

describe("contexts and revocation", () => {
  it("empty didactic company shows nothing", () => {
    expect(selectableContacts(data, "empresa-vacia", "inquilino")).toEqual([]);
    expect(visibleDocuments(data, c("inquilino", "con-002", "empresa-vacia"))).toEqual([]);
    expect(tenantView(data, c("inquilino", "con-002", "empresa-vacia")).current).toEqual([]);
  });
  it("revocation hides content but keeps source data", () => {
    const revoked = new Set(["pg-ten-002"]);
    expect(tenantView(data, c("inquilino", "con-002"), revoked).current).toEqual([]);
    expect(portalDetail(data, c("inquilino", "con-002"), "documento", "doc-3", revoked)).toBeNull();
    expect(data.documents.find((d) => d.id === "doc-3")!.recipientIds).toEqual(["con-002"]);
    expect(totalPending(data)).toBe(140000);
  });
});

function Harness({ revoked = new Set<string>() }: { revoked?: Set<string> }) {
  const [ctx, setCtx] = useState<PortalContext>(c("inquilino", "con-002"));
  return <PortalPreview ctx={ctx} setCtx={setCtx} revoked={revoked} onExit={() => {}} onRestore={() => {}} />;
}

describe("portal UI", () => {
  it("changing contact clears open detail; empty company shows empty state", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Documentos" }));
    fireEvent.click(screen.getByRole("button", { name: /Ver documento Inventario/ }));
    expect(screen.getByRole("region", { name: "Detalle del documento" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Contacto"), { target: { value: "con-001" } });
    expect(screen.queryByRole("region", { name: "Detalle del documento" })).toBeNull();
    fireEvent.change(screen.getByLabelText("Empresa"), { target: { value: "empresa-vacia" } });
    expect(screen.getByText(/no tiene contactos con relaciones/)).toBeInTheDocument();
    expect(screen.queryByText(/CT-EJ-01/)).toBeNull();
  });
  it("revoked context is blocked", () => {
    render(<Harness revoked={new Set(["pg-ten-002"])} />);
    const panel = screen.getByRole("heading", { name: /Acceso revocado/ }).closest("section")!;
    expect(within(panel).getByText(/expediente interno se conserva/)).toBeInTheDocument();
    expect(screen.queryByText(/Inventario/)).toBeNull();
  });
});
