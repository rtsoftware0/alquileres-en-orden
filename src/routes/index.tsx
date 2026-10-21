import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { WelcomeScreen } from "@/features/welcome/WelcomeScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${site.name} — ${site.tagline}` },
      { name: "description", content: site.description },
      { property: "og:title", content: site.name },
      { property: "og:description", content: site.tagline },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WelcomeScreen,
});
