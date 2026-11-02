// Root account provider (tanda 7). Lives outside the catalog/settlements
// providers so navigation and their resets never restart it. React memory only:
// a reload loses it. Commands validate against the latest accepted state.
import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { initialAccount } from "./data/demo-account";
import {
  acceptInvitation, activeAdmins, activeMembers, activeSeats, invite, profileMember, revokeInvitation, setMemberActive,
  setMemberRoles, simulateRecovery, simulateSignIn, simulateSignOut, updateCompany, updateProfile,
  type AccountResult, type AccountRole, type AccountState, type CompanyInput, type InviteInput, type Member, type ProfileInput,
} from "./engine";

export interface AccountApi {
  state: AccountState;
  companyId: string;
  activeMembers: Member[];
  activeSeats: number;
  activeAdminCount: number;
  profile: Member | undefined;
  updateCompany: (i: CompanyInput) => AccountResult;
  updateProfile: (i: ProfileInput) => AccountResult;
  setRoles: (memberId: string, roles: AccountRole[]) => AccountResult;
  setActive: (memberId: string, active: boolean) => AccountResult;
  invite: (i: InviteInput) => AccountResult;
  accept: (invitationId: string, name: string) => AccountResult;
  revoke: (invitationId: string) => AccountResult;
  signIn: (email: string) => AccountResult;
  recover: (email: string) => AccountResult;
  signOut: () => AccountResult;
  reset: () => void;
}

const Ctx = createContext<AccountApi | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AccountState>(initialAccount);
  const latest = useRef(state);
  const ops = useMemo(() => {
    const run = (f: (s: AccountState) => AccountResult): AccountResult => {
      const r = f(latest.current);
      if (r.ok) { latest.current = r.state; setState(r.state); }
      return r;
    };
    return {
      updateCompany: (i: CompanyInput) => run((s) => updateCompany(s, i)),
      updateProfile: (i: ProfileInput) => run((s) => updateProfile(s, i)),
      setRoles: (id: string, roles: AccountRole[]) => run((s) => setMemberRoles(s, id, roles)),
      setActive: (id: string, a: boolean) => run((s) => setMemberActive(s, id, a)),
      invite: (i: InviteInput) => run((s) => invite(s, i)),
      accept: (id: string, name: string) => run((s) => acceptInvitation(s, id, name)),
      revoke: (id: string) => run((s) => revokeInvitation(s, id)),
      signIn: (e: string) => run((s) => simulateSignIn(s, e)),
      recover: (e: string) => run((s) => simulateRecovery(s, e)),
      signOut: () => run((s) => simulateSignOut(s)),
      reset: () => { const s = initialAccount(); latest.current = s; setState(s); },
    };
  }, []);
  const api = useMemo<AccountApi>(() => ({
    state, companyId: state.company.id, activeMembers: activeMembers(state), activeSeats: activeSeats(state),
    activeAdminCount: activeAdmins(state).length, profile: profileMember(state), ...ops,
  }), [state, ops]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useAccount(): AccountApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAccount requiere AccountProvider");
  return v;
}
