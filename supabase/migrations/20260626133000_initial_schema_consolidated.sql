-- CartaSI initial schema (consolidated)
-- No seed data. No opening_hours, social_links, or reviews tables.

-- ============ SCHEMA PERMISSIONS ============
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'staff', 'super_admin');
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
CREATE POLICY "restaurants auth read active" ON public.restaurants FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "restaurants super admin all" ON public.restaurants
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

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

CREATE OR REPLACE FUNCTION public.is_member_of(_restaurant_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.restaurant_members rm
    JOIN public.restaurants r ON r.id = rm.restaurant_id
    WHERE rm.restaurant_id = _restaurant_id
      AND rm.user_id = auth.uid()
      AND r.is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_member_with_role(_restaurant_id UUID, _roles public.member_role[])
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.restaurant_members rm
    JOIN public.restaurants r ON r.id = rm.restaurant_id
    WHERE rm.restaurant_id = _restaurant_id
      AND rm.user_id = auth.uid()
      AND rm.role = ANY(_roles)
      AND r.is_active = true
  )
$$;

CREATE POLICY "members super admin read" ON public.restaurant_members
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR user_id = auth.uid());
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
CREATE POLICY "flags super admin write" ON public.feature_flags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

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
CREATE POLICY "reservations public insert" ON public.reservations FOR INSERT TO anon
  WITH CHECK (
    party_size BETWEEN 1 AND 30
    AND slot_at > now()
    AND length(name) BETWEEN 1 AND 120
  );
CREATE POLICY "reservations members read" ON public.reservations FOR SELECT TO authenticated USING (public.is_member_of(restaurant_id));
CREATE POLICY "reservations members write" ON public.reservations FOR ALL TO authenticated
  USING (public.is_member_with_role(restaurant_id, ARRAY['owner','admin','staff']::public.member_role[]))
  WITH CHECK (public.is_member_with_role(restaurant_id, ARRAY['owner','admin','staff']::public.member_role[]));

-- ============ restaurant_invitations ============
CREATE TABLE public.restaurant_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.member_role NOT NULL DEFAULT 'owner',
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, email)
);
CREATE INDEX idx_restaurant_invitations_token ON public.restaurant_invitations(token);
CREATE INDEX idx_restaurant_invitations_email ON public.restaurant_invitations(email);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_invitations TO authenticated;
GRANT ALL ON public.restaurant_invitations TO service_role;
ALTER TABLE public.restaurant_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invitations super admin all" ON public.restaurant_invitations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- ============ helper functions ============
CREATE OR REPLACE FUNCTION public.user_owns_restaurant(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.restaurant_members
    WHERE user_id = _user_id AND role = 'owner'
  )
$$;

CREATE OR REPLACE FUNCTION public.user_exists_by_email(_email TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE email = _email)
$$;

CREATE OR REPLACE FUNCTION public.email_owns_restaurant(_email TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.restaurant_members rm
    JOIN auth.users u ON u.id = rm.user_id
    WHERE u.email = _email AND rm.role = 'owner'
  )
$$;

CREATE OR REPLACE FUNCTION public.get_restaurant_members_with_email(_restaurant_id UUID)
RETURNS TABLE(id UUID, user_id UUID, email TEXT, role public.member_role, created_at TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT rm.id, rm.user_id, u.email, rm.role, rm.created_at
  FROM public.restaurant_members rm
  JOIN auth.users u ON u.id = rm.user_id
  WHERE rm.restaurant_id = _restaurant_id
  ORDER BY rm.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token UUID)
RETURNS TABLE(id UUID, restaurant_id UUID, email TEXT, role public.member_role, accepted_at TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT i.id, i.restaurant_id, i.email, i.role, i.accepted_at
  FROM public.restaurant_invitations i
  WHERE i.token = _token;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_invitations()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv RECORD;
BEGIN
  SELECT * INTO inv
  FROM public.restaurant_invitations
  WHERE email = NEW.email AND accepted_at IS NULL
  ORDER BY created_at ASC
  LIMIT 1;

  IF FOUND THEN
    IF inv.role = 'owner' AND public.user_owns_restaurant(NEW.id) THEN
      RETURN NEW;
    END IF;

    INSERT INTO public.restaurant_members (restaurant_id, user_id, role)
    VALUES (inv.restaurant_id, NEW.id, inv.role)
    ON CONFLICT (restaurant_id, user_id) DO UPDATE SET role = EXCLUDED.role;

    UPDATE public.restaurant_invitations
    SET accepted_at = now()
    WHERE id = inv.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auth_users_invitation ON auth.users;
CREATE TRIGGER trg_auth_users_invitation
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_invitations();

-- Restrict SECURITY DEFINER helpers: only authenticated callers
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_member_of(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_member_with_role(uuid, public.member_role[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_member_of(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_member_with_role(uuid, public.member_role[]) TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.user_owns_restaurant(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_exists_by_email(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.email_owns_restaurant(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_restaurant_members_with_email(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(uuid) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.user_owns_restaurant(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_exists_by_email(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.email_owns_restaurant(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_restaurant_members_with_email(uuid) FROM PUBLIC, anon;
