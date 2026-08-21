
-- J.1: shared normalization helper (single source of truth)
CREATE OR REPLACE FUNCTION public.normalize_phone_to_e164(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  cleaned text;
BEGIN
  IF input IS NULL OR btrim(input) = '' THEN
    RETURN NULL;
  END IF;

  cleaned := regexp_replace(input, '[\s\-+()]', '', 'g');

  IF cleaned ~ '^05[0-9]{8}$' THEN
    RETURN '+966' || substring(cleaned FROM 2);
  END IF;

  IF cleaned ~ '^5[0-9]{8}$' THEN
    RETURN '+966' || cleaned;
  END IF;

  IF cleaned ~ '^00[1-9][0-9]{6,14}$' THEN
    RETURN '+' || substring(cleaned FROM 3);
  END IF;

  IF cleaned ~ '^[1-9][0-9]{6,14}$' AND length(cleaned) >= 8 THEN
    RETURN '+' || cleaned;
  END IF;

  IF input ~ '^\+[1-9][0-9]{6,14}$' THEN
    RETURN input;
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.normalize_phone_to_e164(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.normalize_phone_to_e164(text) TO anon, authenticated;

-- J.1: Replace orders insert policy with dual-format regex (backward compatible)
DROP POLICY IF EXISTS orders_anon_insert ON public.orders;
CREATE POLICY orders_anon_insert ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    user_id IS NULL
    AND customer_name IS NOT NULL
    AND length(btrim(customer_name)) >= 2
    AND length(customer_name) <= 120
    AND customer_phone IS NOT NULL
    AND customer_phone ~ '^(\+[1-9][0-9]{6,14}|05[0-9]{8})$'
    AND total > 0 AND total <= 10000
    AND jsonb_typeof(items) = 'array'
    AND jsonb_array_length(items) BETWEEN 1 AND 20
    AND status = 'pending'
    AND payment_method = ANY (ARRAY['whatsapp','card'])
  );

-- J.1: get_email_by_phone — dual-format lookup (E.164 + legacy 05)
CREATE OR REPLACE FUNCTION public.get_email_by_phone(_phone text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH normalized AS (
    SELECT public.normalize_phone_to_e164(_phone) AS e164,
           CASE
             WHEN public.normalize_phone_to_e164(_phone) LIKE '+966%'
               THEN '0' || substring(public.normalize_phone_to_e164(_phone) FROM 5)
             ELSE NULL
           END AS legacy
  )
  SELECT p.email
  FROM public.profiles p, normalized n
  WHERE p.email IS NOT NULL
    AND (p.phone = n.e164 OR (n.legacy IS NOT NULL AND p.phone = n.legacy))
  LIMIT 1;
$$;

-- J.1: claim_orders_by_phone — dual-format match
CREATE OR REPLACE FUNCTION public.claim_orders_by_phone(_phone text)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
  _e164 text;
  _legacy text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN 0; END IF;

  _e164 := public.normalize_phone_to_e164(_phone);
  IF _e164 IS NULL THEN RETURN 0; END IF;

  _legacy := CASE
    WHEN _e164 LIKE '+966%' THEN '0' || substring(_e164 FROM 5)
    ELSE NULL
  END;

  UPDATE public.orders
    SET user_id = auth.uid()
    WHERE user_id IS NULL
      AND (customer_phone = _e164 OR (_legacy IS NOT NULL AND customer_phone = _legacy));

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

-- J.1: rate limit trigger — dual-format match, canonical E.164 storage
CREATE OR REPLACE FUNCTION public.check_order_rate_limit()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _e164 text;
  _legacy text;
  _store text;
BEGIN
  _e164 := public.normalize_phone_to_e164(NEW.customer_phone);
  _legacy := CASE
    WHEN _e164 LIKE '+966%' THEN '0' || substring(_e164 FROM 5)
    ELSE NULL
  END;
  _store := COALESCE(_e164, NEW.customer_phone);

  IF EXISTS (
    SELECT 1 FROM public.order_rate_limits
    WHERE (phone = _store OR (_legacy IS NOT NULL AND phone = _legacy) OR (_e164 IS NOT NULL AND phone = _e164))
      AND last_order_at > NOW() - INTERVAL '5 minutes'
  ) THEN
    RAISE EXCEPTION 'rate_limited: too many orders, wait 5 minutes'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.order_rate_limits (phone, last_order_at, count_24h)
  VALUES (_store, NOW(), 1)
  ON CONFLICT (phone) DO UPDATE
    SET last_order_at = NOW(),
        count_24h = public.order_rate_limits.count_24h + 1;

  RETURN NEW;
END;
$$;
