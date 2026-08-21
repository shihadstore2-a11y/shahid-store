-- ════════════════════════════════════════════════
-- Phase F.2 — claim_orders_by_email RPC
-- ════════════════════════════════════════════════

-- Step 1: Function
CREATE OR REPLACE FUNCTION public.claim_orders_by_email(_email text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected int;
  caller_uid uuid;
BEGIN
  caller_uid := auth.uid();

  IF caller_uid IS NULL THEN
    RETURN 0;
  END IF;

  IF _email IS NULL OR trim(_email) = '' THEN
    RETURN 0;
  END IF;

  UPDATE public.orders
    SET user_id = caller_uid,
        updated_at = NOW()
    WHERE user_id IS NULL
      AND lower(trim(customer_email)) = lower(trim(_email));

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

-- Step 2: Permissions
REVOKE ALL ON FUNCTION public.claim_orders_by_email(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_orders_by_email(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.claim_orders_by_email(text) TO authenticated;

-- Step 3: Partial functional index
CREATE INDEX IF NOT EXISTS idx_orders_customer_email_lower
  ON public.orders (lower(customer_email))
  WHERE customer_email IS NOT NULL;

-- Step 4: Documentation
COMMENT ON FUNCTION public.claim_orders_by_email(text) IS
'Links orphan orders (user_id IS NULL) to authenticated user via case-insensitive email matching. Returns count of linked orders. Called from useAuth onAuthStateChange (Phase F.5).';

-- Step 5: Safety assertions
DO $$
DECLARE
  v_acl text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'claim_orders_by_email'
      AND pronamespace = 'public'::regnamespace
  ) THEN
    RAISE EXCEPTION 'F.2 FAILED: function not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_orders_customer_email_lower'
  ) THEN
    RAISE EXCEPTION 'F.2 FAILED: index not created';
  END IF;

  SELECT array_to_string(proacl, ', ') INTO v_acl
  FROM pg_proc
  WHERE proname = 'claim_orders_by_email'
    AND pronamespace = 'public'::regnamespace;

  IF v_acl LIKE '%anon=%' THEN
    RAISE EXCEPTION 'F.2 FAILED: anon still has access (acl=%)', v_acl;
  END IF;

  IF v_acl NOT LIKE '%authenticated=%' THEN
    RAISE EXCEPTION 'F.2 FAILED: authenticated missing EXECUTE (acl=%)', v_acl;
  END IF;

  RAISE NOTICE 'F.2 OK — claim_orders_by_email + index + permissions verified';
END$$;