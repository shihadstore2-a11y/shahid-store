CREATE OR REPLACE FUNCTION public.get_user_id_by_email(_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM auth.users WHERE lower(email) = lower(trim(_email)) LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.get_user_id_by_email(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email(text) FROM authenticated;

COMMENT ON FUNCTION public.get_user_id_by_email(text) IS
'Lookup user_id from auth.users by email (case-insensitive). Called from edfapay-webhook only via service_role. REVOKE from anon+authenticated for security.';

DO $$
DECLARE v_acl text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'get_user_id_by_email'
      AND pronamespace = 'public'::regnamespace
  ) THEN
    RAISE EXCEPTION 'F.3 Step 0 FAILED: function not created';
  END IF;

  SELECT array_to_string(proacl, ', ') INTO v_acl
  FROM pg_proc
  WHERE proname = 'get_user_id_by_email'
    AND pronamespace = 'public'::regnamespace;

  IF v_acl LIKE '%anon=%' THEN
    RAISE EXCEPTION 'F.3 Step 0 FAILED: anon has access (acl=%)', v_acl;
  END IF;

  IF v_acl LIKE '%authenticated=%' THEN
    RAISE EXCEPTION 'F.3 Step 0 FAILED: authenticated has access (acl=%)', v_acl;
  END IF;

  RAISE NOTICE 'F.3 Step 0 OK — get_user_id_by_email created (service_role only)';
END$$;