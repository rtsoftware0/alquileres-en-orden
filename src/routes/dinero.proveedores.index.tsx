import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { ProviderAccountsPage } from "@/features/money/ProviderAccountsPage";

const title = `Cuentas de proveedores · ${site.name}`;
const description = "Proveedores ficticios con sus gastos y saldo pendiente de ejemplo.";

export const Route = createFileRoute("/dinero/proveedores/")({
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
  return <ProviderAccountsPage />;
}
