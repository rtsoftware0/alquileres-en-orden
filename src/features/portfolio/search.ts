import type { RoomStatus } from "./data/types";
import { ROOM_STATUSES, type PropertySort, type RoomSort } from "./selectors";

export interface CarteraSearch {
  vista?: "inmuebles" | "habitaciones" | undefined;
  q?: string | undefined;
  estado?: RoomStatus | undefined;
  orden?: string | undefined;
}

const pick = <T extends string>(v: unknown, allowed: readonly T[]): T | undefined =>
  typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;

export function validateCarteraSearch(input: Record<string, unknown>): CarteraSearch {
  const raw = input as { vista?: unknown; q?: unknown; estado?: unknown; orden?: unknown };
  return {
    vista: pick(raw.vista, ["inmuebles", "habitaciones"] as const),
    q: typeof raw.q === "string" && raw.q ? raw.q.slice(0, 80) : undefined,
    estado: pick(raw.estado, ROOM_STATUSES),
    orden: typeof raw.orden === "string" ? raw.orden : undefined,
  };
}

export const roomSorts: { value: RoomSort; label: string }[] = [
  { value: "codigo", label: "Código" },
  { value: "renta-asc", label: "Renta: menor a mayor" },
  { value: "renta-desc", label: "Renta: mayor a menor" },
];

export const propertySorts: { value: PropertySort; label: string }[] = [
  { value: "nombre", label: "Nombre" },
  { value: "ocupacion", label: "Ocupación" },
];
