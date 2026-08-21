
-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  compatibility JSONB NOT NULL DEFAULT '[]'::jsonb,
  base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(10,2),
  currency TEXT NOT NULL DEFAULT 'SAR',
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  rating NUMERIC(2,1) NOT NULL DEFAULT 5.0,
  sales_count INT NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_bestseller BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product Durations
CREATE TABLE public.product_durations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label_ar TEXT NOT NULL,
  months INT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  sale_price NUMERIC(10,2),
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Coupons
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_percent INT NOT NULL DEFAULT 0,
  valid_until TIMESTAMPTZ,
  applies_to_duration_min INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_durations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (true);
CREATE POLICY "product_durations_public_read" ON public.product_durations FOR SELECT USING (true);
CREATE POLICY "coupons_public_read_active" ON public.coupons FOR SELECT USING (is_active = true);

-- Indexes
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_bestseller ON public.products(is_bestseller) WHERE is_bestseller = true;
CREATE INDEX idx_durations_product ON public.product_durations(product_id);

-- Seed categories
INSERT INTO public.categories (slug, name_ar, description, sort_order) VALUES
  ('falcon', 'فالكون Falcon', 'باقات فالكون الأقوى في عالم البث الرقمي بجودة 4K واستقرار عالي.', 1),
  ('hulk', 'هولك Hulk', 'باقات هولك بسيرفرات قوية وأسعار منافسة لجميع الأجهزة.', 2),
  ('smarters', 'سمارترز برو Smarters Pro', 'تطبيق سمارترز برو الرسمي مع دعم كل الأجهزة الذكية.', 3),
  ('vulture', 'فولتشر Vulture', 'باقات فولتشر بمحتوى ضخم ودعم فني متواصل.', 4),
  ('annual-offers', 'العروض السنوية', 'أفضل العروض السنوية بأسعار خاصة وتوفير حتى 40%.', 5);

-- Seed products (placeholder data — to be replaced with real list)
INSERT INTO public.products (slug, category_id, name_ar, description, features, compatibility, base_price, sale_price, image_urls, rating, sales_count, is_bestseller, is_featured, sort_order) VALUES
  (
    'falcon-12m',
    (SELECT id FROM public.categories WHERE slug = 'falcon'),
    'اشتراك فالكون 12 شهر',
    'باقة فالكون السنوية بجودة عالية واستقرار ممتاز يدعم جميع الأجهزة.',
    '["+25,000 قناة عالمية","+150,000 فيلم ومسلسل","جودة 4K UHD","سيرفرات قوية مستقرة","تفعيل فوري خلال دقائق","دعم فني 24/7"]'::jsonb,
    '["Smart TV","Android TV","iOS / Apple TV","Windows / Mac","MAG / Formuler"]'::jsonb,
    320, 249, ARRAY['/placeholder.svg']::text[], 4.9, 1240, true, true, 1
  ),
  (
    'falcon-6m',
    (SELECT id FROM public.categories WHERE slug = 'falcon'),
    'اشتراك فالكون 6 أشهر',
    'باقة فالكون النصف سنوية بسعر مميز.',
    '["+25,000 قناة","+150,000 فيلم ومسلسل","جودة 4K","تفعيل فوري"]'::jsonb,
    '["Smart TV","Android TV","iOS","Windows"]'::jsonb,
    180, 149, ARRAY['/placeholder.svg']::text[], 4.8, 540, false, false, 2
  ),
  (
    'hulk-12m',
    (SELECT id FROM public.categories WHERE slug = 'hulk'),
    'اشتراك هولك 12 شهر',
    'باقة هولك السنوية بأفضل سعر في السوق.',
    '["+22,000 قناة","+120,000 فيلم ومسلسل","جودة Full HD","سيرفرات مستقرة","تفعيل فوري"]'::jsonb,
    '["Smart TV","Android","iOS","Windows"]'::jsonb,
    280, 199, ARRAY['/placeholder.svg']::text[], 4.8, 980, true, true, 1
  ),
  (
    'hulk-6m',
    (SELECT id FROM public.categories WHERE slug = 'hulk'),
    'اشتراك هولك 6 أشهر',
    'باقة هولك النصف سنوية.',
    '["+22,000 قناة","+120,000 فيلم","جودة Full HD"]'::jsonb,
    '["Smart TV","Android","iOS"]'::jsonb,
    150, 119, ARRAY['/placeholder.svg']::text[], 4.7, 410, false, false, 2
  ),
  (
    'smarters-12m',
    (SELECT id FROM public.categories WHERE slug = 'smarters'),
    'اشتراك سمارترز برو 12 شهر',
    'تطبيق سمارترز برو الرسمي مع كود تفعيل سنوي.',
    '["تطبيق رسمي مدفوع","يعمل على كل الأجهزة","واجهة عربية","تحديثات مستمرة"]'::jsonb,
    '["iOS","Android","Smart TV","Firestick"]'::jsonb,
    250, 189, ARRAY['/placeholder.svg']::text[], 4.9, 760, true, true, 1
  ),
  (
    'vulture-12m',
    (SELECT id FROM public.categories WHERE slug = 'vulture'),
    'اشتراك فولتشر 12 شهر',
    'باقة فولتشر السنوية بمحتوى متنوع وضخم.',
    '["+20,000 قناة","+100,000 فيلم","جودة 4K","دعم فني"]'::jsonb,
    '["Smart TV","Android","iOS","Windows"]'::jsonb,
    270, 209, ARRAY['/placeholder.svg']::text[], 4.7, 320, false, true, 1
  ),
  (
    'annual-mega-pack',
    (SELECT id FROM public.categories WHERE slug = 'annual-offers'),
    'الباقة السنوية الكبرى',
    'مزيج من أفضل الباقات بسعر خاص لمدة 12 شهر + 3 أشهر هدية.',
    '["3 باقات سنوية مجمعة","3 أشهر مجاناً","تفعيل فوري","ضمان استبدال 24 ساعة"]'::jsonb,
    '["كل الأجهزة"]'::jsonb,
    650, 449, ARRAY['/placeholder.svg']::text[], 5.0, 215, true, true, 1
  );

-- Seed durations
INSERT INTO public.product_durations (product_id, label_ar, months, price, sale_price, is_default, sort_order)
SELECT id, '3 أشهر', 3, ROUND(base_price * 0.4, 0), ROUND(COALESCE(sale_price, base_price) * 0.4, 0), false, 1 FROM public.products WHERE slug LIKE '%-12m';
INSERT INTO public.product_durations (product_id, label_ar, months, price, sale_price, is_default, sort_order)
SELECT id, '6 أشهر', 6, ROUND(base_price * 0.7, 0), ROUND(COALESCE(sale_price, base_price) * 0.7, 0), false, 2 FROM public.products WHERE slug LIKE '%-12m';
INSERT INTO public.product_durations (product_id, label_ar, months, price, sale_price, is_default, sort_order)
SELECT id, '12 شهر', 12, base_price, sale_price, true, 3 FROM public.products WHERE slug LIKE '%-12m';
INSERT INTO public.product_durations (product_id, label_ar, months, price, sale_price, is_default, sort_order)
SELECT id, '12 + 3 شهر هدية', 15, ROUND(base_price * 1.15, 0), ROUND(COALESCE(sale_price, base_price) * 1.10, 0), false, 4 FROM public.products WHERE slug LIKE '%-12m';

-- Seed coupon
INSERT INTO public.coupons (code, discount_percent, valid_until, applies_to_duration_min, is_active) VALUES
  ('SUMMER25', 15, '2026-07-19 23:59:59+03', 12, true);
