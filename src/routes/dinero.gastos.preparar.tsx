import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { ExpenseDraftWizard } from "@/features/money/ExpenseDraftWizard";

const title = `Preparar gasto de ejemplo · ${site.name}`;
const description = "Asistente de demostración para preparar un gasto con reparto. No se guarda nada.";

export const Route = createFileRoute("/dinero/gastos/preparar")({
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
  return <ExpenseDraftWizard />;
}
