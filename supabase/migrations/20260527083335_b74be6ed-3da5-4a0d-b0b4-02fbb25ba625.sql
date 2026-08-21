-- 1) Partial UNIQUE index on profiles.phone (case-insensitive + trim-safe)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique_idx
  ON public.profiles ((lower(btrim(phone))))
  WHERE phone IS NOT NULL AND btrim(phone) <> '';

-- 2) RPC: get_email_by_phone — normalizes input then looks up profiles.phone
CREATE OR REPLACE FUNCTION public.get_email_by_phone(_phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _normalized TEXT;
  _email TEXT;
BEGIN
  -- Strip whitespace, dashes, plus, parentheses
  _normalized := regexp_replace(COALESCE(_phone, ''), '[\s\-+()]', '', 'g');

  -- Convert international variants to local 05XXXXXXXX
  IF _normalized ~ '^00966[0-9]{9}$' THEN
    _normalized := '0' || substring(_normalized FROM 6);
  ELSIF _normalized ~ '^966[0-9]{9}$' THEN
    _normalized := '0' || substring(_normalized FROM 4);
  ELSIF _normalized ~ '^5[0-9]{8}$' THEN
    _normalized := '0' || _normalized;
  END IF;

  -- Verify final format: must be 05XXXXXXXX (10 digits)
  IF _normalized !~ '^05[0-9]{8}$' THEN
    RETURN NULL;
  END IF;

  -- Lookup
  SELECT email INTO _email
    FROM public.profiles
    WHERE phone = _normalized
    LIMIT 1;

  RETURN _email;
END;
$$;

-- 3) Permissions: anon + authenticated only (no PUBLIC)
REVOKE ALL ON FUNCTION public.get_email_by_phone(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_email_by_phone(TEXT) TO anon, authenticated;