-- PR 1: Database Foundation — super-admin-restaurantes
-- Extends app_role enum, creates restaurant_invitations table, helper functions,
-- trigger for auto-join on first OAuth login, tightens is_member_of helpers,
-- and adds RLS policies for super admin access.

-- ============ 1. Extend app_role enum with super_admin ============
-- 'super_admin' sorts after 'owner', 'admin', 'staff' (Postgres enum ordering)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- ============ 2. restaurant_invitations table ============
CREATE TABLE IF NOT EXISTS public.restaurant_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.member_role NOT NULL DEFAULT 'owner',
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_invitations_token ON public.restaurant_invitations(token);
CREATE INDEX IF NOT EXISTS idx_restaurant_invitations_email ON public.restaurant_invitations(email);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_invitations TO authenticated;
GRANT ALL ON public.restaurant_invitations TO service_role;
ALTER TABLE public.restaurant_invitations ENABLE ROW LEVEL SECURITY;

-- ============ 3. Helper: does this user already own any restaurant? ============
CREATE OR REPLACE FUNCTION public.user_owns_restaurant(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.restaurant_members
    WHERE user_id = _user_id AND role = 'owner'
  )
$$;

-- ============ 4. Helper: does an email already belong to an existing user? ============
CREATE OR REPLACE FUNCTION public.user_exists_by_email(_email TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE email = _email)
$$;

-- ============ 5. Helper: does an email already own a restaurant? ============
CREATE OR REPLACE FUNCTION public.email_owns_restaurant(_email TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.restaurant_members rm
    JOIN auth.users u ON u.id = rm.user_id
    WHERE u.email = _email AND rm.role = 'owner'
  )
$$;

-- ============ 6. Helper: list members of a restaurant with auth email (used by admin detail view) ============
CREATE OR REPLACE FUNCTION public.get_restaurant_members_with_email(_restaurant_id UUID)
RETURNS TABLE(id UUID, user_id UUID, email TEXT, role public.member_role, created_at TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT rm.id, rm.user_id, u.email, rm.role, rm.created_at
  FROM public.restaurant_members rm
  JOIN auth.users u ON u.id = rm.user_id
  WHERE rm.restaurant_id = _restaurant_id
  ORDER BY rm.created_at DESC;
$$;

-- ============ 7. Trigger: auto-associate new auth.users to pending invitation ============
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

-- ============ 8. Tighten is_member_of helpers to require restaurant is_active = true ============
-- This single change blocks member access to operational data when a restaurant is disabled.
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

-- ============ 9. Tighten restaurants RLS ============
-- Replace generic auth read policy with active-only + super_admin split
DROP POLICY IF EXISTS "restaurants auth read" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants public read active" ON public.restaurants;

CREATE POLICY "restaurants super admin all" ON public.restaurants
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "restaurants auth read active" ON public.restaurants
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "restaurants public read active" ON public.restaurants
  FOR SELECT TO anon
  USING (is_active = true);

-- ============ 10. Super admin can read members across all restaurants ============
DROP POLICY IF EXISTS "members read own" ON public.restaurant_members;
DROP POLICY IF EXISTS "members owner manage" ON public.restaurant_members;

CREATE POLICY "members super admin read" ON public.restaurant_members
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR user_id = auth.uid());

CREATE POLICY "members owner manage" ON public.restaurant_members
  FOR ALL TO authenticated
  USING (public.is_member_with_role(restaurant_id, ARRAY['owner']::public.member_role[]))
  WITH CHECK (public.is_member_with_role(restaurant_id, ARRAY['owner']::public.member_role[]));

-- ============ 11. Invitations fully gated to super admins ============
CREATE POLICY "invitations super admin all" ON public.restaurant_invitations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- ============ 12. Public helper: read a single invitation by token (used by acceptance page) ============
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token UUID)
RETURNS TABLE(id UUID, restaurant_id UUID, email TEXT, role public.member_role, accepted_at TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT i.id, i.restaurant_id, i.email, i.role, i.accepted_at
  FROM public.restaurant_invitations i
  WHERE i.token = _token;
$$;

-- ============ 13. Grants and revokes for new helpers ============
GRANT EXECUTE ON FUNCTION public.user_owns_restaurant(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_exists_by_email(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.email_owns_restaurant(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_restaurant_members_with_email(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(uuid) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.user_owns_restaurant(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_exists_by_email(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.email_owns_restaurant(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_restaurant_members_with_email(uuid) FROM PUBLIC, anon;