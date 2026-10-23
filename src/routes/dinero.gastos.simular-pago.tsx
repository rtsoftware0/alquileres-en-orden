import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { PaymentSimulatorPage } from "@/features/money/PaymentSimulatorPage";

const title = `Simular un pago a proveedor · ${site.name}`;
const description = "Simulación de un pago hipotético a un proveedor. No se registra ningún pago.";

export const Route = createFileRoute("/dinero/gastos/simular-pago")({
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
  return <PaymentSimulatorPage />;
}
