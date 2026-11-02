import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { CatalogNotice } from "@/features/catalog/CatalogContext";
import { ImportWizard } from "@/features/catalog/csv/ImportWizard";
import { isImportEntity, type ImportEntity } from "@/features/catalog/csv/templates";
import { Breadcrumbs, CarteraCrumb, PageHeader } from "@/features/layout/PageHeader";

interface ImportSearch { entidad?: ImportEntity | undefined }

export const Route = createFileRoute("/cartera/importar")({
  validateSearch: (input: Record<string, unknown>): ImportSearch => ({
    entidad: isImportEntity(input["entidad"]) ? input["entidad"] : undefined,
  }),
  head: () => {
    const title = `Importar CSV temporal · ${site.name}`;
    const description = "Importa altas ficticias de contactos, inmuebles o unidades desde un CSV local, con revisión y confirmación.";
    return {
      meta: [
        { title }, { name: "description", content: description },
        { property: "og:title", content: title }, { property: "og:description", content: description },
        { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: ImportRoute,
});

function ImportRoute() {
  const { entidad } = Route.useSearch();
  return (
    <>
      <Breadcrumbs items={[{ label: "Cartera", link: <CarteraCrumb /> }, { label: "Importar CSV" }]} />
      <PageHeader title="Importar CSV" subtitle="Altas temporales de contactos, inmuebles o unidades. Nada se envía ni se guarda." />
      <CatalogNotice />
      <ImportWizard key={entidad ?? ""} initialEntity={entidad} />
    </>
  );
}
