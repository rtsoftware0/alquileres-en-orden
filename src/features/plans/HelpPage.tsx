import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/features/layout/PageHeader";
import { fieldClass } from "@/features/layout/ui";

export const TOPICS = [
  { id: "inicio", title: "Primeros pasos", body: "Revisa la bienvenida, la empresa y tu perfil. Todo usa datos ficticios." },
  { id: "cartera", title: "Cartera y contactos", body: "Las altas y ediciones son temporales y se pierden al recargar o restablecer el catálogo." },
  { id: "dinero", title: "Dinero y gastos", body: "Cobros, deudas, fianzas y gastos son registros separados de ejemplo." },
  { id: "planes", title: "Planes y prueba", body: "La prueba y los pagos son simulados; ningún cobro es real." },
] as const;

export const FAQ = [
  { q: "¿Se guardan mis cambios?", a: "No. Es una demostración en memoria; recargar reinicia todo." },
  { q: "¿Puedo pagar de verdad?", a: "No. Los pagos son simulaciones sin tarjeta ni cobro." },
  { q: "¿Los roles limitan pantallas?", a: "No. Son etiquetas de ejemplo." },
  { q: "¿Qué pasa al terminar la prueba sin comprar?", a: "30 días de solo consulta y exportación, sin cargo y sin pasar a Basic gratis. Después, retención pendiente de política." },
];

export const SUPPORT_RESULT = "No enviado: sin ticket real ni compromiso de respuesta.";
const EMAIL = /^[A-Za-z0-9._%+-]+@example\.invalid$/;
type Errors = Partial<Record<"name" | "email" | "message", string>>;

export function validateSupport(v: { name: string; email: string; message: string }): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = "Indica un nombre ficticio.";
  if (!EMAIL.test(v.email)) e.email = "Usa un correo ficticio @example.invalid (solo caracteres ASCII).";
  const m = v.message.trim();
  if (m.length < 10 || m.length > 1000) e.message = "Escribe entre 10 y 1000 caracteres.";
  return e;
}

export function HelpPage() {
  const [v, setV] = useState({ name: "", email: "", topic: "inicio", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof v, val: string) => { setV({ ...v, [k]: val }); setDone(false); };
  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validateSupport(v);
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) { document.getElementById(`sup-${first}`)?.focus(); return; }
    setDone(true);
  };
  const aria = (k: keyof Errors) => (errors[k] ? { "aria-invalid": true, "aria-describedby": `sup-${k}-error` } : {});

  return (
    <div className="space-y-6">
      <PageHeader title="Ayuda" subtitle="Temas, preguntas frecuentes y soporte simulado." />
      <Panel title="Temas">
        <ul className="grid gap-3 sm:grid-cols-2">
          {TOPICS.map((t) => <li key={t.id} className="rounded-md border border-border p-3 text-sm"><h3 className="font-semibold">{t.title}</h3><p>{t.body}</p></li>)}
        </ul>
      </Panel>
      <Panel title="Preguntas frecuentes">
        <dl className="space-y-3 text-sm">{FAQ.map((f) => <div key={f.q}><dt className="font-medium">{f.q}</dt><dd className="text-muted-foreground">{f.a}</dd></div>)}</dl>
      </Panel>
      <Panel title="Contactar con soporte (simulado)">
        <p className="mb-3 text-sm text-muted-foreground">No escribas contraseñas ni datos reales. Nada se envía.</p>
        <form noValidate onSubmit={submit} className="space-y-3 text-sm">
          <div><label htmlFor="sup-name" className="font-medium">Nombre</label><input id="sup-name" className={fieldClass} value={v.name} onChange={(e) => set("name", e.target.value)} {...aria("name")} />{errors.name && <p id="sup-name-error" className="mt-1 text-destructive">{errors.name}</p>}</div>
          <div><label htmlFor="sup-email" className="font-medium">Correo ficticio</label><input id="sup-email" className={fieldClass} value={v.email} onChange={(e) => set("email", e.target.value)} {...aria("email")} />{errors.email && <p id="sup-email-error" className="mt-1 text-destructive">{errors.email}</p>}</div>
          <div><label htmlFor="sup-topic" className="font-medium">Tema</label><select id="sup-topic" className={fieldClass} value={v.topic} onChange={(e) => set("topic", e.target.value)}>{TOPICS.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></div>
          <div><label htmlFor="sup-message" className="font-medium">Mensaje</label><textarea id="sup-message" className={`${fieldClass} h-28 py-2`} value={v.message} onChange={(e) => set("message", e.target.value)} {...aria("message")} />{errors.message && <p id="sup-message-error" className="mt-1 text-destructive">{errors.message}</p>}</div>
          <Button type="submit">Preparar consulta</Button>
        </form>
        {done && <p role="status" className="mt-3 text-sm text-primary">{SUPPORT_RESULT}</p>}
      </Panel>
    </div>
  );
}
