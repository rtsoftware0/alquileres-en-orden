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
    expect(editContact(base, emptyOverlay(), "con-009", { roles: [...owner.roles, "candidato"].filter((r, i, a) => a.indexOf(r) === i) }).ok).toBe(true);
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
