import { createFileRoute, notFound } from "@tanstack/react-router";
import { site } from "@/config/site";
import { demoPortfolio } from "@/features/portfolio/data/demo-data";
import { getCharge } from "@/features/money/selectors";
import { ChargePage } from "@/features/money/ChargePage";
import { NotFoundMessage } from "@/features/layout/NotFound";

export const Route = createFileRoute("/dinero/vencimientos/$chargeId")({
  loader: ({ params }) => {
    const charge = getCharge(demoPortfolio, params.chargeId);
    if (!charge) throw notFound();
    return { charge };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.charge.reference} · ${site.name}` : `Vencimiento no encontrado · ${site.name}`;
    const description = "Detalle de un cargo de renta ficticio y los cobros de ejemplo que lo cubren.";
    return {
      meta: [
        { title }, { name: "description", content: description },
        { property: "og:title", content: title }, { property: "og:description", content: description },
        { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
      ],
    };
  },
  notFoundComponent: () => <NotFoundMessage title="Vencimiento no encontrado" text="Este vencimiento no existe en la demostración. Consulta la lista en Dinero › Vencimientos." />,
  component: R,
});

function R() {
  return <ChargePage charge={Route.useLoaderData().charge} />;
}
