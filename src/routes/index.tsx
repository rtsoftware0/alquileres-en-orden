import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { DashboardPage } from "@/features/dashboard/DashboardPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `Inicio · ${site.name}` },
      { name: "description", content: site.description },
      { property: "og:title", content: `Inicio · ${site.name}` },
      { property: "og:description", content: site.description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});
