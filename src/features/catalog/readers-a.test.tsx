import type { ReactNode } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CatalogProvider, useCatalog } from "./CatalogContext";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { ContractsPage, validateContractsSearch } from "@/features/contracts/ContractsPage";
import { MoneySummaryPage, validateMoneySearch } from "@/features/money/MoneySummaryPage";
import { TenantAccountPage } from "@/features/money/TenantAccountPage";
import { TenantAccountsPage } from "@/features/money/TenantAccountsPage";
import { ProviderAccountPage, ProviderAccountsPage } from "@/features/money/ProviderAccountsPage";
import { SimulatorPage } from "@/features/money/SimulatorPage";
import { DepositsPage, validateDepositsSearch } from "@/features/money/DepositsPage";
import { validateExpensesSearch } from "@/features/money/ExpensesPage";
import { summarizeOccupancy } from "@/features/portfolio/selectors";
import { hasTenantAccount, pendingCents, tenantAccountContacts } from "@/features/money/selectors";
import { expenseTotals, hasProviderAccount, providerAccountContacts } from "@/features/money/expenses";
import { demoPortfolio } from "@/features/portfolio/data/demo-data";

// Router primitives are replaced so these screen tests need no router or browser.
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, className }: { children: ReactNode; className?: string }) => <a href="#" className={className}>{children}</a>,
  useNavigate: () => () => {},
}));
afterEach(cleanup);

type Api = ReturnType<typeof useCatalog>;
const probe: { api: Api | null } = { api: null };
function Probe() { probe.api = useCatalog(); return null; }
const api = () => probe.api!;
const wrap = (ui: ReactNode) => render(<CatalogProvider><Probe />{ui}</CatalogProvider>);

const tenant = tenantAccountContacts(demoPortfolio)[0]!;
const provider = providerAccountContacts(demoPortfolio)[0]!;
const newProperty = () => api().addProperty({ code: "NUE", name: "Casa Nueva", address: "Calle Ficticia 9", ownerId: "con-009" });

describe("descriptive readers use the temporary catalog", () => {
  it("Inicio: empty 8/11; one new unit 8/12 with a notice; debt 1.400 € unchanged", () => {
    wrap(<DashboardPage />);
    expect(screen.queryByText(/alta temporal/)).toBeNull();
    let s = summarizeOccupancy(api().data.rooms);
    expect([s.occupied, s.rentable]).toEqual([8, 11]);
    act(() => { api().addRoom({ code: "OLI-07", propertyId: "casa-olivo", monthlyRent: 400, features: [] }); });
    s = summarizeOccupancy(api().data.rooms);
    expect([s.occupied, s.rentable]).toEqual([8, 12]);
    expect(screen.getByText(/Incluye 1 alta temporal/)).toBeInTheDocument();
    expect(pendingCents(api().data)).toBe(140000);
    expect(screen.getByText(/1\.400/)).toBeInTheDocument();
  });

  it("renaming Casa Olivo shows in Inicio, Contratos and Dinero", () => {
    wrap(<><DashboardPage /><ContractsPage search={{}} /><MoneySummaryPage search={{}} /></>);
    act(() => { api().editProperty("casa-olivo", { name: "Casa Olivo Renombrada" }); });
    expect(screen.getAllByText("Casa Olivo Renombrada").length).toBeGreaterThan(2);
    expect(screen.queryByText("Casa Olivo")).toBeNull();
  });

  it("tenant account, account list and simulator read the current contact by ID", () => {
    wrap(<><TenantAccountPage contact={tenant} search={{}} /><TenantAccountsPage /><SimulatorPage /></>);
    act(() => { api().editContact(tenant.id, { name: "Inquilina Renombrada" }); });
    expect(screen.getByRole("heading", { name: /Cuenta de Inquilina Renombrada/ })).toBeInTheDocument();
    expect(screen.getAllByText("Inquilina Renombrada").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("option", { name: "Inquilina Renombrada" })).toBeInTheDocument();
    expect(screen.queryByText(tenant.name)).toBeNull();
  });

  it("provider list and provider account both read the current contact", () => {
    wrap(<><ProviderAccountsPage /><ProviderAccountPage contact={provider} /></>);
    act(() => { api().editContact(provider.id, { name: "Proveedor Renombrado" }); });
    expect(screen.getByRole("heading", { name: /Cuenta de proveedor · Proveedor Renombrado/ })).toBeInTheDocument();
    expect(screen.getAllByText("Proveedor Renombrado").length).toBeGreaterThanOrEqual(1);
  });

  it("search validators keep new IDs instead of dropping them", () => {
    expect(validateMoneySearch({ inmueble: "cat-inm-1" }).inmueble).toBe("cat-inm-1");
    expect(validateContractsSearch({ inmueble: "cat-inm-1" }).inmueble).toBe("cat-inm-1");
    expect(validateDepositsSearch({ inmueble: "cat-inm-1" }).inmueble).toBe("cat-inm-1");
    expect(validateExpensesSearch({ inmueble: "cat-inm-1", proveedor: "cat-con-2" })).toMatchObject({ inmueble: "cat-inm-1", proveedor: "cat-con-2" });
  });

  it("a new property filter shows zero movements, never the whole portfolio", () => {
    wrap(null);
    let id = "";
    act(() => { const r = newProperty(); if (r.ok) id = r.id; });
    cleanup();
    render(<CatalogProvider><Probe /></CatalogProvider>);
    act(() => { const r = newProperty(); if (r.ok) id = r.id; });
    const { rerender } = render(<></>);
    rerender(<></>);
    cleanup();
    // Render the screens inside a provider that already holds the new property.
    function Screens() {
      const a = useCatalog();
      probe.api = a;
      return a.data.properties.some((p) => p.id === id) ? <><ContractsPage search={{ inmueble: id }} /><DepositsPage search={{ inmueble: id }} /></> : null;
    }
    render(<CatalogProvider><Screens /></CatalogProvider>);
    act(() => { newProperty(); });
    expect(screen.getByText(/No hay contratos que coincidan/)).toBeInTheDocument();
    expect(screen.getByText(/0 contratos con fianza/)).toBeInTheDocument();
    expect(screen.queryByText(/Inmueble no encontrado/)).toBeNull();
  });

  it("unknown or reset-removed property IDs show an explicit not-found state without throwing", () => {
    wrap(<><ContractsPage search={{ inmueble: "cat-inm-1" }} /><MoneySummaryPage search={{ inmueble: "cat-inm-1" }} /></>);
    expect(screen.getAllByText(/Inmueble no encontrado/).length).toBeGreaterThan(0);
    act(() => { newProperty(); });
    expect(api().data.properties.some((p) => p.id === "cat-inm-1")).toBe(true);
    expect(screen.queryByText(/Este inmueble no existe/)).toBeNull();
    act(() => { api().reset(); });
    expect(screen.getByText(/Este inmueble no existe/)).toBeInTheDocument();
    expect(screen.getByText(/Sin cobros en esta selección/)).toBeInTheDocument();
  });

  it("new contacts or added roles never create accounts or eligible payers", () => {
    wrap(<><TenantAccountsPage /><SimulatorPage /></>);
    act(() => { api().addContact({ code: "CON-701", name: "Persona Nueva Ejemplo", type: "persona", roles: ["inquilino", "proveedor"] }); });
    const view = api().data;
    expect(tenantAccountContacts(view).map((c) => c.id)).toEqual(tenantAccountContacts(demoPortfolio).map((c) => c.id));
    expect(providerAccountContacts(view).map((c) => c.id)).toEqual(providerAccountContacts(demoPortfolio).map((c) => c.id));
    const added = view.contacts.find((c) => c.code === "CON-701")!;
    expect(hasTenantAccount(view, added.id)).toBe(false);
    expect(hasProviderAccount(view, added.id)).toBe(false);
    expect(screen.queryByText("Persona Nueva Ejemplo")).toBeNull();
  });

  it("orientative rent and new records never change contractual rent or totals", () => {
    wrap(null);
    act(() => { api().editRoom("oli-05", { monthlyRent: 999 }); newProperty(); });
    const view = api().data;
    expect(view.contracts.find((c) => c.reference === "CT-EJ-0105")!.rentCents).toBe(41000);
    const t = expenseTotals(view);
    expect([t.costCents, t.paidCents, t.pendingCents]).toEqual([54000, 17000, 37000]);
    expect(pendingCents(view)).toBe(140000);
    expect(view.contracts).toBe(demoPortfolio.contracts);
    expect(view.charges).toBe(demoPortfolio.charges);
    expect(view.expenses).toBe(demoPortfolio.expenses);
  });
});
