
ALTER FUNCTION public.touch_updated_at() SET search_path = public;

-- Revoke broad execute on security definer functions
REVOKE EXECUTE ON FUNCTION public.claim_orders_by_phone(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_orders_by_phone(TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_order_by_number(TEXT) FROM PUBLIC;
-- Keep anon access for order tracking page (only by knowledge of order number)
GRANT EXECUTE ON FUNCTION public.get_order_by_number(TEXT) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
