import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { HelpPage } from "@/features/plans/HelpPage";

const title = `Ayuda · ${site.name}`;
const description = "Temas, preguntas frecuentes y formulario de soporte simulado.";

export const Route = createFileRoute("/ayuda")({
  head: () => ({
    meta: [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HelpPage,
});
