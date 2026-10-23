import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { MoneySummaryPage, validateMoneySearch } from "@/features/money/MoneySummaryPage";

const title = `Dinero · ${site.name}`;
const description = "Resumen ficticio de pendiente de cobro, cobros de ejemplo y dinero sin asignar.";

export const Route = createFileRoute("/dinero/")({
  
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
  return validateSearch: validateMoneySearch,;
}
