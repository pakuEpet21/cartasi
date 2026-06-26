# SaaS Menú Restaurantes — Plantilla con Feature Flags

## Decisión de stack y por qué

Tu spec pide **Next.js App Router**, pero esta plataforma corre **TanStack Start v1** (React 19 + Vite + TanStack Router) y no puedo cambiar el framework base. Adaptamos manteniendo el espíritu de la spec:

| Spec original | Equivalente en este stack | Por qué |
|---|---|---|
| Next.js App Router | TanStack Router file-based (`src/routes/`) | Mismo modelo de routing por archivo, SSR nativo |
| Server Components / Server Actions | `createServerFn` + server routes | RPC tipado, ejecuta solo en server, mismo aislamiento |
| `app/`, `pages/` | `src/routes/` | Convención del framework |
| Metadata API | `head()` por ruta | Soporta title/description/OG/JSON-LD igual |
| ISR / SSR | SSR por defecto + cache headers en server routes | Cubre el 95% del caso |
| Resto del stack (Tailwind, Zustand, TanStack Query, Framer Motion, Zod, Supabase) | **Sin cambios** | Todo soportado |

`next-intl` se reemplaza por **i18next** (mismo modelo de namespaces, lazy load por flag).

## Arquitectura Feature-First

```
src/
  app/                # capa de bootstrap (providers, router, layout shell)
  routes/             # rutas TanStack (delgadas, solo orquestan features)
  features/
    menu/
      components/
      hooks/
      services/       # llamadas a server fns / supabase
      store.ts        # Zustand
      types.ts
      index.ts        # ÚNICA superficie pública
    cart/
    chatbot/
    reservations/
    gallery/
    admin/
    flags/            # core: provider + useFlags()
    i18n/
    theme/            # design tokens runtime
    auth/
  shared/
    components/ui/    # shadcn (ya presente)
    components/       # primitivos compartidos no-shadcn
    hooks/
    utils/
  lib/                # integraciones puras (supabase client, query client)
  styles/             # tokens.css + styles.css
  types/              # tipos globales (Database, etc.)
```

**Reglas de dependencia (enforced vía ESLint `no-restricted-imports`)**:
- `routes/` → `features/*/index.ts` y `shared/`
- `features/*` → `shared/`, `lib/`, `types/`
- `features/A` ❌ `features/B` (excepto vía eventos en un bus compartido en `shared/`)
- Nada importa archivos internos de otra feature (solo el barrel `index.ts`)

**Por qué**: barrel files + lint rule es la única forma realista de hacer cumplir "feature independiente" en TS sin monorepo. Más simple que Nx/Turborepo y suficiente para una plantilla SaaS.

## Sistema de Feature Flags

**Tres capas, en orden de precedencia (mayor primero)**:

1. **Override por URL** (`?flag.cart=1`) — solo para QA/preview
2. **DB por restaurante** (`feature_flags` table, una fila por restaurant_id)
3. **Defaults en código** (`shared/config/flags.default.ts`)

```ts
// features/flags/index.ts
export { FlagsProvider } from './provider'
export { useFlags } from './use-flags'        // const { cart } = useFlags()
export { useFlag } from './use-flag'          // const cart = useFlag('cart')
export { IfFlag } from './if-flag'            // <IfFlag name="cart">...</IfFlag>
export type { FeatureFlags } from './types'
```

- Flags se cargan en el **loader de `__root.tsx`** vía `getRestaurantConfig` server fn → llegan ya hidratadas en SSR (sin flash).
- `FeatureFlags` es un tipo `Record<FlagName, boolean>` con `FlagName` como union literal — autocompletado total.
- Code-splitting: features pesadas (chatbot, gallery, minigame) se importan con `React.lazy` dentro de `<IfFlag>`, así si el flag está off **no se descarga el bundle**.

## Design Tokens

Tokens en `src/styles/tokens.css` como CSS vars semánticas (no hex hardcoded en componentes):

```css
:root {
  --color-bg, --color-fg, --color-primary, --color-primary-fg,
  --color-accent, --color-muted, --color-border, --color-destructive,
  --font-sans, --font-display,
  --radius-sm, --radius-md, --radius-lg,
  --shadow-sm, --shadow-md, --shadow-lg,
  --space-1..--space-12,
  --motion-fast, --motion-base, --motion-slow,
  --ease-out, --ease-spring
}
```

Mapeados en `@theme inline` de Tailwind v4 → utilidades `bg-primary`, `text-fg`, `rounded-md`, `shadow-md`, `font-display`.

**Theming runtime por restaurante**: `features/theme` lee el row `restaurants.theme` (JSONB) e inyecta un `<style>` con overrides en `__root.tsx`. Cambiar marca = un UPDATE en DB, cero deploy.

Base inicial: neutros cálidos, tipografía `Inter` + `Fraunces` (display), radios medios. El admin podrá editar todo.

## Esquema Supabase

```sql
-- enums
create type app_role as enum ('owner', 'admin', 'staff');
create type allergen as enum ('gluten','lactose','nuts','egg','fish','shellfish','soy','sesame');

-- tablas
restaurants (id, slug uniq, name, theme jsonb, locale, currency, created_at)
restaurant_members (restaurant_id, user_id, role app_role)  -- multi-tenant
feature_flags (restaurant_id pk, flags jsonb)
categories (id, restaurant_id, name, slug, position, is_active)
menu_items (id, restaurant_id, category_id, name, description, price_cents,
            is_active, is_featured, position, allergens allergen[],
            calories int, tags text[], i18n jsonb)
menu_images (id, menu_item_id, storage_path, alt, position, is_primary)
promotions (id, restaurant_id, title, body, image_path, starts_at, ends_at, is_active)
opening_hours (id, restaurant_id, weekday smallint, opens time, closes time)
social_links (id, restaurant_id, platform, url)
reservations (id, restaurant_id, name, email, phone, party_size, slot_at, status, notes)
reviews (id, restaurant_id, author, rating, body, created_at, is_approved)
user_roles (user_id, role app_role)  -- patrón seguro de roles
```

**RLS estricta** (patrón obligatorio en este stack):
- `has_role(user, role)` security-definer + `is_member_of(restaurant_id)` security-definer
- Lectura pública (anon): `menu_items`, `categories`, `menu_images`, `promotions activas`, `opening_hours`, `social_links`, `reviews aprobadas` — filtradas por `restaurant_id` y columnas seguras
- Escritura: solo `is_member_of(restaurant_id)` + rol apropiado
- GRANTs explícitos a `anon`/`authenticated`/`service_role` en cada CREATE TABLE (este stack los requiere)

## Auth

- **Google OAuth** vía `lovable.auth.signInWithOAuth('google', ...)` (broker requerido por la plataforma)
- Página pública `/auth` (signin) + callback público que redirige a `/admin`
- `/admin/*` bajo `_authenticated/` (layout gestionado por la integración, `ssr:false`, redirige a `/auth`)
- Gate adicional de rol admin con `has_role` server-side en cada server fn admin

## Rutas

**Públicas** (SSR + SEO):
- `/` — Home (header, banner promo si flag, buscador, filtros, listado)
- `/menu/$category` — Categoría
- `/item/$slug` — Detalle de plato (OG image dinámica)
- `/reservas` — solo si `reservations` flag
- `/galeria` — solo si `gallery` flag (las rutas existen pero el `loader` lanza notFound si el flag está off)
- `/auth` — signin
- `/sitemap.xml`, `/robots.txt`

**Protegidas** (`src/routes/_authenticated/admin.*`):
- `/admin` — dashboard
- `/admin/menu` — CRUD platos
- `/admin/categories` — CRUD categorías
- `/admin/promotions` — CRUD promos + banner
- `/admin/hours` — horarios
- `/admin/social` — redes
- `/admin/flags` — toggles de feature flags (UI = checkboxes mapeados a `feature_flags.flags`)
- `/admin/theme` — editor de design tokens (colores/tipografía/radios) → guarda en `restaurants.theme`
- `/admin/users` — gestión de miembros (solo `owner`)

## Animaciones (Framer Motion)

Presets compartidos en `shared/motion/`:
- `fadeUp`, `popIn`, `staggerChildren`
- `cartBump` (escala + spring corto cuando se añade)
- `categorySwitch` (crossfade + slide pequeño)
- `favoriteBurst` (corazón + scale)

Duración base ≤ 250ms. Respetar `prefers-reduced-motion` globalmente.

## SEO

- `head()` por ruta con title/description/OG/Twitter únicos
- `og:image` por ruta hoja (no en `__root.tsx`)
- JSON-LD `Restaurant` en `/`, `MenuItem` en detalle, `BreadcrumbList` en categoría
- `sitemap.xml` server route que lista categorías + items publicados
- `robots.txt` estático

## Rendimiento

- TanStack Query con `ensureQueryData` en loaders + `useSuspenseQuery` en componentes (patrón canónico del stack)
- `defaultPreloadStaleTime: 0` (ya configurado)
- Imágenes: Supabase Storage + `<img loading="lazy">` + `srcset` con transform URL params
- Code-splitting por feature flag (lazy imports)
- ISR-equivalente: `Cache-Control: s-maxage` en server routes públicas + `router.invalidate()` tras mutaciones admin

## Alcance del MVP (este turno)

**Implemento completo**:
1. Estructura completa de carpetas + ESLint rules de boundary
2. Schema Supabase + RLS + GRANTs + seed de 1 restaurante demo con categorías y platos
3. Auth Google + página `/auth` + layout `_authenticated`
4. Sistema de Feature Flags (provider, hook, defaults, carga server-side, admin toggle UI)
5. Design tokens + theme provider runtime
6. Home pública: header, banner (flag), buscador, filtros (categorías + alérgenos), grid de platos con imagen/precio/alérgenos/calorías (cada uno detrás de su flag)
7. Admin: CRUD de platos, categorías, flags, theme básico
8. SEO básico (head por ruta, sitemap, robots, JSON-LD Restaurant)
9. Animaciones base (fadeUp, stagger, hover)
10. Documentación: `ARCHITECTURE.md` + `FEATURES.md` + `README.md`

**Dejo como stub detrás de flag (off por defecto)**: cart, chatbot, reservations, gallery, minigame, loyalty, delivery, reviews, qr, table ordering, whatsapp order, multi-language. Cada uno con su carpeta + `index.ts` + componente placeholder, listo para implementar sin tocar el core.

## Detalles técnicos clave

- **Cliente Supabase**: browser desde `@/integrations/supabase/client`; server fns con `requireSupabaseAuth` middleware; lecturas públicas SSR con client publishable server-side (NO admin) para evitar el bug `Expected 3 parts in JWT`.
- **Server fns admin**: siempre verifican `has_role` + `is_member_of` antes de escribir, aunque tengan `requireSupabaseAuth`.
- **Mutaciones**: `useMutation` con invalidación de keys; nunca llamadas directas en `onClick`.
- **Boundary enforcement**: `eslint-plugin-boundaries` o `no-restricted-imports` con patrón `features/*/!(index)`.
- **No hash anchors** para secciones — cada sección con ruta propia (regla del stack para SEO/SSR).

## Lo que NO incluye este turno

- Pagos (no pedido)
- Implementación funcional de chatbot/cart/etc (solo scaffolding + flag)
- Tests E2E (puedo añadir Playwright en un turno siguiente)
- Multi-idioma activo (i18next instalado pero off por flag)

Si confirmas, lo construyo en build mode.
