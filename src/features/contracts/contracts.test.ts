import { describe, expect, it } from "vitest";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import { activeContractForRoom, rangesOverlap } from "./selectors";
import { contractsOfContact, getContact } from "@/features/contacts/selectors";
import { emptyDraft, parseEuroToCents, validateParties, validateTerms } from "./draft";
import { addDays } from "@/lib/format";

describe("contracts ↔ rooms ↔ contacts coherence", () => {
  it("each occupied room has exactly one active contract covering 21/10/2026; others none", () => {
    for (const r of data.rooms) {
      const active = data.contracts.filter((c) => c.roomId === r.id && c.status === "activo");
      if (r.status === "ocupada") {
        expect(active).toHaveLength(1);
        expect(active[0]!.startDate <= data.referenceDate && data.referenceDate < active[0]!.endDate).toBe(true);
      } else expect(active).toHaveLength(0);
    }
    expect(data.contracts.filter((c) => c.status === "activo")).toHaveLength(8);
  });

  it("OLI-02 links to CT-EJ-0102 from 01/09/2026 with its tenant", () => {
    const c = activeContractForRoom(data, "oli-02")!;
    expect([c.reference, c.startDate]).toEqual(["CT-EJ-0102", "2026-09-01"]);
    expect(getContact(data, c.tenantIds[0]!)?.roles).toContain("inquilino");
  });

  it("every contract status has an example and all IDs resolve", () => {
    for (const s of ["borrador", "pendiente", "activo", "finalizado", "cancelado"])
      expect(data.contracts.some((c) => c.status === s)).toBe(true);
    for (const c of data.contracts) {
      expect(data.rooms.find((r) => r.id === c.roomId)?.propertyId).toBe(c.propertyId);
      for (const id of [c.landlordId, ...c.tenantIds, ...c.guarantorIds]) expect(getContact(data, id)).toBeDefined();
      expect(c.dueDay >= 1 && c.dueDay <= 28).toBe(true);
    }
  });

  it("finished contracts never overlap a current one on the same room", () => {
    for (const f of data.contracts.filter((c) => c.status === "finalizado")) {
      const a = activeContractForRoom(data, f.roomId);
      if (a) expect(rangesOverlap(f.startDate, f.endDate, a.startDate, a.endDate)).toBe(false);
    }
  });

  it("one contact holds two roles without duplication", () => {
    const multi = data.contacts.filter((c) => c.roles.length > 1 && c.roles.includes("inquilino") && c.roles.includes("avalista"));
    expect(multi).toHaveLength(1);
    expect(contractsOfContact(data, multi[0]!.id).flatMap((x) => x.parts).sort()).toEqual(["Avalista", "Inquilino"]);
    expect(new Set(data.contacts.map((c) => c.name)).size).toBe(data.contacts.length);
  });
});

describe("draft wizard validation", () => {
  const valid = { ...emptyDraft, startDate: "2026-11-01", endDate: "2027-07-01", rent: "350,50", deposit: "0", dueDay: "5", modality: "Temporada por estudios" };

  it("rejects equal or inverted dates", () => {
    expect(validateTerms({ ...valid, endDate: "2026-11-01" }).endDate).toBeDefined();
    expect(validateTerms({ ...valid, endDate: "2026-10-01" }).endDate).toBeDefined();
    expect(validateTerms(valid)).toEqual({});
  });

  it("due day must be integer 1..28", () => {
    expect(validateTerms({ ...valid, dueDay: "29" }).dueDay).toBeDefined();
    expect(validateTerms({ ...valid, dueDay: "0" }).dueDay).toBeDefined();
    expect(validateTerms({ ...valid, dueDay: "5.5" }).dueDay).toBeDefined();
    expect(validateTerms({ ...valid, dueDay: "28" }).dueDay).toBeUndefined();
  });

  it("rent must be positive, deposit may be 0, amounts parsed to exact cents", () => {
    expect(validateTerms({ ...valid, rent: "0" }).rent).toBeDefined();
    expect(validateTerms({ ...valid, rent: "-5" }).rent).toBeDefined();
    expect(validateTerms({ ...valid, rent: "abc" }).rent).toBeDefined();
    expect(validateTerms({ ...valid, deposit: "-1" }).deposit).toBeDefined();
    expect(parseEuroToCents("1.250,50")).toBe(125050);
    expect(parseEuroToCents("0,10")).toBe(10);
  });

  it("check-out is excluded: last occupied day is the day before, across month/year ends", () => {
    expect(addDays("2027-07-01", -1)).toBe("2027-06-30");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
  });

  it("parties require suitable roles and explicit landlord", () => {
    const ok = { ...emptyDraft, roomId: "aza-05", landlordId: "con-011", tenantId: "con-014", guarantorId: "con-003" };
    expect(validateParties(ok, data)).toEqual({});
    expect(validateParties({ ...ok, landlordId: "" }, data).landlordId).toBeDefined();
    expect(validateParties({ ...ok, tenantId: "con-012" }, data).tenantId).toBeDefined();
    expect(validateParties({ ...ok, guarantorId: "con-002" }, data).guarantorId).toBeDefined();
  });
});
