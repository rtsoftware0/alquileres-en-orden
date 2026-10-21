import { createFileRoute, notFound } from "@tanstack/react-router";
import { site } from "@/config/site";
import { demoPortfolio } from "@/features/portfolio/data/demo-data";
import { getProperty } from "@/features/portfolio/selectors";
import { PropertyPage } from "@/features/portfolio/PropertyPage";
import { NotFoundMessage } from "@/features/layout/NotFound";

export const Route = createFileRoute("/cartera/inmuebles/$propertyId")({
  loader: ({ params }) => {
    const property = getProperty(demoPortfolio, params.propertyId);
    if (!property) throw notFound();
    return { property };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.property.name} · ${site.name}` : `Inmueble no encontrado · ${site.name}`;
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
  return <PropertyPage property={Route.useLoaderData().property} />;
}
