import { site } from "@/config/site";

const pillars = ["Inmuebles", "Contratos", "Seguimiento"];

export function WelcomeScreen() {
  return (
    <main className="welcome-bg flex min-h-screen flex-col">
      <header className="mx-auto w-full max-w-5xl px-6 pt-8">
        <span className="font-display text-sm font-semibold tracking-[0.2em] text-primary">
          {site.name}
        </span>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-16">
        <p className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
          En preparación
        </p>
        <h1 className="font-display max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight text-foreground sm:text-6xl">
          {site.tagline}
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          {site.description}
        </p>
        <ul className="mt-12 flex flex-wrap gap-3" aria-label="Áreas previstas">
          {pillars.map((p) => (
            <li
              key={p}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground"
            >
              {p}
            </li>
          ))}
        </ul>
      </section>

      <footer className="mx-auto w-full max-w-5xl px-6 pb-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()} {site.name}
      </footer>
    </main>
  );
}
