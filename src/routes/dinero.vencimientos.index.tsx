import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { ChargesPage, validateChargesSearch } from "@/features/money/ChargesPage";

const title = `Vencimientos · ${site.name}`;
const description = "Cargos de renta ficticios con importe original, asignado y pendiente.";

export const Route = createFileRoute("/dinero/vencimientos/")({
  
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
  return validateSearch: validateChargesSearch,;
}
