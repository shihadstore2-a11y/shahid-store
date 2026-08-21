ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS icon_key text,
  ADD COLUMN IF NOT EXISTS gradient_key text;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS icon_key text,
  ADD COLUMN IF NOT EXISTS gradient_key text;

DELETE FROM public.product_durations;
DELETE FROM public.products;
DELETE FROM public.categories;