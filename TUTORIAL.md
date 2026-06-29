# Tutorial: Cómo poblar la base de datos de CartaSI

Guía completa para agregar datos de un restaurante a la aplicación.

---

## 1. Arquitectura de la app

CartaSI es una aplicación **multi-tenant** construida con:

- **TanStack Start** (React 19 + Vite) — framework full-stack con SSR
- **Supabase** — base de datos PostgreSQL + auth + Row Level Security
- **Tailwind CSS v4** — estilos con design tokens en HSL

### Flujo de datos

```
Supabase (PostgreSQL)
  ↓
Server Functions (getRestaurantConfig, getMenu, etc.)
  ↓
TanStack Query (caché + suspense)
  ↓
Routes (orquestan) → Features (UI + lógica) → Shared (utilidades)
```

### Clave: el `slug`

Cada restaurante se identifica por un `slug` único (ej: `mi-restaurante`). La app está configurada en `src/shared/config.ts` para usar un slug específico:

```ts
export const ACTIVE_RESTAURANT_SLUG = "mi-restaurante";
```

**Importante**: El `slug` que insertes en la base de datos DEBE coincidir con este valor.

---

## 2. Tablas de la base de datos

### Diagrama de relaciones

```
restaurants (restaurante central)
  ├── restaurant_members (usuarios ↔ restaurantes)
  ├── feature_flags (1:1 toggles por restaurante)
  ├── categories (secciones del menú)
  │     └── menu_items (platos)
  │           └── menu_images (galería de fotos)
  ├── promotions (promociones)
  └── reservations (reservas de clientes)
```

### Enums

| Enum | Valores |
|---|---|
| `member_role` | `owner`, `admin`, `staff` |
| `app_role` | `owner`, `admin`, `staff` |
| `allergen` | `gluten`, `lactose`, `nuts`, `egg`, `fish`, `shellfish`, `soy`, `sesame`, `celery`, `mustard`, `sulphites`, `lupin`, `molluscs`, `peanuts` |

### Tabla `restaurants` (centro de todo)

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK automática |
| `slug` | TEXT | Identificador URL único (**debe coincidir con `config.ts`**) |
| `name` | TEXT | Nombre del restaurante |
| `tagline` | TEXT | Lema corto |
| `description` | TEXT | Descripción larga |
| `logo_url` | TEXT | URL del logo |
| `cover_url` | TEXT | URL de imagen de portada |
| `theme` | JSONB | Tokens de diseño (colores, fuentes, radio) |
| `locale` | TEXT | Idioma (default: `es`) |
| `currency` | TEXT | Moneda (default: `EUR`) |
| `address` | TEXT | Dirección física |
| `phone` | TEXT | Teléfono |
| `email` | TEXT | Email de contacto |
| `is_active` | BOOLEAN | Visibilidad (default: `true`) |

### Tabla `categories` (secciones del menú)

| Columna | Tipo | Descripción |
|---|---|---|
| `restaurant_id` | UUID | FK → restaurants |
| `name` | TEXT | Nombre (ej: "Entrantes") |
| `slug` | TEXT | Segmento URL (ej: "entrantes") |
| `position` | INT | Orden de aparición |
| `is_active` | BOOLEAN | Si está visible |

### Tabla `menu_items` (platos)

| Columna | Tipo | Descripción |
|---|---|---|
| `restaurant_id` | UUID | FK → restaurants |
| `category_id` | UUID | FK → categories |
| `slug` | TEXT | Segmento URL único |
| `name` | TEXT | Nombre del plato |
| `description` | TEXT | Descripción |
| `price_cents` | INT | **Precio en céntimos** (ej: 650 = 6,50 EUR) |
| `image_url` | TEXT | URL de imagen |
| `is_active` | BOOLEAN | Si está visible |
| `is_featured` | BOOLEAN | Si es destacado |
| `position` | INT | Orden dentro de la categoría |
| `allergens` | allergen[] | Array de alérgenos |
| `calories` | INT | Calorías |
| `tags` | TEXT[] | Etiquetas libres |

### Otras tablas

| Tabla | Descripción |
|---|---|
| `restaurant_members` | Vincula usuarios auth al restaurante con un rol |
| `feature_flags` | 20 toggles de funcionalidades por restaurante |
| `promotions` | Banners promocionales con fechas |
| `reservations` | Reservas de clientes (anon puede INSERT) |

> **Nota**: `opening_hours`, `social_links` y `reviews` fueron eliminados del schema. Se manejan estáticamente via `features.json`.

---

## 3. Prerrequisitos

1. **Supabase Dashboard**: Abre tu proyecto en [supabase.com](https://supabase.com)
2. **SQL Editor**: Ve a SQL Editor en el dashboard de Supabase
3. **Usuario autenticado**: Necesitas haber hecho login al menos una vez en la app para que tu UUID exista en `auth.users`

---

## 4. Paso 1: Crear el restaurante

Abre el SQL Editor de Supabase y ejecuta:

```sql
INSERT INTO public.restaurants (
  slug, name, tagline, description, locale, currency, address, phone, email
) VALUES (
  'mi-restaurante',
  'Mi Restaurante',
  'Cocina italiana de autor',
  'Una experiencia gastronómica única donde la tradición italiana se encuentra con la innovación contemporánea.',
  'es',
  'EUR',
  'Calle Principal 123, Madrid',
  '+34 912 345 678',
  'info@labellatavola.es'
)
ON CONFLICT (slug) DO NOTHING;
```

> **Nota**: `ON CONFLICT DO NOTHING` evita errores si el restaurante ya existe.

---

## 5. Paso 2: Crear tu usuario admin

### 5.1 Obtén tu UUID de auth

Ve a **Authentication → Users** en el dashboard de Supabase. Copia el UUID de tu usuario.

### 5.2 Crea la membresía

Reemplaza `<TU-UUID>` con tu UUID real:

```sql
INSERT INTO public.restaurant_members (restaurant_id, user_id, role)
SELECT id, '<TU-UUID>'::uuid, 'owner'::member_role
FROM public.restaurants
WHERE slug = 'mi-restaurante'
ON CONFLICT (restaurant_id, user_id) DO NOTHING;
```

> **Por qué `owner`?** Solo `owner` y `admin` pueden gestionar feature flags, categorías y membresías. `staff` solo puede editar platos.

---

## 6. Paso 3: Feature Flags (ya configurados)

La migración 3 ya configuró los flags para `mi-restaurante`. Si necesitas recrearlos:

```sql
INSERT INTO public.feature_flags (restaurant_id, flags)
SELECT id, '{
  "chatbot": true,
  "cart": true,
  "minigame": false,
  "reservations": true,
  "loyaltyProgram": true,
  "menuFilters": true,
  "allergenInfo": true,
  "calorieInfo": true,
  "multiLanguage": true,
  "qrMenu": true,
  "tableOrdering": false,
  "deliveryTracking": false,
  "gallery": true,
  "whatsappOrder": true,
  "promotions": true,
  "staffPicker": true,
  "adminPanel": true,
  "productImages": true,
  "banner": true,
  "search": true
}'::jsonb
FROM public.restaurants
WHERE slug = 'mi-restaurante'
ON CONFLICT (restaurant_id) DO NOTHING;
```

> **Nota**: `reviews`, `socialLinks` y `openingHours` ya no se almacenan en `feature_flags`; se gestionan estáticamente via `features.json`.

---

## 7. Paso 4: Acceder al panel admin

1. Ejecuta la app: `bun dev`
2. Ve a `http://localhost:3000`
3. Haz click en "Iniciar sesión" (Google OAuth)
4. Una vez autenticado, ve a `/admin`
5. Verás el dashboard con tarjetas de navegación

### Rutas del admin

| Ruta | Función |
|---|---|
| `/admin` | Dashboard principal |
| `/admin/flags` | Gestionar feature flags |
| `/admin/menu` | Gestionar platos (placeholder) |
| `/admin/categories` | Gestionar categorías (placeholder) |
| `/admin/theme` | Editor de tema (placeholder) |

---

## 8. Paso 5: Agregar categorías del menú

```sql
-- Helper para obtener el restaurant_id
DO $$
DECLARE
  v_restaurant_id UUID;
BEGIN
  SELECT id INTO v_restaurant_id FROM public.restaurants WHERE slug = 'mi-restaurante';

  INSERT INTO public.categories (restaurant_id, name, slug, position) VALUES
    (v_restaurant_id, 'Entrantes', 'entrantes', 1),
    (v_restaurant_id, 'Principales', 'principales', 2),
    (v_restaurant_id, 'Pizzas', 'pizzas', 3),
    (v_restaurant_id, 'Pastas', 'pastas', 4),
    (v_restaurant_id, 'Postres', 'postres', 5),
    (v_restaurant_id, 'Bebidas', 'bebidas', 6)
  ON CONFLICT (restaurant_id, slug) DO NOTHING;
END $$;
```

---

## 9. Paso 6: Agregar platos del menú

```sql
DO $$
DECLARE
  v_restaurant_id UUID;
  v_entrantes_id UUID;
  v_principales_id UUID;
  v_pizzas_id UUID;
  v_pastas_id UUID;
  v_postres_id UUID;
  v_bebidas_id UUID;
BEGIN
  SELECT id INTO v_restaurant_id FROM public.restaurants WHERE slug = 'mi-restaurante';
  SELECT id INTO v_entrantes_id FROM public.categories WHERE slug = 'entrantes' AND restaurant_id = v_restaurant_id;
  SELECT id INTO v_principales_id FROM public.categories WHERE slug = 'principales' AND restaurant_id = v_restaurant_id;
  SELECT id INTO v_pizzas_id FROM public.categories WHERE slug = 'pizzas' AND restaurant_id = v_restaurant_id;
  SELECT id INTO v_pastas_id FROM public.categories WHERE slug = 'pastas' AND restaurant_id = v_restaurant_id;
  SELECT id INTO v_postres_id FROM public.categories WHERE slug = 'postres' AND restaurant_id = v_restaurant_id;
  SELECT id INTO v_bebidas_id FROM public.categories WHERE slug = 'bebidas' AND restaurant_id = v_restaurant_id;

  -- Entrantes
  INSERT INTO public.menu_items (restaurant_id, category_id, slug, name, description, price_cents, allergens, calories, position) VALUES
    (v_restaurant_id, v_entrantes_id, 'bruschetta-classica', 'Bruschetta Clásica', 'Pan tostado con tomate, albahaca y aceite de oliva virgen extra', 650, ARRAY['gluten']::allergen[], 280, 1),
    (v_restaurant_id, v_entrantes_id, 'caprese', 'Caprese de Burrata', 'Burrata cremosa con tomate cherry y pesto genovés', 950, ARRAY['lactose']::allergen[], 350, 2),
    (v_restaurant_id, v_entrantes_id, 'arancini', 'Arancini di Riso', 'Croquetas de arroz rellenas de ragú y mozzarella, 4 unidades', 850, ARRAY['gluten', 'lactose', 'egg']::allergen[], 420, 3)
  ON CONFLICT (restaurant_id, slug) DO NOTHING;

  -- Principales
  INSERT INTO public.menu_items (restaurant_id, category_id, slug, name, description, price_cents, allergens, calories, position) VALUES
    (v_restaurant_id, v_principales_id, 'ossobuco', 'Ossobuco alla Milanese', 'Jarrete de ternera cocido a fuego lento con gremolata y risotto', 2400, ARRAY['celery']::allergen[], 680, 1),
    (v_restaurant_id, v_principales_id, 'branzino', 'Branzino al Forno', 'Lubina entera al horno con patatas, tomates cherry y hierbas provenzales', 2200, ARRAY['fish']::allergen[], 520, 2)
  ON CONFLICT (restaurant_id, slug) DO NOTHING;

  -- Pizzas
  INSERT INTO public.menu_items (restaurant_id, category_id, slug, name, description, price_cents, allergens, calories, position) VALUES
    (v_restaurant_id, v_pizzas_id, 'pizza-margherita', 'Margherita', 'Salsa de tomate San Marzano, mozzarella di bufala, albahaca fresca', 1100, ARRAY['gluten', 'lactose']::allergen[], 650, 1),
    (v_restaurant_id, v_pizzas_id, 'pizza-quattro-formaggi', 'Quattro Formaggi', 'Mozzarella, gorgonzola, parmesano, fontina con miel de trufa', 1400, ARRAY['gluten', 'lactose']::allergen[], 780, 2),
    (v_restaurant_id, v_pizzas_id, 'pizza-prosciutto-rucola', 'Prosciutto e Rula', 'Jamón parmesano, rúcula fresca, parmesano y reducción de balsámico', 1350, ARRAY['gluten', 'lactose']::allergen[], 720, 3)
  ON CONFLICT (restaurant_id, slug) DO NOTHING;

  -- Pastas
  INSERT INTO public.menu_items (restaurant_id, category_id, slug, name, description, price_cents, allergens, calories, position) VALUES
    (v_restaurant_id, v_pastas_id, 'tagliatelle-ragu', 'Tagliatelle al Ragú', 'Pasta fresca hecha a mano con ragú de ternera boloñesa tradicional', 1350, ARRAY['gluten', 'egg']::allergen[], 620, 1),
    (v_restaurant_id, v_pastas_id, 'cacio-pepe', 'Cacio e Pepe', 'Tonnarelli con pecorino romano y pimienta negra recién molida', 1200, ARRAY['gluten', 'lactose']::allergen[], 580, 2),
    (v_restaurant_id, v_pastas_id, 'lasagna', 'Lasagna della Nonna', 'Lasaña tradicional con ragú, bechamel y mozzarella', 1450, ARRAY['gluten', 'lactose', 'egg']::allergen[], 750, 3)
  ON CONFLICT (restaurant_id, slug) DO NOTHING;

  -- Postres
  INSERT INTO public.menu_items (restaurant_id, category_id, slug, name, description, price_cents, allergens, calories, position) VALUES
    (v_restaurant_id, v_postres_id, 'tiramisu', 'Tiramisú Classico', 'Bizcochos de café, crema de mascarpone y cacao amargo', 750, ARRAY['gluten', 'lactose', 'egg']::allergen[], 420, 1),
    (v_restaurant_id, v_postres_id, 'panna-cotta', 'Panna Cotta', 'Nata cuajada con coulis de frutos rojos y menta fresca', 680, ARRAY['lactose']::allergen[], 350, 2),
    (v_restaurant_id, v_postres_id, 'cannoli', 'Cannoli Siciliani', 'Crujientes rellenos de ricotta dulce con pistachios, 2 unidades', 720, ARRAY['gluten', 'lactose', 'nuts']::allergen[], 380, 3)
  ON CONFLICT (restaurant_id, slug) DO NOTHING;

  -- Bebidas
  INSERT INTO public.menu_items (restaurant_id, category_id, slug, name, description, price_cents, calories, position) VALUES
    (v_restaurant_id, v_bebidas_id, 'acqua-minerale', 'Agua Mineral', 'San Pellegrino 75cl', 300, 0, 1),
    (v_restaurant_id, v_bebidas_id, 'vino-rosso', 'Vino Rosso della Casa', 'Bottle of Montepulciano d'Abruzzo 75cl', 1800, 0, 2),
    (v_restaurant_id, v_bebidas_id, 'espresso', 'Espresso Italiano', 'Café espresso doble, taza pequeña', 200, 5, 3)
  ON CONFLICT (restaurant_id, slug) DO NOTHING;
END $$;
```

---

## 10. Paso 7: Promociones

```sql
DO $$
DECLARE
  v_restaurant_id UUID;
BEGIN
  SELECT id INTO v_restaurant_id FROM public.restaurants WHERE slug = 'mi-restaurante';

  INSERT INTO public.promotions (restaurant_id, title, body, cta_label, cta_url, starts_at, ends_at, position) VALUES
    (v_restaurant_id, 'Menú del Día', 'Consulta nuestro menú del día de lunes a viernes por solo 15€', 'Ver menú', '/#menu', now(), now() + interval '30 days', 1),
    (v_restaurant_id, 'Noche de Pizzas', 'Todas las pizzas a precio especial los miércoles por la noche', 'Reservar', '/reservar', now(), now() + interval '60 days', 2)
  ON CONFLICT DO NOTHING;
END $$;
```

---

## 11. Paso 8: Verificar en el home

1. Abre `http://localhost:3000`
2. Verás:
   - Header con nombre del restaurante
   - Sección de menú organizada por categorías
   - Promociones destacadas
   - Footer con información de contacto

---

## Referencia rápida de SQL

### Leer datos

```sql
-- Verificar restaurante
SELECT * FROM public.restaurants WHERE slug = 'mi-restaurante';

-- Ver menú completo con categorías
SELECT c.name AS categoria, m.name AS plato, m.price_cents / 100.0 AS precio_eur
FROM public.menu_items m
JOIN public.categories c ON c.id = m.category_id
WHERE m.restaurant_id = (SELECT id FROM public.restaurants WHERE slug = 'mi-restaurante')
ORDER BY c.position, m.position;

-- Ver miembros
SELECT rm.role, u.email
FROM public.restaurant_members rm
JOIN auth.users u ON u.id = rm.user_id
WHERE rm.restaurant_id = (SELECT id FROM public.restaurants WHERE slug = 'mi-restaurante');
```

### Actualizar datos

```sql
-- Cambiar nombre del restaurante
UPDATE public.restaurants
SET name = 'Mi Restaurante - Nuevo Nombre'
WHERE slug = 'mi-restaurante';

-- Desactivar un plato
UPDATE public.menu_items
SET is_active = false
WHERE slug = 'bruschetta-classica'
  AND restaurant_id = (SELECT id FROM public.restaurants WHERE slug = 'mi-restaurante');

-- Cambiar precio (12.50€ = 1250 céntimos)
UPDATE public.menu_items
SET price_cents = 1250
WHERE slug = 'pizza-margherita'
  AND restaurant_id = (SELECT id FROM public.restaurants WHERE slug = 'mi-restaurante');
```

### Eliminar datos

```sql
-- Eliminar un plato
DELETE FROM public.menu_items
WHERE slug = 'bruschetta-classica'
  AND restaurant_id = (SELECT id FROM public.restaurants WHERE slug = 'mi-restaurante');

-- Eliminar una categoría (los platos asociados se desvinculan por SET NULL)
DELETE FROM public.categories
WHERE slug = 'bebidas'
  AND restaurant_id = (SELECT id FROM public.restaurants WHERE slug = 'mi-restaurante');
```

---

## Troubleshooting

| Problema | Solución |
|---|---|
| La home no muestra datos | Verifica que el `slug` en la DB coincide con `ACTIVE_RESTAURANT_SLUG` en `src/shared/config.ts` |
| No puedo acceder a `/admin` | Asegúrate de tener un registro en `restaurant_members` con rol `owner` o `admin` |
| Error de RLS al insertar | Usa el SQL Editor de Supabase (service_role) o asegúrate de estar autenticado |
| Los precios aparecen mal | Los precios se almacenan en **céntimos**: `650` = `6.50€` |
| Un plato no aparece | Verifica `is_active = true` en `menu_items` |

---

## Archivos clave del código

| Archivo | Función |
|---|---|
| `src/shared/config.ts` | Slug del restaurante activo |
| `supabase/migrations/*.sql` | Esquema de la base de datos |
| `src/features/menu/` | Componentes y server functions del menú |
| `src/features/flags/` | Sistema de feature flags |
| `src/features/theme/` | Theming runtime |
| `src/routes/__root.tsx` | Loader que carga config del restaurante |
| `src/routes/index.tsx` | Home page (renderiza menú, promos, etc.) |
| `src/routes/_authenticated/admin/` | Rutas del panel admin |
