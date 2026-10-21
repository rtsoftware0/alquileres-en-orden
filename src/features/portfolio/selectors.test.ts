import { describe, expect, it } from "vitest";
import { demoPortfolio as data } from "./data/demo-data";
import { filterRooms, roomsOf, summarizeOccupancy, totalPending } from "./selectors";
import { formatDate, formatEUR, formatPercent } from "@/lib/format";

describe("demo portfolio rules", () => {
  it("occupancy is 8 of 11 rentable rooms (blocked excluded), 12 managed", () => {
    const s = summarizeOccupancy(data.rooms);
    expect([s.total, s.rentable, s.occupied, s.available, s.reserved, s.blocked]).toEqual([12, 11, 8, 2, 1, 1]);
    expect(formatPercent(s.rate)).toBe("73 %");
  });

  it("each property has 4 occupied rooms out of 6", () => {
    expect(summarizeOccupancy(roomsOf(data, "casa-olivo")).occupied).toBe(4);
    expect(summarizeOccupancy(roomsOf(data, "casa-azahar")).occupied).toBe(4);
  });

  it("pending balances total 1.400 € and belong to occupied rooms", () => {
    expect(formatEUR(totalPending(data)).replace(/\u00a0/g, " ")).toBe("1.400 €");
    for (const b of data.pendingBalances) {
      expect(data.rooms.find((r) => r.id === b.roomId)?.status).toBe("ocupada");
    }
  });

  it("search and status filters combine", () => {
    expect(filterRooms(data, { q: "OLI-01", status: "todas", sort: "codigo" })).toHaveLength(1);
    expect(filterRooms(data, { q: "Casa Azahar", status: "disponible", sort: "codigo" }).map((r) => r.code)).toEqual(["AZA-05"]);
    expect(filterRooms(data, { q: "zzz", status: "todas", sort: "codigo" })).toHaveLength(0);
  });
});
