-- 1) جدول معاملات الدفع (EdfaPay)
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  order_number TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'edfapay',
  provider_order_id TEXT,        -- معرّف EdfaPay للمعاملة (id من الـ response)
  provider_trans_id TEXT,        -- trans_id من callback
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SAR',
  status TEXT NOT NULL DEFAULT 'initiated',
    -- initiated | redirected | success | failed | cancelled | refunded
  checkout_url TEXT,
  callback_payload JSONB,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_transactions_order_id ON public.payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_order_number ON public.payment_transactions(order_number);
CREATE INDEX idx_payment_transactions_provider_order_id ON public.payment_transactions(provider_order_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- المشرفون يقرؤون كل المعاملات
CREATE POLICY "payment_transactions_admin_read"
  ON public.payment_transactions FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- المالك يقرأ معاملات طلباته فقط
CREATE POLICY "payment_transactions_owner_read"
  ON public.payment_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = payment_transactions.order_id AND o.user_id = auth.uid()
    )
  );

-- لا INSERT/UPDATE/DELETE من المستخدمين (الـ webhook يستخدم service role)

-- trigger لتحديث updated_at
CREATE TRIGGER trg_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

-- 2) تحديث سياسة orders_anon_insert لتسمح بـ payment_method = 'card' بجانب 'whatsapp'
DROP POLICY IF EXISTS orders_anon_insert ON public.orders;

CREATE POLICY orders_anon_insert
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (customer_name IS NOT NULL)
    AND (length(btrim(customer_name)) >= 2)
    AND (length(customer_name) <= 120)
    AND (customer_phone IS NOT NULL)
    AND (customer_phone ~ '^05[0-9]{8}$'::text)
    AND (total > (0)::numeric)
    AND (total <= (10000)::numeric)
    AND (jsonb_typeof(items) = 'array'::text)
    AND (jsonb_array_length(items) > 0)
    AND (jsonb_array_length(items) <= 20)
    AND (status = 'pending'::text)
    AND (payment_method = ANY (ARRAY['whatsapp'::text, 'card'::text]))
  );

-- 3) دالة آمنة لجلب حالة دفعة عبر order_id (للعرض في صفحة نجاح/فشل)
CREATE OR REPLACE FUNCTION public.get_payment_status(_order_id UUID)
RETURNS TABLE (
  order_id UUID,
  order_number TEXT,
  status TEXT,
  amount NUMERIC,
  provider TEXT,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT order_id, order_number, status, amount, provider, updated_at
  FROM public.payment_transactions
  WHERE order_id = _order_id
  ORDER BY created_at DESC
  LIMIT 1;
$$;