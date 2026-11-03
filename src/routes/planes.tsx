import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { PlansPage } from "@/features/plans/PlansPage";

const title = `Planes · ${site.name}`;
const description = "Planes Basic, Pro, Max y Enterprise con prueba, pagos y límites simulados.";

export const Route = createFileRoute("/planes")({
  head: () => ({
    meta: [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlansPage,
});
