import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { site } from "@/config/site";
import { demoPortfolio } from "@/features/portfolio/data/demo-data";
import { ReportsPage } from "@/features/reports/ReportsPage";
import { validateReportsSearch } from "@/features/reports/selectors";

const title = `Informes · ${site.name}`;
const description = "Informes de ocupación, devengo, caja, deuda actual y gastos con datos ficticios.";

export const Route = createFileRoute("/informes")({
  validateSearch: (input: Record<string, unknown>) => validateReportsSearch(input, demoPortfolio.referenceDate),
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
  const navigate = useNavigate({ from: "/informes" });
  return <ReportsPage search={Route.useSearch()} onSearch={(next) => navigate({ search: next, replace: true })} />;
}
