import { useEffect, useState } from "react";
import { Building2, Home, KeyRound, Users } from "lucide-react";
import { PageHeader, Panel } from "@/features/layout/PageHeader";
import { fieldClass } from "@/features/layout/ui";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import { currentVersion } from "@/features/docs/selectors";
import { PORTAL_COMPANIES, demoPortalGrants, profileLabel, type PortalProfile } from "./data/demo-portal-access";
import {
  ctxKey, isRevoked, permissionsFor, selectableContacts, validRelations, visibleDocuments, visibleThreadMessages,
  type PortalContext,
} from "./selectors";
import { OwnerPortal, ProviderPortal, SettlementSummary, TenantPortal, btn, btnPrimary, monthLabel, usePortalLabels } from "./PortalViews";
import { usePortalSharing } from "./PortalShareContext";
import { shareEligibility, shareVersion, sharedSettlementsFor, type ShareDeps, type ShareTarget } from "./settlement-projection";
import { useSettlements } from "@/features/settlements/SettlementContext";

// Portal demo center. Everything is React memory: no accounts, no links,
// no emails, nothing persisted. Revocations and settlement shares live in
// PortalShareContext; "Restaurar demo" restores grants without reviving shares.

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
  const sharing = usePortalSharing();
  const [mode, setMode] = useState<Mode>("centro");
  const [ctx, setCtx] = useState<PortalContext>({ companyId: "cartera", profile: "propietario", contactId: "" });
  // Single revocation state for every profile, document, thread and settlement.
  const revoked = sharing.revoked;
  const revokeMany = (ids: string[]) => ids.forEach((id) => sharing.revoke(id));
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const log = (text: string) => setHistory((h) => [...h, { id: h.length + 1, text: `Simulación: ${text}` }]);

  const openPortal = (profile: PortalProfile) => {
    const first = selectableContacts(data, "cartera", profile)[0];
    setCtx({ companyId: "cartera", profile, contactId: first?.id ?? "" });
    setMode("portal");
  };
  // Restores grants only: shares stay inactive and their history is kept.
  const restore = () => { sharing.state.revokedGrants.forEach((id) => sharing.restore(id)); setHistory([]); };

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
          <Panel title="Estado del bloque" className="mt-6"><p className="text-sm text-muted-foreground">Liquidaciones: el portal del propietario solo muestra versiones aprobadas que se compartan expresamente desde Preparar accesos.</p></Panel>
        </>
      )}
      {mode === "portal" && (
        <PortalPreview ctx={ctx} setCtx={setCtx} revoked={revoked} onExit={() => setMode("centro")} onRestore={restore}
          onRevokeCurrent={() => {
            const ids = demoPortalGrants.filter((g) => g.companyId === ctx.companyId && g.profile === ctx.profile && g.contactId === ctx.contactId).map((g) => g.id);
            if (ids.length === 0) return;
            revokeMany(ids);
            log(`acceso de ${ctx.contactId.toUpperCase()} como ${profileLabel[ctx.profile].toLowerCase()} revocado en memoria; expediente conservado.`);
          }} />
      )}
      {mode === "accesos" && (
        <AccessPanel revoked={revoked} history={history} log={log}
          onRevoke={revokeMany} onRestore={restore} onExit={() => setMode("centro")} />
      )}
    </div>
  );
}

// ---------------- Portal preview with context selector

export function PortalPreview({ ctx, setCtx, revoked, onExit, onRestore, onRevokeCurrent }: {
  ctx: PortalContext; setCtx: (c: PortalContext) => void; revoked: ReadonlySet<string>; onExit: () => void; onRestore: () => void; onRevokeCurrent?: () => void;
}) {
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const L = usePortalLabels();
  const contacts = selectableContacts(data, ctx.companyId, ctx.profile);
  const contact = contacts.find((c) => c.id === ctx.contactId);
  const company = PORTAL_COMPANIES.find((c) => c.id === ctx.companyId)!;
  const change = (patch: Partial<PortalContext>) => {
    // Any context change invalidates an open revocation confirmation: a new
    // preview is required for the new company/profile/contact.
    setConfirmRevoke(false);
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
            {contacts.map((c) => <option key={c.id} value={c.id}>{L.contactLine(c.id, c)}</option>)}
          </select></label>
        <button type="button" className={btn} onClick={onExit}>Volver a gestión</button>
      </div>
      <p className="mb-4 text-sm text-foreground" aria-live="polite">
        Viendo como: <strong>{profileLabel[ctx.profile]}</strong> · {contact ? L.contactLine(contact.id, contact, " ") : "sin contacto"} · {company.name}
      </p>
      {contact && !blocked && onRevokeCurrent && demoPortalGrants.some((g) => g.companyId === ctx.companyId && g.profile === ctx.profile && g.contactId === ctx.contactId) && (
        <div className="mb-4 text-sm">
          {confirmRevoke ? (
            <div className="rounded-md border border-border bg-muted/40 p-3" role="region" aria-label="Vista previa de revocación">
              <p>Contacto: <strong>{L.contactLine(contact.id, contact, " ")}</strong> · Perfil: {profileLabel[ctx.profile]} · Empresa: {company.name}</p>
              <p className="mt-1">Se bloquearía esta vista de demostración; el expediente interno se conserva.</p>
              <div className="mt-2 flex gap-2"><button type="button" className={btnPrimary} onClick={() => { setConfirmRevoke(false); onRevokeCurrent(); }}>Aplicar en la demostración</button><button type="button" className={btn} onClick={() => setConfirmRevoke(false)}>Cancelar</button></div>
            </div>
          ) : <button type="button" className={btn} onClick={() => setConfirmRevoke(true)}>Simular revocación de este acceso</button>}
        </div>
      )}
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
      <SharePreview revoked={revoked} />
      <SettlementSharePanel />
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
  const L = usePortalLabels();
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
            <option value="">Elige…</option>{contacts.map((c) => <option key={c.id} value={c.id}>{L.contactLine(c.id, c)}</option>)}
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
          <p>Destinatario ficticio: <strong>{L.contact(contact.id, contact).name}</strong> ({contact.email ?? "sin correo"})</p>
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
  const L = usePortalLabels();
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
          {options.map((g) => { const ct = data.contacts.find((x) => x.id === g.contactId)!; return <option key={g.id} value={`${g.profile}|${g.contactId}`}>{L.contactLine(ct.id, ct)} · {profileLabel[g.profile]}</option>; })}
        </select></label>
      <button type="button" className={`${btn} mt-3`} disabled={!sel || already} onClick={() => setPreview(true)}>{already ? "Ya revocado" : "Vista previa de revocación"}</button>
      {preview && sel && c && !already && (
        <div className="mt-3 rounded-md border border-border bg-muted/40 p-3 text-sm" role="region" aria-label="Vista previa de revocación">
          <p>Se bloquearía la vista de <strong>{L.contact(c.id, c).name}</strong> como {profileLabel[sel.profile].toLowerCase()}. El expediente (contratos, documentos, incidencias) se conserva.</p>
          <button type="button" className={`${btnPrimary} mt-3`} onClick={() => { onRevoke(ids); log(`acceso de ${c.code} como ${profileLabel[sel.profile].toLowerCase()} revocado en memoria; expediente conservado.`); setPreview(false); }}>Aplicar en la demostración</button>
        </div>
      )}
    </Panel>
  );
}

function SharePreview({ revoked }: { revoked: ReadonlySet<string> }) {
  const L = usePortalLabels();
  const [item, setItem] = useState("");
  const [recipientKey, setRecipientKey] = useState("");
  const recipients = [...new Map(demoPortalGrants.map((g) => [`${g.profile}|${g.contactId}`, g])).values()];
  const r = recipients.find((g) => `${g.profile}|${g.contactId}` === recipientKey);
  const contact = r && data.contacts.find((c) => c.id === r.contactId);
  const [kind, id] = item.split(":");
  const doc = kind === "doc" ? data.documents.find((d) => d.id === id) : undefined;
  const thread = kind === "thr" ? data.threads.find((t) => t.id === id) : undefined;
  const ctx: PortalContext | undefined = r && { companyId: "cartera", profile: r.profile, contactId: r.contactId };
  // Revocations apply to every visibility derivation, including this preview.
  const ctxRevoked = ctx ? isRevoked(ctx, revoked) : false;
  const visibleNow = !!(doc && ctx && visibleDocuments(data, ctx, revoked).some((d) => d.id === doc.id));
  const threadMsgs = thread && ctx ? visibleThreadMessages(data, ctx, thread, revoked) : null;
  const notVisibleReason = ctxRevoked
    ? "El acceso de este contacto está revocado en esta demostración: nada aparece en su portal hasta restaurar la demo."
    : "Hoy no aparece en el portal de este contacto: requiere destinatario explícito y relación autorizada con su registro.";
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
            {recipients.map((g) => { const ct = data.contacts.find((x) => x.id === g.contactId)!; return <option key={g.id} value={`${g.profile}|${g.contactId}`}>{L.contactLine(ct.id, ct)} · {profileLabel[g.profile]}</option>; })}
          </select></label>
      </div>
      {(doc || thread) && r && contact && (
        <div className="mt-3 rounded-md border border-border bg-muted/40 p-3 text-sm" role="region" aria-label="Vista previa externa">
          <p>Destinatario: <strong>{L.contact(contact.id, contact).name}</strong> · Perfil: {profileLabel[r.profile]} · Contexto: Cartera de ejemplo</p>
          {doc && (
            <>
              <p className="mt-1">Documento: {doc.title} · versión {currentVersion(doc).version}</p>
              {doc.visibility === "interna" ? (
                <p className="mt-2 font-medium text-destructive">Advertencia: documento interno. No se muestra su contenido en vistas externas.</p>
              ) : visibleNow ? (
                <>
                  <p className="mt-2">{currentVersion(doc).content}</p>
                  <p className="mt-2 text-muted-foreground">Hoy ya aparece en el portal de este contacto.</p>
                </>
              ) : (
                <p className="mt-2 text-muted-foreground">{notVisibleReason}</p>
              )}
            </>
          )}
          {thread && (
            <>
              <p className="mt-1">Conversación: {thread.title}</p>
              {threadMsgs === null ? (
                <p className="mt-2 text-muted-foreground">{ctxRevoked ? notVisibleReason : "Hoy no aparece en el portal de este contacto: la conversación requiere relación autorizada con su registro; un mensaje compartido no es visible para cualquier contacto."}</p>
              ) : threadMsgs.length ? (
                <>
                  <ul className="mt-2 space-y-1">{threadMsgs.map((m) => <li key={m.id}>{m.text}</li>)}</ul>
                  <p className="mt-2 text-muted-foreground">Solo se muestran los mensajes compartidos de una conversación autorizada para este contacto.</p>
                </>
              ) : (
                <p className="mt-2">Sin mensajes compartidos.</p>
              )}
              <p className="mt-2 text-muted-foreground">Las notas internas nunca se muestran en vistas externas.</p>
            </>
          )}
          <p className="mt-2 text-muted-foreground">Nada se envía, publica ni cambia la visibilidad del original.</p>
        </div>
      )}
    </Panel>
  );
}

// ---------------- Share an approved settlement version (demo)

const COMPANY = "cartera";
const actionLabel: Record<string, string> = {
  compartir: "Compartida", reemplazar: "Sustituida por nueva versión", retirar: "Retirada",
  revocar_acceso: "Acceso revocado", restaurar_acceso: "Acceso restaurado",
};
const endLabel: Record<string, string> = { reemplazada: "Sustituida", retirada: "Retirada", revocada: "Inactiva por revocación" };

function SettlementSharePanel() {
  const sharing = usePortalSharing();
  const { state: settlements } = useSettlements();
  const deps: ShareDeps = { data, settlements };
  const L = usePortalLabels();
  // Display only: current names by ID; sharing targets, stamps and projections stay base.
  const contactLabel = (id: string) => { const ct = data.contacts.find((x) => x.id === id); return ct ? L.contactLine(id, ct) : id; };
  const ctxName = (id: string) => L.contextName(id);
  const labelOf = (settlementId: string) => {
    const s = settlements.settlements.find((x) => x.id === settlementId);
    return s ? `${ctxName(s.contextId)} · ${monthLabel(s.month)}` : settlementId;
  };
  const options = settlements.settlements.flatMap((s) => s.versions.filter((v) => v.status === "aprobado").map((v) => ({
    key: `${s.id}|${v.number}`, settlementId: s.id, version: v.number, label: `${ctxName(s.contextId)} · ${monthLabel(s.month)} · versión ${v.number}`,
  })));
  const recipients = demoPortalGrants.filter((g) => g.companyId === COMPANY && g.profile === "propietario");
  const [optKey, setOptKey] = useState("");
  const [contactId, setContactId] = useState("");
  const [previewStamp, setPreviewStamp] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [withdrawId, setWithdrawId] = useState<string | null>(null);

  const opt = options.find((o) => o.key === optKey);
  const target: ShareTarget | null = opt && contactId ? { companyId: COMPANY, contactId, settlementId: opt.settlementId, version: opt.version } : null;
  const active = target ? sharing.activeShare(target) : undefined;
  // Any change of selection, active share or revocations invalidates the preview.
  const stamp = target ? [optKey, contactId, sharing.state.revokedGrants.join(","), active?.id ?? "", active?.version ?? ""].join("|") : "";
  const previewValid = previewStamp !== null && previewStamp === stamp;
  // Discard a stale preview irrevocably so restoring revocations cannot revive it.
  useEffect(() => { if (previewStamp !== null && previewStamp !== stamp) setPreviewStamp(null); }, [previewStamp, stamp]);
  let candidate: ReturnType<typeof sharedSettlementsFor>[number] | null = null;
  if (previewValid && target) {
    // Pure candidate state: never calls sharing.share nor mutates anything.
    const r = shareVersion(sharing.state, target, deps);
    candidate = r.ok ? sharedSettlementsFor(r.state, { companyId: COMPANY, profile: "propietario", contactId }, deps).find((p) => p.settlementId === target.settlementId) ?? null : null;
  }
  const sameVersion = !!(active && target && active.version === target.version);
  const clear = () => { setPreviewStamp(null); setError(""); setMsg(""); };

  const preview = () => {
    if (!target) return;
    setMsg("");
    const e = shareEligibility(target, deps, sharing.state.revokedGrants);
    if (e) { setError(e); setPreviewStamp(null); return; }
    setError(""); setPreviewStamp(stamp);
  };
  const confirm = () => {
    if (!target || !previewValid) return;
    const e = shareEligibility(target, deps, sharing.state.revokedGrants);
    if (e) { setError(e); setPreviewStamp(null); return; }
    const r = sharing.share(target);
    setPreviewStamp(null);
    if (!r.ok) { setError(r.error); return; }
    setError("");
    setMsg(!r.changed ? "Esta versión ya estaba compartida; no se duplica." : active ? `Versión ${target.version} compartida en sustitución de la versión ${active.version}.` : `Versión ${target.version} compartida en la demostración.`);
  };

  const activeShares = sharing.state.shares.filter((s) => s.active);
  const pendingWithdraw = withdrawId ? activeShares.find((s) => s.id === withdrawId) : undefined;

  return (
    <Panel title="Compartir liquidación (demostración)">
      <p className="mb-3 text-sm text-muted-foreground">Empresa: Cartera de ejemplo. Solo se comparten versiones aprobadas con el propietario actual del inmueble y con acceso activo.</p>
      {options.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay versiones aprobadas. Prepara, revisa y aprueba una liquidación en Dinero → Liquidaciones; después podrás compartirla aquí.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm"><span className="font-medium">Liquidación y versión</span>
              <select className={fieldClass} value={optKey} onChange={(e) => { setOptKey(e.target.value); clear(); }}>
                <option value="">Elige…</option>{options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select></label>
            <label className="block text-sm"><span className="font-medium">Destinatario de liquidación</span>
              <select className={fieldClass} value={contactId} onChange={(e) => { setContactId(e.target.value); clear(); }}>
                <option value="">Elige…</option>{recipients.map((g) => <option key={g.id} value={g.contactId}>{contactLabel(g.contactId)} · Propietario</option>)}
              </select></label>
          </div>
          {active && target && <p className="mt-2 text-sm text-foreground">Versión compartida ahora con este destinatario: {active.version}.{sameVersion ? " Es la versión elegida." : " Confirmar la elegida la sustituirá."}</p>}
          <button type="button" className={`${btn} mt-3`} disabled={!target} onClick={preview}>Ver vista previa de liquidación</button>
          {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
          {previewValid && target && candidate && (
            <div className="mt-3 rounded-md border border-border bg-muted/40 p-3 text-sm" role="region" aria-label="Vista previa de liquidación compartida">
              <p className="mb-2">Destinatario: <strong>{contactLabel(target.contactId)}</strong> · Inmueble: {L.settlementProperty(candidate)} · Mes: {monthLabel(candidate.month)} · Versión: {candidate.version}</p>
              <SettlementSummary p={candidate} />
              <p className="mt-2 text-muted-foreground">Vista previa: aún no se ha compartido. Nada se envía ni se publica.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={btnPrimary} disabled={sameVersion} onClick={confirm}>{sameVersion ? "Ya compartida" : "Confirmar compartición"}</button>
                <button type="button" className={btn} onClick={() => setPreviewStamp(null)}>Cancelar</button>
              </div>
            </div>
          )}
        </>
      )}
      {msg && <p role="status" className="mt-2 text-sm text-foreground">{msg}</p>}

      <h3 className="mt-5 text-sm font-semibold text-foreground">Comparticiones</h3>
      {sharing.state.shares.length === 0 ? <p className="text-sm text-muted-foreground">Ninguna liquidación compartida.</p> : (
        <ul className="divide-y divide-border text-sm" aria-label="Comparticiones">
          {sharing.state.shares.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>{labelOf(s.settlementId)} · versión {s.version} · {contactLabel(s.contactId)} · <strong>{s.active ? "Activa" : endLabel[s.endedReason ?? ""] ?? "Inactiva"}</strong></span>
              {s.active && <button type="button" className={btn} onClick={() => setWithdrawId(s.id)} aria-label={`Retirar compartición versión ${s.version}`}>Retirar compartición</button>}
            </li>
          ))}
        </ul>
      )}
      {pendingWithdraw && (
        <div className="mt-3 rounded-md border border-border bg-muted/40 p-3 text-sm" role="region" aria-label="Confirmar retirada">
          <p>Se dejará de mostrar la versión {pendingWithdraw.version} de {labelOf(pendingWithdraw.settlementId)} a {contactLabel(pendingWithdraw.contactId)}. Para volver a mostrarla habrá que compartirla de nuevo.</p>
          <div className="mt-2 flex gap-2">
            <button type="button" className={btnPrimary} onClick={() => { sharing.withdraw(pendingWithdraw); setWithdrawId(null); clear(); setMsg("Compartición retirada en la demostración."); }}>Confirmar retirada</button>
            <button type="button" className={btn} onClick={() => setWithdrawId(null)}>Cancelar</button>
          </div>
        </div>
      )}
      <h3 className="mt-5 text-sm font-semibold text-foreground">Historial de compartición</h3>
      {sharing.state.log.length === 0 ? <p className="text-sm text-muted-foreground">Sin acciones de compartición.</p> : (
        <ol className="list-decimal space-y-1 pl-5 text-sm" aria-label="Historial de compartición">
          {sharing.state.log.map((e) => (
            <li key={e.seq}>Paso {e.seq}: {actionLabel[e.action]} · {contactLabel(e.contactId)}{e.settlementId ? ` · ${labelOf(e.settlementId)}` : ""}{e.version !== undefined ? ` · versión ${e.version}` : ""}</li>
          ))}
        </ol>
      )}
      <p className="mt-2 text-xs text-muted-foreground">Pasos numerados de la simulación; no son fechas reales.</p>
    </Panel>
  );
}
