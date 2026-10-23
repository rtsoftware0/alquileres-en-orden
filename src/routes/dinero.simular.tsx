import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { SimulatorPage } from "@/features/money/SimulatorPage";

const title = `Simular un cobro · ${site.name}`;
const description = "Simulación de un cobro hipotético. No se registra ningún cobro.";

export const Route = createFileRoute("/dinero/simular")({
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
  return <SimulatorPage />;
}
