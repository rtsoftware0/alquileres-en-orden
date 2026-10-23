import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { DocsPage, validateDocsSearch } from "@/features/docs/DocsPage";

const title = `Documentos · ${site.name}`;
const description = "Biblioteca de documentos ficticios incorporados, con versiones y visibilidad de ejemplo.";

export const Route = createFileRoute("/documentos/")({
  validateSearch: validateDocsSearch,
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
  return <DocsPage search={Route.useSearch()} />;
}
