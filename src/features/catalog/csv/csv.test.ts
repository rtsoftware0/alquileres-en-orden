import { describe, expect, it } from "vitest";
import { demoPortfolio } from "@/features/portfolio/data/demo-data";
import { summarizeOccupancy } from "@/features/portfolio/selectors";
import { pendingCents } from "@/features/money/selectors";
import { addContact, editRoom, emptyOverlay, mergeCatalog } from "../engine";
import type { CatalogOverlay } from "../types";
import {
  autoMapping, checkFileSize, commitImport, decodeUtf8, mappingIssues, parseCsvText, parseDecimalStrict, prepareImport,
  type ImportInput,
} from "./import-engine";
import { catalogCsv, csvCell, isDangerousText, serializeCsv, templateCsv } from "./export";
import { MAX_IMPORT_BYTES, MAX_IMPORT_ROWS, type Delimiter, type ImportEntity } from "./templates";

const base = demoPortfolio;

function input(entity: ImportEntity, text: string, delimiter: Delimiter = ";", decimal: "," | "." = ","): ImportInput {
  const p = parseCsvText(text, delimiter);
  if (!p.ok) throw new Error(p.error);
  return { entity, headers: p.csv.headers, rows: p.csv.rows, mapping: autoMapping(entity, p.csv.headers), delimiter, decimal, contentKey: text };
}
function run(o: CatalogOverlay, i: ImportInput, accept = true) {
  const review = prepareImport(base, o, i);
  return { review, ...commitImport(base, o, review, accept) };
}

const ROOMS = "codigo;inmueble_codigo;renta_mensual;capacidad\nNUE-01;OLI;525,55;1\nNUE-02;AZA;300,29;2\n";

describe("csv parsing and limits", () => {
  it("keeps 007 as text (no dynamic typing) and strips BOM", () => {
    const p = parseCsvText("\uFEFFcodigo;nombre\n007;Ana", ";");
    expect(p.ok && p.csv.headers[0]).toBe("codigo");
    expect(p.ok && p.csv.rows[0]?.[0]).toBe("007");
  });
  it("rejects empty, header-only, uneven width, malformed quotes and repeated headers", () => {
    expect(parseCsvText("", ";").ok).toBe(false);
    expect(parseCsvText("codigo;nombre\n", ";").ok).toBe(false);
    expect(parseCsvText("a;b\n1;2;3\n", ";").ok).toBe(false);
    expect(parseCsvText('a;b\n"1;2\n', ";").ok).toBe(false);
    expect(parseCsvText("Código;codigo\n1;2\n", ";").ok).toBe(false);
  });
  it("rejects more than 5000 records without truncating and files over 10 MB", () => {
    const over = "codigo\n" + Array.from({ length: MAX_IMPORT_ROWS + 1 }, (_, i) => `C${i}`).join("\n");
    const r = parseCsvText(over, ";");
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toMatch(/5000/);
    const atLimit = "codigo\n" + Array.from({ length: MAX_IMPORT_ROWS }, (_, i) => `C${i}`).join("\n");
    expect(parseCsvText(atLimit, ";").ok).toBe(true);
    expect(checkFileSize(MAX_IMPORT_BYTES + 1)).toMatch(/10 MB/);
    expect(checkFileSize(MAX_IMPORT_BYTES)).toBeNull();
  });
  it("rejects non UTF-8 bytes", () => {
    expect(decodeUtf8(new Uint8Array([0x63, 0xff, 0xfe]).buffer).ok).toBe(false);
  });
  it("mapping: unknown columns excluded, double mapping and missing required are errors", () => {
    const headers = ["codigo", "nombre", "color"];
    const m = autoMapping("contactos", headers);
    expect(m[2]).toBeNull();
    const iss = mappingIssues("contactos", headers, m);
    expect(iss.excluded).toEqual(["color"]);
    expect(iss.errors.join(" ")).toMatch(/Tipo/);
    expect(mappingIssues("contactos", headers, ["codigo", "codigo", null]).errors.join(" ")).toMatch(/varias columnas/);
  });
  it("strict decimals", () => {
    expect(parseDecimalStrict("525,55", ",")).toEqual({ ok: true, value: 525.55 });
    expect(parseDecimalStrict("525.55", ".")).toEqual({ ok: true, value: 525.55 });
    expect(parseDecimalStrict("525,555", ",").ok).toBe(false);
    expect(parseDecimalStrict("1.525,5", ",").ok).toBe(false);
    expect(parseDecimalStrict("NaN", ",").ok).toBe(false);
    expect(parseDecimalStrict("Infinity", ".").ok).toBe(false);
  });
});

describe("batch import", () => {
  it("creates all rooms in one write; 525,55 accepted; occupancy and debt unchanged", () => {
    const o = emptyOverlay();
    const { result, next } = run(o, input("unidades", ROOMS));
    expect(result.ok && result.created).toBe(2);
    expect(next).toBeDefined();
    const view = mergeCatalog(base, next!);
    expect(view.rooms.find((r) => r.code === "NUE-01")?.monthlyRent).toBe(525.55);
    expect(view.rooms.find((r) => r.code === "NUE-01")?.status).toBe("disponible");
    const s = summarizeOccupancy(view.rooms);
    expect([s.occupied, s.rentable]).toEqual([8, 13]);
    expect(pendingCents(view)).toBe(140000);
    expect(view.contracts).toBe(base.contracts);
    expect(o).toEqual(emptyOverlay());
  });
  it("any row error → 0 additions and identical overlay", () => {
    const o = emptyOverlay();
    const { result, next } = run(o, input("unidades", ROOMS + "NUE-03;OLI;525,555;1\n"));
    expect(result.ok).toBe(false);
    expect(next).toBeUndefined();
  });
  it("unaccepted warnings → nothing written; accepted → written", () => {
    const text = "codigo;nombre;tipo;roles\nCON-801;Casa Olivo Dueña;persona;propietario\nCON-802;Casa Olivo Dueña;persona;candidato\n";
    const o = emptyOverlay();
    const no = run(o, input("contactos", text), false);
    expect(no.result.ok).toBe(false);
    expect(no.next).toBeUndefined();
    const yes = run(o, input("contactos", text), true);
    expect(yes.result.ok && yes.result.created).toBe(2);
  });
  it("same file again and reordered equivalent → omitted, 0 writes", () => {
    const first = run(emptyOverlay(), input("unidades", ROOMS)).next!;
    const again = run(first, input("unidades", ROOMS));
    expect(again.result.ok && again.result.created).toBe(0);
    expect(again.next).toBeUndefined();
    const reordered = "capacidad,renta_mensual,codigo,inmueble_codigo\n2,300.29,nue-02,aza\n1,525.55,NUE-01,OLI\n";
    const r2 = run(first, input("unidades", reordered, ",", "."));
    expect(r2.review.omitted).toBe(2);
    expect(r2.next).toBeUndefined();
  });
  it("original reimported after editing an imported unit → omitted, edit kept", () => {
    const first = run(emptyOverlay(), input("unidades", ROOMS)).next!;
    const id = mergeCatalog(base, first).rooms.find((r) => r.code === "NUE-01")!.id;
    const edited = editRoom(base, first, id, { monthlyRent: 600 });
    if (!edited.ok) throw new Error("edit");
    const again = run(edited.overlay, input("unidades", ROOMS));
    expect(again.review.omitted).toBe(2);
    expect(mergeCatalog(base, edited.overlay).rooms.find((r) => r.id === id)?.monthlyRent).toBe(600);
    expect(edited.overlay.imports).toBe(first.imports);
  });
  it("conflicts: base code, manual code, changed content with same code or external ref, repeated row", () => {
    expect(run(emptyOverlay(), input("unidades", "codigo;inmueble_codigo;renta_mensual\nOLI-01;OLI;420\n")).result.ok).toBe(false);
    const manual = addContact(base, emptyOverlay(), { code: "CON-900", name: "Manual Ejemplo", type: "persona", roles: ["candidato"] });
    if (!manual.ok) throw new Error("add");
    expect(run(manual.overlay, input("contactos", "codigo;nombre;tipo;roles\nCON-900;Manual Ejemplo;persona;candidato\n")).result.ok).toBe(false);
    const first = run(emptyOverlay(), input("unidades", "referencia_externa;codigo;inmueble_codigo;renta_mensual\nX1;NUE-01;OLI;500\n")).next!;
    expect(run(first, input("unidades", "referencia_externa;codigo;inmueble_codigo;renta_mensual\nX1;NUE-09;OLI;500\n")).review.ok).toBe(false);
    expect(run(first, input("unidades", "codigo;inmueble_codigo;renta_mensual\nNUE-01;OLI;510\n")).review.ok).toBe(false);
    const dup = run(emptyOverlay(), input("unidades", "codigo;inmueble_codigo;renta_mensual\nNUE-01;OLI;500\nNUE-01;OLI;500\n"));
    expect(dup.review.rows[1]?.messages.join(" ")).toMatch(/Fila repetida/);
  });
  it("all six roles accepted; relation by unique code to current ID", () => {
    const c = run(emptyOverlay(), input("contactos", "codigo;nombre;tipo;roles\nCON-950;Seis Roles;empresa;inquilino|propietario|arrendador|proveedor|avalista|candidato\n")).next!;
    expect(mergeCatalog(base, c).contacts.find((x) => x.code === "CON-950")?.roles).toHaveLength(6);
    const p = run(c, input("inmuebles", "codigo;nombre;direccion;propietario_codigo\nNUE;Casa Nueva;Calle Ficticia 9;con-950\n")).next!;
    const prop = mergeCatalog(base, p).properties.find((x) => x.code === "NUE")!;
    expect(prop.ownerId).toMatch(/^cat-con-/);
  });
  it("stale review and double confirmation are rejected", () => {
    const o = emptyOverlay();
    const review = prepareImport(base, o, input("unidades", ROOMS));
    const a = commitImport(base, o, review, true);
    expect(a.result.ok).toBe(true);
    const b = commitImport(base, a.next!, review, true);
    expect(b.result.ok).toBe(false);
    expect(!b.result.ok && b.result.reason).toBe("stale");
  });
  it("special keys like __proto__ as external reference are inert", () => {
    const r = run(emptyOverlay(), input("unidades", "referencia_externa;codigo;inmueble_codigo;renta_mensual\n__proto__;NUE-05;OLI;500\n")).next!;
    expect(Object.keys(r.imports!.externalRefs)[0]).toBe("ref:room:__proto__");
    expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
  });
  it("150 synthetic units in one batch: one overlay, seq +150, debt/contracts/expenses intact", () => {
    const lines = Array.from({ length: 150 }, (_, i) => `SYN-${i};OLI;400`).join("\n");
    const o = emptyOverlay();
    const { result, next } = run(o, input("unidades", `codigo;inmueble_codigo;renta_mensual\n${lines}\n`));
    expect(result.ok && result.created).toBe(150);
    expect(next!.seq).toBe(150);
    const view = mergeCatalog(base, next!);
    expect(summarizeOccupancy(view.rooms).rentable).toBe(161);
    expect(pendingCents(view)).toBe(140000);
    expect(view.expenses).toBe(base.expenses);
  });
});

describe("csv export", () => {
  it("BOM, CRLF, escaping and formula neutralization; numbers intact", () => {
    const { text, protectedCells } = serializeCsv(["a", "b"], [["=1+1", 525.55], ['di "x"; y', "  +x"], ["\t-x", "@a"], ["-5", "007"]], { delimiter: ";", decimal: "," });
    expect(text.startsWith("\uFEFF")).toBe(true);
    expect(text).toContain("\r\n");
    expect(text).toContain("'=1+1;525,55");
    expect(text).toContain('"di ""x""; y"');
    expect(protectedCells).toBe(4);
    expect(text).toContain("-5;007");
    expect(isDangerousText("12,5")).toBe(false);
    expect(csvCell("a\nb", { delimiter: ",", decimal: "." }).text).toBe('"a\nb"');
  });
  it("template columns reimport; exported imported records come back omitted", () => {
    const t = templateCsv("unidades").text;
    expect(t.split("\r\n")[0]).toBe("\uFEFFreferencia_externa;codigo;inmueble_codigo;renta_mensual;tipo_unidad;capacidad;superficie_m2;caracteristicas;nota");
    const first = run(emptyOverlay(), input("unidades", "referencia_externa;codigo;inmueble_codigo;renta_mensual;caracteristicas\nR1;NUE-01;OLI;525,55;Ventana|Escritorio\n")).next!;
    const view = mergeCatalog(base, first);
    const ids = view.rooms.filter((r) => r.code === "NUE-01").map((r) => r.id);
    const exported = catalogCsv("unidades", ids, view, first).text;
    const again = run(first, input("unidades", exported));
    expect(again.review.omitted).toBe(1);
    expect(again.next).toBeUndefined();
  });
});

describe("csv regressions CSV01/CSV02", () => {
  const H = "referencia_externa;codigo;nombre;tipo;roles\n";
  const A = "refA;CON-801;Persona A Ejemplo;persona;candidato";
  const B = "refB;CON-802;Persona B Ejemplo;persona;candidato";
  const both = () => run(emptyOverlay(), input("contactos", `${H}${A}\n${B}\n`)).next!;

  it.each([[";", ","], [",", "."]] as const)("contact template with '%s' reimports intact as 1 valid row", (d, dec) => {
    const t = templateCsv("contactos", { delimiter: d, decimal: dec });
    expect(t.protectedCells).toBe(0);
    const r = run(emptyOverlay(), input("contactos", t.text.replace(/^\uFEFF/, ""), d, dec));
    expect(r.review.ok).toBe(true);
    expect(r.result.ok && r.result.created).toBe(1);
  });
  it("exporter still neutralizes formula-like text, also after spaces/controls", () => {
    for (const v of ["=x", "+x", "-x", "@x", "  =x", "\t+x"]) expect(isDangerousText(v)).toBe(true);
  });
  it("content B with refA (bound to A) is a conflict, not omitted; overlay intact", () => {
    const o = both();
    const r = run(o, input("contactos", `${H}refA;CON-802;Persona B Ejemplo;persona;candidato\n`));
    expect(r.review.ok).toBe(false);
    expect(r.review.omitted).toBe(0);
    expect(r.review.rows[0]?.status).toBe("error");
    expect(r.review.rows[0]?.messages.join(" ")).toMatch(/refA/);
    expect(r.next).toBeUndefined();
  });
  it("conflict mixed with a valid new row → 0 created, same overlay/seq/receipts", () => {
    const o = both();
    const before = JSON.stringify(o);
    const r = run(o, input("contactos", `${H}refA;CON-802;Persona B Ejemplo;persona;candidato\nrefC;CON-803;Persona C Ejemplo;persona;candidato\n`));
    expect(r.result.ok).toBe(false);
    expect(r.review.created).toBe(0);
    expect(r.next).toBeUndefined();
    expect(JSON.stringify(o)).toBe(before);
  });
  it("same refs and contents again → all omitted, no write", () => {
    const o = both();
    const r = run(o, input("contactos", `${H}${B}\n${A}\n`));
    expect(r.review.omitted).toBe(2);
    expect(r.next).toBeUndefined();
  });
  it("known content with a new ref keeps current omission without new association", () => {
    const o = both();
    const r = run(o, input("contactos", `${H}refZ;CON-801;Persona A Ejemplo;persona;candidato\n`));
    expect(r.review.omitted).toBe(1);
    expect(r.next).toBeUndefined();
    expect(Object.keys(o.imports!.externalRefs)).not.toContain("ref:contact:refZ");
  });
  it("original A/refA after manual edit stays omitted, edit kept", () => {
    const first = run(emptyOverlay(), input("unidades", "referencia_externa;codigo;inmueble_codigo;renta_mensual\nrefA;NUE-01;OLI;500\n")).next!;
    const id = mergeCatalog(base, first).rooms.find((r) => r.code === "NUE-01")!.id;
    const edited = editRoom(base, first, id, { monthlyRent: 610 });
    if (!edited.ok) throw new Error("edit");
    const again = run(edited.overlay, input("unidades", "referencia_externa;codigo;inmueble_codigo;renta_mensual\nrefA;NUE-01;OLI;500\n"));
    expect(again.review.omitted).toBe(1);
    expect(again.next).toBeUndefined();
    expect(mergeCatalog(base, edited.overlay).rooms.find((r) => r.id === id)?.monthlyRent).toBe(610);
  });
});
