-- ════════════════════════════════════════════════
-- 📦 Phase B.4 — DROP product_durations (legacy)
-- 🔒 Phase B.3 — REVOKE anon from claim_orders_by_phone
-- ════════════════════════════════════════════════
-- Date: 23 May 2026
-- Pre-conditions verified:
--   ✅ 0 rows in product_durations
--   ✅ Only FK is self-outgoing → products(id) (auto-dropped)
--   ✅ Code references removed (queries.ts + types.ts)
--   ✅ claim_orders_by_phone requires auth.uid() anyway
-- ════════════════════════════════════════════════

-- B.4b: DROP legacy table
DROP TABLE IF EXISTS public.product_durations;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'product_durations'
  ) THEN
    RAISE EXCEPTION 'B.4 FAILED: table still exists';
  END IF;
  RAISE NOTICE 'B.4 OK — product_durations dropped successfully';
END$$;

-- B.3: REVOKE anon EXECUTE on claim_orders_by_phone
REVOKE EXECUTE ON FUNCTION public.claim_orders_by_phone(text) FROM anon;

DO $$
DECLARE
  v_acl TEXT;
BEGIN
  SELECT COALESCE(array_to_string(proacl, ', '), '<default>') INTO v_acl
  FROM pg_proc
  WHERE proname = 'claim_orders_by_phone'
    AND pronamespace = 'public'::regnamespace;

  IF v_acl LIKE '%anon=%' THEN
    RAISE EXCEPTION 'B.3 FAILED: anon still present in ACL: %', v_acl;
  END IF;

  RAISE NOTICE 'B.3 OK — anon access revoked. Final ACL: %', v_acl;
END$$;