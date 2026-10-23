import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { ThreadsPage } from "@/features/docs/ThreadsPage";

const title = `Mensajes · ${site.name}`;
const description = "Conversaciones ficticias de contratos e incidencias, con notas internas y mensajes compartidos de ejemplo.";

export const Route = createFileRoute("/mensajes/")({
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
  return <ThreadsPage />;
}
