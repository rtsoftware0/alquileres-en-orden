import { createFileRoute, notFound } from "@tanstack/react-router";
import { site } from "@/config/site";
import { demoPortfolio } from "@/features/portfolio/data/demo-data";
import { getContract } from "@/features/contracts/selectors";
import { ContractPage } from "@/features/contracts/ContractPage";
import { NotFoundMessage } from "@/features/layout/NotFound";

export const Route = createFileRoute("/contratos/$contractId")({
  loader: ({ params }) => {
    const contract = getContract(demoPortfolio, params.contractId);
    if (!contract) throw notFound();
    return { contract };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.contract.reference} · ${site.name}` : `Contrato no encontrado · ${site.name}`;
    const description = "Resumen de contrato ficticio de la cartera de ejemplo.";
    return {
      meta: [
        { title }, { name: "description", content: description },
        { property: "og:title", content: title }, { property: "og:description", content: description },
        { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
      ],
    };
  },
  notFoundComponent: () => <NotFoundMessage title="Contrato no encontrado" text="Este contrato no existe en la demostración." />,
  component: ContractRoute,
});

function ContractRoute() {
  return <ContractPage contract={Route.useLoaderData().contract} />;
}
