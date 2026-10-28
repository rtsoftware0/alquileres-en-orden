import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { PortalsPage } from "@/features/portals/PortalsPage";

const title = `Portales · ${site.name}`;
const description =
  "Vista de demostración de los futuros portales de propietario, inquilino y proveedor, sin accesos reales.";

export const Route = createFileRoute("/portales")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: R,
});

function R() {
  return <PortalsPage />;
}
