# Arquitectura — Plantilla SaaS Carta de Restaurante

> Stack real: **TanStack Start (React 19 + Vite + TanStack Router) + Supabase + Tailwind v4**.
> El brief mencionaba Next.js; este entorno usa TanStack Start, que cubre los mismos
> requisitos (SSR, server functions, file-based routing, head metadata).

## Capas

```
routes (pages) -> features/* -> shared / lib / integrations
```

- Las **routes** solo orquestan: cargan datos, leen flags y componen UI de features.
- Cada **feature** es autocontenida (`components/`, `hooks/`, `*.functions.ts`, `store.ts`, `types.ts`) y expone su API por `index.ts`.
- **Nunca** se importa un archivo interno de otra feature.
- `shared/` contiene utilidades transversales (`Container`, formatters, motion presets, `SiteHeader/Footer`).

## Feature Flags (3 capas)

1. Valores por defecto (`features/flags/defaults.ts`).
2. Overrides persistidos por restaurante (`feature_flags` en Supabase).
3. Overrides por URL `?ff_chatbot=true` para QA.

`resolveFlags()` los combina y `<FlagsProvider>` los inyecta en el árbol. Se consumen con `useFlags()`, `useFlag("cart")` o `<IfFlag name="cart">`.

## Theming

Design tokens como **canales HSL** en `src/styles.css`, mapeados a Tailwind v4 vía `@theme`. `ThemeInjector` escribe overrides por restaurante en `:root` al montar; cualquier instancia puede tener su paleta sin tocar código.

## Datos (Supabase)

Tablas multi-tenant: `restaurants`, `restaurant_members`, `user_roles`, `feature_flags`, `categories`, `menu_items`, `promotions`, `opening_hours`, `social_links`, `reservations`, `reviews`. RLS activado; helpers `SECURITY DEFINER` (`is_restaurant_member`, `has_role`) evitan recursividad en las policies.

## Server Functions

- Públicas: `getRestaurantConfig`, `getMenu`, `getPromotions`, `getOpeningHours`, `getSocialLinks`.
- Privadas: `upsertMenuItem`, `deleteMenuItem`, `upsertCategory`, `deleteCategory`, `updateFlags`, `updateTheme` (middleware `attachSupabaseAuth` + check de membresía).

## Auth

Google OAuth vía Supabase. `<GoogleSignInButton />` en `/auth`. El layout `_authenticated` redirige a `/auth` si no hay sesión (`ssr:false` porque el token vive en `localStorage`).

## SEO

- `head()` por ruta (title, description, OG, Twitter).
- JSON-LD `Restaurant` en la home.
- `noindex` en `/auth` y `/admin/*`.
- Sitemap dinámico: pendiente como server route.

## Decisiones notables

- **Feature-first sobre layered**: borrar una funcionalidad opcional = borrar una carpeta.
- **Flags resueltos en el server loader**: sin flicker, SSR consistente.
- **HSL channels en lugar de hex**: permite alpha y overrides parciales.
- **TanStack Query + suspense**: dedup, refetch y caché unificados; el loader solo hace `ensureQueryData`.
- **Admin layout `ssr:false`**: la sesión Supabase es client-only.

## Pendiente (post-MVP)

- CRUD UI completo para platos, categorías, promos, horarios, redes.
- Editor visual de tema con preview en vivo.
- Supabase Storage para imágenes (flag `productImages`).
- Carrito, WhatsApp order, reservas, reviews (stubs en `features/`).
- i18n cuando se active `multiLanguage`.
- Server routes para `sitemap.xml` y `robots.txt`.
