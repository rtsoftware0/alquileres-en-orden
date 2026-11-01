import { createContext, useContext, useState, type ReactNode } from "react";
import { demoPortfolio } from "@/features/portfolio/data/demo-data";
import { useSettlements } from "@/features/settlements/SettlementContext";
import { initialSharing, type SharingState } from "./data/demo-portal-sharing";
import {
  activeShareFor, restoreGrant, revokeGrant, shareVersion, sharedSettlementDetail, sharedSettlementsFor, withdrawShare,
  type ShareDeps, type ShareTarget,
} from "./settlement-projection";

// In-memory sharing state. Mounted inside SettlementProvider so resetting
// the settlements scenario remounts it and clears shares and revocations.

type Ctx = { companyId: string; profile: string; contactId: string };
interface Api {
  state: SharingState;
  revoked: ReadonlySet<string>;
  share: (t: ShareTarget) => { ok: true; changed: boolean } | { ok: false; error: string };
  withdraw: (t: Omit<ShareTarget, "version">) => void;
  revoke: (grantId: string) => void;
  restore: (grantId: string) => void;
  activeShare: (t: Omit<ShareTarget, "version">) => ReturnType<typeof activeShareFor>;
  listFor: (ctx: Ctx) => ReturnType<typeof sharedSettlementsFor>;
  detailFor: (ctx: Ctx, settlementId: string) => ReturnType<typeof sharedSettlementDetail>;
}

const ShareCtx = createContext<Api | null>(null);

export function PortalShareProvider({ children }: { children: ReactNode }) {
  const { state: settlements } = useSettlements();
  const [state, setState] = useState(initialSharing);
  const deps: ShareDeps = { data: demoPortfolio, settlements };
  const api: Api = {
    state,
    revoked: new Set(state.revokedGrants),
    share: (t) => {
      const r = shareVersion(state, t, deps);
      if (!r.ok) return r;
      if (r.changed) setState(r.state);
      return { ok: true, changed: r.changed };
    },
    withdraw: (t) => setState((s) => withdrawShare(s, t)),
    revoke: (id) => setState((s) => revokeGrant(s, id)),
    restore: (id) => setState((s) => restoreGrant(s, id)),
    activeShare: (t) => activeShareFor(state, t),
    listFor: (ctx) => sharedSettlementsFor(state, ctx, deps),
    detailFor: (ctx, id) => sharedSettlementDetail(state, ctx, id, deps),
  };
  return <ShareCtx.Provider value={api}>{children}</ShareCtx.Provider>;
}

export function usePortalSharing() {
  const c = useContext(ShareCtx);
  if (!c) throw new Error("Compartición de portal no disponible");
  return c;
}
