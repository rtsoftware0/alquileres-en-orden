import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { WelcomePage } from "@/features/account/WelcomePage";

const title = `Bienvenida · ${site.name}`;
const description = "Primeros pasos de la cuenta de ejemplo con un solo administrador.";

export const Route = createFileRoute("/bienvenida")({
  head: () => ({
    meta: [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WelcomePage,
});
