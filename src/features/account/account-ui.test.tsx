import type { ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountProvider, useAccount } from "./AccountContext";
import { SettingsPage } from "./SettingsPage";
import { WelcomePage } from "./WelcomePage";
import { AccessPage } from "./AccessPage";
import { CatalogProvider, useCatalog } from "@/features/catalog/CatalogContext";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, className }: { to: string; children: ReactNode; className?: string }) => <a href={to} className={className}>{children}</a>,
}));
afterEach(cleanup);

type Api = ReturnType<typeof useAccount>;
const probe: { a: Api | null; c: ReturnType<typeof useCatalog> | null } = { a: null, c: null };
function Probe() { probe.a = useAccount(); probe.c = useCatalog(); return null; }
const mount = (ui: ReactNode) => render(<AccountProvider><CatalogProvider><Probe />{ui}</CatalogProvider></AccountProvider>);
const raf = () => act(async () => { await new Promise((r) => requestAnimationFrame(() => r(null))); });

describe("account screens", () => {
  it("edit company: cancel keeps values; errors focus first field; save updates", async () => {
    mount(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: "Editar empresa" }));
    fireEvent.change(screen.getByLabelText("Nombre de la empresa"), { target: { value: "Otra" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(probe.a!.state.company.name).toBe("Cartera de ejemplo");
    expect(probe.a!.state.history).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Editar empresa" }));
    fireEvent.change(screen.getByLabelText("Nombre de la empresa"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Correo de contacto ficticio"), { target: { value: "a@ejemplo.invalid" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar empresa" }));
    await raf();
    expect(document.activeElement?.id).toBe("emp-name");
    expect(screen.getByLabelText("Nombre de la empresa").getAttribute("aria-invalid")).toBe("true");
    fireEvent.change(screen.getByLabelText("Nombre de la empresa"), { target: { value: "Gestora Ficticia" } });
    fireEvent.change(screen.getByLabelText("Correo de contacto ficticio"), { target: { value: "hola@example.invalid" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar empresa" }));
    expect(probe.a!.state.company.name).toBe("Gestora Ficticia");
  });
  it("deactivating the last admin shows a focused alert and changes nothing", async () => {
    mount(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /Desactivar a Administrador/ }));
    await raf();
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/último administrador/);
    expect(document.activeElement).toBe(alert);
    expect(probe.a!.state.members[0]!.status).toBe("activo");
    expect(screen.getByTestId("seats").textContent).toBe("1");
  });
  it("consecutive commands in one act use the latest state; double accept does not duplicate", () => {
    mount(<SettingsPage />);
    let r1: ReturnType<Api["invite"]> | undefined; let r2: ReturnType<Api["invite"]> | undefined;
    act(() => {
      r1 = probe.a!.invite({ email: "uno@example.invalid", roles: ["gestor"], days: 7 });
      r2 = probe.a!.invite({ email: "dos@example.invalid", roles: ["finanzas"], days: 7 });
    });
    expect(r1?.ok && r2?.ok).toBe(true);
    if (r1?.ok && r2?.ok) expect(r1.id).not.toBe(r2.id);
    let a1: ReturnType<Api["accept"]> | undefined; let a2: ReturnType<Api["accept"]> | undefined;
    act(() => { a1 = probe.a!.accept("inv-1", "Gestor Ficticio"); a2 = probe.a!.accept("inv-1", "Gestor Ficticio"); });
    expect(a1?.ok).toBe(true);
    expect(a2?.ok).toBe(false);
    expect(probe.a!.state.members).toHaveLength(2);
    expect(probe.a!.state.invitations).toHaveLength(4);
  });
  it("catalog reset does not reset the account; account reset is explicit", () => {
    mount(<SettingsPage />);
    act(() => { probe.a!.updateCompany({ name: "Gestora Ficticia", contactEmail: "hola@example.invalid", mode: "mixta" }); });
    act(() => { probe.c!.reset(); });
    expect(probe.a!.state.company.name).toBe("Gestora Ficticia");
    fireEvent.click(screen.getByRole("button", { name: "Restablecer cuenta de ejemplo" }));
    expect(probe.a!.state.company.name).toBe("Cartera de ejemplo");
  });
  it("welcome completes with a single admin", () => {
    mount(<WelcomePage />);
    fireEvent.click(screen.getByRole("button", { name: "Marcar empresa como revisada" }));
    fireEvent.click(screen.getByRole("button", { name: "Marcar perfil como revisado" }));
    expect(screen.getByTestId("welcome-state").textContent).toMatch(/completada/);
    expect(probe.a!.activeSeats).toBe(1);
  });
  it("access page: no password fields, says nothing is sent, sign-out keeps screens visible", () => {
    const { container } = mount(<AccessPage />);
    expect(container.querySelector('input[type="password"]')).toBeNull();
    expect(screen.getAllByText(/Simulación: no se envía nada/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Simular salida" }));
    expect(screen.getByText(/siguen visibles/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Correo ficticio"), { target: { value: "real@gmail.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Simular entrada" }));
    expect(screen.getByRole("alert").textContent).toMatch(/example\.invalid/);
  });
});
