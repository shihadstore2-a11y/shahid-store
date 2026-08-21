ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS subscription_username TEXT NULL,
  ADD COLUMN IF NOT EXISTS subscription_password TEXT NULL,
  ADD COLUMN IF NOT EXISTS subscription_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS subscription_extra_info JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS fulfilled_by UUID NULL REFERENCES public.admin_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS credentials_sent_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_orders_fulfilled
  ON public.orders(fulfilled_at DESC)
  WHERE fulfilled_at IS NOT NULL;