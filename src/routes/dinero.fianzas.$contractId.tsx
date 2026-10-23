import { createFileRoute, notFound } from "@tanstack/react-router";
import { site } from "@/config/site";
import { demoPortfolio } from "@/features/portfolio/data/demo-data";
import { depositContracts } from "@/features/money/selectors";
import { DepositPage } from "@/features/money/DepositPage";
import { NotFoundMessage } from "@/features/layout/NotFound";

export const Route = createFileRoute("/dinero/fianzas/$contractId")({
  loader: ({ params }) => {
    const contract = depositContracts(demoPortfolio).find((c) => c.id === params.contractId.toLowerCase());
    if (!contract) throw notFound();
    return { contract };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `Fianza ${loaderData.contract.reference} · ${site.name}` : `Fianza no encontrada · ${site.name}`;
    const description = "Fianza ficticia de un contrato: prevista, recibida, devuelta y retenida.";
    return {
      meta: [
        { title }, { name: "description", content: description },
        { property: "og:title", content: title }, { property: "og:description", content: description },
        { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
      ],
    };
  },
  notFoundComponent: () => <NotFoundMessage title="Fianza no encontrada" text="No hay fianza de ejemplo para este contrato. Los borradores y cancelados no tienen fianza." />,
  component: R,
});

function R() {
  return <DepositPage contract={Route.useLoaderData().contract} />;
}
