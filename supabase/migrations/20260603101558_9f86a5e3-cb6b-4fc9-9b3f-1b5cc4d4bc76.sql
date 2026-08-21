CREATE OR REPLACE FUNCTION public.bulk_insert_inventory(_items jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
        duration_months, device_limit, expires_at, cogs, cogs_currency, notes, status
      ) VALUES (
        (_item->>'provider')::public.subscription_provider,
        _item->>'username',
        _item->>'password',
        NULLIF(_item->>'url', ''),
        CASE WHEN _item ? 'extra_info' AND _item->'extra_info' <> 'null'::jsonb THEN _item->'extra_info' ELSE NULL END,
        (_item->>'duration_months')::int,
        COALESCE(NULLIF(_item->>'device_limit', '')::smallint, 1),
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
$function$;