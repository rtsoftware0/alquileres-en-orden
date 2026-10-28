import { describe, expect, it, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { useState } from "react";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import { totalPending } from "@/features/portfolio/selectors";
import {
  ownerView, parseEuroToCents, portalDetail, providerView, selectableContacts, tenantView, validRelations,
  validateProviderDraft, visibleDocuments, visibleThreadMessages, type PortalContext,
} from "./selectors";
import { PortalPreview, PortalsPage } from "./PortalsPage";
import { demoPortalGrants } from "./data/demo-portal-access";

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

describe("tenant incident authorization", () => {
  it("loses inc-2 when ct-ej-0101 no longer belongs to con-001", () => {
    const changed = { ...data, contracts: data.contracts.map((x) => (x.id === "ct-ej-0101" ? { ...x, tenantIds: ["con-002"] } : x)) };
    expect(tenantView(changed, c("inquilino", "con-001")).incidents).toEqual([]);
    expect(portalDetail(changed, c("inquilino", "con-001"), "incidencia", "inc-2")).toBeNull();
  });
  it("hides an incident of another room in the same property", () => {
    const changed = { ...data, incidents: data.incidents.map((i) => (i.id === "inc-2" ? { ...i, roomId: "oli-02" } : i)) };
    expect(tenantView(changed, c("inquilino", "con-001")).incidents).toEqual([]);
    expect(portalDetail(changed, c("inquilino", "con-001"), "incidencia", "inc-2")).toBeNull();
  });
  it("keeps a historic incident authorized by its own historic contract", () => {
    const changed = { ...data, incidents: data.incidents.map((i) => (i.id === "inc-1" ? { ...i, roomId: "aza-04" } : i)) };
    const grants = demoPortalGrants.map((g) => (g.id === "pg-ten-008b" ? { ...g, incidentIds: ["inc-1"] } : g));
    expect(tenantView(changed, c("inquilino", "con-008"), undefined, grants).incidents.map((i) => i.id)).toEqual(["inc-1"]);
  });
  it("a different contract without grant gives no access", () => {
    // The grant listing inc-1 belongs to ct-ej-0204, but the incident is on aza-04 (ct-ej-0098's room).
    const changed = { ...data, incidents: data.incidents.map((i) => (i.id === "inc-1" ? { ...i, roomId: "aza-04" } : i)) };
    const grants = demoPortalGrants.map((g) => (g.id === "pg-ten-008a" ? { ...g, incidentIds: ["inc-1"] } : g));
    expect(tenantView(changed, c("inquilino", "con-008"), undefined, grants).incidents).toEqual([]);
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

function Harness({ revoked = new Set<string>(), onRevokeCurrent }: { revoked?: Set<string>; onRevokeCurrent?: () => void }) {
  const [ctx, setCtx] = useState<PortalContext>(c("inquilino", "con-002"));
  const props = { ctx, setCtx, revoked, onExit: () => {}, onRestore: () => {}, ...(onRevokeCurrent ? { onRevokeCurrent } : {}) };
  return <PortalPreview {...props} />;
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
  it("changing context invalidates an open revocation confirmation", () => {
    render(<Harness onRevokeCurrent={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Simular revocación de este acceso" }));
    const region = screen.getByRole("region", { name: "Vista previa de revocación" });
    expect(within(region).getByText(/CON-002/)).toBeInTheDocument();
    expect(within(region).getByText(/Inquilino/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Contacto"), { target: { value: "con-001" } });
    expect(screen.queryByRole("region", { name: "Vista previa de revocación" })).toBeNull();
  });
});

describe("amount parsing", () => {
  it("accepts dot or comma decimals up to 2 digits and Spanish thousands", () => {
    expect(parseEuroToCents("95.50")).toBe(9550);
    expect(parseEuroToCents("95,50")).toBe(9550);
    expect(parseEuroToCents("1.250,50")).toBe(125050);
    expect(parseEuroToCents("120")).toBe(12000);
  });
  it("rejects ambiguous, malformed and non-finite amounts", () => {
    expect(parseEuroToCents("1.25.3")).toBeNull();
    expect(parseEuroToCents("95,5,0")).toBeNull();
    expect(parseEuroToCents("abc")).toBeNull();
    expect(parseEuroToCents("9".repeat(330))).toBeNull();
  });
});

describe("dataset revalidation", () => {
  it("a stale grant does not survive a dataset change", () => {
    const copy = { ...data, incidents: data.incidents.map((i) => (i.id === "inc-2" ? { ...i, providerId: "con-015" } : i)) };
    expect(visibleDocuments(copy, c("proveedor", "con-012")).map((d) => d.id)).toEqual([]);
    expect(providerView(copy, c("proveedor", "con-012")).assignments.map((a) => a.id)).toEqual(["inc-1"]);
    expect(data.incidents.find((i) => i.id === "inc-2")!.providerId).toBe("con-012");
  });
});

describe("thread visibility", () => {
  const thr2 = data.threads.find((t) => t.id === "thr-inc-2")!;
  it("shared messages require an authorized relation, not just shared visibility", () => {
    expect(visibleThreadMessages(data, c("propietario", "con-010"), thr2)).toBeNull();
    expect(visibleThreadMessages(data, c("proveedor", "con-012"), thr2)!.map((m) => m.id)).toEqual(["m-5"]);
    expect(visibleThreadMessages(data, c("inquilino", "con-001"), thr2)!.map((m) => m.id)).toEqual(["m-5"]);
  });
  it("revocation hides threads too", () => {
    const thr = data.threads.find((t) => t.id === "thr-ct-0102")!;
    expect(visibleThreadMessages(data, c("inquilino", "con-002"), thr, new Set(["pg-ten-002"]))).toBeNull();
  });
});

describe("external incident projection", () => {
  it("owner and tenant incidents expose minimal fields only", () => {
    for (const incidents of [ownerView(data, c("propietario", "con-009")).incidents, tenantView(data, c("inquilino", "con-001")).incidents]) {
      expect(incidents.length).toBeGreaterThan(0);
      const json = JSON.stringify(incidents);
      for (const k of ["internalNotes", "linkedExpenseId", "assigneeName", "providerId"]) expect(json).not.toContain(k);
    }
  });
});

describe("access panel UI", () => {
  it("doc-3 shows content to con-002, hides it to con-001, and revocation hides it until restore", () => {
    render(<PortalsPage />);
    fireEvent.click(screen.getByRole("button", { name: /Preparar accesos/ }));
    fireEvent.change(screen.getByLabelText("Documento o conversación"), { target: { value: "doc:doc-3" } });
    fireEvent.change(screen.getByLabelText("Destinatario"), { target: { value: "inquilino|con-002" } });
    expect(screen.getByText(/Lista ficticia del mobiliario/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Destinatario"), { target: { value: "inquilino|con-001" } });
    expect(screen.queryByText(/Lista ficticia del mobiliario/)).toBeNull();
    expect(screen.getByText(/Hoy no aparece en el portal de este contacto/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Destinatario"), { target: { value: "inquilino|con-002" } });
    fireEvent.change(screen.getByLabelText("Acceso de ejemplo"), { target: { value: "inquilino|con-002" } });
    fireEvent.click(screen.getByRole("button", { name: "Vista previa de revocación" }));
    fireEvent.click(screen.getByRole("button", { name: "Aplicar en la demostración" }));
    expect(screen.queryByText(/Lista ficticia del mobiliario/)).toBeNull();
    expect(screen.getByText(/revocado en esta demostración/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Restaurar demo" }));
    expect(screen.getByText(/Lista ficticia del mobiliario/)).toBeInTheDocument();
  });
  it("thr-inc-2 messages hidden for unrelated owner, visible for assigned provider", () => {
    render(<PortalsPage />);
    fireEvent.click(screen.getByRole("button", { name: /Preparar accesos/ }));
    fireEvent.change(screen.getByLabelText("Documento o conversación"), { target: { value: "thr:thr-inc-2" } });
    fireEvent.change(screen.getByLabelText("Destinatario"), { target: { value: "propietario|con-010" } });
    expect(screen.queryByText(/se recibe el presupuesto/)).toBeNull();
    expect(screen.getByText(/relación autorizada con su registro/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Destinatario"), { target: { value: "proveedor|con-012" } });
    expect(screen.getByText(/se recibe el presupuesto/)).toBeInTheDocument();
  });
});
