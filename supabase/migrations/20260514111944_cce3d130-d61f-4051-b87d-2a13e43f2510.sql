
-- 1) Insert hulk-1m
INSERT INTO public.products (
  slug, category_id, name_ar, description, features, compatibility,
  base_price, sale_price, currency, image_urls, rating, sales_count,
  is_featured, is_bestseller, is_active, duration_months, sort_order,
  icon_key, gradient_key
)
SELECT
  'hulk-1m',
  c.id,
  'هولك بلاير — شهر واحد',
  'اشتراك هولك بلاير لمدة شهر واحد — تفعيل سريع وبث رياضي شامل بجودة عالية.',
  '["بث رياضي شامل","جودة HD/4K","تفعيل سريع","دعم فني سريع"]'::jsonb,
  '["Smart TV","Android","iOS","Windows","MAG"]'::jsonb,
  60, 40, 'SAR', '{}', 5.0, 820,
  false, true, true, 1, 1,
  'Mountain', 'hulk'
FROM public.categories c WHERE c.slug = 'hulk'
ON CONFLICT (slug) DO NOTHING;

-- 2) Unify titles + sales_count + bestseller + sort_order
UPDATE public.products SET name_ar = 'هولك بلاير — شهر واحد',     sales_count = 820, is_bestseller = true,  sort_order = 1 WHERE slug = 'hulk-1m';
UPDATE public.products SET name_ar = 'هولك بلاير — 3 أشهر',        sales_count = 510, is_bestseller = false, sort_order = 2 WHERE slug = 'hulk-3m';
UPDATE public.products SET name_ar = 'هولك بلاير — 6 أشهر',        sales_count = 320, is_bestseller = false, sort_order = 3 WHERE slug = 'hulk-6m';
UPDATE public.products SET name_ar = 'هولك بلاير — سنة كاملة',     sales_count = 210, is_bestseller = false, sort_order = 4 WHERE slug = 'hulk-1y';
UPDATE public.products SET name_ar = 'هولك بلاير — سنة | جهازان', sales_count = 135, is_bestseller = false, sort_order = 5 WHERE slug = 'hulk-1y-2dev';
