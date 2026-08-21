BEGIN;

-- 0. Drop dependent policy (will recreate after ALTER)
DROP POLICY IF EXISTS orders_anon_insert ON public.orders;

-- 1. orders precision standardization
ALTER TABLE public.orders 
  ALTER COLUMN total TYPE numeric(10,2),
  ALTER COLUMN subtotal TYPE numeric(10,2),
  ALTER COLUMN discount TYPE numeric(10,2),
  ALTER COLUMN vat TYPE numeric(10,2);

-- 1b. Recreate orders_anon_insert policy (identical to A.3 hardened version)
CREATE POLICY orders_anon_insert ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    (user_id IS NULL)
    AND (customer_name IS NOT NULL)
    AND (length(btrim(customer_name)) >= 2)
    AND (length(customer_name) <= 120)
    AND (customer_phone IS NOT NULL)
    AND (customer_phone ~ '^05[0-9]{8}$')
    AND (total > 0::numeric)
    AND (total <= 10000::numeric)
    AND (jsonb_typeof(items) = 'array')
    AND (jsonb_array_length(items) > 0)
    AND (jsonb_array_length(items) <= 20)
    AND (status = 'pending')
    AND (payment_method = ANY (ARRAY['whatsapp'::text, 'card'::text]))
  );

-- 2. product_costs
CREATE TABLE public.product_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug text NOT NULL,
  unit_cost numeric(10,2) NOT NULL CHECK (unit_cost >= 0),
  currency text NOT NULL DEFAULT 'SAR',
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to timestamptz NULL,
  note text NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT effective_period_valid CHECK (effective_to IS NULL OR effective_to > effective_from)
);
CREATE UNIQUE INDEX product_costs_active_unique ON public.product_costs(product_slug) WHERE effective_to IS NULL;
CREATE INDEX product_costs_slug_idx ON public.product_costs(product_slug);
CREATE INDEX product_costs_effective_idx ON public.product_costs(effective_from, effective_to);
CREATE TRIGGER set_updated_at_product_costs BEFORE UPDATE ON public.product_costs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
GRANT SELECT, INSERT, UPDATE ON public.product_costs TO authenticated;
GRANT ALL ON public.product_costs TO service_role;
ALTER TABLE public.product_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY product_costs_admin_read ON public.product_costs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY product_costs_admin_modify ON public.product_costs FOR ALL TO authenticated USING (public.can_modify_data(auth.uid())) WITH CHECK (public.can_modify_data(auth.uid()));

-- 3. expenses
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('marketing','tools','salaries','hosting','support','legal','other')),
  description text NOT NULL CHECK (length(description) BETWEEN 3 AND 500),
  amount numeric(10,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'SAR',
  expense_date date NOT NULL,
  receipt_url text NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX expenses_date_idx ON public.expenses(expense_date DESC);
CREATE INDEX expenses_category_idx ON public.expenses(category);
CREATE TRIGGER set_updated_at_expenses BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
GRANT SELECT, INSERT, UPDATE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY expenses_admin_read ON public.expenses FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY expenses_admin_modify ON public.expenses FOR ALL TO authenticated USING (public.can_modify_data(auth.uid())) WITH CHECK (public.can_modify_data(auth.uid()));

-- 4. refunds
CREATE TABLE public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  reason text NULL CHECK (reason IS NULL OR length(reason) <= 500),
  refunded_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX refunds_order_idx ON public.refunds(order_id);
CREATE INDEX refunds_refunded_at_idx ON public.refunds(refunded_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.refunds TO authenticated;
GRANT ALL ON public.refunds TO service_role;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY refunds_admin_read ON public.refunds FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY refunds_admin_modify ON public.refunds FOR ALL TO authenticated USING (public.can_modify_data(auth.uid())) WITH CHECK (public.can_modify_data(auth.uid()));

-- 5. payment_fees
CREATE TABLE public.payment_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_transaction_id uuid NULL REFERENCES public.payment_transactions(id),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  fee_amount numeric(10,2) NOT NULL CHECK (fee_amount >= 0),
  fee_percent numeric(5,4) NULL CHECK (fee_percent IS NULL OR (fee_percent >= 0 AND fee_percent <= 1)),
  provider text NOT NULL DEFAULT 'edfapay',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payment_fees_order_idx ON public.payment_fees(order_id);
CREATE INDEX payment_fees_provider_idx ON public.payment_fees(provider);
GRANT SELECT, INSERT, UPDATE ON public.payment_fees TO authenticated;
GRANT ALL ON public.payment_fees TO service_role;
ALTER TABLE public.payment_fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_fees_admin_read ON public.payment_fees FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY payment_fees_admin_modify ON public.payment_fees FOR ALL TO authenticated USING (public.can_modify_data(auth.uid())) WITH CHECK (public.can_modify_data(auth.uid()));

-- 6. financial_periods
CREATE TABLE public.financial_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year int NOT NULL CHECK (year BETWEEN 2024 AND 2100),
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','locked')),
  closed_at timestamptz NULL,
  closed_by uuid NULL REFERENCES auth.users(id),
  snapshot jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (year, month)
);
CREATE INDEX financial_periods_status_idx ON public.financial_periods(status);
CREATE TRIGGER set_updated_at_financial_periods BEFORE UPDATE ON public.financial_periods FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
GRANT SELECT, INSERT, UPDATE ON public.financial_periods TO authenticated;
GRANT ALL ON public.financial_periods TO service_role;
ALTER TABLE public.financial_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY financial_periods_admin_read ON public.financial_periods FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY financial_periods_admin_modify ON public.financial_periods FOR ALL TO authenticated USING (public.can_modify_data(auth.uid())) WITH CHECK (public.can_modify_data(auth.uid()));

-- 7. Locked period protection
CREATE OR REPLACE FUNCTION public.prevent_locked_period_modification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status = 'locked' THEN
    RAISE EXCEPTION 'Cannot modify locked financial period';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER protect_locked_periods BEFORE UPDATE ON public.financial_periods FOR EACH ROW WHEN (OLD.status = 'locked') EXECUTE FUNCTION public.prevent_locked_period_modification();

-- 8. orders_production VIEW (security_invoker honors caller's RLS on orders)
CREATE VIEW public.orders_production WITH (security_invoker = true) AS
  SELECT * FROM public.orders WHERE is_test = false;
COMMENT ON VIEW public.orders_production IS 'Production orders only (excludes is_test=true). Use in admin reports/KPIs.';
GRANT SELECT ON public.orders_production TO authenticated;
GRANT SELECT ON public.orders_production TO service_role;

-- 9. Revoke anon on all financial tables/view
REVOKE ALL ON public.product_costs FROM anon;
REVOKE ALL ON public.expenses FROM anon;
REVOKE ALL ON public.refunds FROM anon;
REVOKE ALL ON public.payment_fees FROM anon;
REVOKE ALL ON public.financial_periods FROM anon;
REVOKE ALL ON public.orders_production FROM anon;

COMMIT;