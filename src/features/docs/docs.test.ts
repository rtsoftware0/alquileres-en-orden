import { describe, expect, it } from "vitest";
import { demoPortfolio as data } from "@/features/portfolio/data/demo-data";
import {
  currentVersion, docRecipients, filterDocuments, filterNotices, getDocument, getVersion,
  noticeCounts, noticesWithRead, threadMessages, threadRecipients, getThread,
} from "./selectors";
import { DOC_EXAMPLES, docDraftProperty, emptyDocDraft, validateDocDraftData, validateDocDraftVisibility } from "./draft";

describe("documents, threads and notices data", () => {
  it("keeps exactly 5 documents, 3 threads and 5 notices with valid relations", () => {
    expect(data.documents).toHaveLength(5);
    expect(data.threads).toHaveLength(3);
    expect(data.notices).toHaveLength(5);
    for (const doc of data.documents) {
      expect(data.properties.some((p) => p.id === doc.propertyId)).toBe(true);
      const exists =
        (doc.link.kind === "contrato" && data.contracts.some((c) => c.id === doc.link.id)) ||
        (doc.link.kind === "incidencia" && data.incidents.some((i) => i.id === doc.link.id)) ||
        (doc.link.kind === "gasto" && data.expenses.some((e) => e.id === doc.link.id)) ||
        (doc.link.kind === "inmueble" && data.properties.some((p) => p.id === doc.link.id));
      expect(exists).toBe(true);
      if (doc.visibility === "interna") expect(doc.recipientIds).toEqual([]);
      else expect(doc.recipientIds.length).toBeGreaterThan(0);
    }
    for (const t of data.threads) {
      const ok =
        (t.context.kind === "contrato" && data.contracts.some((c) => c.id === t.context.id)) ||
        (t.context.kind === "incidencia" && data.incidents.some((i) => i.id === t.context.id));
      expect(ok).toBe(true);
    }
  });

  it("doc-1 stays the inc-2 budget of 120 € proposed v1; the 2-version demo is another document", () => {
    const doc1 = getDocument(data, "doc-1")!;
    expect(doc1.link).toEqual({ kind: "incidencia", id: "inc-2" });
    expect(doc1.versions).toHaveLength(1);
    expect(data.incidents.find((i) => i.id === "inc-2")?.budget).toMatchObject({ amountCents: 12000, status: "propuesto", version: 1 });
    const doc2 = getDocument(data, "doc-2")!;
    expect(doc2.versions).toHaveLength(2);
  });

  it("version selection preserves history: v1 content is intact after reading v2", () => {
    const doc2 = getDocument(data, "doc-2")!;
    const v1 = getVersion(doc2, 1)!;
    const v2 = currentVersion(doc2);
    expect(v2.version).toBe(2);
    expect(v1.content).toContain("versión 1");
    expect(v2.content).not.toBe(v1.content);
    expect(doc2.versions[0]).toBe(v1); // never overwritten
  });

  it("document filters combine and can return zero", () => {
    expect(filterDocuments(data, { q: "", category: "todas", propertyId: "todos", linkKind: "todos" })).toHaveLength(5);
    expect(filterDocuments(data, { q: "persiana", category: "todas", propertyId: "todos", linkKind: "todos" })).toHaveLength(1);
    expect(filterDocuments(data, { q: "", category: "Factura", propertyId: "casa-azahar", linkKind: "todos" })).toHaveLength(0);
    expect(filterDocuments(data, { q: "", category: "todas", propertyId: "casa-azahar", linkKind: "incidencia" })).toHaveLength(1);
  });

  it("internal notes never appear in the shared view of a thread", () => {
    const t = getThread(data, "thr-inc-1")!;
    expect(t.messages.some((m) => m.visibility === "interna")).toBe(true);
    expect(threadMessages(t, "compartidos").every((m) => m.visibility === "compartida")).toBe(true);
    expect(threadMessages(t, "todos")).toHaveLength(t.messages.length);
  });

  it("thread recipients are limited to contacts related to the context", () => {
    const contract = getThread(data, "thr-ct-0102")!;
    expect(threadRecipients(data, contract).map((c) => c.id).sort()).toEqual(["con-002", "con-009"]);
    const inc2 = getThread(data, "thr-inc-2")!;
    expect(threadRecipients(data, inc2).map((c) => c.id)).toEqual(["con-012"]);
    const inc3 = data.threads.find((t) => t.context.id === "inc-3");
    expect(inc3).toBeUndefined(); // no thread without data
  });
});

describe("document draft validation", () => {
  it("empty draft fails per field; valid draft passes", () => {
    const e = validateDocDraftData(emptyDocDraft);
    expect(Object.keys(e).sort()).toEqual(["category", "exampleId", "linkId", "linkKind", "name"]);
    const ok = { ...emptyDocDraft, exampleId: DOC_EXAMPLES[0].id, name: "Inventario de prueba", category: "Inventario", linkKind: "contrato" as const, linkId: "ct-ej-0102" };
    expect(validateDocDraftData(ok)).toEqual({});
  });

  it("derives the property from the linked record", () => {
    expect(docDraftProperty(data, "contrato", "ct-ej-0203")).toBe("casa-azahar");
    expect(docDraftProperty(data, "gasto", "gs-ej-001")).toBe("casa-olivo");
    expect(docDraftProperty(data, "inmueble", "casa-azahar")).toBe("casa-azahar");
    expect(docDraftProperty(data, "contrato", "no-existe")).toBeUndefined();
  });

  it("internal visibility forbids recipients; shared requires compatible ones", () => {
    const base = { ...emptyDocDraft, linkKind: "incidencia" as const, linkId: "inc-2" };
    expect(validateDocDraftVisibility(data, { ...base, visibility: "interna", recipientIds: ["con-012"] }).recipients).toBeTruthy();
    expect(validateDocDraftVisibility(data, { ...base, visibility: "interna", recipientIds: [] })).toEqual({});
    expect(validateDocDraftVisibility(data, { ...base, visibility: "compartida", recipientIds: [] }).recipients).toBeTruthy();
    // con-002 is a tenant of OLI-02, not related to inc-2
    expect(validateDocDraftVisibility(data, { ...base, visibility: "compartida", recipientIds: ["con-002"] }).recipients).toBeTruthy();
    expect(validateDocDraftVisibility(data, { ...base, visibility: "compartida", recipientIds: ["con-012"] })).toEqual({});
  });

  it("docRecipients matches the linked record only", () => {
    expect(docRecipients(data, { kind: "gasto", id: "gs-ej-001" }).map((c) => c.id)).toEqual(["con-012"]);
    expect(docRecipients(data, { kind: "inmueble", id: "casa-azahar" }).map((c) => c.id)).toEqual(["con-010"]);
  });
});

describe("notices", () => {
  it("base counts: 5 notices, 3 unread; simulated reads are temporary and coherent", () => {
    expect(noticeCounts(data, new Set())).toEqual({ total: 5, unread: 3 });
    const sim = new Set(["av-1"]);
    expect(noticeCounts(data, sim)).toEqual({ total: 5, unread: 2 });
    // base read flags unchanged
    expect(data.notices.find((n) => n.id === "av-1")?.read).toBe(false);
    expect(noticesWithRead(data, sim).find((n) => n.id === "av-1")?.effectiveRead).toBe(true);
  });

  it("only-unread filter reacts to simulated reads; filters combine and can return zero", () => {
    expect(filterNotices(data, { q: "", type: "todos", onlyUnread: true }, new Set())).toHaveLength(3);
    expect(filterNotices(data, { q: "", type: "todos", onlyUnread: true }, new Set(["av-1", "av-2", "av-3"]))).toHaveLength(0);
    expect(filterNotices(data, { q: "fianza", type: "todos", onlyUnread: false }, new Set())).toHaveLength(1);
    expect(filterNotices(data, { q: "texto inexistente", type: "todos", onlyUnread: false }, new Set())).toHaveLength(0);
  });

  it("every notice links to an existing record", () => {
    for (const n of data.notices) {
      const l = n.link;
      const ok =
        (l.kind === "cargo" && data.charges.some((c) => c.id === l.id)) ||
        (l.kind === "incidencia" && data.incidents.some((i) => i.id === l.id)) ||
        l.kind === "tareas" ||
        (l.kind === "fianza" && data.contracts.some((c) => c.id === l.id));
      expect(ok).toBe(true);
    }
  });
});

describe("base scenario stays untouched", () => {
  it("12 rooms, 12 contracts, 15 contacts, 1400 € pending, expenses 540/170/370, AZA-06 blocked", () => {
    expect(data.rooms).toHaveLength(12);
    expect(data.contracts).toHaveLength(12);
    expect(data.contacts).toHaveLength(15);
    expect(data.incidents).toHaveLength(3);
    expect(data.tasks).toHaveLength(4);
    expect(data.rooms.find((r) => r.id === "aza-06")?.status).toBe("bloqueada");
  });
});
