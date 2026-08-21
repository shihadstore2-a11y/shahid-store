
-- ============================================
-- EXECUTE 1: Seed product_costs (12 rows, idempotent)
-- ============================================
INSERT INTO public.product_costs (product_slug, unit_cost, currency, effective_from, note)
SELECT p.slug, 0, 'SAR', now(), 'Initial seed — pending admin update'
FROM public.products p
WHERE p.is_active = true
  AND p.slug != 'edfa-test'
  AND NOT EXISTS (
    SELECT 1 FROM public.product_costs pc
    WHERE pc.product_slug = p.slug AND pc.effective_to IS NULL
  );

-- ============================================
-- EXECUTE 2: 6 Accounting RPCs
-- ============================================

-- RPC 1: get_product_cost_at(slug, at_time)
CREATE OR REPLACE FUNCTION public.get_product_cost_at(_slug text, _at timestamptz DEFAULT now())
RETURNS numeric
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT unit_cost
  FROM public.product_costs
  WHERE product_slug = _slug
    AND effective_from <= _at
    AND (effective_to IS NULL OR effective_to > _at)
  ORDER BY effective_from DESC
  LIMIT 1;
$$;

-- RPC 2: set_product_cost(slug, new_cost, note)
CREATE OR REPLACE FUNCTION public.set_product_cost(_slug text, _new_cost numeric, _note text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_id uuid;
  _uid uuid;
BEGIN
  _uid := auth.uid();
  IF NOT public.can_modify_data(_uid) THEN
    RAISE EXCEPTION 'forbidden: admin only' USING ERRCODE = '42501';
  END IF;
  IF _new_cost < 0 THEN
    RAISE EXCEPTION 'invalid: unit_cost must be >= 0' USING ERRCODE = '22023';
  END IF;

  -- Close the currently-active cost (if any)
  UPDATE public.product_costs
    SET effective_to = now(), updated_at = now()
    WHERE product_slug = _slug AND effective_to IS NULL;

  -- Insert new active cost
  INSERT INTO public.product_costs (product_slug, unit_cost, currency, effective_from, note, created_by)
  VALUES (_slug, _new_cost, 'SAR', now(), _note, _uid)
  RETURNING id INTO _new_id;

  PERFORM public.log_admin_action(
    'set_product_cost',
    'product_cost',
    _new_id,
    jsonb_build_object('slug', _slug, 'new_cost', _new_cost, 'note', _note)
  );

  RETURN _new_id;
END;
$$;

-- RPC 3: get_monthly_financials(year, month) → jsonb
CREATE OR REPLACE FUNCTION public.get_monthly_financials(_year int, _month int)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Revenue & order count (production only, paid/fulfilled)
  SELECT COALESCE(SUM(total), 0), COUNT(*)
    INTO _revenue, _orders_count
    FROM public.orders
    WHERE is_test = false
      AND status IN ('paid', 'fulfilled')
      AND created_at >= _start AND created_at < _end;

  -- COGS: sum across items of qty * cost_at(created_at)
  SELECT COALESCE(SUM(
    COALESCE((item->>'quantity')::numeric, 1) *
    COALESCE(public.get_product_cost_at(item->>'slug', o.created_at), 0)
  ), 0)
  INTO _cogs
  FROM public.orders o, jsonb_array_elements(o.items) AS item
  WHERE o.is_test = false
    AND o.status IN ('paid', 'fulfilled')
    AND o.created_at >= _start AND o.created_at < _end
    AND item ? 'slug';

  -- Payment fees
  SELECT COALESCE(SUM(pf.fee_amount), 0) INTO _fees
    FROM public.payment_fees pf
    JOIN public.orders o ON o.id = pf.order_id
    WHERE o.is_test = false
      AND o.created_at >= _start AND o.created_at < _end;

  -- Refunds
  SELECT COALESCE(SUM(r.amount), 0) INTO _refunds
    FROM public.refunds r
    JOIN public.orders o ON o.id = r.order_id
    WHERE o.is_test = false
      AND r.refunded_at >= _start AND r.refunded_at < _end;

  -- Expenses
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
$$;

-- RPC 4: get_kpi_dashboard(from, to) → jsonb (Tier 1+2)
CREATE OR REPLACE FUNCTION public.get_kpi_dashboard(_from timestamptz, _to timestamptz)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
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
    COALESCE((item->>'quantity')::numeric, 1) *
    COALESCE(public.get_product_cost_at(item->>'slug', o.created_at), 0)
  ), 0)
  INTO _cogs
  FROM public.orders o, jsonb_array_elements(o.items) AS item
  WHERE o.is_test = false
    AND o.status IN ('paid', 'fulfilled')
    AND o.created_at >= _from AND o.created_at < _to
    AND item ? 'slug';

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
$$;

-- RPC 5: get_product_profitability(from, to) → jsonb array
CREATE OR REPLACE FUNCTION public.get_product_profitability(_from timestamptz, _to timestamptz)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result jsonb;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden: admin only' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO _result
  FROM (
    SELECT
      item->>'slug' AS slug,
      COALESCE(item->>'name', item->>'slug') AS name,
      SUM(COALESCE((item->>'quantity')::numeric, 1))::int AS units_sold,
      SUM(COALESCE((item->>'price')::numeric, 0) * COALESCE((item->>'quantity')::numeric, 1)) AS revenue,
      SUM(
        COALESCE((item->>'quantity')::numeric, 1) *
        COALESCE(public.get_product_cost_at(item->>'slug', o.created_at), 0)
      ) AS cogs,
      SUM(COALESCE((item->>'price')::numeric, 0) * COALESCE((item->>'quantity')::numeric, 1))
        - SUM(
            COALESCE((item->>'quantity')::numeric, 1) *
            COALESCE(public.get_product_cost_at(item->>'slug', o.created_at), 0)
          ) AS gross_profit
    FROM public.orders o, jsonb_array_elements(o.items) AS item
    WHERE o.is_test = false
      AND o.status IN ('paid', 'fulfilled')
      AND o.created_at >= _from AND o.created_at < _to
      AND item ? 'slug'
    GROUP BY item->>'slug', COALESCE(item->>'name', item->>'slug')
    ORDER BY revenue DESC
  ) t;

  RETURN _result;
END;
$$;

-- RPC 6: close_financial_period(year, month)
CREATE OR REPLACE FUNCTION public.close_financial_period(_year int, _month int)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid;
  _snapshot jsonb;
  _period_id uuid;
BEGIN
  _uid := auth.uid();
  IF NOT public.is_super_admin(_uid) THEN
    RAISE EXCEPTION 'forbidden: super_admin only' USING ERRCODE = '42501';
  END IF;

  -- Prevent re-closing
  IF EXISTS (
    SELECT 1 FROM public.financial_periods
    WHERE year = _year AND month = _month AND status = 'locked'
  ) THEN
    RAISE EXCEPTION 'period already locked' USING ERRCODE = 'P0001';
  END IF;

  -- Build snapshot
  _snapshot := public.get_monthly_financials(_year, _month);

  -- Upsert
  INSERT INTO public.financial_periods (year, month, status, snapshot, closed_by, closed_at)
  VALUES (_year, _month, 'locked', _snapshot, _uid, now())
  ON CONFLICT (year, month) DO UPDATE
    SET status = 'locked',
        snapshot = EXCLUDED.snapshot,
        closed_by = EXCLUDED.closed_by,
        closed_at = EXCLUDED.closed_at,
        updated_at = now()
  RETURNING id INTO _period_id;

  PERFORM public.log_admin_action(
    'close_financial_period',
    'financial_period',
    _period_id,
    jsonb_build_object('year', _year, 'month', _month, 'snapshot', _snapshot)
  );

  RETURN _period_id;
END;
$$;

-- Ensure unique (year, month) for upsert in close_financial_period
CREATE UNIQUE INDEX IF NOT EXISTS financial_periods_year_month_uniq
  ON public.financial_periods (year, month);

-- Grant execute on all 6 RPCs to authenticated (admin check is inside)
GRANT EXECUTE ON FUNCTION public.get_product_cost_at(text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_product_cost(text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_financials(int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_kpi_dashboard(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_profitability(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_financial_period(int, int) TO authenticated;
