import { describe, expect, it } from "vitest";
import { initialAccount } from "./data/demo-account";
import {
  acceptInvitation, activeAdmins, activeSeats, confirmReview, invite, invitationStatus, revokeInvitation, setMemberActive,
  setMemberRoles, simulateRecovery, simulateSignIn, simulateSignOut, updateCompany, updateProfile, welcomeSteps,
  type AccountResult, type AccountState,
} from "./engine";

const ok = (r: AccountResult): AccountState => { if (!r.ok) throw new Error(r.message); return r.state; };

describe("account engine", () => {
  it("initial: one active admin, 1 seat, company keeps portfolio name, EUR/Europe/Madrid", () => {
    const s = initialAccount();
    expect(activeAdmins(s)).toHaveLength(1);
    expect(activeSeats(s)).toBe(1);
    expect(s.company.name).toBe("Cartera de ejemplo");
    expect([s.company.currency, s.company.timeZone]).toEqual(["EUR", "Europe/Madrid"]);
    expect(invitationStatus(s, s.invitations[1]!)).toBe("caducada");
  });
  it("full welcome with a single admin, no team needed", () => {
    let s = initialAccount();
    s = ok(confirmReview(s, "empresa"));
    s = ok(confirmReview(s, "perfil"));
    expect(welcomeSteps(s)).toMatchObject({ complete: true, team: false });
    expect(confirmReview(s, "perfil").ok).toBe(false);
  });
  it("company and profile validation: only @example.invalid, optional valid phone", () => {
    const s = initialAccount();
    const bad = updateCompany(s, { name: "", contactEmail: "x@ejemplo.invalid", phone: "abc", mode: "mixta" });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(Object.keys(bad.errors).sort()).toEqual(["contactEmail", "name", "phone"]);
    const good = ok(updateCompany(s, { name: "Gestora Ficticia", contactEmail: "Hola@Example.invalid", phone: "", mode: "mixta" }));
    expect(good.company.contactEmail).toBe("hola@example.invalid");
    expect(good.company.phone).toBeUndefined();
    expect(good.company.id).toBe(s.company.id);
    const p = ok(updateProfile(s, { name: "Ana Admin", email: "ana@example.invalid", prefs: { vencimientos: false, incidencias: true, avisos: true } }));
    expect(p.members[0]).toMatchObject({ name: "Ana Admin", email: "ana@example.invalid" });
  });
  it("last active admin protected by three paths, atomically", () => {
    const s = initialAccount();
    for (const r of [setMemberRoles(s, "mbr-1", ["gestor"]), setMemberRoles(s, "mbr-1", ["consulta"]), setMemberActive(s, "mbr-1", false)]) {
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errors["admin"]).toBeTruthy();
    }
    expect(s).toEqual(initialAccount());
  });
  it("pending admin invitation does not count as active admin", () => {
    let s = initialAccount();
    s = ok(invite(s, { email: "otra@example.invalid", roles: ["administrador"], days: 7 }));
    expect(setMemberRoles(s, "mbr-1", ["gestor"]).ok).toBe(false);
    const id = s.invitations.at(-1)!.id;
    s = ok(acceptInvitation(s, id, "Otra Admin"));
    expect(ok(setMemberRoles(s, "mbr-1", ["gestor"])).members[0]!.roles).toEqual(["gestor"]);
  });
  it("expired (boundary excluded), revoked and repeated accepts are rejected without changes", () => {
    const s = initialAccount();
    expect(acceptInvitation(s, "inv-2", "Antigua").ok).toBe(false);
    const atLimit = { ...s, now: s.invitations[0]!.expiresAt };
    expect(acceptInvitation(atLimit, "inv-1", "Gestor").ok).toBe(false);
    const accepted = ok(acceptInvitation(s, "inv-1", "Gestor Ficticio"));
    expect(acceptInvitation(accepted, "inv-1", "Gestor Ficticio").ok).toBe(false);
    expect(accepted.members).toHaveLength(2);
    const revoked = ok(revokeInvitation(s, "inv-1"));
    expect(acceptInvitation(revoked, "inv-1", "X").ok).toBe(false);
    expect(revokeInvitation(revoked, "inv-1").ok).toBe(false);
  });
  it("duplicate email (normalized) vs member, inactive member and pending invite", () => {
    let s = ok(acceptInvitation(initialAccount(), "inv-1", "Gestor Ficticio"));
    expect(invite(s, { email: " ADMIN@example.invalid ", roles: ["consulta"], days: 7 }).ok).toBe(false);
    s = ok(setMemberActive(s, s.members[1]!.id, false));
    const r = invite(s, { email: "gestor@example.invalid", roles: ["consulta"], days: 7 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors["email"]).toMatch(/reactívalo/);
    const re = ok(setMemberActive(s, s.members[1]!.id, true));
    expect(re.members[1]!.id).toBe(s.members[1]!.id);
    const s2 = ok(invite(re, { email: "nuevo@example.invalid", roles: ["finanzas"], days: 3 }));
    expect(invite(s2, { email: "Nuevo@example.invalid", roles: ["finanzas"], days: 3 }).ok).toBe(false);
  });
  it("multi-role person is one seat; empty/duplicate roles rejected", () => {
    let s = ok(acceptInvitation(initialAccount(), "inv-1", "Gestor Ficticio"));
    s = ok(setMemberRoles(s, s.members[1]!.id, ["gestor", "finanzas", "consulta"]));
    expect(activeSeats(s)).toBe(2);
    expect(setMemberRoles(s, s.members[1]!.id, []).ok).toBe(false);
    expect(setMemberRoles(s, s.members[1]!.id, ["gestor", "gestor"]).ok).toBe(false);
  });
  it("history only grows, simulated access never needs passwords", () => {
    let s = initialAccount();
    s = ok(simulateSignOut(s));
    expect(simulateSignOut(s).ok).toBe(false);
    s = ok(simulateRecovery(s, "admin@example.invalid"));
    s = ok(simulateSignIn(s, "admin@example.invalid"));
    expect(simulateSignIn(s, "real@gmail.com").ok).toBe(false);
    expect(s.history.map((h) => h.id)).toEqual(["hist-1", "hist-2", "hist-3"]);
  });
});
