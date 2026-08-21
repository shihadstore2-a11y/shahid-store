CREATE OR REPLACE FUNCTION public.get_providers_from_slug(_slug text)
RETURNS subscription_provider[]
LANGUAGE sql IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN _slug LIKE 'falcon-%' THEN ARRAY['falcon'::subscription_provider]
    WHEN _slug LIKE 'hulk-%' THEN ARRAY['hulk'::subscription_provider]
    WHEN _slug LIKE 'smarters-%' THEN ARRAY['smarters'::subscription_provider]
    WHEN _slug = 'bundle-falcon-hulk-1y' THEN
      ARRAY['falcon'::subscription_provider, 'hulk'::subscription_provider]
    ELSE ARRAY[]::subscription_provider[]
  END;
$$;

COMMENT ON FUNCTION public.get_providers_from_slug(text) IS
  'D.2 (27 May 2026): Maps product slug to provider array. Bundle returns 2 providers. Unknown/test slugs return empty array (graceful fallback).';

CREATE OR REPLACE FUNCTION public.claim_subscription_for_order(_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _order RECORD;
  _product RECORD;
  _providers subscription_provider[];
  _provider subscription_provider;
  _duration int;
  _slug text;
  _inv_falcon RECORD;
  _inv_hulk RECORD;
  _inv_single RECORD;
  _claimed_ids uuid[] := '{}';
  _is_bundle boolean;
BEGIN
  SELECT * INTO _order FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'order_not_found');
  END IF;
  IF _order.status <> 'paid' THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'order_not_paid', 'status', _order.status);
  END IF;
  IF _order.fulfilled_at IS NOT NULL THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'already_fulfilled');
  END IF;

  _slug := _order.items->0->>'product_slug';
  IF _slug IS NULL THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'no_product_slug');
  END IF;

  SELECT * INTO _product FROM public.products WHERE slug = _slug LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'product_not_found', 'slug', _slug);
  END IF;

  IF NOT _product.stock_management_enabled THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'stock_management_disabled');
  END IF;

  _providers := public.get_providers_from_slug(_slug);
  _duration := _product.duration_months;
  _is_bundle := _slug = 'bundle-falcon-hulk-1y';

  IF array_length(_providers, 1) IS NULL OR array_length(_providers, 1) = 0 THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'unknown_slug_mapping', 'slug', _slug);
  END IF;

  IF _is_bundle THEN
    SELECT * INTO _inv_falcon FROM public.subscription_inventory
      WHERE provider = 'falcon' AND duration_months = _duration AND status = 'available'
      ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('claimed', false, 'reason', 'no_falcon_stock', 'duration', _duration);
    END IF;

    SELECT * INTO _inv_hulk FROM public.subscription_inventory
      WHERE provider = 'hulk' AND duration_months = _duration AND status = 'available'
      ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('claimed', false, 'reason', 'no_hulk_stock', 'duration', _duration);
    END IF;

    UPDATE public.subscription_inventory
      SET status = 'claimed', claimed_order_id = _order_id, claimed_at = NOW(),
          claimed_role = 'primary', updated_at = NOW()
      WHERE id = _inv_falcon.id;

    UPDATE public.subscription_inventory
      SET status = 'claimed', claimed_order_id = _order_id, claimed_at = NOW(),
          claimed_role = 'backup', updated_at = NOW()
      WHERE id = _inv_hulk.id;

    _claimed_ids := ARRAY[_inv_falcon.id, _inv_hulk.id];

    UPDATE public.orders SET
      subscription_extra_info = jsonb_build_object(
        'bundle', true,
        'falcon', jsonb_build_object('username', _inv_falcon.username, 'password', _inv_falcon.password, 'url', _inv_falcon.url),
        'hulk', jsonb_build_object('username', _inv_hulk.username, 'password', _inv_hulk.password, 'url', _inv_hulk.url)
      ),
      fulfilled_at = NOW(), fulfilled_by = NULL, status = 'fulfilled',
      primary_subscription_id = _inv_falcon.id, backup_subscription_id = _inv_hulk.id,
      updated_at = NOW()
    WHERE id = _order_id;
  ELSE
    _provider := _providers[1];
    SELECT * INTO _inv_single FROM public.subscription_inventory
      WHERE provider = _provider AND duration_months = _duration AND status = 'available'
      ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('claimed', false, 'reason', 'no_stock', 'provider', _provider, 'duration', _duration);
    END IF;

    UPDATE public.subscription_inventory
      SET status = 'claimed', claimed_order_id = _order_id, claimed_at = NOW(),
          claimed_role = 'primary', updated_at = NOW()
      WHERE id = _inv_single.id;

    _claimed_ids := ARRAY[_inv_single.id];

    UPDATE public.orders SET
      subscription_username = _inv_single.username,
      subscription_password = _inv_single.password,
      subscription_url = _inv_single.url,
      subscription_extra_info = _inv_single.extra_info,
      fulfilled_at = NOW(), fulfilled_by = NULL, status = 'fulfilled',
      primary_subscription_id = _inv_single.id, updated_at = NOW()
    WHERE id = _order_id;
  END IF;

  INSERT INTO public.admin_audit_logs (action, entity_type, entity_id, admin_user_id, changes)
  VALUES ('auto_claim_subscription', 'order', _order_id, NULL,
    jsonb_build_object(
      'inventory_ids', to_jsonb(_claimed_ids),
      'is_bundle', _is_bundle,
      'providers', to_jsonb(_providers),
      'source', 'd2_auto_claim',
      'slug', _slug,
      'duration', _duration
    ));

  RETURN jsonb_build_object(
    'claimed', true, 'is_bundle', _is_bundle,
    'inventory_ids', to_jsonb(_claimed_ids),
    'providers', to_jsonb(_providers), 'slug', _slug
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'claimed', false, 'reason', 'rpc_exception',
    'error', SQLERRM, 'order_id', _order_id::text
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_subscription_for_order(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_subscription_for_order(uuid) TO service_role;

COMMENT ON FUNCTION public.claim_subscription_for_order(uuid) IS
  'D.2 (27 May 2026): Auto-claim subscription from inventory for paid order. Supports single + bundle (Falcon+Hulk). Race-safe via FOR UPDATE SKIP LOCKED. Non-blocking via EXCEPTION handler. Tracks claimed_role for primary/backup.';