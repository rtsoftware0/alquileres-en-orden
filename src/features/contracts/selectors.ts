import type { Contract, ContractStatus, PortfolioDataset } from "@/features/portfolio/data/types";
import { getContact } from "@/features/contacts/selectors";

export const CONTRACT_STATUSES: ContractStatus[] = ["borrador", "pendiente", "activo", "finalizado", "cancelado"];

export const getContract = (data: PortfolioDataset, id: string) =>
  data.contracts.find((c) => c.id === id.toLowerCase());

/** Half-open interval [start, end) overlap. */
export const rangesOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) =>
  aStart < bEnd && bStart < aEnd;

export const activeContractForRoom = (data: PortfolioDataset, roomId: string) =>
  data.contracts.find((c) => c.roomId === roomId && c.status === "activo");

export const contractsForRoom = (data: PortfolioDataset, roomId: string) =>
  data.contracts.filter((c) => c.roomId === roomId).sort((a, b) => b.startDate.localeCompare(a.startDate));

export const tenantNames = (data: PortfolioDataset, c: Contract) =>
  c.tenantIds.map((id) => getContact(data, id)?.name ?? id).join(", ");

const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function filterContracts(
  data: PortfolioDataset,
  opts: { q: string; propertyId: string | "todos"; status: ContractStatus | "todos" },
): Contract[] {
  const q = normalize(opts.q);
  return data.contracts
    .filter((c) => opts.propertyId === "todos" || c.propertyId === opts.propertyId)
    .filter((c) => opts.status === "todos" || c.status === opts.status)
    .filter((c) => {
      if (!q) return true;
      const room = data.rooms.find((r) => r.id === c.roomId);
      return [c.reference, room?.code ?? "", tenantNames(data, c)].some((v) => normalize(v).includes(q));
    })
    .sort((a, b) => a.reference.localeCompare(b.reference));
}

/** Example-only warning: active or pending contracts on the same room overlapping the range. */
export const exampleOverlaps = (data: PortfolioDataset, roomId: string, start: string, end: string) =>
  data.contracts.filter(
    (c) => c.roomId === roomId && (c.status === "activo" || c.status === "pendiente") && rangesOverlap(start, end, c.startDate, c.endDate),
  );
