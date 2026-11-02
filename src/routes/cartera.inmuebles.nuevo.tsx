import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { site } from "@/config/site";
import { CatalogNotice } from "@/features/catalog/CatalogContext";
import { PropertyForm } from "@/features/catalog/PropertyForm";
import { Breadcrumbs, CarteraCrumb, PageHeader } from "@/features/layout/PageHeader";

export const Route = createFileRoute("/cartera/inmuebles/nuevo")({
  head: () => {
    const title = `Nuevo inmueble temporal · ${site.name}`;
    const description = "Alta temporal de un inmueble ficticio en la cartera de ejemplo.";
    return {
      meta: [
        { title }, { name: "description", content: description },
        { property: "og:title", content: title }, { property: "og:description", content: description },
        { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: NewPropertyRoute,
});

function NewPropertyRoute() {
  const navigate = useNavigate();
  return (
    <>
      <Breadcrumbs items={[{ label: "Cartera", link: <CarteraCrumb /> }, { label: "Nuevo inmueble" }]} />
      <PageHeader title="Nuevo inmueble" subtitle="Inmueble ficticio. No crea contratos, dinero ni accesos." />
      <CatalogNotice />
      <div className="max-w-3xl rounded-lg border border-border bg-card p-4">
        <PropertyForm
          onSaved={(id) => navigate({ to: "/cartera/inmuebles/$propertyId", params: { propertyId: id } })}
          onCancel={() => navigate({ to: "/cartera", search: { vista: "inmuebles" } })}
        />
      </div>
    </>
  );
}
