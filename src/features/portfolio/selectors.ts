import { pendingByRoom, pendingCents } from "@/features/money/selectors";
import type { PortfolioDataset, Property, Room, RoomStatus } from "./data/types";

export const ROOM_STATUSES: RoomStatus[] = ["ocupada", "disponible", "reservada", "bloqueada"];

export interface OccupancySummary {
  total: number; // rooms managed
  rentable: number; // total minus blocked
  occupied: number;
  available: number;
  reserved: number;
  blocked: number;
  rate: number; // occupied / rentable, 0..1
}

export function summarizeOccupancy(rooms: Room[]): OccupancySummary {
  const count = (s: RoomStatus) => rooms.filter((r) => r.status === s).length;
  const blocked = count("bloqueada");
  const rentable = rooms.length - blocked;
  const occupied = count("ocupada");
  return {
    total: rooms.length,
    rentable,
    occupied,
    available: count("disponible"),
    reserved: count("reservada"),
    blocked,
    rate: rentable === 0 ? 0 : occupied / rentable,
  };
}

/** Outstanding cents across all non-void charges (same source as Dinero). */
export const totalPending = (data: PortfolioDataset): number => pendingCents(data);

export const getProperty = (data: PortfolioDataset, id: string) =>
  data.properties.find((p) => p.id === id);

export const getRoom = (data: PortfolioDataset, id: string) =>
  data.rooms.find((r) => r.id === id.toLowerCase());

export const roomsOf = (data: PortfolioDataset, propertyId: string) =>
  data.rooms.filter((r) => r.propertyId === propertyId);

export const pendingForRoom = (data: PortfolioDataset, roomId: string) =>
  pendingByRoom(data).filter((b) => b.roomId === roomId);

export const incidentsFor = (data: PortfolioDataset, propertyId: string, roomId?: string) =>
  data.incidents.filter(
    (i) => i.propertyId === propertyId && (roomId === undefined || i.roomId === roomId),
  );

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export type RoomSort = "codigo" | "renta-asc" | "renta-desc";
export type PropertySort = "nombre" | "ocupacion";

export function filterRooms(
  data: PortfolioDataset,
  opts: { q: string; status: RoomStatus | "todas"; sort: RoomSort },
): Room[] {
  const q = normalize(opts.q);
  const result = data.rooms.filter((r) => {
    if (opts.status !== "todas" && r.status !== opts.status) return false;
    if (!q) return true;
    const property = getProperty(data, r.propertyId);
    return [r.code, property?.name ?? "", property?.code ?? ""].some((v) => normalize(v).includes(q));
  });
  return result.sort((a, b) => {
    if (opts.sort === "renta-asc") return a.monthlyRent - b.monthlyRent || a.code.localeCompare(b.code);
    if (opts.sort === "renta-desc") return b.monthlyRent - a.monthlyRent || a.code.localeCompare(b.code);
    return a.code.localeCompare(b.code);
  });
}

export function filterProperties(
  data: PortfolioDataset,
  opts: { q: string; sort: PropertySort },
): Property[] {
  const q = normalize(opts.q);
  const result = data.properties.filter(
    (p) => !q || normalize(p.name).includes(q) || normalize(p.code).includes(q),
  );
  return result.sort((a, b) => {
    if (opts.sort === "ocupacion") {
      const ra = summarizeOccupancy(roomsOf(data, a.id)).rate;
      const rb = summarizeOccupancy(roomsOf(data, b.id)).rate;
      return rb - ra || a.name.localeCompare(b.name);
    }
    return a.name.localeCompare(b.name);
  });
}
