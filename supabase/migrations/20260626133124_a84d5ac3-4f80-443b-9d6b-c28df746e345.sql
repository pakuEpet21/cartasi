
-- Restrict SECURITY DEFINER helpers: only authenticated callers (RLS still applies via wrappers)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_member_of(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_member_with_role(uuid, public.member_role[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_member_of(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_member_with_role(uuid, public.member_role[]) TO authenticated, service_role;

-- Tighten public insert policies with minimal sanity checks
DROP POLICY IF EXISTS "reservations public insert" ON public.reservations;
CREATE POLICY "reservations public insert" ON public.reservations
  FOR INSERT TO anon
  WITH CHECK (
    party_size BETWEEN 1 AND 30
    AND slot_at > now()
    AND length(name) BETWEEN 1 AND 120
  );

DROP POLICY IF EXISTS "reviews public insert" ON public.reviews;
CREATE POLICY "reviews public insert" ON public.reviews
  FOR INSERT TO anon
  WITH CHECK (
    rating BETWEEN 1 AND 5
    AND length(author) BETWEEN 1 AND 120
    AND (body IS NULL OR length(body) <= 2000)
    AND is_approved = false
  );
