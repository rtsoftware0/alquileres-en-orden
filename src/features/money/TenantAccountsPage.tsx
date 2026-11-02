import { Link } from "@tanstack/react-router";
import { useCatalogData } from "@/features/catalog/CatalogContext";
import { tenantAccount, tenantAccountContacts, tenantContracts } from "./selectors";
import { Amounts, MoneyNav } from "./components/MoneyUi";
import { MoneyHeader } from "./MoneySummaryPage";
import { linkClass } from "@/features/layout/ui";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TenantAccountsPage() {
  const data = useCatalogData();
  const tenants = tenantAccountContacts(data);
  return (
    <>
      <MoneyHeader title="Cuentas de inquilinos" subtitle="Solo deuda propia de cada inquilino" />
      <MoneyNav />
      <p className="mb-3 text-sm text-muted-foreground">
        {tenants.length} personas son inquilinas en algún contrato de ejemplo. Ser avalista, propietario o arrendador no atribuye deuda.
      </p>
      <ul className="space-y-2">
        {tenants.map((t) => {
          const a = tenantAccount(data, t.id);
          const cts = tenantContracts(data, t.id);
          return (
            <li key={t.id} className="rounded-lg border border-border bg-card p-4">
              <Link to="/dinero/inquilinos/$contactId" params={{ contactId: t.id }} className={cn(linkClass, "text-sm")}>{t.name}</Link>
              <p className="mt-0.5 text-xs text-muted-foreground">{t.code} · {cts.map((c) => c.reference).join(", ")}</p>
              <div className="mt-3">
                <Amounts items={[["Pendiente", formatMoney(a.pendingCents), true], ["Cobros recibidos", formatMoney(a.receivedCents)], ["Sin asignar", formatMoney(a.unallocatedCents)]]} />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
