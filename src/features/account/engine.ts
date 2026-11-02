// Pure account engine (tanda 7). Every command validates against the given
// state and returns a whole new state or a field-level rejection without changes.
// Invariant: at least one ACTIVE member with the administrator role.

export type AccountRole = "administrador" | "gestor" | "finanzas" | "consulta";
export const ACCOUNT_ROLES: AccountRole[] = ["administrador", "gestor", "finanzas", "consulta"];
export const ROLE_LABEL: Record<AccountRole, string> = { administrador: "Administrador", gestor: "Gestor", finanzas: "Finanzas", consulta: "Consulta" };

export type CompanyMode = "gestion_propia" | "gestora_terceros" | "mixta";
export const COMPANY_MODES: CompanyMode[] = ["gestion_propia", "gestora_terceros", "mixta"];
export const MODE_LABEL: Record<CompanyMode, string> = { gestion_propia: "Gestión propia", gestora_terceros: "Gestora para terceros", mixta: "Mixta" };

export interface Company { id: string; name: string; contactEmail: string; phone?: string; mode: CompanyMode; currency: "EUR"; timeZone: "Europe/Madrid" }
export interface Prefs { vencimientos: boolean; incidencias: boolean; avisos: boolean }
export interface Member { id: string; name: string; email: string; roles: AccountRole[]; status: "activo" | "desactivado" }
export interface Invitation { id: string; email: string; roles: AccountRole[]; createdAt: string; expiresAt: string; status: "pendiente" | "aceptada" | "revocada"; memberId?: string }
export interface HistoryEntry { id: string; at: string; actor: string; action: string; detail: string }
export interface AccountState {
  company: Company;
  profile: { memberId: string; prefs: Prefs };
  members: Member[];
  invitations: Invitation[];
  history: HistoryEntry[];
  seq: number;
  now: string; // simulated UTC clock
  session: { status: "dentro" | "fuera"; email: string };
}

export type Errors = Record<string, string>;
export type AccountResult = { ok: true; state: AccountState; id?: string } | { ok: false; errors: Errors; message: string };

const EMAIL = /^[a-z0-9._%+-]+@example\.invalid$/;
const PHONE = /^[+0-9 ()-]{6,20}$/;
export const normEmail = (s: string) => s.trim().toLowerCase();
const fail = (errors: Errors, message?: string): AccountResult => ({ ok: false, errors, message: message ?? Object.values(errors)[0] ?? "Operación no válida." });

function checkName(v: string, key: string, e: Errors) {
  const t = v.trim();
  if (!t) e[key] = "Obligatorio.";
  else if (t.length > 80) e[key] = "Máximo 80 caracteres.";
}
function checkEmail(v: string, key: string, e: Errors) {
  if (!EMAIL.test(normEmail(v))) e[key] = "Usa un correo ficticio terminado en @example.invalid.";
}
export function checkRoles(roles: AccountRole[], e: Errors, key = "roles") {
  if (!roles.length) e[key] = "Elige al menos un rol.";
  else if (new Set(roles).size !== roles.length || roles.some((r) => !ACCOUNT_ROLES.includes(r))) e[key] = "Roles no válidos o repetidos.";
}

export const activeMembers = (s: AccountState) => s.members.filter((m) => m.status === "activo");
/** One seat per active person, regardless of how many roles they hold. */
export const activeSeats = (s: AccountState) => activeMembers(s).length;
export const activeAdmins = (s: AccountState) => activeMembers(s).filter((m) => m.roles.includes("administrador"));
export const profileMember = (s: AccountState) => s.members.find((m) => m.id === s.profile.memberId);
export const isExpired = (s: AccountState, i: Invitation) => s.now >= i.expiresAt;
export const invitationStatus = (s: AccountState, i: Invitation) => (i.status === "pendiente" && isExpired(s, i) ? "caducada" : i.status);
export const pendingInvitations = (s: AccountState) => s.invitations.filter((i) => invitationStatus(s, i) === "pendiente");

function commit(prev: AccountState, next: AccountState, action: string, detail: string, id?: string): AccountResult {
  if (activeAdmins(next).length < 1)
    return fail({ admin: "Debe quedar al menos un administrador activo." }, "No se puede quitar, degradar ni desactivar al último administrador activo. Una invitación pendiente no cuenta.");
  const seq = prev.seq + 1;
  const actor = profileMember(prev)?.name ?? "Administrador de demostración";
  const entry: HistoryEntry = { id: `hist-${seq}`, at: prev.now, actor, action, detail };
  return { ok: true, state: { ...next, seq, history: [...prev.history, entry] }, ...(id ? { id } : {}) };
}

export interface CompanyInput { name: string; contactEmail: string; phone?: string; mode: CompanyMode }
export function updateCompany(s: AccountState, i: CompanyInput): AccountResult {
  const e: Errors = {};
  checkName(i.name, "name", e);
  checkEmail(i.contactEmail, "contactEmail", e);
  const phone = i.phone?.trim() ?? "";
  if (phone && !PHONE.test(phone)) e["phone"] = "Teléfono ficticio no válido.";
  if (!COMPANY_MODES.includes(i.mode)) e["mode"] = "Modalidad no válida.";
  if (Object.keys(e).length) return fail(e);
  const { phone: _p, ...rest } = s.company;
  const company: Company = { ...rest, name: i.name.trim(), contactEmail: normEmail(i.contactEmail), mode: i.mode, ...(phone ? { phone } : {}) };
  return commit(s, { ...s, company }, "Empresa actualizada", company.name);
}

export interface ProfileInput { name: string; email: string; prefs: Prefs }
/** The profile IS the linked member: name/email live once, on the member. */
export function updateProfile(s: AccountState, i: ProfileInput): AccountResult {
  const e: Errors = {};
  checkName(i.name, "name", e);
  checkEmail(i.email, "email", e);
  const email = normEmail(i.email);
  if (!e["email"] && s.members.some((m) => m.id !== s.profile.memberId && m.email === email)) e["email"] = "Ese correo ya pertenece a otro miembro.";
  if (!e["email"] && s.invitations.some((x) => invitationStatus(s, x) === "pendiente" && x.email === email)) e["email"] = "Ese correo tiene una invitación pendiente.";
  if (!profileMember(s)) e["name"] = "Perfil sin miembro vinculado.";
  if (Object.keys(e).length) return fail(e);
  const members = s.members.map((m) => (m.id === s.profile.memberId ? { ...m, name: i.name.trim(), email } : m));
  const session = s.session.email === profileMember(s)?.email ? { ...s.session, email } : s.session;
  return commit(s, { ...s, members, session, profile: { ...s.profile, prefs: { ...i.prefs } } }, "Perfil actualizado", i.name.trim());
}

export function setMemberRoles(s: AccountState, id: string, roles: AccountRole[]): AccountResult {
  const m = s.members.find((x) => x.id === id);
  if (!m) return fail({ member: "Miembro no encontrado." });
  const e: Errors = {};
  checkRoles(roles, e);
  if (Object.keys(e).length) return fail(e);
  const sorted = ACCOUNT_ROLES.filter((r) => roles.includes(r));
  if (sorted.join() === ACCOUNT_ROLES.filter((r) => m.roles.includes(r)).join()) return fail({ roles: "Sin cambios en los roles." });
  return commit(s, { ...s, members: s.members.map((x) => (x.id === id ? { ...x, roles: sorted } : x)) }, "Roles cambiados", `${m.name}: ${sorted.map((r) => ROLE_LABEL[r]).join(", ")}`);
}

export function setMemberActive(s: AccountState, id: string, active: boolean): AccountResult {
  const m = s.members.find((x) => x.id === id);
  if (!m) return fail({ member: "Miembro no encontrado." });
  const status = active ? "activo" : "desactivado";
  if (m.status === status) return fail({ member: active ? "El miembro ya está activo." : "El miembro ya está desactivado." });
  return commit(s, { ...s, members: s.members.map((x) => (x.id === id ? { ...x, status } : x)) }, active ? "Miembro reactivado" : "Miembro desactivado", m.name);
}

export interface InviteInput { email: string; roles: AccountRole[]; days: number }
export function invite(s: AccountState, i: InviteInput): AccountResult {
  const e: Errors = {};
  checkEmail(i.email, "email", e);
  checkRoles(i.roles, e);
  if (!Number.isInteger(i.days) || i.days < 1 || i.days > 30) e["days"] = "Entre 1 y 30 días (duración de ejemplo).";
  const email = normEmail(i.email);
  if (!e["email"]) {
    const member = s.members.find((m) => m.email === email);
    if (member) e["email"] = member.status === "activo" ? "Ya es miembro del equipo." : "Ya es miembro desactivado: reactívalo en lugar de invitarlo.";
    else if (pendingInvitations(s).some((x) => x.email === email)) e["email"] = "Ya tiene una invitación pendiente.";
  }
  if (Object.keys(e).length) return fail(e);
  const n = s.seq + 1;
  const id = `inv-n${n}`;
  const expiresAt = new Date(Date.parse(s.now) + i.days * 86400000).toISOString();
  const roles = ACCOUNT_ROLES.filter((r) => i.roles.includes(r));
  return commit(s, { ...s, invitations: [...s.invitations, { id, email, roles, createdAt: s.now, expiresAt, status: "pendiente" }] }, "Invitación simulada", `${email} · caduca ${expiresAt.slice(0, 10)}`, id);
}

export function acceptInvitation(s: AccountState, id: string, name: string): AccountResult {
  const inv = s.invitations.find((x) => x.id === id);
  if (!inv) return fail({ invitation: "Invitación no encontrada." });
  const st = invitationStatus(s, inv);
  if (st !== "pendiente") return fail({ invitation: st === "aceptada" ? "La invitación ya fue aceptada." : st === "revocada" ? "La invitación está revocada." : "La invitación ha caducado." });
  const e: Errors = {};
  checkName(name, "name", e);
  if (s.members.some((m) => m.email === inv.email)) e["invitation"] = "Ese correo ya es miembro.";
  if (Object.keys(e).length) return fail(e);
  const memberId = `mbr-n${s.seq + 1}`;
  const member: Member = { id: memberId, name: name.trim(), email: inv.email, roles: inv.roles, status: "activo" };
  return commit(s, {
    ...s,
    members: [...s.members, member],
    invitations: s.invitations.map((x) => (x.id === id ? { ...x, status: "aceptada", memberId } : x)),
  }, "Aceptación simulada", `${member.name} · ${inv.email}`, memberId);
}

export function revokeInvitation(s: AccountState, id: string): AccountResult {
  const inv = s.invitations.find((x) => x.id === id);
  if (!inv) return fail({ invitation: "Invitación no encontrada." });
  if (inv.status !== "pendiente") return fail({ invitation: inv.status === "revocada" ? "Ya estaba revocada." : "Ya fue aceptada; desactiva al miembro si procede." });
  return commit(s, { ...s, invitations: s.invitations.map((x) => (x.id === id ? { ...x, status: "revocada" } : x)) }, "Invitación revocada", inv.email);
}

export function simulateSignIn(s: AccountState, email: string): AccountResult {
  const e: Errors = {};
  checkEmail(email, "email", e);
  if (Object.keys(e).length) return fail(e);
  return commit(s, { ...s, session: { status: "dentro", email: normEmail(email) } }, "Entrada simulada", normEmail(email));
}
export function simulateRecovery(s: AccountState, email: string): AccountResult {
  const e: Errors = {};
  checkEmail(email, "email", e);
  if (Object.keys(e).length) return fail(e);
  return commit(s, s, "Recuperación simulada (no se envía nada)", normEmail(email));
}
export function simulateSignOut(s: AccountState): AccountResult {
  if (s.session.status === "fuera") return fail({ session: "La sesión simulada ya está cerrada." });
  return commit(s, { ...s, session: { ...s.session, status: "fuera" } }, "Salida simulada", s.session.email);
}

/** Welcome steps derived from state; the team step is optional. */
export function welcomeSteps(s: AccountState) {
  const has = (a: string) => s.history.some((h) => h.action === a);
  const company = has("Empresa actualizada");
  const profile = has("Perfil actualizado");
  return { company, profile, team: activeSeats(s) > 1, complete: company && profile && activeAdmins(s).length >= 1 };
}
