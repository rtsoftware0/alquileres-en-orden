import { Building2, Globe, Home, Users } from "lucide-react";
import { PageHeader, Panel } from "@/features/layout/PageHeader";

const portals = [
  {
    key: "propietario",
    icon: Home,
    title: "Propietario",
    text: "Vista pensada para que cada propietario consulte la información de sus inmuebles: ocupación, liquidaciones y documentos compartidos con él.",
  },
  {
    key: "inquilino",
    icon: Users,
    title: "Inquilino",
    text: "Vista pensada para que cada inquilino consulte su cuenta: próximos vencimientos, recibos y estado de su fianza.",
  },
  {
    key: "proveedor",
    icon: Building2,
    title: "Proveedor",
    text: "Vista pensada para que cada proveedor consulte sus trabajos e incidencias asignadas y el estado de sus pagos.",
  },
] as const;

export function PortalsPage() {
  return (
    <div>
      <PageHeader
        title="Portales"
        subtitle="Vista de demostración · Sin accesos reales"
      />
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Los portales darán a cada tipo de contacto un acceso independiente y
        limitado a lo que le corresponde. Esta pantalla solo presenta el
        concepto; todavía no hay accesos reales ni flujos construidos.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {portals.map(({ key, icon: Icon, title, text }) => (
          <section
            key={key}
            aria-labelledby={`portal-${key}`}
            className="rounded-lg border border-border bg-card p-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 id={`portal-${key}`} className="text-sm font-semibold text-foreground">
                {title}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">{text}</p>
            <p className="mt-4 inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              En preparación
            </p>
          </section>
        ))}
      </div>
      <Panel title="Estado del bloque" className="mt-6">
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <Globe className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Integración de liquidaciones pendiente del bloque 09. Cuando esté
            lista, los portales de propietario podrán mostrar el detalle de las
            liquidaciones correspondientes.
          </span>
        </p>
      </Panel>
    </div>
  );
}
