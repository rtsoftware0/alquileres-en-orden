import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { SettingsPage } from "@/features/account/SettingsPage";

const title = `Configuración · ${site.name}`;
const description = "Empresa, perfil, equipo y roles de ejemplo con datos ficticios.";

export const Route = createFileRoute("/configuracion")({
  head: () => ({
    meta: [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});
