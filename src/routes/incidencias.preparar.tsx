import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { IncidentDraftWizard } from "@/features/incidents/IncidentDraftWizard";

const title = `Preparar incidencia de ejemplo · ${site.name}`;
const description = "Asistente de demostración para preparar una incidencia. No se guarda nada.";

export const Route = createFileRoute("/incidencias/preparar")({
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
  return <IncidentDraftWizard />;
}
