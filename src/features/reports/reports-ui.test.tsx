import { type ReactNode, useState } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CatalogProvider, useCatalog } from "@/features/catalog/CatalogContext";
import { demoPortfolio } from "@/features/portfolio/data/demo-data";
import { ReportsPage } from "./ReportsPage";
import { reportCsv, type ReportsSearch } from "./selectors";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, className }: { to: string; children: ReactNode; className?: string }) => <a href={to} className={className}>{children}</a>,
}));
const download = vi.fn();
vi.mock("@/features/catalog/csv/export", async (orig) => ({ ...(await orig<typeof import("@/features/catalog/csv/export")>()), downloadCsv: (...a: unknown[]) => download(...a) }));
afterEach(() => { cleanup(); download.mockReset(); });

type Api = ReturnType<typeof useCatalog>;
const probe: { api: Api | null } = { api: null };
function Probe() { probe.api = useCatalog(); return null; }

function Harness({ initial }: { initial: ReportsSearch }) {
  const [s, setS] = useState(initial);
  return <ReportsPage search={s} onSearch={setS} />;
}
const REF = demoPortfolio.referenceDate;
const mount = (s: ReportsSearch) => render(<CatalogProvider><Probe /><Harness initial={s} /></CatalogProvider>);

describe("reports screen", () => {
  it("base figures: 8/11, 12 managed, debt 1400, October expenses 460/90/370 and cash 170", () => {
    mount({ mes: "2026-10", fecha: REF });
    expect(screen.getByTestId("occ-occupied").textContent).toBe("8/11");
    expect(screen.getByTestId("occ-managed").textContent).toBe("12");
    expect(screen.getByTestId("debt-total").textContent).toMatch(/1\.?400,00/);
    expect(screen.getByTestId("exp-cost").textContent).toMatch(/460,00/);
    expect(screen.getByTestId("exp-paid").textContent).toMatch(/90,00/);
    expect(screen.getByTestId("exp-pending").textContent).toMatch(/370,00/);
    expect(screen.getByTestId("exp-cash").textContent).toMatch(/170,00/);
    expect(screen.getByTestId("result-total").textContent).toMatch(/Incompleto/);
    expect(screen.getByText(/No calculable · Renta fija del acuerdo no definida/)).toBeTruthy();
  });
  it("valid new unit (result ok) shows 8/12 and 13 managed", () => {
    mount({ mes: "2026-10", fecha: REF });
    let res: ReturnType<Api["addRoom"]> | undefined;
    act(() => { res = probe.api!.addRoom({ code: "INF-02", propertyId: "casa-olivo", monthlyRent: 410, features: [] }); });
    expect(res?.ok).toBe(true);
    expect(screen.getByTestId("occ-occupied").textContent).toBe("8/12");
    expect(screen.getByTestId("occ-managed").textContent).toBe("13");
    expect(screen.getByTestId("debt-total").textContent).toMatch(/1\.?400,00/);
  });
  it("other date shows occupied count only, no rate", () => {
    mount({ mes: "2026-10", fecha: "2026-08-31" });
    expect(screen.getByTestId("occ-occupied").textContent).not.toContain("/");
    expect(screen.getByText("No disponible")).toBeTruthy();
  });
  it("temporary property selected, then catalog reset: kept as invalid, no figures, export disabled", () => {
    mount({ mes: "2026-10", fecha: REF });
    let id = "";
    act(() => {
      const r = probe.api!.addProperty({ code: "INF", name: "Casa Informe", address: "Calle Ficticia 3", ownerId: "con-009" });
      expect(r.ok).toBe(true);
      if (r.ok) id = r.id;
    });
    fireEvent.change(screen.getByLabelText("Inmueble"), { target: { value: id } });
    expect(screen.getAllByText(/Sin movimientos/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Sin acuerdo registrado/)).toBeTruthy();
    act(() => probe.api!.reset());
    expect(screen.getByRole("alert").textContent).toContain(id);
    expect(screen.queryByTestId("debt-total")).toBeNull();
    const btn = screen.getByRole("button", { name: /Exportar CSV/ }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
  it("invalid month warns without widening", () => {
    mount({ mes: "2026-13", fecha: REF });
    expect(screen.getByRole("alert").textContent).toMatch(/Mes económico no válido/);
    expect(screen.queryByTestId("occ-managed")).toBeNull();
  });
  it("export downloads exactly the CSV of the current filters", () => {
    mount({ mes: "2026-10", fecha: REF });
    fireEvent.change(screen.getByLabelText("Inmueble"), { target: { value: "casa-olivo" } });
    fireEvent.click(screen.getByRole("button", { name: /Exportar CSV/ }));
    expect(download).toHaveBeenCalledTimes(1);
    const [name, text] = download.mock.calls[0] as [string, string];
    expect(name).toBe("informe-2026-10-casa-olivo.csv");
    expect(text).toBe(reportCsv(demoPortfolio, { mes: "2026-10", fecha: REF, inmueble: "casa-olivo" }));
  });
});
