import { createFileRoute, notFound } from "@tanstack/react-router";
import { site } from "@/config/site";
import { demoPortfolio } from "@/features/portfolio/data/demo-data";
import { getRoom } from "@/features/portfolio/selectors";
import { RoomPage } from "@/features/portfolio/RoomPage";
import { NotFoundMessage } from "@/features/layout/NotFound";

export const Route = createFileRoute("/cartera/habitaciones/$roomId")({
  loader: ({ params }) => {
    const room = getRoom(demoPortfolio, params.roomId);
    if (!room) throw notFound();
    return { room };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `Habitación ${loaderData.room.code} · ${site.name}` : `Habitación no encontrada · ${site.name}`;
    const description = "Ficha de habitación de la cartera de ejemplo.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  notFoundComponent: () => <NotFoundMessage title="Habitación no encontrada" text="Esta habitación no existe en la cartera de ejemplo." />,
  component: RoomRoute,
});

function RoomRoute() {
  return <RoomPage room={Route.useLoaderData().room} />;
}
