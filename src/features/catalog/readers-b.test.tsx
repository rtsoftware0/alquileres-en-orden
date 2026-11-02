import type { ReactNode } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CatalogProvider, useCatalog } from "./CatalogContext";
import { IncidentsPage, validateIncidentsSearch } from "@/features/incidents/IncidentsPage";
import { DocsPage, validateDocsSearch } from "@/features/docs/DocsPage";
import { SettlementListPage } from "@/features/settlements/ListPage";
import { SettlementProvider, useSettlements } from "@/features/settlements/SettlementContext";
import { initialSettlements } from "@/features/settlements/engine";
import { PortalShareProvider } from "@/features/portals/PortalShareContext";
import { OwnerPortal, TenantPortal } from "@/features/portals/PortalViews";
import { ownerView, selectableContacts, type PortalContext } from "@/features/portals/selectors";
import { demoPortfolio } from "@/features/portfolio/data/demo-data";
import { pendingCents } from "@/features/money/selectors";

// Router primitives are replaced so these screen tests need no router or browser.
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, className }: { children: ReactNode; className?: string }) => <a href="#" className={className}>{children}</a>,
  useNavigate: () => () => {},
}));
afterEach(cleanup);

type Api = ReturnType<typeof useCatalog>;
const probe: { api: Api | null; settlements: ReturnType<typeof useSettlements>["state"] | null } = { api: null, settlements: null };
function Probe() { probe.api = useCatalog(); return null; }
function SettlementProbe() { probe.settlements = useSettlements().state; return null; }
const api = () => probe.api!;
const wrap = (ui: ReactNode) =>
  render(<CatalogProvider><Probe /><SettlementProvider><SettlementProbe /><PortalShareProvider>{ui}</PortalShareProvider></SettlementProvider></CatalogProvider>);
const addNewProperty = () => {
  let id = "";
  act(() => { const r = api().addProperty({ code: "NUE", name: "Casa Nueva", address: "Calle Ficticia 9", ownerId: "con-009" }); if (r.ok) id = r.id; });
  expect(id).not.toBe("");
  return id;
};
const owner009: PortalContext = { companyId: "cartera", profile: "propietario", contactId: "con-009" };
const tenant001: PortalContext = { companyId: "cartera", profile: "inquilino", contactId: "con-001" };

describe("incidents and documents read current catalog names", () => {
  it("search validation keeps syntactically valid new or unknown IDs", () => {
    expect(validateIncidentsSearch({ inmueble: "cat-inm-1", unidad: "cat-hab-9" })).toMatchObject({ inmueble: "cat-inm-1", unidad: "cat-hab-9" });
    expect(validateDocsSearch({ inmueble: "desconocido-1" }).inmueble).toBe("desconocido-1");
    expect(validateIncidentsSearch({ inmueble: "<script>" }).inmueble).toBeUndefined();
  });

  it("renaming Casa Olivo updates the incident list and filter", () => {
    wrap(<IncidentsPage search={{}} />);
    act(() => { api().editProperty("casa-olivo", { name: "Olivo Renombrada" }); });
    expect(screen.getAllByText(/Olivo Renombrada/).length).toBeGreaterThan(1);
    expect(screen.queryByRole("option", { name: "Casa Olivo" })).toBeNull();
  });

  it("a new property filter shows zero incidents without the unknown notice", () => {
    const { rerender } = wrap(<IncidentsPage search={{}} />);
    const id = addNewProperty();
    rerender(<CatalogProvider><Probe /><IncidentsPage search={{ inmueble: id }} /></CatalogProvider>);
    // rerender replaces the provider; check against a fresh provider with the same add.
    cleanup();
    wrap(<IncidentsPage search={{ inmueble: "cat-inm-1" }} />);
    expect(screen.getByRole("status")).toHaveTextContent(/no existe/);
    const created = addNewProperty();
    expect(created).toBe("cat-inm-1");
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByText(/Mostrando/)).toHaveTextContent(/Mostrando 0 de 3/);
  });

  it("an unknown property filter shows a notice and no results (never the whole portfolio)", () => {
    wrap(<><IncidentsPage search={{ inmueble: "inm-inexistente" }} /><DocsPage search={{ inmueble: "inm-inexistente" }} /></>);
    expect(screen.getAllByRole("status")).toHaveLength(2);
    expect(screen.getByText(/de 3 incidencias/)).toHaveTextContent(/Mostrando 0 de 3/);
    expect(screen.getByText(/de 5 documentos/)).toHaveTextContent(/Mostrando 0 de 5/);
  });

  it("after reset an added property ID becomes unknown again", () => {
    wrap(<IncidentsPage search={{ inmueble: "cat-inm-1" }} />);
    addNewProperty();
    expect(screen.queryByRole("status")).toBeNull();
    act(() => { api().reset(); });
    expect(screen.getByRole("status")).toHaveTextContent(/no existe/);
  });
});

describe("settlements: names change, calculations and snapshots do not", () => {
  it("renamed owner and property appear in filters while settlement state stays base", () => {
    wrap(<SettlementListPage />);
    const before = JSON.stringify(probe.settlements);
    act(() => {
      api().editContact("con-009", { name: "Olivo Renombrada S.L." });
      api().editProperty("casa-olivo", { name: "Olivo Renombrada" });
    });
    expect(screen.getByRole("option", { name: "Olivo Renombrada S.L. · CON-009" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Olivo Renombrada" })).toBeInTheDocument();
    expect(JSON.stringify(probe.settlements)).toBe(before);
    expect(probe.settlements).toEqual(initialSettlements());
    expect(pendingCents(api().data)).toBe(140000);
  });

  it("didactic participants keep their original label", () => {
    wrap(<SettlementListPage />);
    expect(screen.getAllByText(/Propietaria didáctica A/).length).toBeGreaterThan(0);
  });
});

describe("portals: base access first, current names after", () => {
  it("a new property owned by con-009 does not enter the owner portal; a rename does show", () => {
    wrap(<OwnerPortal ctx={owner009} />);
    addNewProperty();
    expect(screen.queryByText("Casa Nueva")).toBeNull();
    act(() => { api().editProperty("casa-olivo", { name: "Olivo Renombrada" }); });
    expect(screen.getByText("Olivo Renombrada")).toBeInTheDocument();
    expect(ownerView(demoPortfolio, owner009).properties.map((p) => p.id)).toEqual(["casa-olivo"]);
  });

  it("adding roles or contacts never widens selectable portal contacts", () => {
    const before = selectableContacts(demoPortfolio, "cartera", "propietario").map((c) => c.id);
    wrap(<OwnerPortal ctx={owner009} />);
    act(() => {
      api().addContact({ type: "persona", name: "Nueva Propietaria", roles: ["propietario"], email: "nueva@example.invalid" } as never);
      api().editContact("con-011", { roles: ["arrendador", "propietario"] } as never);
    });
    expect(selectableContacts(demoPortfolio, "cartera", "propietario").map((c) => c.id)).toEqual(before);
    expect(before).not.toContain("con-011");
  });

  it("tenant portal shows the renamed property for an authorized contract", () => {
    wrap(<TenantPortal ctx={tenant001} />);
    act(() => { api().editProperty("casa-olivo", { name: "Olivo Renombrada" }); });
    expect(screen.getAllByText(/Olivo Renombrada/).length).toBeGreaterThan(0);
  });
});
