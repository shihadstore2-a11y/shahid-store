-- Fix JSON key mismatch in accounting COGS functions.
-- Order items store: product_slug, qty, unit_price (NOT slug/quantity/price).

CREATE OR REPLACE FUNCTION public.get_monthly_financials(_year integer, _month integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _start timestamptz;
  _end timestamptz;
  _revenue numeric := 0;
  _cogs numeric := 0;
  _fees numeric := 0;
  _refunds numeric := 0;
  _expenses numeric := 0;
  _orders_count int := 0;
  _gross_profit numeric;
  _net_profit numeric;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden: admin only' USING ERRCODE = '42501';
  END IF;

  _start := make_timestamptz(_year, _month, 1, 0, 0, 0, 'UTC');
  _end := _start + interval '1 month';

  SELECT COALESCE(SUM(total), 0), COUNT(*)
    INTO _revenue, _orders_count
    FROM public.orders
    WHERE is_test = false
      AND status IN ('paid', 'fulfilled')
      AND created_at >= _start AND created_at < _end;

  SELECT COALESCE(SUM(
    COALESCE((item->>'qty')::numeric, 1) *
    COALESCE(public.get_product_cost_at(item->>'product_slug', o.created_at), 0)
  ), 0)
  INTO _cogs
  FROM public.orders o, jsonb_array_elements(o.items) AS item
  WHERE o.is_test = false
    AND o.status IN ('paid', 'fulfilled')
    AND o.created_at >= _start AND o.created_at < _end
    AND item ? 'product_slug';

  SELECT COALESCE(SUM(pf.fee_amount), 0) INTO _fees
    FROM public.payment_fees pf
    JOIN public.orders o ON o.id = pf.order_id
    WHERE o.is_test = false
      AND o.created_at >= _start AND o.created_at < _end;

  SELECT COALESCE(SUM(r.amount), 0) INTO _refunds
    FROM public.refunds r
    JOIN public.orders o ON o.id = r.order_id
    WHERE o.is_test = false
      AND r.refunded_at >= _start AND r.refunded_at < _end;

  SELECT COALESCE(SUM(amount), 0) INTO _expenses
    FROM public.expenses
    WHERE expense_date >= _start::date AND expense_date < _end::date;

  _gross_profit := _revenue - _cogs;
  _net_profit := _gross_profit - _fees - _refunds - _expenses;

  RETURN jsonb_build_object(
    'year', _year,
    'month', _month,
    'period_start', _start,
    'period_end', _end,
    'orders_count', _orders_count,
    'revenue', _revenue,
    'cogs', _cogs,
    'gross_profit', _gross_profit,
    'fees', _fees,
    'refunds', _refunds,
    'expenses', _expenses,
    'net_profit', _net_profit,
    'gross_margin_pct', CASE WHEN _revenue > 0 THEN round((_gross_profit / _revenue) * 100, 2) ELSE 0 END,
    'net_margin_pct', CASE WHEN _revenue > 0 THEN round((_net_profit / _revenue) * 100, 2) ELSE 0 END
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_product_profitability(_from timestamp with time zone, _to timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _result jsonb;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden: admin only' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO _result
  FROM (
    SELECT
      item->>'product_slug' AS slug,
      COALESCE(item->>'product_name', item->>'product_slug') AS name,
      SUM(COALESCE((item->>'qty')::numeric, 1))::int AS units_sold,
      SUM(COALESCE((item->>'unit_price')::numeric, 0) * COALESCE((item->>'qty')::numeric, 1)) AS revenue,
      SUM(
        COALESCE((item->>'qty')::numeric, 1) *
        COALESCE(public.get_product_cost_at(item->>'product_slug', o.created_at), 0)
      ) AS cogs,
      SUM(COALESCE((item->>'unit_price')::numeric, 0) * COALESCE((item->>'qty')::numeric, 1))
        - SUM(
            COALESCE((item->>'qty')::numeric, 1) *
            COALESCE(public.get_product_cost_at(item->>'product_slug', o.created_at), 0)
          ) AS gross_profit
    FROM public.orders o, jsonb_array_elements(o.items) AS item
    WHERE o.is_test = false
      AND o.status IN ('paid', 'fulfilled')
      AND o.created_at >= _from AND o.created_at < _to
      AND item ? 'product_slug'
    GROUP BY item->>'product_slug', COALESCE(item->>'product_name', item->>'product_slug')
    ORDER BY revenue DESC
  ) t;

  RETURN _result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_kpi_dashboard(_from timestamp with time zone, _to timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _revenue numeric := 0;
  _cogs numeric := 0;
  _fees numeric := 0;
  _refunds numeric := 0;
  _expenses numeric := 0;
  _orders_count int := 0;
  _customers_count int := 0;
  _aov numeric := 0;
  _gross_profit numeric;
  _net_profit numeric;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden: admin only' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(SUM(total), 0), COUNT(*), COUNT(DISTINCT customer_phone)
    INTO _revenue, _orders_count, _customers_count
    FROM public.orders
    WHERE is_test = false
      AND status IN ('paid', 'fulfilled')
      AND created_at >= _from AND created_at < _to;

  SELECT COALESCE(SUM(
    COALESCE((item->>'qty')::numeric, 1) *
    COALESCE(public.get_product_cost_at(item->>'product_slug', o.created_at), 0)
  ), 0)
  INTO _cogs
  FROM public.orders o, jsonb_array_elements(o.items) AS item
  WHERE o.is_test = false
    AND o.status IN ('paid', 'fulfilled')
    AND o.created_at >= _from AND o.created_at < _to
    AND item ? 'product_slug';

  SELECT COALESCE(SUM(pf.fee_amount), 0) INTO _fees
    FROM public.payment_fees pf
    JOIN public.orders o ON o.id = pf.order_id
    WHERE o.is_test = false AND o.created_at >= _from AND o.created_at < _to;

  SELECT COALESCE(SUM(r.amount), 0) INTO _refunds
    FROM public.refunds r
    JOIN public.orders o ON o.id = r.order_id
    WHERE o.is_test = false AND r.refunded_at >= _from AND r.refunded_at < _to;

  SELECT COALESCE(SUM(amount), 0) INTO _expenses
    FROM public.expenses
    WHERE expense_date >= _from::date AND expense_date < _to::date;

  _gross_profit := _revenue - _cogs;
  _net_profit := _gross_profit - _fees - _refunds - _expenses;
  _aov := CASE WHEN _orders_count > 0 THEN _revenue / _orders_count ELSE 0 END;

  RETURN jsonb_build_object(
    'period', jsonb_build_object('from', _from, 'to', _to),
    'tier1', jsonb_build_object(
      'revenue', _revenue,
      'orders_count', _orders_count,
      'gross_profit', _gross_profit,
      'net_profit', _net_profit,
      'gross_margin_pct', CASE WHEN _revenue > 0 THEN round((_gross_profit / _revenue) * 100, 2) ELSE 0 END
    ),
    'tier2', jsonb_build_object(
      'cogs', _cogs,
      'fees', _fees,
      'refunds', _refunds,
      'expenses', _expenses,
      'customers_count', _customers_count,
      'aov', round(_aov, 2),
      'net_margin_pct', CASE WHEN _revenue > 0 THEN round((_net_profit / _revenue) * 100, 2) ELSE 0 END
    )
  );
END;
$function$;