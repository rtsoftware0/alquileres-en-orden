import { createFileRoute, notFound } from "@tanstack/react-router";
import { site } from "@/config/site";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import { getExpense } from "@/features/money/expenses";
import { ExpensePage } from "@/features/money/ExpensePage";

const title = `Ficha de gasto · ${site.name}`;
const description = "Detalle de un gasto ficticio: proveedor, inmueble, importes y pagos de ejemplo.";

export const Route = createFileRoute("/dinero/gastos/$expenseId")({
  loader: ({ params }) => {
    const expense = getExpense(data, params.expenseId);
    if (!expense) throw notFound();
    return expense;
  },
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
  return <ExpensePage expense={Route.useLoaderData()} />;
}
