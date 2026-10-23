import { createFileRoute, notFound } from "@tanstack/react-router";
import { site } from "@/config/site";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import { getIncident } from "@/features/incidents/selectors";
import { IncidentPage } from "@/features/incidents/IncidentPage";

const title = `Ficha de incidencia · ${site.name}`;
const description = "Detalle de una incidencia ficticia con seguimiento simulado.";

export const Route = createFileRoute("/incidencias/$incidentId")({
  loader: ({ params }) => {
    const incident = getIncident(data, params.incidentId);
    if (!incident) throw notFound();
    return incident;
  },
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
  return <IncidentPage incident={Route.useLoaderData()} />;
}
