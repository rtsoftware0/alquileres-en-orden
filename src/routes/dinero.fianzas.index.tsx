import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { DepositsPage, validateDepositsSearch } from "@/features/money/DepositsPage";

const title = `Fianzas · ${site.name}`;
const description = "Fianzas ficticias previstas, recibidas y devueltas, separadas de la renta.";

export const Route = createFileRoute("/dinero/fianzas/")({
  
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
  return validateSearch: validateDepositsSearch,;
}
