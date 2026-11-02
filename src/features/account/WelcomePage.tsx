import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/features/layout/PageHeader";
import { linkClass } from "@/features/layout/ui";
import { useAccount } from "./AccountContext";
import { welcomeSteps } from "./engine";
import { ROLES_NOTICE } from "./SettingsPage";

export function WelcomePage() {
  const a = useAccount();
  const steps = welcomeSteps(a.state);
  const [msg, setMsg] = useState("");
  return (
    <div className="space-y-6">
      <PageHeader title="Bienvenida" subtitle={`Prepara ${a.state.company.name} en pocos pasos. Demostración con datos ficticios.`} />
      <Panel title="Pasos">
        <ol className="space-y-4 text-sm">
          <li>
            <p className="font-medium">1. Revisar la empresa · {steps.company ? "Hecho" : "Pendiente"}</p>
            <p className="text-muted-foreground">{a.state.company.name} · {a.state.company.currency} · {a.state.company.timeZone}</p>
            {!steps.company && <Button size="sm" className="mt-2" onClick={() => { const r = a.confirmReview("empresa"); setMsg(r.ok ? "Empresa revisada." : r.message); }}>Marcar empresa como revisada</Button>}
          </li>
          <li>
            <p className="font-medium">2. Revisar tu perfil · {steps.profile ? "Hecho" : "Pendiente"}</p>
            <p className="text-muted-foreground">{a.profile?.name} · {a.profile?.email}</p>
            {!steps.profile && <Button size="sm" className="mt-2" onClick={() => { const r = a.confirmReview("perfil"); setMsg(r.ok ? "Perfil revisado." : r.message); }}>Marcar perfil como revisado</Button>}
          </li>
          <li>
            <p className="font-medium">3. Equipo (opcional) · {steps.team ? "Con más personas" : "Solo tú"}</p>
            <p className="text-muted-foreground">Puedes trabajar con un único administrador. <Link to="/configuracion" className={linkClass}>Gestionar equipo</Link></p>
          </li>
        </ol>
        {msg && <p role="status" className="mt-3 text-sm">{msg}</p>}
        <p className="mt-4 text-sm font-medium" data-testid="welcome-state">{steps.complete ? "Preparación completada (demostración)." : "Preparación pendiente."}</p>
        <p className="mt-2 text-xs text-muted-foreground">{ROLES_NOTICE} No se inicia ninguna prueba de plan desde aquí.</p>
      </Panel>
    </div>
  );
}
