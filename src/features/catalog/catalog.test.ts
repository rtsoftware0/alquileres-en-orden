import { describe, expect, it } from "vitest";
import { demoPortfolio as base } from "@/features/portfolio/data/demo-data";
import { summarizeOccupancy } from "@/features/portfolio/selectors";
import { pendingCents } from "@/features/money/selectors";
import {
  addContact, addProperty, addRoom, catalogLabels, editContact, editProperty, editRoom, emptyOverlay, mergeCatalog,
  normalizeCode, protectedFields, requiredRoles,
} from "./engine";
import type { CatalogOverlay } from "./types";

const ok = (r: ReturnType<typeof addContact>): CatalogOverlay => {
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  return r.overlay;
};

function chain() {
  let o = emptyOverlay();
  const c = addContact(base, o, { code: "CON-900", name: "Propietaria Ejemplo", type: "persona", roles: ["propietario", "avalista"], email: "propietaria@example.invalid" });
  o = ok(c);
  const contactId = c.ok ? c.id : "";
  const p = addProperty(base, o, { code: "PRU", name: "Casa Prueba", address: "Calle Ficticia 1", ownerId: contactId, kind: "vivienda" });
  o = ok(p);
  const propertyId = p.ok ? p.id : "";
  const r = addRoom(base, o, { code: "PRU-01", propertyId, monthlyRent: 400, features: [], capacity: 1 });
  o = ok(r);
  return { o, contactId, propertyId, roomId: r.ok ? r.id : "" };
}

describe("catalog overlay", () => {
  it("empty overlay keeps base figures and exact references for non-catalog collections", () => {
    const view = mergeCatalog(base, emptyOverlay());
    expect(view.contacts).toHaveLength(15);
    expect(view.rooms).toHaveLength(12);
    const s = summarizeOccupancy(view.rooms);
    expect([s.occupied, s.rentable]).toEqual([8, 11]);
    expect(pendingCents(view)).toBe(140000);
    for (const k of ["contracts", "charges", "payments", "allocations", "depositMovements", "expenses", "expenseShares", "expensePayments", "incidents", "tasks", "documents", "threads", "notices", "applications", "reservations"] as const) {
      expect(view[k]).toBe(base[k]);
    }
  });

  it("an added available unit increases the denominator without financial activity", () => {
    const { o, roomId } = chain();
    const view = mergeCatalog(base, o);
    const s = summarizeOccupancy(view.rooms);
    expect([s.occupied, s.rentable, s.total]).toEqual([8, 12, 13]);
    expect(view.rooms.find((r) => r.id === roomId)?.status).toBe("disponible");
    expect(pendingCents(view)).toBe(140000);
    expect(view.contracts).toBe(base.contracts);
    expect(base.rooms).toHaveLength(12);
    expect(base.contacts).toHaveLength(15);
  });

  it("IDs come from a monotonic counter, never from names or codes", () => {
    const { o, contactId, propertyId, roomId } = chain();
    expect([contactId, propertyId, roomId]).toEqual(["cat-con-1", "cat-inm-2", "cat-uni-3"]);
    const edited = editContact(base, o, contactId, { name: "Otro nombre", code: "CON-901" });
    expect(edited.ok).toBe(true);
    if (edited.ok) expect(mergeCatalog(base, edited.overlay).contacts.some((c) => c.id === "cat-con-1" && c.code === "CON-901")).toBe(true);
  });

  it("rejects normalized duplicate codes and warns on similar names without merging", () => {
    const dup = addRoom(base, emptyOverlay(), { code: "oli 01", propertyId: "casa-olivo", monthlyRent: 300, features: [] });
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.errors["code"]).toBeTruthy();
    expect(normalizeCode("Olí-01")).toBe(normalizeCode("OLI01"));
    const similar = addContact(base, emptyOverlay(), { code: "CON-950", name: base.contacts[0]!.name.toUpperCase(), type: "persona", roles: ["candidato"] });
    expect(similar.ok).toBe(true);
    if (similar.ok) {
      expect(similar.warnings.length).toBe(1);
      expect(mergeCatalog(base, similar.overlay).contacts).toHaveLength(16);
    }
  });

  it("supports all roles and multiple roles; validates fictitious email", () => {
    const all = addContact(base, emptyOverlay(), { code: "CON-960", name: "Empresa Multirrol", type: "empresa", roles: ["inquilino", "propietario", "arrendador", "proveedor", "avalista", "candidato"] });
    expect(all.ok).toBe(true);
    const bad = addContact(base, emptyOverlay(), { code: "CON-961", name: "X", type: "persona", roles: ["inquilino"], email: "real@gmail.com" });
    expect(bad.ok).toBe(false);
  });

  it("owner reference must exist and have the propietario role; no grant is created", () => {
    const noOwner = addProperty(base, emptyOverlay(), { code: "ZZZ", name: "Sin dueño", address: "Calle 1", ownerId: "no-existe" });
    expect(noOwner.ok).toBe(false);
    const provider = base.contacts.find((c) => c.roles.includes("proveedor") && !c.roles.includes("propietario"))!;
    const wrongRole = addProperty(base, emptyOverlay(), { code: "ZZZ", name: "Rol erróneo", address: "Calle 1", ownerId: provider.id });
    expect(wrongRole.ok).toBe(false);
  });

  it("allows descriptive edits on base records and keeps money identical", () => {
    let o = emptyOverlay();
    const r1 = editProperty(base, o, "casa-olivo", { name: "Casa Olivo Renovada", address: "Otra dirección ficticia" });
    expect(r1.ok).toBe(true);
    if (r1.ok) o = r1.overlay;
    const r2 = editRoom(base, o, "oli-05", { monthlyRent: 415, capacity: 1, unitKind: "habitacion" });
    expect(r2.ok).toBe(true);
    if (r2.ok) o = r2.overlay;
    const view = mergeCatalog(base, o);
    expect(catalogLabels(view).propertyName("casa-olivo")).toBe("Casa Olivo Renovada");
    expect(base.properties[0]!.name).toBe("Casa Olivo");
    expect(pendingCents(view)).toBe(140000);
    expect(view.contracts.every((c, i) => c.rentCents === base.contracts[i]!.rentCents)).toBe(true);
  });

  it("protects base codes, owner, unit relation/status and IDs", () => {
    expect(protectedFields(base, "property", "casa-azahar")).toEqual(expect.arrayContaining(["id", "code", "ownerId"]));
    expect(editProperty(base, emptyOverlay(), "casa-azahar", { ownerId: "con-011" }).ok).toBe(false);
    expect(editProperty(base, emptyOverlay(), "casa-olivo", { code: "OLX" }).ok).toBe(false);
    expect(editRoom(base, emptyOverlay(), "oli-01", { code: "OLI-99" }).ok).toBe(false);
    const { o, propertyId, roomId } = chain();
    expect(editProperty(base, o, propertyId, { code: "PRX" }).ok).toBe(true);
    expect(editRoom(base, o, roomId, { code: "PRU-02" }).ok).toBe(true);
  });

  it("blocks removing roles required by existing relations, allows the rest", () => {
    const view = mergeCatalog(base, emptyOverlay());
    expect(requiredRoles(view, "con-009")).toContain("propietario");
    const owner = base.contacts.find((c) => c.id === "con-009")!;
    expect(editContact(base, emptyOverlay(), "con-009", { roles: owner.roles.filter((r) => r !== "propietario").concat(owner.roles.length === 1 ? (["avalista"] as const) : []) }).ok).toBe(false);
    expect(editContact(base, emptyOverlay(), "con-009", { roles: [...owner.roles, "candidato" as const].filter((r, i, a) => a.indexOf(r) === i) }).ok).toBe(true);
  });

  it("validates finite rent, integer capacity and optional area", () => {
    expect(addRoom(base, emptyOverlay(), { code: "T-1", propertyId: "casa-olivo", monthlyRent: Number.NaN, features: [] }).ok).toBe(false);
    expect(addRoom(base, emptyOverlay(), { code: "T-2", propertyId: "casa-olivo", monthlyRent: 300, capacity: 1.5, features: [] }).ok).toBe(false);
    const noArea = addRoom(base, emptyOverlay(), { code: "T-3", propertyId: "casa-olivo", monthlyRent: 300, features: [] });
    expect(noArea.ok).toBe(true);
  });

  it("operations never mutate the overlay passed in", () => {
    const o = emptyOverlay();
    addContact(base, o, { code: "CON-970", name: "Temporal", type: "persona", roles: ["candidato"] });
    expect(o.added.contacts).toHaveLength(0);
    expect(o.seq).toBe(0);
  });
});

describe("catalog regressions (tanda 1 fixes)", () => {
  it("chained additions get distinct IDs and a normalized duplicate is rejected without replacing the first", () => {
    const a = addContact(base, emptyOverlay(), { code: "CAT-1", name: "Uno", type: "persona", roles: ["candidato"] });
    const o1 = ok(a);
    const b = addContact(base, o1, { code: "cat 1", name: "Dos", type: "persona", roles: ["candidato"] });
    expect(b.ok).toBe(false);
    const c = addContact(base, o1, { code: "CAT-2", name: "Tres", type: "persona", roles: ["candidato"] });
    expect(a.ok && c.ok && a.id !== c.id).toBe(true);
    expect(mergeCatalog(base, o1).contacts.find((x) => x.code === "CAT-1")?.name).toBe("Uno");
    expect(o1.seq).toBe(1);
  });

  it("candidates con-013/con-014 accept a descriptive note and keep candidato without inquilino", () => {
    for (const id of ["con-013", "con-014"]) {
      const r = editContact(base, emptyOverlay(), id, { note: "Nota descriptiva" });
      expect(r.ok).toBe(true);
      if (r.ok) {
        const c = mergeCatalog(base, r.overlay).contacts.find((x) => x.id === id)!;
        expect(c.roles).toEqual(["candidato"]);
        expect(c.note).toBe("Nota descriptiva");
      }
    }
  });

  it("still blocks removing a present, linked role", () => {
    expect(editContact(base, emptyOverlay(), "con-013", { roles: ["avalista"] }).ok).toBe(false);
    const { o, contactId } = chain();
    const r = editContact(base, o, contactId, { roles: ["avalista"] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors["roles"]).toContain("Propietario");
    expect(editContact(base, o, contactId, { note: "Solo nota" }).ok).toBe(true);
  });

  it("accepts two-decimal rents in add and edit; rejects 3 decimals, NaN, Infinity, negatives, zero and > 100000", () => {
    for (const v of [525.55, 300.29]) {
      expect(addRoom(base, emptyOverlay(), { code: `D-${v}`, propertyId: "casa-olivo", monthlyRent: v, features: [] }).ok).toBe(true);
      expect(editRoom(base, emptyOverlay(), "oli-05", { monthlyRent: v }).ok).toBe(true);
    }
    for (const v of [525.555, Number.NaN, Number.POSITIVE_INFINITY, -1, 0, 100000.01]) {
      expect(addRoom(base, emptyOverlay(), { code: "D-X", propertyId: "casa-olivo", monthlyRent: v, features: [] }).ok).toBe(false);
      expect(editRoom(base, emptyOverlay(), "oli-05", { monthlyRent: v }).ok).toBe(false);
    }
  });
});

describe("catalog tanda 2 engine support", () => {
  it("warns on a matching email (case-insensitive) but not on empty or self", () => {
    const mail = base.contacts.find((c) => c.email)!;
    const r = addContact(base, emptyOverlay(), { code: "CON-980", name: "Otro", type: "persona", roles: ["candidato"], email: mail.email!.toUpperCase() });
    expect(r.ok).toBe(true);
    expect(r.warnings.some((w) => w.includes(mail.code))).toBe(true);
    const empty = addContact(base, emptyOverlay(), { code: "CON-981", name: "Sin correo", type: "persona", roles: ["candidato"], email: "" });
    expect(empty.warnings).toHaveLength(0);
    const self = editContact(base, emptyOverlay(), mail.id, { note: "x" });
    expect(self.ok && self.warnings.every((w) => !w.includes("correo"))).toBe(true);
  });

  it("an added unit without relations may move to another existing property; base units may not", () => {
    const { o, roomId } = chain();
    const moved = editRoom(base, o, roomId, { propertyId: "casa-olivo" });
    expect(moved.ok).toBe(true);
    if (moved.ok) expect(mergeCatalog(base, moved.overlay).rooms.find((r) => r.id === roomId)?.propertyId).toBe("casa-olivo");
    expect(editRoom(base, o, roomId, { propertyId: "no-existe" }).ok).toBe(false);
    expect(editRoom(base, emptyOverlay(), "oli-01", { propertyId: "casa-azahar" }).ok).toBe(false);
    expect(protectedFields(base, "room", "oli-01")).toContain("propertyId");
    expect(protectedFields(base, "room", roomId)).not.toContain("propertyId");
    expect(protectedFields(base, "room", roomId)).toContain("status");
  });

  it("editing OLI-05 rent keeps contract cents and tenant debt", () => {
    const r = editRoom(base, emptyOverlay(), "oli-05", { monthlyRent: 525.55 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const view = mergeCatalog(base, r.overlay);
      expect(view.contracts.find((c) => c.roomId === "oli-05" && c.status === "borrador")?.rentCents).toBe(41000);
      expect(pendingCents(view)).toBe(140000);
    }
  });
});

describe("clearing optional fields (absent = keep, null = clear)", () => {
  const prop = base.properties[0]!;
  const room = base.rooms[0]!;
  const viewProp = (o: CatalogOverlay, id: string) => mergeCatalog(base, o).properties.find((p) => p.id === id)!;
  const viewRoom = (o: CatalogOverlay, id: string) => mergeCatalog(base, o).rooms.find((r) => r.id === id)!;

  it("base property: set kind → clear → later edit of another field keeps it empty", () => {
    let o = ok(editProperty(base, emptyOverlay(), prop.id, { kind: "edificio" }));
    expect(viewProp(o, prop.id).kind).toBe("edificio");
    o = ok(editProperty(base, o, prop.id, { kind: null }));
    expect("kind" in viewProp(o, prop.id)).toBe(false);
    o = ok(editProperty(base, o, prop.id, { portfolioLabel: "Cartera B" }));
    expect("kind" in viewProp(o, prop.id)).toBe(false);
    expect(viewProp(o, prop.id).portfolioLabel).toBe("Cartera B");
    expect(viewProp(o, prop.id).ownerId).toBe(prop.ownerId);
  });

  it("added property born with kind: clear survives later edits; omitting keeps; reassign restores", () => {
    const { o: o0, propertyId } = chain();
    let o = ok(editProperty(base, o0, propertyId, { portfolioLabel: "X" }));
    expect(viewProp(o, propertyId).kind).toBe("vivienda");
    o = ok(editProperty(base, o, propertyId, { kind: null }));
    o = ok(editProperty(base, o, propertyId, { managerName: "Gestora Ejemplo" }));
    expect("kind" in viewProp(o, propertyId)).toBe(false);
    o = ok(editProperty(base, o, propertyId, { kind: "local" }));
    expect(viewProp(o, propertyId).kind).toBe("local");
  });

  it("base room: set capacity and unitKind → clear → later edit keeps both empty", () => {
    let o = ok(editRoom(base, emptyOverlay(), room.id, { capacity: 2, unitKind: "estudio" }));
    o = ok(editRoom(base, o, room.id, { capacity: null }));
    expect("capacity" in viewRoom(o, room.id)).toBe(false);
    expect(viewRoom(o, room.id).unitKind).toBe("estudio");
    o = ok(editRoom(base, o, room.id, { unitKind: null }));
    o = ok(editRoom(base, o, room.id, { features: ["Luz natural"] }));
    const v = viewRoom(o, room.id);
    expect("capacity" in v || "unitKind" in v).toBe(false);
    expect([v.code, v.propertyId, v.status]).toEqual([room.code, room.propertyId, room.status]);
  });

  it("added room born with capacity: clear persists; reassign restores", () => {
    const { o: o0, roomId } = chain();
    let o = ok(editRoom(base, o0, roomId, { capacity: null }));
    o = ok(editRoom(base, o, roomId, { monthlyRent: 410 }));
    expect("capacity" in viewRoom(o, roomId)).toBe(false);
    o = ok(editRoom(base, o, roomId, { capacity: 3 }));
    expect(viewRoom(o, roomId).capacity).toBe(3);
  });

  it("a clear combined with an invalid field is rejected as a whole", () => {
    const o = ok(editRoom(base, emptyOverlay(), room.id, { unitKind: "estudio", capacity: 2 }));
    const r = editRoom(base, o, room.id, { unitKind: null, capacity: 0 });
    expect(r.ok).toBe(false);
    const p = editProperty(base, ok(editProperty(base, emptyOverlay(), prop.id, { kind: "local" })), prop.id, { kind: null, name: "" });
    expect(p.ok).toBe(false);
    expect(viewRoom(o, room.id).unitKind).toBe("estudio");
  });

  it("clearing never unlocks protected fields", () => {
    const r = editProperty(base, emptyOverlay(), prop.id, { kind: null, ownerId: `${prop.ownerId}-otro` });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.ownerId).toBeDefined();
  });
});
