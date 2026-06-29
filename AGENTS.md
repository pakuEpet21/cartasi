# Agent Notes — CartaSI

## Stack at a glance

- TanStack Start (React 19 + Vite + TanStack Router file-based routing). **Not Next.js.**
- Tailwind CSS v4, shadcn/ui components in `src/components/ui`.
- Supabase for auth/data. Server functions via `@tanstack/react-start`.

## Package manager

- pnpm

## Developer commands

```bash
pnpm dev          # start dev server
pnpm build        # production build
pnpm build:dev    # development build
pnpm preview      # preview production build
pnpm lint         # eslint .
pnpm format       # prettier --write .
```

There is no test/typecheck script.

## Vite config — do not duplicate plugins

`vite.config.ts` uses `@lovable.dev/vite-tanstack-config`. That package already includes `tanstackStart`, `viteReact`, `tailwindcss`, `tsConfigPaths`, `nitro`, `componentTagger`, etc. **Do not add them manually** or the app breaks with duplicate plugins.

The only extra option set is the server entry override:

```ts
tanstackStart: { server: { entry: "server" } }
```

`src/server.ts` is therefore the SSR entry wrapper that normalizes catastrophic h3-swallowed errors.

## Server functions

- Define them with `createServerFn` from `@tanstack/react-start`.
- Public read functions live in `*.functions.ts` (e.g. `features/menu/menu.functions.ts`).
- Admin/mutating functions live in `admin.functions.ts`.
- Input validation is done with `.inputValidator(...)`, typically using Zod.
- Private server functions rely on `attachSupabaseAuth` middleware registered in `src/start.ts` as `functionMiddleware`. Without it, the browser never sends the Supabase bearer token on RPC calls.

## Supabase clients

| Import | Env vars | Use |
|---|---|---|
| `@/integrations/supabase/client` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (falls back to `SUPABASE_*` for SSR) | Browser + SSR with user auth/RLS |
| `@/integrations/supabase/client.server` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Server-only, bypasses RLS |

Both client files are auto-generated; do not edit by hand.

## Routing

TanStack Router file-based routing. Conventions:

| File | Route |
|---|---|
| `src/routes/index.tsx` | `/` |
| `src/routes/about.tsx` | `/about` |
| `src/routes/users/$id.tsx` | `/users/:id` |
| `src/routes/files/$.tsx` | `/files/*` |
| `src/routes/_layout.tsx` | layout route |
| `src/routes/__root.tsx` | root app shell |

`routeTree.gen.ts` is auto-generated. See `src/routes/README.md` for the full convention table.

## Architecture

Feature-first: `routes` orchestrate; `features/*` contain components, hooks, stores, types, and server functions; `shared/`, `lib/`, `integrations/` hold cross-cutting code.

Rule: **never import internal files from another feature**. Use each feature’s public `index.ts` exports.

`src/shared/config.ts` contains the active tenant:

```ts
export const ACTIVE_RESTAURANT_SLUG = "mi-restaurante";
export const SITE_NAME = "CartaSI";
```

## Styling / theming

- Tailwind v4 with `@theme inline` in `src/styles.css`.
- Colors are HSL channels (e.g. `--primary: 24 60% 38%`) so opacity utilities compose.
- `ThemeInjector` (from `features/theme`) writes runtime overrides from the `restaurants.theme` JSONB column.

## shadcn/ui

- `components.json`: style `new-york`, `rsc: false`, `tsx: true`.
- Aliases: `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`, `@/hooks`.
- Components live in `src/components/ui`.

## Auth

- Google OAuth via Supabase.
- `/auth` page at `src/routes/auth.tsx`.
- Admin routes live under `src/routes/_authenticated/`; the layout should enforce auth client-side (session is in `localStorage`, so admin routes are `ssr:false`).

## Generated / ignored artifacts

Do not edit:

- `src/routeTree.gen.ts`
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/client.server.ts`

Gitignored build dirs: `dist`, `dist-ssr`, `.output`, `.vinxi`, `.nitro`, `.tanstack/**`.

## Lint / format conventions

- Prettier: `printWidth: 100`, semis, double quotes, trailing commas `all`.
- ESLint ignores `dist`, `.output`, `.vinxi`.
- `@typescript-eslint/no-unused-vars` is off.
- `server-only` package import is forbidden by ESLint (TanStack Start uses `*.server.ts` files or `@tanstack/react-start/server-only` instead).

## Useful references

- `docs/ARCHITECTURE.md` — full architecture overview in Spanish.
- `src/routes/README.md` — TanStack Router file conventions.
