import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Building2, CalendarDays, CheckSquare, Files, FileText, Home, Info, Menu, MessageSquare, Users, Wallet, Wrench, ClipboardList, CalendarCheck, Globe, BarChart3, Settings, CreditCard, LifeBuoy } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { site } from "@/config/site";
import { useAccount } from "@/features/account/AccountContext";

const nav = [
  { to: "/", label: "Inicio", icon: Home, exact: true },
  { to: "/cartera", label: "Cartera", icon: Building2, exact: false },
  { to: "/contactos", label: "Contactos", icon: Users, exact: false },
  { to: "/contratos", label: "Contratos", icon: FileText, exact: false },
  { to: "/calendario", label: "Calendario", icon: CalendarDays, exact: false },
  { to: "/solicitudes", label: "Solicitudes", icon: ClipboardList, exact: false },
  { to: "/reservas", label: "Reservas", icon: CalendarCheck, exact: false },
  { to: "/dinero", label: "Dinero", icon: Wallet, exact: false },
  { to: "/informes", label: "Informes", icon: BarChart3, exact: false },
  { to: "/incidencias", label: "Incidencias", icon: Wrench, exact: false },
  { to: "/tareas", label: "Tareas", icon: CheckSquare, exact: false },
  { to: "/documentos", label: "Documentos", icon: Files, exact: false },
  { to: "/mensajes", label: "Mensajes", icon: MessageSquare, exact: false },
  { to: "/avisos", label: "Avisos", icon: Bell, exact: false },
  { to: "/portales", label: "Portales", icon: Globe, exact: false },
  { to: "/configuracion", label: "Configuración", icon: Settings, exact: false },
  { to: "/planes", label: "Planes", icon: CreditCard, exact: false },
  { to: "/ayuda", label: "Ayuda", icon: LifeBuoy, exact: false },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Principal">
      <ul className="space-y-1">
        {nav.map(({ to, label, icon: Icon, exact }) => (
          <li key={to}>
            <Link
              to={to}
              onClick={onNavigate}
              activeOptions={{ exact }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-muted data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
              activeProps={{ "aria-current": "page" }}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Brand() {
  return (
    <Link to="/" className="block rounded-sm text-sm font-bold tracking-[0.12em] text-primary">
      {site.name}
    </Link>
  );
}

function OrgInfo() {
  const a = useAccount();
  const s = a.state.session;
  return (
    <div className="rounded-md border border-border bg-muted/50 p-3 text-xs">
      <p className="font-semibold text-foreground">{a.state.company.name}</p>
      <p className="mt-0.5 text-muted-foreground">{a.profile?.name} · {s.status === "dentro" ? "sesión simulada" : "sesión simulada cerrada"}</p>
      <p className="mt-1.5 flex gap-2">
        <Link to="/acceso" className="font-medium text-primary hover:underline">Acceso</Link>
        <Link to="/bienvenida" className="font-medium text-primary hover:underline">Bienvenida</Link>
      </p>
    </div>
  );
}

export function DemoNotice() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-demo px-2.5 py-1 font-semibold text-demo-foreground">
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
        {site.demoLabel}
      </span>
      <span className="text-muted-foreground">{site.demoHelp}</span>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm">
        Saltar al contenido
      </a>
      <aside className="hidden overflow-y-auto border-r border-sidebar-border bg-sidebar lg:flex lg:sticky lg:top-0 lg:h-screen lg:flex-col lg:gap-8 lg:p-5">
        <Brand />
        <NavLinks />
        <div className="mt-auto"><OrgInfo /></div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground"
                aria-label="Abrir menú"
              >
                <Menu className="h-4 w-4" aria-hidden="true" />
              </SheetTrigger>
              <SheetContent side="left" className="flex w-72 overflow-y-auto flex-col gap-8 bg-sidebar p-5">
                <div>
                  <SheetTitle className="text-sm font-bold tracking-[0.12em] text-primary">{site.name}</SheetTitle>
                  <SheetDescription className="sr-only">Menú de navegación</SheetDescription>
                </div>
                <NavLinks onNavigate={() => setOpen(false)} />
                <div className="mt-auto"><OrgInfo /></div>
              </SheetContent>
            </Sheet>
            <Brand />
          </div>
          <div className="border-t border-border px-4 py-2 lg:border-t-0 lg:px-8">
            <DemoNotice />
          </div>
        </header>
        <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
