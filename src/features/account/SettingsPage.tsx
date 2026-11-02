import { useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/features/layout/PageHeader";
import { fieldClass, linkClass } from "@/features/layout/ui";
import { useAccount } from "./AccountContext";
import { DEMO_INVITE_DAYS } from "./data/demo-account";
import {
  ACCOUNT_ROLES, COMPANY_MODES, MODE_LABEL, ROLE_LABEL, invitationStatus,
  type AccountResult, type AccountRole, type CompanyMode, type Errors, type Prefs,
} from "./engine";

const focusFirst = (prefix: string, errors: Errors) => {
  const k = Object.keys(errors)[0];
  if (k) requestAnimationFrame(() => document.getElementById(`${prefix}-${k}`)?.focus());
};

function Field({ id, label, error, children }: { id: string; label: string; error?: string | undefined; children: ReactNode }) {
  return (
    <div className="text-sm">
      <label htmlFor={id} className="font-medium">{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="mt-1 text-destructive">{error}</p>}
    </div>
  );
}
const aria = (id: string, error?: string) => (error ? { "aria-invalid": true, "aria-describedby": `${id}-error` } : {});

export const ROLES_NOTICE = "Los roles de ejemplo no restringen pantallas ni separan datos. Hay una sola empresa ficticia; no hay aislamiento entre empresas.";

function CompanySection() {
  const a = useAccount();
  const c = a.state.company;
  const [draft, setDraft] = useState<{ name: string; contactEmail: string; phone: string; mode: CompanyMode } | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [msg, setMsg] = useState("");
  const editBtn = useRef<HTMLButtonElement>(null);
  const close = () => { setDraft(null); setErrors({}); requestAnimationFrame(() => editBtn.current?.focus()); };
  const save = () => {
    if (!draft) return;
    const r = a.updateCompany({ name: draft.name, contactEmail: draft.contactEmail, phone: draft.phone, mode: draft.mode });
    if (!r.ok) { setErrors(r.errors); focusFirst("emp", r.errors); return; }
    setMsg("Empresa guardada en esta demostración (solo en memoria)."); close();
  };
  return (
    <Panel title="Empresa">
      {!draft ? (
        <>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Nombre</dt><dd>{c.name}</dd></div>
            <div><dt className="text-muted-foreground">Correo de contacto</dt><dd>{c.contactEmail}</dd></div>
            <div><dt className="text-muted-foreground">Teléfono</dt><dd>{c.phone ?? "—"}</dd></div>
            <div><dt className="text-muted-foreground">Modalidad</dt><dd>{MODE_LABEL[c.mode]}</dd></div>
            <div><dt className="text-muted-foreground">Moneda</dt><dd>{c.currency} (fija)</dd></div>
            <div><dt className="text-muted-foreground">Zona horaria</dt><dd>{c.timeZone} (fija)</dd></div>
          </dl>
          <Button ref={editBtn} className="mt-4" variant="outline" onClick={() => { setMsg(""); setDraft({ name: c.name, contactEmail: c.contactEmail, phone: c.phone ?? "", mode: c.mode }); }}>Editar empresa</Button>
        </>
      ) : (
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save(); }} aria-label="Editar empresa">
          <Field id="emp-name" label="Nombre de la empresa" error={errors["name"]}><input id="emp-name" className={fieldClass} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} {...aria("emp-name", errors["name"])} /></Field>
          <Field id="emp-contactEmail" label="Correo de contacto ficticio" error={errors["contactEmail"]}><input id="emp-contactEmail" className={fieldClass} value={draft.contactEmail} onChange={(e) => setDraft({ ...draft, contactEmail: e.target.value })} {...aria("emp-contactEmail", errors["contactEmail"])} /></Field>
          <Field id="emp-phone" label="Teléfono (opcional)" error={errors["phone"]}><input id="emp-phone" className={fieldClass} value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} {...aria("emp-phone", errors["phone"])} /></Field>
          <Field id="emp-mode" label="Modalidad" error={errors["mode"]}>
            <select id="emp-mode" className={fieldClass} value={draft.mode} onChange={(e) => setDraft({ ...draft, mode: e.target.value as CompanyMode })}>
              {COMPANY_MODES.map((m) => <option key={m} value={m}>{MODE_LABEL[m]}</option>)}
            </select>
          </Field>
          <div className="flex gap-2 sm:col-span-2"><Button type="submit">Guardar empresa</Button><Button type="button" variant="outline" onClick={close}>Cancelar</Button></div>
        </form>
      )}
      {msg && <p role="status" className="mt-3 text-sm">{msg}</p>}
    </Panel>
  );
}

function ProfileSection() {
  const a = useAccount();
  const p = a.profile;
  const prefs = a.state.profile.prefs;
  const [draft, setDraft] = useState<{ name: string; email: string; prefs: Prefs } | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [msg, setMsg] = useState("");
  const editBtn = useRef<HTMLButtonElement>(null);
  const close = () => { setDraft(null); setErrors({}); requestAnimationFrame(() => editBtn.current?.focus()); };
  const save = () => {
    if (!draft) return;
    const r = a.updateProfile(draft);
    if (!r.ok) { setErrors(r.errors); focusFirst("per", r.errors); return; }
    setMsg("Perfil guardado en esta demostración (solo en memoria)."); close();
  };
  const PREFS: [keyof Prefs, string][] = [["vencimientos", "Avisos de vencimientos"], ["incidencias", "Avisos de incidencias"], ["avisos", "Resumen de avisos"]];
  return (
    <Panel title="Perfil">
      {!draft ? (
        <>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Nombre</dt><dd>{p?.name}</dd></div>
            <div><dt className="text-muted-foreground">Correo ficticio</dt><dd>{p?.email}</dd></div>
            <div className="sm:col-span-2"><dt className="text-muted-foreground">Preferencias (solo locales, no se envía nada)</dt><dd>{PREFS.filter(([k]) => prefs[k]).map(([, l]) => l).join(", ") || "Ninguna"}</dd></div>
          </dl>
          <Button ref={editBtn} className="mt-4" variant="outline" onClick={() => { setMsg(""); setDraft({ name: p?.name ?? "", email: p?.email ?? "", prefs: { ...prefs } }); }}>Editar perfil</Button>
        </>
      ) : (
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save(); }} aria-label="Editar perfil">
          <Field id="per-name" label="Nombre" error={errors["name"]}><input id="per-name" className={fieldClass} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} {...aria("per-name", errors["name"])} /></Field>
          <Field id="per-email" label="Correo ficticio" error={errors["email"]}><input id="per-email" className={fieldClass} value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} {...aria("per-email", errors["email"])} /></Field>
          <fieldset className="sm:col-span-2 text-sm"><legend className="font-medium">Preferencias de aviso (locales)</legend>
            {PREFS.map(([k, l]) => <label key={k} className="mr-4 inline-flex items-center gap-2"><input type="checkbox" checked={draft.prefs[k]} onChange={(e) => setDraft({ ...draft, prefs: { ...draft.prefs, [k]: e.target.checked } })} />{l}</label>)}
          </fieldset>
          <div className="flex gap-2 sm:col-span-2"><Button type="submit">Guardar perfil</Button><Button type="button" variant="outline" onClick={close}>Cancelar</Button></div>
        </form>
      )}
      {msg && <p role="status" className="mt-3 text-sm">{msg}</p>}
    </Panel>
  );
}

function RolesPicker({ legend, value, onChange, idPrefix }: { legend: string; value: AccountRole[]; onChange: (r: AccountRole[]) => void; idPrefix: string }) {
  return (
    <fieldset className="text-sm"><legend className="font-medium">{legend}</legend>
      {ACCOUNT_ROLES.map((r) => (
        <label key={r} className="mr-3 inline-flex items-center gap-1.5">
          <input id={`${idPrefix}-${r}`} type="checkbox" checked={value.includes(r)} onChange={(e) => onChange(e.target.checked ? [...value, r] : value.filter((x) => x !== r))} />{ROLE_LABEL[r]}
        </label>
      ))}
    </fieldset>
  );
}

function TeamSection() {
  const a = useAccount();
  const s = a.state;
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const errRef = useRef<HTMLParagraphElement>(null);
  const [inv, setInv] = useState<{ email: string; roles: AccountRole[]; days: string }>({ email: "", roles: ["consulta"], days: String(DEMO_INVITE_DAYS) });
  const [invErrors, setInvErrors] = useState<Errors>({});
  const [names, setNames] = useState<Record<string, string>>({});
  const handle = (r: AccountResult, ok: string) => {
    if (!r.ok) { setMsg(""); setError(r.message); requestAnimationFrame(() => errRef.current?.focus()); return false; }
    setError(""); setMsg(ok); return true;
  };
  return (
    <Panel title="Equipo y roles">
      <p className="mb-3 text-sm text-muted-foreground">{ROLES_NOTICE} Plazas ocupadas: <strong data-testid="seats">{a.activeSeats}</strong> (una por persona activa, no por rol). Las invitaciones pendientes no ocupan plaza en esta demostración.</p>
      {error && <p ref={errRef} tabIndex={-1} role="alert" className="mb-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      {msg && <p role="status" className="mb-3 text-sm">{msg}</p>}
      <ul className="divide-y divide-border">
        {s.members.map((m) => (
          <li key={m.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm"><p className="font-medium">{m.name} {m.id === s.profile.memberId && <span className="text-muted-foreground">(tu perfil)</span>}</p><p className="text-muted-foreground">{m.email} · {m.status === "activo" ? "Activo" : "Desactivado"}</p></div>
            <div className="flex flex-col gap-2 sm:items-end">
              <RolesPicker legend={`Roles de ${m.name}`} value={m.roles} idPrefix={`rol-${m.id}`} onChange={(r) => handle(a.setRoles(m.id, r), `Roles de ${m.name} cambiados.`)} />
              <Button size="sm" variant="outline" onClick={() => handle(a.setActive(m.id, m.status !== "activo"), m.status === "activo" ? `${m.name} desactivado.` : `${m.name} reactivado.`)}>
                {m.status === "activo" ? `Desactivar a ${m.name}` : `Reactivar a ${m.name}`}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <h3 className="mt-6 text-sm font-semibold">Invitaciones simuladas</h3>
      <p className="text-xs text-muted-foreground">Objetos de demostración: no se envía nada ni se concede acceso. Duración de ejemplo, no es una política comercial.</p>
      <ul className="mt-2 divide-y divide-border">
        {s.invitations.map((i) => {
          const st = invitationStatus(s, i);
          return (
            <li key={i.id} className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-medium">{i.email}</p><p className="text-muted-foreground">{i.roles.map((r) => ROLE_LABEL[r]).join(", ")} · {st} · caduca {i.expiresAt.slice(0, 16).replace("T", " ")} UTC (reloj simulado)</p></div>
              {st === "pendiente" && (
                <div className="flex flex-wrap items-end gap-2">
                  <label className="text-xs">Nombre al aceptar<input aria-label={`Nombre para ${i.email}`} className={fieldClass} value={names[i.id] ?? ""} onChange={(e) => setNames({ ...names, [i.id]: e.target.value })} /></label>
                  <Button size="sm" onClick={() => handle(a.accept(i.id, names[i.id] ?? ""), `Aceptación simulada de ${i.email}.`)}>Simular aceptación de {i.email}</Button>
                  <Button size="sm" variant="outline" onClick={() => handle(a.revoke(i.id), `Invitación de ${i.email} revocada.`)}>Revocar {i.email}</Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <form className="mt-4 grid gap-3 sm:grid-cols-3" aria-label="Nueva invitación simulada" onSubmit={(e) => {
        e.preventDefault();
        const r = a.invite({ email: inv.email, roles: inv.roles, days: Number(inv.days) });
        if (!r.ok) { setInvErrors(r.errors); focusFirst("inv", r.errors); return; }
        setInvErrors({}); setInv({ email: "", roles: ["consulta"], days: String(DEMO_INVITE_DAYS) }); setError(""); setMsg("Invitación simulada creada. No se ha enviado nada.");
      }}>
        <Field id="inv-email" label="Correo ficticio" error={invErrors["email"]}><input id="inv-email" className={fieldClass} value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} {...aria("inv-email", invErrors["email"])} /></Field>
        <Field id="inv-days" label="Caducidad en días (ejemplo)" error={invErrors["days"]}><input id="inv-days" inputMode="numeric" className={fieldClass} value={inv.days} onChange={(e) => setInv({ ...inv, days: e.target.value })} {...aria("inv-days", invErrors["days"])} /></Field>
        <div id="inv-roles" tabIndex={-1}><RolesPicker legend="Roles de la invitación" value={inv.roles} idPrefix="inv-rol" onChange={(r) => setInv({ ...inv, roles: r })} />{invErrors["roles"] && <p className="text-sm text-destructive">{invErrors["roles"]}</p>}</div>
        <div className="sm:col-span-3"><Button type="submit">Crear invitación simulada</Button></div>
      </form>
    </Panel>
  );
}

function HistorySection() {
  const { state } = useAccount();
  return (
    <Panel title="Historial simulado">
      {!state.history.length ? <p className="text-sm text-muted-foreground">Sin cambios en esta sesión de demostración.</p> : (
        <ol className="space-y-1 text-sm">{state.history.map((h) => <li key={h.id}>{h.at.slice(0, 16).replace("T", " ")} UTC · {h.actor} · {h.action} · {h.detail}</li>)}</ol>
      )}
    </Panel>
  );
}

export function SettingsPage() {
  const a = useAccount();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        subtitle="Empresa, perfil y equipo de ejemplo. Los cambios viven solo en esta pestaña y se pierden al recargar."
        actions={<Button variant="outline" onClick={a.reset}>Restablecer cuenta de ejemplo</Button>}
      />
      <p className="text-sm"><Link to="/bienvenida" className={linkClass}>Ir a la bienvenida</Link> · <Link to="/acceso" className={linkClass}>Acceso simulado</Link></p>
      <CompanySection />
      <ProfileSection />
      <TeamSection />
      <HistorySection />
    </div>
  );
}
