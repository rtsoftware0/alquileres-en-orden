import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { site } from "@/config/site";
import { CatalogNotice } from "@/features/catalog/CatalogContext";
import { RoomForm } from "@/features/catalog/RoomForm";
import { Breadcrumbs, CarteraCrumb, PageHeader } from "@/features/layout/PageHeader";

interface NewRoomSearch { inmueble?: string | undefined }

export const Route = createFileRoute("/cartera/habitaciones/nueva")({
  validateSearch: (input: Record<string, unknown>): NewRoomSearch => ({
    inmueble: typeof input.inmueble === "string" && input.inmueble ? input.inmueble.slice(0, 80) : undefined,
  }),
  head: () => {
    const title = `Nueva unidad temporal · ${site.name}`;
    const description = "Alta temporal de una unidad ficticia disponible en la cartera de ejemplo.";
    return {
      meta: [
        { title }, { name: "description", content: description },
        { property: "og:title", content: title }, { property: "og:description", content: description },
        { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: NewRoomRoute,
});

function NewRoomRoute() {
  const { inmueble } = Route.useSearch();
  const navigate = useNavigate();
  return (
    <>
      <Breadcrumbs items={[{ label: "Cartera", link: <CarteraCrumb /> }, { label: "Nueva unidad" }]} />
      <PageHeader title="Nueva unidad" subtitle="Unidad ficticia disponible. No crea contratos, reservas, cobros ni accesos." />
      <CatalogNotice />
      <div className="max-w-3xl rounded-lg border border-border bg-card p-4">
        <RoomForm
          key={inmueble ?? ""}
          {...(inmueble ? { initialPropertyId: inmueble } : {})}
          onSaved={(id) => navigate({ to: "/cartera/habitaciones/$roomId", params: { roomId: id } })}
          onCancel={() => navigate({ to: "/cartera" })}
        />
      </div>
    </>
  );
}
