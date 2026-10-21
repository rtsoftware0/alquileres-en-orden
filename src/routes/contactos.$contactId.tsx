import { createFileRoute, notFound } from "@tanstack/react-router";
import { site } from "@/config/site";
import { demoPortfolio } from "@/features/portfolio/data/demo-data";
import { getContact } from "@/features/contacts/selectors";
import { ContactPage } from "@/features/contacts/ContactPage";
import { NotFoundMessage } from "@/features/layout/NotFound";

export const Route = createFileRoute("/contactos/$contactId")({
  loader: ({ params }) => {
    const contact = getContact(demoPortfolio, params.contactId);
    if (!contact) throw notFound();
    return { contact };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.contact.name} · ${site.name}` : `Contacto no encontrado · ${site.name}`;
    const description = "Ficha de contacto ficticio de la cartera de ejemplo.";
    return {
      meta: [
        { title }, { name: "description", content: description },
        { property: "og:title", content: title }, { property: "og:description", content: description },
        { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
      ],
    };
  },
  notFoundComponent: () => <NotFoundMessage title="Contacto no encontrado" text="Este contacto no existe en la demostración." />,
  component: ContactRoute,
});

function ContactRoute() {
  return <ContactPage contact={Route.useLoaderData().contact} />;
}
