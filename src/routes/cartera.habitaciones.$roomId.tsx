import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { useCatalogData } from "@/features/catalog/CatalogContext";
import { getRoom } from "@/features/portfolio/selectors";
import { RoomPage } from "@/features/portfolio/RoomPage";
import { NotFoundMessage } from "@/features/layout/NotFound";

export const Route = createFileRoute("/cartera/habitaciones/$roomId")({
  head: () => {
    const title = `Ficha de unidad · ${site.name}`;
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
  const { roomId } = Route.useParams();
  const data = useCatalogData();
  const room = getRoom(data, roomId);
  if (!room) return <NotFoundMessage title="Habitación no encontrada" text="Esta habitación no existe en la cartera de ejemplo." />;
  return <RoomPage room={room} />;
}
