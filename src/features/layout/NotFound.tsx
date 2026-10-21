import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/button";

export function NotFoundMessage({ title = "Página no encontrada", text = "La dirección no existe en esta demostración." }: { title?: string; text?: string }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      <div className="mt-6 flex justify-center gap-2">
        <Link to="/" className={buttonVariants({ variant: "outline" })}>Ir a Inicio</Link>
        <Link to="/cartera" className={buttonVariants()}>Ver cartera</Link>
      </div>
    </div>
  );
}
