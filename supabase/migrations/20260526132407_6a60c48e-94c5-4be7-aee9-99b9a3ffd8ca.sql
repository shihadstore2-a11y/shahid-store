
-- A.3 Security Hardening — Fixes #1 + #2
BEGIN;

-- ═══════════════════════════════════════════════════════════
-- FIX 1: REVOKE get_user_id_by_email FROM anon + authenticated
-- (يمنع email enumeration. service_role يحتفظ بالصلاحية للـ webhooks)
-- ═══════════════════════════════════════════════════════════
REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email(text) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.get_user_id_by_email(text) TO service_role;

-- ═══════════════════════════════════════════════════════════
-- FIX 2: tighten orders_anon_insert — add user_id IS NULL
-- نُحافظ على كل القيود الموجودة + الدوار {anon, authenticated} كما كانت
-- ═══════════════════════════════════════════════════════════
DROP POLICY IF EXISTS orders_anon_insert ON public.orders;

CREATE POLICY orders_anon_insert
  ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id IS NULL                                       -- NEW: منع حقن user_id
    AND customer_name IS NOT NULL
    AND length(btrim(customer_name)) >= 2
    AND length(customer_name) <= 120
    AND customer_phone IS NOT NULL
    AND customer_phone ~ '^05[0-9]{8}$'
    AND total > 0
    AND total <= 10000
    AND jsonb_typeof(items) = 'array'
    AND jsonb_array_length(items) > 0
    AND jsonb_array_length(items) <= 20
    AND status = 'pending'
    AND payment_method = ANY (ARRAY['whatsapp'::text, 'card'::text])
  );

COMMIT;
