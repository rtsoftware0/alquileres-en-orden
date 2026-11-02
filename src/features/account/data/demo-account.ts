// Fictitious company account (tanda 7). One single demo company; roles and
// sessions are simulated and never restrict screens or separate data.
import { demoPortfolio } from "@/features/portfolio/data/demo-data";
import { site } from "@/config/site";
import type { AccountState } from "../engine";

/** Simulated UTC clock for the account demo (reference day of the portfolio). */
export const ACCOUNT_NOW = `${demoPortfolio.referenceDate}T09:00:00.000Z`;
/** Demo invitation lifetime. Example only, not an approved commercial policy. */
export const DEMO_INVITE_DAYS = 7;

export function initialAccount(): AccountState {
  return {
    company: {
      id: "emp-demo-1",
      name: demoPortfolio.companyName,
      contactEmail: "contacto@example.invalid",
      mode: "gestion_propia",
      currency: "EUR",
      timeZone: "Europe/Madrid",
    },
    profile: { memberId: "mbr-1", prefs: { vencimientos: true, incidencias: true, avisos: false } },
    members: [{ id: "mbr-1", name: site.demoUser, email: "admin@example.invalid", roles: ["administrador"], status: "activo" }],
    invitations: [
      { id: "inv-1", email: "gestor@example.invalid", roles: ["gestor"], createdAt: "2026-10-20T09:00:00.000Z", expiresAt: "2026-10-27T09:00:00.000Z", status: "pendiente" },
      { id: "inv-2", email: "antigua@example.invalid", roles: ["consulta"], createdAt: "2026-10-01T09:00:00.000Z", expiresAt: "2026-10-08T09:00:00.000Z", status: "pendiente" },
    ],
    history: [],
    seq: 0,
    now: ACCOUNT_NOW,
    session: { status: "dentro", email: "admin@example.invalid" },
  };
}
