import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { DraftWizard } from "@/features/contracts/DraftWizard";

const title = `Preparar borrador · ${site.name}`;
const description = "Asistente de demostración para preparar un borrador de contrato con datos ficticios.";

export const Route = createFileRoute("/contratos/borrador")({
  head: () => ({
    meta: [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DraftWizard,
});
