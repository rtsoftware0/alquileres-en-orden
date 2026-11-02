import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { site } from "@/config/site";
import { CatalogNotice } from "@/features/catalog/CatalogContext";
import { ContactForm } from "@/features/catalog/ContactForm";
import { Breadcrumbs, PageHeader, crumbLinkClass } from "@/features/layout/PageHeader";

export const Route = createFileRoute("/contactos/nuevo")({
  head: () => {
    const title = `Nuevo contacto temporal · ${site.name}`;
    const description = "Alta temporal de un contacto ficticio en la demostración.";
    return {
      meta: [
        { title }, { name: "description", content: description },
        { property: "og:title", content: title }, { property: "og:description", content: description },
        { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: NewContactRoute,
});

function NewContactRoute() {
  const navigate = useNavigate();
  return (
    <>
      <Breadcrumbs items={[{ label: "Contactos", link: <Link to="/contactos" className={crumbLinkClass}>Contactos</Link> }, { label: "Nuevo contacto" }]} />
      <PageHeader title="Nuevo contacto" subtitle="Persona o empresa ficticia. No crea contratos, dinero ni accesos." />
      <CatalogNotice />
      <div className="max-w-3xl rounded-lg border border-border bg-card p-4">
        <ContactForm
          onSaved={(id) => navigate({ to: "/contactos/$contactId", params: { contactId: id } })}
          onCancel={() => navigate({ to: "/contactos" })}
        />
      </div>
    </>
  );
}
