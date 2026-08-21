CREATE OR REPLACE FUNCTION public.check_stock_available(
  _slug text,
  _duration int
)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _product RECORD;
  _providers subscription_provider[];
  _count int;
  _bundle_falcon_count int;
  _bundle_hulk_count int;
BEGIN
  SELECT * INTO _product FROM public.products WHERE slug = _slug LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('available', false, 'reason', 'product_not_found');
  END IF;

  IF NOT _product.stock_management_enabled THEN
    RETURN jsonb_build_object('available', true, 'reason', 'stock_management_disabled');
  END IF;

  _providers := get_providers_from_slug(_slug);

  IF array_length(_providers, 1) IS NULL THEN
    RETURN jsonb_build_object('available', false, 'reason', 'unknown_slug');
  END IF;

  IF _slug = 'bundle-falcon-hulk-1y' THEN
    SELECT COUNT(*) INTO _bundle_falcon_count
      FROM public.subscription_inventory
      WHERE provider = 'falcon' AND duration_months = _duration AND status = 'available';

    SELECT COUNT(*) INTO _bundle_hulk_count
      FROM public.subscription_inventory
      WHERE provider = 'hulk' AND duration_months = _duration AND status = 'available';

    RETURN jsonb_build_object(
      'available', _bundle_falcon_count > 0 AND _bundle_hulk_count > 0,
      'falcon_count', _bundle_falcon_count,
      'hulk_count', _bundle_hulk_count,
      'is_bundle', true
    );
  END IF;

  SELECT COUNT(*) INTO _count
    FROM public.subscription_inventory
    WHERE provider = _providers[1]
      AND duration_months = _duration
      AND status = 'available';

  RETURN jsonb_build_object(
    'available', _count > 0,
    'count', _count,
    'provider', _providers[1]
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('available', true, 'reason', 'rpc_error', 'error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION public.check_stock_available(text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_stock_available(text, int) TO authenticated, anon;

COMMENT ON FUNCTION public.check_stock_available(text, int) IS
  'D.3 (27 May 2026): Check subscription stock availability for product+duration. Returns {available: bool, ...}. Bundle requires both providers. Graceful fallback to available=true on error (customer-friendly).';