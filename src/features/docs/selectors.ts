import type {
  Contact, DemoDocument, DemoNotice, DocLinkKind, DocVisibility, MessageThread,
  NoticeType, PortfolioDataset, ThreadMessage,
} from "@/features/portfolio/data/types";
import { DOC_CATEGORIES } from "./data/demo-docs";

// Selectors for documents, threads and notices. Read state and drafts are
// always derived; the base dataset is never mutated.

export const docCategories: string[] = [...DOC_CATEGORIES];

export const docLinkKindLabel: Record<DocLinkKind, string> = {
  contrato: "Contrato",
  incidencia: "Incidencia",
  gasto: "Gasto",
  inmueble: "Inmueble",
};

export const visibilityLabel: Record<DocVisibility, string> = {
  interna: "Interna",
  compartida: "Compartida (ejemplo)",
};

export const noticeTypeLabel: Record<NoticeType, string> = {
  vencimiento: "Vencimiento",
  deuda: "Deuda",
  incidencia: "Incidencia",
  tarea: "Tarea",
  fianza: "Fianza",
};

export const getDocument = (d: PortfolioDataset, id: string) => d.documents.find((x) => x.id === id.toLowerCase());
export const getThread = (d: PortfolioDataset, id: string) => d.threads.find((t) => t.id === id.toLowerCase());

/** Current version is the last one; earlier versions stay untouched. */
export const currentVersion = (doc: DemoDocument) => doc.versions[doc.versions.length - 1]!;
export const getVersion = (doc: DemoDocument, v: number) => doc.versions.find((x) => x.version === v);

/** Human label of the linked record, e.g. "CT-EJ-0102" or "GS-EJ-001". */
export function docLinkLabel(d: PortfolioDataset, doc: DemoDocument): string {
  switch (doc.link.kind) {
    case "contrato": return d.contracts.find((c) => c.id === doc.link.id)?.reference ?? doc.link.id;
    case "incidencia": return d.incidents.find((i) => i.id === doc.link.id)?.title ?? doc.link.id;
    case "gasto": return d.expenses.find((e) => e.id === doc.link.id)?.reference ?? doc.link.id;
    case "inmueble": return d.properties.find((p) => p.id === doc.link.id)?.name ?? doc.link.id;
  }
}

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export interface DocQuery {
  q: string;
  category: string | "todas";
  propertyId: string | "todos";
  linkKind: DocLinkKind | "todos";
}

export function filterDocuments(d: PortfolioDataset, o: DocQuery): DemoDocument[] {
  const q = normalize(o.q);
  return d.documents
    .filter((x) => o.category === "todas" || x.category === o.category)
    .filter((x) => o.propertyId === "todos" || x.propertyId === o.propertyId)
    .filter((x) => o.linkKind === "todos" || x.link.kind === o.linkKind)
    .filter((x) => !q || normalize(`${x.title} ${docLinkLabel(d, x)}`).includes(q))
    .sort((a, b) => a.title.localeCompare(b.title, "es"));
}

/** Contacts compatible as example recipients of a shared document. */
export function docRecipients(d: PortfolioDataset, link: { kind: DocLinkKind; id: string }): Contact[] {
  switch (link.kind) {
    case "contrato": {
      const c = d.contracts.find((x) => x.id === link.id);
      if (!c) return [];
      const ids = [c.landlordId, ...c.tenantIds, ...c.guarantorIds];
      return d.contacts.filter((x) => ids.includes(x.id));
    }
    case "incidencia": {
      const i = d.incidents.find((x) => x.id === link.id);
      return i?.providerId ? d.contacts.filter((x) => x.id === i.providerId) : [];
    }
    case "gasto": {
      const e = d.expenses.find((x) => x.id === link.id);
      return e ? d.contacts.filter((x) => x.id === e.providerId) : [];
    }
    case "inmueble": {
      const p = d.properties.find((x) => x.id === link.id);
      return p ? d.contacts.filter((x) => x.id === p.ownerId) : [];
    }
  }
}

// --- Threads

/** Internal notes never appear in the shared view. */
export function threadMessages(t: MessageThread, view: "todos" | "compartidos"): ThreadMessage[] {
  return t.messages.filter((m) => view === "todos" || m.visibility === "compartida");
}

/** Example recipients of a shared message: only contacts related to the context. */
export function threadRecipients(d: PortfolioDataset, t: MessageThread): Contact[] {
  if (t.context.kind === "contrato") {
    const c = d.contracts.find((x) => x.id === t.context.id);
    if (!c) return [];
    const ids = [c.landlordId, ...c.tenantIds, ...c.guarantorIds];
    return d.contacts.filter((x) => ids.includes(x.id));
  }
  const i = d.incidents.find((x) => x.id === t.context.id);
  return i?.providerId ? d.contacts.filter((x) => x.id === i.providerId) : [];
}

export const threadContextLabel = (d: PortfolioDataset, t: MessageThread): string =>
  t.context.kind === "contrato"
    ? d.contracts.find((c) => c.id === t.context.id)?.reference ?? t.context.id
    : d.incidents.find((i) => i.id === t.context.id)?.title ?? t.context.id;

// --- Notices

/** Base read state plus the temporary simulated reads; base never changes. */
export function noticesWithRead(d: PortfolioDataset, simulatedRead: ReadonlySet<string>): (DemoNotice & { effectiveRead: boolean })[] {
  return d.notices.map((n) => ({ ...n, effectiveRead: n.read || simulatedRead.has(n.id) }));
}

export interface NoticeQuery {
  q: string;
  type: NoticeType | "todos";
  onlyUnread: boolean;
}

export function filterNotices(d: PortfolioDataset, o: NoticeQuery, simulatedRead: ReadonlySet<string>) {
  const q = normalize(o.q);
  return noticesWithRead(d, simulatedRead)
    .filter((n) => o.type === "todos" || n.type === o.type)
    .filter((n) => !o.onlyUnread || !n.effectiveRead)
    .filter((n) => !q || normalize(n.text).includes(q))
    .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}

export function noticeCounts(d: PortfolioDataset, simulatedRead: ReadonlySet<string>) {
  const all = noticesWithRead(d, simulatedRead);
  const unread = all.filter((n) => !n.effectiveRead);
  return { total: all.length, unread: unread.length };
}
