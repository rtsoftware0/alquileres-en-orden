import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { ContactsPage, validateContactsSearch } from "@/features/contacts/ContactsPage";

const title = `Contactos · ${site.name}`;
const description = "Contactos ficticios de la cartera de ejemplo: inquilinos, propietarios, proveedores y avalistas.";

export const Route = createFileRoute("/contactos/")({
  validateSearch: validateContactsSearch,
  head: () => ({
    meta: [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContactsRoute,
});

function ContactsRoute() {
  return <ContactsPage search={Route.useSearch()} />;
}
