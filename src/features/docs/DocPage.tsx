import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Info } from "lucide-react";
import { useCatalogData } from "@/features/catalog/CatalogContext";
import type { DemoDocument } from "@/features/portfolio/data/types";
import { getContact } from "@/features/contacts/selectors";
import { currentVersion, docLinkKindLabel, docLinkLabel, getVersion, visibilityLabel } from "./selectors";
import { Breadcrumbs, PageHeader, Panel, crumbLinkClass } from "@/features/layout/PageHeader";
import { linkClass } from "@/features/layout/ui";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

function DocLink({ doc }: { doc: DemoDocument }) {
  const data = useCatalogData();
  const label = docLinkLabel(data, doc);
  switch (doc.link.kind) {
    case "contrato": return <Link to="/contratos/$contractId" params={{ contractId: doc.link.id }} className={linkClass}>{label}</Link>;
    case "incidencia": return <Link to="/incidencias/$incidentId" params={{ incidentId: doc.link.id }} className={linkClass}>{label}</Link>;
    case "gasto": return <Link to="/dinero/gastos/$expenseId" params={{ expenseId: doc.link.id }} className={linkClass}>{label}</Link>;
    case "inmueble": return <Link to="/cartera/inmuebles/$propertyId" params={{ propertyId: doc.link.id }} className={linkClass}>{label}</Link>;
  }
}

export function DocPage({ doc }: { doc: DemoDocument }) {
  const data = useCatalogData();
  const [shown, setShown] = useState(currentVersion(doc).version);
  const version = getVersion(doc, shown) ?? currentVersion(doc);
  const property = data.properties.find((p) => p.id === doc.propertyId);

  return (
    <>
      <Breadcrumbs items={[
        { label: "Documentos", link: <Link to="/documentos" className={crumbLinkClass}>Documentos</Link> },
        { label: doc.title },
      ]} />
      <PageHeader
        title={doc.title}
        subtitle={`${doc.category} · creado el ${formatDate(doc.createdOn)} por ${doc.author} (ficticio)`}
        actions={<Link to="/documentos" className={buttonVariants({ variant: "outline" })}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a documentos</Link>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Detalle">
          <dl className="tabular grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
            <dt className="text-muted-foreground">Categoría</dt><dd>{doc.category}</dd>
            <dt className="text-muted-foreground">Relacionado con</dt><dd>{docLinkKindLabel[doc.link.kind]}: <DocLink doc={doc} /></dd>
            <dt className="text-muted-foreground">Inmueble</dt>
            <dd>{property && <Link to="/cartera/inmuebles/$propertyId" params={{ propertyId: property.id }} className={linkClass}>{property.name}</Link>}</dd>
            <dt className="text-muted-foreground">Versión actual</dt><dd>v{currentVersion(doc).version} de {doc.versions.length}</dd>
            <dt className="text-muted-foreground">Visibilidad</dt>
            <dd>
              {visibilityLabel[doc.visibility]}
              <span className="block text-xs text-muted-foreground">Visibilidad de ejemplo; no concede acceso.</span>
            </dd>
            {doc.visibility === "compartida" && (
              <>
                <dt className="text-muted-foreground">Destinatarios de ejemplo</dt>
                <dd>{doc.recipientIds.map((id) => getContact(data, id)?.name ?? id).join(", ")}</dd>
              </>
            )}
          </dl>
        </Panel>

        <Panel title="Versiones">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Elegir versión">
            {doc.versions.map((v) => (
              <button
                key={v.version}
                type="button"
                onClick={() => setShown(v.version)}
                aria-pressed={v.version === version.version}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm font-medium",
                  v.version === version.version ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card text-foreground hover:bg-muted",
                )}
              >
                v{v.version} · {formatDate(v.date)}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Las versiones anteriores se conservan; cambiar de versión nunca sobrescribe el historial.</p>
        </Panel>

        <Panel title={`Contenido de la versión v${version.version}`} className="lg:col-span-2">
          <p className="mb-3 flex items-center gap-2 rounded-md border border-demo-foreground/20 bg-demo px-3 py-2 text-sm font-medium text-demo-foreground" role="note">
            <Info className="h-4 w-4 shrink-0" aria-hidden="true" /> Contenido de ejemplo: no es un archivo descargable ni un documento jurídico.
          </p>
          <p className="text-sm">{version.content}</p>
          <p className="mt-3 text-xs text-muted-foreground">v{version.version} · {formatDate(version.date)} · {version.author} · {version.note}</p>
        </Panel>
      </div>
    </>
  );
}
