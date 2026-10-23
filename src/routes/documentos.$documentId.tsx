import { createFileRoute, notFound } from "@tanstack/react-router";
import { site } from "@/config/site";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import { getDocument } from "@/features/docs/selectors";
import { DocPage } from "@/features/docs/DocPage";

const title = `Ficha de documento · ${site.name}`;
const description = "Documento ficticio con contenido de ejemplo y versiones conservadas.";

export const Route = createFileRoute("/documentos/$documentId")({
  loader: ({ params }) => {
    const doc = getDocument(data, params.documentId);
    if (!doc) throw notFound();
    return doc;
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
  return <DocPage key={Route.useLoaderData().id} doc={Route.useLoaderData()} />;
}
