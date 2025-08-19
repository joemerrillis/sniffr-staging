# Sniffr Frontend Constitution

Purpose: Keep tenant‑themed UIs consistent, accessible, and easy for agents to generate safely.

---
## Canonical References
- `app/(tenants)/[tenant]/layout.tsx` – Per‑tenant root layout & theme provider
- `app/(tenants)/[tenant]/route.ts` – Tenant resolution for RSC/data
- `lib/tenant.ts` – Tenant lookup + feature flags
- `components/ui/*` – Primitive components (buttons, inputs, sheets, dialogs, toasts)
- `styles/themes.css` – CSS variables for theme tokens (light/dark + brand)
- `styles/globals.css` – Global resets, typography scale, container widths
- `lib/theme/TenantThemeProvider.tsx` – Applies CSS vars from tenant theme

---
## Golden Rules
1) **One Design System**
   - Use primitives from `components/ui`. Don’t hand‑roll buttons/inputs.
   - Variant system: `variant={"solid"|"soft"|"outline"|"ghost"}` + `size={"sm"|"md"|"lg"}`.

2) **Tokens First**
   - Use CSS variables (e.g., `var(--brand-600)`, `var(--bg)`). Never hard‑code hex colors or spacing.
   - Spacing scale: `--space-1`..`--space-8`. Typography: `--font-sans`, `--text-sm`, `--text-base`, `--text-lg`, `--text-xl`, `--text-2xl`.

3) **Tenant Safety**
   - All pages must render with a `TenantThemeProvider` in their layout.
   - Do not fetch tenant data client‑side unless needed; prefer RSC loader utilities.

4) **Navigation & IA**
   - Page shell pattern: Sidebar (optional) + Topbar + Content container.
   - Breadcrumbs if depth > 1. Avoid ad‑hoc headers.

5) **Interaction Patterns**
   - Inline edit for simple fields; modal for multi‑step; sheet (right drawer) for secondary details.
   - Confirmation dialogs for destructive actions only.

6) **Accessibility**
   - All interactive elements focusable with visible outline.
   - Color contrast ≥ WCAG AA with tenant palettes.
   - Provide `aria-*` labels for icon‑only buttons.

7) **Data Fetching**
   - Server Components by default. Client components only for stateful UI.
   - Use `lib/api.ts` (fetch wrapper) with error boundaries.

8) **File Placement**
   - New page: `app/(tenants)/[tenant]/<area>/<page>/page.tsx` (+ `loading.tsx`, `error.tsx`).
   - Shared UI: `components/*`. Page‑local: `app/.../components/*`.

9) **Theming Contracts**
   - Required tokens: `--brand-50..900`, `--bg`, `--fg`, `--muted`, `--muted-fg`, `--card`, `--card-fg`, `--ring`, `--radius`.

10) **No Inline Style Drift**
   - Tailwind utility classes allowed, but must not re‑encode brand colors; use semantic classes mapping to tokens.

---
## Required Outputs for Agents

### PLAN (Markdown)
Plan

purpose, user jobs, routes, data

Pages

app/(tenants)/[tenant]/dogs/referrals/page.tsx: list & create referrals

components/referrals/ReferralForm.tsx: controlled form

API

GET /api/referrals?tenant=slug

POST /api/referrals

Theme Contracts

### APPLY (Strict JSON)
```json
{
  "summary": "Add referrals page",
  "commitMessage": "feat(fe): referrals page & form",
  "files": [{"path":"app/(tenants)/[tenant]/dogs/referrals/page.tsx","contents":"..."}]
}
