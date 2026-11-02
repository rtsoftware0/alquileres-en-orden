// CSV templates for temporary catalog imports. Allowed fields are listed
// explicitly per entity; any other column is excluded, never mapped implicitly.
import type { CatalogKind } from "../types";

export type ImportEntity = "contactos" | "inmuebles" | "unidades";
export type Delimiter = "," | ";";
export type DecimalFormat = "," | ".";

export const IMPORT_ENTITIES: ImportEntity[] = ["contactos", "inmuebles", "unidades"];
export const ENTITY_KIND: Record<ImportEntity, CatalogKind> = { contactos: "contact", inmuebles: "property", unidades: "room" };
export const ENTITY_LABEL: Record<ImportEntity, string> = { contactos: "Contactos", inmuebles: "Inmuebles", unidades: "Unidades" };

/** Preventive limits: files beyond them are rejected explicitly, never truncated. */
export const MAX_IMPORT_ROWS = 5000;
export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

export const isImportEntity = (v: unknown): v is ImportEntity => typeof v === "string" && (IMPORT_ENTITIES as string[]).includes(v);

export interface TemplateField {
  key: string;
  label: string;
  required: boolean;
  hint: string;
  aliases: string[];
}

const ref: TemplateField = { key: "referencia_externa", label: "Referencia externa", required: false, hint: "Identificador de tu hoja (opcional).", aliases: ["referencia", "ref", "id_externo"] };

export const TEMPLATE_FIELDS: Record<ImportEntity, TemplateField[]> = {
  contactos: [
    ref,
    { key: "codigo", label: "Código", required: true, hint: "Único, p. ej. CON-700.", aliases: ["code"] },
    { key: "nombre", label: "Nombre", required: true, hint: "Nombre ficticio.", aliases: ["name"] },
    { key: "tipo", label: "Tipo", required: true, hint: "persona o empresa.", aliases: ["type"] },
    { key: "roles", label: "Roles", required: true, hint: "Separados por | : inquilino|propietario|arrendador|proveedor|avalista|candidato.", aliases: ["rol"] },
    { key: "email", label: "Correo", required: false, hint: "Solo @example.invalid.", aliases: ["correo", "e_mail"] },
    { key: "telefono", label: "Teléfono", required: false, hint: "Ficticio.", aliases: ["phone", "tel"] },
    { key: "direccion", label: "Dirección", required: false, hint: "Ficticia.", aliases: ["address"] },
    { key: "nota", label: "Nota", required: false, hint: "Descriptiva.", aliases: ["notas", "note"] },
  ],
  inmuebles: [
    ref,
    { key: "codigo", label: "Código", required: true, hint: "Único, p. ej. NUE.", aliases: ["code"] },
    { key: "nombre", label: "Nombre", required: true, hint: "Nombre del inmueble.", aliases: ["name"] },
    { key: "direccion", label: "Dirección", required: true, hint: "Ficticia.", aliases: ["address"] },
    { key: "propietario_codigo", label: "Código del propietario", required: true, hint: "Código de un contacto existente con rol propietario.", aliases: ["propietario"] },
    { key: "tipo", label: "Tipo", required: false, hint: "vivienda, edificio o local.", aliases: ["type"] },
    { key: "cartera", label: "Cartera", required: false, hint: "Descriptiva.", aliases: [] },
    { key: "sociedad", label: "Sociedad", required: false, hint: "Descriptiva.", aliases: [] },
    { key: "responsable", label: "Responsable", required: false, hint: "Descriptivo.", aliases: [] },
  ],
  unidades: [
    ref,
    { key: "codigo", label: "Código", required: true, hint: "Único, p. ej. NUE-01.", aliases: ["code"] },
    { key: "inmueble_codigo", label: "Código del inmueble", required: true, hint: "Código de un inmueble existente.", aliases: ["inmueble"] },
    { key: "renta_mensual", label: "Renta orientativa (€)", required: true, hint: "Mayor que 0, máximo dos decimales.", aliases: ["renta"] },
    { key: "tipo_unidad", label: "Tipo de unidad", required: false, hint: "habitacion, vivienda_completa o estudio.", aliases: ["tipo"] },
    { key: "capacidad", label: "Capacidad", required: false, hint: "Número entero de personas.", aliases: [] },
    { key: "superficie_m2", label: "Superficie (m²)", required: false, hint: "Opcional, máximo dos decimales.", aliases: ["superficie"] },
    { key: "caracteristicas", label: "Características", required: false, hint: "Separadas por |.", aliases: [] },
    { key: "nota", label: "Nota", required: false, hint: "Descriptiva.", aliases: ["notas"] },
  ],
};

/** Example rows written with the "," decimal format (values only, fictitious). */
export const TEMPLATE_EXAMPLE: Record<ImportEntity, string[]> = {
  contactos: ["MI-001", "CON-700", "Ejemplo Persona Ficticia", "persona", "propietario", "persona.ficticia@example.invalid", "+34 600 000 000", "Calle Ficticia 1", ""],
  inmuebles: ["MI-INM-1", "NUE", "Casa Nueva Ejemplo", "Calle Ficticia 9", "CON-700", "vivienda", "", "", ""],
  unidades: ["MI-UNI-1", "NUE-01", "NUE", "525,55", "habitacion", "1", "12,5", "Escritorio|Ventana", ""],
};

/** Lowercase ASCII key used to match headers and enum values. */
export const normalizeKey = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
