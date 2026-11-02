import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { AccessPage } from "@/features/account/AccessPage";

const title = `Acceso simulado · ${site.name}`;
const description = "Entrada, recuperación y salida simuladas; no se envía nada.";

export const Route = createFileRoute("/acceso")({
  head: () => ({
    meta: [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccessPage,
});
