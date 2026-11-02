import { type ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CatalogProvider, useCatalog } from "./CatalogContext";
import { ContactForm } from "./ContactForm";
import { PropertyForm } from "./PropertyForm";
import { RoomForm, parseDecimal } from "./RoomForm";
import { ContactPage } from "@/features/contacts/ContactPage";
import { summarizeOccupancy } from "@/features/portfolio/selectors";
import { pendingCents } from "@/features/money/selectors";
import { demoPortfolio } from "@/features/portfolio/data/demo-data";

// Router links are replaced so these screen tests need no router or browser.
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, className }: { to: string; children: ReactNode; className?: string }) => <a href={to} className={className}>{children}</a>,
}));
afterEach(cleanup);

type Api = ReturnType<typeof useCatalog>;
const probe: { api: Api | null } = { api: null };
function Probe() { probe.api = useCatalog(); return null; }
const api = () => probe.api!;
const wrap = (ui: ReactNode) => render(<CatalogProvider><Probe />{ui}</CatalogProvider>);
const type = (label: RegExp | string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const submit = (name: RegExp) => fireEvent.click(screen.getByRole("button", { name }));

describe("catalog forms", () => {
  it("chain: contact → property → unit, each returning its ID; unit is available and figures stay", () => {
    const saved: string[] = [];
    function Chain() {
      const a = useCatalog();
      const owner = a.data.contacts.find((c) => c.code === "CON-700");
      const prop = a.data.properties.find((p) => p.code === "NUE");
      if (!owner) return <ContactForm onSaved={(id) => saved.push(id)} onCancel={() => {}} />;
      if (!prop) return <PropertyForm onSaved={(id) => saved.push(id)} onCancel={() => {}} />;
      return <RoomForm initialPropertyId={prop.id} onSaved={(id) => saved.push(id)} onCancel={() => {}} />;
    }
    wrap(<Chain />);
    type(/^Código/, "CON-700"); type(/^Nombre/, "Dueña Nueva Ejemplo");
    fireEvent.click(screen.getByRole("checkbox", { name: /Propietario/ }));
    submit(/Crear contacto temporal/);
    type(/^Código/, "NUE"); type(/^Nombre/, "Casa Nueva"); type(/Dirección ficticia/, "Calle Ficticia 9");
    fireEvent.change(screen.getByLabelText(/^Propietario/), { target: { value: "cat-con-1" } });
    submit(/Crear inmueble temporal/);
    type(/^Código/, "NUE-01"); type(/Renta orientativa/, "525,55");
    submit(/Crear unidad temporal/);
    expect(saved).toEqual(["cat-con-1", "cat-inm-2", "cat-uni-3"]);
    const view = api().data;
    const room = view.rooms.find((r) => r.id === "cat-uni-3")!;
    expect(room.status).toBe("disponible");
    expect(room.monthlyRent).toBe(525.55);
    const s = summarizeOccupancy(view.rooms);
    expect([s.occupied, s.rentable]).toEqual([8, 12]);
    expect(pendingCents(view)).toBe(140000);
    expect(view.contracts).toBe(demoPortfolio.contracts);
  });

  it("empty catalog keeps 15 contacts, 12 units and 8/11", () => {
    wrap(null);
    const s = summarizeOccupancy(api().data.rooms);
    expect([api().data.contacts.length, api().data.rooms.length, s.occupied, s.rentable]).toEqual([15, 12, 8, 11]);
  });

  it("errors are linked to controls, focus moves to the first one and the draft is kept", async () => {
    wrap(<ContactForm onSaved={() => {}} onCancel={() => {}} />);
    type(/Correo ficticio/, "real@gmail.com");
    await act(async () => { submit(/Crear contacto temporal/); });
    const code = screen.getByLabelText(/^Código/);
    expect(code).toHaveAttribute("aria-invalid", "true");
    expect(code.getAttribute("aria-describedby")).toContain("-error");
    expect(document.activeElement).toBe(code);
    expect(screen.getByLabelText(/Correo ficticio/)).toHaveValue("real@gmail.com");
    expect(screen.getByRole("group", { name: "Roles" })).toBeInTheDocument();
    expect(api().isEmpty).toBe(true);
  });

  it("duplicate name/email asks confirmation BEFORE commit; cancel does not create; editing invalidates it", () => {
    const saved: string[] = [];
    const existing = demoPortfolio.contacts.find((c) => c.email)!;
    wrap(<ContactForm onSaved={(id) => saved.push(id)} onCancel={() => {}} />);
    type(/^Código/, "CON-710"); type(/^Nombre/, existing.name);
    fireEvent.click(screen.getByRole("checkbox", { name: /Candidato/ }));
    type(/Correo ficticio/, existing.email!);
    submit(/Crear contacto temporal/);
    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getAllByRole("listitem").length).toBe(2);
    expect(api().isEmpty).toBe(true);
    fireEvent.click(within(dialog).getByRole("button", { name: /Revisar datos/ }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(api().isEmpty).toBe(true);
    submit(/Crear contacto temporal/);
    type(/^Nombre/, `${existing.name} bis`);
    expect(screen.queryByRole("alertdialog")).toBeNull();
    submit(/Crear contacto temporal/);
    fireEvent.click(screen.getByRole("button", { name: /Guardar de todos modos/ }));
    expect(saved).toEqual(["cat-con-1"]);
  });

  it("a normalized duplicate code is always an error, never merged", () => {
    wrap(<ContactForm onSaved={() => {}} onCancel={() => {}} />);
    type(/^Código/, "con 001"); type(/^Nombre/, "Otra persona");
    fireEvent.click(screen.getByRole("checkbox", { name: /Candidato/ }));
    submit(/Crear contacto temporal/);
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.getByLabelText(/^Código/)).toHaveAttribute("aria-invalid", "true");
    expect(api().isEmpty).toBe(true);
  });

  it("candidate con-013 edits a note keeping candidato; linked current roles are locked, no retrospective inquilino", () => {
    wrap(<ContactForm contactId="con-013" onSaved={() => {}} onCancel={() => {}} />);
    expect(screen.getByRole("checkbox", { name: /Candidato/ })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: /Inquilino/ })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Inquilino/ })).toBeEnabled();
    type(/^Nota/, "Prefiere entrada en noviembre");
    submit(/Guardar cambios temporales/);
    const c = api().data.contacts.find((x) => x.id === "con-013")!;
    expect(c.note).toBe("Prefiere entrada en noviembre");
    expect(c.roles).toEqual(["candidato"]);
  });

  it("base property code and owner are protected; Azahar ownerId cannot change", () => {
    wrap(<PropertyForm propertyId="casa-azahar" onSaved={() => {}} onCancel={() => {}} />);
    expect(screen.getByLabelText(/^Código/)).toHaveAttribute("readonly");
    expect(screen.getByLabelText(/^Propietario/)).toBeDisabled();
    expect(screen.getAllByText(/Protegido: vinculado/).length).toBeGreaterThanOrEqual(2);
    const before = demoPortfolio.properties.find((p) => p.id === "casa-azahar")!.ownerId;
    type(/^Nombre/, "Casa Azahar Editada");
    submit(/Guardar cambios temporales/);
    const p = api().data.properties.find((x) => x.id === "casa-azahar")!;
    expect(p.name).toBe("Casa Azahar Editada");
    expect(p.ownerId).toBe(before);
  });

  it("base unit OLI-05: code/property protected; rent 525.55 does not change the 41000-cent contract", () => {
    wrap(<RoomForm roomId="oli-05" onSaved={() => {}} onCancel={() => {}} />);
    expect(screen.getByLabelText(/^Código/)).toHaveAttribute("readonly");
    expect(screen.getByLabelText(/^Inmueble/)).toBeDisabled();
    type(/Renta orientativa/, "525.55");
    submit(/Guardar cambios temporales/);
    const view = api().data;
    expect(view.rooms.find((r) => r.id === "oli-05")!.monthlyRent).toBe(525.55);
    expect(view.contracts.find((c) => c.roomId === "oli-05" && c.status === "borrador")!.rentCents).toBe(41000);
    expect(pendingCents(view)).toBe(140000);
  });

  it("rent with 3 decimals and fractional capacity are rejected; empty area is optional", () => {
    wrap(<RoomForm initialPropertyId="casa-olivo" onSaved={() => {}} onCancel={() => {}} />);
    type(/^Código/, "OLI-90"); type(/Renta orientativa/, "525,555"); type(/Capacidad/, "1,5");
    submit(/Crear unidad temporal/);
    expect(screen.getByLabelText(/Renta orientativa/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/Capacidad/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/Superficie/)).not.toHaveAttribute("aria-invalid");
    expect(api().isEmpty).toBe(true);
    expect(parseDecimal("525,55")).toBe(525.55);
    expect(parseDecimal("")).toBeNaN();
  });

  it("unknown preselected property asks for a selection instead of picking another", () => {
    wrap(<RoomForm initialPropertyId="no-existe" onSaved={() => {}} onCancel={() => {}} />);
    expect(screen.getByRole("status")).toHaveTextContent(/no existe/);
    expect(screen.getByLabelText(/^Inmueble/)).toHaveValue("");
    type(/^Código/, "X-01"); type(/Renta orientativa/, "300,29");
    submit(/Crear unidad temporal/);
    expect(screen.getByLabelText(/^Inmueble/)).toHaveAttribute("aria-invalid", "true");
    expect(api().isEmpty).toBe(true);
  });

  it("an added unit may change property; nonexistent property rejected", () => {
    function Seeded() {
      const a = useCatalog();
      if (a.isEmpty) return <button onClick={() => a.addRoom({ code: "MOV-01", propertyId: "casa-olivo", monthlyRent: 300, features: [] })}>sembrar</button>;
      return <RoomForm roomId="cat-uni-1" onSaved={() => {}} onCancel={() => {}} />;
    }
    wrap(<Seeded />);
    fireEvent.click(screen.getByRole("button", { name: "sembrar" }));
    const select = screen.getByLabelText(/^Inmueble/);
    expect(select).toBeEnabled();
    fireEvent.change(select, { target: { value: "casa-azahar" } });
    submit(/Guardar cambios temporales/);
    expect(api().data.rooms.find((r) => r.id === "cat-uni-1")!.propertyId).toBe("casa-azahar");
    expect(api().editRoom("cat-uni-1", { propertyId: "no-existe" }).ok).toBe(false);
  });

  it("edit panel: cancel leaves the overlay untouched, reopening starts a fresh draft, focus returns to the button", async () => {
    const contact = demoPortfolio.contacts.find((c) => c.id === "con-013")!;
    wrap(<ContactPage contact={contact} />);
    const toggle = screen.getByRole("button", { name: /Editar datos/ });
    fireEvent.click(toggle);
    type(/^Nota/, "Borrador que se descarta");
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Cancelar" })); });
    expect(api().isEmpty).toBe(true);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /Editar datos/ }));
    fireEvent.click(screen.getByRole("button", { name: /Editar datos/ }));
    expect(screen.getByLabelText(/^Nota/)).toHaveValue(contact.note ?? "");
  });
});
