import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { CarteraPage } from "@/features/portfolio/CarteraPage";
import { validateCarteraSearch } from "@/features/portfolio/search";

export const Route = createFileRoute("/cartera/")({
  validateSearch: validateCarteraSearch,
  head: () => ({
    meta: [
      { title: `Cartera · ${site.name}` },
      { name: "description", content: "Inmuebles y habitaciones de la cartera de ejemplo." },
      { property: "og:title", content: `Cartera · ${site.name}` },
      { property: "og:description", content: "Inmuebles y habitaciones de la cartera de ejemplo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CarteraRoute,
});

function CarteraRoute() {
  return <CarteraPage search={Route.useSearch()} />;
}
