import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { ContractsPage, validateContractsSearch } from "@/features/contracts/ContractsPage";

const title = `Contratos · ${site.name}`;
const description = "Contratos ficticios de la cartera de ejemplo por estado e inmueble.";

export const Route = createFileRoute("/contratos/")({
  validateSearch: validateContractsSearch,
  head: () => ({
    meta: [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContractsRoute,
});

function ContractsRoute() {
  return <ContractsPage search={Route.useSearch()} />;
}
