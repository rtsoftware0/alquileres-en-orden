import { StrictMode, type ReactNode } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CatalogProvider, useCatalog } from "./CatalogContext";
import type { CatalogResult } from "./types";

afterEach(cleanup);

type Api = ReturnType<typeof useCatalog>;

function mount() {
  const ref: { api: Api | null } = { api: null };
  function Probe() { ref.api = useCatalog(); return null; }
  const wrap = (c: ReactNode) => <StrictMode><CatalogProvider>{c}</CatalogProvider></StrictMode>;
  render(wrap(<Probe />));
  return () => ref.api!;
}

const contact = (code: string, name = `Contacto ${code}`) => ({ code, name, type: "persona" as const, roles: ["candidato" as const] });
const idOf = (r: CatalogResult) => (r.ok ? r.id : null);

describe("CatalogProvider under StrictMode", () => {
  it("two additions in one act on the same API object keep both with distinct IDs", () => {
    const get = mount();
    const api = get();
    let a!: CatalogResult, b!: CatalogResult;
    act(() => { a = api.addContact(contact("CON-901")); b = api.addContact(contact("CON-902")); });
    expect(a.ok && b.ok).toBe(true);
    expect(idOf(a)).toBe("cat-con-1");
    expect(idOf(b)).toBe("cat-con-2");
    const added = get().overlay.added.contacts.map((c) => c.id);
    expect(added).toEqual(["cat-con-1", "cat-con-2"]);
    expect(get().data.contacts).toHaveLength(17);
  });

  it("two edits in one act on the same API object keep both", () => {
    const get = mount();
    const api = get();
    act(() => {
      expect(api.editContact("con-013", { note: "Nota A" }).ok).toBe(true);
      expect(api.editContact("con-013", { name: "Javier Ejemplo Editado" }).ok).toBe(true);
    });
    const c = get().data.contacts.find((x) => x.id === "con-013")!;
    expect(c.note).toBe("Nota A");
    expect(c.name).toBe("Javier Ejemplo Editado");
    expect(c.roles).toEqual(["candidato"]);
  });

  it("a normalized duplicate in the same act is rejected atomically and keeps the first", () => {
    const get = mount();
    const api = get();
    let first!: CatalogResult, dup!: CatalogResult;
    act(() => { first = api.addContact(contact("CON-905", "Primera")); dup = api.addContact(contact("con 905", "Segunda")); });
    expect(first.ok).toBe(true);
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.errors["code"]).toBeTruthy();
    const o = get().overlay;
    expect(o.seq).toBe(1);
    expect(o.added.contacts.map((c) => c.name)).toEqual(["Primera"]);
    let next!: CatalogResult;
    act(() => { next = get().addContact(contact("CON-906")); });
    expect(idOf(next)).toBe("cat-con-2");
  });

  it("add → reset → add in one event leaves only the last addition", () => {
    const get = mount();
    const api = get();
    let last!: CatalogResult;
    act(() => { api.addContact(contact("CON-910")); api.reset(); last = api.addContact(contact("CON-911")); });
    expect(idOf(last)).toBe("cat-con-1");
    const o = get().overlay;
    expect(o.added.contacts.map((c) => c.code)).toEqual(["CON-911"]);
    expect(o.seq).toBe(1);
  });

  it("results are synchronous: a returned ID can be used immediately in the same act", () => {
    const get = mount();
    const api = get();
    act(() => {
      const owner = api.addContact({ code: "CON-920", name: "Dueña", type: "persona", roles: ["propietario"] });
      expect(owner.ok).toBe(true);
      const prop = api.addProperty({ code: "PRV", name: "Casa Provider", address: "Calle Ficticia 2", ownerId: idOf(owner)! });
      expect(prop.ok).toBe(true);
      const room = api.addRoom({ code: "PRV-01", propertyId: idOf(prop)!, monthlyRent: 525.55, features: [] });
      expect(idOf(room)).toBe("cat-uni-3");
    });
    expect(get().data.rooms.find((r) => r.id === "cat-uni-3")?.monthlyRent).toBe(525.55);
  });
});
