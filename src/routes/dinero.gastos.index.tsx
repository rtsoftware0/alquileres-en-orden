import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { ExpensesPage, validateExpensesSearch } from "@/features/money/ExpensesPage";

const title = `Gastos · ${site.name}`;
const description = "Gastos ficticios con coste, pagado y pendiente a proveedores. Registro separado de la deuda de inquilinos.";

export const Route = createFileRoute("/dinero/gastos/")({
  validateSearch: validateExpensesSearch,
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
  return <ExpensesPage search={Route.useSearch()} />;
}
