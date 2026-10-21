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
- Feature code lives in `src/features/<feature>/` (components, logic); routes in `src/routes/` stay thin. Why: keeps the future SaaS modules isolated and maintainable.
- Product-wide constants (name, copy) live in `src/config/site.ts`. Why: single source for branding.
- No backend is connected; any future backend must be the owner's independent Supabase, never Lovable Cloud. Why: explicit owner constraint.
- Demo data lives in typed local modules under `src/features/<feature>/data/`; UI reads only through `selectors.ts` (derived totals, never hardcoded). Why: lets a real data source replace the demo without UI changes.
- Shared app shell (sidebar + mobile menu + demo notice) lives in `src/features/layout/` and wraps `<Outlet />` in `__root.tsx`. Why: one layout for all screens.
