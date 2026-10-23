import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { NoticesPage, validateNoticesSearch } from "@/features/docs/NoticesPage";

const title = `Avisos · ${site.name}`;
const description = "Centro de avisos ficticios de vencimientos, deuda, incidencias, tareas y fianzas.";

export const Route = createFileRoute("/avisos/")({
  validateSearch: validateNoticesSearch,
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
  return <NoticesPage search={Route.useSearch()} />;
}
