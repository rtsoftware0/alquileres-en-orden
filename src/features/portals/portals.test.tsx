import { describe, expect, it, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { useState, type ReactNode } from "react";
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
    // The grant listing inc-1 belongs to ct-ej-0204 (aza-04), but the incident is on aza-01.
    const changed = { ...data, incidents: data.incidents.map((i) => (i.id === "inc-1" ? { ...i, roomId: "aza-01" } : i)) };
    const grants = demoPortalGrants.map((g) => (g.id === "pg-ten-008a" ? { ...g, incidentIds: ["inc-1"] } : g));
    expect(tenantView(changed, c("inquilino", "con-008"), undefined, grants).incidents).toEqual([]);
    expect(portalDetail(changed, c("inquilino", "con-008"), "incidencia", "inc-1")).toBeNull();
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
    wrap(<Harness />);
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
    wrap(<Harness revoked={new Set(["pg-ten-002"])} />);
    const panel = screen.getByRole("heading", { name: /Acceso revocado/ }).closest("section")!;
    expect(within(panel).getByText(/expediente interno se conserva/)).toBeInTheDocument();
    expect(screen.queryByText(/Inventario/)).toBeNull();
  });
  it("changing context invalidates an open revocation confirmation", () => {
    wrap(<Harness onRevokeCurrent={() => {}} />);
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
    wrap(<PortalsPage />);
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
    wrap(<PortalsPage />);
    fireEvent.click(screen.getByRole("button", { name: /Preparar accesos/ }));
    fireEvent.change(screen.getByLabelText("Documento o conversación"), { target: { value: "thr:thr-inc-2" } });
    fireEvent.change(screen.getByLabelText("Destinatario"), { target: { value: "propietario|con-010" } });
    expect(screen.queryByText(/se recibe el presupuesto/)).toBeNull();
    expect(screen.getByText(/relación autorizada con su registro/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Destinatario"), { target: { value: "proveedor|con-012" } });
    expect(screen.getByText(/se recibe el presupuesto/)).toBeInTheDocument();
  });
});

// ---- Settlement sharing (tanda 1) ----
import { act } from "react";
import type { Settlement, State as SState, Version } from "@/features/settlements/types";
import { SettlementProvider, useSettlements } from "@/features/settlements/SettlementContext";
import { initialSharing } from "./data/demo-portal-sharing";
import { PortalShareProvider, usePortalSharing } from "./PortalShareContext";
import { restoreGrant, revokeGrant, shareVersion, sharedSettlementsFor, withdrawShare } from "./settlement-projection";

const ver = (number: number, status: Version["status"], resultCents: number, model: Version["rules"]["model"] = "renta_fija"): Version => ({
  number, status, reason: "motivo interno secreto", actor: "Gestor interno", date: "2026-10-20",
  rules: { model, feeKind: "fijo", feeValue: 0, fixedCents: 90000, priorCents: 0, adjustmentCents: 0, adjustmentReason: "ajuste interno", participants: [{ id: "con-010", name: "Propietaria Casa Azahar · CON-010", basisPoints: 10000 }] },
  source: { contextId: "azahar", month: "2026-10", lines: [], accrualCents: 0, cashCents: 0, costCents: 0, paidCostCents: 0, invalid: [] },
  calculation: { incomeCents: 240000, feeCents: 0, deductibleCents: 0, operatingCents: 0, marginCents: 150000, resultCents, payableCents: Math.max(0, resultCents), shares: [{ id: "con-010", name: "x", cents: Math.max(0, resultCents) }], excluded: [], income: [], deductions: [] },
});
const sst = (settlements: Settlement[]): SState => ({ settlements, payments: [], closings: {}, closingLog: [], history: [], operations: {}, nextId: 1 });
const azahar = (versions: Version[]): Settlement => ({ id: "liq-1", contextId: "azahar", month: "2026-10", versions });
const T = { companyId: "cartera", contactId: "con-010", settlementId: "liq-1" };
const own = c("propietario", "con-010");

describe("settlement sharing rules", () => {
  it("uses the approved version model when Olivo was prepared as agency", () => {
    const v = ver(1, "aprobado", 90000, "agencia");
    v.rules.participants = [{ id: "con-009", name: "Propietaria Casa Olivo", basisPoints: 10000 }];
    v.calculation.shares = [{ id: "con-009", name: "Propietaria Casa Olivo", cents: 90000 }];
    v.source.contextId = "olivo";
    const deps = { data, settlements: sst([{ id: "liq-1", contextId: "olivo", month: "2026-10", versions: [v] }]) };
    const result = shareVersion(initialSharing(), { ...T, contactId: "con-009", version: 1 }, deps);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);
    expect(sharedSettlementsFor(result.state, c("propietario", "con-009"), deps)).toMatchObject([
      { version: 1, model: "agencia", recipientPayableCents: 90000 },
    ]);
    expect(sharedSettlementsFor(result.state, own, deps)).toEqual([]);
    v.rules.model = "propio";
    expect(shareVersion(initialSharing(), { ...T, contactId: "con-009", version: 1 }, deps).ok).toBe(false);
    expect(sharedSettlementsFor(result.state, c("propietario", "con-009"), deps)).toEqual([]);
  });

  it("denies drafts, propio, didactic, empty company, other owners and con-011", () => {
    const deps = { data, settlements: sst([azahar([ver(1, "borrador", 90000)]), { id: "liq-2", contextId: "olivo", month: "2026-10", versions: [ver(1, "aprobado", 1, "propio")] }, { id: "liq-3", contextId: "a16", month: "2026-10", versions: [ver(1, "aprobado", 1)] }]) };
    const s0 = initialSharing();
    expect(shareVersion(s0, { ...T, version: 1 }, deps).ok).toBe(false);
    expect(shareVersion(s0, { ...T, settlementId: "liq-2", contactId: "con-009", version: 1 }, deps).ok).toBe(false);
    expect(shareVersion(s0, { ...T, settlementId: "liq-3", version: 1 }, deps).ok).toBe(false);
    const ok = { data, settlements: sst([azahar([ver(1, "aprobado", 90000)])]) };
    expect(shareVersion(s0, { ...T, companyId: "empresa-vacia", version: 1 }, ok).ok).toBe(false);
    expect(shareVersion(s0, { ...T, contactId: "con-009", version: 1 }, ok).ok).toBe(false);
    expect(shareVersion(s0, { ...T, contactId: "con-011", version: 1 }, ok).ok).toBe(false);
    expect(shareVersion(s0, { ...T, version: 1 }, ok).ok).toBe(true);
    expect(sharedSettlementsFor(s0, c("inquilino", "con-010"), ok)).toEqual([]);
  });

  it("v2 approval does not replace until shared; sharing v2 replaces keeping history; repeat does not duplicate", () => {
    let deps = { data, settlements: sst([azahar([ver(1, "aprobado", 90000)])]) };
    const r1 = shareVersion(initialSharing(), { ...T, version: 1 }, deps); if (!r1.ok) throw new Error();
    const again = shareVersion(r1.state, { ...T, version: 1 }, deps); if (!again.ok) throw new Error();
    expect(again.changed).toBe(false); expect(again.state.shares).toHaveLength(1);
    deps = { data, settlements: sst([azahar([ver(1, "aprobado", 90000), ver(2, "aprobado", 0)])]) };
    expect(sharedSettlementsFor(r1.state, own, deps).map((p) => p.version)).toEqual([1]);
    const r2 = shareVersion(r1.state, { ...T, version: 2 }, deps); if (!r2.ok) throw new Error();
    expect(r2.state.shares).toHaveLength(2);
    expect(r2.state.shares[0]).toMatchObject({ active: false, endedReason: "reemplazada" });
    const p = sharedSettlementsFor(r2.state, own, deps);
    expect(p.map((x) => x.version)).toEqual([2]);
    expect(p[0]!.resultCents).toBe(0); expect(p[0]!.recipientPayableCents).toBe(0);
  });

  it("withdraw and revoke/restore never revive old shares", () => {
    const deps = { data, settlements: sst([azahar([ver(1, "aprobado", 90000)])]) };
    const r = shareVersion(initialSharing(), { ...T, version: 1 }, deps); if (!r.ok) throw new Error();
    expect(sharedSettlementsFor(withdrawShare(r.state, T), own, deps)).toEqual([]);
    const revoked = revokeGrant(r.state, "pg-own-010");
    expect(sharedSettlementsFor(revoked, own, deps)).toEqual([]);
    expect(shareVersion(revoked, { ...T, version: 1 }, deps).ok).toBe(false);
    const restored = restoreGrant(revoked, "pg-own-010");
    expect(sharedSettlementsFor(restored, own, deps)).toEqual([]);
    const again = shareVersion(restored, { ...T, version: 1 }, deps); if (!again.ok) throw new Error();
    expect(sharedSettlementsFor(again.state, own, deps)).toHaveLength(1);
  });

  it("projection is minimal with generic labels", () => {
    const deps = { data, settlements: sst([azahar([ver(1, "aprobado", 90000)])]) };
    const r = shareVersion(initialSharing(), { ...T, version: 1 }, deps); if (!r.ok) throw new Error();
    const [p] = sharedSettlementsFor(r.state, own, deps);
    expect(p!.lines.map((l) => l.label)).toEqual(["Obligación fija", "Saldo anterior", "Ajuste"]);
    expect(p).toMatchObject({ propertyName: "Casa Azahar", month: "2026-10", versionDate: "2026-10-20", recipientPayableCents: 90000 });
    const json = JSON.stringify(p);
    for (const t of ["interno", "Gestor", "marginCents", "150000", "240000", "payments", "ct-ej-", "con-0"]) expect(json).not.toContain(t);
  });

  it("settlement scenario reset clears shares and revocations", () => {
    let api!: ReturnType<typeof usePortalSharing>; let set!: ReturnType<typeof useSettlements>;
    function Probe() { api = usePortalSharing(); set = useSettlements(); return null; }
    render(<SettlementProvider><PortalShareProvider><Probe /></PortalShareProvider></SettlementProvider>);
    act(() => set.setState(sst([azahar([ver(1, "aprobado", 90000)])])));
    act(() => { api.share({ ...T, version: 1 }); });
    act(() => api.revoke("pg-ten-001"));
    expect(api.listFor(own)).toHaveLength(1); expect(api.state.revokedGrants).toEqual(["pg-ten-001"]);
    act(() => set.reset());
    expect(api.state.shares).toEqual([]); expect(api.state.revokedGrants).toEqual([]);
  });
});

// ---- Settlement sharing UI (tanda 2) ----

function wrap(ui: ReactNode) {
  return render(<SettlementProvider><PortalShareProvider>{ui}</PortalShareProvider></SettlementProvider>);
}

let uiApi!: ReturnType<typeof usePortalSharing>;
let uiSet!: ReturnType<typeof useSettlements>;
function UiProbe() { uiApi = usePortalSharing(); uiSet = useSettlements(); return null; }

function OwnerHarness({ initial = "con-010" }: { initial?: string }) {
  const [ctx, setCtx] = useState<PortalContext>(c("propietario", initial));
  const s = usePortalSharing();
  return <PortalPreview ctx={ctx} setCtx={setCtx} revoked={s.revoked} onExit={() => {}} onRestore={() => {}} />;
}

function Toggle() {
  const [show, setShow] = useState(true);
  return <><button type="button" onClick={() => setShow((x) => !x)}>alternar página</button>{show && <PortalsPage />}</>;
}

const seed = (versions: Version[]) => act(() => uiSet.setState(sst([azahar(versions)])));
const openAccess = () => fireEvent.click(screen.getByRole("button", { name: /Preparar accesos/ }));
const pick = (key: string, contactId: string) => {
  fireEvent.change(screen.getByLabelText("Liquidación y versión"), { target: { value: key } });
  fireEvent.change(screen.getByLabelText("Destinatario de liquidación"), { target: { value: contactId } });
};
const previewRegion = () => screen.queryByRole("region", { name: "Vista previa de liquidación compartida" });

describe("settlement sharing UI", () => {
  it("shows an explanatory empty state without approved versions", () => {
    wrap(<><UiProbe /><PortalsPage /></>);
    openAccess();
    expect(screen.getByText(/No hay versiones aprobadas/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Liquidación y versión")).toBeNull();
  });

  it("preview does not share; only confirmation changes visibility", () => {
    wrap(<><UiProbe /><PortalsPage /></>);
    seed([ver(1, "aprobado", 90000)]);
    openAccess();
    pick("liq-1|1", "con-010");
    fireEvent.click(screen.getByRole("button", { name: "Ver vista previa de liquidación" }));
    const region = previewRegion()!;
    expect(within(region).getByText(/CON-010/)).toBeInTheDocument();
    expect(within(region).getAllByText(/Casa Azahar/).length).toBeGreaterThan(0);
    expect(within(region).getAllByText(/versión 1/i).length).toBeGreaterThan(0);
    expect(uiApi.state.shares).toEqual([]);
    expect(uiApi.listFor(own)).toEqual([]);
    fireEvent.click(within(region).getByRole("button", { name: "Confirmar compartición" }));
    expect(uiApi.listFor(own).map((p) => p.version)).toEqual([1]);
    expect(screen.getByRole("status")).toHaveTextContent(/Versión 1 compartida/);
    expect(previewRegion()).toBeNull();
  });

  it("changing the selection invalidates the preview", () => {
    wrap(<><UiProbe /><PortalsPage /></>);
    seed([ver(1, "aprobado", 90000)]);
    openAccess();
    pick("liq-1|1", "con-010");
    fireEvent.click(screen.getByRole("button", { name: "Ver vista previa de liquidación" }));
    expect(previewRegion()).not.toBeNull();
    fireEvent.change(screen.getByLabelText("Destinatario de liquidación"), { target: { value: "con-009" } });
    expect(previewRegion()).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Ver vista previa de liquidación" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/propietario actual/);
    expect(previewRegion()).toBeNull();
    expect(uiApi.state.shares).toEqual([]);
  });

  it("revoking access invalidates an open preview", () => {
    wrap(<><UiProbe /><PortalsPage /></>);
    seed([ver(1, "aprobado", 90000)]);
    openAccess();
    pick("liq-1|1", "con-010");
    fireEvent.click(screen.getByRole("button", { name: "Ver vista previa de liquidación" }));
    act(() => uiApi.revoke("pg-own-010"));
    expect(previewRegion()).toBeNull();
  });

  it("correct owner sees the record; another owner does not; detail is minimal", () => {
    wrap(<><UiProbe /><OwnerHarness /></>);
    seed([ver(1, "aprobado", 90000)]);
    act(() => { uiApi.share({ ...T, version: 1 }); });
    fireEvent.click(screen.getByRole("button", { name: "Liquidaciones" }));
    fireEvent.click(screen.getByRole("button", { name: /Ver liquidación Casa Azahar/ }));
    const detail = screen.getByRole("region", { name: "Detalle de la liquidación" });
    expect(within(detail).getByText("Obligación fija")).toBeInTheDocument();
    expect(within(detail).getByText("Resultado firmado")).toBeInTheDocument();
    expect(within(detail).getByText("Importe correspondiente")).toBeInTheDocument();
    expect(within(detail).queryByText(/Ingresos incluidos/)).toBeNull();
    for (const t of [/motivo interno/, /Gestor interno/, /ajuste interno/, /Margen/i]) expect(within(detail).queryByText(t)).toBeNull();
    fireEvent.change(screen.getByLabelText("Contacto"), { target: { value: "con-009" } });
    expect(screen.queryByRole("region", { name: "Detalle de la liquidación" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Liquidaciones" }));
    expect(screen.getByText(/No hay liquidaciones compartidas contigo/)).toBeInTheDocument();
  });

  it("shows zero as a value for the recipient amount", () => {
    wrap(<><UiProbe /><OwnerHarness /></>);
    seed([ver(1, "aprobado", 0)]);
    act(() => { uiApi.share({ ...T, version: 1 }); });
    fireEvent.click(screen.getByRole("button", { name: "Liquidaciones" }));
    fireEvent.click(screen.getByRole("button", { name: /Ver liquidación Casa Azahar/ }));
    const detail = screen.getByRole("region", { name: "Detalle de la liquidación" });
    const row = within(detail).getByText("Importe correspondiente").closest("tr")!;
    expect(row.textContent).toMatch(/0,00/);
  });

  it("withdrawing or revoking closes an open detail", () => {
    wrap(<><UiProbe /><OwnerHarness /></>);
    seed([ver(1, "aprobado", 90000)]);
    act(() => { uiApi.share({ ...T, version: 1 }); });
    fireEvent.click(screen.getByRole("button", { name: "Liquidaciones" }));
    fireEvent.click(screen.getByRole("button", { name: /Ver liquidación Casa Azahar/ }));
    act(() => uiApi.withdraw(T));
    expect(screen.queryByRole("region", { name: "Detalle de la liquidación" })).toBeNull();
    act(() => { uiApi.share({ ...T, version: 1 }); });
    fireEvent.click(screen.getByRole("button", { name: /Ver liquidación Casa Azahar/ }));
    act(() => uiApi.revoke("pg-own-010"));
    expect(screen.queryByRole("region", { name: "Detalle de la liquidación" })).toBeNull();
  });

  it("approving v2 keeps v1 visible until v2 is shared; sharing v2 replaces with history", () => {
    wrap(<><UiProbe /><PortalsPage /></>);
    seed([ver(1, "aprobado", 90000)]);
    openAccess();
    pick("liq-1|1", "con-010");
    fireEvent.click(screen.getByRole("button", { name: "Ver vista previa de liquidación" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar compartición" }));
    seed([ver(1, "aprobado", 90000), ver(2, "aprobado", 0)]);
    act(() => { uiApi.share({ ...T, version: 1 }); });
    expect(uiApi.listFor(own).map((p) => p.version)).toEqual([1]);
    pick("liq-1|1", "con-010");
    fireEvent.click(screen.getByRole("button", { name: "Ver vista previa de liquidación" }));
    expect(screen.getByRole("button", { name: "Ya compartida" })).toBeDisabled();
    pick("liq-1|2", "con-010");
    fireEvent.click(screen.getByRole("button", { name: "Ver vista previa de liquidación" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar compartición" }));
    expect(uiApi.listFor(own).map((p) => p.version)).toEqual([2]);
    expect(uiApi.state.shares).toHaveLength(2);
    const list = screen.getByRole("list", { name: "Comparticiones" });
    expect(within(list).getByText("Sustituida")).toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "Historial de compartición" })).getByText(/Sustituida por nueva versión/)).toBeInTheDocument();
  });

  it("explicit withdrawal, revoke and restore never revive a share", () => {
    wrap(<><UiProbe /><PortalsPage /></>);
    seed([ver(1, "aprobado", 90000)]);
    openAccess();
    pick("liq-1|1", "con-010");
    fireEvent.click(screen.getByRole("button", { name: "Ver vista previa de liquidación" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar compartición" }));
    fireEvent.click(screen.getByRole("button", { name: "Retirar compartición versión 1" }));
    expect(uiApi.listFor(own)).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Confirmar retirada" }));
    expect(uiApi.listFor(own)).toEqual([]);
    act(() => { uiApi.share({ ...T, version: 1 }); });
    fireEvent.change(screen.getByLabelText("Acceso de ejemplo"), { target: { value: "propietario|con-010" } });
    fireEvent.click(screen.getByRole("button", { name: "Vista previa de revocación" }));
    fireEvent.click(screen.getByRole("button", { name: "Aplicar en la demostración" }));
    expect(uiApi.state.revokedGrants).toEqual(["pg-own-010"]);
    expect(uiApi.listFor(own)).toEqual([]);
    fireEvent.click(screen.getAllByRole("button", { name: "Restaurar demo" })[0]!);
    expect(uiApi.state.revokedGrants).toEqual([]);
    expect(uiApi.listFor(own)).toEqual([]);
    expect(uiApi.state.log.map((e) => e.action)).toEqual(["compartir", "retirar", "compartir", "revocar_acceso", "restaurar_acceso"]);
  });

  it("revocations persist when leaving and returning to the page", () => {
    wrap(<><UiProbe /><Toggle /></>);
    openAccess();
    fireEvent.change(screen.getByLabelText("Acceso de ejemplo"), { target: { value: "inquilino|con-002" } });
    fireEvent.click(screen.getByRole("button", { name: "Vista previa de revocación" }));
    fireEvent.click(screen.getByRole("button", { name: "Aplicar en la demostración" }));
    fireEvent.click(screen.getByRole("button", { name: "alternar página" }));
    fireEvent.click(screen.getByRole("button", { name: "alternar página" }));
    expect(uiApi.state.revokedGrants).toEqual(["pg-ten-002"]);
    openAccess();
    fireEvent.change(screen.getByLabelText("Acceso de ejemplo"), { target: { value: "inquilino|con-002" } });
    expect(screen.getByRole("button", { name: "Ya revocado" })).toBeDisabled();
  });

  it("settlement reset clears shares and empties the owner list", () => {
    wrap(<><UiProbe /><OwnerHarness /></>);
    seed([ver(1, "aprobado", 90000)]);
    act(() => { uiApi.share({ ...T, version: 1 }); });
    fireEvent.click(screen.getByRole("button", { name: "Liquidaciones" }));
    expect(screen.getByRole("button", { name: /Ver liquidación Casa Azahar/ })).toBeInTheDocument();
    act(() => uiSet.reset());
    fireEvent.click(screen.getByRole("button", { name: "Liquidaciones" }));
    expect(screen.getByText(/No hay liquidaciones compartidas contigo/)).toBeInTheDocument();
    expect(uiApi.state.shares).toEqual([]);
  });
});
