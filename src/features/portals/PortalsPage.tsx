import { useState } from "react";
import { Building2, Home, KeyRound, Users } from "lucide-react";
import { PageHeader, Panel } from "@/features/layout/PageHeader";
import { fieldClass } from "@/features/layout/ui";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import { currentVersion } from "@/features/docs/selectors";
import { PORTAL_COMPANIES, demoPortalGrants, profileLabel, type PortalProfile } from "./data/demo-portal-access";
import {
  ctxKey, isRevoked, permissionsFor, selectableContacts, validRelations, visibleDocuments, sharedThreadMessages,
  type PortalContext,
} from "./selectors";
import { OwnerPortal, ProviderPortal, TenantPortal, btn, btnPrimary } from "./PortalViews";

// Portal demo center. Everything is React memory: no accounts, no links,
// no emails, nothing persisted. Revocations and history reset on "Restaurar demo".

type Mode = "centro" | "portal" | "accesos";
interface HistoryEntry { id: number; text: string }

const cards: { profile: PortalProfile; icon: typeof Home; text: string }[] = [
  { profile: "propietario", icon: Home, text: "Inmuebles vinculados, ocupación, documentos compartidos e incidencias autorizadas." },
  { profile: "inquilino", icon: Users, text: "Contratos propios, cargos y saldo por contrato, documentos compartidos e incidencias." },
  { profile: "proveedor", icon: Building2, text: "Trabajos asignados, mensajes compartidos y preparación de presupuesto o evidencia." },
];

const DemoNotice = () => (
  <p role="note" className="mb-4 rounded-md border border-border bg-muted/50 p-3 text-sm text-foreground">
    Vista de demostración sin acceso real. No hay inicio de sesión ni seguridad implementados; los filtros solo ilustran qué vería cada perfil.
  </p>
);

export function PortalsPage() {
  const [mode, setMode] = useState<Mode>("centro");
  const [ctx, setCtx] = useState<PortalContext>({ companyId: "cartera", profile: "propietario", contactId: "" });
  const [revoked, setRevoked] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const log = (text: string) => setHistory((h) => [...h, { id: h.length + 1, text: `Simulación: ${text}` }]);

  const openPortal = (profile: PortalProfile) => {
    const first = selectableContacts(data, "cartera", profile)[0];
    setCtx({ companyId: "cartera", profile, contactId: first?.id ?? "" });
    setMode("portal");
  };
  const restore = () => { setRevoked(new Set()); setHistory([]); };

  return (
    <div>
      <PageHeader title="Portales" subtitle="Vista de demostración · Sin accesos reales" />
      <DemoNotice />
      {mode === "centro" && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {cards.map(({ profile, icon: Icon, text }) => (
              <section key={profile} aria-labelledby={`portal-${profile}`} className="flex flex-col rounded-lg border border-border bg-card p-5">
                <div className="mb-3 flex items-center gap-2"><Icon className="h-4 w-4 text-primary" aria-hidden="true" /><h2 id={`portal-${profile}`} className="text-sm font-semibold text-foreground">{profileLabel[profile]}</h2></div>
                <p className="flex-1 text-sm text-muted-foreground">{text}</p>
                <button type="button" className={`${btnPrimary} mt-4`} onClick={() => openPortal(profile)}>Ver portal de {profileLabel[profile].toLowerCase()}</button>
              </section>
            ))}
          </div>
          <Panel title="Accesos" className="mt-6">
            <p className="mb-3 text-sm text-muted-foreground">Prepara invitaciones, revocaciones y vistas previas de lo que se compartiría. Solo simulación.</p>
            <button type="button" className={btn} onClick={() => setMode("accesos")}><KeyRound className="mr-2 h-4 w-4" aria-hidden="true" />Preparar accesos</button>
          </Panel>
          <Panel title="Estado del bloque" className="mt-6"><p className="text-sm text-muted-foreground">Liquidaciones: integración pendiente del bloque 09.</p></Panel>
        </>
      )}
      {mode === "portal" && <PortalPreview ctx={ctx} setCtx={setCtx} revoked={revoked} onExit={() => setMode("centro")} onRestore={restore} />}
      {mode === "accesos" && (
        <AccessPanel revoked={revoked} history={history} log={log}
          onRevoke={(ids) => setRevoked((r) => new Set([...r, ...ids]))} onRestore={restore} onExit={() => setMode("centro")} />
      )}
    </div>
  );
}

// ---------------- Portal preview with context selector

export function PortalPreview({ ctx, setCtx, revoked, onExit, onRestore }: {
  ctx: PortalContext; setCtx: (c: PortalContext) => void; revoked: ReadonlySet<string>; onExit: () => void; onRestore: () => void;
}) {
  const contacts = selectableContacts(data, ctx.companyId, ctx.profile);
  const contact = contacts.find((c) => c.id === ctx.contactId);
  const company = PORTAL_COMPANIES.find((c) => c.id === ctx.companyId)!;
  const change = (patch: Partial<PortalContext>) => {
    const next = { ...ctx, ...patch };
    if (patch.companyId || patch.profile) next.contactId = selectableContacts(data, next.companyId, next.profile)[0]?.id ?? "";
    setCtx(next);
  };
  const blocked = contact && isRevoked(ctx, revoked);
  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-end">
        <label className="block flex-1 text-sm"><span className="font-medium">Empresa</span>
          <select className={fieldClass} value={ctx.companyId} onChange={(e) => change({ companyId: e.target.value })}>
            {PORTAL_COMPANIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></label>
        <label className="block flex-1 text-sm"><span className="font-medium">Perfil</span>
          <select className={fieldClass} value={ctx.profile} onChange={(e) => change({ profile: e.target.value as PortalProfile })}>
            {(Object.keys(profileLabel) as PortalProfile[]).map((p) => <option key={p} value={p}>{profileLabel[p]}</option>)}
          </select></label>
        <label className="block flex-1 text-sm"><span className="font-medium">Contacto</span>
          <select className={fieldClass} value={ctx.contactId} disabled={contacts.length === 0} onChange={(e) => change({ contactId: e.target.value })}>
            {contacts.length === 0 && <option value="">Sin contactos relacionados</option>}
            {contacts.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
          </select></label>
        <button type="button" className={btn} onClick={onExit}>Volver a gestión</button>
      </div>
      <p className="mb-4 text-sm text-foreground" aria-live="polite">
        Viendo como: <strong>{profileLabel[ctx.profile]}</strong> · {contact ? `${contact.code} ${contact.name}` : "sin contacto"} · {company.name}
      </p>
      <div key={`${ctxKey(ctx)}|${blocked ? "rev" : "ok"}`}>
        {!contact ? (
          <Panel title="Sin relaciones"><p className="text-sm text-muted-foreground">Esta empresa no tiene contactos con relaciones para este perfil. No se muestra ningún dato.</p></Panel>
        ) : blocked ? (
          <Panel title="Acceso revocado (simulación)">
            <p className="text-sm text-muted-foreground">La vista de este contacto está bloqueada en esta demostración. El expediente interno se conserva sin cambios.</p>
            <button type="button" className={`${btn} mt-3`} onClick={onRestore}>Restaurar demo</button>
          </Panel>
        ) : ctx.profile === "propietario" ? <OwnerPortal ctx={ctx} />
          : ctx.profile === "inquilino" ? <TenantPortal ctx={ctx} />
          : <ProviderPortal ctx={ctx} />}
      </div>
    </div>
  );
}

// ---------------- Prepare access, revocation, share preview

function AccessPanel({ revoked, history, log, onRevoke, onRestore, onExit }: {
  revoked: ReadonlySet<string>; history: HistoryEntry[]; log: (t: string) => void; onRevoke: (ids: string[]) => void; onRestore: () => void; onExit: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2"><button type="button" className={btn} onClick={onExit}>Volver a gestión</button><button type="button" className={btn} onClick={onRestore}>Restaurar demo</button></div>
      <InviteForm log={log} />
      <RevokeForm revoked={revoked} log={log} onRevoke={onRevoke} />
      <SharePreview />
      <Panel title="Historial temporal (simulación)">
        {history.length === 0 ? <p className="text-sm text-muted-foreground">Sin acciones simuladas.</p> : (
          <ol className="list-decimal space-y-1 pl-5 text-sm">{history.map((h) => <li key={h.id}>{h.text}</li>)}</ol>
        )}
      </Panel>
    </div>
  );
}

const portalContacts = (profile: PortalProfile) => data.contacts.filter((c) => c.roles.includes(profile));

function InviteForm({ log }: { log: (t: string) => void }) {
  const [profile, setProfile] = useState<PortalProfile | "">("");
  const [contactId, setContactId] = useState("");
  const [relId, setRelId] = useState("");
  const [summary, setSummary] = useState(false);
  const [msg, setMsg] = useState("");
  const contacts = profile ? portalContacts(profile) : [];
  const relations = profile && contactId ? validRelations(data, contactId, profile) : [];
  const rel = relations.find((r) => r.id === relId);
  const contact = data.contacts.find((c) => c.id === contactId);
  const reset = () => { setSummary(false); setMsg(""); };
  return (
    <Panel title="Preparar invitación">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm"><span className="font-medium">Perfil</span>
          <select className={fieldClass} value={profile} onChange={(e) => { setProfile(e.target.value as PortalProfile); setContactId(""); setRelId(""); reset(); }}>
            <option value="">Elige…</option>{(Object.keys(profileLabel) as PortalProfile[]).map((p) => <option key={p} value={p}>{profileLabel[p]}</option>)}
          </select></label>
        <label className="block text-sm"><span className="font-medium">Contacto</span>
          <select className={fieldClass} value={contactId} disabled={!profile} onChange={(e) => { setContactId(e.target.value); setRelId(""); reset(); }}>
            <option value="">Elige…</option>{contacts.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
          </select></label>
        <label className="block text-sm"><span className="font-medium">Relación</span>
          <select className={fieldClass} value={relId} disabled={relations.length === 0} onChange={(e) => { setRelId(e.target.value); reset(); }}>
            <option value="">{contactId && relations.length === 0 ? "Sin relaciones válidas" : "Elige…"}</option>
            {relations.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select></label>
      </div>
      {contactId && profile && relations.length === 0 && <p className="mt-2 text-sm text-muted-foreground">Este contacto no tiene una relación válida para el perfil elegido; no puede prepararse la invitación.</p>}
      <button type="button" className={`${btnPrimary} mt-3`} disabled={!rel} onClick={() => setSummary(true)}>Ver resumen</button>
      {summary && rel && contact && profile && (
        <div className="mt-3 rounded-md border border-border bg-muted/40 p-3 text-sm" role="region" aria-label="Resumen de la invitación">
          <p>Destinatario ficticio: <strong>{contact.name}</strong> ({contact.email ?? "sin correo"})</p>
          <p>Perfil: {profileLabel[profile]} · Relación: {rel.label} · Empresa: Cartera de ejemplo</p>
          <ul className="mt-2 list-disc pl-5">{permissionsFor[profile].map((p) => <li key={p}>{p}</li>)}</ul>
          <p className="mt-2 text-muted-foreground">No se envía ningún correo ni se genera ningún enlace.</p>
          <button type="button" className={`${btnPrimary} mt-3`} onClick={() => { log(`invitación preparada para ${contact.code} como ${profileLabel[profile].toLowerCase()} (${rel.label}); no enviada.`); setSummary(false); setMsg("Simulación confirmada. Nada se ha enviado."); }}>Confirmar simulación</button>
        </div>
      )}
      {msg && <p role="status" className="mt-2 text-sm text-foreground">{msg}</p>}
    </Panel>
  );
}

function RevokeForm({ revoked, log, onRevoke }: { revoked: ReadonlySet<string>; log: (t: string) => void; onRevoke: (ids: string[]) => void }) {
  const options = [...new Map(demoPortalGrants.map((g) => [`${g.profile}|${g.contactId}`, g])).values()];
  const [key, setKey] = useState("");
  const [preview, setPreview] = useState(false);
  const sel = options.find((g) => `${g.profile}|${g.contactId}` === key);
  const c = sel && data.contacts.find((x) => x.id === sel.contactId);
  const ids = sel ? demoPortalGrants.filter((g) => g.profile === sel.profile && g.contactId === sel.contactId).map((g) => g.id) : [];
  const already = ids.length > 0 && ids.every((i) => revoked.has(i));
  return (
    <Panel title="Revocar acceso (simulación)">
      <label className="block text-sm sm:max-w-md"><span className="font-medium">Acceso de ejemplo</span>
        <select className={fieldClass} value={key} onChange={(e) => { setKey(e.target.value); setPreview(false); }}>
          <option value="">Elige…</option>
          {options.map((g) => { const ct = data.contacts.find((x) => x.id === g.contactId)!; return <option key={g.id} value={`${g.profile}|${g.contactId}`}>{ct.code} · {ct.name} · {profileLabel[g.profile]}</option>; })}
        </select></label>
      <button type="button" className={`${btn} mt-3`} disabled={!sel || already} onClick={() => setPreview(true)}>{already ? "Ya revocado" : "Vista previa de revocación"}</button>
      {preview && sel && c && !already && (
        <div className="mt-3 rounded-md border border-border bg-muted/40 p-3 text-sm" role="region" aria-label="Vista previa de revocación">
          <p>Se bloquearía la vista de <strong>{c.name}</strong> como {profileLabel[sel.profile].toLowerCase()}. El expediente (contratos, documentos, incidencias) se conserva.</p>
          <button type="button" className={`${btnPrimary} mt-3`} onClick={() => { onRevoke(ids); log(`acceso de ${c.code} como ${profileLabel[sel.profile].toLowerCase()} revocado en memoria; expediente conservado.`); setPreview(false); }}>Aplicar en la demostración</button>
        </div>
      )}
    </Panel>
  );
}

function SharePreview() {
  const [item, setItem] = useState("");
  const [recipientKey, setRecipientKey] = useState("");
  const recipients = [...new Map(demoPortalGrants.map((g) => [`${g.profile}|${g.contactId}`, g])).values()];
  const r = recipients.find((g) => `${g.profile}|${g.contactId}` === recipientKey);
  const contact = r && data.contacts.find((c) => c.id === r.contactId);
  const [kind, id] = item.split(":");
  const doc = kind === "doc" ? data.documents.find((d) => d.id === id) : undefined;
  const thread = kind === "thr" ? data.threads.find((t) => t.id === id) : undefined;
  const ctx: PortalContext | undefined = r && { companyId: "cartera", profile: r.profile, contactId: r.contactId };
  const visibleNow = doc && ctx ? visibleDocuments(data, ctx).some((d) => d.id === doc.id) : false;
  return (
    <Panel title="Vista previa de visibilidad">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm"><span className="font-medium">Documento o conversación</span>
          <select className={fieldClass} value={item} onChange={(e) => setItem(e.target.value)}>
            <option value="">Elige…</option>
            <optgroup label="Documentos">{data.documents.map((d) => <option key={d.id} value={`doc:${d.id}`}>{d.title}</option>)}</optgroup>
            <optgroup label="Conversaciones">{data.threads.map((t) => <option key={t.id} value={`thr:${t.id}`}>{t.title}</option>)}</optgroup>
          </select></label>
        <label className="block text-sm"><span className="font-medium">Destinatario</span>
          <select className={fieldClass} value={recipientKey} onChange={(e) => setRecipientKey(e.target.value)}>
            <option value="">Elige…</option>
            {recipients.map((g) => { const ct = data.contacts.find((x) => x.id === g.contactId)!; return <option key={g.id} value={`${g.profile}|${g.contactId}`}>{ct.code} · {ct.name} · {profileLabel[g.profile]}</option>; })}
          </select></label>
      </div>
      {(doc || thread) && r && contact && (
        <div className="mt-3 rounded-md border border-border bg-muted/40 p-3 text-sm" role="region" aria-label="Vista previa externa">
          <p>Destinatario: <strong>{contact.name}</strong> · Perfil: {profileLabel[r.profile]} · Contexto: Cartera de ejemplo</p>
          {doc && (
            <>
              <p className="mt-1">Documento: {doc.title} · versión {currentVersion(doc).version}</p>
              {doc.visibility === "interna" ? (
                <p className="mt-2 font-medium text-destructive">Advertencia: documento interno. No se muestra su contenido en vistas externas.</p>
              ) : <p className="mt-2">{currentVersion(doc).content}</p>}
              <p className="mt-2 text-muted-foreground">{visibleNow ? "Hoy ya aparece en el portal de este contacto." : "Hoy no aparece en el portal de este contacto: requiere destinatario explícito y relación autorizada con su registro."}</p>
            </>
          )}
          {thread && (
            <>
              <p className="mt-1">Conversación: {thread.title}</p>
              {sharedThreadMessages(thread).length ? <ul className="mt-2 space-y-1">{sharedThreadMessages(thread).map((m) => <li key={m.id}>{m.text}</li>)}</ul> : <p>Sin mensajes compartidos.</p>}
              <p className="mt-2 text-muted-foreground">Las notas internas nunca se muestran en vistas externas.</p>
            </>
          )}
          <p className="mt-2 text-muted-foreground">Nada se envía, publica ni cambia la visibilidad del original.</p>
        </div>
      )}
    </Panel>
  );
}
