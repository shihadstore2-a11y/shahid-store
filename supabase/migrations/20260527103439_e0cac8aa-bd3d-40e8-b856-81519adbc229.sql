
CREATE OR REPLACE FUNCTION public.check_inventory_duplicates(
  _provider public.subscription_provider,
  _usernames text[]
)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(username), ARRAY[]::text[])
  FROM public.subscription_inventory
  WHERE provider = _provider
    AND username = ANY(_usernames);
$$;

REVOKE ALL ON FUNCTION public.check_inventory_duplicates(public.subscription_provider, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_inventory_duplicates(public.subscription_provider, text[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.bulk_insert_inventory(_items jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _inserted int := 0;
  _failed int := 0;
  _errors jsonb := '[]'::jsonb;
  _item jsonb;
BEGIN
  IF NOT public.can_modify_data(auth.uid()) THEN
    RAISE EXCEPTION 'permission_denied' USING ERRCODE = '42501';
  END IF;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    BEGIN
      INSERT INTO public.subscription_inventory (
        provider, username, password, url, extra_info,
        duration_months, expires_at, cogs, cogs_currency, notes, status
      ) VALUES (
        (_item->>'provider')::public.subscription_provider,
        _item->>'username',
        _item->>'password',
        NULLIF(_item->>'url', ''),
        CASE WHEN _item ? 'extra_info' AND _item->'extra_info' <> 'null'::jsonb THEN _item->'extra_info' ELSE NULL END,
        (_item->>'duration_months')::int,
        NULLIF(_item->>'expires_at', '')::timestamptz,
        NULLIF(_item->>'cogs', '')::numeric,
        COALESCE(NULLIF(_item->>'cogs_currency', ''), 'SAR'),
        NULLIF(_item->>'notes', ''),
        'available'
      );
      _inserted := _inserted + 1;
    EXCEPTION WHEN OTHERS THEN
      _failed := _failed + 1;
      _errors := _errors || jsonb_build_object(
        'username', _item->>'username',
        'error', SQLERRM
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'inserted', _inserted,
    'failed', _failed,
    'errors', _errors
  );
END;
$$;

REVOKE ALL ON FUNCTION public.bulk_insert_inventory(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bulk_insert_inventory(jsonb) TO authenticated;
