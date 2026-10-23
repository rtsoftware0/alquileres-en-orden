import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { IncidentsPage, validateIncidentsSearch } from "@/features/incidents/IncidentsPage";

const title = `Incidencias · ${site.name}`;
const description = "Incidencias ficticias con prioridad, estado, responsable y fecha objetivo.";

export const Route = createFileRoute("/incidencias/")({
  validateSearch: validateIncidentsSearch,
  head: () => ({
    meta: [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  component: R,
});

function R() {
  return <IncidentsPage search={Route.useSearch()} />;
}
