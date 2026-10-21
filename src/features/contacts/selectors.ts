import type { Contact, ContactRole, PortfolioDataset } from "@/features/portfolio/data/types";

export const CONTACT_ROLES: ContactRole[] = ["inquilino", "propietario", "arrendador", "proveedor", "avalista", "candidato"];

export const roleLabel: Record<ContactRole, string> = {
  inquilino: "Inquilino",
  propietario: "Propietario",
  arrendador: "Arrendador",
  proveedor: "Proveedor",
  avalista: "Avalista",
  candidato: "Candidato",
};

export const getContact = (data: PortfolioDataset, id: string) =>
  data.contacts.find((c) => c.id === id.toLowerCase());

const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function filterContacts(data: PortfolioDataset, opts: { q: string; role: ContactRole | "todos" }): Contact[] {
  const q = normalize(opts.q);
  return data.contacts
    .filter((c) => opts.role === "todos" || c.roles.includes(opts.role))
    .filter((c) => !q || normalize(c.name).includes(q) || normalize(c.code).includes(q))
    .sort((a, b) => a.code.localeCompare(b.code));
}

/** Contracts where the contact takes part, with its part in each. */
export function contractsOfContact(data: PortfolioDataset, contactId: string) {
  return data.contracts
    .flatMap((ct) => {
      const parts: string[] = [];
      if (ct.tenantIds.includes(contactId)) parts.push("Inquilino");
      if (ct.landlordId === contactId) parts.push("Arrendador");
      if (ct.guarantorIds.includes(contactId)) parts.push("Avalista");
      return parts.length ? [{ contract: ct, parts }] : [];
    })
    .sort((a, b) => b.contract.startDate.localeCompare(a.contract.startDate));
}

export const propertiesOwnedBy = (data: PortfolioDataset, contactId: string) =>
  data.properties.filter((p) => p.ownerId === contactId);

export const incidentsOfProvider = (data: PortfolioDataset, contactId: string) =>
  data.incidents.filter((i) => i.providerId === contactId);

export const contactsWithRole = (data: PortfolioDataset, roles: ContactRole[]) =>
  data.contacts.filter((c) => c.roles.some((r) => roles.includes(r)));
