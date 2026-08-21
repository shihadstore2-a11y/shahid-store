-- 1) Replace INSERT policy with explicit constraints
DROP POLICY IF EXISTS orders_public_insert ON public.orders;
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;

CREATE POLICY orders_anon_insert ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    customer_name IS NOT NULL
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
  );

-- 2) Ensure RLS is on
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 3) Rate limit table
CREATE TABLE IF NOT EXISTS public.order_rate_limits (
  phone TEXT PRIMARY KEY,
  last_order_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  count_24h INTEGER NOT NULL DEFAULT 1
);

ALTER TABLE public.order_rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies: only the SECURITY DEFINER trigger touches it.

-- 4) Trigger function: rate-limit by phone (5-minute window)
CREATE OR REPLACE FUNCTION public.check_order_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.order_rate_limits
    WHERE phone = NEW.customer_phone
      AND last_order_at > NOW() - INTERVAL '5 minutes'
  ) THEN
    RAISE EXCEPTION 'rate_limited: too many orders, wait 5 minutes'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.order_rate_limits (phone, last_order_at, count_24h)
  VALUES (NEW.customer_phone, NOW(), 1)
  ON CONFLICT (phone) DO UPDATE
    SET last_order_at = NOW(),
        count_24h = public.order_rate_limits.count_24h + 1;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_order_rate_limit ON public.orders;
CREATE TRIGGER enforce_order_rate_limit
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.check_order_rate_limit();

-- 5) Safe read function for the success page (guests get limited fields by id)
CREATE OR REPLACE FUNCTION public.get_order_by_id(_id uuid)
RETURNS TABLE (
  id uuid,
  order_number text,
  customer_name text,
  customer_phone text,
  total numeric,
  status text,
  created_at timestamptz,
  items jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, order_number, customer_name, customer_phone, total, status, created_at, items
  FROM public.orders
  WHERE id = _id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_by_id(uuid) TO anon, authenticated;