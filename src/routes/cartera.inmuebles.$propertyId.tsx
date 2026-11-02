import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { useCatalogData } from "@/features/catalog/CatalogContext";
import { getProperty } from "@/features/portfolio/selectors";
import { PropertyPage } from "@/features/portfolio/PropertyPage";
import { NotFoundMessage } from "@/features/layout/NotFound";

export const Route = createFileRoute("/cartera/inmuebles/$propertyId")({
  head: () => {
    const title = `Ficha de inmueble · ${site.name}`;
    const description = "Ficha de inmueble de la cartera de ejemplo.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  notFoundComponent: () => <NotFoundMessage title="Inmueble no encontrado" text="Este inmueble no existe en la cartera de ejemplo." />,
  component: PropertyRoute,
});

function PropertyRoute() {
  const { propertyId } = Route.useParams();
  const data = useCatalogData();
  const property = getProperty(data, propertyId);
  if (!property) return <NotFoundMessage title="Inmueble no encontrado" text="Este inmueble no existe en la cartera de ejemplo." />;
  return <PropertyPage property={property} />;
}
