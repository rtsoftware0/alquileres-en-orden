import { StrictMode, type ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CatalogProvider, useCatalog } from "../CatalogContext";
import { ImportWizard } from "./ImportWizard";
import { demoPortfolio } from "@/features/portfolio/data/demo-data";
import { pendingCents } from "@/features/money/selectors";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, className }: { to: string; children: ReactNode; className?: string }) => <a href={to} className={className}>{children}</a>,
}));
afterEach(cleanup);

type Api = ReturnType<typeof useCatalog>;
const probe: { api: Api | null } = { api: null };
function Probe() { probe.api = useCatalog(); return null; }
const api = () => probe.api!;
const mount = (entity?: "contactos" | "inmuebles" | "unidades") =>
  render(<StrictMode><CatalogProvider><Probe /><ImportWizard initialEntity={entity} /></CatalogProvider></StrictMode>);

async function upload(text: string, name = "datos.csv") {
  const input = screen.getByLabelText(/Archivo CSV/) as HTMLInputElement;
  const file = new File([text], name, { type: "text/csv" });
  await act(async () => { fireEvent.change(input, { target: { files: [file] } }); });
  await screen.findByText(new RegExp(name.replace(".", "\\.")));
}
const click = (name: RegExp) => fireEvent.click(screen.getByRole("button", { name }));

const ROOMS = "codigo;inmueble_codigo;renta_mensual;color\nNUE-01;OLI;525,55;rojo\nNUE-02;AZA;300,29;azul\n";

describe("import wizard", () => {
  it("file → mapping → review → confirm creates the batch once; excluded column listed", async () => {
    mount("unidades");
    await upload(ROOMS);
    expect(screen.getByText(/Columnas excluidas: color/)).toBeInTheDocument();
    click(/Revisar importación/);
    expect(screen.getByText(/Nuevas:/).textContent).toMatch(/Nuevas: 2/);
    const seqBefore = api().overlay.seq;
    click(/Confirmar importación temporal/);
    expect(api().overlay.seq).toBe(seqBefore + 2);
    expect(api().data.rooms.find((r) => r.code === "NUE-01")?.monthlyRent).toBe(525.55);
    expect(screen.getByText(/2 altas temporales creadas/)).toBeInTheDocument();
    expect(pendingCents(api().data)).toBe(140000);
    expect(api().data.contracts).toBe(demoPortfolio.contracts);
  });

  it("changing the mapping or format discards the review", async () => {
    mount("unidades");
    await upload(ROOMS);
    click(/Revisar importación/);
    expect(screen.getByRole("button", { name: /Confirmar importación/ })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Formato decimal/), { target: { value: "." } });
    expect(screen.queryByRole("button", { name: /Confirmar importación/ })).toBeNull();
    click(/Revisar importación/);
    fireEvent.change(screen.getByLabelText(/Columna «color»/), { target: { value: "nota" } });
    expect(screen.queryByRole("button", { name: /Confirmar importación/ })).toBeNull();
  });

  it("errors block confirmation with 0 additions", async () => {
    mount("unidades");
    await upload("codigo;inmueble_codigo;renta_mensual\nNUE-01;OLI;525,555\n");
    click(/Revisar importación/);
    expect(screen.getByRole("button", { name: /Confirmar importación/ })).toBeDisabled();
    expect(api().overlay.seq).toBe(0);
  });

  it("warnings need explicit acceptance", async () => {
    mount("contactos");
    await upload("codigo;nombre;tipo;roles\nCON-801;Dueña Repetida;persona;propietario\nCON-802;Dueña Repetida;persona;candidato\n");
    click(/Revisar importación/);
    const confirm = screen.getByRole("button", { name: /Confirmar importación/ });
    expect(confirm).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: /Entiendo las advertencias/ }));
    expect(confirm).not.toBeDisabled();
    click(/Confirmar importación/);
    expect(api().data.contacts.filter((c) => c.code.startsWith("CON-80"))).toHaveLength(2);
  });

  it("catalog change after review makes it stale; reset clears imports and receipts", async () => {
    mount("unidades");
    await upload(ROOMS);
    click(/Revisar importación/);
    act(() => { api().addContact({ code: "CON-999", name: "Otro Ejemplo", type: "persona", roles: ["candidato"] }); });
    expect(screen.getByText(/La revisión ha caducado/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Confirmar importación/ })).toBeDisabled();
    click(/Revisar importación/);
    click(/Confirmar importación/);
    expect(api().overlay.imports?.batches).toBe(1);
    act(() => api().reset());
    expect(api().overlay.imports).toBeUndefined();
    expect(api().data.rooms).toHaveLength(12);
  });

  it("double confirmation in one event with the same review writes once", async () => {
    mount("unidades");
    await upload(ROOMS);
    click(/Revisar importación/);
    let review = null as Parameters<Api["commitImport"]>[0] | null;
    // Rebuild the same review through the provider to call the command twice in one act.
    act(() => {
      const a = api();
      const r = a.prepareImport({ entity: "unidades", headers: ["codigo", "inmueble_codigo", "renta_mensual"], rows: [["NUE-07", "OLI", "400"]], mapping: ["codigo", "inmueble_codigo", "renta_mensual"], delimiter: ";", decimal: ",", contentKey: "x" });
      review = r;
      const first = a.commitImport(r, true);
      const second = a.commitImport(r, true);
      expect(first.ok).toBe(true);
      expect(second.ok).toBe(false);
    });
    expect(review).not.toBeNull();
    expect(api().data.rooms.filter((r) => r.code === "NUE-07")).toHaveLength(1);
  });

  it("rejects oversize files before reading and non UTF-8 content", async () => {
    mount("contactos");
    const input = screen.getByLabelText(/Archivo CSV/) as HTMLInputElement;
    const big = new File(["x"], "grande.csv");
    Object.defineProperty(big, "size", { value: 10 * 1024 * 1024 + 1 });
    await act(async () => { fireEvent.change(input, { target: { files: [big] } }); });
    expect(screen.getByRole("alert").textContent).toMatch(/10 MB/);
    const bad = new File([new Uint8Array([0x63, 0xff, 0xfe])], "latin.csv");
    await act(async () => { fireEvent.change(input, { target: { files: [bad] } }); });
    expect(await screen.findByText(/no está codificado en UTF-8/)).toBeInTheDocument();
  });
});
