import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { useCatalogData } from "@/features/catalog/CatalogContext";
import { getContact } from "@/features/contacts/selectors";
import { ContactPage } from "@/features/contacts/ContactPage";
import { NotFoundMessage } from "@/features/layout/NotFound";

export const Route = createFileRoute("/contactos/$contactId")({
  head: () => {
    const title = `Ficha de contacto · ${site.name}`;
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
  const { contactId } = Route.useParams();
  const data = useCatalogData();
  const contact = getContact(data, contactId);
  if (!contact) return <NotFoundMessage title="Contacto no encontrado" text="Este contacto no existe en la demostración." />;
  return <ContactPage contact={contact} />;
}
