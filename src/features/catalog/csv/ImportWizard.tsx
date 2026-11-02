// CSV import assistant for the temporary catalog. Reads the file locally (no
// upload), reviews the whole batch and confirms it through a single provider
// command. Any change to entity, file, format or mapping discards the review.
import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Download, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/features/layout/ui";
import { useCatalog } from "../CatalogContext";
import {
  autoMapping, checkFileSize, decodeUtf8, hashText, mappingIssues, parseCsvText,
  type ImportCommit, type ImportInput, type ImportReview, type Mapping, type ParseOutcome,
} from "./import-engine";
import { downloadCsv, errorsCsv, templateCsv } from "./export";
import {
  ENTITY_LABEL, IMPORT_ENTITIES, MAX_IMPORT_ROWS, TEMPLATE_FIELDS,
  type DecimalFormat, type Delimiter, type ImportEntity,
} from "./templates";

interface LoadedFile { name: string; size: number; text: string }

function readArrayBuffer(file: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => (r.result !== null && typeof r.result !== "string" ? resolve(r.result) : reject(new Error("read")));
    r.onerror = () => reject(new Error("read"));
    r.readAsArrayBuffer(file);
  });
}

const MAX_LISTED = 200;
const sectionClass = "rounded-lg border border-border bg-card p-4";

export function ImportWizard({ initialEntity }: { initialEntity?: ImportEntity | undefined }) {
  const cat = useCatalog();
  const [entity, setEntity] = useState<ImportEntity | "">(initialEntity ?? "");
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [delimiter, setDelimiter] = useState<Delimiter>(";");
  const [decimal, setDecimal] = useState<DecimalFormat>(",");
  const [parsed, setParsed] = useState<ParseOutcome | null>(null);
  const [mapping, setMapping] = useState<Mapping>([]);
  const [review, setReview] = useState<ImportReview | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [outcome, setOutcome] = useState<ImportCommit | null>(null);
  const readToken = useRef(0);

  const invalidate = () => { setReview(null); setAccepted(false); setOutcome(null); };
  const reparse = (f: LoadedFile | null, d: Delimiter, e: ImportEntity | "") => {
    const p = f ? parseCsvText(f.text, d) : null;
    setParsed(p);
    setMapping(p?.ok && e ? autoMapping(e, p.csv.headers) : []);
    invalidate();
  };

  const onEntity = (e: ImportEntity | "") => { setEntity(e); reparse(file, delimiter, e); };
  const onDelimiter = (d: Delimiter) => { setDelimiter(d); reparse(file, d, entity); };
  const onDecimal = (d: DecimalFormat) => { setDecimal(d); invalidate(); };
  const onMap = (i: number, key: string) => { setMapping((m) => m.map((v, j) => (j === i ? (key || null) : v))); invalidate(); };

  const onFile = async (f: File | undefined) => {
    const token = ++readToken.current;
    setFile(null); setFileError(null); reparse(null, delimiter, entity);
    if (!f) return;
    const sizeErr = checkFileSize(f.size);
    if (sizeErr) { setFileError(sizeErr); return; }
    let buf: ArrayBuffer;
    try { buf = await readArrayBuffer(f); } catch { if (token === readToken.current) setFileError("No se pudo leer el archivo."); return; }
    if (token !== readToken.current) return;
    const dec = decodeUtf8(buf);
    if (!dec.ok) { setFileError(dec.error); return; }
    const loaded = { name: f.name, size: f.size, text: dec.text };
    setFile(loaded);
    reparse(loaded, delimiter, entity);
  };

  const csv = parsed?.ok ? parsed.csv : null;
  const issues = csv && entity ? mappingIssues(entity, csv.headers, mapping) : null;
  const canReview = Boolean(entity && file && csv && issues && issues.errors.length === 0);
  const stale = review !== null && review.basis !== cat.overlay;

  const doReview = () => {
    if (!entity || !file || !csv) return;
    const input: ImportInput = {
      entity, headers: csv.headers, rows: csv.rows, mapping, delimiter, decimal,
      contentKey: `${file.name}|${file.size}|${hashText(file.text)}`,
    };
    setAccepted(false); setOutcome(null);
    setReview(cat.prepareImport(input));
  };
  const doConfirm = () => {
    if (!review) return;
    const r = cat.commitImport(review, accepted);
    setOutcome(r);
    if (r.ok) { setReview(null); setAccepted(false); }
  };

  const needsAccept = Boolean(review && review.warnings.length > 0);
  const canConfirm = Boolean(review && review.ok && !stale && review.created > 0 && (!needsAccept || accepted));
  const listed = review ? review.rows.filter((r) => r.status !== "nueva") : [];

  return (
    <div className="max-w-4xl space-y-4">
      <p className="rounded-md border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground" role="note">
        El archivo se lee solo en este navegador; no se envía a ningún sitio. Las altas importadas son temporales: recargar la página o restablecer el catálogo las borra. Solo se crean altas descriptivas: no se actualizan registros ni se crean contratos, saldos, cobros ni accesos.
      </p>

      <section className={sectionClass} aria-labelledby="imp-1">
        <h2 id="imp-1" className="mb-3 font-semibold">1. Qué vas a importar</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Tipo de registro</span>
            <select value={entity} onChange={(e) => onEntity(e.target.value as ImportEntity | "")} className={fieldClass}>
              <option value="">Elige un tipo</option>
              {IMPORT_ENTITIES.map((e) => <option key={e} value={e}>{ENTITY_LABEL[e]}</option>)}
            </select>
          </label>
          {entity && (
            <Button variant="outline" onClick={() => downloadCsv(`plantilla-${entity}.csv`, templateCsv(entity, { delimiter, decimal }).text)}>
              <Download className="h-4 w-4" aria-hidden="true" /> Descargar plantilla de {ENTITY_LABEL[entity].toLowerCase()}
            </Button>
          )}
        </div>
        {entity && (
          <p className="mt-2 text-xs text-muted-foreground">
            Campos admitidos: {TEMPLATE_FIELDS[entity].map((f) => `${f.key}${f.required ? " (obligatorio)" : ""}`).join(", ")}.
          </p>
        )}
      </section>

      <section className={sectionClass} aria-labelledby="imp-2">
        <h2 id="imp-2" className="mb-3 font-semibold">2. Archivo y formato</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Archivo CSV (UTF-8)</span>
            <input type="file" accept=".csv,text/csv" onChange={(e) => void onFile(e.target.files?.[0])} className="block w-full text-sm" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Separador de columnas</span>
            <select value={delimiter} onChange={(e) => onDelimiter(e.target.value as Delimiter)} className={fieldClass}>
              <option value=";">Punto y coma (;)</option>
              <option value=",">Coma (,)</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Formato decimal</span>
            <select value={decimal} onChange={(e) => onDecimal(e.target.value as DecimalFormat)} className={fieldClass}>
              <option value=",">Coma (525,55)</option>
              <option value=".">Punto (525.55)</option>
            </select>
          </label>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Límite preventivo: {MAX_IMPORT_ROWS} registros y 10 MB por archivo. Por encima se rechaza sin recortar.</p>
        {file && <p className="mt-2 text-sm"><FileUp className="mr-1 inline h-4 w-4" aria-hidden="true" />{file.name}{csv ? ` · ${csv.rows.length} registros` : ""}</p>}
        {(fileError || (parsed && !parsed.ok)) && (
          <p role="alert" className="mt-2 text-sm text-destructive">{fileError ?? (parsed && !parsed.ok ? parsed.error : "")}</p>
        )}
      </section>

      {csv && entity && (
        <section className={sectionClass} aria-labelledby="imp-3">
          <h2 id="imp-3" className="mb-3 font-semibold">3. Columnas</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {csv.headers.map((h, i) => (
              <label key={`${i}-${h}`} className="block text-sm">
                <span className="mb-1 block font-medium">Columna «{h}»</span>
                <select value={mapping[i] ?? ""} onChange={(e) => onMap(i, e.target.value)} className={fieldClass}>
                  <option value="">Excluir columna</option>
                  {TEMPLATE_FIELDS[entity].map((f) => <option key={f.key} value={f.key}>{f.label}{f.required ? " *" : ""}</option>)}
                </select>
              </label>
            ))}
          </div>
          {issues && issues.excluded.length > 0 && <p className="mt-2 text-sm text-muted-foreground">Columnas excluidas: {issues.excluded.join(", ")}.</p>}
          {issues && issues.errors.length > 0 && (
            <ul role="alert" className="mt-2 list-disc space-y-1 pl-5 text-sm text-destructive">
              {issues.errors.map((e) => <li key={e}>{e}</li>)}
            </ul>
          )}
          <Button className="mt-3" onClick={doReview} disabled={!canReview}>Revisar importación</Button>
        </section>
      )}

      {review && (
        <section className={sectionClass} aria-labelledby="imp-4">
          <h2 id="imp-4" className="mb-3 font-semibold">4. Revisión</h2>
          {stale && <p role="alert" className="mb-2 text-sm text-destructive">La revisión ha caducado porque el catálogo cambió. Vuelve a revisar.</p>}
          <p className="text-sm" aria-live="polite">
            Nuevas: <strong className="tabular">{review.created}</strong> · Omitidas (ya importadas): <strong className="tabular">{review.omitted}</strong> · Con error: <strong className="tabular">{review.rows.filter((r) => r.status === "error").length}</strong>
          </p>
          {!review.ok && <p role="alert" className="mt-2 text-sm text-destructive">Hay errores: no se importará ningún registro hasta corregirlos.</p>}
          {review.ok && review.created === 0 && <p className="mt-2 text-sm text-muted-foreground">No hay registros nuevos: no se hará ningún cambio.</p>}
          {review.errors.length > 0 && <ul className="mt-2 list-disc pl-5 text-sm text-destructive">{review.errors.map((e) => <li key={e}>{e}</li>)}</ul>}
          {listed.length > 0 && (
            <ul className="mt-3 max-h-80 space-y-1 overflow-auto text-sm">
              {listed.slice(0, MAX_LISTED).map((r) => (
                <li key={r.line} className={r.status === "error" ? "text-destructive" : "text-muted-foreground"}>
                  Fila {r.line}{r.code ? ` (${r.code})` : ""}: {r.messages.join(" ")}
                </li>
              ))}
            </ul>
          )}
          {listed.length > MAX_LISTED && <p className="mt-1 text-xs text-muted-foreground">Mostrando {MAX_LISTED} de {listed.length}. Descarga el informe para verlas todas.</p>}
          {(listed.length > 0 || review.errors.length > 0) && (
            <Button variant="outline" size="sm" className="mt-2" onClick={() => downloadCsv(`errores-${review.input.entity}.csv`, errorsCsv(review).text)}>
              <Download className="h-4 w-4" aria-hidden="true" /> Descargar informe de filas
            </Button>
          )}
          {review.warnings.length > 0 && (
            <div className="mt-3 rounded-md border border-border bg-muted/50 p-3 text-sm">
              <p className="font-medium"><AlertTriangle className="mr-1 inline h-4 w-4" aria-hidden="true" />Advertencias</p>
              <ul className="mt-1 list-disc pl-5">{review.warnings.slice(0, MAX_LISTED).map((w) => <li key={w}>{w}</li>)}</ul>
              <label className="mt-2 flex items-center gap-2">
                <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
                Entiendo las advertencias y quiero crear estas altas igualmente
              </label>
            </div>
          )}
          <Button className="mt-3" onClick={doConfirm} disabled={!canConfirm}>Confirmar importación temporal</Button>
        </section>
      )}

      {outcome && (
        <section className={sectionClass} aria-labelledby="imp-5" role="status">
          <h2 id="imp-5" className="mb-2 font-semibold">5. Resultado</h2>
          {outcome.ok ? (
            <p className="text-sm">
              <CheckCircle2 className="mr-1 inline h-4 w-4 text-primary" aria-hidden="true" />
              {outcome.created} altas temporales creadas{outcome.omitted ? ` · ${outcome.omitted} omitidas` : ""}. Recargar la página o restablecer el catálogo las borra.{" "}
              <Link to={entity === "contactos" ? "/contactos" : "/cartera"} className="font-medium text-primary hover:underline">Ver listado</Link>
            </p>
          ) : (
            <p role="alert" className="text-sm text-destructive">{outcome.message}</p>
          )}
        </section>
      )}
    </div>
  );
}
