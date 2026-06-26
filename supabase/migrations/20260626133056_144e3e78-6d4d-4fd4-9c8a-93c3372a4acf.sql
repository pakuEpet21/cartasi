
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'staff');
CREATE TYPE public.member_role AS ENUM ('owner', 'admin', 'staff');
CREATE TYPE public.allergen AS ENUM ('gluten','lactose','nuts','egg','fish','shellfish','soy','sesame','celery','mustard','sulphites','lupin','molluscs','peanuts');

-- ============ updated_at helper ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ============ user_roles ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "user_roles self read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ restaurants ============
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  locale TEXT NOT NULL DEFAULT 'es',
  currency TEXT NOT NULL DEFAULT 'EUR',
  address TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.restaurants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurants TO authenticated;
GRANT ALL ON public.restaurants TO service_role;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_restaurants_updated BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "restaurants public read active" ON public.restaurants FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "restaurants auth read" ON public.restaurants FOR SELECT TO authenticated USING (true);

-- ============ restaurant_members ============
CREATE TABLE public.restaurant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.member_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_members TO authenticated;
GRANT ALL ON public.restaurant_members TO service_role;
ALTER TABLE public.restaurant_members ENABLE ROW LEVEL SECURITY;

-- security definer to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.is_member_of(_restaurant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.restaurant_members
    WHERE restaurant_id = _restaurant_id AND user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.is_member_with_role(_restaurant_id UUID, _roles public.member_role[])
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.restaurant_members
    WHERE restaurant_id = _restaurant_id
      AND user_id = auth.uid()
      AND role = ANY(_roles)
  )
$$;

CREATE POLICY "members read own" ON public.restaurant_members FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_member_of(restaurant_id));
CREATE POLICY "members owner manage" ON public.restaurant_members FOR ALL TO authenticated
  USING (public.is_member_with_role(restaurant_id, ARRAY['owner']::public.member_role[]))
  WITH CHECK (public.is_member_with_role(restaurant_id, ARRAY['owner']::public.member_role[]));

-- ============ feature_flags ============
CREATE TABLE public.feature_flags (
  restaurant_id UUID PRIMARY KEY REFERENCES public.restaurants(id) ON DELETE CASCADE,
  flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feature_flags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feature_flags TO authenticated;
GRANT ALL ON public.feature_flags TO service_role;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_flags_updated BEFORE UPDATE ON public.feature_flags FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "flags public read" ON public.feature_flags FOR SELECT TO anon USING (true);
CREATE POLICY "flags auth read" ON public.feature_flags FOR SELECT TO authenticated USING (true);
CREATE POLICY "flags members write" ON public.feature_flags FOR ALL TO authenticated
  USING (public.is_member_with_role(restaurant_id, ARRAY['owner','admin']::public.member_role[]))
  WITH CHECK (public.is_member_with_role(restaurant_id, ARRAY['owner','admin']::public.member_role[]));

-- ============ categories ============
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  position INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, slug)
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "categories public read active" ON public.categories FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "categories auth read" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "categories members write" ON public.categories FOR ALL TO authenticated
  USING (public.is_member_with_role(restaurant_id, ARRAY['owner','admin']::public.member_role[]))
  WITH CHECK (public.is_member_with_role(restaurant_id, ARRAY['owner','admin']::public.member_role[]));

-- ============ menu_items ============
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INT NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  position INT NOT NULL DEFAULT 0,
  allergens public.allergen[] NOT NULL DEFAULT '{}',
  calories INT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, slug)
);
GRANT SELECT ON public.menu_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_items_updated BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "items public read active" ON public.menu_items FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "items auth read" ON public.menu_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "items members write" ON public.menu_items FOR ALL TO authenticated
  USING (public.is_member_with_role(restaurant_id, ARRAY['owner','admin','staff']::public.member_role[]))
  WITH CHECK (public.is_member_with_role(restaurant_id, ARRAY['owner','admin','staff']::public.member_role[]));

-- ============ menu_images ============
CREATE TABLE public.menu_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  alt TEXT,
  position INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menu_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_images TO authenticated;
GRANT ALL ON public.menu_images TO service_role;
ALTER TABLE public.menu_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "images public read" ON public.menu_images FOR SELECT TO anon USING (true);
CREATE POLICY "images auth read" ON public.menu_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "images members write" ON public.menu_images FOR ALL TO authenticated
  USING (public.is_member_with_role(restaurant_id, ARRAY['owner','admin','staff']::public.member_role[]))
  WITH CHECK (public.is_member_with_role(restaurant_id, ARRAY['owner','admin','staff']::public.member_role[]));

-- ============ promotions ============
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  image_url TEXT,
  cta_label TEXT,
  cta_url TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.promotions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promotions TO authenticated;
GRANT ALL ON public.promotions TO service_role;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_promos_updated BEFORE UPDATE ON public.promotions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "promos public read active" ON public.promotions FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "promos auth read" ON public.promotions FOR SELECT TO authenticated USING (true);
CREATE POLICY "promos members write" ON public.promotions FOR ALL TO authenticated
  USING (public.is_member_with_role(restaurant_id, ARRAY['owner','admin']::public.member_role[]))
  WITH CHECK (public.is_member_with_role(restaurant_id, ARRAY['owner','admin']::public.member_role[]));

-- ============ opening_hours ============
CREATE TABLE public.opening_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  opens TIME,
  closes TIME,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.opening_hours TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opening_hours TO authenticated;
GRANT ALL ON public.opening_hours TO service_role;
ALTER TABLE public.opening_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hours public read" ON public.opening_hours FOR SELECT TO anon USING (true);
CREATE POLICY "hours auth read" ON public.opening_hours FOR SELECT TO authenticated USING (true);
CREATE POLICY "hours members write" ON public.opening_hours FOR ALL TO authenticated
  USING (public.is_member_with_role(restaurant_id, ARRAY['owner','admin']::public.member_role[]))
  WITH CHECK (public.is_member_with_role(restaurant_id, ARRAY['owner','admin']::public.member_role[]));

-- ============ social_links ============
CREATE TABLE public.social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.social_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_links TO authenticated;
GRANT ALL ON public.social_links TO service_role;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social public read" ON public.social_links FOR SELECT TO anon USING (true);
CREATE POLICY "social auth read" ON public.social_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "social members write" ON public.social_links FOR ALL TO authenticated
  USING (public.is_member_with_role(restaurant_id, ARRAY['owner','admin']::public.member_role[]))
  WITH CHECK (public.is_member_with_role(restaurant_id, ARRAY['owner','admin']::public.member_role[]));

-- ============ reservations ============
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  party_size INT NOT NULL,
  slot_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.reservations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations TO authenticated;
GRANT ALL ON public.reservations TO service_role;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reservations public insert" ON public.reservations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "reservations members read" ON public.reservations FOR SELECT TO authenticated USING (public.is_member_of(restaurant_id));
CREATE POLICY "reservations members write" ON public.reservations FOR ALL TO authenticated
  USING (public.is_member_with_role(restaurant_id, ARRAY['owner','admin','staff']::public.member_role[]))
  WITH CHECK (public.is_member_with_role(restaurant_id, ARRAY['owner','admin','staff']::public.member_role[]));

-- ============ reviews ============
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read approved" ON public.reviews FOR SELECT TO anon USING (is_approved = true);
CREATE POLICY "reviews public insert" ON public.reviews FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "reviews members read" ON public.reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "reviews members write" ON public.reviews FOR ALL TO authenticated
  USING (public.is_member_with_role(restaurant_id, ARRAY['owner','admin']::public.member_role[]))
  WITH CHECK (public.is_member_with_role(restaurant_id, ARRAY['owner','admin']::public.member_role[]));
