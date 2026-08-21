ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_management_enabled boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.products.stock_management_enabled IS
  'When true (default): D.2 auto-claims from subscription_inventory. When false: skip auto-claim, manual fulfillment + WhatsApp delivery only.';