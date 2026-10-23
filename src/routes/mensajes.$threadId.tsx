import { createFileRoute, notFound } from "@tanstack/react-router";
import { site } from "@/config/site";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import { getThread } from "@/features/docs/selectors";
import { ThreadPage } from "@/features/docs/ThreadPage";

const title = `Conversación · ${site.name}`;
const description = "Hilo ficticio con historial de ejemplo y borrador temporal que no se envía.";

export const Route = createFileRoute("/mensajes/$threadId")({
  loader: ({ params }) => {
    const thread = getThread(data, params.threadId);
    if (!thread) throw notFound();
    return thread;
  },
  head: () => ({
    meta: [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  component: R,
});

function R() {
  // key: changing thread never drags draft, recipients or review along.
  return <ThreadPage key={Route.useLoaderData().id} thread={Route.useLoaderData()} />;
}
