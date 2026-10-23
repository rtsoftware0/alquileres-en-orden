import type { PortfolioDataset, Room } from "./types";
import { demoContacts } from "@/features/contacts/data/demo-contacts";
import { demoContracts } from "@/features/contracts/data/demo-contracts";
import { demoAllocations, demoCharges, demoDepositMovements, demoPayments } from "@/features/money/data/demo-money";
import { demoExpensePayments, demoExpenseShares, demoExpenses } from "@/features/money/data/demo-expenses";

// Fictitious demonstration data. No real people, addresses or payments.

const olivoFeatures = ["Amueblada", "Calefacción", "Wifi incluido"];
const azaharFeatures = ["Amueblada", "Aire acondicionado", "Wifi incluido"];

const rooms: Room[] = [
  {
    id: "oli-01", code: "OLI-01", propertyId: "casa-olivo", status: "ocupada", monthlyRent: 420, areaM2: 14,
    features: [...olivoFeatures, "Balcón"],
  },
  {
    id: "oli-02", code: "OLI-02", propertyId: "casa-olivo", status: "ocupada", monthlyRent: 350, areaM2: 10,
    features: olivoFeatures,
  },
  {
    id: "oli-03", code: "OLI-03", propertyId: "casa-olivo", status: "ocupada", monthlyRent: 450, areaM2: 16,
    features: [...olivoFeatures, "Baño privado"],
  },
  {
    id: "oli-04", code: "OLI-04", propertyId: "casa-olivo", status: "ocupada", monthlyRent: 380, areaM2: 11,
    features: olivoFeatures,
  },
  {
    id: "oli-05", code: "OLI-05", propertyId: "casa-olivo", status: "disponible", monthlyRent: 410, areaM2: 13,
    features: [...olivoFeatures, "Escritorio"],
    statusNote: "Lista para alquilar desde el 21/10/2026.",
  },
  {
    id: "oli-06", code: "OLI-06", propertyId: "casa-olivo", status: "reservada", monthlyRent: 430, areaM2: 15,
    features: [...olivoFeatures, "Balcón"],
    statusNote: "Reserva de ejemplo con entrada prevista el 01/11/2026. Contrato pendiente de formalización; aún no hay contrato vigente.",
  },
  {
    id: "aza-01", code: "AZA-01", propertyId: "casa-azahar", status: "ocupada", monthlyRent: 390, areaM2: 12,
    features: azaharFeatures,
  },
  {
    id: "aza-02", code: "AZA-02", propertyId: "casa-azahar", status: "ocupada", monthlyRent: 410, areaM2: 13,
    features: [...azaharFeatures, "Escritorio"],
  },
  {
    id: "aza-03", code: "AZA-03", propertyId: "casa-azahar", status: "ocupada", monthlyRent: 450, areaM2: 16,
    features: [...azaharFeatures, "Baño privado"],
  },
  {
    id: "aza-04", code: "AZA-04", propertyId: "casa-azahar", status: "ocupada", monthlyRent: 400, areaM2: 12,
    features: azaharFeatures,
  },
  {
    id: "aza-05", code: "AZA-05", propertyId: "casa-azahar", status: "disponible", monthlyRent: 420, areaM2: 14,
    features: [...azaharFeatures, "Terraza compartida"],
    statusNote: "Lista para alquilar desde el 21/10/2026.",
  },
  {
    id: "aza-06", code: "AZA-06", propertyId: "casa-azahar", status: "bloqueada", monthlyRent: 380, areaM2: 11,
    features: azaharFeatures,
    statusNote: "Bloqueada por mantenimiento: reparación de humedad en una pared. No se ofrece en alquiler.",
  },
];

export const demoPortfolio: PortfolioDataset = {
  companyName: "Cartera de ejemplo",
  referenceDate: "2026-10-21",
  referencePeriod: "Octubre 2026",
  properties: [
    { id: "casa-olivo", code: "OLI", name: "Casa Olivo", address: "Calle del Ejemplo 12, Ciudad Ficticia (dirección de ejemplo)", ownerId: "con-009" },
    { id: "casa-azahar", code: "AZA", name: "Casa Azahar", address: "Avenida Imaginaria 48, Ciudad Ficticia (dirección de ejemplo)", ownerId: "con-010" },
  ],
  rooms,
  incidents: [
    {
      id: "inc-1", propertyId: "casa-azahar", roomId: "aza-06", providerId: "con-012", openedOn: "2026-10-14",
      title: "Humedad en pared",
      description: "Mantenimiento en curso. La habitación AZA-06 queda bloqueada hasta la reparación.",
    },
    {
      id: "inc-2", propertyId: "casa-olivo", roomId: "oli-01", openedOn: "2026-10-18",
      title: "Persiana atascada",
      description: "Pendiente de revisión por el servicio técnico.",
    },
    {
      id: "inc-3", propertyId: "casa-olivo", openedOn: "2026-10-20",
      title: "Revisión de caldera",
      description: "Revisión anual programada para las zonas comunes.",
    },
  ],
  contacts: demoContacts,
  contracts: demoContracts,
  charges: demoCharges,
  payments: demoPayments,
  allocations: demoAllocations,
  depositMovements: demoDepositMovements,
  expenses: demoExpenses,
  expenseShares: demoExpenseShares,
  expensePayments: demoExpensePayments,
};
