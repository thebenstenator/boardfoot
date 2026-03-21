# BoardFoot

> A woodworking project cost estimator and bill of materials planner for hobbyists and small makers.

**Live app:** [boardfoot.vercel.app](https://boardfoot.vercel.app)

---

## What it does

BoardFoot lets woodworkers build accurate bills of materials without CAD software. Users add lumber (with automatic board foot calculation and waste factor math), hardware, and consumables to a project and get a live cost breakdown including suggested retail price and Etsy pricing.

Key features:

- Board foot calculator with nominal-to-actual conversion and waste factor (margin math, not additive)
- Lumber, hardware, and consumables line items with inline editing
- Live cost summary with suggested retail and Etsy fee breakdown
- PDF export (branded on free tier, clean on Pro)
- Stripe subscription billing with free and Pro tiers
- Species price database with autocomplete and per-user price overrides
- Supabase auth with email and Google OAuth

---

## Tech stack

| Layer      | Choice                      |
| ---------- | --------------------------- |
| Framework  | Next.js 14 (App Router)     |
| Language   | TypeScript                  |
| Styling    | Tailwind CSS + shadcn/ui    |
| Database   | Supabase (PostgreSQL + RLS) |
| Auth       | Supabase Auth               |
| Payments   | Stripe                      |
| State      | Zustand                     |
| PDF        | @react-pdf/renderer         |
| Testing    | Vitest                      |
| Deployment | Vercel                      |

---

## Architecture

The codebase is organized into vertical slices — each feature owns its database tables, API routes, state, and components. Calculation logic lives in `lib/calculations/` as pure TypeScript functions with full unit test coverage, completely separate from React.
