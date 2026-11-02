import { createFileRoute, notFound } from "@tanstack/react-router";
import { site } from "@/config/site";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import { getContact } from "@/features/contacts/selectors";
import { hasProviderAccount } from "@/features/money/expenses";
import { ProviderAccountPage } from "@/features/money/ProviderAccountsPage";

const title = `Cuenta de proveedor · ${site.name}`;
const description = "Gastos y pagos ficticios de un proveedor de ejemplo.";

export const Route = createFileRoute("/dinero/proveedores/$contactId")({
  // Eligibility follows expenses only (catalog roles never open an account); the page reads the current contact by ID.
  loader: ({ params }) => {
    const contact = getContact(data, params.contactId);
    if (!contact || !hasProviderAccount(data, contact.id)) throw notFound();
    return contact;
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
  return <ProviderAccountPage contact={Route.useLoaderData()} />;
}
