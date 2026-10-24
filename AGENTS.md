<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Settlements (`src/features/settlements/`) use read-only portfolio/bank projections, separate educational contexts, a pure integer-cent engine and a root memory-only provider; approved versions retain snapshots, owner payments are logical-settlement/beneficiary scoped, and closure reviews survive navigation in the same provider and revalidate source fingerprints before locking only this scenario. Why: corrections and closing cannot duplicate payments, infer missing agreements, or mutate prior modules.
- Banking (`src/features/bank/`) uses a root React context including selected account, read-only ledger adapters, Papa Parse for embedded CSV, a pure reconciliation engine, monotonic hypothetical references and derived remaining amounts across all active links; unreferenced bank fingerprints normalize concepts across sources independently of manual classification, and educational records remain account-scoped. Why: navigation and reversions preserve identity without changing cash, debt, deposits or prior modules.
- Planning (`src/features/planning/`) uses a root React context, ID-only metadata and one interval engine; edits retain the applied change, all replacement segments and individual reversions are conflict-checked, and application-linked drafts lock candidate/unit with explicit lessor relationships. Why: temporal navigation must preserve coherent availability and application identity without mutating the base dataset.
- Feature code lives in `src/features/<feature>/` (components, logic); routes in `src/routes/` stay thin. Why: keeps the future SaaS modules isolated and maintainable.
- Product-wide constants (name, copy) live in `src/config/site.ts`. Why: single source for branding.
- No backend is connected; any future backend must be the owner's independent Supabase, never Lovable Cloud. Why: explicit owner constraint.
- Demo data lives in typed local modules under `src/features/<feature>/data/`, aggregated into one dataset (`portfolio/data/demo-data.ts`) with relations by ID only; UI reads through each feature's `selectors.ts` (derived totals, never hardcoded or copied). Why: lets a real data source replace the demo without UI changes and prevents divergent records.
- Money is stored as integer cents and dates as ISO calendar strings with check-out excluded; date math uses UTC helpers in `src/lib/format.ts`. Why: avoids rounding and timezone day shifts.
- Demo forms keep state only in React memory (no URL, storage or network). Why: demo must never persist or simulate saving.
- Shared app shell (sidebar + mobile menu + demo notice) lives in `src/features/layout/` and wraps `<Outlet />` in `__root.tsx`. Why: one layout for all screens.
- Money (`src/features/money/`): balances are never stored; they derive in `money/selectors.ts` from charges, payments and allocations, and Inicio/Cartera read pending through the same selectors. The simulator (`money/simulator.ts`) is pure and never mutates data. Deposits are a separate ledger. Why: one source of truth, ready to swap for a real data source.
- Expenses (`money/expenses.ts`, `expense-draft.ts`, `expense-simulator.ts`, data in `money/data/demo-expenses.ts`) are a third separate ledger: never netted against tenant debt, never rent or deposits; provider payments are separate records with their own date. Split math uses exact cents with leftover cents to the first room code in stable order. Why: keeps cost, cash out and tenant debt clearly distinct.
- Incidents and tasks (`src/features/incidents/`): the 3 demo incidents and 4 tasks live in `incidents/data/demo-incidents.ts`; the follow-up simulator (`incidents/simulator.ts`) is a pure state machine that never mutates data, never unlocks rooms and never creates expenses — a budget is never a cost or payment. Why: visual preview of tracking flows with one source of truth.
- Documents, messages and notices (`src/features/docs/`): 5 embedded documents (doc-2 has 2 versions; doc-1 is the inc-2 120 € budget, still proposed v1), 3 threads and 5 notices live in `docs/data/demo-docs.ts`, aggregated into the dataset. No uploads/downloads/sending: content is synthetic text, visibility and recipients are examples that grant no access, internal notes never appear in the shared view, drafts and simulated reads are React-memory only and never enter history. Why: visual preview of DOC/COM flows with one source of truth.
