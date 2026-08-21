ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS duration_months integer;

CREATE INDEX IF NOT EXISTS idx_products_active_category
  ON public.products (category_id, is_active);