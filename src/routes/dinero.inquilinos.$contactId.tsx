import { createFileRoute, notFound } from "@tanstack/react-router";
import { site } from "@/config/site";
import { demoPortfolio } from "@/features/portfolio/data/demo-data";
import { getContact } from "@/features/contacts/selectors";
import { hasTenantAccount } from "@/features/money/selectors";
import { TenantAccountPage, validateAccountSearch } from "@/features/money/TenantAccountPage";
import { NotFoundMessage } from "@/features/layout/NotFound";

export const Route = createFileRoute("/dinero/inquilinos/$contactId")({
  validateSearch: validateAccountSearch,
  loader: ({ params }) => {
    const contact = getContact(demoPortfolio, params.contactId);
    if (!contact || !hasTenantAccount(demoPortfolio, contact.id)) throw notFound();
    return { contact };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `Cuenta de ${loaderData.contact.code} · ${site.name}` : `Cuenta no encontrada · ${site.name}`;
    const description = "Cuenta ficticia de un inquilino: cargos, cobros, asignaciones y saldo.";
    return {
      meta: [
        { title }, { name: "description", content: description },
        { property: "og:title", content: title }, { property: "og:description", content: description },
        { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
      ],
    };
  },
  notFoundComponent: () => <NotFoundMessage title="Cuenta no encontrada" text="Solo hay cuenta para contactos que son inquilinos en algún contrato de ejemplo." />,
  component: R,
});

function R() {
  return <TenantAccountPage contact={Route.useLoaderData().contact} search={Route.useSearch()} />;
}
