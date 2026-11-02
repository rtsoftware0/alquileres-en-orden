import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/features/layout/PageHeader";
import { fieldClass } from "@/features/layout/ui";
import { useAccount } from "./AccountContext";
import type { AccountResult } from "./engine";

export const NO_SEND = "Simulación: no se envía nada";

export function AccessPage() {
  const a = useAccount();
  const [email, setEmail] = useState(a.state.session.email);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const done = (r: AccountResult, ok: string) => {
    if (!r.ok) { setMsg(""); setError(r.message); requestAnimationFrame(() => document.getElementById("acc-email")?.focus()); return; }
    setError(""); setMsg(ok);
  };
  const s = a.state.session;
  return (
    <div className="space-y-6">
      <PageHeader title="Acceso simulado" subtitle={`${NO_SEND}. No hay contraseñas, códigos ni acceso protegido: todas las pantallas siguen visibles.`} />
      <Panel title={`Sesión simulada: ${s.status === "dentro" ? `dentro como ${s.email}` : "cerrada"}`}>
        {s.status === "fuera" && <p className="mb-3 text-sm">Has salido de la sesión simulada. Los datos de ejemplo siguen visibles porque no existe acceso real.</p>}
        <div className="max-w-sm text-sm">
          <label htmlFor="acc-email" className="font-medium">Correo ficticio</label>
          <input id="acc-email" className={fieldClass} value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={Boolean(error) || undefined} aria-describedby={error ? "acc-error" : undefined} />
          {error && <p id="acc-error" role="alert" className="mt-1 text-destructive">{error}</p>}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => done(a.signIn(email), "Entrada simulada.")}>Simular entrada</Button>
          <Button variant="outline" onClick={() => done(a.recover(email), `Recuperación simulada. ${NO_SEND}.`)}>Simular recuperación</Button>
          <Button variant="outline" disabled={s.status === "fuera"} onClick={() => done(a.signOut(), "Salida simulada.")}>Simular salida</Button>
        </div>
        {msg && <p role="status" className="mt-3 text-sm">{msg}</p>}
        <p className="mt-4 text-xs text-muted-foreground">{NO_SEND}. Solo se aceptan correos @example.invalid.</p>
      </Panel>
    </div>
  );
}
