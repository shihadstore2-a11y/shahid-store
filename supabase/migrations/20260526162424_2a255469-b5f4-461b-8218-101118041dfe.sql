BEGIN;

CREATE TYPE subscription_provider AS ENUM ('falcon', 'smarters', 'hulk');
COMMENT ON TYPE subscription_provider IS 'IPTV subscription provider types. Universal regardless of backup policy.';

CREATE TABLE public.subscription_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider subscription_provider NOT NULL,
  username text NOT NULL CHECK (length(username) BETWEEN 1 AND 200),
  password text NOT NULL CHECK (length(password) BETWEEN 1 AND 200),
  url text CHECK (url IS NULL OR length(url) <= 500),
  extra_info jsonb DEFAULT '{}'::jsonb,
  duration_months int NOT NULL CHECK (duration_months > 0 AND duration_months <= 36),
  expires_at timestamptz,
  status text NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'reserved', 'claimed', 'expired', 'invalid')),
  claimed_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  claimed_role text CHECK (
    claimed_role IS NULL OR claimed_role IN ('primary', 'backup', 'single')
  ),
  cogs numeric(10,2) CHECK (cogs IS NULL OR cogs >= 0),
  cogs_currency text DEFAULT 'SAR',
  notes text CHECK (notes IS NULL OR length(notes) <= 500),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscription_inventory_claim_consistency CHECK (
    (status = 'available' AND claimed_order_id IS NULL AND claimed_role IS NULL AND claimed_at IS NULL) OR
    (status = 'reserved' AND claimed_role IS NULL) OR
    (status = 'claimed' AND claimed_order_id IS NOT NULL AND claimed_role IS NOT NULL AND claimed_at IS NOT NULL) OR
    (status IN ('expired', 'invalid'))
  )
);
COMMENT ON TABLE public.subscription_inventory IS 
  'Subscription credentials inventory. Universal schema, works with any backup policy. RPC+webhook deferred until owner backup decisions.';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_inventory TO authenticated;
GRANT ALL ON public.subscription_inventory TO service_role;
REVOKE ALL ON public.subscription_inventory FROM anon;

ALTER TABLE public.subscription_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscription_inventory_admin_read 
  ON public.subscription_inventory FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY subscription_inventory_admin_modify 
  ON public.subscription_inventory FOR ALL
  USING (can_modify_data(auth.uid()))
  WITH CHECK (can_modify_data(auth.uid()));

CREATE INDEX idx_inv_available 
  ON public.subscription_inventory(provider, duration_months, created_at) 
  WHERE status = 'available';

CREATE INDEX idx_inv_claimed_order 
  ON public.subscription_inventory(claimed_order_id) 
  WHERE claimed_order_id IS NOT NULL;

CREATE INDEX idx_inv_provider_status 
  ON public.subscription_inventory(provider, status);

CREATE INDEX idx_inv_expires 
  ON public.subscription_inventory(expires_at) 
  WHERE expires_at IS NOT NULL AND status IN ('available', 'reserved');

CREATE UNIQUE INDEX idx_inv_unique_credentials 
  ON public.subscription_inventory(provider, username);

CREATE TRIGGER set_updated_at_subscription_inventory
  BEFORE UPDATE ON public.subscription_inventory
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'primary_subscription_id'
  ) THEN
    ALTER TABLE public.orders 
      ADD COLUMN primary_subscription_id uuid 
        REFERENCES public.subscription_inventory(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'backup_subscription_id'
  ) THEN
    ALTER TABLE public.orders 
      ADD COLUMN backup_subscription_id uuid 
        REFERENCES public.subscription_inventory(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_primary_sub 
  ON public.orders(primary_subscription_id) 
  WHERE primary_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_backup_sub 
  ON public.orders(backup_subscription_id) 
  WHERE backup_subscription_id IS NOT NULL;

COMMIT;