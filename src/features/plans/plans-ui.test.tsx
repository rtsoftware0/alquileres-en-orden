import { useState, type ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountProvider, useAccount } from "@/features/account/AccountContext";
import { CatalogProvider, useCatalog } from "@/features/catalog/CatalogContext";
import { SettlementProvider } from "@/features/settlements/SettlementContext";
import { PlansProvider, usePlans } from "./PlansContext";
import { PlansPage } from "./PlansPage";
import { HelpPage, SUPPORT_RESULT } from "./HelpPage";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, className }: { to: string; children: ReactNode; className?: string }) => <a href={to} className={className}>{children}</a>,
}));
afterEach(cleanup);

const probe: { p: ReturnType<typeof usePlans> | null; a: ReturnType<typeof useAccount> | null; c: ReturnType<typeof useCatalog> | null; show: ((v: boolean) => void) | null } = { p: null, a: null, c: null, show: null };
function Probe() { probe.p = usePlans(); probe.a = useAccount(); probe.c = useCatalog(); return null; }
function Toggle({ children }: { children: ReactNode }) { const [v, set] = useState(true); probe.show = set; return v ? <>{children}</> : null; }
const mount = (ui: ReactNode) => render(
  <AccountProvider><CatalogProvider><PlansProvider><SettlementProvider><Probe /><Toggle>{ui}</Toggle></SettlementProvider></PlansProvider></CatalogProvider></AccountProvider>,
);

describe("plans page", () => {
  it("shows catalogue, real usage (12 units, 1 seat) and Enterprise not activable", () => {
    mount(<PlansPage />);
    expect(screen.getByTestId("usage-units").textContent).toContain("12");
    expect(screen.getByTestId("usage-users").textContent).toContain(String(probe.a!.activeSeats));
    expect(screen.getByLabelText("Plan Enterprise").textContent).toMatch(/no es ilimitado/);
    expect(screen.queryByRole("button", { name: /Enterprise/ })).toBeNull();
  });
  it("trial end in Madrid time; survives unmount (navigation), account and catalog resets", () => {
    mount(<PlansPage />);
    fireEvent.click(screen.getByRole("button", { name: "Empezar prueba Pro" }));
    expect(screen.getByTestId("trial-end").textContent).toContain("28/10/2026, 10:00");
    act(() => probe.show!(false));
    act(() => { probe.a!.reset(); probe.c!.reset(); });
    act(() => probe.show!(true));
    expect(screen.getByTestId("plans-phase").textContent).toBe("Prueba gratuita");
    expect(probe.p!.state.trialUsed).toBe(true);
    expect(screen.queryByRole("button", { name: /Reiniciar planes/ })).toBeNull();
  });
  it("catalog adds raise unit usage", () => {
    mount(<PlansPage />);
    const propertyId = probe.c!.data.properties[0]!.id;
    act(() => { expect(probe.c!.addRoom({ propertyId, code: "PLN-99", monthlyRent: 300, features: [], capacity: 1 }).ok).toBe(true); });
    expect(screen.getByTestId("usage-units").textContent).toBe("Unidades gestionadas: 13");
  });
  it("quote needs consent then verified payment before rights; simulator does not create units", () => {
    mount(<PlansPage />);
    fireEvent.click(screen.getByRole("button", { name: "Cotizar Pro" }));
    expect(screen.getByTestId("quote-amount").textContent).toMatch(/49/);
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cotización" }));
    expect(screen.getByRole("status").textContent).toMatch(/consentimiento/);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cotización" }));
    fireEvent.click(screen.getByRole("button", { name: "Simular pago pendiente" }));
    expect(screen.getByTestId("plans-phase").textContent).toBe("Sin plan");
    fireEvent.click(screen.getByRole("button", { name: "Simular pago verificado" }));
    expect(screen.getByTestId("plans-phase").textContent).toBe("Plan activo");
    const before = probe.c!.data.rooms.length;
    fireEvent.click(screen.getByRole("button", { name: "Simular nueva unidad" }));
    expect(screen.getByTestId("sim-result").textContent).toMatch(/Permitido/);
    expect(probe.c!.data.rooms.length).toBe(before);
  });
  it("PLAN02: same API reference and event reads the last accepted storage", () => {
    mount(<PlansPage />);
    const api = probe.p!;
    let over: ReturnType<typeof api.simulate> | null = null;
    let atLimit: ReturnType<typeof api.simulate> | null = null;
    act(() => {
      expect(api.startTrial("pro").ok).toBe(true);
      expect(api.setStorage(500).ok).toBe(true);
      over = api.simulate({ kind: "subida", mb: 1 });
      expect(api.setStorage(499).ok).toBe(true);
      atLimit = api.simulate({ kind: "subida", mb: 1 });
    });
    expect(over!.allowed).toBe(false); expect(over!.after).toBe(501); expect(over!.limit).toBe(500);
    expect(atLimit!.allowed).toBe(true); expect(atLimit!.after).toBe(500);
    expect(probe.p!.usage.storageMb).toBe(499);
    expect(probe.p!.phase).toBe("prueba");
    expect(probe.p!.simulate({ kind: "subida", mb: 1 }).after).toBe(500);
  });
  it("PLAN01: Max→Basic at the exact period end rejects a simulated 13th unit without deleting", () => {
    mount(<PlansPage />);
    act(() => {
      const q = probe.p!.quote("compra", "max");
      expect(probe.p!.confirm(q.id!, true).ok).toBe(true);
      expect(probe.p!.pay(q.id!, "verificado").ok).toBe(true);
      expect(probe.p!.downgrade("basic").ok).toBe(true);
    });
    act(() => { const s = probe.p!.state; expect(probe.p!.advance(s.sub!.periodEnd - s.now).ok).toBe(true); });
    expect(screen.getByTestId("plans-phase").textContent).toBe("Renovación pendiente · periodo de gracia");
    const before = probe.c!.data.rooms.length;
    fireEvent.click(screen.getByRole("button", { name: "Simular nueva unidad" }));
    expect(screen.getByTestId("sim-result").textContent).toMatch(/ya hay exceso \(12 de 10/);
    expect(probe.c!.data.rooms.length).toBe(before);
  });
  it("PLAN03: paying a quote after the clock moved shows 'Vuelve a cotizar'", () => {
    mount(<PlansPage />);
    fireEvent.click(screen.getByRole("button", { name: "Cotizar Pro" }));
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cotización" }));
    fireEvent.click(screen.getByRole("button", { name: "Avanzar 1 hora" }));
    fireEvent.click(screen.getByRole("button", { name: "Simular pago verificado" }));
    expect(screen.getAllByRole("status").some((n) => /Vuelve a cotizar/.test(n.textContent ?? ""))).toBe(true);
    expect(screen.getByTestId("plans-phase").textContent).toBe("Sin plan");
    expect(probe.p!.state.payments).toHaveLength(0);
  });
});

describe("help page", () => {
  it("rejects non example.invalid and invisible characters; result is not sent", () => {
    render(<HelpPage />);
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText("Correo ficticio"), { target: { value: "ana\u200b@example.invalid" } });
    fireEvent.change(screen.getByLabelText("Mensaje"), { target: { value: "Necesito ayuda con la demo" } });
    fireEvent.click(screen.getByRole("button", { name: "Preparar consulta" }));
    expect(screen.queryByText(SUPPORT_RESULT)).toBeNull();
    expect(document.activeElement?.id).toBe("sup-email");
    fireEvent.change(screen.getByLabelText("Correo ficticio"), { target: { value: "ana@example.invalid" } });
    fireEvent.click(screen.getByRole("button", { name: "Preparar consulta" }));
    expect(screen.getByText(SUPPORT_RESULT)).toBeTruthy();
  });
});
