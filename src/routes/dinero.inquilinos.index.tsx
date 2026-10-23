import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { TenantAccountsPage } from "@/features/money/TenantAccountsPage";

const title = `Cuentas de inquilinos · ${site.name}`;
const description = "Cuentas ficticias por inquilino con cargos, cobros y saldo.";

export const Route = createFileRoute("/dinero/inquilinos/")({
  
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
  return ;
}
