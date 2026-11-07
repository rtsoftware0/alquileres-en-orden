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

## Current direction — Claude-led continuation (2026-11-07)

- The user now wants to improve, complete and maintain this project in Claude/Claude Code with independent tools. GitHub remains the code/documentation source; keep the existing own Supabase project. Lovable is the historical prototype origin, not the required development, validation or deployment environment.
- Read `docs/project/traspaso-a-claude-2026-11-07.md` and the updated completion plan. Start with the approved scope only. Diagnose the real Lovable build/editor dependencies, then propose a bounded independence change before implementing it.
- Improve architecture where evidence warrants it; do not rewrite the whole framework by default. The demo-specific rules below describe the existing prototype, not a permanent ban on persistence in subsequently approved backend scopes. Preserve intentional business invariants and isolate any retained demo mode.
- Final visual design is undecided. Historical concepts, including Verde mediterráneo, are references only. Keep the minimalist usability goal and obtain the user's concrete design selection before applying it broadly.
- Verify future saved work through GitHub and an independent runtime; Lovable re-reading is not a completion requirement. The connection notice above remains factually relevant while Git sync is enabled. Do not disconnect it, cancel subscriptions or delete resources without the corresponding explicit instruction.

## Architecture rules
- Portals (`src/features/portals/`) use isolated ID-only grant metadata, pure context-scoped selectors (explicit recipient AND authorized relation for documents; shared messages only) and page-local React state; views remount on context change/revocation. Grants are revalidated against the dataset (ownerId/tenantIds/providerId) in documents, threads and details; revocations reach every visibility derivation; external incident projections expose minimal fields only. Why: demo previews never leak another contact's data or mutate prior modules; not real security.
- Settlements (`src/features/settlements/`) use read-only sources and a root memory-only integer-cent engine; portfolio/educational scopes stay separate in totals, fingerprints and locks. Logical beneficiary payments derive cumulative pending separately from payment-date cash; pending edits hide review/approval/payment, and closures retain successive immutable snapshots with identified events. Why: corrections and reopening preserve history without mutating other modules or inventing agreements.
- Banking (`src/features/bank/`) uses a root React context including selected account, read-only ledger adapters, Papa Parse for embedded CSV, a pure reconciliation engine, monotonic hypothetical references and derived remaining amounts across all active links; unreferenced bank fingerprints normalize concepts across sources independently of manual classification, and educational records remain account-scoped. Why: navigation and reversions preserve identity without changing cash, debt, deposits or prior modules.
- Planning (`src/features/planning/`) uses a root React context, ID-only metadata and one interval engine; edits retain the applied change, all replacement segments and individual reversions are conflict-checked, and application-linked drafts lock candidate/unit with explicit lessor relationships. Why: temporal navigation must preserve coherent availability and application identity without mutating the base dataset.
- Feature code lives in `src/features/<feature>/` (components, logic); routes in `src/routes/` stay thin. Why: keeps the future SaaS modules isolated and maintainable.
- Product-wide constants (name, copy) live in `src/config/site.ts`. Why: single source for branding.
- Own Supabase development is connected: real-estate-dev (`tskooksubwunfjirvyjz`). Only the SDK/client/config exist; business state remains a demo, with no business tables/migrations/Storage buckets/Edge Functions verified on 2026-11-07. Never replace it with Lovable Cloud. Why: preserve the owner's chosen backend without claiming real persistence.
- Demo data lives in typed local modules under `src/features/<feature>/data/`, aggregated into one dataset (`portfolio/data/demo-data.ts`) with relations by ID only; UI reads through each feature's `selectors.ts` (derived totals, never hardcoded or copied). Why: lets a real data source replace the demo without UI changes and prevents divergent records.
- Money is stored as integer cents and dates as ISO calendar strings with check-out excluded; date math uses UTC helpers in `src/lib/format.ts`. Why: avoids rounding and timezone day shifts.
- Demo forms keep state only in React memory (no URL, storage or network). Why: demo must never persist or simulate saving.
- Shared app shell (sidebar + mobile menu + demo notice) lives in `src/features/layout/` and wraps `<Outlet />` in `__root.tsx`. Why: one layout for all screens.
- Money (`src/features/money/`): balances are never stored; they derive in `money/selectors.ts` from charges, payments and allocations, and Inicio/Cartera read pending through the same selectors. The simulator (`money/simulator.ts`) is pure and never mutates data. Deposits are a separate ledger. Why: one source of truth, ready to swap for a real data source.
- Expenses (`money/expenses.ts`, `expense-draft.ts`, `expense-simulator.ts`, data in `money/data/demo-expenses.ts`) are a third separate ledger: never netted against tenant debt, never rent or deposits; provider payments are separate records with their own date. Split math uses exact cents with leftover cents to the first room code in stable order. Why: keeps cost, cash out and tenant debt clearly distinct.
- Incidents and tasks (`src/features/incidents/`): the 3 demo incidents and 4 tasks live in `incidents/data/demo-incidents.ts`; the follow-up simulator (`incidents/simulator.ts`) is a pure state machine that never mutates data, never unlocks rooms and never creates expenses — a budget is never a cost or payment. Why: visual preview of tracking flows with one source of truth.
- Documents, messages and notices (`src/features/docs/`): 5 embedded documents (doc-2 has 2 versions; doc-1 is the inc-2 120 € budget, still proposed v1), 3 threads and 5 notices live in `docs/data/demo-docs.ts`, aggregated into the dataset. No uploads/downloads/sending: content is synthetic text, visibility and recipients are examples that grant no access, internal notes never appear in the shared view, drafts and simulated reads are React-memory only and never enter history. Why: visual preview of DOC/COM flows with one source of truth.

## Project workflow and continuity (2026-11-07)
- Read `docs/project/ESTADO.md`, `Tools Conventions.md`, the V1.1 specification, blueprint and G0 decision table before planning changes. Explicit current user instructions take priority over historical one-step prompts.
- Communicate in Spanish. The user directs and reviews the work without writing code.
- Preserve the existing application. The visual blocks 09 and 09→10 integration are delivered; do not regenerate them.
- Prepare each concrete construction scope for approval; then finish and verify that scope without repeated approval. Do not automatically start the next scope.
- Purchases/top-ups, publication, real charges, external communications, deletion and access changes require their specific authorization. Use fictional data; the partner's 150 rooms are not permission to use tenant data.
- Report only checks actually executed, with revision and result. Register failed/unexecuted checks separately. After two failed fixes, stop that fix and continue independent authorized work.
- Do not rewrite synced Git history. GitHub/Lovable synchronization does not itself deploy database migrations or authorize a production release.
- Before installing or changing dependencies, inspect the existing `bun.lock` and `bunfig.toml`; do not replace the framework or package manager as a routine setup step.
