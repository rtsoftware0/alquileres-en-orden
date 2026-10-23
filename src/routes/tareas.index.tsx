import { createFileRoute } from "@tanstack/react-router";
import { site } from "@/config/site";
import { TasksPage, validateTasksSearch } from "@/features/incidents/TasksPage";

const title = `Mis tareas · ${site.name}`;
const description = "Tareas ficticias pendientes, vencidas y completadas del administrador de demostración.";

export const Route = createFileRoute("/tareas/")({
  validateSearch: validateTasksSearch,
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
  return <TasksPage search={Route.useSearch()} />;
}
