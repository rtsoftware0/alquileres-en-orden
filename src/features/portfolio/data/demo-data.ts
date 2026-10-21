import type { PortfolioDataset, Room } from "./types";

// Fictitious demonstration data. No real people, addresses or payments.

const olivoFeatures = ["Amueblada", "Calefacción", "Wifi incluido"];
const azaharFeatures = ["Amueblada", "Aire acondicionado", "Wifi incluido"];

const rooms: Room[] = [
  {
    id: "oli-01", code: "OLI-01", propertyId: "casa-olivo", status: "ocupada", monthlyRent: 420, areaM2: 14,
    features: [...olivoFeatures, "Balcón"],
    contract: { reference: "CT-EJ-0101", startDate: "2026-02-01", endDate: "2027-01-31" },
  },
  {
    id: "oli-02", code: "OLI-02", propertyId: "casa-olivo", status: "ocupada", monthlyRent: 350, areaM2: 10,
    features: olivoFeatures,
    contract: { reference: "CT-EJ-0102", startDate: "2026-09-01", endDate: "2027-06-30" },
  },
  {
    id: "oli-03", code: "OLI-03", propertyId: "casa-olivo", status: "ocupada", monthlyRent: 450, areaM2: 16,
    features: [...olivoFeatures, "Baño privado"],
    contract: { reference: "CT-EJ-0103", startDate: "2026-01-15", endDate: "2026-12-31" },
  },
  {
    id: "oli-04", code: "OLI-04", propertyId: "casa-olivo", status: "ocupada", monthlyRent: 380, areaM2: 11,
    features: olivoFeatures,
    contract: { reference: "CT-EJ-0104", startDate: "2026-07-01", endDate: "2027-06-30" },
  },
  {
    id: "oli-05", code: "OLI-05", propertyId: "casa-olivo", status: "disponible", monthlyRent: 410, areaM2: 13,
    features: [...olivoFeatures, "Escritorio"],
    statusNote: "Lista para alquilar desde el 21/10/2026.",
  },
  {
    id: "oli-06", code: "OLI-06", propertyId: "casa-olivo", status: "reservada", monthlyRent: 430, areaM2: 15,
    features: [...olivoFeatures, "Balcón"],
    statusNote: "Reserva de ejemplo con entrada prevista el 01/11/2026. Aún no hay contrato vigente.",
  },
  {
    id: "aza-01", code: "AZA-01", propertyId: "casa-azahar", status: "ocupada", monthlyRent: 390, areaM2: 12,
    features: azaharFeatures,
    contract: { reference: "CT-EJ-0201", startDate: "2026-03-01", endDate: "2027-02-28" },
  },
  {
    id: "aza-02", code: "AZA-02", propertyId: "casa-azahar", status: "ocupada", monthlyRent: 410, areaM2: 13,
    features: [...azaharFeatures, "Escritorio"],
    contract: { reference: "CT-EJ-0202", startDate: "2026-09-15", endDate: "2027-07-31" },
  },
  {
    id: "aza-03", code: "AZA-03", propertyId: "casa-azahar", status: "ocupada", monthlyRent: 450, areaM2: 16,
    features: [...azaharFeatures, "Baño privado"],
    contract: { reference: "CT-EJ-0203", startDate: "2026-05-01", endDate: "2027-04-30" },
  },
  {
    id: "aza-04", code: "AZA-04", propertyId: "casa-azahar", status: "ocupada", monthlyRent: 400, areaM2: 12,
    features: azaharFeatures,
    contract: { reference: "CT-EJ-0204", startDate: "2025-11-01", endDate: "2026-10-31" },
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
    { id: "casa-olivo", code: "OLI", name: "Casa Olivo", address: "Calle del Ejemplo 12, Ciudad Ficticia (dirección de ejemplo)" },
    { id: "casa-azahar", code: "AZA", name: "Casa Azahar", address: "Avenida Imaginaria 48, Ciudad Ficticia (dirección de ejemplo)" },
  ],
  rooms,
  pendingBalances: [
    { id: "sp-1", roomId: "oli-02", amount: 350, concept: "Renta de octubre 2026" },
    { id: "sp-2", roomId: "oli-03", amount: 600, concept: "Resto de septiembre (150 €) y renta de octubre 2026 (450 €)" },
    { id: "sp-3", roomId: "aza-03", amount: 450, concept: "Renta de octubre 2026" },
  ],
  incidents: [
    {
      id: "inc-1", propertyId: "casa-azahar", roomId: "aza-06", openedOn: "2026-10-14",
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
};
