import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { DocDraftWizard } from "@/features/docs/DocDraftWizard";

const title = `Preparar documento de ejemplo · ${site.name}`;
const description = "Asistente de demostración para preparar un documento. No se guarda ni se comparte nada.";

export const Route = createFileRoute("/documentos/preparar")({
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
  return <DocDraftWizard />;
}
